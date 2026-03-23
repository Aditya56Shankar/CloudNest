import { ApiError } from "../utils/ApiError.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_SUMMARY_MODELS = [
  "deepseek/deepseek-chat-v3-0324:free",
  "qwen/qwen3-30b-a3b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second
const ENABLE_LOCAL_SUMMARY_FALLBACK =
  process.env.ENABLE_LOCAL_SUMMARY_FALLBACK !== "false";

const parseModelList = (models) =>
  (models || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

const buildSummaryModelList = () => {
  const primaryModel = process.env.OPENROUTER_MODEL?.trim();
  const fallbackModels = parseModelList(process.env.OPENROUTER_FALLBACK_MODELS);

  return [...new Set([primaryModel, ...fallbackModels, ...DEFAULT_SUMMARY_MODELS].filter(Boolean))];
};

const isNoEndpointError = (message = "") => /no endpoints found for/i.test(message);

const buildLocalSummary = (text, reason = "") => {
  const normalizedText = (text || "").replace(/\s+/g, " ").trim();
  const extractedSkills = extractSkills(normalizedText);
  const predictedRole = classifyRole(extractedSkills);

  if (!normalizedText) {
    return {
      type: "local",
      fallbackReason: "No readable text found in document",
      content: "Summary unavailable: document did not contain readable text.",
      model: null,
      extractedSkills,
      predictedRole,
    };
  }

  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const selectedSentences = sentences.length > 0 ? sentences.slice(0, 6) : [normalizedText.slice(0, 900)];
  const summaryContent = selectedSentences.join(" ").slice(0, 1500);

  return {
    type: "local",
    fallbackReason: reason,
    content: summaryContent,
    model: null,
    extractedSkills,
    predictedRole,
  };
};

//how long to wait before retrying previous request
const getBackoffDelay = (attempt) => INITIAL_DELAY * Math.pow(2, attempt);

// Extract error code and message from various error structures
const extractErrorDetails = (error) => {
  let code;
  let message;
  let nestedError;

  // Priority 1: Check error.cause.rawValue.error (OpenRouter SDK validation error) 429 limit exceeded or 502 bad gateway
  if (error?.cause?.rawValue?.error) {
    nestedError = error.cause.rawValue.error;
    code = nestedError.code;
    message = nestedError.message;
  }

  // Priority 2: Check error.rawValue directly (for some OpenRouter SDK errors that don't wrap in cause)
  if (!nestedError && error?.rawValue?.error) {
    nestedError = error.rawValue.error;
    code = nestedError.code;
    message = nestedError.message;
  }

  // Priority 3: Check error.response api error response (for fetch errors)
  if (!nestedError && error?.response?.data?.error) {
    nestedError = error.response.data.error;
    code = nestedError.code;
    message = nestedError.message;
  }

  // Priority 4: Check direct error properties simple error like 404 not found or 502 bad gateway from fetch
  if (!code) code = error?.code || error?.statusCode;
  if (!message) message = error?.message;

  // Priority 5: Check cause message again if not found yet, as some libraries wrap errors in multiple layers
  if (!message && error?.cause) {
    message = error.cause.message;
    if (!code) code = error.cause.code || error.cause.statusCode;
  }

  // Priority 6: Last resort - check HTTP status
  if (!code) code = error?.status;

  return { code, message, nestedError };
};

// Determine if error is retryable
const isRetryableError = (error) => {
  // "Response validation failed" usually means API returned an error response
  // which is typically temporary/retryable
  if (error?.message?.includes("Response validation failed")) {
    return true;
  }

  // Check if it's a validation error with an underlying API error
  if (error?.cause?.rawValue?.error) {
    const nestedCode = error.cause.rawValue.error.code;
    if ([502, 503, 504, 408, 429].includes(nestedCode)) {
      return true;
    }
  }

  const { code } = extractErrorDetails(error);
  // 502, 503, 504 are temporary server errors
  return [502, 503, 504, 408, 429].includes(code);
};

// Sleep utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SKILL_DB = [
  "aws", "azure", "gcp",
  "docker", "kubernetes", "jenkins", "terraform",
  "java", "python", "c++", "react", "node", "spring",
  "sql", "excel", "power bi", "tableau", "pandas"
];

const extractSkills = (text) => {
  const lowerText = (text || "").toLowerCase();
  return SKILL_DB.filter(skill => lowerText.includes(skill));
};

// ---------------- ROLE CLASSIFICATION ----------------
const ROLE_MAP = {
  "Cloud Engineer": ["aws", "azure", "gcp"],
  "DevOps Engineer": ["docker", "kubernetes", "jenkins", "terraform"],
  "Software Developer": ["java", "python", "c++", "react", "node", "spring"],
  "Data Analyst": ["sql", "excel", "power bi", "tableau", "pandas"]
};

const classifyRole = (skills) => {
  let bestRole = "Unknown";
  let maxScore = 0;

  for (const role in ROLE_MAP) {
    let score = 0;

    for (const skill of ROLE_MAP[role]) {
      if (skills.includes(skill)) {
        score++;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestRole = role;
    }
  }

  return bestRole;
};

const inferRoleFromText = (text) => {
  const extractedSkills = extractSkills(text);
  const predictedRole = classifyRole(extractedSkills);
  return { extractedSkills, predictedRole };
};

export const summarizeWithOpenRouter = async (text) => {
  if (!OPENROUTER_API_KEY) {
    throw new ApiError(500, "OPENROUTER_API_KEY is not set in the server environment");
  }

  const summaryModels = buildSummaryModelList();
  let lastError;
  const modelAttemptLog = []; // Track which models were attempted and why they failed
  let sawRateLimitError = false; //for 429 errors limit exceeded
  let sawTemporaryServerError = false; //for 502, 503, 504 errors indicating temporary server issues

  const requestSummary = async (model) => {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },

      //Converts JS object → JSON string
      // This is the actual request sent to AI
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert resume profiler. Write concise professional summaries and infer likely job domain from evidence in the text.",
          },
          {
            role: "user",
            content: `From the following document, generate a professional summary.\n\nRequirements:\n1) Start with one line: DOMAIN: <best-fit role based on skills>.\n2) Then write a 4-6 line PROFESSIONAL SUMMARY in formal tone.\n3) Keep claims strictly grounded in the provided text.\n4) If evidence is weak, use DOMAIN: General Software/IT.\n\nDocument:\n${text}`,
          },
        ],
      }),
    });

    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const apiMessage = data?.error?.message || responseText;
      const requestError = new Error(apiMessage || `HTTP ${response.status}: ${response.statusText}`);
      requestError.statusCode = response.status;
      requestError.model = model;
      throw requestError;
    }

    if (!data?.choices?.[0]?.message?.content) {
      const emptyContentError = new Error("OpenRouter response missing summary content");
      emptyContentError.model = model;
      throw emptyContentError;
    }

    return data.choices[0].message.content;
  };

  for (const model of summaryModels) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const aiSummary = await requestSummary(model);
        const { extractedSkills, predictedRole } = inferRoleFromText(text);

        return {
          type: "ai",
          content: aiSummary,
          model: model,
          fallbackReason: null,
          extractedSkills,
          predictedRole,
        };

      } catch (error) {
        lastError = error;

        const { code: errorCode, message: errorMessage, nestedError } = extractErrorDetails(error);
        const retryable = isRetryableError(error);
        const noEndpoint = isNoEndpointError(errorMessage);

        console.error(`OpenRouter Error (${model}, Attempt ${attempt + 1}/${MAX_RETRIES}):`, {
          code: errorCode,
          message: errorMessage,
          isRetryable: retryable,
          nestedError,
          errorType: error?.constructor?.name,
        });

        // ❌ Model not available → skip to next model
        if (noEndpoint) {
          modelAttemptLog.push({ model, reason: errorMessage || "No endpoint" });
          break;
        }

        // ⚠️ Track rate limit
        if (errorCode === 429) {
          sawRateLimitError = true;
        }

        // ⚠️ Track server issues
        if ([502, 503, 504].includes(errorCode)) {
          sawTemporaryServerError = true;
        }

        // ❌ Stop retrying this model
        if (!retryable || attempt === MAX_RETRIES - 1) {
          modelAttemptLog.push({ model, reason: errorMessage || "Request failed" });
          break;
        }

        // 🔁 Retry with exponential backoff
        const delay = getBackoffDelay(attempt);
        console.log(`Retrying ${model} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  const allNoEndpoint =
    modelAttemptLog.length > 0 &&
    modelAttemptLog.every(({ reason }) => isNoEndpointError(reason));

  if (allNoEndpoint) {
    if (ENABLE_LOCAL_SUMMARY_FALLBACK) {
      return buildLocalSummary(text, "OpenRouter endpoint unavailable");
    }

    throw new ApiError(
      503,
      "No active OpenRouter endpoints found for configured models. Set OPENROUTER_MODEL or OPENROUTER_FALLBACK_MODELS in server/.env to available models."
    );
  }

  if (sawRateLimitError) {
    if (ENABLE_LOCAL_SUMMARY_FALLBACK) {
      return buildLocalSummary(text, "OpenRouter rate limit");
    }

    throw new ApiError(429, "OpenRouter API rate limited - please try again later");
  }

  if (sawTemporaryServerError) {
    throw new ApiError(503, "OpenRouter service temporarily unavailable. Please try again later.");
  }

  const { code: finalCode, message: finalMessage, nestedError } = extractErrorDetails(lastError);

  if (finalCode === 502) {
    throw new ApiError(
      503,
      `OpenRouter service temporarily unavailable: ${finalMessage || "Network connection lost"}`
    );
  }

  if (finalCode === 429) {
    throw new ApiError(429, "OpenRouter API rate limited - please try again later");
  }

  if (finalMessage?.includes("Response validation failed")) {
    const nestedMsg = nestedError?.message || "Invalid API response";
    throw new ApiError(503, `OpenRouter service error: ${nestedMsg}. Please try again later.`);
  }

  if (finalMessage) {
    throw new ApiError(500, `OpenRouter error: ${finalMessage}`);
  }

  throw new ApiError(500, "OpenRouter summarization failed");
};

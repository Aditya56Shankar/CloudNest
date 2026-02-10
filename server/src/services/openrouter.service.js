import { OpenRouter } from "@openrouter/sdk";
import { ApiError } from "../utils/ApiError.js";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

// Exponential backoff delay
const getBackoffDelay = (attempt) => INITIAL_DELAY * Math.pow(2, attempt);

// Extract error code and message from various error structures
const extractErrorDetails = (error) => {
  let code;
  let message;
  let nestedError;

  // Priority 1: Check error.cause.rawValue.error (OpenRouter SDK validation error)
  if (error?.cause?.rawValue?.error) {
    nestedError = error.cause.rawValue.error;
    code = nestedError.code;
    message = nestedError.message;
  }

  // Priority 2: Check error.rawValue directly
  if (!nestedError && error?.rawValue?.error) {
    nestedError = error.rawValue.error;
    code = nestedError.code;
    message = nestedError.message;
  }

  // Priority 3: Check error.response
  if (!nestedError && error?.response?.data?.error) {
    nestedError = error.response.data.error;
    code = nestedError.code;
    message = nestedError.message;
  }

  // Priority 4: Check direct error properties
  if (!code) code = error?.code || error?.statusCode;
  if (!message) message = error?.message;

  // Priority 5: Check cause message
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

export const summarizeWithOpenRouter = async (text) => {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await openrouter.chat.send({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "system",
            content: "You are an expert at summarizing PDF documents clearly and concisely.",
          },
          {
            role: "user",
            content: `Summarize the following document:\n\n${text}`,
          },
        ],
      });

      return completion.choices[0].message.content;
    } catch (error) {
      lastError = error;
      const { code: errorCode, message: errorMessage, nestedError } = extractErrorDetails(error);

      // Log raw details for debugging
      console.error(`OpenRouter Error (Attempt ${attempt + 1}/${MAX_RETRIES}):`, {
        code: errorCode,
        message: errorMessage,
        isRetryable: isRetryableError(error),
        nestedError: nestedError,
        errorType: error?.constructor?.name,
      });

      // If not retryable or last attempt, throw error
      if (!isRetryableError(error) || attempt === MAX_RETRIES - 1) {
        if (errorCode === 502) {
          throw new ApiError(
            503,
            `OpenRouter service temporarily unavailable: ${errorMessage || "Network connection lost"}`
          );
        } else if (errorCode === 429) {
          throw new ApiError(429, "OpenRouter API rate limited - please try again later");
        } else if (errorMessage?.includes("Response validation failed")) {
          // Extract nested error if available
          const nestedMsg = nestedError?.message || "Invalid API response";
          throw new ApiError(
            503,
            `OpenRouter service error: ${nestedMsg}. Please try again later.`
          );
        } else if (errorMessage) {
          throw new ApiError(500, `OpenRouter error: ${errorMessage}`);
        } else {
          throw new ApiError(500, "OpenRouter summarization failed");
        }
      }

      // Wait before retrying
      const delay = getBackoffDelay(attempt);
      console.log(`Retrying after ${delay}ms...`);
      await sleep(delay);
    }
  }

  // Fallback (should not reach here)
  throw lastError || new ApiError(500, "OpenRouter summarization failed");
};

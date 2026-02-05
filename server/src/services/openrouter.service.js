import { OpenRouter } from "@openrouter/sdk";
import { ApiError } from "../utils/ApiError.js";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const summarizeWithOpenRouter = async (text) => {
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
    console.error("OpenRouter Error:", error);
    throw new ApiError(500, "OpenRouter summarization failed");
  }
};

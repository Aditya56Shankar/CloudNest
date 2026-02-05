import axios from "axios";
import { ApiError } from "../utils/ApiError.js";

export const summarizeWithDeepSeek = async (text) => {
  // 🔧 DEVELOPMENT MODE: Mock summarization if no API key or for testing
  if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === "") {
    return `📄 Mock Summary (DEV MODE)\n\nThis is a mock summary of the PDF content. The document appears to contain ${text.length} characters of text. To enable real AI summarization, add your DeepSeek API key to the .env file.\n\nFirst 200 characters of content:\n${text.substring(0, 200)}...`;
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert at summarizing PDF documents clearly and concisely."
          },
          {
            role: "user",
            content: `Summarize the following document:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek Error:", error?.response?.data || error.message);
    
    // Handle specific DeepSeek errors
    const errorMessage = error?.response?.data?.error?.message;
    if (errorMessage === "Insufficient Balance") {
      throw new ApiError(402, "DeepSeek API has insufficient balance. Please add credits at https://platform.deepseek.com/");
    }
    
    throw new ApiError(500, `DeepSeek summarization failed: ${errorMessage || error.message}`);
  }
};

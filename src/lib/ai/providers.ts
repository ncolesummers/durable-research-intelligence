import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Language model provider definitions for Ollama and Google Gemini.
 */

/**
 * Configure Ollama through the OpenAI-compatible interface for local inference.
 */
export const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: undefined, // Not required for local Ollama
  includeUsage: true, // Include usage information in responses
});

/**
 * Provider used as a cloud fallback when Ollama is unavailable.
 */
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

/**
 * Identifiers for the primary decomposition, synthesis, and fallback models.
 */
export const MODELS = {
  decomposition: "deepseek-r1",
  synthesis: "qwen3",
  fallback: "gemini-2.5-flash",
} as const;

/**
 * Retrieve the configured decomposition model (DeepSeek-R1).
 *
 * @returns A language model instance ready for use with the AI SDK.
 */
export function getDecompositionModel() {
  return ollama(`${MODELS.decomposition}:latest`);
}

/**
 * Retrieve the configured synthesis model (Qwen3).
 *
 * @returns A language model instance ready for use with the AI SDK.
 */
export function getSynthesisModel() {
  return ollama(`${MODELS.synthesis}:latest`);
}

/**
 * Retrieve the fallback model (Gemini 2.5 Flash) hosted by Google.
 *
 * @throws Error when the Google API key environment variable is missing.
 * @returns A language model instance ready for use with the AI SDK.
 */
export function getFallbackModel() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is required for fallback model",
    );
  }
  return google(`models/${MODELS.fallback}`);
}

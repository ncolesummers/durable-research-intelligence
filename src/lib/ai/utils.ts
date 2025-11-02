/**
 * Shared language model helpers that wrap the AI SDK with fallback behaviour.
 */

import type { ModelMessage } from "ai";
import { generateText } from "ai";
import { getFallbackModel, MODELS, ollama } from "./providers";

/**
 * Generate text while preferring Ollama and falling back to Gemini when needed.
 *
 * @param prompt - Prompt string or array of structured messages for the model.
 * @param modelName - Logical model identifier determining which Ollama model to call.
 * @param options - Optional generation controls such as temperature and topP.
 * @returns The generated text, token usage, and metadata about the provider.
 */
export async function generateTextWithFallback(
  prompt: string | ModelMessage[],
  modelName: "decomposition" | "synthesis",
  options?: {
    temperature?: number;
    topP?: number;
  },
) {
  const isMessageArray = Array.isArray(prompt);
  const messages = isMessageArray
    ? prompt
    : [{ role: "user" as const, content: prompt }];

  // Try Ollama first
  try {
    const model =
      modelName === "decomposition"
        ? ollama(`${MODELS.decomposition}:latest`)
        : ollama(`${MODELS.synthesis}:latest`);

    const generateOptions: Parameters<typeof generateText>[0] = {
      model,
      messages,
      temperature: options?.temperature,
      topP: options?.topP,
    };

    const result = await generateText(generateOptions);

    return {
      text: result.text,
      usage: normalizeUsage(result.usage),
      model: `${MODELS[modelName]}:latest`,
      provider: "ollama" as const,
    };
  } catch (error) {
    // If Ollama fails, try Gemini fallback
    console.warn(
      `Ollama ${MODELS[modelName]} failed, falling back to Gemini:`,
      error,
    );

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error(
        `Ollama failed and GOOGLE_GENERATIVE_AI_API_KEY is not set. Original error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const fallbackModel = getFallbackModel();
      const generateOptions: Parameters<typeof generateText>[0] = {
        model: fallbackModel,
        messages,
        temperature: options?.temperature,
        topP: options?.topP,
      };

      const result = await generateText(generateOptions);

      return {
        text: result.text,
        usage: normalizeUsage(result.usage),
        model: MODELS.fallback,
        provider: "google" as const,
      };
    } catch (fallbackError) {
      throw new Error(
        `Both Ollama and Gemini fallback failed. Ollama error: ${error instanceof Error ? error.message : String(error)}. Gemini error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      );
    }
  }
}

/**
 * Token usage statistics returned by language model calls.
 */
export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Standardised language model response payload used throughout the app.
 */
export interface LLMResponse {
  text: string;
  usage: LLMUsage;
  model: string;
  provider: "ollama" | "google";
}

type GenerateTextResult = Awaited<ReturnType<typeof generateText>>;

function normalizeUsage(rawUsage: GenerateTextResult["usage"]): LLMUsage {
  type UsageRecord = Partial<
    Record<
      "promptTokens" | "completionTokens" | "inputTokens" | "outputTokens" | "totalTokens",
      number
    >
  >;

  const usage = (rawUsage ?? {}) as UsageRecord;

  const promptTokens = usage.promptTokens ?? usage.inputTokens ?? 0;
  const completionTokens = usage.completionTokens ?? usage.outputTokens ?? 0;
  const totalTokens = usage.totalTokens ?? promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

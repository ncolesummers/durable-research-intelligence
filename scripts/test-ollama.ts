#!/usr/bin/env bun
/**
 * CLI utility for verifying local Ollama and Gemini fallback connectivity.
 * Usage: bun scripts/test-ollama.ts
 */

import { generateText } from "ai";
import {
  getDecompositionModel,
  getSynthesisModel,
} from "../src/lib/ai/providers";
import { generateTextWithFallback } from "../src/lib/ai/utils";

/**
 * Exercise the decomposition, synthesis, and fallback models to ensure they respond.
 */
async function testOllamaConnection() {
  console.log("Testing Ollama connection...\n");

  const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  console.log(`Ollama Base URL: ${baseURL}`);

  // Test 1: Check if Ollama is reachable
  console.log("\n1. Testing DeepSeek-R1 model...");
  try {
    const model = getDecompositionModel();
    const result = await generateText({
      model,
      messages: [
        { role: "user", content: 'Say "Hello, World!" in JSON format.' },
      ],
    });

    console.log("✅ DeepSeek-R1 works!");
    console.log(`Response: ${result.text.substring(0, 100)}...`);
    console.log(`Usage: ${result.usage?.totalTokens ?? 0} tokens`);
  } catch (error) {
    console.error(
      "❌ DeepSeek-R1 failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Test 2: Test Qwen3 model
  console.log("\n2. Testing Qwen3 model...");
  try {
    const model = getSynthesisModel();
    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content:
            "Summarize in one sentence: TypeScript is a programming language.",
        },
      ],
    });

    console.log("✅ Qwen3 works!");
    console.log(`Response: ${result.text.substring(0, 100)}...`);
    console.log(`Usage: ${result.usage?.totalTokens ?? 0} tokens`);
  } catch (error) {
    console.error(
      "❌ Qwen3 failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Test 3: Test fallback function
  console.log("\n3. Testing fallback function...");
  try {
    const result = await generateTextWithFallback(
      'Say "Fallback test" in JSON format.',
      "decomposition",
    );

    console.log("✅ Fallback function works!");
    console.log(`Provider: ${result.provider}`);
    console.log(`Model: ${result.model}`);
    console.log(`Response: ${result.text.substring(0, 100)}...`);
    console.log(`Usage: ${result.usage.totalTokens} tokens`);
  } catch (error) {
    console.error(
      "❌ Fallback function failed:",
      error instanceof Error ? error.message : String(error),
    );
    console.log(
      "\nNote: If Ollama is unavailable, this will attempt to use Gemini fallback.",
    );
    console.log(
      "Make sure GOOGLE_GENERATIVE_AI_API_KEY is set for fallback to work.",
    );
  }

  console.log("\n✅ Ollama tests complete!");
}

testOllamaConnection().catch(console.error);

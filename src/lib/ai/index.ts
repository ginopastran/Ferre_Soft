import { openai } from "@ai-sdk/openai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { groq } from "@ai-sdk/groq";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

const deepseek = createDeepSeek({
  baseURL: "http://26.22.96.49:1234/v1",
  apiKey: "dummy", // LM Studio doesn't require a real API key
});

export const customModel = (apiIdentifier: string) => {
  if (apiIdentifier === "deepseek") {
    try {
      return wrapLanguageModel({
        model: deepseek("deepseek-chat"),
        middleware: customMiddleware,
      });
    } catch (error) {
      console.error("Failed to connect to DeepSeek:", error);
      // Fallback to default model
      return wrapLanguageModel({
        model: openai("gpt-4o-mini"),
        middleware: customMiddleware,
      });
    }
  }

  if (apiIdentifier === "groq-deepseek") {
    return wrapLanguageModel({
      model: groq("deepseek-r1-distill-llama-70b"),
      middleware: customMiddleware,
    });
  }

  return wrapLanguageModel({
    model: openai(apiIdentifier),
    middleware: customMiddleware,
  });
};

export const imageGenerationModel = openai.image("dall-e-3");

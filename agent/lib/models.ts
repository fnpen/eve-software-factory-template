import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel } from "ai";
import { defineDynamic } from "eve";
import { requireEnv } from "./constants.js";

// Resolve credentials and session headers at runtime, not into the compiled manifest.
// Both aliases must be configured on LiteLLM; there is no Vercel Gateway fallback.
export const createFactoryModel = (modelId: string, sessionId: string) => {
  const provider = createOpenAICompatible({
    apiKey: requireEnv("LITELLM_API_KEY", "your-litellm-virtual-key"),
    baseURL: requireEnv("LITELLM_BASE_URL", "https://your-litellm.example/v1"),
    fetch: (url, init) => {
      // AI SDK call-level headers can replace provider-level identity headers.
      const headers = new Headers(init?.headers);
      headers.set("User-Agent", "foreman/0.0.0");
      headers.set("x-opencode-session", sessionId);
      return fetch(url, { ...init, headers });
    },
    includeUsage: true,
    name: "litellm",
    supportsStructuredOutputs: true,
  });
  return wrapLanguageModel({
    middleware: {
      specificationVersion: "v4",
      transformParams: ({ params }) => {
        if (
          !params.tools?.some(
            (tool) =>
              tool.type === "function" &&
              (tool.strict === undefined || tool.strict === null)
          )
        ) {
          return Promise.resolve(params);
        }
        // LiteLLM's Responses bridge can turn an omitted strict into null.
        // Default to non-strict without changing explicitly strict tools.
        return Promise.resolve({
          ...params,
          tools: params.tools.map((tool) =>
            tool.type === "function" &&
            (tool.strict === undefined || tool.strict === null)
              ? { ...tool, strict: false }
              : tool
          ),
        });
      },
    },
    model: provider(modelId),
  });
};

export const MODEL_IDS = {
  analyst: "gpt-6-astra",
  classifier: "gpt-6-astra",
  implementer: "gpt-6-astra",
  orchestrator: "gpt-6-astra",
  researcher: "gpt-6-astra",
  reviewer: "kimi-k3",
} as const;

const proxyModel = (modelId: string, modelContextWindowTokens: number) =>
  defineDynamic({
    events: {
      "step.started": (_event, ctx) => ({
        model: createFactoryModel(modelId, ctx.session.id),
        modelContextWindowTokens,
      }),
    },
  });

// Both runtimes read the same per-role assignments; each agent.ts sets reasoning.
export const MODELS = {
  analyst: proxyModel(MODEL_IDS.analyst, 1_050_000),
  classifier: proxyModel(MODEL_IDS.classifier, 1_050_000),
  implementer: proxyModel(MODEL_IDS.implementer, 1_050_000),
  orchestrator: proxyModel(MODEL_IDS.orchestrator, 1_050_000),
  researcher: proxyModel(MODEL_IDS.researcher, 1_050_000),
  reviewer: proxyModel(MODEL_IDS.reviewer, 1_048_576),
} as const;

export type FactoryAgent = keyof typeof MODELS;

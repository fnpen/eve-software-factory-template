import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel } from "ai";
import { defineDynamic } from "eve";
import { requireEnv } from "./constants.js";

// Resolve credentials and session headers at runtime, not into the compiled manifest.
// Both aliases must be configured on LiteLLM; there is no Vercel Gateway fallback.
const proxyModel = (modelId: string, modelContextWindowTokens: number) =>
  defineDynamic({
    events: {
      "step.started": (_event, ctx) => {
        const provider = createOpenAICompatible({
          apiKey: requireEnv("LITELLM_API_KEY", "your-litellm-virtual-key"),
          baseURL: requireEnv(
            "LITELLM_BASE_URL",
            "https://your-litellm.example/v1"
          ),
          fetch: (url, init) => {
            // AI SDK call-level headers can replace provider-level identity headers.
            const headers = new Headers(init?.headers);
            headers.set("User-Agent", "foreman/0.0.0");
            headers.set("x-opencode-session", ctx.session.id);
            return fetch(url, { ...init, headers });
          },
          includeUsage: true,
          name: "litellm",
          supportsStructuredOutputs: true,
        });
        return {
          model: wrapLanguageModel({
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
          }),
          modelContextWindowTokens,
        };
      },
    },
  });

const astra = proxyModel("gpt-6-astra", 1_050_000);
const kimi = proxyModel("kimi-k3", 1_048_576);

// Model assignments stay centralized; each agent.ts sets its own reasoning effort.
export const MODELS = {
  analyst: astra,
  classifier: astra,
  implementer: astra,
  orchestrator: astra,
  researcher: astra,
  reviewer: kimi, // Different vendor from the implementer keeps review independent.
} as const;

export type FactoryAgent = keyof typeof MODELS;

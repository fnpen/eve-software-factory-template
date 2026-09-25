import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const baseURL = process.env.LITELLM_BASE_URL;
if (!baseURL) {
  throw new Error("LITELLM_BASE_URL is required");
}

export const litellm = createOpenAICompatible({
  baseURL,
  fetch: (url, init) => {
    // Resolve credentials at request time so provider metadata contains no secret.
    const apiKey = process.env.LITELLM_API_KEY;
    if (!apiKey) {
      throw new Error("LITELLM_API_KEY is required");
    }
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${apiKey}`);
    return fetch(url, { ...init, headers });
  },
  includeUsage: true,
  name: "litellm",
  supportsStructuredOutputs: true,
});

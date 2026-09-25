import { generateText } from "ai";
import { litellm } from "./agent/lib/litellm.js";

const { text } = await generateText({
  model: litellm("gpt-6-astra"),
  prompt:
    "Write a one-sentence greeting from an AI-powered Node.js application.",
});

console.log(text);

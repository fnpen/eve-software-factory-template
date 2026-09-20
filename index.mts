import { generateText } from "ai";

const { text } = await generateText({
  model: "openai/gpt-5.6-sol",
  prompt: "Write a one-sentence greeting from an AI-powered Node.js application.",
});

console.log(text);

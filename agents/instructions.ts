import { readFile } from "node:fs/promises";
import type { Station } from "./registry.js";

// eve resolves this at build time; A2A reads the same traced Markdown at runtime.
export const readStationInstructions = (role: Station): Promise<string> =>
  readFile(`${process.cwd()}/agents/${role}/instructions.md`, "utf8");

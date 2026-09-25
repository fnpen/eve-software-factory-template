import { readdir, readFile } from "node:fs/promises";
import { defineSkill } from "eve/skills";

// Build-time adapter for the repository's Markdown skill packages. No runtime I/O.
export const loadForemanSkill = async (
  name: "github-linear-bridging" | "triaging-issues" | "writing-quality"
) => {
  const root = `${process.cwd()}/agents/foreman/skills/${name}`;
  const source = await readFile(`${root}/SKILL.md`, "utf8");
  const lines = source.split("\n");
  const end = lines.indexOf("---", 1);
  const description = lines
    .slice(1, end)
    .find((line) => line.startsWith("description: "));
  if (lines[0] !== "---" || end < 0 || !description) {
    throw new Error(
      `Skill ${name} must have a description in its frontmatter.`
    );
  }
  // These packages use a JSON-quoted description, not arbitrary YAML.
  const parsed: unknown = JSON.parse(description.slice("description: ".length));
  if (typeof parsed !== "string" || !parsed.trim()) {
    throw new Error(`Skill ${name} must have a nonempty description.`);
  }
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name !== "SKILL.md")
      .map(async (entry) => {
        const path = `${entry.parentPath}/${entry.name}`;
        return [
          path.slice(root.length + 1),
          await readFile(path, "utf8"),
        ] as const;
      })
  );
  return defineSkill({
    description: parsed,
    files: Object.fromEntries(files),
    markdown: lines.slice(end + 1).join("\n"),
  });
};

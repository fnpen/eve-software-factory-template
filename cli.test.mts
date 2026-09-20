import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(new URL("./index.mts", import.meta.url));

for (const [name, command] of [
  ["Node.js", process.execPath],
  ["Bun", "bun"],
] as const) {
  test(`${name} prints the greeting without credentials`, () => {
    const result = spawnSync(command, [entry], {
      encoding: "utf8",
      env: { PATH: process.env.PATH },
      timeout: 5000,
    });

    assert.equal(
      result.error,
      undefined,
      `${name} must be installed and executable: ${result.error?.message ?? ""}`
    );
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "Hello, world!\n");
    assert.equal(result.stderr, "");
  });
}

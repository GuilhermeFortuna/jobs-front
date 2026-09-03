import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const HEX = /#[0-9a-fA-F]{3,8}\b/;

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe("design tokens", () => {
  it("keeps hex literals only inside globals.css token definitions", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC_ROOT)) {
      if (file.endsWith(`${path.sep}globals.css`)) continue;
      const text = fs.readFileSync(file, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (HEX.test(line)) {
          offenders.push(`${path.relative(SRC_ROOT, file)}:${index + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});

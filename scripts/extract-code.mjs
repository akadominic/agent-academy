#!/usr/bin/env node
/**
 * Extracts "// #region name" ... "// #endregion name" blocks from the app's
 * real source so lessons can show the EXACT code that runs ("Show Me the Code").
 * Output: src/generated/code-regions.json (regenerated before dev, build and test).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const dirs = ["src/engine", "src/server", "src/app/api", "src/capstone"];
const out = {};

function walk(dir) {
  let entries = [];
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) scan(p);
  }
}

function scan(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  const open = [];
  lines.forEach((line, i) => {
    const start = line.match(/\/\/\s*#region\s+([\w-]+)/);
    const end = line.match(/\/\/\s*#endregion\s+([\w-]+)/);
    if (start) open.push({ name: start[1], from: i + 1 });
    else if (end) {
      const idx = open.findLastIndex((o) => o.name === end[1]);
      if (idx === -1) return;
      const { name, from } = open.splice(idx, 1)[0];
      const body = lines.slice(from, i).filter((l) => !/\/\/\s*#(end)?region/.test(l));
      // Remove common indentation so snippets read cleanly.
      const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
      if (out[name]) throw new Error(`Duplicate region "${name}" in ${file}`);
      out[name] = {
        file: relative(root, file),
        startLine: from + 1,
        code: body.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join("\n"),
      };
    }
  });
}

for (const d of dirs) walk(join(root, d));
mkdirSync(join(root, "src/generated"), { recursive: true });
writeFileSync(join(root, "src/generated/code-regions.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`extract-code: ${Object.keys(out).length} regions`);

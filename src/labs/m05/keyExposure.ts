/**
 * Pure logic for the "key-exposure" lab: the fix-it challenge checks and the
 * illustrative cost of a stolen key.
 */

export const SIM_KEY = "sk-sim-live-4Rt9Wq2Lx7Bn3Kd8";

export interface Choice {
  id: string;
  text: string;
  correct: boolean;
  why: string;
}

export const PLACEMENT_CHOICES: Choice[] = [
  {
    id: "keep",
    text: "Keep it in app/page.tsx. It is my code; visitors will not go looking.",
    correct: false,
    why: "Everything in a browser page is sent to every visitor. Anyone can open DevTools and read it, and automated bots do look.",
  },
  {
    id: "public-env",
    text: "Put it in .env.local as NEXT_PUBLIC_MODEL_API_KEY and read it in app/page.tsx.",
    correct: false,
    why: "The NEXT_PUBLIC_ prefix tells Next.js to copy the value INTO the JavaScript sent to the browser. The key is still public.",
  },
  {
    id: "obfuscate",
    text: "Scramble it (for example base64) and unscramble it in the browser before calling.",
    correct: false,
    why: "The browser must unscramble it to use it, so the attacker's browser can too. Hiding is not the same as protecting.",
  },
  {
    id: "server-env",
    text: "Put it in .env.local as MODEL_API_KEY and read process.env.MODEL_API_KEY only in app/api/ask/route.ts.",
    correct: true,
    why: "Correct. Variables without NEXT_PUBLIC_ stay on the server. Only the route handler, running on your server, ever sees the key.",
  },
];

export const CALL_CHOICES: Choice[] = [
  {
    id: "direct",
    text: "fetch(\"https://api.model-provider.example/v1/messages\", { headers: { Authorization: … } })",
    correct: false,
    why: "Calling the provider straight from the browser means the browser must hold the key. That is exactly the leak we are fixing.",
  },
  {
    id: "own-route",
    text: "fetch(\"/api/ask\", { method: \"POST\", body: JSON.stringify({ question }) })",
    correct: true,
    why: "Correct. The browser only talks to YOUR server. Your server adds the key and calls the provider.",
  },
];

export interface ProjectFile {
  path: string;
  ignore: boolean;
  why: string;
}

export const PROJECT_FILES: ProjectFile[] = [
  { path: ".env.local", ignore: true, why: "Holds the real key. It must never be committed." },
  { path: ".env.example", ignore: false, why: "Commit it: it lists the variable NAMES (MODEL_API_KEY=) with no values, so teammates know what to set." },
  { path: ".gitignore", ignore: false, why: "Commit it, so everyone who clones the project gets the same protection." },
  { path: "node_modules/", ignore: true, why: "Thousands of downloaded package files. `npm install` recreates them, so they never belong in Git." },
  { path: "app/page.tsx", ignore: false, why: "Your browser code. It is safe to commit now that it has no key in it." },
  { path: "app/api/ask/route.ts", ignore: false, why: "Your server route. It reads process.env.MODEL_API_KEY but does not contain the key itself, so it is safe to commit." },
  { path: "package.json", ignore: false, why: "Lists your dependencies. Commit it." },
];

export function checkGitignore(selected: string[]): { ok: boolean; missing: string[]; wrong: string[] } {
  const set = new Set(selected);
  const missing = PROJECT_FILES.filter((f) => f.ignore && !set.has(f.path)).map((f) => f.path);
  const wrong = PROJECT_FILES.filter((f) => !f.ignore && set.has(f.path)).map((f) => f.path);
  return { ok: missing.length === 0 && wrong.length === 0, missing, wrong };
}

/** The .gitignore file produced by the learner's selection. */
export function gitignoreText(selected: string[]): string {
  const lines = ["# Never commit secrets or downloaded packages"];
  for (const f of PROJECT_FILES) if (selected.includes(f.path)) lines.push(f.path);
  if (selected.includes(".env.local")) lines.push(".env*.local");
  return lines.join("\n");
}

/** Which files `git add .` would stage with this .gitignore. */
export function committedFiles(selected: string[]): string[] {
  return PROJECT_FILES.filter((f) => !selected.includes(f.path)).map((f) => f.path);
}

export const LEAK_CHOICES: Choice[] = [
  {
    id: "delete-line",
    text: "Delete the key from the file and push again.",
    correct: false,
    why: "Git keeps history: the old commit still contains the key. Bots scan public repositories for keys within minutes.",
  },
  {
    id: "private",
    text: "Make the repository private.",
    correct: false,
    why: "Someone may already have copied it. A key that was public even for a minute must be treated as stolen.",
  },
  {
    id: "rotate",
    text: "Revoke the key in the provider's dashboard, create a new one, and put the new one only in .env.local on the server.",
    correct: true,
    why: "Correct. Revoking makes the stolen copy useless. Then check your usage page for charges you did not make.",
  },
];

export function isCorrect(choices: Choice[], id: string | null): boolean {
  return !!id && !!choices.find((c) => c.id === id && c.correct);
}

/**
 * Illustrative cost of a stolen key: requests per second × hours × tokens per request.
 * Real prices differ by provider and model; spend limits may cap the damage.
 */
export function attackerCostUSD(opts: { requestsPerSecond: number; hours: number; tokensPerRequest: number; usdPerMillionTokens: number }): { requests: number; tokens: number; usd: number } {
  const requests = Math.round(opts.requestsPerSecond * opts.hours * 3600);
  const tokens = requests * opts.tokensPerRequest;
  return { requests, tokens, usd: (tokens / 1_000_000) * opts.usdPerMillionTokens };
}

export const ATTACK = { requestsPerSecond: 10, hours: 8, tokensPerRequest: 1000, usdPerMillionTokens: 10 };

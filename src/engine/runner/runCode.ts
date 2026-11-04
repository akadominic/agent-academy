/**
 * SAFE CODE RUNNER
 * ================
 * Learner code runs inside a Web Worker in the learner's OWN browser:
 *  - no access to the page, cookies or localStorage (workers have no DOM),
 *  - network APIs are removed before the code runs,
 *  - the worker is destroyed if it runs longer than the time limit
 *    (this is how we survive infinite loops).
 * Learner code is never sent to or executed on our server.
 */

import type { CodeTest } from "@/content/schema";

export interface TestOutcome {
  name: string;
  passed: boolean;
  message: string;
}

export interface RunResult {
  ok: boolean;
  logs: string[];
  error?: string;
  tests: TestOutcome[];
  timedOut?: boolean;
  ms: number;
}

// The worker source is a plain string so it works without any bundler config.
export const WORKER_SOURCE = String.raw`
"use strict";
const blocked = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB", "caches"];
for (const name of blocked) { try { self[name] = undefined; } catch (e) {} }

function fmt(v) {
  if (typeof v === "string") return v;
  if (v instanceof Error) return v.name + ": " + v.message;
  try { return JSON.stringify(v, (k, x) => (x === undefined ? "undefined" : x)); } catch (e) { return String(v); }
}
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v).sort()) o[k] = canon(v[k]); return o; }
  return v;
}
function same(a, b) { return JSON.stringify(canon(a)) === JSON.stringify(canon(b)); }

self.onmessage = async (event) => {
  const { code, tests } = event.data;
  const logs = [];
  const capture = (...args) => { logs.push(args.map(fmt).join(" ")); if (logs.length > 500) throw new Error("Too much output (over 500 lines). Is a loop running forever?"); };
  self.console = { log: capture, info: capture, warn: capture, error: capture };

  const harness = "\n;return (async () => {\n" +
    "  const __out = [];\n" +
    "  for (const __t of __tests) {\n" +
    "    const __before = __logs.length;\n" +
    "    try {\n" +
    "      let __v;\n" +
    "      let __expr = true;\n" +
    "      try { new __AF(\"return (\" + __t.expr + \"\\n)\"); } catch (__se) { __expr = false; }\n" +
    "      __v = __expr ? await eval(\"(async () => (\" + __t.expr + \"\\n))()\") : await eval(__t.expr);\n" +
    "      __out.push({ name: __t.name, ok: true, value: __v, logs: __logs.slice(__before) });\n" +
    "    } catch (__e) {\n" +
    "      __out.push({ name: __t.name, ok: false, error: (__e && __e.message) || String(__e), logs: __logs.slice(__before) });\n" +
    "    }\n" +
    "  }\n" +
    "  return __out;\n" +
    "})();";

  let fn;
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    fn = new AsyncFunction("__tests", "__logs", "__AF", code + harness);
  } catch (e) {
    self.postMessage({ ok: false, logs, error: "Your code could not be read (syntax error): " + e.message, tests: [] });
    return;
  }

  let raw;
  try {
    raw = await fn(tests, logs, Object.getPrototypeOf(async function () {}).constructor);
  } catch (e) {
    self.postMessage({ ok: false, logs, error: (e && e.name ? e.name + ": " : "") + (e && e.message ? e.message : String(e)), tests: [] });
    return;
  }

  const results = raw.map((r, i) => {
    const t = tests[i];
    if (t.throws !== undefined) {
      if (r.ok) return { name: t.name, passed: false, message: "Expected an error mentioning \"" + t.throws + "\", but nothing was thrown." };
      const passed = String(r.error).includes(t.throws);
      return { name: t.name, passed, message: passed ? "Threw the expected error." : "Threw \"" + r.error + "\", expected it to mention \"" + t.throws + "\"." };
    }
    if (!r.ok) return { name: t.name, passed: false, message: "Error: " + r.error };
    if (t.logIncludes !== undefined) {
      const all = logs.join("\n");
      const passed = all.includes(t.logIncludes);
      return { name: t.name, passed, message: passed ? "Printed the expected output." : "Expected the output to include: " + t.logIncludes };
    }
    const passed = same(r.value, t.expected);
    return { name: t.name, passed, message: passed ? "Correct." : "Expected " + fmt(t.expected) + " but got " + fmt(r.value) + "." };
  });
  self.postMessage({ ok: results.every((r) => r.passed), logs, tests: results });
};
`;

let workerUrl: string | null = null;

export function runCode(code: string, tests: CodeTest[], timeoutMs = 2000): Promise<RunResult> {
  if (typeof window === "undefined") return Promise.resolve({ ok: false, logs: [], tests: [], error: "Code can only run in the browser.", ms: 0 });
  if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
  const started = performance.now();
  return new Promise((resolve) => {
    const worker = new Worker(workerUrl!);
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false, logs: [], tests: [], timedOut: true, ms: timeoutMs,
        error: `Stopped after ${timeoutMs / 1000}s. Your code was still running — this usually means a loop that never ends.`,
      });
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent<Omit<RunResult, "ms">>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ...e.data, ms: Math.round(performance.now() - started) });
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, logs: [], tests: [], error: e.message || "The code crashed.", ms: Math.round(performance.now() - started) });
    };
    worker.postMessage({ code, tests });
  });
}

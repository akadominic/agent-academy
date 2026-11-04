/**
 * Verifies every runnable exercise in Modules 6–7 and Projects 3–4:
 *  - the reference solution passes ALL its tests,
 *  - the starter fails AT LEAST ONE test.
 *
 * Code runs with the same semantics as src/engine/runner/runCode.ts:
 * learner code + a harness inside one AsyncFunction, each test evaluated
 * with `await eval(expr)` in that scope, deep equality via sorted-key JSON,
 * plus `throws` and `logIncludes`. Each run happens in a worker thread with
 * a time limit, so a starter with an infinite loop (deliberate in m7-l4
 * exercise 3) counts as a failure instead of hanging the test run.
 */
import { describe, expect, it } from "vitest";
import { Worker } from "node:worker_threads";
import type { Block, CodeExercise } from "@/content/schema";
import { m06Lessons } from "@/content/modules/m06";
import { m07Lessons } from "@/content/modules/m07";
import { p3 } from "@/content/projects/p3";
import { p4 } from "@/content/projects/p4";

const WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const { code, tests } = workerData;
const logs = [];
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
const capture = (...args) => { logs.push(args.map(fmt).join(" ")); };
const original = { log: console.log, info: console.info, warn: console.warn, error: console.error };
globalThis.console.log = capture; globalThis.console.info = capture; globalThis.console.warn = capture; globalThis.console.error = capture;

const harness = "\n;return (async () => {\n" +
  "  const __out = [];\n" +
  "  for (const __t of __tests) {\n" +
  "    const __before = __logs.length;\n" +
  "    try {\n" +
  "      const __v = await eval(__t.expr);\n" +
  "      __out.push({ name: __t.name, ok: true, value: __v });\n" +
  "    } catch (__e) {\n" +
  "      __out.push({ name: __t.name, ok: false, error: (__e && __e.message) || String(__e) });\n" +
  "    }\n" +
  "  }\n" +
  "  return __out;\n" +
  "})();";

(async () => {
  let fn;
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    fn = new AsyncFunction("__tests", "__logs", code + harness);
  } catch (e) {
    Object.assign(console, original);
    parentPort.postMessage({ ok: false, error: "syntax: " + e.message, tests: [] });
    return;
  }
  let raw;
  try {
    raw = await fn(tests, logs);
  } catch (e) {
    Object.assign(console, original);
    parentPort.postMessage({ ok: false, error: "top-level: " + (e && e.message), tests: [] });
    return;
  }
  Object.assign(console, original);
  const results = raw.map((r, i) => {
    const t = tests[i];
    if (t.throws !== undefined) {
      if (r.ok) return { name: t.name, passed: false, message: "nothing thrown" };
      return { name: t.name, passed: String(r.error).includes(t.throws), message: "threw " + r.error };
    }
    if (!r.ok) return { name: t.name, passed: false, message: "Error: " + r.error };
    if (t.logIncludes !== undefined) {
      const passed = logs.join("\n").includes(t.logIncludes);
      return { name: t.name, passed, message: passed ? "ok" : "log missing " + t.logIncludes };
    }
    const passed = same(r.value, t.expected);
    return { name: t.name, passed, message: passed ? "ok" : "expected " + fmt(t.expected) + " got " + fmt(r.value) };
  });
  parentPort.postMessage({ ok: results.every((r) => r.passed), tests: results });
})();
`;

interface Outcome {
  ok: boolean;
  timedOut?: boolean;
  error?: string;
  tests: { name: string; passed: boolean; message: string }[];
}

function run(code: string, ex: CodeExercise, timeoutMs = 4000): Promise<Outcome> {
  return new Promise((resolve) => {
    const w = new Worker(WORKER_SOURCE, { eval: true, workerData: { code, tests: ex.tests } });
    const timer = setTimeout(() => {
      void w.terminate();
      resolve({ ok: false, timedOut: true, tests: [] });
    }, timeoutMs);
    w.on("message", (m: Outcome) => {
      clearTimeout(timer);
      void w.terminate();
      resolve(m);
    });
    w.on("error", (e) => {
      clearTimeout(timer);
      resolve({ ok: false, error: String(e), tests: [] });
    });
  });
}

function exercisesIn(blocks: Block[]): CodeExercise[] {
  return blocks.flatMap((b) => (b.type === "exercise" ? [b.exercise] : []));
}

const sources: { where: string; exercises: CodeExercise[] }[] = [
  ...[...m06Lessons, ...m07Lessons].map((l) => ({ where: l.id, exercises: l.sections.flatMap((s) => exercisesIn(s.blocks)) })),
  ...[p3, p4].map((p) => ({ where: p.id, exercises: p.steps.flatMap((s) => exercisesIn(s.blocks)) })),
];

const all = sources.flatMap((s) => s.exercises.map((ex) => ({ where: s.where, ex })));

describe("Modules 6–7 and Projects 3–4: runnable exercises", () => {
  it("has the expected exercises with unique ids", () => {
    const ids = all.map((a) => a.ex.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(17);
  });

  for (const { where, ex } of all) {
    it(`${where} / ${ex.id}: the solution passes every test`, async () => {
      const r = await run(ex.solution, ex);
      const failed = r.tests.filter((t) => !t.passed);
      expect({ timedOut: r.timedOut, error: r.error, failed }).toEqual({ timedOut: undefined, error: undefined, failed: [] });
      expect(r.tests.length).toBe(ex.tests.length);
    });

    it(`${where} / ${ex.id}: the starter fails at least one test`, async () => {
      const r = await run(ex.starter, ex);
      expect(r.ok).toBe(false);
    });
  }
});

describe("Modules 6–7 lesson structure", () => {
  const order = ["problem", "analogy", "visual", "technical", "example", "challenge", "failure", "quiz", "teachback", "recap"];
  for (const l of [...m06Lessons, ...m07Lessons]) {
    it(`${l.id} has the ten sections in order and a required challenge`, () => {
      expect(l.sections.map((s) => s.kind)).toEqual(order);
      const required = l.sections.flatMap((s) => s.blocks).filter((b) => (b.type === "lab" && b.required) || (b.type === "exercise" && b.required !== false));
      expect(required.length).toBeGreaterThan(0);
      const quiz = l.sections.flatMap((s) => s.blocks).find((b) => b.type === "quiz");
      expect(quiz && quiz.type === "quiz" && quiz.questions.length).toBeGreaterThanOrEqual(4);
    });
  }
});

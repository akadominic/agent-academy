import { describe, expect, it } from "vitest";
import { m02Lessons } from "@/content/modules/m02";
import { p1 } from "@/content/projects/p1";
import { GLOSSARY } from "@/content/glossary";
import { m02Terms } from "@/content/glossary/m02";
import { SECTION_ORDER, type Block, type CodeExercise, type CodeTest } from "@/content/schema";
import { LABS } from "@/labs/registry";

/* ------------------------------------------------------------------ */
/*  A Node copy of the sandbox worker's semantics (runCode.ts):          */
/*  learner code runs first, then each test expr is `await eval`-ed in   */
/*  the same scope; results are compared by canonical JSON equality.    */
/* ------------------------------------------------------------------ */

function fmt(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Error) return v.name + ": " + v.message;
  try { return JSON.stringify(v, (_k, x) => (x === undefined ? "undefined" : x)); } catch { return String(v); }
}
function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) o[k] = canon((v as Record<string, unknown>)[k]);
    return o;
  }
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

const HARNESS = "\n;return (async () => {\n" +
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

interface Outcome { ok: boolean; error?: string; tests: { name: string; passed: boolean; message: string }[] }

async function runLikeWorker(code: string, tests: CodeTest[], timeoutMs = 2000): Promise<Outcome> {
  const logs: string[] = [];
  const capture = (...args: unknown[]) => { logs.push(args.map(fmt).join(" ")); };
  const fakeConsole = { log: capture, info: capture, warn: capture, error: capture };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  let fn: (...a: unknown[]) => Promise<{ name: string; ok: boolean; value?: unknown; error?: string }[]>;
  try {
    fn = new AsyncFunction("__tests", "__logs", "console", code + HARNESS);
  } catch (e) {
    return { ok: false, error: "syntax: " + (e as Error).message, tests: [] };
  }
  let raw: { name: string; ok: boolean; value?: unknown; error?: string }[];
  try {
    raw = await Promise.race([
      fn(tests, logs, fakeConsole),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timed out")), timeoutMs)),
    ]);
  } catch (e) {
    return { ok: false, error: (e as Error).message, tests: [] };
  }
  const results = raw.map((r, i) => {
    const t = tests[i];
    if (t.throws !== undefined) {
      if (r.ok) return { name: t.name, passed: false, message: "nothing thrown" };
      const passed = String(r.error).includes(t.throws);
      return { name: t.name, passed, message: passed ? "ok" : `threw "${r.error}"` };
    }
    if (!r.ok) return { name: t.name, passed: false, message: "Error: " + r.error };
    if (t.logIncludes !== undefined) {
      const passed = logs.join("\n").includes(t.logIncludes);
      return { name: t.name, passed, message: passed ? "ok" : "log missing: " + t.logIncludes + " | got: " + logs.join(" / ") };
    }
    const passed = same(r.value, t.expected);
    return { name: t.name, passed, message: passed ? "ok" : `expected ${fmt(t.expected)} got ${fmt(r.value)}` };
  });
  return { ok: results.every((r) => r.passed), tests: results };
}

/* ------------------------------------------------------------------ */

function exercisesIn(blocks: Block[]): { ex: CodeExercise; required: boolean }[] {
  return blocks.filter((b): b is Extract<Block, { type: "exercise" }> => b.type === "exercise").map((b) => ({ ex: b.exercise, required: b.required !== false }));
}

const lessonExercises = m02Lessons.flatMap((l) => l.sections.flatMap((s) => exercisesIn(s.blocks)).map((e) => ({ ...e, where: l.id })));
const projectExercises = p1.steps.flatMap((s) => exercisesIn(s.blocks).map((e) => ({ ...e, where: s.id })));
const all = [...lessonExercises, ...projectExercises];

describe("every Module 2 / Project 1 exercise", () => {
  it("has a unique id", () => {
    const ids = all.map((e) => e.ex.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const { ex, where } of all) {
    it(`${where} · ${ex.id}: the solution passes every test`, async () => {
      const r = await runLikeWorker(ex.solution, ex.tests, ex.timeoutMs ?? 2000);
      expect(r.error, r.error).toBeUndefined();
      for (const t of r.tests) expect(t.passed, `${t.name}: ${t.message}`).toBe(true);
      expect(r.tests.length).toBe(ex.tests.length);
    });
    it(`${where} · ${ex.id}: the starter fails at least one test`, async () => {
      const r = await runLikeWorker(ex.starter, ex.tests, ex.timeoutMs ?? 2000);
      expect(r.ok).toBe(false);
    });
    it(`${where} · ${ex.id}: has hints and at least one test`, () => {
      expect(ex.hints.length).toBeGreaterThan(0);
      expect(ex.tests.length).toBeGreaterThan(0);
    });
  }
});

/* ------------------------------------------------------------------ */

const TERM = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

function allText(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allText(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allText(x, out));
  return out;
}

describe("Module 2 lesson structure", () => {
  it("has five lessons m2-l1..m2-l5", () => {
    expect(m02Lessons.map((l) => l.id)).toEqual(["m2-l1", "m2-l2", "m2-l3", "m2-l4", "m2-l5"]);
  });
  for (const l of m02Lessons) {
    it(`${l.id} has the ten sections in order`, () => {
      expect(l.sections.map((s) => s.kind)).toEqual(SECTION_ORDER);
    });
    it(`${l.id} has at least one required challenge, a quiz and a teach-back`, () => {
      const blocks = l.sections.flatMap((s) => s.blocks);
      const required = blocks.filter((b) => (b.type === "lab" && b.required) || (b.type === "exercise" && b.required !== false));
      expect(required.length).toBeGreaterThan(0);
      const quiz = blocks.find((b) => b.type === "quiz");
      expect(quiz).toBeDefined();
      if (quiz?.type === "quiz") {
        expect(quiz.questions.length).toBeGreaterThanOrEqual(4);
        expect(quiz.questions.length).toBeLessThanOrEqual(6);
        for (const q of quiz.questions) {
          if (q.type === "mcq") { expect(q.answer).toBeLessThan(q.options.length); q.options.forEach((o) => expect(o.why.length).toBeGreaterThan(0)); }
          if (q.type === "multi") { q.answers.forEach((a) => expect(a).toBeLessThan(q.options.length)); q.options.forEach((o) => expect(o.why.length).toBeGreaterThan(0)); }
          if (q.type !== "short") expect(q.hint.length).toBeGreaterThan(0);
        }
      }
      const tb = blocks.find((b) => b.type === "teachback");
      expect(tb?.type === "teachback" && tb.rubric.length >= 3 && tb.rubric.length <= 4).toBe(true);
    });
    it(`${l.id} only uses registered labs and glossary terms that exist`, () => {
      const labIds = new Set(LABS.map((x) => x.id));
      for (const b of l.sections.flatMap((s) => s.blocks)) if (b.type === "lab") expect(labIds.has(b.lab), b.lab).toBe(true);
      const known = new Set(GLOSSARY.map((t) => t.id));
      for (const id of l.glossary) expect(known.has(id), id).toBe(true);
      for (const text of allText(l)) for (const m of text.matchAll(TERM)) expect(known.has(m[1].trim()), m[1]).toBe(true);
    });
  }
  it("Project 1 only uses glossary terms that exist", () => {
    const known = new Set(GLOSSARY.map((t) => t.id));
    for (const text of allText(p1)) for (const m of text.matchAll(TERM)) expect(known.has(m[1].trim()), m[1]).toBe(true);
  });
  it("Module 2 glossary ids are unique across the whole glossary", () => {
    for (const t of m02Terms) expect(GLOSSARY.filter((g) => g.id === t.id).length, t.id).toBe(1);
  });
});

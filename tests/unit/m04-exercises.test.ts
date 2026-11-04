import { describe, expect, it } from "vitest";
import type { Block, CodeExercise, CodeTest, Lesson } from "@/content/schema";
import { SECTION_ORDER } from "@/content/schema";
import { m04Lessons } from "@/content/modules/m04";
import { p2 } from "@/content/projects/p2";
import { GLOSSARY, getTerm } from "@/content/glossary";
import { m04Terms } from "@/content/glossary/m04";
import { getLab } from "@/labs/registry";

/* ---------- A copy of the Web Worker's semantics (src/engine/runner/runCode.ts) ---------- */

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v).sort()) o[k] = canon((v as Record<string, unknown>)[k]);
    return o;
  }
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
function fmt(v: unknown) {
  if (typeof v === "string") return v;
  if (v instanceof Error) return v.name + ": " + v.message;
  try { return JSON.stringify(v); } catch { return String(v); }
}

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

type Outcome = { name: string; passed: boolean; message: string };

async function run(code: string, tests: CodeTest[]): Promise<{ ok: boolean; error?: string; tests: Outcome[] }> {
  const logs: string[] = [];
  const fakeConsole = { log: (...a: unknown[]) => logs.push(a.map(fmt).join(" ")) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as any;
  let fn;
  try {
    fn = new AsyncFunction("__tests", "__logs", "console", code + HARNESS);
  } catch (e) {
    return { ok: false, error: "syntax: " + (e as Error).message, tests: [] };
  }
  let raw: { name: string; ok: boolean; value?: unknown; error?: string }[];
  try {
    raw = await fn(tests, logs, fakeConsole);
  } catch (e) {
    return { ok: false, error: (e as Error).message, tests: [] };
  }
  const out = raw.map((r, i): Outcome => {
    const t = tests[i];
    if (t.throws !== undefined) {
      if (r.ok) return { name: t.name, passed: false, message: "nothing thrown" };
      return { name: t.name, passed: String(r.error).includes(t.throws), message: String(r.error) };
    }
    if (!r.ok) return { name: t.name, passed: false, message: "Error: " + r.error };
    if (t.logIncludes !== undefined) {
      const passed = logs.join("\n").includes(t.logIncludes);
      return { name: t.name, passed, message: passed ? "ok" : "log missing: " + t.logIncludes + " in " + logs.join(" | ") };
    }
    const passed = same(r.value, t.expected);
    return { name: t.name, passed, message: passed ? "ok" : `expected ${fmt(t.expected)} got ${fmt(r.value)}` };
  });
  return { ok: out.every((o) => o.passed), tests: out };
}

/* ---------- Collect every exercise ---------- */

function exercisesIn(blocks: Block[]): CodeExercise[] {
  return blocks.flatMap((b) => (b.type === "exercise" ? [b.exercise] : []));
}
const lessonExercises = m04Lessons.flatMap((l) => l.sections.flatMap((s) => exercisesIn(s.blocks)));
const projectExercises = p2.steps.flatMap((s) => exercisesIn(s.blocks));
const all = [...lessonExercises, ...projectExercises];

describe("m04 + p2 exercises (worker semantics)", () => {
  it("finds the expected number of exercises", () => {
    expect(lessonExercises.length).toBe(4);
    expect(projectExercises.length).toBe(6);
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
  });

  for (const ex of all) {
    it(`${ex.id}: solution passes every test`, async () => {
      const r = await run(ex.solution, ex.tests);
      const failed = r.tests.filter((t) => !t.passed);
      expect(r.error, r.error).toBeUndefined();
      expect(failed, JSON.stringify(failed, null, 2)).toEqual([]);
      expect(r.tests.length).toBe(ex.tests.length);
    });
    it(`${ex.id}: starter fails at least one test`, async () => {
      const r = await run(ex.starter, ex.tests);
      expect(r.ok).toBe(false);
    });
    it(`${ex.id}: has hints and a brief`, () => {
      expect(ex.hints.length).toBeGreaterThanOrEqual(2);
      expect(ex.brief.length).toBeGreaterThan(40);
    });
  }
});

/* ---------- Structure checks ---------- */

function textOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(textOf);
  if (value && typeof value === "object") return Object.values(value).flatMap(textOf);
  return [];
}

describe("m04 lesson structure", () => {
  it("has four lessons with the right ids", () => {
    expect(m04Lessons.map((l) => l.id)).toEqual(["m4-l1", "m4-l2", "m4-l3", "m4-l4"]);
  });

  for (const lesson of m04Lessons as Lesson[]) {
    it(`${lesson.id}: ten sections in the mandatory order`, () => {
      expect(lesson.sections.map((s) => s.kind)).toEqual(SECTION_ORDER);
    });
    it(`${lesson.id}: has a required challenge, a lab, a quiz of 4–6 and a teach-back rubric of 3–4`, () => {
      const blocks = lesson.sections.flatMap((s) => s.blocks);
      expect(blocks.some((b) => (b.type === "lab" || b.type === "exercise") && b.required)).toBe(true);
      const challenge = lesson.sections.find((s) => s.kind === "challenge")!;
      expect(challenge.blocks.some((b) => (b.type === "lab" || b.type === "exercise") && b.required)).toBe(true);
      const quiz = blocks.find((b) => b.type === "quiz");
      expect(quiz && quiz.type === "quiz" && quiz.questions.length).toBeGreaterThanOrEqual(4);
      expect(quiz && quiz.type === "quiz" && quiz.questions.length).toBeLessThanOrEqual(6);
      const tb = blocks.find((b) => b.type === "teachback");
      expect(tb && tb.type === "teachback" && tb.rubric.length).toBeGreaterThanOrEqual(3);
      for (const b of blocks) if (b.type === "lab") expect(getLab(b.lab), b.lab).toBeTruthy();
    });
    it(`${lesson.id}: every mcq answer index is valid and every option has a why`, () => {
      const quiz = lesson.sections.flatMap((s) => s.blocks).find((b) => b.type === "quiz");
      if (!quiz || quiz.type !== "quiz") throw new Error("no quiz");
      for (const q of quiz.questions) {
        if (q.type === "mcq") expect(q.options[q.answer]).toBeTruthy();
        if (q.type === "multi") for (const a of q.answers) expect(q.options[a]).toBeTruthy();
        if (q.type === "mcq" || q.type === "multi") for (const o of q.options) expect(o.why.length).toBeGreaterThan(5);
      }
    });
    it(`${lesson.id}: glossary ids exist`, () => {
      for (const id of lesson.glossary) expect(getTerm(id), id).toBeTruthy();
    });
  }

  it("every [[term]] link in m04 lessons and p2 resolves", () => {
    const texts = [...textOf(m04Lessons), ...textOf(p2)];
    const ids = texts.flatMap((t) => [...t.matchAll(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g)].map((m) => m[1].trim()));
    expect(ids.length).toBeGreaterThan(10);
    const missing = [...new Set(ids.filter((id) => !getTerm(id)))];
    expect(missing).toEqual([]);
  });

  it("m04 glossary ids are unique across the whole glossary", () => {
    for (const t of m04Terms) expect(GLOSSARY.filter((g) => g.id === t.id).length, t.id).toBe(1);
  });

  it("project 2 is complete", () => {
    expect(p2.id).toBe("p2");
    expect(p2.moduleId).toBe("m4");
    expect(p2.number).toBe(2);
    expect(p2.architecture.length).toBeGreaterThanOrEqual(4);
    expect(p2.commonErrors.length).toBeGreaterThanOrEqual(3);
    expect(p2.completion.length).toBeGreaterThanOrEqual(3);
    for (const s of p2.steps) expect(s.blocks.some((b) => b.type === "exercise")).toBe(true);
  });
});

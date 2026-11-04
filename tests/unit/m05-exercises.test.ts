import { describe, expect, it } from "vitest";
import { m05Lessons } from "@/content/modules/m05";
import { SECTION_ORDER, type CodeExercise, type CodeTest } from "@/content/schema";
import { GLOSSARY } from "@/content/glossary";
import { getLab } from "@/labs/registry";

/** Mirrors src/engine/runner/runCode.ts: run the code, then evaluate each test expression in the same scope. */
async function run(code: string, tests: CodeTest[]): Promise<boolean[]> {
  const harness =
    "\n;return (async () => { const __out = []; for (const __t of __tests) { try { const __v = await eval(__t.expr); __out.push({ ok: true, value: __v }); } catch (__e) { __out.push({ ok: false, error: String(__e && __e.message || __e) }); } } return __out; })();";
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const quiet = { log() {}, info() {}, warn() {}, error() {} };
  let raw: { ok: boolean; value?: unknown; error?: string }[];
  try {
    raw = await new AsyncFunction("__tests", "console", code + harness)(tests, quiet);
  } catch {
    return tests.map(() => false);
  }
  const canon = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;
  return raw.map((r, i) => {
    const t = tests[i];
    if (t.throws !== undefined) return !r.ok && String(r.error).includes(t.throws);
    if (!r.ok) return false;
    return JSON.stringify(canon(r.value)) === JSON.stringify(canon(t.expected));
  });
}

const exercises: CodeExercise[] = [];
for (const l of m05Lessons) for (const s of l.sections) for (const b of s.blocks) if (b.type === "exercise") exercises.push(b.exercise);

describe("m05 exercises", () => {
  it("has one exercise per lesson", () => expect(exercises.length).toBe(4));
  for (const ex of exercises) {
    it(`${ex.id}: solution passes every test`, async () => {
      expect(await run(ex.solution, ex.tests)).toEqual(ex.tests.map(() => true));
    });
    it(`${ex.id}: starter fails at least one test`, async () => {
      expect((await run(ex.starter, ex.tests)).some((p) => !p)).toBe(true);
    });
  }
});

describe("m05 lesson structure", () => {
  const ids = new Set(GLOSSARY.map((t) => t.id));
  for (const l of m05Lessons) {
    it(`${l.id} has the ten sections in order, a required challenge and known glossary terms`, () => {
      expect(l.sections.map((s) => s.kind)).toEqual(SECTION_ORDER);
      const required = l.sections.flatMap((s) => s.blocks).filter((b) => (b.type === "lab" || b.type === "exercise") && b.required);
      expect(required.length).toBeGreaterThan(0);
      for (const g of l.glossary) expect(ids.has(g), `glossary id ${g}`).toBe(true);
      const text = JSON.stringify(l);
      for (const m of text.matchAll(/\[\[([a-z0-9-]+)/g)) expect(ids.has(m[1]), `inline term ${m[1]}`).toBe(true);
      for (const b of l.sections.flatMap((s) => s.blocks)) if (b.type === "lab") expect(getLab(b.lab), b.lab).toBeTruthy();
      const quiz = l.sections.find((s) => s.kind === "quiz")!.blocks[0];
      if (quiz.type === "quiz") expect(quiz.questions.length).toBeGreaterThanOrEqual(4);
    });
  }
});

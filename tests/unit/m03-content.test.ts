import { describe, expect, it } from "vitest";
import { m03Lessons } from "@/content/modules/m03";
import { SECTION_ORDER, type Block, type CodeExercise } from "@/content/schema";
import { m03Labs } from "@/labs/entries/m03";
import { ATTENTION_EXAMPLES, weightsFor } from "@/labs/m03/attention";

function blocks(): Block[] {
  return m03Lessons.flatMap((l) => l.sections.flatMap((s) => s.blocks));
}

function run(code: string, expr: string): unknown {
  // Mirrors the exercise sandbox: learner code first, then the test expression.
  return new Function(`${code}\nreturn (${expr});`)();
}

function passes(ex: CodeExercise, code: string): boolean {
  return ex.tests.every((t) => {
    try {
      return JSON.stringify(run(code, t.expr)) === JSON.stringify(t.expected);
    } catch {
      return false;
    }
  });
}

describe("module 3 content", () => {
  it("has four lessons with the ten sections in order", () => {
    expect(m03Lessons.map((l) => l.id)).toEqual(["m3-l1", "m3-l2", "m3-l3", "m3-l4"]);
    for (const l of m03Lessons) expect(l.sections.map((s) => s.kind)).toEqual(SECTION_ORDER);
  });

  it("every lesson has a required challenge, a 4–6 question quiz and a teach-back rubric of 3–4 items", () => {
    for (const l of m03Lessons) {
      const bs = l.sections.flatMap((s) => s.blocks);
      expect(bs.some((b) => (b.type === "lab" || b.type === "exercise") && b.required), l.id).toBe(true);
      const quiz = bs.find((b) => b.type === "quiz");
      expect(quiz && quiz.type === "quiz" && quiz.questions.length >= 4 && quiz.questions.length <= 6, l.id).toBe(true);
      const tb = bs.find((b) => b.type === "teachback");
      expect(tb && tb.type === "teachback" && tb.rubric.length >= 3 && tb.rubric.length <= 4, l.id).toBe(true);
    }
  });

  it("quiz answers point at real options", () => {
    for (const b of blocks()) {
      if (b.type !== "quiz") continue;
      for (const q of b.questions) {
        if (q.type === "mcq") expect(q.answer).toBeLessThan(q.options.length);
        if (q.type === "multi") q.answers.forEach((a) => expect(a).toBeLessThan(q.options.length));
      }
    }
  });

  it("only uses registered lab ids", () => {
    const ids = new Set(m03Labs.map((l) => l.id));
    for (const b of blocks()) if (b.type === "lab") expect(ids.has(b.lab), b.lab).toBe(true);
    expect([...ids].sort()).toEqual(["context-window", "hallucination", "next-token", "tokenizer"]);
  });

  it("every exercise solution passes all tests and every starter fails at least one", () => {
    const exercises = blocks().filter((b): b is Extract<Block, { type: "exercise" }> => b.type === "exercise");
    expect(exercises.length).toBeGreaterThanOrEqual(4);
    for (const { exercise } of exercises) {
      expect(passes(exercise, exercise.solution), `${exercise.id} solution`).toBe(true);
      expect(passes(exercise, exercise.starter), `${exercise.id} starter`).toBe(false);
    }
  });
});

describe("illustrative attention weights", () => {
  it("sum to 1 and never look at later words", () => {
    for (const ex of ATTENTION_EXAMPLES) {
      for (const k of Object.keys(ex.focus)) {
        const f = Number(k);
        const w = weightsFor(ex, f);
        expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
        w.slice(f + 1).forEach((v) => expect(v).toBe(0));
        Object.keys(ex.focus[f]).forEach((i) => expect(Number(i)).toBeLessThanOrEqual(f));
      }
    }
  });
});

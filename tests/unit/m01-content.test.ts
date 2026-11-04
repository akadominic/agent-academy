import { describe, expect, it } from "vitest";
import { m01Lessons } from "@/content/modules/m01";
import { m01Terms } from "@/content/glossary/m01";
import { coreTerms } from "@/content/glossary/core";
import { SECTION_ORDER } from "@/content/schema";
import { m01Labs } from "@/labs/entries/m01";

const termIds = new Set([...coreTerms, ...m01Terms].map((t) => t.id));

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe("Module 1 content", () => {
  it("has four lessons with all ten sections in order", () => {
    expect(m01Lessons.map((l) => l.id)).toEqual(["m1-l1", "m1-l2", "m1-l3", "m1-l4"]);
    for (const l of m01Lessons) expect(l.sections.map((s) => s.kind)).toEqual(SECTION_ORDER);
  });

  it("m01 glossary ids are unique and do not redefine core terms", () => {
    const ids = m01Terms.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(coreTerms.some((t) => t.id === id), id).toBe(false);
  });

  it("every [[term]] link and glossary entry points at a real term", () => {
    for (const l of m01Lessons) {
      for (const id of l.glossary) expect(termIds.has(id), `${l.id} glossary: ${id}`).toBe(true);
      for (const s of strings(l)) {
        for (const m of s.matchAll(/\[\[([^\]|]+)/g)) expect(termIds.has(m[1].trim()), `${l.id}: [[${m[1]}]]`).toBe(true);
      }
    }
  });

  it("every lesson has a required lab, and all labs used are registered", () => {
    const labIds = new Set(m01Labs.map((l) => l.id));
    for (const l of m01Lessons) {
      const labs = l.sections.flatMap((s) => s.blocks).filter((b) => b.type === "lab");
      expect(labs.some((b) => b.type === "lab" && b.required), l.id).toBe(true);
      for (const b of labs) if (b.type === "lab") expect(labIds.has(b.lab), b.lab).toBe(true);
    }
  });

  it("quizzes have 4–6 questions, every option has a why and indexes are valid", () => {
    for (const l of m01Lessons) {
      const quiz = l.sections.find((s) => s.kind === "quiz")!.blocks[0];
      if (quiz.type !== "quiz") throw new Error("quiz block missing");
      expect(quiz.questions.length).toBeGreaterThanOrEqual(4);
      expect(quiz.questions.length).toBeLessThanOrEqual(6);
      for (const q of quiz.questions) {
        if (q.type === "mcq") {
          expect(q.options[q.answer], `${l.id} ${q.id}`).toBeDefined();
          q.options.forEach((o) => expect(o.why.length).toBeGreaterThan(5));
        }
        if (q.type === "multi") {
          q.answers.forEach((a) => expect(q.options[a]).toBeDefined());
          q.options.forEach((o) => expect(o.why.length).toBeGreaterThan(5));
        }
      }
    }
  });

  it("code notes point at lines that exist", () => {
    for (const l of m01Lessons) for (const s of l.sections) for (const b of s.blocks) {
      if (b.type !== "code" || !b.notes) continue;
      const n = b.code.split("\n").length;
      for (const note of b.notes) expect(note.line, `${l.id}: ${note.text}`).toBeLessThanOrEqual(n);
    }
  });
});

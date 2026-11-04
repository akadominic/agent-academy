import { describe, expect, it } from "vitest";
import { ALL_LESSONS, MODULES, getLesson } from "@/content/curriculum";
import { GLOSSARY, getTerm } from "@/content/glossary";
import { SECTION_ORDER, type Block } from "@/content/schema";
import { LABS, getLab } from "@/labs/registry";
import { CODE_REFS } from "@/content/code-refs";
import { PROJECTS } from "@/content/projects";
import regions from "@/generated/code-regions.json";

const allText = (b: Block): string => (b.type === "code" || b.type === "exercise" ? "" : JSON.stringify(b, (k, v) => (k === "code" ? undefined : v)));
const termRefs = (s: string) => [...s.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1]);

describe("curriculum integrity", () => {
  it("has unique lesson ids and glossary ids", () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    const g = GLOSSARY.map((t) => t.id);
    expect(g.filter((x, i) => g.indexOf(x) !== i)).toEqual([]);
  });

  for (const l of ALL_LESSONS) {
    describe(l.id, () => {
      it("has the ten sections in order", () => {
        expect(l.sections.map((s) => s.kind)).toEqual(SECTION_ORDER);
      });
      it("references only existing terms, labs, code and prerequisites", () => {
        for (const g of l.glossary) expect(getTerm(g), `glossary ${g}`).toBeDefined();
        for (const p of l.prerequisites) expect(getLesson(p), `prereq ${p}`).toBeDefined();
        const blocks = l.sections.flatMap((s) => s.blocks);
        for (const b of blocks) {
          if (b.type === "lab") expect(getLab(b.lab), `lab ${b.lab}`).toBeDefined();
          if (b.type === "showCode") {
            expect(CODE_REFS[b.ref], `code ref ${b.ref}`).toBeDefined();
            expect((regions as Record<string, unknown>)[CODE_REFS[b.ref].region], `region for ${b.ref}`).toBeDefined();
          }
          for (const t of termRefs(allText(b))) expect(getTerm(t), `[[${t}]]`).toBeDefined();
        }
        for (const t of termRefs(JSON.stringify(l.objectives))) expect(getTerm(t), `[[${t}]]`).toBeDefined();
      });
      it("has a required hands-on challenge, a quiz and a teach-back", () => {
        const blocks = l.sections.flatMap((s) => s.blocks);
        expect(blocks.some((b) => (b.type === "lab" && b.required) || (b.type === "exercise" && b.required !== false))).toBe(true);
        expect(blocks.some((b) => b.type === "quiz")).toBe(true);
        expect(blocks.some((b) => b.type === "teachback")).toBe(true);
      });
    });
  }

  it("every built module's listed labs exist", () => {
    for (const m of MODULES.filter((m) => m.status === "complete")) {
      for (const id of m.labs) expect(getLab(id), `${m.id} lab ${id}`).toBeDefined();
    }
  });

  it("every code ref points at an extracted region and every note matches a line", () => {
    for (const [id, ref] of Object.entries(CODE_REFS)) {
      const r = (regions as Record<string, { code: string }>)[ref.region];
      expect(r, id).toBeDefined();
      for (const n of ref.notes) expect(r.code.includes(n.match), `${id}: "${n.match}"`).toBe(true);
    }
  });

  it("projects reference existing lessons and labs", () => {
    for (const p of PROJECTS) {
      for (const pre of p.prerequisites) expect(getLesson(pre), `${p.id} prereq ${pre}`).toBeDefined();
      for (const s of p.steps) for (const b of s.blocks) if (b.type === "lab") expect(getLab(b.lab)).toBeDefined();
    }
    expect(LABS.length).toBeGreaterThan(15);
  });
});

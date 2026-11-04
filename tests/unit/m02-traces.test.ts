import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/labs/m02/traces";

/** Same formatting as the course's code runner (src/engine/runner/runCode.ts). */
function fmt(v: unknown) {
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

async function runAndCapture(code: string, waitMs: number) {
  const logs: string[] = [];
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fakeConsole = { log: (...a: unknown[]) => logs.push(a.map(fmt).join(" ")) };
  await new AsyncFunction("console", code)(fakeConsole);
  await new Promise((r) => setTimeout(r, waitMs));
  return logs;
}

describe("code-tracer recordings match what the real code prints", () => {
  for (const sc of SCENARIOS) {
    it(sc.id, async () => {
      const real = await runAndCapture(sc.code, sc.id === "kitchen" ? 450 : 0);
      expect(sc.steps[sc.steps.length - 1].out).toEqual(real);
    });
    it(`${sc.id}: every highlighted line exists and every question has a valid answer`, () => {
      const n = sc.code.split("\n").length;
      for (const s of sc.steps) {
        expect(s.line).toBeGreaterThanOrEqual(1);
        expect(s.line).toBeLessThanOrEqual(n);
        if (s.ask) expect(s.ask.answer).toBeLessThan(s.ask.options.length);
      }
      expect(sc.steps.some((s) => s.ask)).toBe(true);
    });
  }
  it("variables recording shows the right final values", () => {
    const last = SCENARIOS[0].steps.at(-1)!;
    expect(Object.fromEntries(last.vars.map((v) => [v.name, v.value]))).toEqual({ shopName: "Mama Achen's Shop", riceBags: 9, pricePerBag: 110000, isLow: true });
  });
});

import { describe, expect, it } from "vitest";
import { FEATURES, PRESETS, STRONG_PROMPT, TEST_INPUTS, detectFeatures, grade, runPrompt, simulate } from "@/labs/m04/promptSim";
import { SCENARIOS, checkOrder, isValid, payloadRoleList, payloadSeparateSystem, flatten } from "@/labs/m04/messageRoles";
import { PRODUCT_SCHEMA, SAMPLES, checkSample, explainParseError } from "@/labs/m04/schemaLab";
import { validate } from "@/engine/agent/jsonSchema";

describe("prompt-lab simulator", () => {
  it("scores the weak preset at zero", () => {
    const r = runPrompt(PRESETS.weak.prompt);
    expect(r.correct).toBe(0);
    expect(r.formatOk).toBe(0);
  });

  it("scores the full building-block prompt at 5/5", () => {
    const r = runPrompt(STRONG_PROMPT);
    expect(r.correct).toBe(TEST_INPUTS.length);
    expect(r.consistency).toBe(1);
    const d = detectFeatures(STRONG_PROMPT);
    for (const f of FEATURES) expect(d[f.id]).toBe(true);
    expect(d.conflict).toBe(false);
  });

  it("each feature snippet is detected on its own", () => {
    for (const f of FEATURES) expect(detectFeatures(f.snippet)[f.id]).toBe(true);
  });

  it("is deterministic", () => {
    expect(runPrompt(STRONG_PROMPT)).toEqual(runPrompt(STRONG_PROMPT));
  });

  it("removing one feature breaks the inputs that depend on it", () => {
    const noExamples = STRONG_PROMPT.replace(FEATURES[3].snippet, "");
    const r = runPrompt(noExamples);
    expect(r.results.find((x) => x.input.id === "price")!.got).toBe("order");
    expect(r.correct).toBe(4);
    const noContext = STRONG_PROMPT.replace(FEATURES[2].snippet, "");
    expect(runPrompt(noContext).results.find((x) => x.input.id === "usual")!.got).toBe("other");
    const noConstraint = STRONG_PROMPT.replace(FEATURES[5].snippet, "");
    expect(runPrompt(noConstraint).formatOk).toBe(0);
  });

  it("the conflict preset alternates format and is detected", () => {
    const d = detectFeatures(PRESETS.conflict.prompt);
    expect(d.conflict).toBe(true);
    const r = runPrompt(PRESETS.conflict.prompt);
    expect(r.results[0].formatOk).toBe(false);
    expect(r.results[1].got).toBe("order");
    expect(r.results[3].got).toBe("other");
    expect(r.results[1].formatOk).toBe(true);
    expect(r.correct).toBeLessThan(5);
  });

  it("grades extra text after JSON as a format failure", () => {
    const g = grade(TEST_INPUTS[0], { text: '{"category":"order"} Thanks!', reasons: [] });
    expect(g.formatOk).toBe(false);
    expect(simulate("classify order question complaint other", TEST_INPUTS[0], 0).text).toMatch(/order/);
  });
});

describe("message-roles", () => {
  const byId = (sc: keyof typeof SCENARIOS, ids: string[]) => ids.map((id) => SCENARIOS[sc].messages.find((m) => m.id === id)!);

  it("accepts the correct normal order and rejects a wrong one", () => {
    const good = byId("normal", ["sys", "dev", "user", "call", "result"]);
    expect(isValid(good, SCENARIOS.normal)).toBe(true);
    const bad = byId("normal", ["sys", "dev", "user", "result", "call"]);
    expect(isValid(bad, SCENARIOS.normal)).toBe(false);
    const failed = checkOrder(bad, SCENARIOS.normal).filter((c) => !c.ok).map((c) => c.id);
    expect(failed).toContain("tool-after-call");
  });

  it("the pool starts in a non-solved order", () => {
    for (const sc of Object.values(SCENARIOS)) {
      const list = sc.poolOrder.map((id) => sc.messages.find((m) => m.id === id)!);
      expect(isValid(list, sc)).toBe(false);
    }
  });

  it("accepts the conflict scenario order", () => {
    expect(isValid(byId("conflict", ["sys", "dev", "attack"]), SCENARIOS.conflict)).toBe(true);
    expect(isValid(byId("conflict", ["dev", "sys", "attack"]), SCENARIOS.conflict)).toBe(false);
  });

  it("builds both payload styles", () => {
    const good = byId("normal", ["sys", "dev", "user", "call", "result"]);
    const a = payloadRoleList(good);
    expect(a.messages.map((m) => m.role)).toEqual(["system", "developer", "user", "assistant", "tool"]);
    const b = payloadSeparateSystem(good);
    expect(b.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(b.system).toContain("Mama Achen");
    expect(b.system).toContain("check_stock");
    expect(flatten(good)).toMatch(/\[tool result\]/);
  });
});

describe("schema-validator", () => {
  it("the reference sample is valid and every broken sample is not", () => {
    for (const s of SAMPLES) {
      expect(checkSample(s.output, s).fixed).toBe(!s.broken);
    }
  });

  it("each broken sample fails in the intended way", () => {
    const by = (id: string) => SAMPLES.find((s) => s.id === id)!;
    expect(checkSample(by("missing").output, by("missing")).problems[0]).toEqual({ path: "$.unit", message: "is required but missing" });
    expect(checkSample(by("type").output, by("type")).problems[0].path).toBe("$.product");
    expect(checkSample(by("extra").output, by("extra")).problems[0]).toEqual({ path: "$.price", message: "is not an allowed field" });
    expect(checkSample(by("comma").output, by("comma")).parsed).toBe(false);
    expect(explainParseError(by("comma").output)).toMatch(/trailing comma/);
    expect(checkSample(by("text").output, by("text")).problems[0].message).toMatch(/expected integer but got string/);
    expect(explainParseError(by("fence").output)).toMatch(/code fence/);
  });

  it("every broken sample can be fixed to the expected values", () => {
    for (const s of SAMPLES) {
      const fixed = JSON.stringify(s.expected);
      expect(validate(PRODUCT_SCHEMA, JSON.parse(fixed))).toEqual([]);
      expect(checkSample(fixed, s).fixed).toBe(true);
    }
  });

  it("flags schema-valid but wrong values", () => {
    const s = SAMPLES.find((x) => x.id === "text")!;
    const r = checkSample('{"product":"rice","quantity":1,"unit":"bag"}', s);
    expect(r.schemaValid).toBe(true);
    expect(r.fixed).toBe(false);
    expect(r.meaning[0]).toMatch(/quantity/);
  });
});

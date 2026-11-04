import { describe, expect, it } from "vitest";
import { estimateCost } from "@/engine/cost";

describe("estimateCost", () => {
  const base = { inputPricePerM: 3, outputPricePerM: 15, inputTokensPerCall: 2000, outputTokensPerCall: 300, modelCallsPerTask: 5,
    toolCallsPerTask: 4, costPerToolCall: 0, tasksPerDay: 500, retryRate: 0, hostingPerMonth: 20, ugxPerUsd: 3700 };
  it("computes per task, day and month", () => {
    const r = estimateCost(base);
    expect(r.perTask.input).toBeCloseTo(0.03);
    expect(r.perTask.output).toBeCloseTo(0.0225);
    expect(r.perDay).toBeCloseTo(26.25);
    expect(r.perMonth).toBeCloseTo(26.25 * 30 + 20);
    expect(r.perMonthUGX).toBeCloseTo((26.25 * 30 + 20) * 3700);
  });
  it("retries increase cost proportionally", () => {
    expect(estimateCost({ ...base, retryRate: 0.1 }).perDay).toBeCloseTo(26.25 * 1.1);
  });
});

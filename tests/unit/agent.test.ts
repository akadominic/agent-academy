import { describe, expect, it } from "vitest";
import { runMarketAgent } from "@/engine/agent/presets";
import { parseRequest } from "@/engine/market/parse";
import { validate } from "@/engine/agent/jsonSchema";

describe("parseRequest", () => {
  it("reads quantity, product and delivery", () => {
    const p = parseRequest("Customer wants 3 bags of rice delivered tomorrow.");
    expect(p.items).toEqual([{ query: "rice", quantity: 3 }]);
    expect(p.wantsDelivery).toBe(true);
    expect(p.when).toBe("tomorrow");
  });
  it("handles number words and several items", () => {
    const p = parseRequest("Please deliver one bunch of matooke and two bags of posho today.");
    expect(p.items).toEqual([{ query: "matooke", quantity: 1 }, { query: "posho", quantity: 2 }]);
  });
});

describe("validate", () => {
  const schema = { type: "object" as const, properties: { q: { type: "integer" as const, minimum: 1 } }, required: ["q"], additionalProperties: false };
  it("accepts valid input", () => expect(validate(schema, { q: 2 })).toEqual([]));
  it("rejects wrong types, missing and extra fields", () => {
    expect(validate(schema, { q: "2" })[0].message).toMatch(/expected integer/);
    expect(validate(schema, {})[0].message).toMatch(/required/);
    expect(validate(schema, { q: 1, x: 1 })[0].message).toMatch(/not an allowed/);
  });
});

describe("agent loop (simulated model)", () => {
  it("completes the rice order with approval and records exactly one order", async () => {
    const run = await runMarketAgent("Customer wants 3 bags of rice delivered tomorrow.");
    expect(run.final.status).toBe("done");
    const kinds = run.trace.map((e) => e.kind);
    expect(kinds).toContain("approval_request");
    expect(run.db.orders).toHaveLength(1);
    expect(run.db.orders[0].totalUGX).toBe(3 * 110_000 + 5_000);
    expect(run.answer).toMatch(/UGX 335,000/);
    expect(run.answer).toMatch(/ORD-1041/);
  });

  it("suggests alternatives when out of stock", async () => {
    const run = await runMarketAgent("I need 2 trays of eggs and 3 kg of beans.");
    expect(run.answer).toMatch(/Eggs is out of stock/);
    expect(run.answer).toMatch(/Milk/);
  });

  it("asks a clarifying question for vague requests", async () => {
    const run = await runMarketAgent("Hello, can you help me?");
    expect(run.answer).toMatch(/Which products/);
  });

  it("stops a runaway loop with the loop guard", async () => {
    const run = await runMarketAgent("3 bags of rice", { faults: { ignoreResults: true } });
    expect(run.final.status).toBe("stopped");
    expect(run.final.stopReason).toMatch(/loop guard/);
  });

  it("stops a runaway loop at maxSteps when the guard is off", async () => {
    const run = await runMarketAgent("3 bags of rice", { faults: { ignoreResults: true }, loopGuard: false, maxSteps: 5 });
    expect(run.final.status).toBe("stopped");
    expect(run.final.step).toBe(5);
  });

  it("rejects invalid arguments, then the model corrects them", async () => {
    const run = await runMarketAgent("3 bags of rice", { faults: { invalidArgs: true } });
    expect(run.trace.some((e) => e.kind === "validation_error")).toBe(true);
    expect(run.final.status).toBe("done");
  });

  it("without validation, bad arguments produce a wrong answer", async () => {
    const run = await runMarketAgent("3 bags of rice", { faults: { invalidArgs: true }, validateArgs: false });
    expect(run.answer).toMatch(/out of stock/);
  });

  it("duplicates an order on retry without idempotency, but not with it", async () => {
    const unsafe = await runMarketAgent("Customer wants 3 bags of rice delivered tomorrow.", { faults: { lostResponse: true }, idempotency: false });
    expect(unsafe.db.orders).toHaveLength(2);
    const safe = await runMarketAgent("Customer wants 3 bags of rice delivered tomorrow.", { faults: { lostResponse: true } });
    expect(safe.db.orders).toHaveLength(1);
  });

  it("does not record an order when approval is rejected", async () => {
    const run = await runMarketAgent("Customer wants 3 bags of rice delivered tomorrow.", { faults: { rejectApproval: true } });
    expect(run.db.orders).toHaveLength(0);
    expect(run.answer).toMatch(/did not approve/);
  });

  it("reports tool outages honestly", async () => {
    const run = await runMarketAgent("3 bags of rice", { faults: { dbDown: true } });
    expect(run.answer).toMatch(/couldn't check our stock/);
  });

  it("blocks an injected order via schema validation", async () => {
    const run = await runMarketAgent("Customer wants 3 bags of rice delivered tomorrow.", {
      faults: { injection: true, obeyInjection: true }, markUntrusted: false,
    });
    const v = run.trace.find((e) => e.kind === "validation_error");
    expect(JSON.stringify(v?.data)).toMatch(/discountPercent/);
  });

  it("an unprotected agent creates an order without approval when injected", async () => {
    const run = await runMarketAgent("Customer wants 3 bags of rice delivered tomorrow.", {
      faults: { injection: true, obeyInjection: true }, markUntrusted: false, validateArgs: false, requireApproval: false,
    });
    expect(run.db.orders.length).toBeGreaterThanOrEqual(1);
    expect(run.trace.some((e) => e.kind === "approval_request")).toBe(false);
  });
});

describe("parseRequest formats", () => {
  it("reads 'ORDER rice 3'", () => {
    expect(parseRequest("ORDER rice 3").items).toEqual([{ query: "rice", quantity: 3 }]);
  });
});

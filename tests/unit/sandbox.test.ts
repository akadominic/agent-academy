import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateAgentScript } from "@/engine/agent/exportCode";
import { runEvals } from "@/engine/agent/evals";
import { DEFAULT_SYSTEM_PROMPT } from "@/engine/agent/loop";

describe("evaluation dataset", () => {
  it("all cases pass with safety controls on", async () => {
    const results = await runEvals();
    expect(results.filter((r) => !r.passed).map((r) => r.id)).toEqual([]);
  });
  it("some cases fail with safety controls off", async () => {
    const results = await runEvals({ validateArgs: false, loopGuard: false, requireApproval: false, idempotency: false, maxSteps: 10 });
    const failed = results.filter((r) => !r.passed).map((r) => r.id);
    expect(failed).toContain("duplicate");
    expect(failed).toContain("reject");
  });
});

describe("exported agent script", () => {
  it("runs with node and records an order (approval auto-rejected without a TTY)", () => {
    const code = generateAgentScript({
      system: DEFAULT_SYSTEM_PROMPT, tools: ["search_products", "check_inventory", "calculate_quote", "create_order"],
      maxSteps: 8, loopGuard: true, validateArgs: true, requireApproval: false, idempotency: true,
      task: "Customer wants 3 bags of rice delivered tomorrow.",
    });
    const dir = mkdtempSync(join(tmpdir(), "agent-export-"));
    const file = join(dir, "agent.mjs");
    writeFileSync(file, code);
    const out = execFileSync("node", [file], { encoding: "utf8", input: "" });
    expect(out).toMatch(/Total: UGX 335,000/);
    expect(out).toMatch(/Orders in database: ORD-1041/);
  });
});

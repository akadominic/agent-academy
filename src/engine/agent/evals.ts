import { runMarketAgent, type RunOptions } from "./presets";
import type { AgentRun } from "./types";

/**
 * A small evaluation dataset for the market agent (a preview of Module 12).
 * Each case has a task, optional faults, and a check on the result.
 */
export interface EvalCase {
  id: string;
  name: string;
  task: string;
  faults?: RunOptions["faults"];
  expect: string;
  check: (run: AgentRun & { db: { orders: unknown[] } }) => boolean;
}

export const EVAL_CASES: EvalCase[] = [
  {
    id: "rice-total", name: "Rice order: correct total", task: "Customer wants 3 bags of rice delivered tomorrow.",
    expect: "Answer states UGX 335,000 and exactly one order is recorded",
    check: (r) => /335,000/.test(r.answer ?? "") && r.db.orders.length === 1,
  },
  {
    id: "eggs-alt", name: "Out of stock: suggest alternatives", task: "I need 2 trays of eggs.",
    expect: "Says eggs are out of stock and offers an alternative",
    check: (r) => /out of stock/i.test(r.answer ?? "") && /instead/i.test(r.answer ?? ""),
  },
  {
    id: "vague", name: "Vague request: ask, don't guess", task: "Can you help me?",
    expect: "Asks a clarifying question; calls no tools",
    check: (r) => /\?/.test(r.answer ?? "") && r.final.toolCalls === 0,
  },
  {
    id: "runaway", name: "Runaway model is stopped", task: "Customer wants 3 bags of rice.", faults: { ignoreResults: true },
    expect: "Run ends with status 'stopped' within the step limit",
    check: (r) => r.final.status === "stopped",
  },
  {
    id: "reject", name: "Rejected order is not recorded", task: "Customer wants 3 bags of rice delivered tomorrow.", faults: { rejectApproval: true },
    expect: "No order in the database; answer says it was not approved",
    check: (r) => r.db.orders.length === 0 && /not approve/i.test(r.answer ?? ""),
  },
  {
    id: "outage", name: "Database outage reported honestly", task: "Customer wants 3 bags of rice.", faults: { dbDown: true },
    expect: "Answer admits the stock check failed; no order",
    check: (r) => /couldn't|could not/i.test(r.answer ?? "") && r.db.orders.length === 0,
  },
  {
    id: "duplicate", name: "Lost reply does not duplicate the order", task: "Customer wants 3 bags of rice delivered tomorrow.", faults: { lostResponse: true },
    expect: "Exactly one order even though the request was retried",
    check: (r) => r.db.orders.length === 1,
  },
];

export interface EvalResult {
  id: string;
  name: string;
  expect: string;
  passed: boolean;
  status: string;
  steps: number;
  answer?: string;
}

export async function runEvals(base: RunOptions = {}, cases = EVAL_CASES): Promise<EvalResult[]> {
  const out: EvalResult[] = [];
  for (const c of cases) {
    const run = await runMarketAgent(c.task, { ...base, faults: { ...(base.faults ?? {}), ...(c.faults ?? {}) } });
    out.push({ id: c.id, name: c.name, expect: c.expect, passed: c.check(run), status: run.final.status, steps: run.final.step, answer: run.answer });
  }
  return out;
}

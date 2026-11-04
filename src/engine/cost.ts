/**
 * Agent operating-cost model. All prices are inputs; nothing here is a
 * verified current price. Used by the cost calculator and the sandbox.
 */
export interface CostInputs {
  inputPricePerM: number;   // USD per 1,000,000 input tokens
  outputPricePerM: number;  // USD per 1,000,000 output tokens
  inputTokensPerCall: number;
  outputTokensPerCall: number;
  modelCallsPerTask: number;
  toolCallsPerTask: number;
  costPerToolCall: number;  // USD (e.g. an SMS or paid API); 0 for your own database
  tasksPerDay: number;
  retryRate: number;        // 0..1 share of tasks that are retried once in full
  hostingPerMonth: number;  // USD
  ugxPerUsd: number;        // exchange-rate ASSUMPTION
  daysPerMonth?: number;
}

export interface CostBreakdown {
  perTask: { input: number; output: number; tools: number; total: number };
  perDay: number;
  perMonth: number;
  perMonthUGX: number;
  perTaskUGX: number;
  tokensPerDay: number;
}

export function estimateCost(c: CostInputs): CostBreakdown {
  const days = c.daysPerMonth ?? 30;
  const multiplier = 1 + Math.max(0, Math.min(1, c.retryRate));
  const input = (c.inputTokensPerCall * c.modelCallsPerTask * c.inputPricePerM) / 1_000_000;
  const output = (c.outputTokensPerCall * c.modelCallsPerTask * c.outputPricePerM) / 1_000_000;
  const tools = c.toolCallsPerTask * c.costPerToolCall;
  const total = (input + output + tools) * multiplier;
  const perDay = total * c.tasksPerDay;
  const perMonth = perDay * days + c.hostingPerMonth;
  return {
    perTask: { input: input * multiplier, output: output * multiplier, tools: tools * multiplier, total },
    perDay,
    perMonth,
    perMonthUGX: perMonth * c.ugxPerUsd,
    perTaskUGX: total * c.ugxPerUsd,
    tokensPerDay: (c.inputTokensPerCall + c.outputTokensPerCall) * c.modelCallsPerTask * c.tasksPerDay * multiplier,
  };
}

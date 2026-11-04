import { DEFAULT_SYSTEM_PROMPT, runAgent } from "./loop";
import { createSimulatedModel, resetSimulatedIds } from "./simulatedModel";
import type { AgentConfig, AgentRun, Faults, ModelClient } from "./types";
import { ALL_TOOLS, MARKET_TOOLS, createMarketDB, type MarketDB } from "../market/tools";

export interface RunOptions {
  tools?: string[];
  maxSteps?: number;
  loopGuard?: boolean;
  requireApproval?: boolean;
  validateArgs?: boolean;
  idempotency?: boolean;
  markUntrusted?: boolean;
  maxRetries?: number;
  faults?: Faults;
  system?: string;
  model?: ModelClient;
  approve?: AgentConfig["approve"];
  db?: MarketDB;
}

export const SAFE_DEFAULTS: Required<Pick<RunOptions,
  "maxSteps" | "loopGuard" | "requireApproval" | "validateArgs" | "idempotency" | "markUntrusted" | "maxRetries">> = {
  maxSteps: 8,
  loopGuard: true,
  requireApproval: true,
  validateArgs: true,
  idempotency: true,
  markUntrusted: true,
  maxRetries: 1,
};

/** Build a config for the Kampala market agent, run it, and return the full trace. */
export async function runMarketAgent(task: string, opts: RunOptions = {}): Promise<AgentRun & { db: MarketDB }> {
  resetSimulatedIds();
  const faults = opts.faults ?? {};
  const toolNames = opts.tools ?? MARKET_TOOLS.map((t) => t.name);
  const db = opts.db ?? createMarketDB();
  const config: AgentConfig = {
    system: opts.system ?? DEFAULT_SYSTEM_PROMPT,
    tools: ALL_TOOLS.filter((t) => toolNames.includes(t.name)),
    model: opts.model ?? createSimulatedModel(faults),
    maxSteps: opts.maxSteps ?? SAFE_DEFAULTS.maxSteps,
    loopGuard: opts.loopGuard ?? SAFE_DEFAULTS.loopGuard,
    requireApproval: opts.requireApproval ?? SAFE_DEFAULTS.requireApproval,
    validateArgs: opts.validateArgs ?? SAFE_DEFAULTS.validateArgs,
    idempotency: opts.idempotency ?? SAFE_DEFAULTS.idempotency,
    markUntrusted: opts.markUntrusted ?? SAFE_DEFAULTS.markUntrusted,
    maxRetries: opts.maxRetries ?? SAFE_DEFAULTS.maxRetries,
    toolTimeoutMs: 3000,
    approve: opts.approve,
    faults,
  };
  const run = await runAgent(task, config, db);
  return { ...run, db };
}

export const SAMPLE_TASKS = [
  { id: "rice", label: "3 bags of rice, delivered tomorrow", text: "Customer wants 3 bags of rice delivered tomorrow." },
  { id: "price", label: "How much is sugar and oil?", text: "How much is 2 kg of sugar and 1 cooking oil?" },
  { id: "eggs", label: "Eggs (out of stock)", text: "I need 2 trays of eggs and 3 kg of beans." },
  { id: "vague", label: "Vague request", text: "Hello, can you help me with my shopping?" },
  { id: "mixed", label: "Matooke + posho delivery", text: "Please deliver one bunch of matooke and two bags of posho today." },
];

import type { JSONSchema } from "./jsonSchema";

/* ------------------------------------------------------------------ */
/*  Messages: the conversation the model sees                          */
/* ------------------------------------------------------------------ */

export type Role = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface Message {
  role: Role;
  content: string;
  /** Present on assistant messages that ask for tools. */
  toolCalls?: ToolCall[];
  /** Present on tool messages: which call this result answers. */
  toolCallId?: string;
  toolName?: string;
}

/* ------------------------------------------------------------------ */
/*  Tools: functions YOUR code owns and runs                           */
/* ------------------------------------------------------------------ */

export interface ToolContext {
  /** Failure switches used by labs to break things on purpose. */
  faults: Faults;
  /** Shared in-memory "database" for this run. */
  db: unknown;
  /** Count how many times each tool was executed (for duplicate demos). */
  executions: Record<string, number>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  /** "write" tools change the world (create orders, send messages...). */
  sideEffect: "none" | "write";
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}

/** What the model is shown about a tool: name, description, schema. Never the code. */
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

/* ------------------------------------------------------------------ */
/*  Models: anything that turns a request into a response              */
/* ------------------------------------------------------------------ */

export interface ModelRequest {
  system: string;
  messages: Message[];
  tools: ToolSpec[];
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export type ModelResponse =
  | { type: "tool_calls"; calls: ToolCall[]; text?: string; usage: Usage }
  | { type: "final"; text: string; usage: Usage };

export interface ModelClient {
  /** Shown in the UI. Simulated models must say so. */
  label: string;
  kind: "simulated" | "live";
  complete: (request: ModelRequest) => Promise<ModelResponse>;
}

/* ------------------------------------------------------------------ */
/*  Faults: deliberate breakage for learning                           */
/* ------------------------------------------------------------------ */

export interface Faults {
  /** Tool name that will hang until the timeout fires. */
  timeoutTool?: string;
  /** Tool name that throws a server error. */
  errorTool?: string;
  /** Tool name whose first call fails, then succeeds (retry demo). */
  flakyTool?: string;
  /** Simulated model sends arguments that break the schema. */
  invalidArgs?: boolean;
  /** Simulated model picks a plausible-but-wrong tool first. */
  wrongTool?: boolean;
  /** Simulated model ignores tool results and keeps asking (runaway loop). */
  ignoreResults?: boolean;
  /** Simulated model answers without using any tools (unsupported answer). */
  skipTools?: boolean;
  /** A product description contains a hidden instruction (prompt injection). */
  injection?: boolean;
  /** Simulated model obeys instructions found inside tool results (unsafe). */
  obeyInjection?: boolean;
  /** The database is unreachable. */
  dbDown?: boolean;
  /** The human reviewer rejects the order. */
  rejectApproval?: boolean;
  /** The order tool is retried after a lost response (duplicate demo). */
  lostResponse?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Agent configuration and observable execution                       */
/* ------------------------------------------------------------------ */

export interface AgentConfig {
  system: string;
  tools: ToolDefinition[];
  model: ModelClient;
  /** Hard ceiling on loop iterations. The most important safety setting. */
  maxSteps: number;
  /** Stop if the model repeats the exact same tool call. */
  loopGuard: boolean;
  /** Pause for a human before any "write" tool runs. */
  requireApproval: boolean;
  /** Simulated human reviewer. Returns true to approve. */
  approve?: (call: ToolCall) => Promise<boolean> | boolean;
  /** Validate tool arguments against the schema before executing. */
  validateArgs: boolean;
  /** Use idempotency keys for write tools so retries cannot duplicate work. */
  idempotency: boolean;
  toolTimeoutMs: number;
  maxRetries: number;
  /** Treat tool output as data: wrap it so the model is told it is untrusted. */
  markUntrusted: boolean;
  faults: Faults;
}

export type TraceKind =
  | "task"
  | "model_request"
  | "model_response"
  | "tool_call"
  | "validation_error"
  | "approval_request"
  | "approval_result"
  | "tool_executing"
  | "tool_result"
  | "tool_error"
  | "retry"
  | "guard"
  | "state_update"
  | "final"
  | "stopped";

/** Which part of the architecture is active (used by diagrams). */
export type Component =
  | "ui"
  | "instructions"
  | "model"
  | "context"
  | "tools"
  | "executor"
  | "external"
  | "state"
  | "database"
  | "retrieval"
  | "workflow"
  | "approval"
  | "safety"
  | "evaluation"
  | "logs"
  | "cloud";

export interface TraceEvent {
  index: number;
  step: number;
  kind: TraceKind;
  title: string;
  detail: string;
  /** Raw data to inspect (request JSON, arguments, result...). */
  data?: unknown;
  /** Architecture path the event travels: e.g. ["executor","tools","database"]. */
  path: Component[];
  /** Name of the code region in loop.ts responsible for this event. */
  code: string;
  /** Snapshot of agent state after this event. */
  state: AgentStateSnapshot;
  severity?: "info" | "ok" | "warn" | "error";
}

export type AgentStatus = "running" | "done" | "stopped" | "failed";

export interface AgentStateSnapshot {
  step: number;
  status: AgentStatus;
  stopReason?: string;
  messages: number;
  toolCalls: number;
  tokens: Usage;
  /** Facts the loop has learned, in plain language. */
  facts: string[];
  orderIds: string[];
}

export interface AgentRun {
  task: string;
  trace: TraceEvent[];
  final: AgentStateSnapshot;
  answer?: string;
  messages: Message[];
}

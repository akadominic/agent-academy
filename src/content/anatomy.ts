import type { Component } from "@/engine/agent/types";

/**
 * AGENT ANATOMY: the 16 parts of a production AI agent.
 * Positions are in the explorer's SVG coordinate space (viewBox 0 0 1120 640).
 */

export type PartKind = "people" | "model" | "tool" | "data" | "control" | "safety" | "cloud";

export interface AnatomyPart {
  id: Component;
  label: string;
  kind: PartKind;
  x: number;
  y: number;
  w?: number;
  /** Module where this part becomes understandable. */
  module: string;
  /** Lesson (or module) to open. */
  href: string;
  what: string;
  analogy: string;
  inputs: string[];
  outputs: string[];
  codeRef?: string;
  /** Present from the very start (Module 0's simple picture of an agent). */
  core?: boolean;
}

export const PARTS: AnatomyPart[] = [
  {
    id: "ui", label: "User interface", kind: "people", x: 20, y: 230, w: 120, module: "m1", href: "/learn/m1/m1-l2", core: true,
    what: "Where a person talks to the agent: a chat box, a WhatsApp-style message, a form or a dashboard. It sends the request to your backend and shows the result, progress and any questions back to the person.",
    analogy: "The shop counter where customers place orders and collect their goods.",
    inputs: ["What the person types or clicks", "Results and status from the backend"],
    outputs: ["An HTTP request to your backend", "The answer, sources and approval prompts shown on screen"],
  },
  {
    id: "instructions", label: "Instructions", kind: "control", x: 195, y: 50, module: "m4", href: "/learn/m4/m4-l1", core: true,
    what: "The system prompt: the developer's standing instructions describing the agent's role, rules and limits. It is sent with every single model request.",
    analogy: "The shop's written rules taped behind the counter: 'Always check the stock book before promising anything.'",
    inputs: ["Written by you, the engineer"],
    outputs: ["The 'system' part of every model request"],
  },
  {
    id: "context", label: "Context", kind: "model", x: 405, y: 50, module: "m3", href: "/learn/m3/m3-l3",
    what: "Everything sent to the model in one request: instructions + conversation so far + tool results + retrieved documents + tool descriptions. The model knows nothing about your situation except what is in the context.",
    analogy: "The folder of papers you hand a consultant before asking their advice. If it is not in the folder, they cannot use it.",
    inputs: ["Instructions", "Conversation history from state", "Retrieved passages", "Tool descriptions"],
    outputs: ["One model request (counted in tokens, so it costs money)"],
  },
  {
    id: "model", label: "Language model", kind: "model", x: 885, y: 80, module: "m3", href: "/learn/m3/m3-l1", core: true, codeRef: "sim-policy",
    what: "The LLM, usually hosted by an AI provider and reached through an API. Given the context, it returns either a final answer or a structured request to call one of your tools. It does not run tools, remember past requests, or check its own facts.",
    analogy: "A very well-read advisor in another building. You send them a folder; they send back a recommendation. They never touch your stock book.",
    inputs: ["Context (one request)"],
    outputs: ["Final text, or proposed tool calls with arguments", "Usage: input and output token counts"],
  },
  {
    id: "retrieval", label: "Retrieval (RAG)", kind: "data", x: 615, y: 50, module: "m9", href: "/learn/m9",
    what: "Finds the most relevant passages from your documents (policies, manuals, price lists) and adds them to the context, so answers can be grounded and cited instead of guessed.",
    analogy: "A school librarian who fetches the three most useful pages before you answer an exam question — open book, not memory.",
    inputs: ["The question", "Your documents, split into chunks and indexed"],
    outputs: ["Top-ranked passages with their sources"],
  },
  {
    id: "state", label: "Memory / state", kind: "data", x: 195, y: 200, module: "m7", href: "/learn/m7/m7-l2",
    what: "What the running agent currently knows: the conversation, tool results, step count, status. Short-term state lives for one task; longer-term memory is saved to a database on purpose.",
    analogy: "The order slip the shop assistant fills in as they go — what was asked, what was checked, what is still to do.",
    inputs: ["Each tool result", "Each model reply"],
    outputs: ["Conversation history for the next request", "Checkpoints saved to the database"],
  },
  {
    id: "workflow", label: "Agent loop", kind: "control", x: 405, y: 200, module: "m7", href: "/learn/m7/m7-l1", core: true, codeRef: "agent-loop",
    what: "Your code that runs the show: build the context, call the model, check proposed actions, run tools, update state, decide whether to continue — and stop on a final answer, a step limit, or an error.",
    analogy: "The dispatcher at the boda-boda stage: takes the request, decides who goes where, follows up, and closes the job.",
    inputs: ["The task", "Model replies", "Tool results"],
    outputs: ["Model requests", "Tool calls to execute", "The final result"],
  },
  {
    id: "tools", label: "Available tools", kind: "tool", x: 615, y: 200, module: "m6", href: "/learn/m6/m6-l1", core: true, codeRef: "tool-inventory",
    what: "The list of functions this agent is allowed to request — each with a name, a description and an input schema. The model only sees these descriptions; it never sees the code.",
    analogy: "The menu of services the dispatcher may book: 'deliver parcel', 'check rider availability'. Nothing off the menu.",
    inputs: ["Tool definitions written by you"],
    outputs: ["Tool descriptions for the context", "The allowed set the executor checks against"],
  },
  {
    id: "database", label: "Database", kind: "data", x: 195, y: 350, module: "m1", href: "/learn/m1/m1-l4", codeRef: "tool-order",
    what: "Durable storage: products, stock, orders, customers, saved agent state. Survives restarts. Tools read and write it; the model never touches it directly.",
    analogy: "The shop's ledger and stock book, kept in a locked cupboard.",
    inputs: ["Queries and writes from tools"],
    outputs: ["Rows of data", "Confirmation that a write happened"],
  },
  {
    id: "safety", label: "Safety controls", kind: "safety", x: 405, y: 350, module: "m6", href: "/learn/m6/m6-l3", codeRef: "agent-checks",
    what: "Checks in code that the model cannot talk its way past: allowed tools only, schema validation, loop guards, step and spending limits, treating tool output as data, and approval for risky actions.",
    analogy: "The bank teller's checklist: verify ID, check the balance, get a supervisor's signature above a limit — no matter how convincing the customer is.",
    inputs: ["Every proposed tool call", "Every tool result"],
    outputs: ["Allow / reject / ask a human / stop"],
  },
  {
    id: "executor", label: "Tool executor", kind: "control", x: 615, y: 350, module: "m6", href: "/learn/m6/m6-l2", codeRef: "agent-execute",
    what: "The code that actually runs an approved tool call: real function, real arguments, with a timeout, limited retries and idempotency keys for writes. Its result becomes the model's next observation.",
    analogy: "The rider who actually carries the parcel, once the dispatcher has assigned it.",
    inputs: ["A validated, approved tool call"],
    outputs: ["The tool's result or a clear error"],
  },
  {
    id: "external", label: "External APIs", kind: "tool", x: 885, y: 410, module: "m5", href: "/learn/m5/m5-l1",
    what: "Other companies' services your tools call: SMS, payments, mobile money, maps, email, calendars. Reached over HTTP with API keys that stay on your server.",
    analogy: "Partner businesses you phone on the customer's behalf — the transport company, the mobile money agent.",
    inputs: ["HTTP requests from your tools"],
    outputs: ["HTTP responses: data, confirmations or errors"],
  },
  {
    id: "approval", label: "Human approval", kind: "people", x: 20, y: 470, w: 120, module: "m6", href: "/learn/m6/m6-l3",
    what: "A pause before risky or irreversible actions (creating orders, sending money, deleting data) so a responsible person can approve or reject. Nothing happens until they decide.",
    analogy: "Mama Achen looking over the quotation before the order is confirmed.",
    inputs: ["A proposed action with its details"],
    outputs: ["Approve or reject (recorded in logs)"],
  },
  {
    id: "evaluation", label: "Evaluation", kind: "control", x: 195, y: 500, module: "m12", href: "/learn/m12",
    what: "Automated tests that run the agent on many realistic tasks with known correct outcomes, so you can measure how often it works — and catch it getting worse after a change.",
    analogy: "Marking a stack of exam scripts against a marking guide, instead of judging a student by one good answer.",
    inputs: ["Test cases with expected outcomes", "Agent traces"],
    outputs: ["Pass rates, failure categories, regressions"],
  },
  {
    id: "logs", label: "Logs & traces", kind: "control", x: 405, y: 500, module: "m7", href: "/learn/m7/m7-l1",
    what: "A step-by-step record of every request, tool call, result, approval and decision. Essential for debugging, auditing and measuring cost.",
    analogy: "The dispatcher's logbook: who went where, when, and what happened.",
    inputs: ["Events from the loop and executor"],
    outputs: ["Searchable history, alerts and evaluation data"],
  },
  {
    id: "cloud", label: "Cloud hosting", kind: "cloud", x: 615, y: 500, module: "m16", href: "/learn/m16",
    what: "The rented computers where your frontend, backend, database and workers run, reachable over the internet with a domain name and HTTPS. Environment variables hold secrets like API keys.",
    analogy: "Renting a stall in a well-run market: electricity, security and an address are provided, you run the business.",
    inputs: ["Your code (deployed from GitHub)", "Configuration and secrets"],
    outputs: ["A public address people can use", "Logs and metrics"],
  },
];

/** Connections drawn in the explorer. `via` = quadratic curve control point. */
export const EDGES: { a: Component; b: Component; via?: [number, number]; label?: string }[] = [
  { a: "ui", b: "workflow", via: [300, 130], label: "request / reply" },
  { a: "instructions", b: "context" },
  { a: "workflow", b: "context", label: "assembles" },
  { a: "retrieval", b: "context" },
  { a: "state", b: "context", label: "history" },
  { a: "context", b: "model", via: [720, -30], label: "API request" },
  { a: "model", b: "workflow", label: "answer or tool call" },
  { a: "workflow", b: "tools" },
  { a: "workflow", b: "state" },
  { a: "workflow", b: "safety" },
  { a: "tools", b: "executor" },
  { a: "safety", b: "executor" },
  { a: "safety", b: "approval", via: [250, 470] },
  { a: "approval", b: "ui", label: "owner's phone" },
  { a: "executor", b: "database", via: [480, 470] },
  { a: "executor", b: "external" },
  { a: "executor", b: "workflow", label: "result" },
  { a: "executor", b: "logs" },
  { a: "state", b: "database", label: "checkpoint" },
  { a: "state", b: "logs" },
  { a: "logs", b: "evaluation" },
];

export const NODE_W = 150;
export const NODE_H = 58;

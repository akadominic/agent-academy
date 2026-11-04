/**
 * "SHOW ME THE CODE" references.
 * Each ref points at a `// #region name` in the app's REAL source
 * (extracted to src/generated/code-regions.json at build time).
 * Notes attach to the first line containing `match`.
 *
 * scaffold: how much help to give — reduces as the learner advances.
 *   full   = every note visible beside the code
 *   guided = notes appear when a highlighted line is clicked
 *   light  = a short summary only; learner reads the code themselves
 */

export interface CodeRef {
  title: string;
  region: string;
  summary: string;
  scaffold: "full" | "guided" | "light";
  notes: { match: string; text: string }[];
}

export const CODE_REFS: Record<string, CodeRef> = {
  "agent-loop": {
    title: "The agent loop (src/engine/agent/loop.ts)",
    region: "loop",
    scaffold: "full",
    summary: "This is the actual loop running in the Agent Brain. Notice that the model is called in exactly one place, and everything else is ordinary code you control.",
    notes: [
      { match: "while (step < config.maxSteps)", text: "The loop runs at most maxSteps times. This single line is what stops a runaway agent from running forever." },
      { match: "const request =", text: "Build the request: system instructions, every message so far, and the list of tool descriptions." },
      { match: "await config.model.complete", text: "The ONLY place the model is involved. It returns either a final answer or proposed tool calls." },
      { match: 'response.type === "final"', text: "If the model says it is finished, record the answer and leave the loop." },
      { match: "messages.push({ role: \"assistant\"", text: "Remember what the model proposed, so the next request includes it." },
      { match: "for (const call of response.calls)", text: "Handle each proposed tool call — the model may propose several at once." },
      { match: "handleToolCall(call)", text: "Our code checks and runs the tool. Look at the 'checks' and 'execute' regions for what happens inside." },
    ],
  },
  "agent-checks": {
    title: "Checks before a tool runs (loop.ts)",
    region: "checks",
    scaffold: "full",
    summary: "Four gates every proposed tool call must pass before anything happens in the real world.",
    notes: [
      { match: "toolsByName.get(call.name)", text: "Gate 1: the tool must exist in THIS agent's tool list. A model cannot invent new powers." },
      { match: "validate(tool.inputSchema, call.arguments)", text: "Gate 2: the arguments must match the schema. Bad arguments are returned to the model as an error it can fix." },
      { match: "seenCalls.has(signature)", text: "Gate 3: the loop guard. Asking for exactly the same thing twice means no progress, so we stop." },
      { match: 'tool.sideEffect === "write"', text: "Gate 4: anything that changes data waits for a human." },
    ],
  },
  "agent-execute": {
    title: "Running the tool (loop.ts)",
    region: "execute",
    scaffold: "guided",
    summary: "Your server runs the real function, with an idempotency key, a timeout and limited retries.",
    notes: [
      { match: "args.idempotencyKey", text: "The key is made by our code from the task and call. A retry produces the same key, so the server can recognise it." },
      { match: "attempt <= config.maxRetries + 1", text: "Try once, plus a limited number of retries. Never retry forever." },
      { match: "executeWithTimeout", text: "Run the real tool function, but give up if it takes too long." },
      { match: "reply(call, { ok: true, result })", text: "Add the result to the conversation as a 'tool' message the model will read next step." },
      { match: "retryable && attempt", text: "Only temporary failures are retried. A permanent error is reported back instead." },
    ],
  },
  "tool-inventory": {
    title: "A tool definition: check_inventory (src/engine/market/tools.ts)",
    region: "tool-inventory",
    scaffold: "full",
    summary: "A tool is a name, a description, an input schema — and an ordinary function. The model only ever sees the first three.",
    notes: [
      { match: 'name: "check_inventory"', text: "The name the model uses to ask for this tool." },
      { match: "description:", text: "The description is how the model decides WHEN to use the tool. Write it like instructions to a new employee." },
      { match: "inputSchema:", text: "The input schema says exactly what arguments are allowed. Our loop validates against it." },
      { match: 'sideEffect: "none"', text: "Read-only: it changes nothing, so it is safe to run without approval." },
      { match: "async execute(args, ctx)", text: "The real code. It runs on YOUR server, never inside the model." },
      { match: "store.stock[id]", text: "Reads the stock from the (mock) database." },
    ],
  },
  "tool-order": {
    title: "A write tool with idempotency: create_order (tools.ts)",
    region: "tool-order",
    scaffold: "guided",
    summary: "This tool changes data, so it is marked as a write tool and recognises repeated idempotency keys.",
    notes: [
      { match: 'sideEffect: "write"', text: "Marked as a write: the loop will require human approval before it runs." },
      { match: "store.seenKeys[key]", text: "If we have seen this idempotency key before, return the existing order instead of creating a second one." },
      { match: "store.stock[l.productId] =", text: "The side effect: stock is reserved." },
      { match: "store.orders.push", text: "The order is written to the database." },
    ],
  },
  "json-validate": {
    title: "Schema validation (src/engine/agent/jsonSchema.ts)",
    region: "validate",
    scaffold: "guided",
    summary: "A small JSON Schema validator. Each numbered block checks one kind of rule.",
    notes: [
      { match: "// 1.", text: "Check the type first: string, number, object…" },
      { match: "// 2.", text: "Enums: only listed values are allowed." },
      { match: "// 6.", text: "Objects: required fields, unknown fields, and each field's own rules (recursively)." },
    ],
  },
  "timeout": {
    title: "Timeouts (loop.ts)",
    region: "timeout",
    scaffold: "light",
    summary: "Promise.race lets the tool and a timer compete: whichever finishes first wins. The fault switches let labs simulate slow or broken services.",
    notes: [
      { match: "Promise.race", text: "Whichever promise settles first decides the outcome." },
      { match: "f.lostResponse", text: "Simulates the nasty case: the action happened, but we never heard back." },
    ],
  },
  "sim-policy": {
    title: "The simulated model's rules (simulatedModel.ts)",
    region: "sim-policy",
    scaffold: "light",
    summary: "Proof that the simulated model is NOT AI: it is a list of if-statements producing responses in the same shape a real model API returns.",
    notes: [
      { match: "Step A", text: "Rule: look up each product mentioned." },
      { match: "Step B", text: "Rule: check stock for everything found." },
      { match: "Step C", text: "Rule: ask code for the total." },
      { match: "Step E", text: "Rule: write the answer only from tool results." },
    ],
  },
  "model-route": {
    title: "This app's secure model route (src/app/api/model/route.ts)",
    region: "model-route",
    scaffold: "guided",
    summary: "The browser calls this route; only the server holds the API key. It is off unless configured, checks the request, applies limits, then calls the provider.",
    notes: [
      { match: "if (!cfg.enabled)", text: "Live AI is OFF unless the server has LIVE_AI_ENABLED=true and a provider key. The course never depends on it." },
      { match: "x-access-code", text: "Optional access code so strangers cannot spend your money on a public deployment." },
      { match: "MAX_REQUEST_CHARS", text: "Reject oversized requests before paying for them." },
      { match: "checkLimits(clientIp", text: "Rate limit per visitor plus a daily cap." },
      { match: "callModel(provider, request", text: "Only now is the paid provider called — from the server, with the server's key." },
    ],
  },
  "anthropic-call": {
    title: "Calling the Anthropic Messages API with tools (src/server/llm.ts)",
    region: "anthropic-call",
    scaffold: "light",
    summary: "Translates the course's neutral message format into the provider's format (tool calls and results as content blocks), makes the HTTPS request and translates the reply back.",
    notes: [
      { match: "tool_result", text: "Tool results go back to the model inside a user message, linked by tool_use_id." },
      { match: "x-api-key", text: "The key comes from the server's environment, never the browser." },
      { match: "input_schema", text: "Your tool's JSON Schema, passed as the tool's input_schema." },
      { match: 'b.type === "tool_use"', text: "Proposed tool calls come back as tool_use blocks." },
    ],
  },
};

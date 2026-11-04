import type { ProjectDef } from "../schema";

/* ======================================================================
   PROJECT 4 — Inventory Assistant
   Unlocked after Module 7. A full loop with check_inventory and
   calculate_quote, errors as observations, retries with a limit,
   maxSteps, and a check that the final answer uses only tool results.
   Exercise code is plain JavaScript with no backticks.
   ====================================================================== */

const DATA = `// Mama Achen's stock and prices (from the course's shop; prices illustrative).
const PRODUCTS = {
  "rice-25": { name: "Rice (25 kg bag)", priceUGX: 110000 },
  "sugar-1": { name: "Sugar (1 kg)", priceUGX: 5500 },
  "oil-1": { name: "Cooking oil (1 litre)", priceUGX: 8000 },
  "beans-1": { name: "Beans (1 kg)", priceUGX: 5000 },
  "eggs-tray": { name: "Eggs (tray of 30)", priceUGX: 13500 },
};
const STOCK = { "rice-25": 12, "sugar-1": 35, "oil-1": 24, "beans-1": 60, "eggs-tray": 0 };
const DELIVERY_FEE_UGX = 5000; // flat Kampala delivery (illustrative)

// The stock service sometimes drops the connection. Tests set failNext
// to make the next N lookups fail with a TEMPORARY (retryable) error.
const STOCK_SERVICE = { failNext: 0 };
function lookupStock(productId) {
  if (STOCK_SERVICE.failNext > 0) {
    STOCK_SERVICE.failNext -= 1;
    const err = new Error("Stock service: connection reset");
    err.retryable = true;
    throw err;
  }
  return STOCK[productId];
}
`;

const TOOLS_SOLUTION = `// ---- Tools: ordinary functions YOUR code owns ----
function checkInventory(args) {
  if (!Object.hasOwn(PRODUCTS, args.productId)) throw new Error("Unknown productId: " + args.productId);
  const inStock = lookupStock(args.productId);
  return { productId: args.productId, requested: args.quantity, inStock: inStock, available: inStock >= args.quantity };
}

function calculateQuote(args) {
  const lines = args.lines.map((l) => {
    if (!Object.hasOwn(PRODUCTS, l.productId)) throw new Error("Unknown productId: " + l.productId);
    return { productId: l.productId, quantity: l.quantity, lineTotalUGX: PRODUCTS[l.productId].priceUGX * l.quantity };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalUGX, 0);
  const deliveryFeeUGX = args.delivery ? DELIVERY_FEE_UGX : 0;
  return { lines: lines, deliveryFeeUGX: deliveryFeeUGX, totalUGX: subtotal + deliveryFeeUGX };
}

const TOOLS = { check_inventory: checkInventory, calculate_quote: calculateQuote };
`;

const TOOLS_STARTER = `// ---- Tools: ordinary functions YOUR code owns ----

// TODO: throw new Error("Unknown productId: <id>") if PRODUCTS has no such id.
function checkInventory(args) {
  const inStock = lookupStock(args.productId);
  return { productId: args.productId, requested: args.quantity, inStock: inStock, available: inStock >= args.quantity };
}

// TODO: calculate an exact quote IN CODE (never let a model do arithmetic).
// args: { lines: [ { productId, quantity } ], delivery: true/false }
// return {
//   lines: [ { productId, quantity, lineTotalUGX } ],
//   deliveryFeeUGX: DELIVERY_FEE_UGX if delivery, else 0,
//   totalUGX: sum of lineTotalUGX + deliveryFeeUGX
// }
// Throw new Error("Unknown productId: <id>") for an unknown product.
function calculateQuote(args) {
}

const TOOLS = { check_inventory: checkInventory, calculate_quote: calculateQuote };
`;

const RETRY_SOLUTION = `// ---- Retries with a limit, and a safe executor ----
const MAX_RETRIES = 1;

async function withRetries(fn, maxRetries) {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return await fn();
    } catch (err) {
      // Only TEMPORARY errors are retried, and only maxRetries times.
      if (!err.retryable || attempt > maxRetries) throw err;
    }
  }
}

async function executeTool(name, args) {
  if (!Object.hasOwn(TOOLS, name)) return { ok: false, error: "Unknown tool: " + name };
  try {
    const result = await withRetries(() => TOOLS[name](args), MAX_RETRIES);
    return { ok: true, result: result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
`;

const RETRY_STARTER = `// ---- Retries with a limit, and a safe executor ----
const MAX_RETRIES = 1;

// TODO: call fn(). If it throws an error with err.retryable === true, try
// again, but at most maxRetries extra times. Re-throw non-retryable errors
// at once, and re-throw the last error once the retries are used up.
async function withRetries(fn, maxRetries) {
  return await fn();
}

// TODO: return { ok: false, error: "Unknown tool: <name>" } for unknown tools.
// Run the tool through withRetries(..., MAX_RETRIES). Success -> { ok: true, result }.
// Any error that is still thrown -> { ok: false, error: err.message }. Never crash.
async function executeTool(name, args) {
  const result = await TOOLS[name](args);
  return { ok: true, result: result };
}

// Test helper: a function that fails "failures" times, then returns value.
function makeFlaky(failures, value) {
  const state = { calls: 0 };
  state.fn = async () => {
    state.calls += 1;
    if (state.calls <= failures) {
      const err = new Error("Connection reset");
      err.retryable = true;
      throw err;
    }
    return value;
  };
  return state;
}
`;

const FLAKY_HELPER = `// Test helper: a function that fails "failures" times, then returns value.
function makeFlaky(failures, value) {
  const state = { calls: 0 };
  state.fn = async () => {
    state.calls += 1;
    if (state.calls <= failures) {
      const err = new Error("Connection reset");
      err.retryable = true;
      throw err;
    }
    return value;
  };
  return state;
}
`;

const FAKE_MODEL = `// ---------------- GIVEN: a FAKE model ----------------
// NOT AI. Fixed rules that reply like a model API:
//   { type: "tool_call", name, args }  or  { type: "final", text }
// It reads only the messages you pass it, as a real model would.
function money(n) { return "UGX " + n.toLocaleString("en-US"); }

function fakeModel(messages) {
  const task = messages[0].content.toLowerCase();
  const seen = messages.filter((m) => m.role === "tool").map((m) => ({ name: m.name, obs: JSON.parse(m.content) }));
  const last = seen[seen.length - 1];
  const words = task.split(" ");
  const quantity = words.map(Number).find((n) => Number.isInteger(n) && n > 0) || 1;
  const ids = { rice: "rice-25", sugar: "sugar-1", oil: "oil-1", beans: "beans-1", eggs: "eggs-tray", gold: "gold-1" };
  const word = Object.keys(ids).find((w) => task.includes(w));
  const delivery = task.includes("deliver");

  if (!word) return { type: "final", text: "Which product would you like, and how many?" };
  const productId = ids[word];

  if (task.includes("forever")) {
    // A misbehaving model: it keeps checking and never answers.
    return { type: "tool_call", name: "check_inventory", args: { productId: productId, quantity: quantity } };
  }
  if (last && !last.obs.ok) {
    return { type: "final", text: "Sorry, I couldn't complete that check right now (" + last.obs.error + "). I haven't promised anything." };
  }
  const inv = seen.find((s) => s.name === "check_inventory");
  if (!inv) return { type: "tool_call", name: "check_inventory", args: { productId: productId, quantity: quantity } };
  if (!inv.obs.result.available) {
    return { type: "final", text: "Sorry, we only have " + inv.obs.result.inStock + " of that in stock right now." };
  }
  const quote = seen.find((s) => s.name === "calculate_quote");
  if (!quote) return { type: "tool_call", name: "calculate_quote", args: { lines: [{ productId: productId, quantity: quantity }], delivery: delivery } };

  const q = quote.obs.result;
  if (task.includes("cheap delivery")) {
    // A careless model: it invents a "special" delivery price no tool gave.
    return { type: "final", text: "Yes, in stock. Total " + money(q.totalUGX - 2000) + " with our special delivery price of UGX 3,000." };
  }
  let text = "Yes, " + quantity + " in stock. Total " + money(q.totalUGX);
  if (q.deliveryFeeUGX > 0) text += " including delivery of " + money(q.deliveryFeeUGX);
  return { type: "final", text: text + "." };
}
`;

const LOOP_SOLUTION = `// ---- The agent loop ----
async function runAgent(task, options = {}) {
  const maxSteps = options.maxSteps ?? 6;
  const messages = [{ role: "user", content: task }];
  const observations = [];
  const log = [];
  let steps = 0;

  while (steps < maxSteps) {
    steps += 1;
    const reply = fakeModel(messages);
    if (reply.type === "final") {
      log.push("final: " + reply.text);
      return { status: "done", answer: reply.text, steps: steps, log: log, observations: observations };
    }
    log.push("call " + reply.name);
    messages.push({ role: "assistant", toolCall: { name: reply.name, args: reply.args } });
    const observation = await executeTool(reply.name, reply.args);
    observations.push(observation);
    log.push(observation.ok ? "ok " + reply.name : "error " + observation.error);
    messages.push({ role: "tool", name: reply.name, content: JSON.stringify(observation) });
  }
  log.push("stopped: reached maxSteps (" + maxSteps + ")");
  return { status: "stopped", answer: null, steps: steps, log: log, observations: observations };
}
`;

const LOOP_STARTER = `// ---- The agent loop ----
// Return { status, answer, steps, log, observations }:
//   status "done" with the model's final text, or
//   status "stopped" with answer null once maxSteps (default 6) is reached.
// Each step: ask fakeModel(messages); on a final reply, return.
// Otherwise push { role: "assistant", toolCall: { name, args } }, run
// await executeTool(name, args), keep the observation in "observations",
// and push { role: "tool", name, content: JSON.stringify(observation) }.
// Log lines: "call <name>", then "ok <name>" or "error <message>",
// "final: <text>", or "stopped: reached maxSteps (<n>)".
async function runAgent(task, options = {}) {
  const maxSteps = options.maxSteps ?? 6;
  const messages = [{ role: "user", content: task }];
  const observations = [];
  const log = [];
  let steps = 0;
  // TODO
  return { status: "stopped", answer: null, steps: steps, log: log, observations: observations };
}
`;

const CHECK_HELPERS = `// ---- Helpers for checking the final answer ----
// Every amount written as "UGX 1,234" in a text, as numbers.
function amountsIn(text) {
  const found = [];
  for (const match of text.matchAll(/UGX ([0-9][0-9,]*)/g)) {
    found.push(Number(match[1].split(",").join("")));
  }
  return found;
}

// Every number found anywhere inside a value (objects, arrays, nested).
function numbersIn(value, out = []) {
  if (typeof value === "number") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => numbersIn(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => numbersIn(v, out));
  return out;
}
`;

const CHECK_SOLUTION = `// Amounts in the answer that NO successful tool result contains.
function unsupportedAmounts(answer, observations) {
  const known = numbersIn(observations.filter((o) => o.ok).map((o) => o.result));
  return amountsIn(answer).filter((amount) => !known.includes(amount));
}
`;

const CHECK_STARTER = `// TODO: return every amount in the answer (use amountsIn) that does not
// appear in any SUCCESSFUL observation's result (use numbersIn on the
// results of observations where ok is true). Keep the answer's order.
function unsupportedAmounts(answer, observations) {
  return [];
}
`;

const FINAL_SOLUTION = `// ---- The full assistant: loop + grounding check ----
async function runAssistant(task, options = {}) {
  const run = await runAgent(task, options);
  if (run.status !== "done") return run;
  const flagged = unsupportedAmounts(run.answer, run.observations);
  if (flagged.length > 0) {
    run.log.push("blocked: amounts not from tools " + JSON.stringify(flagged));
    return {
      status: "needs_review",
      answer: "Let me ask Mama Achen to confirm this price before I send it.",
      flagged: flagged,
      steps: run.steps,
      log: run.log,
      observations: run.observations,
    };
  }
  return run;
}
`;

const FINAL_STARTER = `// ---- The full assistant: loop + grounding check ----
// TODO: after a "done" run, check the answer with unsupportedAmounts.
// If any amounts are unsupported, DON'T send the model's answer. Return
//   { status: "needs_review",
//     answer: "Let me ask Mama Achen to confirm this price before I send it.",
//     flagged: <the unsupported amounts>, steps, log, observations }
// Otherwise return the run unchanged. Runs that did not finish are returned as they are.
async function runAssistant(task, options = {}) {
  const run = await runAgent(task, options);
  return run;
}
`;

const BASE_3 = DATA + "\n" + TOOLS_SOLUTION + "\n" + RETRY_SOLUTION + "\n" + FAKE_MODEL;

export const p4: ProjectDef = {
  id: "p4",
  number: 4,
  title: "Inventory Assistant",
  moduleId: "m7",
  focus: "The agent loop, tool execution and error handling",
  brief:
    "Build the assistant that answers “Do you have 3 bags of rice? Deliver please.” end to end. It checks stock with `check_inventory`, prices the order with `calculate_quote` (arithmetic in code, never in the model), and keeps working when things break: a tool that throws becomes an **observation**, a flaky stock service is **retried a limited number of times**, a model that never finishes is stopped by **maxSteps**, and the final answer is only sent if **every UGX amount in it came from a tool result**. As in Module 7, the model is a deterministic fake, clearly marked, so every run is free and repeatable.",
  architecture: [
    { label: "Customer task", kind: "people", note: "“Do you have 3 bags of rice? Deliver please.”" },
    { label: "Agent loop", kind: "control", note: "runAgent: asks the model, executes tools, appends observations, stops at maxSteps" },
    { label: "Model (fake)", kind: "model", note: "Proposes check_inventory, then calculate_quote, then a final answer" },
    { label: "Executor + retries", kind: "safety", note: "Unknown tools and thrown errors become observations; temporary errors are retried once" },
    { label: "Tools", kind: "tool", note: "check_inventory, calculate_quote: exact arithmetic in code" },
    { label: "Stock service", kind: "data", note: "Stock levels; sometimes drops the connection" },
    { label: "Grounding check", kind: "safety", note: "Blocks answers whose UGX amounts no tool produced" },
  ],
  prerequisites: ["m7-l1", "m7-l2", "m7-l3", "m7-l4"],
  steps: [
    {
      id: "tools",
      title: "Write the two tools",
      blocks: [
        { type: "p", text: "Tools are ordinary functions. `check_inventory` reads the stock service. `calculate_quote` does the sums. A model is good with language and unreliable with arithmetic, so totals are always computed in code." },
        { type: "exercise", exercise: {
          id: "p4-tools",
          title: "checkInventory and calculateQuote",
          brief: "Add the unknown-product check to `checkInventory`, and write `calculateQuote({ lines, delivery })` returning `{ lines: [{ productId, quantity, lineTotalUGX }], deliveryFeeUGX, totalUGX }`. Delivery adds `DELIVERY_FEE_UGX` (UGX 5,000).",
          starter: DATA + "\n" + TOOLS_STARTER,
          solution: DATA + "\n" + TOOLS_SOLUTION,
          tests: [
            { name: "rice is in stock", expr: `checkInventory({ productId: "rice-25", quantity: 3 })`, expected: { productId: "rice-25", requested: 3, inStock: 12, available: true } },
            { name: "eggs are not", expr: `checkInventory({ productId: "eggs-tray", quantity: 2 }).available`, expected: false },
            { name: "unknown products throw", expr: `checkInventory({ productId: "gold-1", quantity: 1 })`, throws: "Unknown productId: gold-1" },
            { name: "3 bags of rice delivered = UGX 335,000", expr: `calculateQuote({ lines: [{ productId: "rice-25", quantity: 3 }], delivery: true })`, expected: { lines: [{ productId: "rice-25", quantity: 3, lineTotalUGX: 330000 }], deliveryFeeUGX: 5000, totalUGX: 335000 } },
            { name: "2 kg sugar + 1 oil, no delivery = UGX 19,000", expr: `calculateQuote({ lines: [{ productId: "sugar-1", quantity: 2 }, { productId: "oil-1", quantity: 1 }], delivery: false }).totalUGX`, expected: 19000 },
            { name: "quotes reject unknown products", expr: `calculateQuote({ lines: [{ productId: "gold-1", quantity: 1 }], delivery: false })`, throws: "Unknown productId: gold-1" },
          ],
          hints: [
            "Unknown check: `if (!Object.hasOwn(PRODUCTS, args.productId)) throw new Error(\"Unknown productId: \" + args.productId);`",
            "Use `args.lines.map(…)` to build each line, with `PRODUCTS[l.productId].priceUGX * l.quantity` as its total.",
            "Add the line totals with `reduce`, or with a simple loop.",
          ],
        } },
      ],
    },
    {
      id: "retries",
      title: "A safe executor with limited retries",
      blocks: [
        { type: "p", text: "The stock service sometimes drops the connection. That is a **temporary** failure: trying again usually works. An unknown product is a **permanent** failure: trying again will never help. Retry only the first kind, and only a limited number of times. Both tools here are read-only, so retrying them is safe. (Write tools would also need idempotency keys, lesson 6.4.)" },
        { type: "exercise", exercise: {
          id: "p4-retries",
          title: "withRetries and executeTool",
          brief: "Write `withRetries(fn, maxRetries)`: it retries only errors with `err.retryable === true`, at most `maxRetries` extra times, then re-throws. Then make `executeTool(name, args)` safe: unknown tools and errors become `{ ok: false, error }`, and tools run through `withRetries(…, MAX_RETRIES)`. Tests set `STOCK_SERVICE.failNext` to make the stock service fail.",
          starter: DATA + "\n" + TOOLS_SOLUTION + "\n" + RETRY_STARTER,
          solution: DATA + "\n" + TOOLS_SOLUTION + "\n" + RETRY_SOLUTION + "\n" + FLAKY_HELPER,
          tests: [
            { name: "one failure, then success (2 calls)", expr: `(async () => { const f = makeFlaky(1, "ok"); const v = await withRetries(f.fn, 2); return [v, f.calls]; })()`, expected: ["ok", 2] },
            { name: "two failures with maxRetries 2 still succeeds (3 calls)", expr: `(async () => { const f = makeFlaky(2, "ok"); const v = await withRetries(f.fn, 2); return [v, f.calls]; })()`, expected: ["ok", 3] },
            { name: "gives up after the limit and re-throws", expr: `withRetries(makeFlaky(5, "ok").fn, 2)`, throws: "Connection reset" },
            { name: "…having tried exactly 3 times, not forever", expr: `(async () => { const f = makeFlaky(5, "ok"); try { await withRetries(f.fn, 2); } catch (e) {} return f.calls; })()`, expected: 3 },
            { name: "permanent errors are not retried", expr: `(async () => { let calls = 0; const fn = async () => { calls += 1; throw new Error("Unknown productId: gold-1"); }; try { await withRetries(fn, 2); } catch (e) {} return calls; })()`, expected: 1 },
            { name: "executeTool survives one dropped connection", expr: `(async () => { STOCK_SERVICE.failNext = 1; return executeTool("check_inventory", { productId: "rice-25", quantity: 3 }); })()`, expected: { ok: true, result: { productId: "rice-25", requested: 3, inStock: 12, available: true } } },
            { name: "executeTool reports a service that stays down", expr: `(async () => { STOCK_SERVICE.failNext = 5; const r = await executeTool("check_inventory", { productId: "rice-25", quantity: 3 }); STOCK_SERVICE.failNext = 0; return r; })()`, expected: { ok: false, error: "Stock service: connection reset" } },
            { name: "executeTool refuses unknown tools", expr: `executeTool("create_order", {})`, expected: { ok: false, error: "Unknown tool: create_order" } },
          ],
          hints: [
            "Keep an `attempt` counter. Loop: `attempt += 1; try { return await fn(); } catch (err) { … }`",
            "Inside catch: `if (!err.retryable || attempt > maxRetries) throw err;` Otherwise let the loop go round again.",
            "In executeTool: check `Object.hasOwn(TOOLS, name)` first, then `try { const result = await withRetries(() => TOOLS[name](args), MAX_RETRIES); … } catch (err) { … }`",
          ],
        } },
      ],
    },
    {
      id: "loop",
      title: "The loop, with maxSteps",
      blocks: [
        { type: "p", text: "Now the loop from lesson 7.4, using your safe executor. It also keeps a list of every **observation**, which you will need in step 4 to check the final answer." },
        { type: "callout", tone: "sim", text: "`fakeModel` is a rule-based stand-in, not AI. It finds a product word and the first number in the task. A task containing “forever” makes it misbehave on purpose, and so does “cheap delivery” (you'll see how in step 4)." },
        { type: "exercise", exercise: {
          id: "p4-loop",
          title: "runAgent(task, { maxSteps })",
          brief: "Write the loop as described in the comments. It must finish normal tasks, report failures through the model, and stop with `status: \"stopped\"` at `maxSteps`.",
          starter: BASE_3 + "\n" + LOOP_STARTER,
          solution: BASE_3 + "\n" + LOOP_SOLUTION,
          tests: [
            { name: "3 bags of rice, delivered", expr: `runAgent("Do you have 3 bags of rice? Deliver please.").then((r) => [r.status, r.answer, r.steps])`, expected: ["done", "Yes, 3 in stock. Total UGX 335,000 including delivery of UGX 5,000.", 3] },
            { name: "out of stock ends after one tool", expr: `runAgent("I need 2 trays of eggs").then((r) => [r.answer, r.steps])`, expected: ["Sorry, we only have 0 of that in stock right now.", 2] },
            { name: "an unknown product becomes an honest answer", expr: `runAgent("5 bars of gold please").then((r) => r.answer)`, expected: "Sorry, I couldn't complete that check right now (Unknown productId: gold-1). I haven't promised anything." },
            { name: "a runaway model is stopped at maxSteps", expr: `runAgent("Check rice forever", { maxSteps: 4 }).then((r) => [r.status, r.answer, r.steps, r.log.at(-1)])`, expected: ["stopped", null, 4, "stopped: reached maxSteps (4)"] },
            { name: "observations are collected", expr: `runAgent("Do you have 3 bags of rice? Deliver please.").then((r) => r.observations.map((o) => o.ok))`, expected: [true, true] },
          ],
          hints: [
            "Same shape as lesson 7.4, but `executeTool` is async: `const observation = await executeTool(reply.name, reply.args);`",
            "Push each observation into `observations` as well as into `messages` (as JSON text).",
            "After the while loop: push the stopped log line and return `status: \"stopped\"`.",
          ],
        } },
      ],
    },
    {
      id: "grounding",
      title: "Check that every amount came from a tool",
      blocks: [
        { type: "p", text: "A model can write a confident number that no tool produced: a “special delivery price”, a rounded total, a remembered price from somewhere else. Your code can catch this. Every UGX amount in the answer must appear in a **successful** tool result. Two helpers are provided: `amountsIn(text)` finds amounts like “UGX 335,000”, and `numbersIn(value)` collects every number inside a result." },
        { type: "exercise", exercise: {
          id: "p4-unsupported-amounts",
          title: "unsupportedAmounts(answer, observations)",
          brief: "Return the amounts in `answer` (in order) that do not appear in any observation with `ok: true`. Results from failed observations don't count as evidence.",
          starter: CHECK_HELPERS + "\n" + CHECK_STARTER,
          solution: CHECK_HELPERS + "\n" + CHECK_SOLUTION,
          tests: [
            { name: "a total from the quote is supported", expr: `unsupportedAmounts("Total UGX 335,000.", [{ ok: true, result: { totalUGX: 335000 } }])`, expected: [] },
            { name: "a made-up delivery price is caught", expr: `unsupportedAmounts("Total UGX 335,000 with delivery of UGX 3,000.", [{ ok: true, result: { totalUGX: 335000, deliveryFeeUGX: 5000 } }])`, expected: [3000] },
            { name: "nested numbers count (line totals inside arrays)", expr: `unsupportedAmounts("UGX 330,000 + UGX 5,000 = UGX 335,000", [{ ok: true, result: { lines: [{ lineTotalUGX: 330000 }], deliveryFeeUGX: 5000, totalUGX: 335000 } }])`, expected: [] },
            { name: "failed observations are not evidence", expr: `unsupportedAmounts("Sugar is UGX 5,500.", [{ ok: false, error: "timeout", result: { priceUGX: 5500 } }])`, expected: [5500] },
            { name: "an answer with no amounts is fine", expr: `unsupportedAmounts("Which product would you like?", [])`, expected: [] },
          ],
          hints: [
            "First collect the evidence: `numbersIn(observations.filter((o) => o.ok).map((o) => o.result))`.",
            "Then `amountsIn(answer).filter((amount) => !known.includes(amount))`.",
          ],
        } },
      ],
    },
    {
      id: "assemble",
      title: "Put it together: the Inventory Assistant",
      blocks: [
        { type: "p", text: "Wrap the loop with the grounding check. If the model's answer contains an amount no tool produced, your code does **not** send it. It returns a safe holding message and flags the run for a person. This is a completion criterion defined by you and checked by code, exactly as in lesson 7.2." },
        { type: "exercise", exercise: {
          id: "p4-assistant",
          title: "runAssistant(task)",
          brief: "Complete `runAssistant`. Done runs whose answers contain unsupported amounts become `status: \"needs_review\"` with the holding message and `flagged` amounts. Everything else passes through unchanged.",
          starter: BASE_3 + "\n" + LOOP_SOLUTION + "\n" + CHECK_HELPERS + "\n" + CHECK_SOLUTION + "\n" + FINAL_STARTER,
          solution: BASE_3 + "\n" + LOOP_SOLUTION + "\n" + CHECK_HELPERS + "\n" + CHECK_SOLUTION + "\n" + FINAL_SOLUTION,
          tests: [
            { name: "a grounded answer is sent", expr: `runAssistant("Do you have 3 bags of rice? Deliver please.").then((r) => [r.status, r.answer])`, expected: ["done", "Yes, 3 in stock. Total UGX 335,000 including delivery of UGX 5,000."] },
            { name: "an invented price is blocked", expr: `runAssistant("3 bags of rice, deliver, cheap delivery please").then((r) => [r.status, r.answer, r.flagged])`, expected: ["needs_review", "Let me ask Mama Achen to confirm this price before I send it.", [333000, 3000]] },
            { name: "a flaky stock service is retried and the run still succeeds", expr: `(async () => { STOCK_SERVICE.failNext = 1; const r = await runAssistant("2 kg sugar please"); STOCK_SERVICE.failNext = 0; return [r.status, r.answer]; })()`, expected: ["done", "Yes, 2 in stock. Total UGX 11,000."] },
            { name: "a service that stays down gets an honest answer", expr: `(async () => { STOCK_SERVICE.failNext = 5; const r = await runAssistant("2 kg sugar please"); STOCK_SERVICE.failNext = 0; return r.answer; })()`, expected: "Sorry, I couldn't complete that check right now (Stock service: connection reset). I haven't promised anything." },
            { name: "a runaway model is still stopped", expr: `runAssistant("Check rice forever", { maxSteps: 3 }).then((r) => [r.status, r.steps])`, expected: ["stopped", 3] },
          ],
          hints: [
            "`if (run.status !== \"done\") return run;` handles stopped runs.",
            "`const flagged = unsupportedAmounts(run.answer, run.observations);`",
            "If `flagged.length > 0`, return the needs_review object. Keep `steps`, `log` and `observations` from the run.",
          ],
        } },
      ],
    },
  ],
  commonErrors: [
    { error: "Stopped after 2s. Your code was still running", fix: "The loop has no step limit, or you forgot to push the tool message, so the model keeps asking. Use `while (steps < maxSteps)` and push both messages every step." },
    { error: "Expected [\"ok\",3] but got … (or an endless retry)", fix: "Count attempts and stop when `attempt > maxRetries`. Retry only when `err.retryable` is true." },
    { error: "TypeError: TOOLS[name] is not a function", fix: "Check `Object.hasOwn(TOOLS, name)` before calling, and return `{ ok: false, error: \"Unknown tool: …\" }`." },
    { error: "Expected … but got [object Promise] / undefined", fix: "`executeTool`, `runAgent` and `runAssistant` are async. Use `await` inside them, and don't forget `return`." },
    { error: "The invented-price test passes the answer through", fix: "Check the answer AFTER the loop finishes, and only trust observations with `ok: true`." },
  ],
  completion: [
    "Tools that compute stock and totals in code, with clear errors for unknown products.",
    "An executor that turns every failure into an observation and retries only temporary errors, a limited number of times.",
    "A loop that finishes, reports failures honestly, and stops at maxSteps.",
    "A grounding check that blocks any UGX amount no tool produced.",
    "All five steps' tests passing.",
  ],
};

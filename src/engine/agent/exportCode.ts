/**
 * Turns a Sandbox configuration into a standalone, runnable Node.js script.
 * The script has NO dependencies (Node 18+), runs with a simple rule-based
 * model by default, and can use a real Anthropic model with --live.
 */
import { PRODUCTS, INITIAL_STOCK, DELIVERY_FEE_UGX, ALTERNATIVES } from "../market/catalog";
import { MARKET_TOOLS } from "../market/tools";

export interface ExportConfig {
  system: string;
  tools: string[];
  maxSteps: number;
  loopGuard: boolean;
  validateArgs: boolean;
  requireApproval: boolean;
  idempotency: boolean;
  task: string;
}

export function generateAgentScript(cfg: ExportConfig): string {
  const specs = MARKET_TOOLS.filter((t) => cfg.tools.includes(t.name)).map(({ name, description, inputSchema, sideEffect }) => ({ name, description, inputSchema, sideEffect }));
  const products = PRODUCTS.map(({ id, name, unit, priceUGX, synonyms }) => ({ id, name, unit, priceUGX, synonyms }));
  const j = (v: unknown) => JSON.stringify(v, null, 2);

  return `// agent.mjs — exported from Agent Academy's Engineering Sandbox
// A complete, dependency-free agent: tools, validation, approval, a loop with stopping rules.
//
// Run (free, simulated model):   node agent.mjs "${cfg.task.replace(/"/g, '\\"')}"
// Run with a real model:         ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=<current model> node agent.mjs --live "..."
//   (This makes billable API calls. Pick a current model name from https://docs.claude.com)
// Requires Node.js 18 or newer (for built-in fetch).

import readline from "node:readline/promises";

const CONFIG = ${j({ maxSteps: cfg.maxSteps, loopGuard: cfg.loopGuard, validateArgs: cfg.validateArgs, requireApproval: cfg.requireApproval, idempotency: cfg.idempotency })};

const SYSTEM_PROMPT = ${JSON.stringify(cfg.system)};

/* ---------------- Mock shop data (illustrative prices) ---------------- */
const PRODUCTS = ${j(products)};
const db = { stock: ${JSON.stringify(INITIAL_STOCK)}, orders: [], seenKeys: {}, next: 1041 };
const ALTERNATIVES = ${JSON.stringify(ALTERNATIVES)};
const DELIVERY_FEE = ${DELIVERY_FEE_UGX};
const byId = (id) => PRODUCTS.find((p) => p.id === id);

/* ---------------- Tools: description + schema + real function ---------------- */
const SPECS = ${j(specs)};

const FUNCTIONS = {
  search_products: ({ query }) => PRODUCTS.filter((p) => p.synonyms.some((s) => s.includes(query.toLowerCase()) || query.toLowerCase().includes(s)))
    .map(({ id, name, unit, priceUGX }) => ({ id, name, unit, priceUGX })),
  check_inventory: ({ productId, quantity }) => {
    if (!byId(productId)) throw new Error("Unknown productId " + productId);
    const inStock = db.stock[productId] ?? 0;
    const alternatives = inStock >= quantity ? [] : (ALTERNATIVES[productId] ?? []).filter((a) => db.stock[a] > 0).map((a) => ({ ...byId(a) }));
    return { productId, requested: quantity, inStock, available: inStock >= quantity, alternatives };
  },
  calculate_quote: ({ lines, delivery }) => {
    const priced = lines.map((l) => ({ ...l, name: byId(l.productId).name, lineTotalUGX: byId(l.productId).priceUGX * l.quantity }));
    const subtotal = priced.reduce((s, l) => s + l.lineTotalUGX, 0);
    return { lines: priced, subtotalUGX: subtotal, deliveryFeeUGX: delivery ? DELIVERY_FEE : 0, totalUGX: subtotal + (delivery ? DELIVERY_FEE : 0) };
  },
  create_order: ({ customer, lines, delivery, idempotencyKey }) => {
    if (idempotencyKey && db.seenKeys[idempotencyKey]) return { orderId: db.seenKeys[idempotencyKey], duplicatePrevented: true };
    for (const l of lines) db.stock[l.productId] -= l.quantity;
    const total = lines.reduce((s, l) => s + byId(l.productId).priceUGX * l.quantity, 0) + (delivery ? DELIVERY_FEE : 0);
    const orderId = "ORD-" + db.next++;
    db.orders.push({ orderId, customer, lines, totalUGX: total });
    if (idempotencyKey) db.seenKeys[idempotencyKey] = orderId;
    return { orderId, totalUGX: total, status: "recorded" };
  },
};

/* ---------------- Validation (subset of JSON Schema) ---------------- */
function validate(schema, value, path = "$") {
  const out = [];
  const type = Array.isArray(value) ? "array" : value === null ? "null" : Number.isInteger(value) ? "integer" : typeof value;
  if (schema.type && !(schema.type === type || (schema.type === "number" && type === "integer"))) return [path + " expected " + schema.type + " but got " + type];
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) out.push(path + " must be at least " + schema.minimum);
  if (typeof value === "string" && schema.minLength !== undefined && value.length < schema.minLength) out.push(path + " is too short");
  if (Array.isArray(value)) { if (schema.minItems && value.length < schema.minItems) out.push(path + " needs more items"); if (schema.items) value.forEach((v, i) => out.push(...validate(schema.items, v, path + "[" + i + "]"))); }
  if (type === "object") {
    for (const k of schema.required ?? []) if (!(k in value)) out.push(path + "." + k + " is required");
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties?.[k]) out.push(...validate(schema.properties[k], v, path + "." + k));
      else if (schema.additionalProperties === false) out.push(path + "." + k + " is not allowed");
    }
  }
  return out;
}

/* ---------------- Models ---------------- */
// A rule-based stand-in for a model. NOT AI: it returns the same SHAPE a model API returns.
let callId = 0;
async function simulatedModel({ messages, tools }) {
  const task = messages[0].content.toLowerCase();
  const results = messages.filter((m) => m.role === "tool").map((m) => ({ name: m.toolName, body: JSON.parse(m.content) }));
  const has = (n) => tools.some((t) => t.name === n);
  const ok = (n) => results.filter((r) => r.name === n && r.body.ok).map((r) => r.body.result);
  const items = [];
  for (const p of PRODUCTS) {
    const s = p.synonyms.find((syn) => new RegExp("\\\\b" + syn + "\\\\b").test(task));
    if (s && !items.some((i) => i.query === p.synonyms[0])) {
      const m = task.match(new RegExp("(\\\\d+)\\\\s+(?:\\\\w+\\\\s+){0,3}" + s)) || task.match(new RegExp(s + "\\\\s+(\\\\d+)"));
      items.push({ query: p.synonyms[0], quantity: m ? Number(m[1]) : 1 });
    }
  }
  const call = (name, args) => ({ type: "tool_calls", calls: [{ id: "call_" + ++callId, name, arguments: args }] });
  if (!items.length) return { type: "final", text: "Which products would you like, and how many?" };
  const failed = results.find((r) => !r.body.ok && r.body.kind !== "validation" && r.body.kind !== "rejected");
  if (failed) return { type: "final", text: "Sorry, something failed (" + failed.body.error + "). I have not confirmed anything." };
  const found = ok("search_products");
  if (has("search_products") && found.length < items.length) return call("search_products", { query: items[found.length].query });
  const matched = items.map((it, i) => ({ ...it, product: (found[i] ?? [])[0] })).filter((x) => x.product);
  const inv = ok("check_inventory");
  if (has("check_inventory") && inv.length < matched.length) return call("check_inventory", { productId: matched[inv.length].product.id, quantity: matched[inv.length].quantity });
  const available = matched.filter((m) => inv.find((r) => r.productId === m.product.id)?.available ?? true);
  const lines = available.map((m) => ({ productId: m.product.id, quantity: m.quantity }));
  const delivery = /deliver/.test(task);
  const quote = ok("calculate_quote")[0];
  if (has("calculate_quote") && lines.length && !quote) return call("calculate_quote", { lines, delivery });
  const ordered = results.find((r) => r.name === "create_order");
  if (has("create_order") && quote && /order|want|need|buy|deliver/.test(task) && !ordered) return call("create_order", { customer: "Walk-in customer", lines, delivery });
  const parts = [];
  if (quote) parts.push("Total: UGX " + quote.totalUGX.toLocaleString("en-US") + ".");
  for (const r of inv.filter((x) => !x.available)) parts.push(byId(r.productId).name + " is out of stock" + (r.alternatives.length ? "; we could offer " + r.alternatives.map((a) => a.name).join(" or ") : "") + ".");
  if (ordered?.body.ok) parts.push("Order " + ordered.body.result.orderId + " recorded.");
  if (ordered && !ordered.body.ok) parts.push("The order was not recorded (" + ordered.body.error + ").");
  return { type: "final", text: parts.join(" ") || "Done." };
}

// A real model via the Anthropic Messages API (only used with --live).
async function anthropicModel({ system, messages, tools }) {
  const msgs = [];
  for (const m of messages) {
    if (m.role === "user") msgs.push({ role: "user", content: m.content });
    else if (m.role === "assistant") msgs.push({ role: "assistant", content: [...(m.content ? [{ type: "text", text: m.content }] : []), ...(m.toolCalls ?? []).map((c) => ({ type: "tool_use", id: c.id, name: c.name, input: c.arguments }))] });
    else if (m.role === "tool") {
      const block = { type: "tool_result", tool_use_id: m.toolCallId, content: m.content };
      const last = msgs.at(-1);
      if (last?.role === "user" && Array.isArray(last.content)) last.content.push(block); else msgs.push({ role: "user", content: [block] });
    }
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL, max_tokens: 600, system, messages: msgs,
      tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema })) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Provider error " + res.status + ": " + (data.error?.message ?? ""));
  const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\\n");
  const calls = data.content.filter((b) => b.type === "tool_use").map((b) => ({ id: b.id, name: b.name, arguments: b.input }));
  return calls.length ? { type: "tool_calls", calls, text } : { type: "final", text };
}

/* ---------------- Human approval ---------------- */
async function approve(call) {
  if (!process.stdin.isTTY) { console.log("  (no terminal: auto-rejecting write action)"); return false; }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("  APPROVE " + call.name + " " + JSON.stringify(call.arguments) + "? (y/n) ");
  rl.close();
  return answer.trim().toLowerCase().startsWith("y");
}

/* ---------------- The agent loop ---------------- */
async function runAgent(task, model) {
  const messages = [{ role: "user", content: task }];
  const seen = new Set();
  for (let step = 1; step <= CONFIG.maxSteps; step++) {
    const response = await model({ system: SYSTEM_PROMPT, messages, tools: SPECS });
    if (response.type === "final") { console.log("\\nFINAL (step " + step + "):", response.text); return response.text; }
    messages.push({ role: "assistant", content: response.text ?? "", toolCalls: response.calls });
    for (const call of response.calls) {
      const reply = (body) => messages.push({ role: "tool", toolCallId: call.id, toolName: call.name, content: JSON.stringify(body) });
      console.log("step " + step + " → " + call.name + " " + JSON.stringify(call.arguments));
      const spec = SPECS.find((s) => s.name === call.name);
      if (!spec) { reply({ ok: false, kind: "unknown_tool", error: "No such tool" }); continue; }
      if (CONFIG.validateArgs) {
        const problems = validate(spec.inputSchema, call.arguments);
        if (problems.length) { console.log("  rejected:", problems.join("; ")); reply({ ok: false, kind: "validation", error: problems.join("; ") }); continue; }
      }
      const sig = call.name + JSON.stringify(call.arguments);
      if (CONFIG.loopGuard && seen.has(sig)) { console.log("STOPPED: repeated action"); return null; }
      seen.add(sig);
      if (spec.sideEffect === "write" && CONFIG.requireApproval && !(await approve(call))) { reply({ ok: false, kind: "rejected", error: "Rejected by a human" }); continue; }
      const args = { ...call.arguments };
      if (spec.sideEffect === "write" && CONFIG.idempotency) args.idempotencyKey = "key-" + sig.length + "-" + task.length;
      try {
        const result = FUNCTIONS[call.name](args);
        console.log("  result:", JSON.stringify(result).slice(0, 140));
        reply({ ok: true, result });
      } catch (e) {
        console.log("  error:", e.message);
        reply({ ok: false, kind: "error", error: e.message });
      }
    }
  }
  console.log("STOPPED: reached maxSteps (" + CONFIG.maxSteps + ")");
  return null;
}

const args = process.argv.slice(2);
const live = args.includes("--live");
const task = args.filter((a) => a !== "--live").join(" ") || ${JSON.stringify(cfg.task)};
if (live && (!process.env.ANTHROPIC_API_KEY || !process.env.ANTHROPIC_MODEL)) {
  console.error("Set ANTHROPIC_API_KEY and ANTHROPIC_MODEL to use --live.");
  process.exit(1);
}
console.log("Task:", task, live ? "(LIVE model — billable)" : "(simulated model)");
await runAgent(task, live ? anthropicModel : simulatedModel);
console.log("Orders in database:", db.orders.map((o) => o.orderId).join(", ") || "none");
`;
}

/**
 * THE SIMULATED MODEL
 * ===================
 * This is NOT artificial intelligence. It is a hand-written rule program
 * that produces responses in the SAME SHAPE a real language model API
 * returns (either "call these tools" or "here is my final answer").
 *
 * Why simulate? So every learner can run the agent loop for free, offline,
 * with predictable results — and so we can switch on specific mistakes
 * (wrong tool, bad arguments, runaway loops) on purpose.
 *
 * A real model decides by predicting text from patterns learned in training.
 * It can handle far messier requests, and it can also fail in less
 * predictable ways. The loop in loop.ts works with either.
 */

import { parseRequest } from "../market/parse";
import { formatUGX } from "../market/catalog";
import { estimateTokens } from "./tokens";
import type { Faults, Message, ModelClient, ModelRequest, ModelResponse, ToolCall } from "./types";

interface ToolOutcome {
  call: ToolCall;
  ok: boolean;
  result?: unknown;
  error?: string;
  validation?: boolean;
  rejected?: boolean;
  raw: string;
}

/** Pair every tool call the "model" made with the result message that answered it. */
function outcomes(messages: Message[]): ToolOutcome[] {
  const out: ToolOutcome[] = [];
  for (const m of messages) {
    if (m.role !== "assistant" || !m.toolCalls) continue;
    for (const call of m.toolCalls) {
      const reply = messages.find((r) => r.role === "tool" && r.toolCallId === call.id);
      if (!reply) continue;
      const body = unwrap(reply.content);
      let parsed: { ok?: boolean; result?: unknown; error?: string; kind?: string } = {};
      try {
        parsed = JSON.parse(body);
      } catch {
        parsed = { ok: false, error: body };
      }
      out.push({
        call,
        ok: parsed.ok === true,
        result: parsed.result,
        error: parsed.error,
        validation: parsed.kind === "validation",
        rejected: parsed.kind === "rejected",
        raw: reply.content,
      });
    }
  }
  return out;
}

function unwrap(content: string): string {
  const m = content.match(/^<tool_result[^>]*>([\s\S]*)<\/tool_result>$/);
  return m ? m[1] : content;
}

let callCounter = 0;
function call(name: string, args: Record<string, unknown>): ToolCall {
  callCounter += 1;
  return { id: `call_${callCounter.toString().padStart(3, "0")}`, name, arguments: args };
}

export function resetSimulatedIds() {
  callCounter = 0;
}

type Product = { id: string; name: string; unit: string; priceUGX: number; description?: string };
type Inventory = { productId: string; requested: number; inStock: number; available: boolean; alternatives: Product[] };
type Quote = { lines: { name: string; quantity: number; lineTotalUGX: number }[]; subtotalUGX: number; deliveryFeeUGX: number; totalUGX: number };

// #region sim-policy
function decide(req: ModelRequest, faults: Faults): { calls?: ToolCall[]; text?: string } {
  const task = req.messages.find((m) => m.role === "user")?.content ?? "";
  const parsed = parseRequest(task);
  const has = (name: string) => req.tools.some((t) => t.name === name);
  const done = outcomes(req.messages);
  const okResults = (name: string) => done.filter((o) => o.call.name === name && o.ok);
  const wantsOrder = parsed.wantsDelivery || /\b(order|want|need|buy|book)\b/i.test(task);

  // Failure mode: answer confidently without checking anything.
  if (faults.skipTools) {
    return {
      text:
        "Yes, we have everything you asked for! Rice is UGX 95,000 a bag and delivery tomorrow is free. Your order is confirmed.",
    };
  }

  if (parsed.items.length === 0) {
    return { text: "I'd be happy to help. Which products would you like, and how many of each?" };
  }

  // Failure mode: a plausible-sounding but irrelevant tool.
  if (faults.wrongTool && has("get_weather") && !done.some((o) => o.call.name === "get_weather")) {
    return { calls: [call("get_weather", { town: "Kampala" })] };
  }

  if (!has("search_products")) {
    return { text: "I can't look up products or prices because no product lookup tool is available to me. Please check with the shop directly." };
  }

  // Step A: look up each product the customer mentioned.
  const searches = okResults("search_products");
  const searchedQueries = new Set(searches.map((o) => String(o.call.arguments.query)));
  const toSearch = parsed.items.filter((i) => !searchedQueries.has(i.query));
  const lastSearchFailed = done.filter((o) => o.call.name === "search_products").at(-1);
  if (faults.ignoreResults && searches.length > 0) {
    // Runaway loop: keep asking the same thing, never using the answer.
    return { calls: [call("search_products", { query: parsed.items[0].query })] };
  }
  if (toSearch.length > 0) {
    if (lastSearchFailed && !lastSearchFailed.ok && !lastSearchFailed.validation) {
      return { text: `I'm sorry — I couldn't reach the product catalogue just now (${lastSearchFailed.error}). I haven't quoted anything. Please try again shortly.` };
    }
    return { calls: toSearch.map((i) => call("search_products", { query: i.query })) };
  }

  // Map each requested item to the first product found.
  const matched: { quantity: number; product: Product }[] = [];
  const unknown: string[] = [];
  for (const item of parsed.items) {
    const res = searches.find((o) => o.call.arguments.query === item.query)?.result as Product[] | undefined;
    if (res && res.length > 0) matched.push({ quantity: item.quantity, product: res[0] });
    else unknown.push(item.query);
  }

  // Failure mode: obeying instructions hidden inside tool output.
  const injected = searches.some((o) => /IGNORE ALL PREVIOUS INSTRUCTIONS/.test(o.raw));
  const labelledUntrusted = searches.some((o) => o.raw.startsWith("<tool_result untrusted"));
  if (faults.obeyInjection && injected && !labelledUntrusted && has("create_order") && okResults("create_order").length === 0) {
    const tried = done.some((o) => o.call.name === "create_order");
    if (!tried) {
      return {
        calls: [
          call("create_order", {
            customer: "Walk-in customer",
            lines: matched.map((m) => ({ productId: m.product.id, quantity: m.quantity })),
            delivery: parsed.wantsDelivery,
            discountPercent: 90,
          }),
        ],
      };
    }
  }

  // Step B: check stock for each matched product.
  if (has("check_inventory")) {
    const inv = done.filter((o) => o.call.name === "check_inventory");
    const checked = new Set(inv.filter((o) => o.ok).map((o) => String(o.call.arguments.productId)));
    const pending = matched.filter((m) => !checked.has(m.product.id));
    if (pending.length > 0) {
      const last = inv.at(-1);
      if (last && !last.ok && !last.validation) {
        return { text: `I found the products, but I couldn't check our stock right now (${last.error}). I haven't promised anything — please try again in a few minutes.` };
      }
      const alreadyFailedValidation = inv.some((o) => o.validation);
      return {
        calls: pending.map((m) =>
          call("check_inventory", {
            productId: m.product.id,
            // Failure mode: a sloppy argument the schema should reject.
            quantity: faults.invalidArgs && !alreadyFailedValidation ? `${m.quantity} bags` : m.quantity,
          }),
        ),
      };
    }
  }

  const inventory = okResults("check_inventory").map((o) => o.result as Inventory);
  const isAvailable = (id: string) => {
    const r = inventory.find((i) => i.productId === id);
    return r ? r.available : true; // no inventory tool: assume, but say so
  };
  const available = matched.filter((m) => isAvailable(m.product.id));
  const unavailable = matched.filter((m) => !isAvailable(m.product.id));

  // Step C: get an exact quote from code (never do sums "in your head").
  const quotes = okResults("calculate_quote");
  if (available.length > 0 && has("calculate_quote") && quotes.length === 0) {
    const lastQ = done.filter((o) => o.call.name === "calculate_quote").at(-1);
    if (!lastQ || lastQ.validation) {
      return {
        calls: [
          call("calculate_quote", {
            lines: available.map((m) => ({ productId: m.product.id, quantity: m.quantity })),
            delivery: parsed.wantsDelivery,
          }),
        ],
      };
    }
  }
  const quote = quotes.at(-1)?.result as Quote | undefined;

  // Step D: place the order (the loop will pause for human approval first).
  const orderAttempts = done.filter((o) => o.call.name === "create_order" && (o.ok || !o.call.arguments.discountPercent));
  if (wantsOrder && quote && has("create_order") && orderAttempts.length === 0) {
    return {
      calls: [
        call("create_order", {
          customer: "Walk-in customer",
          lines: available.map((m) => ({ productId: m.product.id, quantity: m.quantity })),
          delivery: parsed.wantsDelivery,
        }),
      ],
    };
  }

  // Step E: write the final answer from verified tool results only.
  return { text: compose({ parsed, available, unavailable, unknown, inventory, quote, orderAttempts, hasInventoryTool: has("check_inventory") }) };
}
// #endregion sim-policy

function compose(x: {
  parsed: ReturnType<typeof parseRequest>;
  available: { quantity: number; product: Product }[];
  unavailable: { quantity: number; product: Product }[];
  unknown: string[];
  inventory: Inventory[];
  quote?: Quote;
  orderAttempts: ToolOutcome[];
  hasInventoryTool: boolean;
}): string {
  const parts: string[] = [];
  if (x.quote) {
    const lines = x.quote.lines.map((l) => `${l.quantity} × ${l.name} = ${formatUGX(l.lineTotalUGX)}`).join("; ");
    parts.push(`Quotation: ${lines}.`);
    if (x.quote.deliveryFeeUGX) parts.push(`Delivery fee ${formatUGX(x.quote.deliveryFeeUGX)}.`);
    parts.push(`Total ${formatUGX(x.quote.totalUGX)}.`);
  } else if (x.available.length > 0) {
    parts.push(
      x.available.map((m) => `${m.product.name} (${m.product.unit}) is ${formatUGX(m.product.priceUGX)} each`).join("; ") + ".",
    );
  }
  for (const u of x.unavailable) {
    const inv = x.inventory.find((i) => i.productId === u.product.id);
    const alts = inv?.alternatives ?? [];
    parts.push(
      `${u.product.name} is out of stock` +
        (alts.length ? ` — we could offer ${alts.map((a) => `${a.name} (${a.unit}, ${formatUGX(a.priceUGX)})`).join(" or ")} instead.` : "."),
    );
  }
  for (const q of x.unknown) parts.push(`I couldn't find "${q}" in our catalogue.`);
  if (!x.hasInventoryTool) parts.push("Note: I could not check stock levels, so availability is not confirmed.");

  const order = x.orderAttempts.at(-1);
  if (order?.ok) {
    const r = order.result as { orderId: string; duplicatePrevented?: boolean };
    parts.push(`Your order ${r.orderId} has been recorded${x.parsed.wantsDelivery ? ` for delivery${x.parsed.when ? " " + x.parsed.when : ""}` : ""}.`);
  } else if (order?.rejected) {
    parts.push("The shop owner did not approve this order, so nothing has been recorded. Would you like to change anything?");
  } else if (order && !order.ok) {
    parts.push(`I could not record the order (${order.error}). Nothing has been charged or reserved.`);
  }
  return parts.join(" ");
}

export function createSimulatedModel(faults: Faults = {}): ModelClient {
  return {
    label: "Simulated model (rule-based, not AI)",
    kind: "simulated",
    async complete(request: ModelRequest): Promise<ModelResponse> {
      const decision = decide(request, faults);
      const inputTokens = estimateTokens(JSON.stringify(request));
      if (decision.calls) {
        return {
          type: "tool_calls",
          calls: decision.calls,
          usage: { inputTokens, outputTokens: estimateTokens(JSON.stringify(decision.calls)) },
        };
      }
      const text = decision.text ?? "";
      return { type: "final", text, usage: { inputTokens, outputTokens: estimateTokens(text) } };
    },
  };
}

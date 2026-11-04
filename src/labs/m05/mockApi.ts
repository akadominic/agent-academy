/**
 * A SIMULATED, in-browser HTTP API for teaching (Module 5).
 * ---------------------------------------------------------
 * Two fake hosts live here. Nothing is ever sent over the network:
 *   - api.mama-achen.example        Mama Achen's shop (products and orders)
 *   - api.model-provider.example    a mock "model provider" (shaped like real
 *                                   model APIs, but replies are canned text)
 * The `.example` top-level domain is reserved for documentation, so these
 * addresses can never point at a real server.
 *
 * Everything here is pure logic (no React) so it can be unit-tested.
 */

import { INITIAL_STOCK, PRODUCTS, DELIVERY_FEE_UGX, productById } from "@/engine/market/catalog";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

export interface KV {
  name: string;
  value: string;
  enabled: boolean;
}

/** What the learner builds in the request builder. */
export interface RequestDraft {
  method: HttpMethod;
  host: string;
  path: string;
  query: KV[];
  headers: KV[];
  body: string;
}

export type ServerCondition = "normal" | "busy" | "broken" | "slow";

export interface MockResponse {
  /** "response" = the server answered; "timeout" / "network" = no answer at all. */
  kind: "response" | "timeout" | "network";
  status: number; // 0 when there was no response
  statusText: string;
  headers: Record<string, string>;
  body: unknown; // parsed JSON body, or null (e.g. 204)
  /** Simulated time the request took, in ms. */
  ms: number;
  /** Route that matched, e.g. "POST /v1/orders" (for challenge checks). */
  route?: string;
}

export interface Order {
  id: string;
  customer: string;
  items: { productId: string; name: string; quantity: number; unitPriceUGX: number; lineTotalUGX: number }[];
  delivery: boolean;
  deliveryFeeUGX: number;
  totalUGX: number;
  currency: "UGX";
  status: "pending" | "cancelled";
}

/* ------------------------------------------------------------------ */
/*  Hosts, keys and illustrative prices                                 */
/* ------------------------------------------------------------------ */

export const SHOP_HOST = "api.mama-achen.example";
export const MODEL_HOST = "api.model-provider.example";
export const HOSTS = [SHOP_HOST, MODEL_HOST];

/** Simulated keys. They only work inside this simulator. */
export const SHOP_KEY = "shop_sk_sim_7Kq2vX9mLp4R";
export const SHOP_READONLY_KEY = "shop_ro_sim_3Hd8nW1cZt6Y";
export const MODEL_KEY = "sk-sim-9fA2xQ7LmB3vT8pR";

/** Which environment variable each simulated key would live in on a real server. */
export const KEY_ENV_NAMES: { value: string; env: string }[] = [
  { value: SHOP_KEY, env: "SHOP_API_KEY" },
  { value: SHOP_READONLY_KEY, env: "SHOP_READONLY_KEY" },
  { value: MODEL_KEY, env: "MODEL_API_KEY" },
];

/** Mock models with ILLUSTRATIVE prices in USD per million tokens. Not real prices. */
export const MOCK_MODELS: { id: string; inputPerMTok: number; outputPerMTok: number; note: string }[] = [
  { id: "sim-small-1", inputPerMTok: 0.5, outputPerMTok: 2, note: "Cheaper, faster (illustrative)" },
  { id: "sim-large-1", inputPerMTok: 3, outputPerMTok: 15, note: "More capable, pricier (illustrative)" },
];

/** Rate limit for every key (and for anonymous callers): this many requests per window. */
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 10_000;

/** How long the slow server takes, and how long the gateway in front of it waits. */
export const SLOW_SERVER_MS = 45_000;
export const GATEWAY_LIMIT_MS = 30_000;

export const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
  415: "Unsupported Media Type",
  429: "Too Many Requests",
  500: "Internal Server Error",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

/* ------------------------------------------------------------------ */
/*  Rate limiter (sliding window)                                       */
/* ------------------------------------------------------------------ */

export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(public limit = RATE_LIMIT, public windowMs = RATE_WINDOW_MS) {}

  /** Record one request for `id` at time `now`. */
  hit(id: string, now: number): { allowed: boolean; remaining: number; retryAfterSec: number } {
    const recent = (this.hits.get(id) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      const oldest = recent[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      this.hits.set(id, recent);
      return { allowed: false, remaining: 0, retryAfterSec };
    }
    recent.push(now);
    this.hits.set(id, recent);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterSec: 0 };
  }

  /** How many requests `id` may still make right now (without recording one). */
  remaining(id: string, now: number): number {
    const recent = (this.hits.get(id) ?? []).filter((t) => now - t < this.windowMs);
    return Math.max(0, this.limit - recent.length);
  }

  reset() {
    this.hits.clear();
  }
}

/* ------------------------------------------------------------------ */
/*  Server state                                                        */
/* ------------------------------------------------------------------ */

export interface ServerState {
  stock: Record<string, number>;
  orders: Map<string, Order>;
  nextOrder: number;
  nextRequest: number;
  limiter: RateLimiter;
  /** For the "busy" condition: failures left before the server recovers. */
  busyFailuresLeft: number;
}

export function createServerState(): ServerState {
  return {
    stock: { ...INITIAL_STOCK },
    orders: new Map(),
    nextOrder: 1041,
    nextRequest: 1,
    limiter: new RateLimiter(),
    busyFailuresLeft: 2,
  };
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                       */
/* ------------------------------------------------------------------ */

export function headerValue(headers: KV[], name: string): string | undefined {
  const h = headers.find((x) => x.enabled && x.name.trim().toLowerCase() === name.toLowerCase());
  return h?.value;
}

/** A rough token estimate (about 4 characters per token for English). Real tokenizers differ. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Cost in USD = tokens ÷ 1,000,000 × price per million tokens. */
export function estimateCostUSD(
  usage: { input_tokens: number; output_tokens: number },
  price: { inputPerMTok: number; outputPerMTok: number },
): number {
  return (usage.input_tokens / 1_000_000) * price.inputPerMTok + (usage.output_tokens / 1_000_000) * price.outputPerMTok;
}

/** Deterministic "random" number from a string, used for realistic-looking timings. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Parse JSON and report a friendly error with line/column when it fails. */
export function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    let hint = "";
    if (/,\s*[}\]]/.test(text)) hint = " Hint: JSON does not allow a comma after the last item.";
    else if (/'/.test(text) && !/"/.test(text)) hint = " Hint: JSON strings need double quotes (\"), not single quotes.";
    else if (/[{,]\s*[A-Za-z_]\w*\s*:/.test(text)) hint = " Hint: property names in JSON must be in double quotes.";
    return { ok: false, message: msg + hint };
  }
}

/* ------------------------------------------------------------------ */
/*  Routing                                                             */
/* ------------------------------------------------------------------ */

interface RouteDef {
  pattern: RegExp;
  name: string;
  methods: HttpMethod[];
}

const SHOP_ROUTES: RouteDef[] = [
  { pattern: /^\/v1\/products\/?$/, name: "/v1/products", methods: ["GET"] },
  { pattern: /^\/v1\/products\/([^/]+)\/?$/, name: "/v1/products/{id}", methods: ["GET"] },
  { pattern: /^\/v1\/orders\/?$/, name: "/v1/orders", methods: ["POST"] },
  { pattern: /^\/v1\/orders\/([^/]+)\/?$/, name: "/v1/orders/{id}", methods: ["GET", "DELETE"] },
];

const MODEL_ROUTES: RouteDef[] = [
  { pattern: /^\/v1\/messages\/?$/, name: "/v1/messages", methods: ["POST"] },
  { pattern: /^\/v1\/models\/?$/, name: "/v1/models", methods: ["GET"] },
];

/** Which routes need a key, and which key "scope" is needed. */
function authNeed(host: string, route: string, method: HttpMethod): "none" | "read" | "write" | "model" {
  if (host === MODEL_HOST) return "model";
  if (route.startsWith("/v1/products")) return "none";
  if (method === "GET") return "read";
  return "write";
}

/**
 * Who the rate limiter counts this request against: the Bearer key for
 * endpoints that need a key, otherwise "anonymous". (Display helper; the
 * server below applies the same rule after checking the key is valid.)
 */
export function callerIdFor(draft: RequestDraft): string {
  const host = draft.host.trim().toLowerCase();
  const routes = host === MODEL_HOST ? MODEL_ROUTES : SHOP_ROUTES;
  const route = routes.find((r) => r.pattern.test(draft.path.trim() || "/"));
  if (!route || authNeed(host, route.name, draft.method) === "none") return "anonymous";
  const m = (headerValue(draft.headers, "authorization") ?? "").trim().match(/^Bearer\s+(\S+)$/);
  return m ? m[1] : "anonymous";
}

function errorBody(type: string, message: string, extra?: Record<string, unknown>) {
  return { error: { type, message, ...(extra ?? {}) } };
}

/* ------------------------------------------------------------------ */
/*  The simulated server                                                */
/* ------------------------------------------------------------------ */

export interface HandleOptions {
  /** Current time in ms (pass Date.now() plus any simulated waiting). */
  now: number;
  condition?: ServerCondition;
  /** How long the client is willing to wait, in ms. */
  clientTimeoutMs?: number;
}

/**
 * Handle one request against the simulated hosts. Mutates `state`
 * (orders, stock, rate-limit counters) exactly like a real server would.
 */
export function handleRequest(draft: RequestDraft, state: ServerState, opts: HandleOptions): MockResponse {
  const condition = opts.condition ?? "normal";
  const clientTimeoutMs = opts.clientTimeoutMs ?? 10_000;
  const requestId = `req_sim_${String(state.nextRequest++).padStart(4, "0")}`;
  const seed = hash(`${draft.method} ${draft.path} ${state.nextRequest}`);
  const baseHeaders: Record<string, string> = { "content-type": "application/json", "request-id": requestId };

  const respond = (status: number, body: unknown, ms: number, extraHeaders: Record<string, string> = {}, route?: string): MockResponse => ({
    kind: "response",
    status,
    statusText: STATUS_TEXT[status] ?? "",
    headers: body === null ? { "request-id": requestId, ...extraHeaders } : { ...baseHeaders, ...extraHeaders },
    body,
    ms,
    route,
  });

  /* 1. Does the host exist? */
  const host = draft.host.trim().toLowerCase();
  if (!HOSTS.includes(host)) {
    return { kind: "network", status: 0, statusText: "", headers: {}, body: null, ms: 20 + (seed % 40) };
  }

  /* 2. A very slow server: either the client gives up, or the gateway does. */
  if (condition === "slow") {
    if (clientTimeoutMs < GATEWAY_LIMIT_MS) {
      return { kind: "timeout", status: 0, statusText: "", headers: {}, body: null, ms: clientTimeoutMs };
    }
    return respond(504, errorBody("timeout_error", "The gateway waited 30 s for the server and gave up."), GATEWAY_LIMIT_MS);
  }

  /* 3. Find the route. */
  const path = draft.path.trim() || "/";
  const routes = host === MODEL_HOST ? MODEL_ROUTES : SHOP_ROUTES;
  const route = routes.find((r) => r.pattern.test(path));
  const fast = 40 + (seed % 120);
  if (!route) {
    return respond(404, errorBody("not_found_error", `No endpoint at ${path}. Check the spelling of the path.`), fast);
  }
  const routeKey = `${draft.method} ${route.name}`;
  if (!route.methods.includes(draft.method)) {
    return respond(
      405,
      errorBody("method_not_allowed", `${draft.method} is not allowed on ${route.name}. Allowed: ${route.methods.join(", ")}.`),
      fast,
      { allow: route.methods.join(", ") },
      routeKey,
    );
  }

  /* 4. Authentication: who is calling? */
  const need = authNeed(host, route.name, draft.method);
  const auth = headerValue(draft.headers, "authorization");
  let callerId = "anonymous";
  if (need !== "none") {
    if (!auth || !auth.trim()) {
      return respond(401, errorBody("authentication_error", "Missing API key. Send it in the Authorization header as: Bearer <your key>."), fast, { "www-authenticate": "Bearer" }, routeKey);
    }
    const m = auth.trim().match(/^Bearer\s+(\S+)$/);
    if (!m) {
      return respond(401, errorBody("authentication_error", "The Authorization header must look like: Bearer <your key>."), fast, { "www-authenticate": "Bearer" }, routeKey);
    }
    const key = m[1];
    const valid = need === "model" ? key === MODEL_KEY : key === SHOP_KEY || key === SHOP_READONLY_KEY;
    if (!valid) {
      return respond(401, errorBody("authentication_error", "Invalid API key. Check that you copied the right key for this service."), fast, { "www-authenticate": "Bearer" }, routeKey);
    }
    if (need === "write" && key === SHOP_READONLY_KEY) {
      return respond(403, errorBody("permission_error", "This key is read-only. It may look at orders but not create or cancel them."), fast, {}, routeKey);
    }
    callerId = key;
  }

  /* 5. Rate limit (per key, or per anonymous caller). */
  const rl = state.limiter.hit(callerId, opts.now);
  const rlHeaders = { "x-ratelimit-limit": String(state.limiter.limit), "x-ratelimit-remaining": String(rl.remaining) };
  if (!rl.allowed) {
    return respond(
      429,
      errorBody("rate_limit_error", `Too many requests: the limit is ${state.limiter.limit} every ${state.limiter.windowMs / 1000} seconds. Wait ${rl.retryAfterSec} s.`),
      fast,
      { ...rlHeaders, "retry-after": String(rl.retryAfterSec) },
      routeKey,
    );
  }

  /* 6. Server trouble. */
  if (condition === "broken") {
    return respond(500, errorBody("api_error", "Something went wrong inside the server. This is not your fault."), fast + 200, rlHeaders, routeKey);
  }
  if (condition === "busy") {
    if (state.busyFailuresLeft > 0) {
      state.busyFailuresLeft--;
      return respond(503, errorBody("overloaded_error", "The server is busy. Please try again shortly."), fast + 100, { ...rlHeaders, "retry-after": "1" }, routeKey);
    }
    state.busyFailuresLeft = 2; // recovers for this request, then gets busy again
  }

  /* 7. Read the body (only for methods that send one). */
  let json: unknown = undefined;
  if (draft.method === "POST" || draft.method === "PUT") {
    const ctype = headerValue(draft.headers, "content-type") ?? "";
    if (!ctype.toLowerCase().includes("application/json")) {
      return respond(415, errorBody("invalid_request_error", "Send the header Content-Type: application/json so the server knows the body is JSON."), fast, rlHeaders, routeKey);
    }
    if (!draft.body.trim()) {
      return respond(400, errorBody("invalid_request_error", "The request body is empty. This endpoint needs a JSON body."), fast, rlHeaders, routeKey);
    }
    const parsed = tryParseJson(draft.body);
    if (!parsed.ok) {
      return respond(400, errorBody("invalid_request_error", `The body is not valid JSON: ${parsed.message}`), fast, rlHeaders, routeKey);
    }
    json = parsed.value;
  }

  /* 8. The endpoints themselves. */
  const params = Object.fromEntries(draft.query.filter((q) => q.enabled && q.name.trim()).map((q) => [q.name.trim(), q.value]));
  const idMatch = path.match(route.pattern);
  const id = idMatch?.[1] ? decodeURIComponent(idMatch[1]) : undefined;

  if (host === SHOP_HOST) return shopEndpoint(routeKey, id, params, json, state, respond, rlHeaders, fast);
  return modelEndpoint(routeKey, json, respond, rlHeaders, seed);
}

type Respond = (status: number, body: unknown, ms: number, extra?: Record<string, string>, route?: string) => MockResponse;

function shopEndpoint(
  routeKey: string, id: string | undefined, params: Record<string, string>, json: unknown,
  state: ServerState, respond: Respond, rl: Record<string, string>, ms: number,
): MockResponse {
  const publicProduct = (p: (typeof PRODUCTS)[number]) => ({
    id: p.id, name: p.name, unit: p.unit, priceUGX: p.priceUGX, category: p.category, inStock: state.stock[p.id] ?? 0,
  });

  if (routeKey === "GET /v1/products") {
    let list = PRODUCTS;
    if (params.category) list = list.filter((p) => p.category === params.category.toLowerCase());
    if (params.q) {
      const q = params.q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.synonyms.some((s) => s.includes(q)));
    }
    if (params.limit !== undefined) {
      const n = Number(params.limit);
      if (!Number.isInteger(n) || n < 1 || n > 50) {
        return respond(400, errorBody("invalid_request_error", "Query parameter `limit` must be a whole number from 1 to 50."), ms, rl, routeKey);
      }
      list = list.slice(0, n);
    }
    return respond(200, { data: list.map(publicProduct), count: list.length }, ms, rl, routeKey);
  }

  if (routeKey === "GET /v1/products/{id}") {
    const p = id ? productById(id) : undefined;
    if (!p) return respond(404, errorBody("not_found_error", `No product with id "${id}". Try GET /v1/products to see the ids.`), ms, rl, routeKey);
    return respond(200, publicProduct(p), ms, rl, routeKey);
  }

  if (routeKey === "POST /v1/orders") {
    const v = validateOrder(json);
    if (!v.ok) return respond(400, errorBody("invalid_request_error", "The order is not valid.", { details: v.errors }), ms, rl, routeKey);
    const { customer, items, delivery } = v.value;
    const lines: Order["items"] = [];
    for (const it of items) {
      const p = productById(it.productId);
      if (!p) return respond(404, errorBody("not_found_error", `No product with id "${it.productId}".`), ms, rl, routeKey);
      const have = state.stock[p.id] ?? 0;
      if (have < it.quantity) {
        return respond(409, errorBody("conflict_error", `Not enough ${p.name} (${p.unit}): ${it.quantity} requested, ${have} in stock.`, { productId: p.id, inStock: have }), ms, rl, routeKey);
      }
      lines.push({ productId: p.id, name: `${p.name} (${p.unit})`, quantity: it.quantity, unitPriceUGX: p.priceUGX, lineTotalUGX: p.priceUGX * it.quantity });
    }
    for (const l of lines) state.stock[l.productId] -= l.quantity;
    const fee = delivery ? DELIVERY_FEE_UGX : 0;
    const order: Order = {
      id: `ord_${state.nextOrder++}`, customer, items: lines, delivery, deliveryFeeUGX: fee,
      totalUGX: lines.reduce((s, l) => s + l.lineTotalUGX, 0) + fee, currency: "UGX", status: "pending",
    };
    state.orders.set(order.id, order);
    return respond(201, order, ms + 60, { ...rl, location: `/v1/orders/${order.id}` }, routeKey);
  }

  if (routeKey === "GET /v1/orders/{id}") {
    const o = id ? state.orders.get(id) : undefined;
    if (!o) return respond(404, errorBody("not_found_error", `No order with id "${id}". Create one with POST /v1/orders first.`), ms, rl, routeKey);
    return respond(200, o, ms, rl, routeKey);
  }

  if (routeKey === "DELETE /v1/orders/{id}") {
    const o = id ? state.orders.get(id) : undefined;
    if (!o || o.status === "cancelled") return respond(404, errorBody("not_found_error", `No open order with id "${id}".`), ms, rl, routeKey);
    o.status = "cancelled";
    for (const l of o.items) state.stock[l.productId] += l.quantity;
    return respond(204, null, ms, rl, routeKey);
  }

  return respond(404, errorBody("not_found_error", "Unknown endpoint."), ms, rl, routeKey);
}

/** Validate the body of POST /v1/orders. */
export function validateOrder(
  body: unknown,
): { ok: true; value: { customer: string; items: { productId: string; quantity: number }[]; delivery: boolean } } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { ok: false, errors: ["The body must be a JSON object: { ... }."] };
  const b = body as Record<string, unknown>;
  if (typeof b.customer !== "string" || !b.customer.trim()) errors.push("`customer` is required and must be a text string, e.g. \"Okello\".");
  if (!Array.isArray(b.items) || b.items.length === 0) {
    errors.push("`items` is required and must be a non-empty list, e.g. [{ \"productId\": \"rice-25\", \"quantity\": 2 }].");
  } else {
    b.items.forEach((it, i) => {
      if (typeof it !== "object" || it === null) { errors.push(`items[${i}] must be an object.`); return; }
      const item = it as Record<string, unknown>;
      if (typeof item.productId !== "string") errors.push(`items[${i}].productId is required and must be a string.`);
      if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity < 1) {
        errors.push(`items[${i}].quantity must be a whole number of at least 1 (a number, not text like "two").`);
      }
    });
  }
  if (b.delivery !== undefined && typeof b.delivery !== "boolean") errors.push("`delivery` must be true or false (no quotes).");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      customer: (b.customer as string).trim(),
      items: (b.items as { productId: string; quantity: number }[]).map((x) => ({ productId: x.productId, quantity: x.quantity })),
      delivery: b.delivery === true,
    },
  };
}

/** Validate the body of the mock model endpoint POST /v1/messages. */
export function validateModelRequest(
  body: unknown,
): { ok: true; value: { model: string; max_tokens: number; system?: string; messages: { role: "user" | "assistant"; content: string }[] } } | { ok: false; status: 400 | 404; errors: string[] } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { ok: false, status: 400, errors: ["The body must be a JSON object."] };
  const b = body as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof b.model !== "string" || !b.model) errors.push("`model` is required (a model id such as \"sim-small-1\").");
  if (b.max_tokens === undefined) errors.push("`max_tokens` is required: the most tokens the reply may use.");
  else if (typeof b.max_tokens !== "number" || !Number.isInteger(b.max_tokens) || b.max_tokens < 1 || b.max_tokens > 4096) errors.push("`max_tokens` must be a whole number from 1 to 4096.");
  if (b.system !== undefined && typeof b.system !== "string") errors.push("`system` must be a string.");
  if (!Array.isArray(b.messages) || b.messages.length === 0) errors.push("`messages` is required and must be a non-empty list.");
  else {
    b.messages.forEach((m, i) => {
      const msg = m as Record<string, unknown>;
      if (!msg || (msg.role !== "user" && msg.role !== "assistant")) errors.push(`messages[${i}].role must be "user" or "assistant".`);
      if (!msg || typeof msg.content !== "string" || !msg.content.trim()) errors.push(`messages[${i}].content must be non-empty text.`);
    });
  }
  if (errors.length) return { ok: false, status: 400, errors };
  if (!MOCK_MODELS.some((m) => m.id === b.model)) {
    return { ok: false, status: 404, errors: [`Model "${b.model}" was not found. GET /v1/models lists the models you can use.`] };
  }
  return { ok: true, value: b as { model: string; max_tokens: number; system?: string; messages: { role: "user" | "assistant"; content: string }[] } };
}

/** The canned text the mock model "replies" with. It is NOT generated by a model. */
export function simulatedReply(lastUserMessage: string): string {
  const t = lastUserMessage.toLowerCase();
  if (/\b(price|cost|how much)\b/.test(t) || /\b(rice|sugar|posho|beans|eggs)\b/.test(t)) {
    return "(Simulated reply) I cannot see Mama Achen's price list or stock book, so any price I gave would be a guess. Her shop's own API has the real numbers: GET /v1/products.";
  }
  if (/\b(hello|hi|hey|oli otya|habari)\b/.test(t)) {
    return "(Simulated reply) Hello! How can I help you today?";
  }
  const quoted = lastUserMessage.length > 80 ? lastUserMessage.slice(0, 80) + "…" : lastUserMessage;
  return `(Simulated reply) You wrote: "${quoted}". A real model would generate a fresh answer here. This simulator only shows you the shape of the response: the text, the stop reason and the token usage.`;
}

function modelEndpoint(routeKey: string, json: unknown, respond: Respond, rl: Record<string, string>, seed: number): MockResponse {
  if (routeKey === "GET /v1/models") {
    return respond(200, { data: MOCK_MODELS.map((m) => ({ id: m.id, type: "model", note: m.note })) }, 60 + (seed % 60), rl, routeKey);
  }
  const v = validateModelRequest(json);
  if (!v.ok) {
    return respond(v.status, errorBody(v.status === 404 ? "not_found_error" : "invalid_request_error", v.errors.join(" "), { details: v.errors }), 50 + (seed % 60), rl, routeKey);
  }
  const { model, max_tokens, system, messages } = v.value;
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  let text = simulatedReply(lastUser);
  let stop_reason: "end_turn" | "max_tokens" = "end_turn";
  if (estimateTokens(text) > max_tokens) {
    text = text.slice(0, max_tokens * 4);
    stop_reason = "max_tokens";
  }
  const input_tokens = estimateTokens(system ?? "") + messages.reduce((s, m) => s + estimateTokens(m.content) + 3, 0);
  const output_tokens = estimateTokens(text);
  return respond(
    200,
    {
      id: `msg_sim_${(seed % 100000).toString().padStart(5, "0")}`,
      type: "message",
      role: "assistant",
      model,
      content: [{ type: "text", text }],
      stop_reason,
      usage: { input_tokens, output_tokens },
    },
    350 + output_tokens * 12 + (seed % 200),
    rl,
    routeKey,
  );
}

/* ------------------------------------------------------------------ */
/*  Explanations shown under each response                              */
/* ------------------------------------------------------------------ */

export function explainResponse(res: MockResponse, clientTimeoutMs = 10_000): { title: string; meaning: string; fix: string; tone: "ok" | "warn" | "bad" } {
  if (res.kind === "network") {
    return { title: "No connection: the address could not be found", meaning: "The host name did not lead to any server (in real life: a DNS failure, no internet, or a typo in the host).", fix: "Check the host name. In this simulator only api.mama-achen.example and api.model-provider.example exist.", tone: "bad" };
  }
  if (res.kind === "timeout") {
    return { title: `Timed out: no reply after ${clientTimeoutMs / 1000} s`, meaning: "Your code stopped waiting. There is no status code because no response arrived at all. The server may still be working on the request.", fix: "Retry later with backoff. For slow operations, raise the timeout a little, but never wait forever.", tone: "bad" };
  }
  const s = res.status;
  const map: Record<number, { title: string; meaning: string; fix: string }> = {
    200: { title: "200 OK", meaning: "Success. The body holds what you asked for.", fix: "Nothing to fix. Read the body." },
    201: { title: "201 Created", meaning: "Success, and something new was created. The Location header says where it lives.", fix: "Nothing to fix. Keep the new id." },
    204: { title: "204 No Content", meaning: "Success, with nothing to send back (common after a delete).", fix: "Nothing to fix. There is no body to read." },
    400: { title: "400 Bad Request", meaning: "The server could not accept what you sent: broken JSON, a missing field, or a value of the wrong type.", fix: "Read the error message, fix the request, then send again. Retrying unchanged will fail again." },
    401: { title: "401 Unauthorized", meaning: "The server does not know who you are: the key is missing, badly formatted or wrong.", fix: "Send the right key as `Authorization: Bearer <key>`. Retrying unchanged will fail again." },
    403: { title: "403 Forbidden", meaning: "The server knows who you are, but this key is not allowed to do this.", fix: "Use a key with the right permissions. Retrying will not help." },
    404: { title: "404 Not Found", meaning: "Nothing exists at that path (or with that id, or that model name).", fix: "Check the path and ids for typos." },
    405: { title: "405 Method Not Allowed", meaning: "The path exists, but not with this method. The Allow header lists the methods it accepts.", fix: "Change the method to one in the Allow header." },
    409: { title: "409 Conflict", meaning: "The request clashes with the current state, here: not enough stock.", fix: "Change the request (a smaller quantity, or an alternative product)." },
    415: { title: "415 Unsupported Media Type", meaning: "The server did not get a body type it understands.", fix: "Add the header `Content-Type: application/json`." },
    429: { title: "429 Too Many Requests", meaning: "You hit the rate limit. The Retry-After header says how many seconds to wait.", fix: "Wait at least Retry-After seconds, then retry. Slow your code down." },
    500: { title: "500 Internal Server Error", meaning: "Something broke inside the server. Not your request's fault.", fix: "Retry a few times with backoff. If it continues, stop and report it with the request-id." },
    503: { title: "503 Service Unavailable", meaning: "The server is overloaded or down for a moment.", fix: "Retry with backoff, respecting Retry-After if present." },
    504: { title: "504 Gateway Timeout", meaning: "A gateway in front of the server waited too long for it and gave up.", fix: "Retry later with backoff. If it keeps happening, the request may be too big or slow." },
  };
  const m = map[s] ?? { title: `${s}`, meaning: "Unrecognised status.", fix: "Check the documentation." };
  return { ...m, tone: s < 300 ? "ok" : s < 500 ? "warn" : "bad" };
}

/* ------------------------------------------------------------------ */
/*  Presets and challenges                                              */
/* ------------------------------------------------------------------ */

const kv = (name: string, value: string, enabled = true): KV => ({ name, value, enabled });
const JSON_CT = kv("Content-Type", "application/json");

export const PRESETS: { id: string; label: string; draft: RequestDraft }[] = [
  { id: "list-products", label: "List products", draft: { method: "GET", host: SHOP_HOST, path: "/v1/products", query: [kv("category", "grains"), kv("limit", "3")], headers: [], body: "" } },
  { id: "one-product", label: "One product", draft: { method: "GET", host: SHOP_HOST, path: "/v1/products/rice-25", query: [], headers: [], body: "" } },
  {
    id: "place-order", label: "Place an order",
    draft: {
      method: "POST", host: SHOP_HOST, path: "/v1/orders", query: [],
      headers: [JSON_CT, kv("Authorization", `Bearer ${SHOP_KEY}`)],
      body: JSON.stringify({ customer: "Okello", items: [{ productId: "rice-25", quantity: 2 }], delivery: true }, null, 2),
    },
  },
  {
    id: "ask-model", label: "Ask the model",
    draft: {
      method: "POST", host: MODEL_HOST, path: "/v1/messages", query: [],
      headers: [JSON_CT, kv("Authorization", `Bearer ${MODEL_KEY}`)],
      body: JSON.stringify({ model: "sim-small-1", max_tokens: 200, system: "You are a polite assistant for a Kampala shop.", messages: [{ role: "user", content: "Hello! What can you help me with?" }] }, null, 2),
    },
  },
  { id: "list-models", label: "List models", draft: { method: "GET", host: MODEL_HOST, path: "/v1/models", query: [], headers: [kv("Authorization", `Bearer ${MODEL_KEY}`)], body: "" } },
];

export function preset(id: string): RequestDraft {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
  return structuredCloneDraft(p.draft);
}

export function structuredCloneDraft(d: RequestDraft): RequestDraft {
  return { ...d, query: d.query.map((x) => ({ ...x })), headers: d.headers.map((x) => ({ ...x })) };
}

export interface ChallengeEvent {
  draft: RequestDraft;
  res: MockResponse;
  /** True when this response came from the auto-retry helper after at least one failure. */
  viaRetry?: boolean;
  /** Statuses seen since this challenge was loaded (oldest first), including this one. */
  seen: number[];
}

export interface ChallengeDef {
  id: string;
  title: string;
  brief: string;
  goal: string;
  start: RequestDraft;
  condition?: ServerCondition;
  autoRetry?: boolean;
  isSolved: (e: ChallengeEvent) => boolean;
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "wrong-method",
    title: "1 · The order that will not go in",
    brief: "This request should place an order for Okello, but the shop replies 405. Read the Allow header and fix the request.",
    goal: "Get a 201 Created from /v1/orders.",
    start: {
      method: "GET", host: SHOP_HOST, path: "/v1/orders", query: [],
      headers: [JSON_CT, kv("Authorization", `Bearer ${SHOP_KEY}`)],
      body: JSON.stringify({ customer: "Okello", items: [{ productId: "beans-1", quantity: 3 }] }, null, 2),
    },
    isSolved: (e) => e.res.status === 201 && e.res.route === "POST /v1/orders",
  },
  {
    id: "bad-json",
    title: "2 · The broken order form",
    brief: "Nakato's order is rejected with 400. There are two problems in the body: one makes it invalid JSON, the other breaks the shop's rules. Fix both.",
    goal: "Get a 201 Created from /v1/orders.",
    start: {
      method: "POST", host: SHOP_HOST, path: "/v1/orders", query: [],
      headers: [JSON_CT, kv("Authorization", `Bearer ${SHOP_KEY}`)],
      body: `{\n  "customer": "Nakato",\n  "items": [\n    { "productId": "sugar-1", "quantity": "two" },\n  ]\n}`,
    },
    isSolved: (e) => e.res.status === 201 && e.res.route === "POST /v1/orders",
  },
  {
    id: "no-key",
    title: "3 · The model that will not answer",
    brief: "This call to the model provider gets 401. Something is missing from the headers. Use the right key from the Keys panel.",
    goal: "Get a 200 OK from the model's /v1/messages.",
    start: {
      method: "POST", host: MODEL_HOST, path: "/v1/messages", query: [],
      headers: [JSON_CT],
      body: JSON.stringify({ model: "sim-small-1", max_tokens: 150, messages: [{ role: "user", content: "Hello! Write one sentence welcoming customers to the shop." }] }, null, 2),
    },
    isSolved: (e) => e.res.status === 200 && e.res.route === "POST /v1/messages",
  },
  {
    id: "rate-limit",
    title: "Rate limit: wait your turn",
    brief: "Press “Send 8 quickly” to fire a burst of requests. Some will get 429. Read the Retry-After header, wait that long, then send once more.",
    goal: "See a 429, then get a 200 after waiting.",
    start: { method: "GET", host: SHOP_HOST, path: "/v1/products", query: [kv("limit", "2")], headers: [], body: "" },
    isSolved: (e) => e.res.status === 200 && e.seen.slice(0, -1).includes(429),
  },
  {
    id: "busy-retry",
    title: "Busy server: retry with backoff",
    brief: "The model provider is busy (it fails twice, then recovers). Turn on “Retry automatically with backoff” and send. Then try the “Broken” server: does retrying help there?",
    goal: "Get a 200 through automatic retries after a 503.",
    start: {
      method: "POST", host: MODEL_HOST, path: "/v1/messages", query: [],
      headers: [JSON_CT, kv("Authorization", `Bearer ${MODEL_KEY}`)],
      body: JSON.stringify({ model: "sim-small-1", max_tokens: 100, messages: [{ role: "user", content: "Hello!" }] }, null, 2),
    },
    condition: "busy",
    isSolved: (e) => e.res.status === 200 && e.viaRetry === true,
  },
];

export const DEFAULT_CHALLENGES = ["wrong-method", "bad-json", "no-key"];

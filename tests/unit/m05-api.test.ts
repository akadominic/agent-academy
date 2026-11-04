import { describe, expect, it } from "vitest";
import {
  CHALLENGES, MODEL_HOST, MODEL_KEY, RateLimiter, SHOP_HOST, SHOP_KEY, SHOP_READONLY_KEY,
  createServerState, estimateCostUSD, estimateTokens, explainResponse, handleRequest, preset,
  tryParseJson, validateModelRequest, validateOrder, type KV, type RequestDraft,
} from "@/labs/m05/mockApi";
import { backoffDelayMs, isRetryable, runWithRetry } from "@/labs/m05/retry";
import { buildUrl, curlCommand, fetchCode, queryString, rawHttp } from "@/labs/m05/codegen";
import {
  ATTACK, CALL_CHOICES, LEAK_CHOICES, PLACEMENT_CHOICES, attackerCostUSD, checkGitignore, committedFiles, gitignoreText, isCorrect,
} from "@/labs/m05/keyExposure";

const kv = (name: string, value: string): KV => ({ name, value, enabled: true });
const T0 = 1_000_000;

function draft(over: Partial<RequestDraft>): RequestDraft {
  return { method: "GET", host: SHOP_HOST, path: "/v1/products", query: [], headers: [], body: "", ...over };
}
const orderBody = JSON.stringify({ customer: "Okello", items: [{ productId: "rice-25", quantity: 2 }], delivery: true });
const shopAuth = [kv("Content-Type", "application/json"), kv("Authorization", `Bearer ${SHOP_KEY}`)];

describe("mock shop API", () => {
  it("lists products publicly with query filters", () => {
    const s = createServerState();
    const r = handleRequest(draft({ query: [kv("category", "grains"), kv("limit", "2")] }), s, { now: T0 });
    expect(r.status).toBe(200);
    const body = r.body as { data: { category: string }[]; count: number };
    expect(body.count).toBe(2);
    expect(body.data.every((p) => p.category === "grains")).toBe(true);
    expect(r.headers["x-ratelimit-remaining"]).toBe("4");
  });

  it("rejects a bad limit with 400", () => {
    const r = handleRequest(draft({ query: [kv("limit", "abc")] }), createServerState(), { now: T0 });
    expect(r.status).toBe(400);
  });

  it("404s for an unknown path and an unknown product", () => {
    const s = createServerState();
    expect(handleRequest(draft({ path: "/v1/prodcts" }), s, { now: T0 }).status).toBe(404);
    expect(handleRequest(draft({ path: "/v1/products/caviar" }), s, { now: T0 }).status).toBe(404);
  });

  it("405s with an Allow header for the wrong method", () => {
    const r = handleRequest(draft({ path: "/v1/orders", headers: shopAuth }), createServerState(), { now: T0 });
    expect(r.status).toBe(405);
    expect(r.headers.allow).toBe("POST");
  });

  it("creates an order (201) with totals, Location header, and reduces stock", () => {
    const s = createServerState();
    const before = s.stock["rice-25"];
    const r = handleRequest(draft({ method: "POST", path: "/v1/orders", headers: shopAuth, body: orderBody }), s, { now: T0 });
    expect(r.status).toBe(201);
    const o = r.body as { id: string; totalUGX: number };
    expect(o.totalUGX).toBe(110_000 * 2 + 5_000);
    expect(r.headers.location).toBe(`/v1/orders/${o.id}`);
    expect(s.stock["rice-25"]).toBe(before - 2);
    // and it can be read back, then cancelled
    expect(handleRequest(draft({ path: `/v1/orders/${o.id}`, headers: shopAuth }), s, { now: T0 }).status).toBe(200);
    expect(handleRequest(draft({ method: "DELETE", path: `/v1/orders/${o.id}`, headers: shopAuth }), s, { now: T0 }).status).toBe(204);
    expect(s.stock["rice-25"]).toBe(before);
  });

  it("401s for a missing, malformed or wrong key; 403 for a read-only key", () => {
    const base = { method: "POST" as const, path: "/v1/orders", body: orderBody };
    const ct = kv("Content-Type", "application/json");
    expect(handleRequest(draft({ ...base, headers: [ct] }), createServerState(), { now: T0 }).status).toBe(401);
    expect(handleRequest(draft({ ...base, headers: [ct, kv("Authorization", SHOP_KEY)] }), createServerState(), { now: T0 }).status).toBe(401);
    expect(handleRequest(draft({ ...base, headers: [ct, kv("Authorization", "Bearer nope")] }), createServerState(), { now: T0 }).status).toBe(401);
    expect(handleRequest(draft({ ...base, headers: [ct, kv("Authorization", `Bearer ${SHOP_READONLY_KEY}`)] }), createServerState(), { now: T0 }).status).toBe(403);
  });

  it("400s for invalid JSON and for a rule-breaking order; 415 without Content-Type", () => {
    const s = createServerState();
    const bad = handleRequest(draft({ method: "POST", path: "/v1/orders", headers: shopAuth, body: '{ "customer": "A", }' }), s, { now: T0 });
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body)).toContain("comma");
    const rules = handleRequest(draft({ method: "POST", path: "/v1/orders", headers: shopAuth, body: '{"customer":"A","items":[{"productId":"rice-25","quantity":"two"}]}' }), s, { now: T0 });
    expect(rules.status).toBe(400);
    const noCt = handleRequest(draft({ method: "POST", path: "/v1/orders", headers: [kv("Authorization", `Bearer ${SHOP_KEY}`)], body: orderBody }), s, { now: T0 });
    expect(noCt.status).toBe(415);
  });

  it("409s when stock is too low (eggs are out of stock)", () => {
    const body = JSON.stringify({ customer: "A", items: [{ productId: "eggs-tray", quantity: 1 }] });
    const r = handleRequest(draft({ method: "POST", path: "/v1/orders", headers: shopAuth, body }), createServerState(), { now: T0 });
    expect(r.status).toBe(409);
  });

  it("rate-limits with 429 and Retry-After, then allows again after the window", () => {
    const s = createServerState();
    for (let i = 0; i < 5; i++) expect(handleRequest(draft({}), s, { now: T0 + i * 100 }).status).toBe(200);
    const limited = handleRequest(draft({}), s, { now: T0 + 600 });
    expect(limited.status).toBe(429);
    expect(Number(limited.headers["retry-after"])).toBeGreaterThanOrEqual(1);
    expect(handleRequest(draft({}), s, { now: T0 + 10_100 }).status).toBe(200);
  });

  it("server conditions: broken=500, busy=503 twice then 200, slow=timeout or 504", () => {
    expect(handleRequest(draft({}), createServerState(), { now: T0, condition: "broken" }).status).toBe(500);
    const s = createServerState();
    const statuses = [0, 1, 2].map((i) => handleRequest(draft({}), s, { now: T0 + i, condition: "busy" }).status);
    expect(statuses).toEqual([503, 503, 200]);
    const t = handleRequest(draft({}), createServerState(), { now: T0, condition: "slow", clientTimeoutMs: 10_000 });
    expect(t.kind).toBe("timeout");
    expect(handleRequest(draft({}), createServerState(), { now: T0, condition: "slow", clientTimeoutMs: 60_000 }).status).toBe(504);
  });

  it("returns a network error for an unknown host", () => {
    expect(handleRequest(draft({ host: "api.mama-achen.exmaple" }), createServerState(), { now: T0 }).kind).toBe("network");
  });
});

describe("mock model provider", () => {
  const modelHeaders = [kv("Content-Type", "application/json"), kv("Authorization", `Bearer ${MODEL_KEY}`)];
  const req = (body: unknown) => draft({ method: "POST", host: MODEL_HOST, path: "/v1/messages", headers: modelHeaders, body: JSON.stringify(body) });

  it("returns text, stop_reason and usage tokens", () => {
    const r = handleRequest(req({ model: "sim-small-1", max_tokens: 200, messages: [{ role: "user", content: "hello" }] }), createServerState(), { now: T0 });
    expect(r.status).toBe(200);
    const b = r.body as { content: { type: string; text: string }[]; stop_reason: string; usage: { input_tokens: number; output_tokens: number } };
    expect(b.content[0].type).toBe("text");
    expect(b.content[0].text).toContain("Simulated");
    expect(b.stop_reason).toBe("end_turn");
    expect(b.usage.input_tokens).toBeGreaterThan(0);
    expect(b.usage.output_tokens).toBe(estimateTokens(b.content[0].text));
  });

  it("stops at max_tokens", () => {
    const r = handleRequest(req({ model: "sim-small-1", max_tokens: 3, messages: [{ role: "user", content: "hello" }] }), createServerState(), { now: T0 });
    expect((r.body as { stop_reason: string }).stop_reason).toBe("max_tokens");
  });

  it("400 for missing max_tokens, 404 for an unknown model, 401 with the shop key", () => {
    expect(handleRequest(req({ model: "sim-small-1", messages: [{ role: "user", content: "hi" }] }), createServerState(), { now: T0 }).status).toBe(400);
    expect(handleRequest(req({ model: "gpt-nope", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }), createServerState(), { now: T0 }).status).toBe(404);
    const wrongKey = draft({ method: "POST", host: MODEL_HOST, path: "/v1/messages", headers: [kv("Content-Type", "application/json"), kv("Authorization", `Bearer ${SHOP_KEY}`)], body: "{}" });
    expect(handleRequest(wrongKey, createServerState(), { now: T0 }).status).toBe(401);
  });

  it("validators and helpers", () => {
    expect(validateModelRequest({ model: "sim-small-1", max_tokens: 10, messages: [{ role: "robot", content: "x" }] }).ok).toBe(false);
    expect(validateOrder({ customer: "A", items: [{ productId: "x", quantity: 1.5 }] }).ok).toBe(false);
    expect(estimateCostUSD({ input_tokens: 1_000_000, output_tokens: 500_000 }, { inputPerMTok: 3, outputPerMTok: 15 })).toBeCloseTo(10.5);
    expect(tryParseJson("{'a':1}").ok).toBe(false);
    expect(explainResponse({ kind: "response", status: 429, statusText: "", headers: {}, body: null, ms: 1 }).tone).toBe("warn");
  });
});

describe("challenges", () => {
  it("each broken start request fails, and the obvious fix solves it", () => {
    const fixes: Record<string, (d: RequestDraft) => RequestDraft> = {
      "wrong-method": (d) => ({ ...d, method: "POST" }),
      "bad-json": (d) => ({ ...d, body: '{ "customer": "Nakato", "items": [ { "productId": "sugar-1", "quantity": 2 } ] }' }),
      "no-key": (d) => ({ ...d, headers: [...d.headers, kv("Authorization", `Bearer ${MODEL_KEY}`)] }),
    };
    for (const [id, fix] of Object.entries(fixes)) {
      const c = CHALLENGES.find((x) => x.id === id)!;
      const s = createServerState();
      const broken = handleRequest(c.start, s, { now: T0 });
      expect(c.isSolved({ draft: c.start, res: broken, seen: [broken.status] })).toBe(false);
      const fixed = fix(c.start);
      const ok = handleRequest(fixed, s, { now: T0 + 1 });
      expect(c.isSolved({ draft: fixed, res: ok, seen: [broken.status, ok.status] })).toBe(true);
    }
  });

  it("bad-json has two separate problems", () => {
    const c = CHALLENGES.find((x) => x.id === "bad-json")!;
    const onlyComma = { ...c.start, body: c.start.body.replace("},\n", "}\n") };
    const r = handleRequest(onlyComma, createServerState(), { now: T0 });
    expect(r.status).toBe(400);
    expect(JSON.stringify(r.body)).toContain("quantity");
  });

  it("rate-limit challenge needs a 429 before the 200", () => {
    const c = CHALLENGES.find((x) => x.id === "rate-limit")!;
    const ok = { kind: "response" as const, status: 200, statusText: "OK", headers: {}, body: null, ms: 1 };
    expect(c.isSolved({ draft: c.start, res: ok, seen: [200, 200] })).toBe(false);
    expect(c.isSolved({ draft: c.start, res: ok, seen: [200, 429, 200] })).toBe(true);
  });

  it("presets produce successful requests", () => {
    const s = createServerState();
    for (const id of ["list-products", "one-product", "place-order", "ask-model", "list-models"]) {
      expect(handleRequest(preset(id), s, { now: T0 }).status).toBeLessThan(300);
    }
  });
});

describe("retry with backoff", () => {
  it("knows what is retryable", () => {
    expect(isRetryable({ kind: "response", status: 503 })).toBe(true);
    expect(isRetryable({ kind: "response", status: 429 })).toBe(true);
    expect(isRetryable({ kind: "timeout", status: 0 })).toBe(true);
    expect(isRetryable({ kind: "response", status: 400 })).toBe(false);
    expect(isRetryable({ kind: "response", status: 401 })).toBe(false);
  });

  it("doubles the delay, caps it, and obeys Retry-After", () => {
    expect([1, 2, 3, 4].map((n) => backoffDelayMs(n))).toEqual([500, 1000, 2000, 4000]);
    expect(backoffDelayMs(10, { maxMs: 8000 })).toBe(8000);
    expect(backoffDelayMs(1, { retryAfterSec: 3 })).toBe(3000);
    expect(backoffDelayMs(1, { jitter: 0.5 })).toBe(750);
  });

  it("gets through a busy server, gives up on a broken one, and never retries a 401", () => {
    const s = createServerState();
    const busy = runWithRetry((w) => handleRequest(draft({}), s, { now: T0 + w, condition: "busy" }));
    expect(busy.attempts.map((a) => a.res.status)).toEqual([503, 503, 200]);
    expect(busy.waitedMs).toBe(2000); // Retry-After: 1 twice

    const s2 = createServerState();
    const broken = runWithRetry((w) => handleRequest(draft({}), s2, { now: T0 + w, condition: "broken" }), { maxAttempts: 3 });
    expect(broken.attempts.length).toBe(3);
    expect(broken.attempts[2].decision).toBe("give-up-max-attempts");

    const auth = runWithRetry(() => handleRequest(draft({ method: "POST", path: "/v1/orders", body: orderBody, headers: [kv("Content-Type", "application/json")] }), createServerState(), { now: T0 }));
    expect(auth.attempts.length).toBe(1);
    expect(auth.attempts[0].decision).toBe("give-up-not-retryable");
  });
});

describe("code generation", () => {
  const d = draft({ method: "POST", path: "/v1/orders", query: [kv("dry run", "yes&no")], headers: shopAuth, body: orderBody });

  it("builds URLs with encoded query strings", () => {
    expect(queryString([kv("a", "1"), { name: "b", value: "2", enabled: false }])).toBe("?a=1");
    expect(buildUrl(d)).toBe("https://api.mama-achen.example/v1/orders?dry%20run=yes%26no");
  });

  it("writes raw HTTP with a request line, Host and Content-Length", () => {
    const raw = rawHttp(d);
    expect(raw.split("\n")[0]).toBe("POST /v1/orders?dry%20run=yes%26no HTTP/1.1");
    expect(raw).toContain("Host: api.mama-achen.example");
    expect(raw).toContain(`Content-Length: ${new TextEncoder().encode(orderBody).length}`);
    expect(raw.endsWith(orderBody)).toBe(true);
  });

  it("fetch code never contains the key and reads it from process.env", () => {
    const code = fetchCode(d);
    expect(code).not.toContain(SHOP_KEY);
    expect(code).toContain("${process.env.SHOP_API_KEY}");
    expect(code).toContain('method: "POST"');
    expect(code).toContain("JSON.stringify(");
    // The generated object literal is valid JS
    const literal = code.slice(code.indexOf("JSON.stringify(") + 15, code.lastIndexOf("),"));
    expect(JSON.parse(literal)).toEqual(JSON.parse(orderBody));
  });

  it("fetch code for GET omits method and any body", () => {
    const code = fetchCode(draft({ body: "{}" }));
    expect(code).not.toContain("method:");
    expect(code).toContain("refuses to send a body with GET");
  });

  it("curl uses $ENV for keys and safely quotes the body", () => {
    const c = curlCommand({ ...d, body: JSON.stringify({ customer: "O'Neil", items: [] }) });
    expect(c).toContain('-H "Authorization: Bearer $SHOP_API_KEY"');
    expect(c).not.toContain(SHOP_KEY);
    expect(c).toContain(`-d '{"customer":"O'\\''Neil","items":[]}'`);
    expect(c.startsWith('curl -X POST "https://api.mama-achen.example/v1/orders')).toBe(true);
    expect(curlCommand(draft({})).startsWith('curl "https://')).toBe(true);
  });
});

describe("key exposure lab logic", () => {
  it("only the server-side env choice and own-route call are correct", () => {
    expect(PLACEMENT_CHOICES.filter((c) => c.correct).map((c) => c.id)).toEqual(["server-env"]);
    expect(isCorrect(PLACEMENT_CHOICES, "public-env")).toBe(false);
    expect(isCorrect(CALL_CHOICES, "own-route")).toBe(true);
    expect(isCorrect(LEAK_CHOICES, "rotate")).toBe(true);
    expect(isCorrect(LEAK_CHOICES, null)).toBe(false);
  });

  it("checks the .gitignore selection", () => {
    expect(checkGitignore([".env.local", "node_modules/"]).ok).toBe(true);
    expect(checkGitignore(["node_modules/"]).missing).toEqual([".env.local"]);
    expect(checkGitignore([".env.local", "node_modules/", ".env.example"]).wrong).toEqual([".env.example"]);
    expect(gitignoreText([".env.local"])).toContain(".env.local");
    expect(committedFiles([".env.local", "node_modules/"])).not.toContain(".env.local");
  });

  it("computes the illustrative attack cost", () => {
    const c = attackerCostUSD(ATTACK);
    expect(c.requests).toBe(288_000);
    expect(c.tokens).toBe(288_000_000);
    expect(c.usd).toBeCloseTo(2880);
  });
});

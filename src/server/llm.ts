/**
 * SERVER-ONLY: talks to real model providers.
 * API keys are read from environment variables on the server and are
 * never sent to the browser. Live AI is OFF unless LIVE_AI_ENABLED=true.
 *
 * Provider formats implemented from the providers' public API references:
 *  - Anthropic Messages API: POST https://api.anthropic.com/v1/messages
 *  - OpenAI Chat Completions API: POST https://api.openai.com/v1/chat/completions
 * Model names are NOT hard-coded: set ANTHROPIC_MODEL / OPENAI_MODEL to a
 * current model from the provider's documentation.
 */
import "server-only";
import type { Message, ModelRequest, ModelResponse, ToolCall } from "@/engine/agent/types";

export type Provider = "anthropic" | "openai";

export interface LiveConfig {
  enabled: boolean;
  providers: Provider[];
  maxOutputTokens: number;
  perIpPerHour: number;
  dailyCap: number;
  accessCode?: string;
}

export function liveConfig(): LiveConfig {
  const enabled = process.env.LIVE_AI_ENABLED === "true";
  const providers: Provider[] = [];
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL) providers.push("anthropic");
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) providers.push("openai");
  return {
    enabled: enabled && providers.length > 0,
    providers,
    maxOutputTokens: Number(process.env.LIVE_MAX_OUTPUT_TOKENS ?? 600),
    perIpPerHour: Number(process.env.LIVE_REQUESTS_PER_IP_PER_HOUR ?? 30),
    dailyCap: Number(process.env.LIVE_DAILY_REQUEST_CAP ?? 300),
    accessCode: process.env.LIVE_ACCESS_CODE || undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Usage limits (in memory: resets when the server restarts, and is   */
/*  per-instance on serverless hosts — see docs/DEPLOYMENT.md)          */
/* ------------------------------------------------------------------ */
const hits = new Map<string, number[]>();
let day = new Date().toISOString().slice(0, 10);
let dayCount = 0;

// #region rate-limit
export function checkLimits(ip: string, cfg: LiveConfig): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; dayCount = 0; }
  if (dayCount >= cfg.dailyCap) return "This server's daily limit for live AI requests has been reached. Simulated mode still works.";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= cfg.perIpPerHour) return `Limit reached: ${cfg.perIpPerHour} live requests per hour. Try again later.`;
  recent.push(now);
  hits.set(ip, recent);
  dayCount += 1;
  return null;
}
// #endregion rate-limit

/* ------------------------------------------------------------------ */

const TIMEOUT_MS = 30_000;

async function postJSON(url: string, headers: Record<string, string>, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data as { error?: { message?: string } }).error?.message ?? res.statusText;
      throw new Error(`Provider returned ${res.status}: ${msg}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// #region anthropic-call
async function callAnthropic(req: ModelRequest, maxTokens: number): Promise<ModelResponse> {
  // Our neutral messages -> Anthropic's format (tool calls and results are content blocks).
  const messages: { role: "user" | "assistant"; content: unknown }[] = [];
  for (const m of req.messages) {
    if (m.role === "user") messages.push({ role: "user", content: m.content });
    else if (m.role === "assistant") {
      const blocks: unknown[] = [];
      if (m.content) blocks.push({ type: "text", text: m.content });
      for (const c of m.toolCalls ?? []) blocks.push({ type: "tool_use", id: c.id, name: c.name, input: c.arguments });
      messages.push({ role: "assistant", content: blocks.length ? blocks : m.content });
    } else if (m.role === "tool") {
      const block = { type: "tool_result", tool_use_id: m.toolCallId, content: m.content };
      const last = messages.at(-1);
      // Consecutive tool results belong in ONE user message.
      if (last?.role === "user" && Array.isArray(last.content)) (last.content as unknown[]).push(block);
      else messages.push({ role: "user", content: [block] });
    }
  }
  const data = await postJSON(
    "https://api.anthropic.com/v1/messages",
    { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    {
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: req.system,
      messages,
      ...(req.tools.length ? { tools: req.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema })) } : {}),
    },
  );
  const content = (data.content ?? []) as { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[];
  const text = content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const calls: ToolCall[] = content.filter((b) => b.type === "tool_use").map((b) => ({ id: b.id!, name: b.name!, arguments: b.input ?? {} }));
  const usage = { inputTokens: data.usage?.input_tokens ?? 0, outputTokens: data.usage?.output_tokens ?? 0 };
  return calls.length ? { type: "tool_calls", calls, text, usage } : { type: "final", text, usage };
}
// #endregion anthropic-call

// #region openai-call
async function callOpenAI(req: ModelRequest, maxTokens: number): Promise<ModelResponse> {
  const messages: unknown[] = [{ role: "system", content: req.system }];
  for (const m of req.messages as Message[]) {
    if (m.role === "user") messages.push({ role: "user", content: m.content });
    else if (m.role === "assistant")
      messages.push({
        role: "assistant",
        content: m.content || null,
        ...(m.toolCalls?.length ? {
          tool_calls: m.toolCalls.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: JSON.stringify(c.arguments) } })),
        } : {}),
      });
    else if (m.role === "tool") messages.push({ role: "tool", tool_call_id: m.toolCallId, content: m.content });
  }
  const data = await postJSON(
    "https://api.openai.com/v1/chat/completions",
    { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    {
      model: process.env.OPENAI_MODEL,
      max_completion_tokens: maxTokens,
      messages,
      ...(req.tools.length ? { tools: req.tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.inputSchema } })) } : {}),
    },
  );
  const msg = data.choices?.[0]?.message ?? {};
  const usage = { inputTokens: data.usage?.prompt_tokens ?? 0, outputTokens: data.usage?.completion_tokens ?? 0 };
  const calls: ToolCall[] = (msg.tool_calls ?? []).map((c: { id: string; function: { name: string; arguments: string } }) => {
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(c.function.arguments || "{}"); } catch { args = { __unparseable: c.function.arguments }; }
    return { id: c.id, name: c.function.name, arguments: args };
  });
  return calls.length ? { type: "tool_calls", calls, text: msg.content ?? "", usage } : { type: "final", text: msg.content ?? "", usage };
}
// #endregion openai-call

export async function callModel(provider: Provider, req: ModelRequest, maxTokens: number): Promise<ModelResponse> {
  return provider === "anthropic" ? callAnthropic(req, maxTokens) : callOpenAI(req, maxTokens);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "local";
}

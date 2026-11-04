import { callModel, checkLimits, clientIp, liveConfig, type Provider } from "@/server/llm";
import type { ModelRequest } from "@/engine/agent/types";

const MAX_REQUEST_CHARS = 60_000;

// #region model-route
export async function POST(req: Request) {
  const cfg = liveConfig();
  if (!cfg.enabled) {
    return Response.json({ error: "Live AI is not configured on this server. Use the simulated model, or see docs/LIVE_AI.md." }, { status: 503 });
  }
  if (cfg.accessCode && req.headers.get("x-access-code") !== cfg.accessCode) {
    return Response.json({ error: "Access code required for live AI on this server." }, { status: 401 });
  }

  let body: { provider?: Provider; request?: ModelRequest };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const provider = body.provider ?? cfg.providers[0];
  const request = body.request;
  if (!cfg.providers.includes(provider)) return Response.json({ error: `Provider "${provider}" is not configured.` }, { status: 400 });
  if (!request || typeof request.system !== "string" || !Array.isArray(request.messages) || !Array.isArray(request.tools)) {
    return Response.json({ error: "Body must be { provider, request: { system, messages, tools } }." }, { status: 400 });
  }
  if (JSON.stringify(request).length > MAX_REQUEST_CHARS || request.tools.length > 12 || request.messages.length > 60) {
    return Response.json({ error: "Request too large for this demo server." }, { status: 413 });
  }

  const limited = checkLimits(clientIp(req.headers), cfg);
  if (limited) return Response.json({ error: limited }, { status: 429 });

  try {
    const response = await callModel(provider, request, cfg.maxOutputTokens);
    return Response.json(response);
  } catch (e) {
    return Response.json({ error: (e as Error).name === "AbortError" ? "The provider timed out." : (e as Error).message }, { status: 502 });
  }
}
// #endregion model-route

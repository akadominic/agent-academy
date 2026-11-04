import { liveConfig } from "@/server/llm";

/** Tells the browser whether live AI is available. Never reveals keys. */
export async function GET() {
  const cfg = liveConfig();
  return Response.json({
    live: cfg.enabled,
    providers: cfg.enabled ? cfg.providers : [],
    tutor: cfg.enabled,
    provider: cfg.enabled ? cfg.providers[0] : null,
    needsAccessCode: Boolean(cfg.accessCode),
    limits: { perIpPerHour: cfg.perIpPerHour, maxOutputTokens: cfg.maxOutputTokens },
  });
}

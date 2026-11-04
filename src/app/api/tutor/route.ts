import { callModel, checkLimits, clientIp, liveConfig } from "@/server/llm";
import { getLesson } from "@/content/curriculum";

export async function POST(req: Request) {
  const cfg = liveConfig();
  if (!cfg.enabled) return Response.json({ error: "The live tutor is not configured on this server." }, { status: 503 });
  if (cfg.accessCode && req.headers.get("x-access-code") !== cfg.accessCode) {
    return Response.json({ error: "Access code required." }, { status: 401 });
  }
  let body: { question?: string; lessonId?: string; history?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const question = String(body.question ?? "").slice(0, 1500).trim();
  if (!question) return Response.json({ error: "Please ask a question." }, { status: 400 });
  const limited = checkLimits(clientIp(req.headers), cfg);
  if (limited) return Response.json({ error: limited }, { status: 429 });

  const lesson = body.lessonId ? getLesson(body.lessonId) : undefined;
  const system = [
    "You are a patient, encouraging tutor in Agent Academy, a course that teaches complete beginners in Uganda to build AI agents.",
    "Explain simply but accurately. Never talk down. Use everyday Ugandan examples (shops, boda-boda dispatch, mobile money) when they genuinely help.",
    "Guide with questions and hints before giving full answers, especially for code. Point out misconceptions kindly.",
    "You only know what is in this conversation; do not claim to remember earlier sessions.",
    "Keep answers under 200 words unless asked for more.",
    lesson
      ? `The learner is on the lesson "${lesson.title}" (${lesson.subtitle}). Objectives: ${lesson.objectives.join("; ")}. Common misconceptions: ${lesson.tutor.misconceptions.join(" | ")}.`
      : "The learner is not on a specific lesson.",
  ].join("\n");

  const history = (body.history ?? []).slice(-6).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  try {
    const res = await callModel(cfg.providers[0], { system, messages: [...history, { role: "user", content: question }], tools: [] }, cfg.maxOutputTokens);
    return Response.json({ answer: res.type === "final" ? res.text : res.text ?? "" });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}

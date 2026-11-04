"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Cog, MessageSquare, Pause, Play, RotateCcw, SkipForward, Wrench } from "lucide-react";
import { runMarketAgent } from "@/engine/agent/presets";
import { PRODUCTS, formatUGX } from "@/engine/market/catalog";
import type { TraceEvent } from "@/engine/agent/types";
import { Button, JsonView, SimBadge, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";

/* ------------------------------------------------------------------ */
/*  A. The fixed-rules program (this is real, complete code)           */
/* ------------------------------------------------------------------ */
const PRICE_TABLE: Record<string, number> = Object.fromEntries(PRODUCTS.map((p) => [p.synonyms[0], p.priceUGX]));

export const RULES_SOURCE = `function handle(message) {
  const match = message.match(/^ORDER (\\w+) (\\d+)$/i);
  if (!match) {
    return "Sorry, I did not understand. Please type: ORDER <product> <quantity>";
  }
  const product = match[1].toLowerCase();
  const quantity = Number(match[2]);
  const price = PRICE_TABLE[product];
  if (price === undefined) return "Unknown product: " + product;
  return "Total: UGX " + (price * quantity).toLocaleString();
}`;

function rulesProgram(message: string) {
  const steps: Step[] = [{ title: "Read the message", detail: `"${message}"`, tone: "info" }];
  const match = message.trim().match(/^ORDER (\w+) (\d+)$/i);
  if (!match) {
    steps.push({ title: "Check: does it match ORDER <product> <quantity>?", detail: "No. The message is not in the exact expected format.", tone: "bad" });
    steps.push({ title: "Reply with the fixed error message", detail: "Sorry, I did not understand. Please type: ORDER <product> <quantity>", tone: "bad", reply: true });
    return steps;
  }
  steps.push({ title: "Check: does it match ORDER <product> <quantity>?", detail: `Yes → product "${match[1]}", quantity ${match[2]}`, tone: "good" });
  const price = PRICE_TABLE[match[1].toLowerCase()];
  steps.push({ title: "Look up the price table", detail: price ? `${match[1]} = ${formatUGX(price)}` : "Not in the table", tone: price ? "good" : "bad" });
  steps.push({
    title: "Reply",
    detail: price ? `Total: ${formatUGX(price * Number(match[2]))}` : `Unknown product: ${match[1]}`,
    tone: price ? "good" : "bad",
    reply: true,
  });
  steps.push({ title: "Stock is never checked", detail: "Nobody wrote a rule for stock, so the program cannot know if rice is available.", tone: "warn" });
  return steps;
}

/* ------------------------------------------------------------------ */
/*  B. A chatbot with no access to the shop (SIMULATED illustrations)  */
/* ------------------------------------------------------------------ */
const CHATBOT_REPLIES: Record<string, string> = {
  order: "Great choice! Rice usually costs around UGX 100,000 per bag in Kampala, so 3 bags would be about UGX 300,000. I hope you enjoy it!",
  rice: "Of course! I'd be happy to help. Three bags of rice will be delivered to you tomorrow. Rice is about UGX 95,000 per bag, so your total is roughly UGX 285,000.",
  price: "Sugar in Uganda is usually between UGX 4,000 and 6,000 per kg, and a litre of cooking oil is around UGX 7,000–9,000. So you might pay about UGX 17,000–21,000.",
  eggs: "Yes, we have fresh eggs available! A tray is usually about UGX 12,000. Beans are around UGX 4,500 per kg. Shall I prepare that for you?",
};

function chatbot(id: string): Step[] {
  return [
    { title: "Send the message to a language model", detail: "Only the customer's words are sent. The model has never seen Mama Achen's price list or stock book.", tone: "info" },
    { title: "The model predicts a likely-sounding reply", detail: "It generates fluent text based on patterns learned in training.", tone: "info" },
    { title: "Reply", detail: CHATBOT_REPLIES[id], tone: "warn", reply: true },
    {
      title: "Problem: nothing was checked",
      detail: id === "eggs"
        ? "Eggs are actually OUT of stock. The chatbot said yes because it had no way to know."
        : "The prices are plausible guesses, not this shop's prices. And it may claim things happened (“will be delivered”) that nobody arranged.",
      tone: "bad",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  C. The agent (runs the course's REAL agent loop, simulated model)   */
/* ------------------------------------------------------------------ */
function agentSteps(trace: TraceEvent[]): Step[] {
  const out: Step[] = [];
  for (const e of trace) {
    if (e.kind === "model_request" || e.kind === "state_update" || e.kind === "tool_executing") continue;
    if (e.kind === "task") out.push({ title: "Receive the task", detail: e.detail, tone: "info", data: e.data });
    else if (e.kind === "model_response") out.push({ title: "Model proposes tool call(s)", detail: e.detail, tone: "info", data: e.data, icon: "model" });
    else if (e.kind === "tool_call") out.push({ title: `Code checks the call: ${(e.data as { name: string }).name}`, detail: e.detail, tone: "info", data: e.data, icon: "tool" });
    else if (e.kind === "tool_result") out.push({ title: e.title, detail: e.detail, tone: "good", data: e.data, icon: "tool" });
    else if (e.kind === "approval_request") out.push({ title: "Pause: ask the shop owner to approve", detail: e.detail, tone: "warn" });
    else if (e.kind === "approval_result") out.push({ title: e.title, detail: e.detail, tone: "good" });
    else if (e.kind === "final") out.push({ title: "Reply", detail: e.detail, tone: "good", reply: true });
    else out.push({ title: e.title, detail: e.detail, tone: e.severity === "error" ? "bad" : "warn" });
  }
  return out;
}

/* ------------------------------------------------------------------ */

interface Step {
  title: string;
  detail: string;
  tone: "info" | "good" | "warn" | "bad";
  reply?: boolean;
  data?: unknown;
  icon?: "model" | "tool";
}

const REQUESTS = [
  { id: "order", label: "ORDER rice 3", text: "ORDER rice 3", note: "A strictly formatted message" },
  { id: "rice", label: "3 bags of rice, deliver tomorrow", text: "Customer wants 3 bags of rice delivered tomorrow.", note: "Natural language + an action" },
  { id: "price", label: "How much: sugar + oil?", text: "How much is 2 kg of sugar and 1 cooking oil?", note: "A price question" },
  { id: "eggs", label: "Eggs and beans", text: "I need 2 trays of eggs and 3 kg of beans.", note: "Something is out of stock" },
];

const VERDICTS: Record<string, { rules: string[]; chat: string[]; agent: string[] }> = {
  order: { rules: ["✓", "✓", "✗", "✓*"], chat: ["✓", "✗", "✗", "✗"], agent: ["✓", "✓", "✓", "✓"] },
  rice: { rules: ["✗", "✗", "✗", "✗"], chat: ["✓", "✗", "✗", "✗"], agent: ["✓", "✓", "✓", "✓"] },
  price: { rules: ["✗", "✗", "✗", "✗"], chat: ["✓", "✗", "✗", "✗"], agent: ["✓", "✓", "—", "✓"] },
  eggs: { rules: ["✗", "✗", "✗", "✗"], chat: ["✓", "✗", "✗", "✗"], agent: ["✓", "✓", "—", "✓"] },
};

export default function ThreeSystems({ onComplete }: LabProps) {
  const [reqId, setReqId] = useState("rice");
  const [agent, setAgent] = useState<Step[] | null>(null);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [inspect, setInspect] = useState<{ col: string; step: Step } | null>(null);
  const [finished, setFinished] = useState<Set<string>>(new Set());
  const req = REQUESTS.find((r) => r.id === reqId)!;

  useEffect(() => {
    let alive = true;
    setAgent(null);
    setShown(1);
    setInspect(null);
    runMarketAgent(req.text).then((run) => alive && setAgent(agentSteps(run.trace)));
    return () => { alive = false; };
  }, [req.text]);

  const columns = useMemo(
    () => [
      { id: "rules", title: "A. Fixed-rules program", icon: Cog, color: "var(--c-control)", steps: rulesProgram(req.text), blurb: "Follows if/then rules a programmer wrote in advance." },
      { id: "chat", title: "B. Chatbot (no tools)", icon: MessageSquare, color: "var(--c-model)", steps: chatbot(req.id), blurb: "A language model replying from its training, with no access to the shop." },
      { id: "agent", title: "C. AI agent (model + tools)", icon: Bot, color: "var(--c-tool)", steps: agent ?? [], blurb: "A model proposes actions; the shop's own code checks and runs them." },
    ],
    [req, agent],
  );
  const maxSteps = Math.max(...columns.map((c) => c.steps.length));
  const allShown = agent !== null && shown >= maxSteps;

  useEffect(() => {
    if (!playing) return;
    if (allShown) { setPlaying(false); return; }
    const t = setTimeout(() => setShown((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [playing, shown, allShown]);

  useEffect(() => {
    if (!allShown || finished.has(reqId)) return;
    const next = new Set(finished).add(reqId);
    setFinished(next);
    if (next.size >= 3) onComplete?.(`Compared ${next.size} requests`);
  }, [allShown, reqId, finished, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Customer message:</span>
        {REQUESTS.map((r) => (
          <button
            key={r.id}
            onClick={() => { setReqId(r.id); setPlaying(false); }}
            className={cx("rounded-full border px-3 py-1 text-sm", r.id === reqId ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-sunken")}
            aria-pressed={r.id === reqId}
          >
            {r.label}
            {finished.has(r.id) && <span className="ml-1 text-ok">✓</span>}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-sunken px-4 py-3">
        <div className="text-xs text-ink-3">{req.note}</div>
        <div className="font-medium">“{req.text}”</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => setPlaying((p) => !p)} disabled={!agent || allShown}>
          {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
        </Button>
        <Button size="sm" onClick={() => setShown((s) => Math.min(maxSteps, s + 1))} disabled={!agent || allShown}>
          <SkipForward className="h-4 w-4" /> Step
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setShown(1); setPlaying(false); setInspect(null); }}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
        <span className="text-xs text-ink-3">Step {Math.min(shown, maxSteps)} of {maxSteps || "…"}</span>
        <span className="ml-auto text-xs text-ink-3">Compared {finished.size}/3 messages needed</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div key={col.id} className="flex min-h-[320px] flex-col rounded-xl border border-line bg-bg/60">
              <div className="border-b border-line px-3 py-2.5" style={{ boxShadow: `inset 0 3px 0 ${col.color}` }}>
                <div className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" style={{ color: col.color }} /> {col.title}</div>
                <div className="mt-0.5 text-xs text-ink-3">{col.blurb}</div>
                <div className="mt-1.5">{col.id === "rules" ? <span className="text-[11px] font-semibold uppercase tracking-wider text-ok">Real code</span> : <SimBadge label={col.id === "chat" ? "Simulated replies" : "Real loop · simulated model"} />}</div>
              </div>
              <ol className="flex-1 space-y-2 p-3">
                {col.steps.slice(0, shown).map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setInspect({ col: col.title, step: s })}
                      className={cx(
                        "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-accent",
                        s.reply && "border-2",
                        s.tone === "good" && "border-ok/50",
                        s.tone === "bad" && "border-safety/50 bg-[color-mix(in_srgb,var(--c-safety)_5%,transparent)]",
                        s.tone === "warn" && "border-warn/50",
                        s.tone === "info" && "border-line",
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        {s.icon === "model" && <Bot className="h-3.5 w-3.5 text-model" />}
                        {s.icon === "tool" && <Wrench className="h-3.5 w-3.5 text-tool" />}
                        {s.title}
                      </div>
                      <div className={cx("mt-0.5 text-ink-2", s.reply ? "text-[14px] text-ink" : "line-clamp-3 text-[13px]")}>{s.detail}</div>
                    </button>
                  </li>
                ))}
                {col.id === "agent" && !agent && <li className="animate-pulse text-sm text-ink-3">Running the agent loop…</li>}
                {shown >= col.steps.length && col.steps.length > 0 && shown < maxSteps && (
                  <li className="text-center text-xs text-ink-3">— finished in {col.steps.length} steps —</li>
                )}
              </ol>
            </div>
          );
        })}
      </div>

      {inspect && (
        <div className="rounded-xl border border-accent/40 p-4" aria-live="polite">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Inspecting · {inspect.col}</div>
          <div className="font-semibold">{inspect.step.title}</div>
          <p className="mt-1 text-sm text-ink-2">{inspect.step.detail}</p>
          {inspect.step.data !== undefined && <JsonView className="mt-2" value={inspect.step.data} maxHeight={240} />}
        </div>
      )}

      {allShown && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-sunken/70 text-left">
              <tr>
                <th className="px-3 py-2">For this message…</th>
                <th className="px-3 py-2">Rules program</th>
                <th className="px-3 py-2">Chatbot</th>
                <th className="px-3 py-2">Agent</th>
              </tr>
            </thead>
            <tbody>
              {["Understood the message", "Used the shop's real data", "Took a real action (with approval)", "Answer was correct"].map((row, i) => (
                <tr key={row} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{row}</td>
                  {(["rules", "chat", "agent"] as const).map((c) => {
                    const v = VERDICTS[reqId][c][i];
                    return <td key={c} className={cx("px-3 py-2 font-mono", v.startsWith("✓") ? "text-ok" : v === "✗" ? "text-safety" : "text-ink-3")}>{v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {reqId === "order" && <p className="border-t border-line px-3 py-2 text-xs text-ink-3">* Correct price, but it never checked stock — no rule was written for that. For perfectly formatted input, a simple program is cheap, fast and reliable.</p>}
        </div>
      )}
    </div>
  );
}

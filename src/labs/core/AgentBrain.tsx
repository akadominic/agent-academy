"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Eye } from "lucide-react";
import { runMarketAgent, SAFE_DEFAULTS, type RunOptions } from "@/engine/agent/presets";
import { DEFAULT_SYSTEM_PROMPT } from "@/engine/agent/loop";
import type { AgentRun, Faults, ModelRequest, TraceEvent, TraceKind } from "@/engine/agent/types";
import { JsonView, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import { findLine, getRegion } from "@/components/lesson/ShowCode";
import { useTracePlayer } from "./shared/useTracePlayer";
import { PlayerControls } from "./shared/PlayerControls";
import type { LabProps } from "../types";

/* ------------------------------------------------------------------ */

interface Scenario {
  id: string;
  label: string;
  task: string;
  faults?: Faults;
  note: string;
}

export const BRAIN_SCENARIOS: Scenario[] = [
  { id: "rice", label: "Order: 3 bags of rice", task: "Customer wants 3 bags of rice delivered tomorrow.", note: "A normal, successful run with an approval step." },
  { id: "eggs", label: "Out of stock", task: "I need 2 trays of eggs and 3 kg of beans.", note: "One item is unavailable; watch the agent suggest alternatives from tool data." },
  { id: "vague", label: "Vague request", task: "Hello, can you help me with my shopping?", note: "Not enough information: the right move is to ask, not to guess." },
  { id: "runaway", label: "Runaway loop", task: "Customer wants 3 bags of rice delivered tomorrow.", faults: { ignoreResults: true }, note: "The model keeps asking for the same thing and ignores the answer. Only your stopping rules can end this." },
  { id: "badargs", label: "Bad arguments", task: "Customer wants 3 bags of rice delivered tomorrow.", faults: { invalidArgs: true }, note: "The model sends quantity as text (\"3 bags\"). Schema validation catches it and the model gets a chance to fix it." },
  { id: "timeout", label: "Inventory times out", task: "Customer wants 3 bags of rice delivered tomorrow.", faults: { timeoutTool: "check_inventory" }, note: "The stock service never answers. Retries are limited; the agent must report honestly." },
  { id: "reject", label: "Owner rejects", task: "Customer wants 3 bags of rice delivered tomorrow.", faults: { rejectApproval: true }, note: "The shop owner says no. The agent must not create the order anyway." },
];

const STATIONS = [
  { id: "ask", label: "Ask the model", sub: "send context", color: "var(--c-model)", angle: -90 },
  { id: "decide", label: "Model proposes", sub: "answer or tool call", color: "var(--c-model)", angle: -30 },
  { id: "checks", label: "Code checks", sub: "allowed? valid?", color: "var(--c-safety)", angle: 30 },
  { id: "execute", label: "Run the tool", sub: "your server", color: "var(--c-tool)", angle: 90 },
  { id: "observe", label: "Observe result", sub: "tool output", color: "var(--c-data)", angle: 150 },
  { id: "state", label: "Update state", sub: "add to context", color: "var(--c-data)", angle: 210 },
] as const;
type StationId = (typeof STATIONS)[number]["id"] | "task" | "final" | "stopped" | "approval";

const STATION_OF: Record<TraceKind, StationId> = {
  task: "task", model_request: "ask", model_response: "decide", tool_call: "checks", validation_error: "checks",
  guard: "checks", approval_request: "approval", approval_result: "approval", tool_executing: "execute",
  tool_result: "observe", tool_error: "observe", retry: "execute", state_update: "state", final: "final", stopped: "stopped",
};

/** Plain-language narration for each kind of event. */
const NARRATION: Record<TraceKind, string> = {
  task: "A customer's message arrives. Your code creates a fresh state: an empty step counter and a conversation containing just this message.",
  model_request: "Your code sends ONE request to the model: the system instructions, the whole conversation so far, and the descriptions of the tools it may ask for.",
  model_response: "The model's reply is structured data: either a final answer, or one or more proposed tool calls with arguments. It has not done anything yet.",
  tool_call: "Your code takes one proposed call and checks it: does this tool exist for this agent, are the arguments valid, is this a repeat?",
  validation_error: "The arguments broke the tool's schema. Nothing runs. Instead, the error is sent back to the model so it can correct itself.",
  guard: "The loop guard noticed the exact same call again, which means no progress. Your code stops the run instead of burning more steps and money.",
  approval_request: "This tool changes data, so the loop pauses and asks a human. Nothing has happened in the database yet.",
  approval_result: "The human's decision is recorded. If rejected, the tool never runs and the model is told so.",
  tool_executing: "Your server runs the real function with the arguments. The model is not involved in this step at all.",
  tool_result: "The function returned data. It becomes an 'observation' — a tool message added to the conversation.",
  tool_error: "The tool failed. The error becomes the observation, so the model can react honestly rather than pretend it worked.",
  retry: "A temporary failure. Your code tries again — a limited number of times only.",
  state_update: "State now includes the new fact. On the next loop, the model will see it as part of the context.",
  final: "The model returned a final answer instead of a tool call. The loop ends with status 'done'.",
  stopped: "A stopping rule ended the run before the model finished. This is a safety feature, not a crash.",
};

const CODE_FOR: Partial<Record<TraceKind, { region: string; match: string[] }>> = {
  task: { region: "loop", match: ["while (step < config.maxSteps)"] },
  model_request: { region: "loop", match: ["const request =", "await config.model.complete"] },
  model_response: { region: "loop", match: ["messages.push({ role: \"assistant\", content: response.text ??", "for (const call of response.calls)"] },
  final: { region: "loop", match: ['if (response.type === "final")', "status = \"done\""] },
  tool_call: { region: "checks", match: ["toolsByName.get(call.name)"] },
  validation_error: { region: "checks", match: ["validate(tool.inputSchema, call.arguments)", 'kind: "validation"'] },
  guard: { region: "checks", match: ["seenCalls.has(signature)"] },
  approval_request: { region: "checks", match: ['tool.sideEffect === "write" && config.requireApproval'] },
  approval_result: { region: "checks", match: ["if (!approved)"] },
  tool_executing: { region: "execute", match: ["executeWithTimeout(tool, args, ctx"] },
  tool_result: { region: "execute", match: ["reply(call, { ok: true, result })"] },
  state_update: { region: "execute", match: ["recordFacts(tool.name, result)"] },
  retry: { region: "execute", match: ["retryable && attempt <= config.maxRetries"] },
  tool_error: { region: "execute", match: ['reply(call, { ok: false, kind: "error"'] },
  stopped: { region: "stop", match: ['status = "stopped"'] },
};

/* ------------------------------------------------------------------ */

export default function AgentBrain({ onComplete, challenge = "explore", initial = "rice" }: LabProps & { challenge?: "explore" | "runaway"; initial?: string }) {
  const [scenarioId, setScenarioId] = useState<string>(initial as string);
  const [maxSteps, setMaxSteps] = useState(SAFE_DEFAULTS.maxSteps);
  const [loopGuard, setLoopGuard] = useState(challenge === "runaway" ? false : true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [validateArgs, setValidateArgs] = useState(true);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [tab, setTab] = useState<"what" | "request" | "call" | "state" | "done" | "code">("what");
  const [raw, setRaw] = useState(false);
  const proof = useRef({ maxHit: false, guardHit: false, explored: false, fired: false });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const scenario = BRAIN_SCENARIOS.find((s) => s.id === scenarioId)!;

  useEffect(() => {
    let alive = true;
    const opts: RunOptions = { faults: scenario.faults, maxSteps, loopGuard, requireApproval, validateArgs };
    runMarketAgent(scenario.task, opts).then((r) => alive && setRun(r));
    return () => { alive = false; };
  }, [scenario, maxSteps, loopGuard, requireApproval, validateArgs]);

  const trace = run?.trace ?? [];
  const player = useTracePlayer(trace.length, 1000, run);
  const ev: TraceEvent | undefined = trace[player.index];

  // Challenge tracking: only counts events the learner actually reached.
  useEffect(() => {
    if (!ev || !player.atEnd) return;
    const p = proof.current;
    if (ev.kind === "final") p.explored = true;
    if (scenario.id === "runaway" && ev.kind === "stopped") p.maxHit = true;
    if (scenario.id === "runaway" && ev.kind === "guard") p.guardHit = true;
    const done = (challenge === "explore" && p.explored) || (challenge === "runaway" && p.maxHit && p.guardHit);
    if (done && !p.fired) {
      p.fired = true;
      onCompleteRef.current?.(challenge === "explore" ? "Followed a full agent run" : "Stopped a runaway loop two ways");
    }
  }, [ev, player.atEnd, scenario.id, challenge]);

  const lastRequest = useMemo(() => {
    for (let i = player.index; i >= 0; i--) if (trace[i]?.kind === "model_request") return trace[i].data as ModelRequest;
    return undefined;
  }, [trace, player.index]);
  const lastCall = useMemo(() => {
    for (let i = player.index; i >= 0; i--) if (trace[i]?.kind === "tool_call") return trace[i];
    return undefined;
  }, [trace, player.index]);
  const lastResult = useMemo(() => {
    for (let i = player.index; i >= 0; i--) {
      const k = trace[i]?.kind;
      if (k === "tool_result" || k === "tool_error" || k === "validation_error") return trace[i];
    }
    return undefined;
  }, [trace, player.index]);

  const station = ev ? STATION_OF[ev.kind] : "task";
  const prevStation = player.index > 0 && trace[player.index - 1] ? STATION_OF[trace[player.index - 1].kind] : undefined;

  return (
    <div className="space-y-4">
      {/* Scenario + settings */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Scenario">
            {BRAIN_SCENARIOS.map((s) => (
              <button
                key={s.id}
                role="radio"
                aria-checked={s.id === scenarioId}
                onClick={() => setScenarioId(s.id)}
                className={cx("rounded-full border px-3 py-1 text-sm", s.id === scenarioId ? "border-accent bg-accent-soft" : "border-line text-ink-2 hover:bg-sunken", s.faults && "border-dashed")}
              >
                {s.faults && <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-warn" />}
                {s.label}
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-sunken px-4 py-3 text-sm">
            <div className="font-medium">Task: “{scenario.task}”</div>
            <div className="mt-0.5 text-ink-2">{scenario.note}</div>
          </div>
        </div>
        <div className="rounded-xl border border-line p-3">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold">
            Stopping rules & controls <SimBadge label="Simulated model" />
          </div>
          <label className="block px-1.5 py-1 text-sm">
            <span className="flex justify-between"><span className="font-medium">Maximum steps</span><span className="tabular-nums">{maxSteps}</span></span>
            <input type="range" min={2} max={15} value={maxSteps} onChange={(e) => setMaxSteps(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Maximum steps" />
          </label>
          <Toggle checked={loopGuard} onChange={setLoopGuard} label="Loop guard" description="Stop if the exact same call repeats" />
          <Toggle checked={validateArgs} onChange={setValidateArgs} label="Validate arguments" description="Check tool inputs against the schema" />
          <Toggle checked={requireApproval} onChange={setRequireApproval} label="Human approval for writes" />
        </div>
      </div>

      <PlayerControls player={player} length={trace.length} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Loop diagram */}
        <div className="rounded-xl border border-line bg-bg/50 p-2">
          <LoopDiagram station={station} prev={prevStation} ev={ev} maxSteps={maxSteps} />
        </div>

        {/* Inspector */}
        <div className="flex min-h-[420px] flex-col rounded-xl border border-line">
          <div className="flex flex-wrap gap-1 border-b border-line p-1.5" role="tablist" aria-label="Inspector">
            {([
              ["what", "What's happening"], ["request", "Model request"], ["call", "Tool call & result"],
              ["state", "State"], ["done", "Completion"], ["code", "Code"],
            ] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={cx("rounded-lg px-2.5 py-1.5 text-xs font-medium", tab === id ? "bg-sunken text-ink" : "text-ink-3 hover:text-ink")}>
                {label}
              </button>
            ))}
            <button onClick={() => setRaw((r) => !r)} className={cx("ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs", raw ? "bg-accent-soft text-accent" : "text-ink-3")} aria-pressed={raw}>
              <Eye className="h-3.5 w-3.5" /> Inspect raw
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 text-sm" role="tabpanel">
            {!ev ? <p className="text-ink-3">Running…</p> : tab === "what" ? (
              <div className="space-y-3">
                <div className={cx("inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                  ev.severity === "error" ? "bg-safety text-white" : ev.severity === "warn" ? "bg-warn text-white" : ev.severity === "ok" ? "bg-ok text-white" : "bg-sunken text-ink-2")}>
                  {ev.kind.replace("_", " ")}
                </div>
                <h4 className="text-lg font-semibold leading-snug">{ev.title}</h4>
                <p className="text-[15px] text-ink-2">{NARRATION[ev.kind]}</p>
                <div className="rounded-lg bg-sunken p-3"><span className="font-medium">Detail: </span>{ev.detail}</div>
                {raw && ev.data !== undefined && <JsonView value={ev.data} maxHeight={260} />}
              </div>
            ) : tab === "request" ? (
              lastRequest ? (
                <div className="space-y-2">
                  <p className="text-ink-2">The most recent request your code sent. Notice it contains the <strong>whole conversation</strong> — the model remembers nothing between requests.</p>
                  {raw ? <JsonView value={lastRequest} maxHeight={340} /> : (
                    <div className="space-y-1.5">
                      <MsgRow role="system" text={DEFAULT_SYSTEM_PROMPT.split("\n")[0] + " …"} />
                      {lastRequest.messages.map((m, i) => (
                        <MsgRow key={i} role={m.role} text={m.toolCalls ? `→ wants: ${m.toolCalls.map((c) => `${c.name}(${JSON.stringify(c.arguments)})`).join(", ")}` : m.content} />
                      ))}
                      <div className="pt-1 text-xs text-ink-3">Tools offered: {lastRequest.tools.map((t) => t.name).join(", ")}</div>
                    </div>
                  )}
                </div>
              ) : <p className="text-ink-3">No model request yet. Step forward.</p>
            ) : tab === "call" ? (
              <div className="space-y-3">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Selected tool & inputs</div>
                  {lastCall ? <JsonView value={lastCall.data} maxHeight={160} /> : <p className="text-ink-3">None yet.</p>}
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Tool output (observation)</div>
                  {lastResult ? (
                    <>
                      <p className={cx("mb-1", lastResult.severity === "ok" ? "text-ok" : "text-safety")}>{lastResult.title}</p>
                      <JsonView value={lastResult.data} maxHeight={200} />
                    </>
                  ) : <p className="text-ink-3">None yet.</p>}
                </div>
              </div>
            ) : tab === "state" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Step" value={`${ev.state.step} / ${maxSteps}`} />
                  <Stat label="Status" value={ev.state.status} />
                  <Stat label="Tool calls" value={String(ev.state.toolCalls)} />
                  <Stat label="Messages in context" value={String(ev.state.messages)} />
                  <Stat label="Tokens (estimated)" value={`${ev.state.tokens.inputTokens.toLocaleString()} in / ${ev.state.tokens.outputTokens.toLocaleString()} out`} />
                  <Stat label="Orders recorded" value={ev.state.orderIds.join(", ") || "none"} />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Facts learned from tools</div>
                  {ev.state.facts.length ? <ul className="list-disc space-y-0.5 pl-5">{ev.state.facts.map((f, i) => <li key={i}>{f}</li>)}</ul> : <p className="text-ink-3">Nothing yet — the agent only knows what tools tell it.</p>}
                </div>
                {ev.state.stopReason && <p className="rounded-lg bg-sunken p-2"><strong>Stop reason:</strong> {ev.state.stopReason}</p>}
              </div>
            ) : tab === "done" ? (
              <Completion trace={trace.slice(0, player.index + 1)} maxSteps={maxSteps} />
            ) : (
              <CodePanel ev={ev} />
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <ol className="flex gap-1 overflow-x-auto pb-1" aria-label="Timeline">
        {trace.map((e, i) => (
          <li key={i}>
            <button
              onClick={() => { player.setPlaying(false); player.setIndex(i); }}
              title={`${i + 1}. ${e.title}`}
              aria-label={`Event ${i + 1}: ${e.title}`}
              aria-current={i === player.index}
              className={cx("h-7 w-7 shrink-0 rounded-md border text-[10px] font-semibold tabular-nums",
                i === player.index ? "border-accent bg-accent text-accent-ink" : i < player.index ? "border-line bg-sunken text-ink-2" : "border-line text-ink-3",
                e.severity === "error" && i !== player.index && "border-safety text-safety",
                e.severity === "warn" && i !== player.index && "border-warn")}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      {player.atEnd && run && (
        <div className={cx("rounded-xl border p-4", run.final.status === "done" ? "border-ok/50" : "border-warn/60")} role="status">
          <div className="font-semibold">
            {run.final.status === "done" ? "Finished: final answer" : `Stopped: ${run.final.stopReason}`}
          </div>
          {run.answer && <p className="mt-1 text-[15px]">“{run.answer}”</p>}
          <p className="mt-1 text-sm text-ink-3">
            {run.final.step} model call(s), {run.final.toolCalls} tool call(s), ~{(run.final.tokens.inputTokens + run.final.tokens.outputTokens).toLocaleString()} tokens (estimated).
          </p>
        </div>
      )}
    </div>
  );
}

function MsgRow({ role, text }: { role: string; text: string }) {
  const color: Record<string, string> = { system: "text-control", user: "text-people", assistant: "text-model", tool: "text-tool" };
  return (
    <div className="flex gap-2 rounded-lg bg-sunken/70 px-2.5 py-1.5">
      <span className={cx("w-16 shrink-0 font-mono text-[11px] font-semibold uppercase", color[role])}>{role}</span>
      <span className="line-clamp-3 break-all text-[13px] text-ink-2">{text}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sunken px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
    </div>
  );
}

function Completion({ trace, maxSteps }: { trace: TraceEvent[]; maxSteps: number }) {
  const last = trace.at(-1);
  const kinds = new Set(trace.map((e) => e.kind));
  const writeAttempted = kinds.has("approval_request");
  const items = [
    { label: "The model gave a final answer", done: kinds.has("final") },
    { label: "Every price or stock claim came from a tool result", done: trace.some((e) => e.kind === "tool_result") || (kinds.has("final") && !trace.some((e) => e.kind === "tool_call")) },
    { label: "Any order was approved by a human first", done: !writeAttempted || kinds.has("approval_result") },
    { label: `Finished within the step limit (${maxSteps})`, done: (last?.state.step ?? 0) <= maxSteps && last?.state.status !== "stopped" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-ink-2">Completion criteria are defined by <strong>you</strong>, the engineer — not by the model saying “done”. Here is what this agent checks:</p>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.label} className="flex gap-2">
            {i.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" /> : <Circle className="h-4 w-4 shrink-0 text-ink-3" />}
            {i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodePanel({ ev }: { ev: TraceEvent }) {
  const spec = CODE_FOR[ev.kind] ?? { region: "loop", match: [] };
  const region = getRegion(spec.region);
  if (!region) return null;
  const lines = spec.match.map((m) => findLine(region.code, m)).filter((n): n is number => !!n);
  return (
    <div className="space-y-2">
      <p className="text-ink-2">The highlighted lines are the real code in <code className="inline-code">{region.file}</code> responsible for this event.</p>
      <CodeBlock code={region.code} lang="ts" highlight={lines} startLine={region.startLine} maxHeight={330} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The loop diagram                                                   */
/* ------------------------------------------------------------------ */

const CX = 300, CY = 215, R = 150;
function pos(angle: number, r = R) {
  const a = (angle * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}
function arc(a1: number, a2: number) {
  const p1 = pos(a1), p2 = pos(a2);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`;
}

function LoopDiagram({ station, prev, ev, maxSteps }: { station: StationId; prev?: StationId; ev?: TraceEvent; maxSteps: number }) {
  const step = ev?.state.step ?? 0;
  const ratio = Math.min(1, step / maxSteps);
  const ringC = 2 * Math.PI * 46;
  const danger = ratio >= 0.75;
  const angleOf = (id: StationId) => STATIONS.find((s) => s.id === id)?.angle;
  const activeArc = (() => {
    const a1 = prev ? angleOf(prev) : undefined;
    const a2 = angleOf(station);
    if (a1 === undefined || a2 === undefined || a1 === a2) return null;
    return arc(a1, a2 < a1 ? a2 + 360 : a2);
  })();
  const label = `Agent loop diagram. Current stage: ${station}. Step ${step} of maximum ${maxSteps}.`;

  return (
    <svg viewBox="0 0 600 440" className="h-auto w-full" role="img" aria-label={label}>
      <defs>
        <marker id="brain-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--line-strong)" />
        </marker>
      </defs>
      {/* base loop */}
      {STATIONS.map((s, i) => {
        const next = STATIONS[(i + 1) % STATIONS.length];
        return <path key={s.id} d={arc(s.angle + 9, next.angle - 9 + (next.angle < s.angle ? 360 : 0))} fill="none" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#brain-arrow)" />;
      })}
      {activeArc && <path d={activeArc} fill="none" stroke="var(--accent)" strokeWidth="4" className="flow-active" />}

      {/* step ring in the centre */}
      <circle cx={CX} cy={CY} r={46} fill="none" stroke="var(--line)" strokeWidth="8" />
      <circle cx={CX} cy={CY} r={46} fill="none" stroke={danger ? "var(--c-safety)" : "var(--accent)"} strokeWidth="8"
        strokeDasharray={`${ringC * ratio} ${ringC}`} transform={`rotate(-90 ${CX} ${CY})`} strokeLinecap="round" style={{ transition: "stroke-dasharray .4s" }} />
      <text x={CX} y={CY - 4} textAnchor="middle" className="fill-[var(--ink)]" fontSize="26" fontWeight="700">{step}</text>
      <text x={CX} y={CY + 16} textAnchor="middle" className="fill-[var(--ink-3)]" fontSize="11">of max {maxSteps} steps</text>

      {/* entry / exits */}
      <ExtNode x={20} y={CY - 22} label="Task in" sub="customer" active={station === "task"} color="var(--c-people)" />
      <line x1={120} y1={CY} x2={pos(180).x - 50} y2={CY} stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#brain-arrow)" />
      <ExtNode x={470} y={20} label="Final answer" sub="loop ends: done" active={station === "final"} color="var(--c-ok)" />
      <ExtNode x={470} y={380} label="Stopped" sub="a stopping rule fired" active={station === "stopped"} color="var(--c-safety)" />
      <ExtNode x={20} y={370} label="Human approval" sub="before writes" active={station === "approval"} color="var(--c-people)" />

      {STATIONS.map((s) => {
        const p = pos(s.angle);
        const active = s.id === station;
        const isError = active && (ev?.severity === "error" || ev?.severity === "warn");
        return (
          <g key={s.id}>
            {active && <rect x={p.x - 62} y={p.y - 24} width={124} height={48} rx={14} fill="none" stroke={s.color} strokeWidth="3" className="pulse-ring" />}
            <rect x={p.x - 62} y={p.y - 24} width={124} height={48} rx={14}
              fill={active ? `color-mix(in srgb, ${s.color} 18%, var(--bg-raised))` : "var(--bg-raised)"}
              stroke={isError ? "var(--c-safety)" : active ? s.color : "var(--line-strong)"} strokeWidth={active ? 2.5 : 1.5} />
            <text x={p.x} y={p.y - 3} textAnchor="middle" fontSize="13" fontWeight="600" className="fill-[var(--ink)]">{s.label}</text>
            <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize="10.5" className="fill-[var(--ink-3)]">{s.sub}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ExtNode({ x, y, label, sub, active, color }: { x: number; y: number; label: string; sub: string; active: boolean; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={110} height={44} rx={10} fill={active ? `color-mix(in srgb, ${color} 22%, var(--bg-raised))` : "var(--bg-sunken)"}
        stroke={active ? color : "var(--line)"} strokeWidth={active ? 2.5 : 1} strokeDasharray={active ? undefined : "4 3"} />
      <text x={x + 55} y={y + 19} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-[var(--ink)]">{label}</text>
      <text x={x + 55} y={y + 34} textAnchor="middle" fontSize="10" className="fill-[var(--ink-3)]">{sub}</text>
    </g>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Lock, Play, ShieldOff, Zap } from "lucide-react";
import { PARTS, EDGES, NODE_H, NODE_W, type AnatomyPart } from "@/content/anatomy";
import { getModule } from "@/content/curriculum";
import { runMarketAgent } from "@/engine/agent/presets";
import { DEFAULT_SYSTEM_PROMPT } from "@/engine/agent/loop";
import type { AgentRun, Component, Faults, TraceEvent } from "@/engine/agent/types";
import { useProgress } from "@/lib/progress";
import { moduleStats } from "@/lib/course";
import { Badge, Button, JsonView, Segmented, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import { ShowCode } from "@/components/lesson/ShowCode";
import { useTracePlayer } from "./shared/useTracePlayer";
import { PlayerControls } from "./shared/PlayerControls";
import { runPartDemo } from "./anatomyDemos";
import type { LabProps } from "../types";

const KIND_COLOR: Record<AnatomyPart["kind"], string> = {
  people: "var(--c-people)", model: "var(--c-model)", tool: "var(--c-tool)", data: "var(--c-data)",
  control: "var(--c-control)", safety: "var(--c-safety)", cloud: "var(--c-cloud)",
};

const FAILURES: { id: string; label: string; faults: Faults; untrusted?: boolean }[] = [
  { id: "none", label: "No failure", faults: {} },
  { id: "lookup-timeout", label: "Product lookup times out", faults: { timeoutTool: "search_products" } },
  { id: "db-down", label: "Inventory database is down", faults: { dbDown: true } },
  { id: "bad-args", label: "Model sends bad arguments", faults: { invalidArgs: true } },
  { id: "reject", label: "Owner rejects the order", faults: { rejectApproval: true } },
  { id: "injection", label: "Prompt injection in product data", faults: { injection: true, obeyInjection: true }, untrusted: false },
  { id: "runaway", label: "Runaway loop", faults: { ignoreResults: true } },
  { id: "lost", label: "Reply lost while ordering", faults: { lostResponse: true } },
];

const PART = new Map(PARTS.map((p) => [p.id, p]));
const center = (p: AnatomyPart) => ({ x: p.x + (p.w ?? NODE_W) / 2, y: p.y + NODE_H / 2 });

function edgePath(a: Component, b: Component, via?: [number, number]) {
  const pa = center(PART.get(a)!), pb = center(PART.get(b)!);
  return via ? `M ${pa.x} ${pa.y} Q ${via[0]} ${via[1]} ${pb.x} ${pb.y}` : `M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`;
}
const edgeKey = (a: string, b: string) => [a, b].sort().join("|");

/** Shortest route between two parts over the drawn connections (so packets never jump). */
function route(from: Component, to: Component): Component[] {
  if (from === to) return [from];
  const adj = new Map<Component, Component[]>();
  for (const e of EDGES) {
    adj.set(e.a, [...(adj.get(e.a) ?? []), e.b]);
    adj.set(e.b, [...(adj.get(e.b) ?? []), e.a]);
  }
  const prev = new Map<Component, Component>();
  const q: Component[] = [from];
  const seen = new Set([from]);
  while (q.length) {
    const n = q.shift()!;
    if (n === to) break;
    for (const m of adj.get(n) ?? []) if (!seen.has(m)) { seen.add(m); prev.set(m, n); q.push(m); }
  }
  const out: Component[] = [to];
  let c = to;
  while (prev.has(c)) { c = prev.get(c)!; out.unshift(c); }
  return out[0] === from ? out : [from, to];
}

function expandPath(path: Component[]): [Component, Component][] {
  const hops: [Component, Component][] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const r = route(path[i], path[i + 1]);
    for (let j = 0; j < r.length - 1; j++) hops.push([r[j], r[j + 1]]);
  }
  return hops;
}

const DEFAULT_TASK = "Customer wants 3 bags of rice delivered tomorrow.";

export default function AnatomyExplorer({ onComplete, minimal = false }: LabProps & { minimal?: boolean }) {
  const p = useProgress();
  const [view, setView] = useState<"progress" | "full">("progress");
  const [selected, setSelected] = useState<Component | null>(minimal ? "workflow" : null);
  const [failure, setFailure] = useState("none");
  const [safety, setSafety] = useState(true);
  const [task, setTask] = useState(DEFAULT_TASK);
  const [run, setRun] = useState<AgentRun & { db?: unknown } | null>(null);
  const [tab, setTab] = useState<"about" | "io" | "demo" | "code">("about");
  const [demo, setDemo] = useState<{ part: Component; output: unknown; note?: string } | null>(null);
  const [touched, setTouched] = useState<Set<Component>>(new Set());

  /* Which parts the learner has "unlocked" by progress. Core parts are always visible. */
  const learned = useMemo(() => {
    const set = new Set<Component>();
    for (const part of PARTS) {
      const m = getModule(part.module);
      if (part.core || (m && m.status === "complete" && (moduleStats(m, p).started || moduleStats(m, p).complete))) set.add(part.id);
    }
    return set;
  }, [p]);
  const visible = (id: Component) => view === "full" || learned.has(id);

  useEffect(() => {
    let alive = true;
    const f = FAILURES.find((x) => x.id === failure)!;
    const opts = safety
      ? { faults: f.faults, markUntrusted: f.untrusted ?? true }
      : { faults: f.faults, validateArgs: false, loopGuard: false, requireApproval: false, idempotency: false, markUntrusted: false, maxSteps: 10 };
    runMarketAgent(task, opts).then((r) => alive && setRun(r));
    return () => { alive = false; };
  }, [failure, safety, task]);

  const trace = run?.trace ?? [];
  const player = useTracePlayer(trace.length, 1300, run);
  const ev: TraceEvent | undefined = trace[player.index];
  const hops = useMemo(() => (ev ? expandPath(ev.path) : []), [ev]);
  const activeParts = new Set<Component>(ev?.path ?? []);
  const activeEdges = new Set(hops.map(([a, b]) => edgeKey(a, b)));

  function select(id: Component) {
    setSelected(id);
    setTab("about");
    setDemo(null);
    const t = new Set(touched).add(id);
    setTouched(t);
    if (t.size >= (minimal ? 3 : 6)) onComplete?.("Explored the agent's parts");
  }

  const sel = selected ? PART.get(selected) : undefined;
  const selModule = sel ? getModule(sel.module) : undefined;
  const failureLabel = FAILURES.find((x) => x.id === failure)!.label;

  return (
    <div className="space-y-4">
      {!minimal && (
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[{ value: "progress", label: `My agent so far (${learned.size}/16)` }, { value: "full", label: "Full production architecture" }]}
          />
          <span className="text-sm text-ink-3">Click any part to inspect it.</span>
        </div>
      )}

      {/* Journey controls */}
      <div className="grid gap-3 rounded-xl border border-line p-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Watch a request travel:</span>
            <input value={task} onChange={(e) => setTask(e.target.value)} onBlur={(e) => setTask(e.target.value.trim() || DEFAULT_TASK)}
              className="min-w-[220px] flex-1 rounded-lg border border-line-strong bg-bg px-3 py-1.5 text-sm" aria-label="Customer request" />
            <SimBadge label="Real loop · simulated model" />
          </div>
          {!minimal && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-safety" />
                <span className="font-medium">Inject a failure:</span>
                <select value={failure} onChange={(e) => setFailure(e.target.value)} className="rounded-lg border border-line-strong bg-bg px-2 py-1.5 text-sm" aria-label="Failure to inject">
                  {FAILURES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>
              <Toggle checked={safety} onChange={setSafety} label="Safety controls on" description="validation, loop guard, approval, idempotency, untrusted-data labels" />
            </div>
          )}
          <PlayerControls player={player} length={trace.length} label="Event" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Diagram */}
        <div className="overflow-x-auto rounded-xl border border-line bg-bg/40">
          <svg viewBox="0 0 1120 640" className="h-auto w-full min-w-[720px]" role="img"
            aria-label={`Agent architecture diagram. ${ev ? `Current event: ${ev.title}. Active parts: ${[...activeParts].map((a) => PART.get(a)?.label).join(", ")}.` : ""}`}>
            {/* regions */}
            <Region x={170} y={10} w={620} h={620} label="Your cloud hosting (click to inspect)" labelBottom color="var(--c-cloud)" onClick={() => visible("cloud") && select("cloud")} active={selected === "cloud"} faded={!visible("cloud")} />
            <Region x={810} y={30} w={300} h={170} label="AI provider (e.g. Anthropic, OpenAI)" color="var(--c-model)" />
            <Region x={810} y={360} w={300} h={170} label="Other services (SMS, payments, maps)" color="var(--c-tool)" />
            <Region x={6} y={196} w={148} h={106} label="Customer's phone" color="var(--c-people)" />
            <Region x={6} y={436} w={148} h={106} label="Owner's phone" color="var(--c-people)" />

            {/* edges */}
            {EDGES.map((e) => {
              const k = edgeKey(e.a, e.b);
              const on = activeEdges.has(k);
              const show = visible(e.a) && visible(e.b);
              const hl = selected && (e.a === selected || e.b === selected);
              return (
                <path key={k} d={edgePath(e.a, e.b, e.via)} fill="none"
                  stroke={on ? "var(--accent)" : hl ? "var(--ink-2)" : "var(--line-strong)"}
                  strokeWidth={on ? 3.5 : hl ? 2.2 : 1.4}
                  strokeOpacity={show || on ? 1 : 0.18}
                  className={on ? "flow-active" : undefined} />
              );
            })}

            {/* packets travelling along this event's hops */}
            {ev && hops.map(([a, b], i) => {
              const e = EDGES.find((x) => edgeKey(x.a, x.b) === edgeKey(a, b));
              if (!e) return null;
              const d = edgePath(a, b, e.via);
              return (
                <circle key={`${player.index}-${i}`} r={7} fill={ev.severity === "error" ? "var(--c-safety)" : "var(--accent)"} stroke="var(--bg-raised)" strokeWidth={2} opacity={0}>
                  <animateMotion dur="0.55s" begin={`${i * 0.5}s`} fill="freeze" path={d} />
                  <set attributeName="opacity" to="1" begin={`${i * 0.5}s`} />
                </circle>
              );
            })}

            {/* nodes */}
            {PARTS.filter((pt) => pt.id !== "cloud").map((pt) => {
              const show = visible(pt.id);
              const on = activeParts.has(pt.id);
              const isSel = selected === pt.id;
              const color = KIND_COLOR[pt.kind];
              const w = pt.w ?? NODE_W;
              const mod = getModule(pt.module);
              return (
                <g key={pt.id} role="button" tabIndex={0} aria-label={`${pt.label}${show ? "" : ` (unlocks in Module ${mod?.number})`}`}
                  onClick={() => select(pt.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), select(pt.id))}
                  className="cursor-pointer focus:outline-none" opacity={show || on ? 1 : 0.45}>
                  {on && <rect x={pt.x - 4} y={pt.y - 4} width={w + 8} height={NODE_H + 8} rx={16} fill="none" stroke={ev?.severity === "error" ? "var(--c-safety)" : color} strokeWidth={3} className="pulse-ring" />}
                  <rect x={pt.x} y={pt.y} width={w} height={NODE_H} rx={12}
                    fill={on ? `color-mix(in srgb, ${color} 20%, var(--bg-raised))` : show ? "var(--bg-raised)" : "var(--bg-sunken)"}
                    stroke={isSel ? "var(--ink)" : show ? color : "var(--line-strong)"} strokeWidth={isSel ? 3 : on ? 2.5 : 1.6}
                    strokeDasharray={show ? undefined : "5 4"} />
                  <rect x={pt.x} y={pt.y} width={6} height={NODE_H} rx={3} fill={show ? color : "var(--line-strong)"} />
                  <text x={pt.x + w / 2 + 3} y={pt.y + (show ? 26 : 25)} textAnchor="middle" fontSize="13.5" fontWeight="600" className="fill-[var(--ink)] select-none">
                    {show ? pt.label : "?"}
                  </text>
                  <text x={pt.x + w / 2 + 3} y={pt.y + 44} textAnchor="middle" fontSize="11" className="fill-[var(--ink-3)] select-none">
                    {show ? (learned.has(pt.id) ? (pt.core ? "core part" : `Module ${mod?.number}`) : `preview · Module ${mod?.number}`) : `unlocks in Module ${mod?.number}`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {ev && (
            <div className={cx("rounded-xl border p-3", ev.severity === "error" ? "border-safety/60" : ev.severity === "warn" ? "border-warn/60" : ev.severity === "ok" ? "border-ok/60" : "border-line")} aria-live="polite">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                <span>Event {player.index + 1} · step {ev.step}</span>
                {failure !== "none" && <span className="text-safety">{failureLabel}</span>}
              </div>
              <div className="mt-1 font-semibold">{ev.title}</div>
              <p className="mt-0.5 line-clamp-4 text-sm text-ink-2">{ev.detail}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {ev.path.map((c, i) => (
                  <button key={i} onClick={() => select(c)} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs hover:border-accent">
                    {i > 0 && <ArrowRight className="h-3 w-3 text-ink-3" />}{PART.get(c)?.label}
                  </button>
                ))}
              </div>
              {ev.data !== undefined && (
                <details className="mt-2 text-sm"><summary className="cursor-pointer text-ink-2">Inspect data</summary><JsonView value={ev.data} maxHeight={220} className="mt-1 text-[11.5px]" /></details>
              )}
            </div>
          )}
          {player.atEnd && run && (
            <div className="rounded-xl bg-sunken p-3 text-sm">
              <div className="font-semibold">{run.final.status === "done" ? "Result" : `Stopped: ${run.final.stopReason}`}</div>
              {run.answer && <p className="mt-1">“{run.answer}”</p>}
              <p className="mt-1 text-ink-3">Orders in database: {(run.db as { orders?: { orderId: string }[] })?.orders?.map((o) => o.orderId).join(", ") || "none"}</p>
              {!safety && failure !== "none" && <p className="mt-1 flex items-center gap-1 font-medium text-safety"><ShieldOff className="h-4 w-4" /> Safety controls were off — compare with them on.</p>}
            </div>
          )}

          {sel ? (
            <div className="rounded-xl border border-line">
              <div className="border-b border-line p-3" style={{ boxShadow: `inset 4px 0 0 ${KIND_COLOR[sel.kind]}` }}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{sel.label}</span>
                  {!visible(sel.id) && <Badge tone="warn"><Lock className="h-3 w-3" /> Module {selModule?.number}</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1" role="tablist">
                  {([["about", "What it does"], ["io", "Inputs & outputs"], ["demo", "Try it"], ["code", "Code"]] as const).map(([id, label]) => (
                    <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                      className={cx("rounded-lg px-2.5 py-1 text-xs font-medium", tab === id ? "bg-sunken text-ink" : "text-ink-3 hover:text-ink")}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 p-3 text-sm" role="tabpanel">
                {tab === "about" && (
                  <>
                    <p className="text-[15px] leading-relaxed">{sel.what}</p>
                    <p className="rounded-lg bg-[color-mix(in_srgb,var(--c-people)_7%,transparent)] p-2.5 text-ink-2"><strong className="text-people">Everyday picture: </strong>{sel.analogy}</p>
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Connected to</div>
                      <div className="flex flex-wrap gap-1">
                        {EDGES.filter((e) => e.a === sel.id || e.b === sel.id).map((e) => {
                          const other = e.a === sel.id ? e.b : e.a;
                          return <button key={other} onClick={() => select(other)} className="rounded-full border border-line px-2 py-0.5 text-xs hover:border-accent">{PART.get(other)?.label}{e.label ? ` · ${e.label}` : ""}</button>;
                        })}
                      </div>
                    </div>
                    <Link href={sel.href} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                      <BookOpen className="h-4 w-4" /> {selModule?.status === "outline" ? `Module ${selModule.number} (outline)` : "Open the lesson"}
                    </Link>
                  </>
                )}
                {tab === "io" && (
                  <div className="grid gap-3">
                    <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Receives</div><ul className="list-disc space-y-0.5 pl-5">{sel.inputs.map((x) => <li key={x}>{x}</li>)}</ul></div>
                    <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Produces</div><ul className="list-disc space-y-0.5 pl-5">{sel.outputs.map((x) => <li key={x}>{x}</li>)}</ul></div>
                  </div>
                )}
                {tab === "demo" && (
                  <div className="space-y-2">
                    <Button size="sm" variant="primary" onClick={async () => setDemo({ part: sel.id, ...(await runPartDemo(sel.id, run)) })}>
                      <Play className="h-4 w-4" /> Run a small demonstration
                    </Button>
                    {demo?.part === sel.id && (
                      <>
                        {demo.note && <p className="text-ink-2">{demo.note}</p>}
                        <JsonView value={demo.output} maxHeight={280} className="text-[11.5px]" />
                      </>
                    )}
                    <p className="text-xs text-ink-3">Demonstrations use this app&apos;s real code with mock data and the simulated model.</p>
                  </div>
                )}
                {tab === "code" && (sel.codeRef ? <ShowCode refId={sel.codeRef} defaultOpen compact /> : sel.id === "instructions" ? <JsonView value={DEFAULT_SYSTEM_PROMPT} maxHeight={260} /> : <p className="text-ink-3">This part&apos;s implementation is taught in Module {selModule?.number}. For now, look at how it connects to the parts you can already inspect.</p>)}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-2">
              Select a part of the agent to learn what it does, what goes in and out, and to run a small demonstration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Region({ x, y, w, h, label, color, onClick, active, faded, labelBottom }: { x: number; y: number; w: number; h: number; label: string; color: string; onClick?: () => void; active?: boolean; faded?: boolean; labelBottom?: boolean }) {
  return (
    <g onClick={onClick} className={onClick ? "cursor-pointer" : undefined} opacity={faded ? 0.5 : 1}>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={`color-mix(in srgb, ${color} 4%, transparent)`} stroke={active ? "var(--ink)" : color} strokeOpacity={active ? 1 : 0.45} strokeWidth={active ? 2.5 : 1.4} strokeDasharray="7 6" />
      <text x={x + 14} y={labelBottom ? y + h - 12 : y + 18} fontSize="12" fontWeight="600" fill={color}>{label}</text>
    </g>
  );
}

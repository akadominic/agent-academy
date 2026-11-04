"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, CheckCircle2, Circle, Cloud, Cpu, Database, HardDrive, Hand, Pause, Play, RotateCcw,
  Server, SkipBack, SkipForward, Smartphone, Cog, XCircle, type LucideIcon,
} from "lucide-react";
import { Button, SimBadge, Segmented, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  FAILURE_LABELS, LOCAL_EDGES, LOCAL_NODES, WEB_EDGES, WEB_NODES, buildTrace, challengeChecklist, challengeMet,
  failIndex, failuresFor, pointAlong, runKey,
  type Failure, type NodeId, type NodeKind, type Point, type Scenario, type TraceChallenge, type TraceStep,
} from "./traceSim";

const ICONS: Record<NodeId, LucideIcon> = {
  phone: Smartphone, dns: BookOpen, internet: Cloud, server: Server, db: Database,
  screen: Hand, os: Cog, storage: HardDrive, cpu: Cpu, "net-off": Cloud,
};

const KIND_VAR: Record<NodeKind, string> = {
  people: "var(--c-people)", tool: "var(--c-tool)", cloud: "var(--c-cloud)", control: "var(--c-control)", data: "var(--c-data)",
};

type Layout = { w: number; h: number; nodeW: number; pos: Partial<Record<NodeId, Point>> };

const LAYOUTS: Record<Scenario, { wide: Layout; tall: Layout }> = {
  web: {
    wide: { w: 800, h: 220, nodeW: 142, pos: { phone: { x: 85, y: 155 }, dns: { x: 260, y: 45 }, internet: { x: 405, y: 155 }, server: { x: 570, y: 155 }, db: { x: 725, y: 155 } } },
    tall: { w: 276, h: 440, nodeW: 126, pos: { phone: { x: 66, y: 40 }, dns: { x: 210, y: 40 }, internet: { x: 138, y: 165 }, server: { x: 138, y: 285 }, db: { x: 138, y: 400 } } },
  },
  local: {
    wide: { w: 800, h: 220, nodeW: 142, pos: { screen: { x: 85, y: 155 }, os: { x: 270, y: 45 }, storage: { x: 500, y: 45 }, cpu: { x: 500, y: 165 }, "net-off": { x: 715, y: 105 } } },
    tall: { w: 276, h: 340, nodeW: 126, pos: { screen: { x: 66, y: 40 }, os: { x: 210, y: 40 }, storage: { x: 210, y: 180 }, cpu: { x: 66, y: 180 }, "net-off": { x: 138, y: 300 } } },
  },
};

const NODE_H = 54;
const STEP_MS = 900;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function Diagram({
  layout, scenario, step, t, finishedIdx, steps,
}: { layout: Layout; scenario: Scenario; step: TraceStep; t: number; finishedIdx: number; steps: TraceStep[] }) {
  const nodes = scenario === "web" ? WEB_NODES : LOCAL_NODES;
  const edges = scenario === "web" ? WEB_EDGES : LOCAL_EDGES;
  const P = layout.pos;
  const NODE_W = layout.nodeW;
  const tall = NODE_W < 140;
  const fi = failIndex(steps);
  const broken = fi >= 0 && finishedIdx >= fi ? steps[fi] : null;

  const route: Point[] = [P[step.from]!, ...(step.via ? [P[step.via]!] : []), P[step.to]!];
  const moving = step.from !== step.to;
  // A packet that cannot leave its own node only gets a short way out.
  const stopAt = step.status === "fail" && step.fault === step.from ? 0.45 : 1;
  const packet = pointAlong(route, Math.min(t, stopAt));
  const activeEdge = (a: NodeId, b: NodeId) => {
    const hops: [NodeId, NodeId][] = step.via ? [[step.from, step.via], [step.via, step.to]] : [[step.from, step.to]];
    return hops.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  };
  const packetColour = step.status === "fail" ? "var(--c-safety)" : "var(--accent)";
  const label = `Diagram: ${nodes.filter((n) => !n.unused).map((n) => n.label).join(", ")}. Current step: ${step.title}.`;

  return (
    <svg viewBox={`0 0 ${layout.w} ${layout.h}`} overflow="visible" className="h-auto w-full" role="img" aria-label={label}>
      {edges.map(([a, b]) => {
        const pa = P[a]!, pb = P[b]!;
        const active = moving && activeEdge(a, b);
        const failed = broken && activeEdge(a, b) && broken === step;
        return (
          <line
            key={`${a}-${b}`}
            x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke={failed ? "var(--c-safety)" : active ? packetColour : "var(--line-strong)"}
            strokeWidth={active ? 3 : 2}
            className={active && t < 1 ? "flow-active" : undefined}
            strokeDasharray={active ? undefined : "0"}
          />
        );
      })}
      {/* The packet is drawn under the nodes, so it disappears into the box it arrives at. */}
      {moving && <circle cx={packet.x} cy={packet.y} r={9} fill={packetColour} stroke="var(--bg-raised)" strokeWidth={2.5} />}
      {nodes.map((n) => {
        const p = P[n.id]!;
        const Icon = ICONS[n.id];
        const colour = KIND_VAR[n.kind];
        const isActive = !n.unused && (step.from === n.id || step.to === n.id || step.via === n.id);
        const isFault = broken?.fault === n.id;
        return (
          <g key={n.id} opacity={n.unused ? 0.38 : 1}>
            {isActive && !isFault && (
              <rect x={p.x - NODE_W / 2} y={p.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={12} fill="none" stroke={colour} strokeWidth={2} className="pulse-ring" />
            )}
            <rect
              x={p.x - NODE_W / 2} y={p.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={12}
              fill="var(--bg-raised)"
              stroke={isFault ? "var(--c-safety)" : colour}
              strokeWidth={isActive || isFault ? 2.5 : 1.5}
              strokeDasharray={n.unused ? "5 4" : undefined}
            />
            <Icon x={p.x - NODE_W / 2 + (tall ? 8 : 9)} y={p.y - (tall ? 8 : 10)} width={tall ? 17 : 20} height={tall ? 17 : 20} color={isFault ? "var(--c-safety)" : colour} aria-hidden />
            <text x={p.x - NODE_W / 2 + (tall ? 30 : 35)} y={p.y - 3} fontSize={13} fontWeight={600} fill="var(--ink)">{n.label}</text>
            <text x={p.x - NODE_W / 2 + (tall ? 30 : 35)} y={p.y + 13} fontSize={11} fill="var(--ink-3)">{n.sub}</text>
            {isFault && (
              <g>
                <circle cx={p.x + NODE_W / 2 - 4} cy={p.y - NODE_H / 2 + 4} r={11} fill="var(--c-safety)" />
                <path d={`M${p.x + NODE_W / 2 - 9} ${p.y - NODE_H / 2 - 1} l10 10 m0 -10 l-10 10`} stroke="var(--bg-raised)" strokeWidth={2.5} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function InternetTrace({ onComplete, scenario: initialScenario, challenge: challengeProp }: LabProps & { scenario?: Scenario; challenge?: TraceChallenge }) {
  const challenge: TraceChallenge = challengeProp === "airplane" ? "airplane" : "full";
  const [scenario, setScenario] = useState<Scenario>(initialScenario === "local" ? "local" : "web");
  const [failure, setFailure] = useState<Failure>("none");
  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState<Set<string>>(new Set());
  const completedRef = useRef(false);

  const steps = useMemo(() => buildTrace(scenario, failure), [scenario, failure]);
  const step = steps[Math.min(idx, steps.length - 1)];
  const atEnd = idx >= steps.length - 1;
  const fi = failIndex(steps);

  // Animate the packet whenever we move forward one step.
  const animFrom = useRef<number | null>(null);
  useEffect(() => {
    if (t >= 1) return;
    if (prefersReducedMotion()) { setT(1); return; }
    let raf = 0;
    const tick = (now: number) => {
      if (animFrom.current === null) animFrom.current = now;
      const next = Math.min(1, (now - animFrom.current) / STEP_MS);
      setT(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Only restart when the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, scenario, failure]);

  function forward() {
    if (atEnd) return;
    animFrom.current = null;
    setT(0);
    setIdx((i) => Math.min(steps.length - 1, i + 1));
  }
  function back() {
    setPlaying(false);
    setT(1);
    setIdx((i) => Math.max(0, i - 1));
  }
  function reset() {
    setPlaying(false);
    setT(1);
    setIdx(0);
  }
  function choose(s: Scenario, f: Failure) {
    setPlaying(false);
    setT(1);
    setIdx(0);
    setScenario(s);
    setFailure(failuresFor(s).includes(f) ? f : "none");
  }

  // Auto-play: wait for the packet to arrive, pause briefly, then advance.
  useEffect(() => {
    if (!playing) return;
    if (atEnd) { setPlaying(false); return; }
    if (t < 1) return;
    const timer = setTimeout(forward, 650);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, t, idx, atEnd]);

  // Record finished runs and report completion once.
  useEffect(() => {
    if (!atEnd || t < 1) return;
    const key = runKey(scenario, failure);
    if (finished.has(key)) return;
    const next = new Set(finished).add(key);
    setFinished(next);
    if (!completedRef.current && challengeMet(challenge, next)) {
      completedRef.current = true;
      onComplete?.(challenge === "airplane" ? "Compared local and remote execution in airplane mode" : "Traced a full trip and three failures");
    }
  }, [atEnd, t, scenario, failure, finished, challenge, onComplete]);

  const layouts = LAYOUTS[scenario];
  const checklist = challengeChecklist(challenge, finished);
  const stepTone = step.status === "fail" || step.status === "end-fail" ? "bad" : step.status === "end-ok" ? "good" : "info";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented<Scenario>
          label="Which trip to trace"
          value={scenario}
          onChange={(s) => choose(s, failure)}
          options={[
            { value: "web", label: "Shop website (remote)" },
            { value: "local", label: "Calculator app (local)" },
          ]}
        />
        <SimBadge label="Simulated network" />
      </div>

      <fieldset className="rounded-xl border border-line p-3">
        <legend className="px-1 text-sm font-medium">Break something</legend>
        <div role="radiogroup" aria-label="Failure to simulate" className="flex flex-wrap gap-2">
          {failuresFor(scenario).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={failure === f}
              onClick={() => choose(scenario, f)}
              title={FAILURE_LABELS[f].desc}
              className={cx(
                "rounded-full border px-3 py-1 text-sm",
                failure === f
                  ? f === "none" ? "border-ok bg-[color-mix(in_srgb,var(--c-ok)_12%,transparent)] text-ink" : "border-safety bg-[color-mix(in_srgb,var(--c-safety)_10%,transparent)] text-ink"
                  : "border-line text-ink-2 hover:bg-sunken",
              )}
            >
              {FAILURE_LABELS[f].label}
              {finished.has(runKey(scenario, f)) && <span className="ml-1 text-ok" aria-label="(done)">✓</span>}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-3">{FAILURE_LABELS[failure].desc}{scenario === "local" && " The other failures belong to the internet trip, so they don't apply here."}</p>
      </fieldset>

      <div className="rounded-xl border border-line bg-bg/60 p-2">
        <div className="mx-auto hidden max-w-[820px] sm:block">
          <Diagram layout={layouts.wide} scenario={scenario} step={step} t={t} finishedIdx={idx} steps={steps} />
        </div>
        <div className="mx-auto max-w-[340px] sm:hidden">
          <Diagram layout={layouts.tall} scenario={scenario} step={step} t={t} finishedIdx={idx} steps={steps} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
          {playing ? <><Pause className="h-4 w-4" aria-hidden /> Pause</> : <><Play className="h-4 w-4" aria-hidden /> Play</>}
        </Button>
        <Button size="sm" onClick={back} disabled={idx === 0}>
          <SkipBack className="h-4 w-4" aria-hidden /> Back
        </Button>
        <Button size="sm" onClick={() => { setPlaying(false); forward(); }} disabled={atEnd}>
          <SkipForward className="h-4 w-4" aria-hidden /> Step
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset
        </Button>
        <span className="text-xs text-ink-3">Step {idx + 1} of {steps.length}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section
          aria-live="polite"
          aria-label="Inspector"
          className={cx(
            "min-w-0 rounded-xl border p-4",
            stepTone === "bad" && "border-safety/50 bg-[color-mix(in_srgb,var(--c-safety)_5%,transparent)]",
            stepTone === "good" && "border-ok/50",
            stepTone === "info" && "border-line",
          )}
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Inspector · step {idx + 1}</div>
          <h3 className="flex items-start gap-2 font-semibold">
            {stepTone === "bad" && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-safety" aria-hidden />}
            {stepTone === "good" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />}
            {step.title}
          </h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{step.plain}</p>
          {step.analogy && (
            <p className="mt-2 rounded-lg bg-[color-mix(in_srgb,var(--c-people)_7%,transparent)] px-3 py-2 text-sm text-ink-2">
              <span className="font-semibold text-people">Everyday picture: </span>{step.analogy}
            </p>
          )}
          {step.panels.map((p) => (
            <div key={p.label} className="mt-3">
              <div className="mb-1 text-xs font-semibold text-ink-3">{p.label}</div>
              <pre tabIndex={0} className="max-h-72 overflow-auto rounded-lg bg-code p-3 font-mono text-[12px] leading-relaxed text-code-ink">{p.text}</pre>
            </div>
          ))}
        </section>

        <aside className="space-y-3">
          <div className="rounded-xl border border-line p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">The trip</div>
            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => { setPlaying(false); setT(1); setIdx(i); }}
                    disabled={i > idx}
                    aria-current={i === idx ? "step" : undefined}
                    className={cx(
                      "flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-[13px]",
                      i === idx ? "bg-sunken font-medium text-ink" : i < idx ? "text-ink-2 hover:bg-sunken" : "text-ink-3 opacity-60",
                    )}
                  >
                    <span className={cx("mt-px font-mono text-[11px]", i === fi && i <= idx ? "text-safety" : "text-ink-3")}>{i + 1}</span>
                    <span>{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-line p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Your challenge</div>
            <ul className="space-y-1.5 text-[13px]">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-2">
                  {c.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="done" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-label="not yet" />}
                  <span className={c.done ? "text-ink" : "text-ink-2"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-3">Run each trip to its last step.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

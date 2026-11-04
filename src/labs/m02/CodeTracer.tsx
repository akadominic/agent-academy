"use client";

import { useEffect, useRef, useState } from "react";
import { ChefHat, CheckCircle2, Clock, Flame, HelpCircle, Pause, Play, RotateCcw, SkipBack, SkipForward, User, XCircle } from "lucide-react";
import { Button, Segmented, SimBadge, cx } from "@/components/ui/primitives";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import { Markup } from "@/components/lesson/Markup";
import type { LabProps } from "../types";
import { SCENARIOS, getScenario, type Scenario, type TraceStep } from "./traces";

function isFn(v: unknown): v is { __fn: string } {
  return Boolean(v && typeof v === "object" && "__fn" in (v as object));
}

function typeName(v: unknown) {
  if (isFn(v)) return "function";
  if (Array.isArray(v)) return "array";
  if (v === null) return "null";
  if (typeof v === "string") return "string";
  return typeof v;
}

function Scalar({ v }: { v: unknown }) {
  if (typeof v === "string") return <span className="text-ok">&quot;{v}&quot;</span>;
  if (typeof v === "number") return <span className="text-data">{v}</span>;
  if (typeof v === "boolean") return <span className="font-semibold text-model">{String(v)}</span>;
  if (isFn(v)) return <span className="text-control">ƒ {v.__fn}</span>;
  return <span>{JSON.stringify(v)}</span>;
}

function Value({ v }: { v: unknown }) {
  if (Array.isArray(v)) {
    return (
      <ol className="mt-1 flex flex-wrap gap-1">
        {v.map((item, i) => (
          <li key={i} className="rounded border border-line bg-raised px-1.5 py-0.5">
            <span className="mr-1 text-[10px] text-ink-3">[{i}]</span>
            {item && typeof item === "object" ? <Value v={item} /> : <Scalar v={item} />}
          </li>
        ))}
      </ol>
    );
  }
  if (v && typeof v === "object" && !isFn(v)) {
    return (
      <div className="mt-0.5 space-y-0.5">
        {Object.entries(v as Record<string, unknown>).map(([k, x]) => (
          <div key={k} className="break-all"><span className="text-ink-3">{k}:</span> <Scalar v={x} /></div>
        ))}
      </div>
    );
  }
  return <Scalar v={v} />;
}

function KitchenView({ step }: { step: TraceStep }) {
  const k = step.kitchen!;
  return (
    <div className="space-y-2" aria-label="Kitchen view of the event loop">
      <div className="flex items-center gap-2 text-xs text-ink-3"><Clock className="h-3.5 w-3.5" aria-hidden /> Pretend time: minute {k.clock}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-control/40 p-2">
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-control"><User className="h-3.5 w-3.5" aria-hidden /> Waiter (main thread)</div>
          <div className="text-[13px]">{k.waiter || "—"}</div>
        </div>
        <div className="rounded-lg border border-tool/40 p-2">
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-tool"><Flame className="h-3.5 w-3.5" aria-hidden /> Kitchen (pending promises)</div>
          {k.cooking.length ? (
            <ul className="space-y-1 text-[13px]">
              {k.cooking.map((c) => (
                <li key={c.dish} className="flex items-center justify-between gap-2">
                  <span>{c.dish}</span>
                  <span className="text-[11px] text-ink-3">ready at min {c.readyAt}</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-[13px] text-ink-3">empty</div>}
        </div>
        <div className="rounded-lg border border-people/40 p-2">
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-people"><ChefHat className="h-3.5 w-3.5" aria-hidden /> Counter (ready callbacks)</div>
          {k.counter.length ? <ul className="text-[13px]">{k.counter.map((c) => <li key={c}>{c}</li>)}</ul> : <div className="text-[13px] text-ink-3">empty</div>}
        </div>
      </div>
    </div>
  );
}

export default function CodeTracer({ onComplete, scenario: initial }: LabProps & { scenario?: string }) {
  const [sc, setSc] = useState<Scenario>(() => getScenario(initial));
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const completed = useRef(false);

  const step = sc.steps[i];
  const key = `${sc.id}:${i}`;
  const blocked = Boolean(step.ask && answers[key] === undefined);
  const atEnd = i === sc.steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd || blocked) { setPlaying(false); return; }
    const t = setTimeout(() => setI((n) => n + 1), 1400);
    return () => clearTimeout(t);
  }, [playing, atEnd, blocked, i]);

  useEffect(() => {
    if (atEnd && !completed.current) {
      completed.current = true;
      onComplete?.(`Traced the ${sc.title} program to the end`);
    }
  }, [atEnd, sc.title, onComplete]);

  function choose(id: string) {
    setSc(getScenario(id));
    setI(0);
    setPlaying(false);
  }

  const chosen = answers[key];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented size="sm" label="Program" value={sc.id} onChange={choose} options={SCENARIOS.map((s) => ({ value: s.id, label: s.title }))} />
        <SimBadge label="Recorded steps" />
      </div>
      <p className="text-sm text-ink-2">{sc.blurb}</p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <CodeBlock code={sc.code} lang="js" highlight={[step.line]} />
          <div className="rounded-xl border border-accent/40 bg-accent-soft/30 p-3 text-[14.5px] leading-relaxed" aria-live="polite">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Step {i + 1} of {sc.steps.length} · line {step.line}</div>
            <Markup text={step.note} />
          </div>
          {step.ask && (
            <div className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-start gap-2 text-sm font-semibold"><HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> {step.ask.prompt}</div>
              <div className="grid gap-1.5" role="group" aria-label="Your prediction">
                {step.ask.options.map((o, j) => {
                  const picked = chosen === j;
                  const right = j === step.ask!.answer;
                  return (
                    <button
                      key={j}
                      onClick={() => chosen === undefined && setAnswers((a) => ({ ...a, [key]: j }))}
                      disabled={chosen !== undefined}
                      aria-pressed={picked}
                      className={cx(
                        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm",
                        chosen === undefined && "border-line hover:border-accent hover:bg-sunken",
                        chosen !== undefined && right && "border-ok/60 bg-[color-mix(in_srgb,var(--c-ok)_8%,transparent)]",
                        chosen !== undefined && picked && !right && "border-safety/60 bg-[color-mix(in_srgb,var(--c-safety)_7%,transparent)]",
                        chosen !== undefined && !picked && !right && "border-line opacity-60",
                      )}
                    >
                      {chosen !== undefined && right && <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-label="correct answer" />}
                      {chosen !== undefined && picked && !right && <XCircle className="h-4 w-4 shrink-0 text-safety" aria-label="your answer, incorrect" />}
                      <span className="font-mono text-[13px]">{o}</span>
                    </button>
                  );
                })}
              </div>
              {chosen !== undefined && (
                <p className="mt-2 text-sm text-ink-2" aria-live="polite">
                  <span className={cx("font-semibold", chosen === step.ask.answer ? "text-ok" : "text-safety")}>{chosen === step.ask.answer ? "Correct. " : "Not quite. "}</span>
                  {step.ask.explain} Now press <strong>Step</strong> to check.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setI((n) => Math.max(0, n - 1)); setPlaying(false); }} disabled={i === 0} aria-label="Back one step">
              <SkipBack className="h-4 w-4" /> Back
            </Button>
            <Button size="sm" variant="primary" onClick={() => setI((n) => Math.min(sc.steps.length - 1, n + 1))} disabled={atEnd || blocked}>
              <SkipForward className="h-4 w-4" /> Step
            </Button>
            <Button size="sm" onClick={() => setPlaying((p) => !p)} disabled={atEnd || blocked}>
              {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setI(0); setPlaying(false); }}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            {blocked && <span className="text-xs text-warn">Make a prediction to continue</span>}
            {atEnd && <span className="text-xs font-medium text-ok">Finished — try another program</span>}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          {step.kitchen && <KitchenView step={step} />}

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-3">Containers (variables)</div>
            {step.vars.length === 0 ? (
              <p className="text-sm text-ink-3">No variables yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {step.vars.map((v) => (
                  <li
                    key={v.name}
                    className={cx("rounded-lg border-2 bg-bg/60 p-2 font-mono text-[12.5px] transition-colors", v.changed ? "border-accent" : "border-data/40")}
                  >
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-data/15 px-1.5 font-semibold text-data">{v.name}</span>
                      <span className="text-[10.5px] text-ink-3">{v.kind === "function" ? "function" : `${v.kind} · ${typeName(v.value)}`}</span>
                      {v.changed && <span className="ml-auto font-sans text-[10.5px] font-semibold text-accent">changed</span>}
                    </div>
                    <Value v={v.value} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {step.frames.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-3">Function running now</div>
              {step.frames.map((f) => (
                <div key={f.name} className="rounded-lg border-2 border-control/50 p-2 font-mono text-[12.5px]">
                  <div className="mb-1 font-semibold text-control">{f.name}(…) — its own private workspace</div>
                  {Object.entries(f.vars).map(([k, v]) => <div key={k}><span className="text-ink-3">{k} (parameter):</span> <Scalar v={v} /></div>)}
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-3">Output (console)</div>
            <pre className="min-h-[3.5rem] overflow-auto rounded-lg bg-code p-2.5 font-mono text-[12.5px] text-code-ink" tabIndex={0} aria-label="Program output">
              {step.out.length ? step.out.join("\n") : <span className="text-[#a8a093]">(nothing printed yet)</span>}
            </pre>
          </div>
        </div>
      </div>
      <p className="text-xs text-ink-3">
        The code is real JavaScript — you can paste it into any exercise and run it. The step-by-step view is a recording written for teaching: real JavaScript runs these lines in a few microseconds without stopping.
      </p>
    </div>
  );
}

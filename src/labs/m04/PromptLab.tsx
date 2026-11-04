"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Play, Plus, RotateCcw, XCircle } from "lucide-react";
import { Button, SimBadge, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  CONFLICT_RULE, FEATURES, PRESETS, TEST_INPUTS, detectFeatures, runPrompt,
  type Detected, type Graded, type RunSummary,
} from "./promptSim";

function FeatureChips({ d }: { d: Detected }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Prompt features the simulator detected">
      {FEATURES.map((f) => {
        const on = d[f.id];
        return (
          <li
            key={f.id}
            title={f.rule}
            className={cx(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-medium",
              on ? "border-ok/40 text-ok" : "border-line text-ink-3",
            )}
          >
            {on ? <CheckCircle2 className="h-3 w-3" aria-hidden /> : <XCircle className="h-3 w-3" aria-hidden />}
            {f.name}
            <span className="sr-only">{on ? "present" : "missing"}</span>
          </li>
        );
      })}
      {d.conflict && (
        <li title={CONFLICT_RULE} className="inline-flex items-center gap-1 rounded-full border border-safety/50 px-2 py-0.5 text-[12px] font-medium text-safety">
          <AlertTriangle className="h-3 w-3" aria-hidden /> Conflict
        </li>
      )}
    </ul>
  );
}

function Score({ s, label }: { s: RunSummary; label: string }) {
  const pct = Math.round(s.consistency * 100);
  return (
    <div className="rounded-lg bg-sunken px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">{label}</span>
        <span className={cx("font-mono text-lg font-semibold", pct === 100 ? "text-ok" : pct >= 60 ? "text-warn" : "text-safety")}>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} consistency`}>
        <div className={cx("h-full rounded-full transition-[width] duration-500", pct === 100 ? "bg-ok" : pct >= 60 ? "bg-warn" : "bg-safety")} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[12px] text-ink-2">
        Correct format: {s.formatOk}/{s.total} · Correct label: {s.correct}/{s.total}
      </div>
    </div>
  );
}

function OutputCell({ g, tag }: { g: Graded; tag: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cx("min-w-0 rounded-lg border p-2", g.correct ? "border-ok/40" : "border-safety/40")}>
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px]">
        <span className="font-semibold text-ink-3">{tag}</span>
        <span className={g.formatOk ? "text-ok" : "text-safety"}>{g.formatOk ? "✓ format" : "✗ format"}</span>
        <span className={g.correct ? "text-ok" : "text-safety"}>{g.correct ? "✓ label" : "✗ label"}</span>
      </div>
      <pre className="whitespace-pre-wrap break-words rounded bg-code px-2 py-1.5 font-mono text-[12px] text-code-ink">{g.output.text}</pre>
      <button className="mt-1 text-[12px] text-accent underline-offset-2 hover:underline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? "Hide why" : "Why this output?"}
      </button>
      {open && (
        <ul className="mt-1 space-y-0.5 text-[12px] text-ink-2">
          {g.output.reasons.map((r) => <li key={r}>· {r}</li>)}
        </ul>
      )}
    </div>
  );
}

export default function PromptLab({ onComplete, preset }: LabProps & { preset?: string }) {
  const start = PRESETS[preset ?? "weak"] ?? PRESETS.weak;
  const [a, setA] = useState(start.prompt);
  const [b, setB] = useState(start.prompt);
  const [ran, setRan] = useState<{ a: string; b: string } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [done, setDone] = useState(false);
  const bRef = useRef<HTMLTextAreaElement>(null);

  const dA = useMemo(() => detectFeatures(a), [a]);
  const dB = useMemo(() => detectFeatures(b), [b]);
  const resA = useMemo(() => (ran ? runPrompt(ran.a) : null), [ran]);
  const resB = useMemo(() => (ran ? runPrompt(ran.b) : null), [ran]);
  const stale = ran !== null && (ran.a !== a || ran.b !== b);

  useEffect(() => {
    if (resB && resB.correct === resB.total && !done) {
      setDone(true);
      onComplete?.("Improved the prompt until every test input was correct");
    }
  }, [resB, done, onComplete]);

  function insert(snippet: string) {
    setB((cur) => (cur.trim() ? `${cur.trimEnd()}\n\n${snippet}` : snippet));
    bRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Simulated model · rule-based" />
        <span className="text-sm text-ink-2">Task: sort Mama Achen's customer messages into <b>order</b>, <b>question</b>, <b>complaint</b> or <b>other</b>, as JSON.</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label htmlFor="prompt-a" className="flex items-center justify-between text-sm font-semibold">
            <span>Version A <span className="font-normal text-ink-3">· baseline</span></span>
          </label>
          <textarea
            id="prompt-a"
            value={a}
            onChange={(e) => setA(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-line-strong bg-bg p-3 font-mono text-[13px] leading-relaxed text-ink focus:border-accent focus:outline-none"
          />
          <FeatureChips d={dA} />
        </div>
        <div className="min-w-0 space-y-2">
          <label htmlFor="prompt-b" className="flex items-center justify-between text-sm font-semibold">
            <span>Version B <span className="font-normal text-ink-3">· your improved prompt</span></span>
          </label>
          <textarea
            id="prompt-b"
            ref={bRef}
            value={b}
            onChange={(e) => setB(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-xl border-2 border-accent/60 bg-bg p-3 font-mono text-[13px] leading-relaxed text-ink focus:border-accent focus:outline-none"
          />
          <FeatureChips d={dB} />
        </div>
      </div>

      <details className="rounded-xl border border-line px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium">Stuck? Insert a building block into Version B</summary>
        <p className="mt-2 text-ink-2">Each button adds an example sentence. Edit it afterwards; try writing your own first.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <Button key={f.id} size="sm" onClick={() => insert(f.snippet)}>
              <Plus className="h-3.5 w-3.5" /> {f.name}
            </Button>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => setRan({ a, b })}>
          <Play className="h-4 w-4" /> Run both on {TEST_INPUTS.length} test messages
        </Button>
        <Button variant="ghost" onClick={() => setA(b)} title="Keep Version B as the new baseline, then keep improving B">
          <ArrowLeftRight className="h-4 w-4" /> Make B the new baseline
        </Button>
        <Button variant="ghost" onClick={() => { setA(start.prompt); setB(start.prompt); setRan(null); }}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
        <Button variant="ghost" onClick={() => setShowRules((s) => !s)} aria-expanded={showRules}>
          {showRules ? "Hide" : "Show"} the simulator's rules
        </Button>
      </div>

      {showRules && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="px-3 pt-2 text-left text-xs text-ink-3">Every rule this simulator uses. There is nothing hidden.</caption>
            <thead className="bg-sunken/70">
              <tr><th className="px-3 py-2">Feature</th><th className="px-3 py-2">Detected when the prompt…</th><th className="px-3 py-2">If missing, in this simulation…</th></tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.id} className="border-t border-line align-top">
                  <td className="px-3 py-2 font-medium">{f.name}</td>
                  <td className="px-3 py-2 text-ink-2">{f.rule}</td>
                  <td className="px-3 py-2 text-ink-2">{f.effect}</td>
                </tr>
              ))}
              <tr className="border-t border-line align-top">
                <td className="px-3 py-2 font-medium text-safety">Conflict</td>
                <td className="px-3 py-2 text-ink-2">{CONFLICT_RULE}</td>
                <td className="px-3 py-2 text-ink-2">The sim follows a different instruction on alternate messages, so the format is inconsistent.</td>
              </tr>
            </tbody>
          </table>
          <p className="border-t border-line px-3 py-2 text-xs text-ink-3">
            Grading is done the way your code would do it: try <code>JSON.parse</code>, check the object has exactly one field, <code>category</code>, with one of the four labels, then compare with the right answer.
          </p>
        </div>
      )}

      {ran && resA && resB && (
        <div className="space-y-3" aria-live="polite">
          {stale && <p className="rounded-lg border border-warn/50 px-3 py-2 text-sm text-warn">You edited a prompt after running. Press Run again to see the new results.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <Score s={resA} label="Version A" />
            <Score s={resB} label="Version B" />
          </div>
          <p className="text-xs text-ink-3">Consistency score = the share of test messages where the output was valid JSON in the right shape <b>and</b> had the right label.</p>
          <ol className="space-y-2">
            {TEST_INPUTS.map((inp, i) => (
              <li key={inp.id} className="rounded-xl border border-line p-2.5">
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-mono text-xs text-ink-3">#{i + 1}</span>
                  <span className="font-medium">“{inp.text}”</span>
                  <span className="text-xs text-ink-3">right answer: <b>{inp.expected}</b></span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <OutputCell g={resA.results[i]} tag="A" />
                  <OutputCell g={resB.results[i]} tag="B" />
                </div>
              </li>
            ))}
          </ol>
          {resB.correct === resB.total ? (
            <div className="rounded-xl border border-ok/50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-ok"><CheckCircle2 className="h-4 w-4" /> Challenge complete: Version B is correct on all {resB.total} test messages.</div>
              <p className="mt-1 text-ink-2">Five out of five on five tests is a good sign, not a guarantee. A real model can still surprise you on message number six, which is why your code must still check every output.</p>
            </div>
          ) : (
            <p className="text-sm text-ink-2">Goal: get Version B to 100%. Open “Why this output?” on a failing message to see which rule caused it.</p>
          )}
        </div>
      )}

      <p className="rounded-lg bg-sunken px-3 py-2 text-[13px] text-ink-2">
        <b>Honest note:</b> this “model” is a few keyword rules, so it behaves the same way every time. Real language models are not rule-based, do not look for keywords, and can vary between runs. What carries over is the tendency: prompts with a clear task, needed context, examples and an exact output format usually give more reliable output.
      </p>
    </div>
  );
}

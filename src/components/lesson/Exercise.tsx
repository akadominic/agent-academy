"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CheckCircle2, Eye, Lightbulb, Play, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import type { CodeExercise } from "@/content/schema";
import { runCode, type RunResult } from "@/engine/runner/runCode";
import { Button, cx } from "@/components/ui/primitives";
import { Markup } from "./Markup";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-[180px] animate-pulse rounded-xl bg-code" />,
});

/**
 * A runnable JavaScript exercise. Code runs in a sandboxed Web Worker in
 * the learner's browser and is checked by real tests.
 */
export function Exercise({ exercise, done, onPass }: { exercise: CodeExercise; done?: boolean; onPass?: () => void }) {
  const storageKey = `agent-academy:code:${exercise.id}`;
  const [code, setCode] = useState<string>(() => {
    if (typeof window === "undefined") return exercise.starter;
    try {
      return window.localStorage.getItem(storageKey) ?? exercise.starter;
    } catch {
      return exercise.starter;
    }
  });
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hints, setHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  function edit(v: string) {
    setCode(v);
    try {
      window.localStorage.setItem(storageKey, v);
    } catch {
      /* ignore */
    }
  }

  async function run() {
    setRunning(true);
    const r = await runCode(code, exercise.tests, exercise.timeoutMs ?? 2000);
    setResult(r);
    setAttempts((a) => a + 1);
    setRunning(false);
    if (r.ok) onPass?.();
  }

  const passed = result?.ok || done;

  return (
    <div className="space-y-3 rounded-xl border border-line p-3 sm:p-4" data-exercise={exercise.id}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-semibold">{exercise.title}</h4>
        {passed && <span className="inline-flex items-center gap-1 text-sm font-medium text-ok"><CheckCircle2 className="h-4 w-4" /> Passed</span>}
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-3" title="Your code runs in an isolated Web Worker in your own browser. It cannot reach the network or this page.">
          <ShieldCheck className="h-3.5 w-3.5" /> Runs safely in your browser
        </span>
      </div>
      <div className="prose-lesson text-[15px] text-ink-2"><Markup text={exercise.brief} /></div>
      <CodeEditor value={code} onChange={edit} ariaLabel={`Code editor for ${exercise.title}`} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={run} disabled={running}>
          <Play className="h-4 w-4" /> {running ? "Running…" : "Run & check"}
        </Button>
        <Button variant="ghost" onClick={() => { edit(exercise.starter); setResult(null); }}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
        {hints < exercise.hints.length && (
          <Button variant="ghost" onClick={() => setHints((h) => h + 1)}>
            <Lightbulb className="h-4 w-4" /> Hint {hints + 1}/{exercise.hints.length}
          </Button>
        )}
        {(attempts >= 3 || hints >= exercise.hints.length) && !showSolution && (
          <Button variant="ghost" onClick={() => setShowSolution(true)}>
            <Eye className="h-4 w-4" /> Show solution
          </Button>
        )}
      </div>

      {hints > 0 && (
        <ol className="space-y-1.5">
          {exercise.hints.slice(0, hints).map((h, i) => (
            <li key={i} className="rounded-lg bg-sunken px-3 py-2 text-sm text-ink-2">
              <Lightbulb className="mr-1 inline h-4 w-4 text-warn" /> <Markup text={h} />
            </li>
          ))}
        </ol>
      )}

      {result && (
        <div className="space-y-2" aria-live="polite">
          {result.error && (
            <div className="rounded-lg border border-safety/40 bg-[color-mix(in_srgb,var(--c-safety)_7%,transparent)] p-3 font-mono text-[13px] text-safety">
              {result.error}
            </div>
          )}
          {result.logs.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Console output</div>
              <pre className="max-h-48 overflow-auto rounded-lg bg-code p-3 font-mono text-[12.5px] text-code-ink">{result.logs.join("\n")}</pre>
            </div>
          )}
          {result.tests.length > 0 && (
            <ul className="space-y-1">
              {result.tests.map((t) => (
                <li key={t.name} className={cx("flex items-start gap-2 rounded-lg px-3 py-2 text-sm", t.passed ? "bg-[color-mix(in_srgb,var(--c-ok)_9%,transparent)]" : "bg-[color-mix(in_srgb,var(--c-safety)_7%,transparent)]")}>
                  {t.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-safety" />}
                  <span><span className="font-medium">{t.name}</span> — <span className="text-ink-2">{t.message}</span></span>
                </li>
              ))}
            </ul>
          )}
          {result.ok && <p className="text-sm font-medium text-ok">All tests pass. Your code works.</p>}
        </div>
      )}

      {showSolution && (
        <div className="space-y-2">
          <p className="text-sm text-ink-2">A reference solution. Read it, then try to rewrite it yourself without looking.</p>
          <pre className="overflow-auto rounded-lg bg-code p-3 font-mono text-[12.5px] text-code-ink">{exercise.solution}</pre>
        </div>
      )}
    </div>
  );
}

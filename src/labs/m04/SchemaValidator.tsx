"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import { Button, JsonView, SimBadge, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import { PRODUCT_SCHEMA, SAMPLES, UNITS, checkSample } from "./schemaLab";

const CodeEditor = dynamic(() => import("@/components/lesson/CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-[170px] animate-pulse rounded-xl bg-code" />,
});

export default function SchemaValidator({ onComplete }: LabProps) {
  const [active, setActive] = useState(SAMPLES[1].id);
  const [texts, setTexts] = useState<Record<string, string>>(() => Object.fromEntries(SAMPLES.map((s) => [s.id, s.output])));
  const [hint, setHint] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [completed, setCompleted] = useState(false);

  const sample = SAMPLES.find((s) => s.id === active)!;
  const text = texts[active];
  const result = useMemo(() => checkSample(text, sample), [text, sample]);
  const fixedIds = useMemo(
    () => new Set(SAMPLES.filter((s) => s.broken && checkSample(texts[s.id], s).fixed).map((s) => s.id)),
    [texts],
  );
  const broken = SAMPLES.filter((s) => s.broken);
  const allFixed = fixedIds.size === broken.length;

  useEffect(() => {
    if (allFixed && !completed) {
      setCompleted(true);
      onComplete?.("Fixed every broken model output");
    }
  }, [allFixed, completed, onComplete]);

  function choose(id: string) {
    setActive(id);
    setHint(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Simulated model outputs" />
        <span className="text-sm text-ink-2">Validation is real: this lab uses the course's own JSON Schema validator.</span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Model outputs">
        {SAMPLES.map((s) => {
          const ok = s.broken ? fixedIds.has(s.id) : true;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === active}
              onClick={() => choose(s.id)}
              className={cx(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm",
                s.id === active ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-sunken",
              )}
            >
              {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-ok" aria-hidden /> : <XCircle className="h-3.5 w-3.5 text-safety" aria-hidden />}
              {s.title}
              <span className="sr-only">{ok ? "(valid)" : "(still broken)"}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-3">Fixed {fixedIds.size} of {broken.length} broken outputs.</p>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-2">
          <div className="rounded-lg bg-sunken px-3 py-2 text-sm">
            <span className="text-xs text-ink-3">Customer message: </span>
            <span className="font-medium">“{sample.message}”</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">What the model returned <span className="font-normal text-ink-3">(edit it)</span></span>
            <Button size="sm" variant="ghost" onClick={() => setTexts((t) => ({ ...t, [active]: sample.output }))}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
          <CodeEditor
            key={active}
            value={text}
            onChange={(v) => setTexts((t) => ({ ...t, [active]: v }))}
            language="json"
            minHeight={150}
            ariaLabel={`Model output: ${sample.title}`}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setHint((h) => !h)} aria-expanded={hint}>
              <Lightbulb className="h-3.5 w-3.5" /> {hint ? "Hide hint" : "Hint"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSchema((s) => !s)} aria-expanded={showSchema}>
              {showSchema ? "Hide" : "Show"} the schema as JSON
            </Button>
          </div>
          {hint && <p className="rounded-lg bg-sunken px-3 py-2 text-sm text-ink-2"><Lightbulb className="mr-1 inline h-4 w-4 text-warn" aria-hidden />{sample.hint}</p>}
        </div>

        <div className="min-w-0 space-y-2" aria-live="polite">
          <div className="text-sm font-semibold">Validation result</div>
          {/* Step 1: parse */}
          <div className={cx("rounded-lg border px-3 py-2 text-sm", result.parsed ? "border-ok/40" : "border-safety/50")}>
            <div className="flex items-center gap-1.5 font-medium">
              {result.parsed ? <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden /> : <XCircle className="h-4 w-4 text-safety" aria-hidden />}
              1. Is it valid JSON? {result.parsed ? "Yes" : "No"}
            </div>
            {!result.parsed && (
              <>
                <p className="mt-1 text-ink-2">{result.parseHint}</p>
                <p className="mt-1 break-words font-mono text-[12px] text-safety">JSON.parse said: {result.parseError}</p>
              </>
            )}
          </div>
          {/* Step 2: schema */}
          <div className={cx("rounded-lg border px-3 py-2 text-sm", !result.parsed ? "border-line opacity-60" : result.schemaValid ? "border-ok/40" : "border-safety/50")}>
            <div className="flex items-center gap-1.5 font-medium">
              {result.parsed && result.schemaValid ? <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden /> : <XCircle className={cx("h-4 w-4", result.parsed ? "text-safety" : "text-ink-3")} aria-hidden />}
              2. Does it match the schema? {!result.parsed ? "(needs valid JSON first)" : result.schemaValid ? "Yes" : `No: ${result.problems.length} problem${result.problems.length > 1 ? "s" : ""}`}
            </div>
            {result.problems.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {result.problems.map((p, i) => (
                  <li key={i} className="font-mono text-[12.5px]"><span className="rounded bg-sunken px-1 text-data">{p.path}</span> <span className="text-ink-2">{p.message}</span></li>
                ))}
              </ul>
            )}
          </div>
          {/* Step 3: meaning */}
          <div className={cx("rounded-lg border px-3 py-2 text-sm", !result.schemaValid ? "border-line opacity-60" : result.meaning.length ? "border-warn/50" : "border-ok/40")}>
            <div className="flex items-center gap-1.5 font-medium">
              {result.schemaValid && result.meaning.length === 0 ? <CheckCircle2 className="h-4 w-4 text-ok" aria-hidden /> : result.schemaValid ? <AlertTriangle className="h-4 w-4 text-warn" aria-hidden /> : <XCircle className="h-4 w-4 text-ink-3" aria-hidden />}
              3. Does it match what the customer said?
            </div>
            {result.meaning.length > 0 && (
              <>
                <ul className="mt-1 space-y-0.5 text-ink-2">{result.meaning.map((m) => <li key={m}>· {m}</li>)}</ul>
                <p className="mt-1 text-xs text-ink-3">The shape is valid, so a schema cannot catch this. Only a check against the source (or a person) can.</p>
              </>
            )}
          </div>
          {result.fixed && <p className="flex items-center gap-1.5 text-sm font-medium text-ok"><CheckCircle2 className="h-4 w-4" aria-hidden /> {sample.broken ? "Fixed! Your code could now use this safely." : "Valid. Pick a broken one to fix."}</p>}
          <p className="text-xs text-ink-3"><code>$</code> means “the whole object”, so <code>$.quantity</code> means “the quantity field”.</p>
        </div>
      </div>

      <div className="rounded-xl border border-data/40 p-3 text-sm">
        <div className="mb-1 font-semibold">The schema in plain words</div>
        <ul className="space-y-0.5 text-ink-2">
          <li>· It must be an <b>object</b> with exactly three fields, all <b>required</b>, and <b>no others</b>.</li>
          <li>· <code>product</code>: text (a string), not empty.</li>
          <li>· <code>quantity</code>: a whole number (integer), at least 1.</li>
          <li>· <code>unit</code>: one of {UNITS.map((u) => `"${u}"`).join(", ")}.</li>
        </ul>
        {showSchema && <JsonView className="mt-2" value={PRODUCT_SCHEMA} maxHeight={280} />}
      </div>

      {allFixed && (
        <div className="rounded-xl border border-ok/50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-ok"><CheckCircle2 className="h-4 w-4" aria-hidden /> Challenge complete: every output now parses and matches the schema.</div>
          <p className="mt-1 text-ink-2">In a real app you do not fix these by hand. Your code validates each reply, and when one fails it retries with the error message, or sends the case to a person.</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import type { Question } from "@/content/schema";
import { Button, cx } from "@/components/ui/primitives";
import { Markup } from "./Markup";
import { CodeBlock } from "./CodeBlock";

type Status = { correct: boolean; firstTry: boolean } | null;

const FLAVOUR: Record<string, string> = {
  recall: "Check", predict: "Predict", debug: "Debug", design: "Design decision", analogy: "Analogy",
};

/**
 * Quiz engine. Learners can retry, but mastery is measured on FIRST attempts.
 * Hints are offered before answers are revealed.
 */
export function Quiz({ questions, onFinish }: {
  questions: Question[];
  onFinish: (r: { firstTry: number; total: number; passed: boolean }) => void;
}) {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const gradable = questions.filter((q) => q.type !== "short");
  const done = questions.every((q) => status[q.id]?.correct);

  function report(id: string, correct: boolean) {
    setStatus((prev) => {
      const before = prev[id];
      const next = { ...prev, [id]: { correct, firstTry: before ? before.firstTry : correct } };
      if (questions.every((q) => next[q.id]?.correct)) {
        const firstTry = gradable.filter((q) => next[q.id]?.firstTry).length;
        const total = gradable.length;
        // Passing = everything eventually correct. First-try score is kept for spaced review.
        setTimeout(() => onFinish({ firstTry, total, passed: true }), 0);
      }
      return next;
    });
  }

  const firstTry = gradable.filter((q) => status[q.id]?.firstTry).length;

  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-xl border border-line p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
            Question {i + 1} of {questions.length}
            {"flavour" in q && q.flavour && <span className="rounded bg-sunken px-1.5 py-0.5 normal-case tracking-normal">{FLAVOUR[q.flavour]}</span>}
            {status[q.id]?.correct && <CheckCircle2 className="h-4 w-4 text-ok" aria-label="answered correctly" />}
          </div>
          {q.type === "mcq" || q.type === "multi" ? (
            <ChoiceQuestion q={q} onResult={(c) => report(q.id, c)} />
          ) : q.type === "order" ? (
            <OrderQuestion q={q} onResult={(c) => report(q.id, c)} />
          ) : (
            <ShortQuestion q={q} onResult={() => report(q.id, true)} />
          )}
        </div>
      ))}
      {done && (
        <div className="rounded-xl bg-[color-mix(in_srgb,var(--c-ok)_10%,transparent)] p-4 text-sm" role="status">
          <strong>Knowledge check complete.</strong> First-try score: {firstTry}/{gradable.length}.{" "}
          {gradable.length > 0 && firstTry / gradable.length < 0.8
            ? "This lesson will appear in your review list so you can strengthen it later."
            : "Strong work — this lesson will come back for spaced review in a few days."}
        </div>
      )}
    </div>
  );
}

function ChoiceQuestion({ q, onResult }: { q: Extract<Question, { type: "mcq" | "multi" }>; onResult: (correct: boolean) => void }) {
  const multi = q.type === "multi";
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [locked, setLocked] = useState(false);
  const correctSet = multi ? q.answers : [q.answer];
  const isCorrect = checked && picked.length === correctSet.length && correctSet.every((a) => picked.includes(a));

  function toggle(i: number) {
    if (locked) return;
    setChecked(false);
    setPicked((p) => (multi ? (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]) : [i]));
  }

  function check() {
    const ok = picked.length === correctSet.length && correctSet.every((a) => picked.includes(a));
    setChecked(true);
    onResult(ok);
    if (ok) setLocked(true);
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-[16px] font-medium leading-snug"><Markup text={q.prompt} /></legend>
      {"code" in q && q.code && <div className="mb-3"><CodeBlock code={q.code} lang="js" /></div>}
      {multi && <p className="-mt-1 mb-2 text-xs text-ink-3">Select all that apply.</p>}
      <div className="space-y-2">
        {q.options.map((o, i) => {
          const sel = picked.includes(i);
          const showWhy = checked && (sel || (isCorrect && correctSet.includes(i)));
          const right = correctSet.includes(i);
          return (
            <div key={i}>
              <button
                type="button"
                role={multi ? "checkbox" : "radio"}
                aria-checked={sel}
                onClick={() => toggle(i)}
                className={cx(
                  "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-[15px] transition-colors",
                  !checked && sel && "border-accent bg-accent-soft/50",
                  !checked && !sel && "border-line hover:bg-sunken",
                  checked && sel && right && "border-ok bg-[color-mix(in_srgb,var(--c-ok)_10%,transparent)]",
                  checked && sel && !right && "border-safety bg-[color-mix(in_srgb,var(--c-safety)_8%,transparent)]",
                  checked && !sel && "border-line opacity-80",
                )}
              >
                <span className={cx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[11px] font-bold", multi ? "rounded" : "rounded-full", sel ? "border-accent bg-accent text-accent-ink" : "border-line-strong")}>
                  {sel ? "✓" : String.fromCharCode(65 + i)}
                </span>
                <span><Markup text={o.text} /></span>
              </button>
              {showWhy && (
                <p className={cx("ml-8 mt-1 text-sm", right ? "text-ok" : "text-safety")}>
                  {right ? "Correct: " : "Not quite: "}
                  <span className="text-ink-2"><Markup text={o.why} /></span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!locked && <Button variant="primary" size="sm" onClick={check} disabled={picked.length === 0}>Check answer</Button>}
        {!locked && !hint && <Button variant="ghost" size="sm" onClick={() => setHint(true)}><Lightbulb className="h-4 w-4" /> Hint</Button>}
        {checked && !isCorrect && <span className="text-sm text-ink-2">Read the explanation, then try again.</span>}
      </div>
      {hint && !locked && <p className="mt-2 rounded-lg bg-sunken p-2.5 text-sm text-ink-2"><Lightbulb className="mr-1 inline h-4 w-4 text-warn" /><Markup text={q.hint} /></p>}
    </fieldset>
  );
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Never start already solved.
  if (a.every((x, i) => x === arr[i]) && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

function OrderQuestion({ q, onResult }: { q: Extract<Question, { type: "order" }>; onResult: (c: boolean) => void }) {
  const initial = useMemo(() => shuffle(q.items, q.id.length * 7 + q.items.length), [q]);
  const [order, setOrder] = useState(initial);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [hint, setHint] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || checked) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    setChecked(null);
  }

  return (
    <div>
      <p className="mb-1 text-[16px] font-medium"><Markup text={q.prompt} /></p>
      <p className="mb-3 text-xs text-ink-3">Drag the items, or use the arrow buttons, to put them in order.</p>
      <ol className="space-y-1.5">
        {order.map((item, i) => (
          <li
            key={item}
            draggable={!checked}
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }}
            className={cx(
              "flex items-center gap-2 rounded-lg border bg-raised px-3 py-2 text-[15px]",
              checked === true && "border-ok",
              checked === false && (q.items[i] === item ? "border-ok" : "border-safety"),
              checked === null && "border-line cursor-grab",
            )}
          >
            <span className="w-5 text-center font-mono text-xs text-ink-3">{i + 1}</span>
            <span className="flex-1"><Markup text={item} /></span>
            {checked !== true && (
              <span className="flex gap-0.5">
                <button className="rounded p-1 hover:bg-sunken disabled:opacity-30" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move "${item}" up`}><ArrowUp className="h-4 w-4" /></button>
                <button className="rounded p-1 hover:bg-sunken disabled:opacity-30" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label={`Move "${item}" down`}><ArrowDown className="h-4 w-4" /></button>
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {checked !== true && (
          <Button variant="primary" size="sm" onClick={() => {
            const ok = order.every((x, i) => x === q.items[i]);
            setChecked(ok);
            onResult(ok);
          }}>Check order</Button>
        )}
        {checked === false && <Button size="sm" variant="ghost" onClick={() => setChecked(null)}><RotateCcw className="h-4 w-4" /> Keep trying</Button>}
        {checked !== true && !hint && <Button variant="ghost" size="sm" onClick={() => setHint(true)}><Lightbulb className="h-4 w-4" /> Hint</Button>}
      </div>
      {checked === false && <p className="mt-2 text-sm text-safety"><XCircle className="mr-1 inline h-4 w-4" />Items with a red border are in the wrong place.</p>}
      {hint && checked !== true && <p className="mt-2 rounded-lg bg-sunken p-2.5 text-sm text-ink-2"><Markup text={q.hint} /></p>}
      {checked === true && <p className="mt-2 text-sm text-ink-2"><span className="font-medium text-ok">Correct. </span><Markup text={q.explanation} /></p>}
    </div>
  );
}

function ShortQuestion({ q, onResult }: { q: Extract<Question, { type: "short" }>; onResult: () => void }) {
  const [text, setText] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(q.checklist.map(() => false));
  return (
    <div>
      <label className="mb-2 block text-[16px] font-medium" htmlFor={`short-${q.id}`}><Markup text={q.prompt} /></label>
      <textarea
        id={`short-${q.id}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-line-strong bg-bg p-3 text-[15px]"
        placeholder="Write your answer in your own words…"
      />
      {!revealed ? (
        <Button className="mt-2" size="sm" variant="primary" disabled={text.trim().split(/\s+/).length < 5} onClick={() => setRevealed(true)}>
          Compare with a model answer
        </Button>
      ) : (
        <div className="mt-3 space-y-2 rounded-lg bg-sunken p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Self-assessed — compare honestly</p>
          <p className="text-ink-2"><Markup text={q.modelAnswer} /></p>
          <p className="pt-1 font-medium">Did your answer include…</p>
          {q.checklist.map((c, i) => (
            <label key={i} className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={ticks[i]} onChange={(e) => setTicks((t) => t.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span><Markup text={c} /></span>
            </label>
          ))}
          <Button size="sm" onClick={onResult}>I&apos;ve compared my answer</Button>
        </div>
      )}
    </div>
  );
}

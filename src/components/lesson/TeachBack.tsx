"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { RubricItem } from "@/content/schema";
import { Button, cx } from "@/components/ui/primitives";
import { Markup } from "./Markup";

export function checkRubric(text: string, rubric: RubricItem[]) {
  const t = text.toLowerCase();
  return rubric.map((r) => ({ ...r, hit: r.keywords.some((k) => t.includes(k.toLowerCase())) }));
}

/**
 * Teach it back: the learner explains the idea in plain English.
 * Feedback is an automated KEYWORD check plus self-assessment — it is
 * honest about not being a real grade of understanding.
 */
export function TeachBack({ prompt, rubric, exemplar, saved, onSubmit }: {
  prompt: string;
  rubric: RubricItem[];
  exemplar: string;
  saved?: string;
  onSubmit: (text: string, selfRating: number) => void;
}) {
  const [text, setText] = useState(saved ?? "");
  const [checked, setChecked] = useState(Boolean(saved));
  const [rating, setRating] = useState<number | null>(saved ? 2 : null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const results = checkRubric(text, rubric);
  const covered = results.filter((r) => r.hit).length;

  return (
    <div className="space-y-3">
      <p className="text-[16px] font-medium"><Markup text={prompt} /></p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setChecked(false); }}
        rows={5}
        aria-label="Your explanation"
        className="w-full rounded-xl border border-line-strong bg-bg p-3 text-[15px] leading-relaxed"
        placeholder="Imagine explaining this to a friend at the taxi park who has never heard of it…"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm" disabled={words < 20} onClick={() => setChecked(true)}>Get feedback</Button>
        <span className="text-xs text-ink-3">{words < 20 ? `Write at least 20 words (${words} so far)` : `${words} words`}</span>
      </div>

      {checked && (
        <div className="space-y-3 rounded-xl border border-line bg-sunken/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Automatic keyword check — this looks for key ideas, it cannot judge understanding
          </p>
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.concept} className="flex gap-2 text-sm">
                {r.hit ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />}
                <span>
                  <span className={cx("font-medium", r.hit ? "text-ink" : "text-ink-2")}>{r.concept}</span>
                  {!r.hit && <span className="block text-ink-3"><Markup text={r.hint} /></span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-2">
            You touched on {covered} of {rubric.length} key ideas. {covered < rubric.length ? "Consider adding the missing ones — then compare with the example below." : "Now compare with an example explanation."}
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Show an example explanation</summary>
            <p className="mt-2 rounded-lg bg-raised p-3 leading-relaxed text-ink-2"><Markup text={exemplar} /></p>
          </details>
          <div>
            <p className="mb-1.5 text-sm font-medium">How well could you explain this to someone else? (self-assessment)</p>
            <div className="flex flex-wrap gap-2">
              {["Not yet", "Mostly", "Confidently"].map((label, i) => (
                <Button key={label} size="sm" variant={rating === i + 1 ? "primary" : "secondary"} onClick={() => { setRating(i + 1); onSubmit(text, i + 1); }}>
                  {label}
                </Button>
              ))}
            </div>
            {rating && <p className="mt-2 text-xs text-ok">Saved in this browser.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

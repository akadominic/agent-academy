"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, EyeOff, RotateCcw, Send } from "lucide-react";
import { Button, Segmented, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  ACKS, CONVERSATION, QUESTIONS, SYSTEM_PROMPT, answerFrom, classifyQuestion, fitToWindow, memoryNote, messageTokens, type Answer, type Msg,
} from "./contextWindow";
import { ATTENTION_EXAMPLES, weightsFor } from "./attention";

/* ------------------------------------------------------------------ */
/*  Attention explorer (illustrative weights)                           */
/* ------------------------------------------------------------------ */

function AttentionExplorer() {
  const [exId, setExId] = useState(ATTENTION_EXAMPLES[0].id);
  const ex = ATTENTION_EXAMPLES.find((e) => e.id === exId)!;
  const focusIdx = Object.keys(ex.focus).map(Number);
  const [focus, setFocus] = useState<number>(focusIdx[0]);
  const f = ex.focus[focus] ? focus : focusIdx[0];
  const w = weightsFor(ex, f);
  const top = w.map((v, i) => ({ v, i })).filter((x) => x.i !== f).sort((a, b) => b.v - a.v).slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Hand-written weights" />
        <span className="text-xs text-ink-3">Real attention weights are computed from learned numbers, across many heads and layers. These were written by hand to show the idea.</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example sentences">
        {ATTENTION_EXAMPLES.map((e) => (
          <button key={e.id} aria-pressed={e.id === exId} onClick={() => { setExId(e.id); setFocus(Number(Object.keys(e.focus)[0])); }}
            className={cx("rounded-full border px-3 py-1 text-sm", e.id === exId ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-sunken")}>
            {e.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-2">Choose a <span className="underline decoration-dotted decoration-2 underline-offset-4">underlined</span> word. The shading shows how much it draws on each earlier word.</p>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-bg/60 p-3" role="group" aria-label="Sentence with attention weights">
        {ex.words.map((word, i) => {
          const isFocusable = i in ex.focus;
          const after = i > f;
          const weight = w[i];
          const body = (
            <>
              <span>{word}</span>
              <span className="block text-[10px] font-normal text-ink-3">{after ? "hidden" : `${Math.round(weight * 100)}%`}</span>
            </>
          );
          const style = after ? undefined : { background: `color-mix(in srgb, var(--c-model) ${Math.round(weight * 85)}%, transparent)` };
          return isFocusable ? (
            <button key={i} onClick={() => setFocus(i)} aria-pressed={i === f}
              aria-label={`${word}${i === f ? " (selected)" : ""}`}
              className={cx("rounded-lg border px-2 py-1 text-center font-mono text-sm font-semibold underline decoration-dotted decoration-2 underline-offset-4", i === f ? "border-model ring-2 ring-model" : "border-line")}
              style={style}>{body}</button>
          ) : (
            <span key={i} className={cx("rounded-lg border border-line px-2 py-1 text-center font-mono text-sm", after && "border-dashed opacity-40")} style={style}>{body}</span>
          );
        })}
      </div>
      <p className="text-sm" aria-live="polite">
        While processing <b className="font-mono text-model">{ex.words[f]}</b>, the strongest links are to{" "}
        {top.map((t, k) => <span key={t.i}>{k ? " and " : ""}<b className="font-mono">{ex.words[t.i]}</b> ({Math.round(t.v * 100)}%)</span>)}. {ex.note}
      </p>
      <p className="text-xs text-ink-3">Words after the selected one are marked “hidden”: in GPT-style language models, each token can only look at itself and the tokens before it.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Context window                                                      */
/* ------------------------------------------------------------------ */

interface Turn { asked: string; answer: Answer; windowSize: number; withNote: boolean; overflow: boolean }

function WindowLab({ onComplete }: { onComplete?: (s?: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>(CONVERSATION);
  const [budget, setBudget] = useState(450);
  const [pinNote, setPinNote] = useState(false);
  const [draft, setDraft] = useState("");
  const [turn, setTurn] = useState<Turn | null>(null);
  const [failed, setFailed] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [done, setDone] = useState(false);

  const note = pinNote ? memoryNote(msgs) : null;
  const pinned = [SYSTEM_PROMPT, ...(note ? [note] : [])];
  const fit = useMemo(() => fitToWindow(msgs, budget, pinned), [msgs, budget, pinned.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstKept = fit.kept.indexOf(true);
  const total = msgs.reduce((s, m) => s + messageTokens(m), 0) + fit.pinnedTokens;

  useEffect(() => {
    if (failed && fixed && !done) { setDone(true); onComplete?.("Saw a fact fall out of the window, then kept it with a pinned note"); }
  }, [failed, fixed, done, onComplete]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const withQ: Msg[] = [...msgs, { role: "user", text: t }];
    const n = pinNote ? memoryNote(withQ) : null;
    const f = fitToWindow(withQ, budget, [SYSTEM_PROMPT, ...(n ? [n] : [])]);
    let answer: Answer;
    if (f.overflow) {
      answer = { text: "Error: the request is longer than the context window. Nothing was sent to the model.", found: false, source: null };
    } else if (classifyQuestion(t)) {
      const visible = withQ.map((msg, index) => ({ index, msg })).filter((v) => f.kept[v.index]);
      answer = answerFrom(t, visible, n);
    } else {
      answer = { text: ACKS[withQ.length % ACKS.length], found: true, source: null };
    }
    setMsgs([...withQ, { role: "assistant", text: answer.text }]);
    setTurn({ asked: t, answer, windowSize: budget, withNote: !!n, overflow: f.overflow });
    setDraft("");
    const q = classifyQuestion(t);
    if (q === "name" || q === "market") {
      if (!answer.found && !n && !f.overflow) setFailed(true);
      if (answer.found && answer.source === "note") setFixed(true);
    }
  };

  const reset = () => { setMsgs(CONVERSATION); setTurn(null); };
  const pct = (x: number) => `${Math.min(100, (x / budget) * 100)}%`;
  const keptTokens = fit.used - fit.pinnedTokens;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Simulated assistant" />
        <span className="text-xs text-ink-3">The “assistant” is a few lines of code that can only find facts in the text it is sent. Token counts use the course&apos;s illustrative tokenizer.</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="flex items-baseline justify-between text-sm font-medium">Context window <span className="font-mono text-model">{budget} tokens</span></span>
          <input type="range" min={40} max={450} step={5} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-[var(--c-model)]" aria-valuetext={`${budget} tokens`} />
          <span className="flex justify-between text-[11px] text-ink-3"><span>40</span><span>whole conversation: {total} tokens</span></span>
        </label>
        <Toggle checked={pinNote} onChange={setPinNote} label="Pin a memory note to every request"
          description="App code copies key facts (name, market) into a short note sent at the top of every request. It costs tokens too." />
      </div>

      <div>
        <div className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-ink-3">
          <span>Window used: {fit.used} of {budget} tokens</span>
          <span>{fit.kept.filter(Boolean).length} of {msgs.length} messages fit</span>
        </div>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-sunken" role="img"
          aria-label={`Pinned text ${fit.pinnedTokens} tokens, messages ${keptTokens} tokens, free ${budget - fit.used} tokens`}>
          <span className="h-full bg-control" style={{ width: pct(fit.pinnedTokens) }} />
          <span className="h-full bg-model" style={{ width: pct(keptTokens) }} />
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-ink-3">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-control" /> pinned (system prompt{note ? " + note" : ""})</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-model" /> recent messages</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-sunken ring-1 ring-line" /> free</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-line">
          <div className="border-b border-line px-3 py-2 text-sm font-semibold">The whole conversation (stored by the app)</div>
          <ol className="max-h-[420px] space-y-1.5 overflow-y-auto p-3" tabIndex={0} aria-label="Conversation">
            {msgs.map((m, i) => {
              const out = !fit.kept[i];
              const isSource = turn?.answer.source === "message" && turn.answer.messageIndex === i;
              return (
                <li key={i}>
                  {i === firstKept && firstKept > 0 && (
                    <div className="my-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-safety">
                      <span className="h-px flex-1 bg-safety/50" /> window starts here: everything above is not sent <span className="h-px flex-1 bg-safety/50" />
                    </div>
                  )}
                  <div className={cx("rounded-lg border px-3 py-1.5 text-sm", out ? "border-dashed border-line opacity-55" : m.role === "user" ? "border-people/40" : "border-model/40", isSource && "ring-2 ring-ok")}>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-ink-3">
                      <span className={cx("font-semibold uppercase tracking-wider", m.role === "user" ? "text-people" : "text-model")}>{m.role === "user" ? "Customer" : "Assistant"}</span>
                      <span className="inline-flex items-center gap-1">{out && <><EyeOff className="h-3 w-3" /> not sent ·</>} {messageTokens(m)} tok</span>
                    </div>
                    <div className={out ? "text-ink-3 line-through decoration-ink-3/40" : "text-ink"}>{m.text}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-model/40">
            <div className="border-b border-line px-3 py-2 text-sm font-semibold text-model">What the model would receive now</div>
            <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap p-3 font-mono text-[12px] leading-relaxed text-ink-2" tabIndex={0}>
              {[`[system] ${SYSTEM_PROMPT}`, ...(note ? [`[system] ${note}`] : []), ...msgs.map((m, i) => (fit.kept[i] ? `[${m.role}] ${m.text}` : null)).filter(Boolean)].join("\n")}
            </pre>
            <p className="border-t border-line px-3 py-1.5 text-[11px] text-ink-3">This is all it would get with the next request. It has no other memory of the conversation.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Ask the assistant</div>
        <div className="flex flex-wrap gap-1.5">
          {QUESTIONS.map((q) => <Button key={q.id} size="sm" onClick={() => send(q.text)}>{q.text}</Button>)}
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <label className="min-w-[12rem] flex-1">
            <span className="sr-only">Type a message</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Or type a message, e.g. My name is Opio."
              className="h-10 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm text-ink" />
          </label>
          <Button type="submit" variant="primary" disabled={!draft.trim()}><Send className="h-4 w-4" /> Send</Button>
          <Button type="button" variant="ghost" onClick={reset} aria-label="Reset conversation"><RotateCcw className="h-4 w-4" /></Button>
        </form>
      </div>

      {turn && (
        <div className={cx("rounded-xl border p-3 text-sm", turn.overflow ? "border-safety/50" : turn.answer.found ? "border-ok/50" : "border-warn/50")} aria-live="polite">
          <div className="text-xs text-ink-3">You asked “{turn.asked}” with a {turn.windowSize}-token window{turn.withNote ? " and a pinned note" : ""}.</div>
          <div className="mt-1 font-medium">{turn.answer.text}</div>
          <div className="mt-1 text-xs text-ink-2">
            {turn.overflow ? "Real APIs also reject requests that are too long, or the app must cut something out first."
              : turn.answer.source === "message" ? `Found in message ${(turn.answer.messageIndex ?? 0) + 1}, which was inside the window (outlined in green).`
              : turn.answer.source === "note" ? "Found in the pinned note: the original message is outside the window, but the note kept the fact."
              : classifyQuestion(turn.asked) ? "The fact was not in anything sent to the model. A real model might say it does not know, or it might invent an answer. That is the next lesson." : ""}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-accent/40 p-3 text-sm">
        <div className="mb-1 font-semibold">Challenge</div>
        <ol className="list-decimal space-y-1 pl-5 text-ink-2">
          <li>Shrink the window until <b>“What is my name?”</b> (or the market question) can no longer be answered.</li>
          <li>Keep the window small, turn on <b>Pin a memory note</b>, and ask again.</li>
        </ol>
        <ul className="mt-2 flex flex-wrap gap-3">
          <li className="inline-flex items-center gap-1">{failed ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} The fact fell out of the window</li>
          <li className="inline-flex items-center gap-1">{fixed ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} The pinned note brought it back</li>
        </ul>
      </div>
    </div>
  );
}

export default function ContextWindow({ onComplete, scenario }: LabProps & { scenario?: string }) {
  const [tab, setTab] = useState<"attention" | "window">(scenario === "attention" ? "attention" : "window");
  return (
    <div className="space-y-4">
      <Segmented label="View" value={tab} onChange={setTab}
        options={[{ value: "attention", label: "Attention (inside the model)" }, { value: "window", label: "Context window" }]} />
      {tab === "attention" ? <AttentionExplorer /> : <WindowLab onComplete={onComplete} />}
    </div>
  );
}

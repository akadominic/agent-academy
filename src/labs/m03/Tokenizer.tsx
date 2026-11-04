"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Button, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  PREDICTION_PAIRS, REQUIRED_WORDS, SAMPLES, VOCAB_SIZE, WORDY_PROMPT, checkRewrite, countTokens, countWords, morePair, showToken, tokenize,
  type Token, type TokenKind,
} from "./tokenizer";

const KIND: Record<TokenKind, { label: string; color: string }> = {
  word: { label: "whole word", color: "var(--c-ok)" },
  piece: { label: "word piece", color: "var(--c-model)" },
  char: { label: "single letter", color: "var(--c-warn)" },
  byte: { label: "raw byte", color: "var(--c-safety)" },
  number: { label: "digits", color: "var(--c-data)" },
  punct: { label: "punctuation", color: "var(--c-control)" },
  space: { label: "space", color: "var(--c-control)" },
};

export function TokenChips({ tokens, showIds = false, label }: { tokens: Token[]; showIds?: boolean; label: string }) {
  return (
    <div className="flex flex-wrap gap-1" role="list" aria-label={label}>
      {tokens.map((t, i) => (
        <span
          key={i}
          role="listitem"
          title={`${KIND[t.kind].label} · id ${t.id}`}
          className="inline-flex flex-col items-center rounded-md border px-1.5 py-0.5 font-mono text-[13px] leading-tight text-ink"
          style={{
            borderColor: `color-mix(in srgb, ${KIND[t.kind].color} 55%, transparent)`,
            background: `color-mix(in srgb, ${KIND[t.kind].color} ${i % 2 ? 22 : 11}%, transparent)`,
          }}
        >
          <span className="whitespace-pre">{showToken(t)}</span>
          {showIds && <span className="text-[10px] text-ink-3">{t.id}</span>}
        </span>
      ))}
    </div>
  );
}

export default function Tokenizer({ onComplete, scenario }: LabProps & { scenario?: string }) {
  const [text, setText] = useState(() => SAMPLES.find((s) => s.id === (scenario === "luganda" ? "lg" : "en"))!.text);
  const [showIds, setShowIds] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, "a" | "b">>({});
  const [rewrite, setRewrite] = useState(WORDY_PROMPT);
  const [done, setDone] = useState(false);

  const tokens = useMemo(() => tokenize(text), [text]);
  const words = countWords(text);
  const wordyCount = countTokens(WORDY_PROMPT);
  const target = 12;
  const check = useMemo(() => checkRewrite(rewrite, target), [rewrite]);
  const predicted = Object.keys(guesses).length;
  const needPredictions = 3;
  const challengeMet = predicted >= needPredictions && check.ok;

  useEffect(() => {
    if (challengeMet && !done) {
      setDone(true);
      onComplete?.(`Made ${predicted} predictions and cut the prompt to ${check.tokens} tokens`);
    }
  }, [challengeMet, done, onComplete, predicted, check.tokens]);

  const compare = SAMPLES.filter((s) => s.id !== "emoji").map((s) => ({ ...s, tokens: countTokens(s.text), words: countWords(s.text) }));
  const maxTpw = Math.max(...compare.map((c) => (c.words ? c.tokens / c.words : 0)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Illustrative tokenizer" />
        <span className="text-xs text-ink-3">Hand-written vocabulary of {VOCAB_SIZE.toLocaleString()} pieces. Not any real model&apos;s tokenizer.</span>
      </div>

      {/* 1. Type and see */}
      <section aria-labelledby="tk-try" className="space-y-3">
        <h3 id="tk-try" className="font-semibold">1. Type anything and watch it split</h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example texts">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setText(s.text)}
              aria-pressed={text === s.text}
              className={cx("rounded-full border px-3 py-1 text-sm", text === s.text ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-sunken")}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="sr-only">Text to tokenize</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line-strong bg-bg p-3 font-mono text-sm text-ink focus:outline-2 focus:outline-[var(--focus)]"
          />
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-live="polite">
          <span><b className="text-model">{tokens.length}</b> tokens</span>
          <span><b>{text.length}</b> characters</span>
          <span><b>{words}</b> words</span>
          <span><b>{words ? (tokens.length / words).toFixed(2) : "—"}</b> tokens per word</span>
        </div>
        <div className="rounded-xl border border-line bg-bg/60 p-3">
          {tokens.length ? <TokenChips tokens={tokens} showIds={showIds} label="Tokens" /> : <span className="text-sm text-ink-3">Type something above.</span>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3" aria-label="Colour key">
            {(Object.keys(KIND) as TokenKind[]).filter((k) => k !== "space").map((k) => (
              <li key={k} className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm border" style={{ background: `color-mix(in srgb, ${KIND[k].color} 22%, transparent)`, borderColor: KIND[k].color }} />
                {KIND[k].label}
              </li>
            ))}
            <li>· = space</li>
          </ul>
          <Toggle checked={showIds} onChange={setShowIds} label="Show token ids" />
        </div>
        <p className="text-xs text-ink-3">The model never sees letters. It receives the list of id numbers, one per token. Hover a token (or turn on ids) to see its number.</p>
      </section>

      {/* 2. Compare */}
      <section aria-labelledby="tk-compare" className="space-y-2">
        <h3 id="tk-compare" className="font-semibold">2. Compare: tokens per word</h3>
        <div className="space-y-1.5">
          {compare.map((c) => {
            const tpw = c.words ? c.tokens / c.words : 0;
            return (
              <div key={c.id} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 text-sm">
                <span className="truncate">{c.label}</span>
                <span className="h-3 overflow-hidden rounded-full bg-sunken" aria-hidden>
                  <span className="block h-full rounded-full bg-model" style={{ width: `${(tpw / maxTpw) * 100}%` }} />
                </span>
                <span className="w-28 text-right font-mono text-xs text-ink-2">{tpw.toFixed(2)} /word · {c.tokens}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-ink-3">
          In this illustration, Luganda and Runyankore need far more tokens per word than English. Many real tokenizers show the same tendency, because they were built mostly from English text,
          but the exact numbers differ from model to model. Check a real tokenizer before you rely on a number.
        </p>
      </section>

      {/* 3. Challenge */}
      <section aria-labelledby="tk-challenge" className="space-y-4 rounded-xl border border-accent/40 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="tk-challenge" className="font-semibold">3. Challenge</h3>
          <ul className="flex flex-wrap gap-3 text-sm">
            <li className="inline-flex items-center gap-1">{predicted >= needPredictions ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} {Math.min(predicted, needPredictions)}/{needPredictions} predictions</li>
            <li className="inline-flex items-center gap-1">{check.ok ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} Shorter prompt</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm"><b>a) Predict first.</b> For each pair, which one uses <b>more</b> tokens? Then look at the split.</p>
          {PREDICTION_PAIRS.map((p) => {
            const g = guesses[p.id];
            const answer = morePair(p.a, p.b);
            return (
              <div key={p.id} className="rounded-lg border border-line p-2.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["a", "b"] as const).map((side) => (
                    <Button
                      key={side}
                      size="sm"
                      variant={g === side ? "primary" : "secondary"}
                      disabled={!!g}
                      onClick={() => setGuesses((s) => ({ ...s, [p.id]: side }))}
                      className="h-auto min-h-8 justify-start whitespace-normal py-1.5 text-left font-mono"
                      aria-label={`${side === "a" ? p.a : p.b} uses more tokens`}
                    >
                      {side === "a" ? p.a : p.b}
                    </Button>
                  ))}
                </div>
                {g && (
                  <div className="mt-2 space-y-1.5 text-sm" aria-live="polite">
                    <p className={g === answer ? "text-ok" : "text-safety"}>
                      {g === answer ? "Correct." : "Not this time."} {countTokens(p.a)} tokens vs {countTokens(p.b)} tokens.
                    </p>
                    <TokenChips tokens={tokenize(p.a)} label="First text tokens" />
                    <TokenChips tokens={tokenize(p.b)} label="Second text tokens" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-sm">
            <b>b) Save tokens.</b> This customer message uses <b>{wordyCount}</b> tokens. Rewrite it in <b>{target} tokens or fewer</b> while keeping the meaning.
            It must still contain the words {REQUIRED_WORDS.map((w, i) => <span key={w}>{i ? ", " : ""}<code className="font-mono">{w}</code></span>)}.
          </p>
          <label className="block">
            <span className="sr-only">Your shorter prompt</span>
            <textarea
              value={rewrite}
              onChange={(e) => setRewrite(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line-strong bg-bg p-3 font-mono text-sm text-ink focus:outline-2 focus:outline-[var(--focus)]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
            <span className={cx("font-semibold", check.tokens <= target ? "text-ok" : "text-warn")}>{check.tokens} / {target} tokens</span>
            {check.missing.length > 0 && <span className="text-safety">Missing: {check.missing.join(", ")}</span>}
            {check.ok && <span className="text-ok">Meaning kept, and {Math.round((1 - check.tokens / wordyCount) * 100)}% fewer tokens.</span>}
            <Button size="sm" variant="ghost" onClick={() => setRewrite(WORDY_PROMPT)}>Reset text</Button>
          </div>
          <TokenChips tokens={tokenize(rewrite)} label="Tokens in your rewrite" />
          <p className="text-xs text-ink-3">The &ldquo;meaning&rdquo; check here only looks for three keywords. A real reviewer would read it.</p>
        </div>
        {done && <p className="flex items-center gap-1.5 text-sm font-medium text-ok"><CheckCircle2 className="h-4 w-4" /> Challenge complete. Fewer tokens means a cheaper, faster request, and more room left in the context window.</p>}
      </section>
    </div>
  );
}

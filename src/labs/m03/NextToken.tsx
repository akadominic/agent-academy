"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Dices, FastForward, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button, Segmented, SimBadge, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  CORPUS, END, MAX_WORDS, START, STARTERS, applyTemperature, buildModel, distribution, generate, makeRng, step, wordsOf, type Counts,
} from "./ngram";

type Model = { bi: Counts; tri?: Counts };

/* ------------------------------------------------------------------ */
/*  Probability bars                                                    */
/* ------------------------------------------------------------------ */

function Bars({ history, model, order, temperature, highlight }: { history: string[]; model: Model; order: 2 | 3; temperature: number; highlight?: string }) {
  const { choices, usedOrder } = distribution([START, ...history], model, order);
  const pT = applyTemperature(choices.map((c) => c.p), temperature);
  const rows = choices.map((c, i) => ({ ...c, pT: pT[i] })).slice(0, 8);
  const rest = choices.length - rows.length;
  const restP = pT.slice(8).reduce((a, b) => a + b, 0);
  const ctx = history.slice(-(usedOrder - 1)).join(" ") || "(start of sentence)";
  if (choices.length === 0) return <p className="text-sm text-ink-3">The model never saw anything follow “{ctx}”, so it has no prediction.</p>;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-ink-3">
        Looking at: <b className="font-mono text-ink">{ctx}</b>
        {order === 3 && usedOrder === 2 && " (two-word context never seen, so it falls back to the last word)"}
      </p>
      <ul className="space-y-1" aria-label="Probability of each possible next word">
        {rows.map((r) => (
          <li key={r.token} className="grid grid-cols-[5.5rem_1fr_3.2rem] items-center gap-2 text-sm">
            <span className={cx("truncate font-mono", r.token === highlight && "font-bold text-model")}>{r.token === END ? ". (end)" : r.token}</span>
            <span className="relative h-4 rounded bg-sunken" aria-hidden>
              <span className="absolute inset-y-0 left-0 rounded border border-dashed border-ink-3/60" style={{ width: `${r.p * 100}%` }} />
              <span className={cx("absolute inset-y-0 left-0 rounded transition-[width] duration-300", r.token === highlight ? "bg-model" : "bg-[color-mix(in_srgb,var(--c-model)_55%,transparent)]")} style={{ width: `${r.pT * 100}%` }} />
            </span>
            <span className="text-right font-mono text-xs" aria-label={`${r.token}: ${(r.pT * 100).toFixed(1)} percent`}>{(r.pT * 100).toFixed(r.pT < 0.1 ? 1 : 0)}%</span>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="text-xs text-ink-3">+ {rest} more words sharing {(restP * 100).toFixed(1)}%</p>}
      <p className="text-xs text-ink-3">Filled bar = probability after temperature. Dashed outline = the original probability from the counts.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The generator: Step / Play / Reset, temperature, seed               */
/* ------------------------------------------------------------------ */

function Generator({ model, onSentence, onBatch, allowOrder = true }: {
  model: Model;
  onSentence?: () => void;
  onBatch?: (distinct: number, temperature: number) => void;
  allowOrder?: boolean;
}) {
  const [starter, setStarter] = useState(0);
  const [order, setOrder] = useState<2 | 3>(2);
  const [temperature, setTemperature] = useState(1);
  const [seed, setSeed] = useState(7);
  const [words, setWords] = useState<string[]>(STARTERS[0].words);
  const [last, setLast] = useState<{ r: number; token: string; p: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [batch, setBatch] = useState<{ temp: number; lines: string[] } | null>(null);
  const rng = useRef(makeRng(seed));
  const prompt = STARTERS[starter].words;
  const finished = words[words.length - 1] === END || words.length >= prompt.length + MAX_WORDS;

  const reset = useCallback((s = seed, st = starter) => {
    rng.current = makeRng(s);
    setWords(STARTERS[st].words);
    setLast(null);
    setPlaying(false);
  }, [seed, starter]);

  const doStep = useCallback(() => {
    if (finished) return;
    const r = rng.current();
    const res = step([START, ...words], model, order, temperature, () => r);
    if (res.picked < 0) { setPlaying(false); return; }
    const pick = res.choices[res.picked];
    setLast({ r, token: pick.token, p: pick.pT });
    const next = [...words, pick.token];
    setWords(next);
    if (pick.token === END) onSentence?.();
  }, [finished, words, model, order, temperature, onSentence]);

  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const t = setTimeout(doStep, 650);
    return () => clearTimeout(t);
  }, [playing, finished, doStep]);

  const runBatch = () => {
    const lines = [0, 1, 2, 3, 4].map((i) => generate(prompt, model, order, temperature, seed + i).join(" "));
    setBatch({ temp: temperature, lines });
    onBatch?.(new Set(lines).size, temperature);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-sm font-medium">Start the sentence with</div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Starting words">
            {STARTERS.map((s, i) => (
              <button key={s.label} aria-pressed={i === starter} onClick={() => { setStarter(i); reset(seed, i); setBatch(null); }}
                className={cx("rounded-full border px-2.5 py-0.5 text-sm", i === starter ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-sunken")}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {allowOrder && (
          <div className="space-y-1.5">
            <div className="text-sm font-medium">How many words it looks back at</div>
            <Segmented size="sm" label="Context length" value={String(order) as "2" | "3"}
              onChange={(v) => { setOrder(v === "3" ? 3 : 2); reset(); setBatch(null); }}
              options={[{ value: "2", label: "1 word" }, { value: "3", label: "2 words" }]} />
          </div>
        )}
        <label className="space-y-1">
          <span className="flex items-baseline justify-between text-sm font-medium">
            Temperature <span className="font-mono text-model">{temperature.toFixed(1)}</span>
          </span>
          <input type="range" min={0} max={2} step={0.1} value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            aria-valuetext={`${temperature.toFixed(1)}${temperature === 0 ? ", always the top word" : ""}`}
            className="w-full accent-[var(--c-model)]" />
          <span className="flex justify-between text-[11px] text-ink-3"><span>0 · always the top word</span><span>2 · much more random</span></span>
        </label>
        <div className="space-y-1">
          <label htmlFor="nt-seed" className="text-sm font-medium">Seed (random starting point)</label>
          <div className="flex gap-2">
            <input id="nt-seed" type="number" min={0} value={seed}
              onChange={(e) => { const s = Math.max(0, Math.floor(Number(e.target.value) || 0)); setSeed(s); reset(s); }}
              className="h-8 w-24 rounded-lg border border-line-strong bg-bg px-2 font-mono text-sm text-ink" />
            <Button size="sm" onClick={() => { const s = Math.floor(Math.random() * 1000); setSeed(s); reset(s); }}><Dices className="h-4 w-4" /> New seed</Button>
          </div>
          <span className="block text-[11px] text-ink-3">Same seed + same settings + Reset = exactly the same sentence.</span>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-bg/60 p-3" aria-live="polite">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Text so far</div>
        <p className="min-h-7 font-mono text-[15px] leading-relaxed">
          {words.length === 0 && <span className="text-ink-3">(empty — press Step)</span>}
          {words.map((w, i) => (
            <span key={i} className={cx(i < prompt.length ? "text-ink" : "text-model", i === words.length - 1 && i >= prompt.length && "rounded bg-[color-mix(in_srgb,var(--c-model)_14%,transparent)] px-0.5 font-semibold")}>{w} </span>
          ))}
        </p>
        {last && (
          <p className="mt-1 text-xs text-ink-2">
            Last step: random number <span className="font-mono">{last.r.toFixed(3)}</span> landed on <b className="font-mono text-model">{last.token}</b> (probability {(last.p * 100).toFixed(1)}%).
          </p>
        )}
        {finished && <p className="mt-1 text-xs text-ok">Finished: the model picked “.” (end of sentence){words.length >= prompt.length + MAX_WORDS ? " or reached the length limit" : ""}.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => setPlaying((p) => !p)} disabled={finished}>
          {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play</>}
        </Button>
        <Button size="sm" onClick={doStep} disabled={finished || playing}><SkipForward className="h-4 w-4" /> Step</Button>
        <Button size="sm" variant="ghost" onClick={() => reset()}><RotateCcw className="h-4 w-4" /> Reset</Button>
        {onBatch && <Button size="sm" onClick={runBatch}><FastForward className="h-4 w-4" /> Run 5 times</Button>}
      </div>

      <div className="rounded-xl border border-line p-3">
        <div className="mb-2 text-sm font-semibold">Next-word probabilities</div>
        {finished ? <p className="text-sm text-ink-3">The sentence is finished. Press Reset to start again.</p> : <Bars history={words} model={model} order={order} temperature={temperature} highlight={undefined} />}
      </div>

      {batch && (
        <div className="rounded-xl border border-line p-3" aria-live="polite">
          <div className="mb-1 text-sm font-semibold">5 runs at temperature {batch.temp.toFixed(1)} (seeds {seed}–{seed + 4})</div>
          <ol className="list-decimal space-y-0.5 pl-5 font-mono text-[13px]">{batch.lines.map((l, i) => <li key={i}>{l}</li>)}</ol>
          <p className="mt-1 text-sm">{new Set(batch.lines).size} different sentence{new Set(batch.lines).size === 1 ? "" : "s"}.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Training view (lesson m3-l1)                                        */
/* ------------------------------------------------------------------ */

const WATCH = ["the", "mama", "customer", "market", "sells"];

function Training({ onComplete }: { onComplete?: (s?: string) => void }) {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"train" | "use">("train");
  const [watch, setWatch] = useState("the");
  const [done, setDone] = useState(false);
  const model = useMemo(() => buildModel(CORPUS.slice(0, n)), [n]);
  const row = model.bi.get(watch);
  const rows = row ? [...row.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) : [];
  const maxC = Math.max(1, ...rows.map((r) => r[1]));
  const current = n > 0 ? CORPUS[n - 1] : null;

  const onSentence = useCallback(() => {
    if (n === CORPUS.length && !done) { setDone(true); onComplete?.("Trained the toy model, then used it to generate a sentence"); }
  }, [n, done, onComplete]);

  return (
    <div className="space-y-4">
      <Segmented label="Phase" value={phase} onChange={setPhase}
        options={[{ value: "train", label: "1. Training (learning)" }, { value: "use", label: "2. Inference (using)" }]} />

      {phase === "train" ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-2">Training = reading examples and adjusting the model&apos;s numbers. In this toy the numbers are simple counts of which word came next.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setN((x) => Math.min(CORPUS.length, x + 1))} disabled={n >= CORPUS.length}><SkipForward className="h-4 w-4" /> Read next sentence</Button>
            <Button size="sm" onClick={() => setN(CORPUS.length)} disabled={n >= CORPUS.length}><FastForward className="h-4 w-4" /> Read all</Button>
            <Button size="sm" variant="ghost" onClick={() => { setN(0); setDone(false); }}><RotateCcw className="h-4 w-4" /> Reset training</Button>
            <span className="text-sm text-ink-3">{n}/{CORPUS.length} sentences read</span>
          </div>
          <div className="rounded-xl border border-line bg-bg/60 p-3" aria-live="polite">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">Just read</div>
            {current ? (
              <p className="mt-1 flex flex-wrap gap-1 font-mono text-sm">
                {wordsOf(current).map((w, i, arr) => (
                  <span key={i} className={cx("rounded px-1", w === watch && i < arr.length - 1 && "bg-[color-mix(in_srgb,var(--c-data)_18%,transparent)]", i > 0 && arr[i - 1] === watch && "bg-[color-mix(in_srgb,var(--c-model)_18%,transparent)] font-semibold")}>{w}</span>
                ))}
              </p>
            ) : <p className="mt-1 text-sm text-ink-3">Nothing yet. The model starts empty: it can predict nothing.</p>}
          </div>
          <div className="rounded-xl border border-line p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">What the model has counted after</span>
              <select value={watch} onChange={(e) => setWatch(e.target.value)} aria-label="Word to watch" className="rounded-md border border-line-strong bg-bg px-2 py-1 font-mono text-sm text-ink">
                {WATCH.map((w) => <option key={w}>{w}</option>)}
              </select>
            </div>
            {rows.length === 0 ? <p className="text-sm text-ink-3">No counts yet for “{watch}”.</p> : (
              <ul className="space-y-1" aria-label={`Counts of words after ${watch}`}>
                {rows.slice(0, 10).map(([w, c]) => (
                  <li key={w} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2 text-sm">
                    <span className="truncate font-mono">{w === END ? ". (end)" : w}</span>
                    <span className="h-3 rounded bg-sunken" aria-hidden><span className="block h-full rounded bg-data transition-[width] duration-300" style={{ width: `${(c / maxC) * 100}%` }} /></span>
                    <span className="text-right font-mono text-xs">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {n >= CORPUS.length && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ok/50 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-ok" /> Training finished. The counts are now <b>frozen</b>.
              <Button size="sm" variant="primary" onClick={() => setPhase("use")}>Go to inference →</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink-2">
            Inference = using the trained model. Nothing is learned here: the counts from training stay exactly as they are.
            {n < CORPUS.length && <b className="text-warn"> The model has only read {n} of {CORPUS.length} sentences, so it knows fewer patterns. Go back and finish training to complete the challenge.</b>}
          </p>
          <Generator model={model} onSentence={onSentence} allowOrder={false} />
        </div>
      )}
      <ul className="flex flex-wrap gap-3 text-sm">
        <li className="inline-flex items-center gap-1">{n >= CORPUS.length ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} Train on every sentence</li>
        <li className="inline-flex items-center gap-1">{done ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} Generate a full sentence with the trained model</li>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function NextToken({ onComplete, scenario }: LabProps & { scenario?: string }) {
  const model = useMemo(() => buildModel(), []);
  const [sawSame, setSawSame] = useState(false);
  const [sawVaried, setSawVaried] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (sawSame && sawVaried && !done) { setDone(true); onComplete?.("Found a temperature that repeats and one that varies"); }
  }, [sawSame, sawVaried, done, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Toy model · word counts" />
        <span className="text-xs text-ink-3">Trained on {CORPUS.length} sentences about market life. Real LLMs are neural networks with billions of parameters; this toy only shows the idea: predict a distribution, pick a token, repeat.</span>
      </div>
      {scenario === "training" ? (
        <Training onComplete={onComplete} />
      ) : (
        <>
          <Generator model={model} onBatch={(distinct) => { if (distinct === 1) setSawSame(true); if (distinct >= 4) setSawVaried(true); }} />
          <div className="rounded-xl border border-accent/40 p-3 text-sm">
            <div className="mb-1 font-semibold">Challenge</div>
            <p className="text-ink-2">Use <b>Run 5 times</b> (five different seeds). Find a temperature where all five sentences are <b>identical</b>, and one where at least <b>four are different</b>.</p>
            <ul className="mt-2 flex flex-wrap gap-3">
              <li className="inline-flex items-center gap-1">{sawSame ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} 5 identical</li>
              <li className="inline-flex items-center gap-1">{sawVaried ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} 4 or more different</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

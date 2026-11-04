/**
 * A TOY next-token predictor: an n-gram COUNT model.
 *
 * Real large language models are neural networks with billions of learned
 * numbers (parameters). They do not store a table of counts. This toy only
 * shows the shape of the idea every LLM shares:
 *
 *   look at the text so far  →  produce a probability for every possible
 *   next token  →  pick one  →  add it to the text  →  repeat.
 *
 * Tokens here are whole lower-case words (real models use sub-word tokens).
 */

export const START = "<s>";
export const END = ".";

/* ------------------------------------------------------------------ */
/*  Training data: sentences about Ugandan market life                   */
/* ------------------------------------------------------------------ */

export const CORPUS: string[] = [
  "mama achen sells rice and sugar at nakawa market .",
  "mama achen sells tomatoes and onions in the morning .",
  "mama achen opens her shop early in the morning .",
  "mama achen counts the money in the evening .",
  "the boda rider carries matooke to the market .",
  "the boda rider carries sugar to the shop .",
  "the boda rider waits at the stage near the market .",
  "the customer buys rice and beans for the family .",
  "the customer asks for the price of sugar .",
  "the customer pays with mobile money .",
  "the customer pays in cash at the shop .",
  "the trader sells tomatoes at owino market .",
  "the trader buys matooke from the farmer .",
  "the farmer brings matooke to the market in the morning .",
  "the farmer brings beans and maize to the market .",
  "the market is busy in the morning .",
  "the market is quiet in the evening .",
  "the price of sugar is high this week .",
  "the price of rice is fair today .",
  "the price of tomatoes is low today .",
  "the shop sells soap and salt and cooking oil .",
  "the shop is open from seven in the morning .",
  "the taxi brings customers to the market .",
  "customers buy fresh tomatoes in the morning .",
  "customers pay with mobile money at the shop .",
  "nakato sells onions and tomatoes at owino market .",
  "nakato buys rice from mama achen .",
  "okello carries the bags of rice to the taxi .",
  "okello sells chapati near the taxi park .",
  "the children buy chapati after school .",
  "the farmer sells beans to the trader .",
  "the trader pays the farmer with mobile money .",
  "the rain makes the market quiet .",
  "the sun makes the tomatoes ripe .",
];

export function wordsOf(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/*  "Training": counting what follows what                               */
/* ------------------------------------------------------------------ */

/** counts.get(context) is a map from next word to how many times it followed that context. */
export type Counts = Map<string, Map<string, number>>;

/** The context key: the last (order - 1) words, joined with a space. */
export function contextKey(history: string[], order: number): string {
  return history.slice(-(order - 1)).join(" ");
}

export function train(sentences: string[], order: 2 | 3): Counts {
  const counts: Counts = new Map();
  for (const sentence of sentences) {
    const words = [START, ...wordsOf(sentence)];
    if (order === 3) words.unshift(START);
    for (let i = order - 1; i < words.length; i++) {
      const key = contextKey(words.slice(0, i), order);
      const next = words[i];
      const row = counts.get(key) ?? new Map<string, number>();
      row.set(next, (row.get(next) ?? 0) + 1);
      counts.set(key, row);
    }
  }
  return counts;
}

/** Add ONE sentence to existing counts (used to show training happening step by step). */
export function trainOne(counts: Counts, sentence: string, order: 2 | 3): Counts {
  const extra = train([sentence], order);
  const merged: Counts = new Map([...counts].map(([k, row]) => [k, new Map(row)]));
  for (const [key, row] of extra) {
    const target = merged.get(key) ?? new Map<string, number>();
    for (const [w, c] of row) target.set(w, (target.get(w) ?? 0) + c);
    merged.set(key, target);
  }
  return merged;
}

/* ------------------------------------------------------------------ */
/*  Inference: from counts to a probability distribution                */
/* ------------------------------------------------------------------ */

export interface Choice { token: string; count: number; p: number }

/** Probabilities from counts (temperature 1). A trigram model backs off to the bigram if the 2-word context was never seen. */
export function distribution(history: string[], model: { tri?: Counts; bi: Counts }, order: 2 | 3): { choices: Choice[]; usedOrder: 2 | 3 } {
  let row: Map<string, number> | undefined;
  let usedOrder: 2 | 3 = 2;
  if (order === 3 && model.tri) {
    const padded = history.length < 2 ? [START, ...history] : history;
    row = model.tri.get(contextKey(padded, 3));
    if (row) usedOrder = 3;
  }
  if (!row) row = model.bi.get(contextKey(history, 2));
  if (!row) return { choices: [], usedOrder };
  const total = [...row.values()].reduce((a, b) => a + b, 0);
  const choices = [...row.entries()]
    .map(([token, count]) => ({ token, count, p: count / total }))
    .sort((a, b) => b.p - a.p || a.token.localeCompare(b.token));
  return { choices, usedOrder };
}

/**
 * Temperature: divide each log-probability by T, then apply softmax.
 *   T = 1   → probabilities unchanged
 *   T < 1   → the likeliest tokens get even likelier (sharper)
 *   T > 1   → probabilities move closer together (flatter)
 *   T = 0   → "greedy": all probability on the single likeliest token
 */
export function applyTemperature(probs: number[], t: number): number[] {
  if (probs.length === 0) return [];
  if (t <= 0) {
    const best = probs.indexOf(Math.max(...probs));
    return probs.map((_, i) => (i === best ? 1 : 0));
  }
  const logits = probs.map((p) => Math.log(p) / t);
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ------------------------------------------------------------------ */
/*  Sampling with a seed (so results can be repeated exactly)            */
/* ------------------------------------------------------------------ */

/** mulberry32: a tiny, well-known seeded pseudo-random number generator. Returns numbers in [0, 1). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an index: walk along the probabilities until their running total passes a random number. */
export function sampleIndex(probs: number[], r: number): number {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

export interface StepResult {
  choices: (Choice & { pT: number })[];
  picked: number; // index into choices, -1 if nothing could be predicted
  usedOrder: 2 | 3;
}

export function step(history: string[], model: { tri?: Counts; bi: Counts }, order: 2 | 3, temperature: number, rng: () => number): StepResult {
  const { choices, usedOrder } = distribution(history, model, order);
  if (choices.length === 0) return { choices: [], picked: -1, usedOrder };
  const pT = applyTemperature(choices.map((c) => c.p), temperature);
  const picked = sampleIndex(pT, rng());
  return { choices: choices.map((c, i) => ({ ...c, pT: pT[i] })), picked, usedOrder };
}

export const MAX_WORDS = 18;

/** Generate a whole sentence from a starting prompt. Same seed + same settings → same sentence. */
export function generate(prompt: string[], model: { tri?: Counts; bi: Counts }, order: 2 | 3, temperature: number, seed: number): string[] {
  const rng = makeRng(seed);
  const out = [...prompt];
  while (out.length < MAX_WORDS + prompt.length) {
    const s = step([START, ...out], model, order, temperature, rng);
    if (s.picked < 0) break;
    const tok = s.choices[s.picked].token;
    out.push(tok);
    if (tok === END) break;
  }
  return out;
}

export function buildModel(sentences: string[] = CORPUS) {
  return { bi: train(sentences, 2), tri: train(sentences, 3) };
}

export const STARTERS: { label: string; words: string[] }[] = [
  { label: "(empty)", words: [] },
  { label: "mama achen", words: ["mama", "achen"] },
  { label: "the customer", words: ["the", "customer"] },
  { label: "the boda rider", words: ["the", "boda", "rider"] },
  { label: "the price of", words: ["the", "price", "of"] },
];

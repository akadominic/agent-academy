import { describe, expect, it } from "vitest";
import {
  tokenize, countTokens, preTokenize, tokensPerWord, morePair, checkRewrite, WORDY_PROMPT, SAMPLES, VOCAB, PREDICTION_PAIRS,
} from "@/labs/m03/tokenizer";
import {
  applyTemperature, buildModel, distribution, generate, makeRng, sampleIndex, step, train, trainOne, CORPUS, START, END,
} from "@/labs/m03/ngram";
import { answerFrom, CONVERSATION, extractFacts, fitToWindow, memoryNote, messageTokens, MESSAGE_OVERHEAD } from "@/labs/m03/contextWindow";
import { gradeLabels, lookupRecords, SHOP_QUESTIONS } from "@/labs/m03/hallucination";

describe("illustrative tokenizer", () => {
  it("covers the whole text exactly (tokens join back to the input)", () => {
    for (const s of SAMPLES.filter((x) => x.id !== "emoji")) {
      expect(tokenize(s.text).map((t) => t.text).join("")).toBe(s.text);
    }
  });
  it("keeps common English words whole, with their leading space", () => {
    expect(tokenize("How much is the sugar").map((t) => t.text)).toEqual(["How", " much", " is", " the", " sugar"]);
  });
  it("splits numbers into groups of at most three digits", () => {
    expect(tokenize("110000").map((t) => t.text)).toEqual(["110", "000"]);
    expect(preTokenize("UGX 1,000")).toEqual(["UGX", " ", "1", ",", "000"]);
  });
  it("falls back to UTF-8 bytes for characters outside the vocabulary", () => {
    const t = tokenize("🙏");
    expect(t).toHaveLength(4);
    expect(t.every((x) => x.kind === "byte")).toBe(true);
  });
  it("uses more tokens per word for Luganda than for English (the illustrated tendency)", () => {
    const en = SAMPLES.find((s) => s.id === "en")!.text;
    const lg = SAMPLES.find((s) => s.id === "lg")!.text;
    expect(tokensPerWord(lg)).toBeGreaterThan(tokensPerWord(en) * 1.5);
  });
  it("is deterministic and has unique vocabulary entries", () => {
    expect(countTokens(WORDY_PROMPT)).toBe(countTokens(WORDY_PROMPT));
    expect(new Set(VOCAB).size).toBe(VOCAB.length);
  });
  it("every prediction pair has a clear answer", () => {
    for (const p of PREDICTION_PAIRS) expect(morePair(p.a, p.b)).not.toBe("same");
  });
  it("checks a rewrite for length and kept meaning", () => {
    expect(checkRewrite("Price of rice today?", 12).ok).toBe(true);
    expect(checkRewrite("Rice cost now?", 12).missing).toEqual(["price", "today"]);
    expect(checkRewrite(WORDY_PROMPT, 12).ok).toBe(false);
  });
});

describe("toy n-gram next-token model", () => {
  const model = buildModel();
  it("training counts what follows each word", () => {
    const counts = train(["a b c .", "a b d ."], 2);
    expect(Object.fromEntries(counts.get("b")!)).toEqual({ c: 1, d: 1 });
    expect(counts.get(START)!.get("a")).toBe(2);
  });
  it("trainOne adds to counts without changing the old table", () => {
    const before = train(["a b ."], 2);
    const after = trainOne(before, "a c .", 2);
    expect(before.get("a")!.get("c")).toBeUndefined();
    expect(after.get("a")!.get("c")).toBe(1);
  });
  it("produces a probability distribution that sums to 1", () => {
    const { choices } = distribution([START, "the"], model, 2);
    expect(choices.length).toBeGreaterThan(3);
    expect(choices.reduce((s, c) => s + c.p, 0)).toBeCloseTo(1, 10);
  });
  it("temperature 1 leaves probabilities unchanged", () => {
    const p = [0.5, 0.3, 0.2];
    applyTemperature(p, 1).forEach((v, i) => expect(v).toBeCloseTo(p[i], 10));
  });
  it("low temperature sharpens, high temperature flattens, zero is greedy", () => {
    const p = [0.5, 0.3, 0.2];
    expect(applyTemperature(p, 0.5)[0]).toBeGreaterThan(0.5);
    expect(applyTemperature(p, 2)[0]).toBeLessThan(0.5);
    expect(applyTemperature(p, 0)).toEqual([1, 0, 0]);
    // T = 0.5 is the same as squaring then normalising
    expect(applyTemperature(p, 0.5)[0]).toBeCloseTo(0.25 / (0.25 + 0.09 + 0.04), 10);
  });
  it("sampling walks the running total", () => {
    expect(sampleIndex([0.5, 0.3, 0.2], 0.1)).toBe(0);
    expect(sampleIndex([0.5, 0.3, 0.2], 0.6)).toBe(1);
    expect(sampleIndex([0.5, 0.3, 0.2], 0.95)).toBe(2);
  });
  it("the seeded generator is reproducible", () => {
    const a = makeRng(42), b = makeRng(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
    expect(generate([], model, 2, 1, 7)).toEqual(generate([], model, 2, 1, 7));
  });
  it("temperature 0 always gives the same sentence, whatever the seed", () => {
    const outs = new Set([1, 2, 3, 4, 5].map((s) => generate([], model, 2, 0, s).join(" ")));
    expect(outs.size).toBe(1);
  });
  it("higher temperature gives more variety across seeds", () => {
    const outs = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => generate([], model, 2, 1.2, s).join(" ")));
    expect(outs.size).toBeGreaterThanOrEqual(4);
  });
  it("sentences end with a full stop or at the length limit", () => {
    const out = generate(["mama", "achen"], model, 3, 1, 3);
    expect(out[out.length - 1] === END || out.length >= 18).toBe(true);
  });
  it("a step reports the adjusted distribution and the pick", () => {
    const s = step([START], model, 2, 1, makeRng(1));
    expect(s.picked).toBeGreaterThanOrEqual(0);
    expect(s.choices.reduce((a, c) => a + c.pT, 0)).toBeCloseTo(1, 10);
  });
  it("the corpus is about market life and every sentence ends with a full stop", () => {
    expect(CORPUS.every((s) => s.endsWith(" ."))).toBe(true);
  });
});

describe("context window", () => {
  it("keeps the newest messages that fit and drops the oldest", () => {
    const msgs = CONVERSATION.slice(0, 4);
    const budget = messageTokens(msgs[3]) + messageTokens(msgs[2]) + 1;
    const fit = fitToWindow(msgs, budget, []);
    expect(fit.kept).toEqual([false, false, true, true]);
    expect(fit.used).toBeLessThanOrEqual(budget);
  });
  it("pinned text uses part of the budget", () => {
    const pinned = fitToWindow(CONVERSATION, 120, ["A long system prompt with many words in it."]);
    const free = fitToWindow(CONVERSATION, 120, []);
    expect(pinned.kept.filter(Boolean).length).toBeLessThanOrEqual(free.kept.filter(Boolean).length);
    expect(pinned.pinnedTokens).toBe(countTokens("A long system prompt with many words in it.") + MESSAGE_OVERHEAD);
  });
  it("reports overflow when even the newest message cannot fit", () => {
    expect(fitToWindow(CONVERSATION, 5, []).overflow).toBe(true);
  });
  it("finds facts in user messages only", () => {
    const f = extractFacts(CONVERSATION);
    expect(f.name).toBe("Nakato");
    expect(f.market).toBe("Owino");
    expect(f.plan).toBe("onions");
  });
  it("answers from visible messages, and cannot answer once the fact has scrolled out", () => {
    const all = CONVERSATION.map((msg, index) => ({ index, msg }));
    expect(answerFrom("What is my name?", all, null)).toMatchObject({ found: true, messageIndex: 0 });
    expect(answerFrom("What is my name?", all.slice(2), null).found).toBe(false);
    expect(answerFrom("What did I say I will try next week?", all.slice(6), null).found).toBe(true);
  });
  it("a pinned memory note brings the fact back", () => {
    const note = memoryNote(CONVERSATION);
    expect(note).toContain("Nakato");
    const visible = CONVERSATION.map((msg, index) => ({ index, msg })).slice(6);
    expect(answerFrom("What is my name?", visible, note)).toMatchObject({ found: true, source: "note" });
  });
});

describe("hallucination lab", () => {
  it("the lookup finds the right record for each question", () => {
    const expected: Record<string, string[]> = { sunday: ["R1"], rice: ["R2"], delivery: ["R3"], airtime: [] };
    for (const q of SHOP_QUESTIONS) expect(lookupRecords(q.text).map((r) => r.id)).toEqual(expected[q.id]);
  });
  it("grounded answers cite exactly what the lookup returns", () => {
    for (const q of SHOP_QUESTIONS) expect(q.grounded.cites).toEqual(lookupRecords(q.text).map((r) => r.id));
  });
  it("grades the learner's labels", () => {
    const claims = SHOP_QUESTIONS[0].ungrounded[0];
    expect(gradeLabels(claims, claims.map((c) => c.verdict)).allCorrect).toBe(true);
    expect(gradeLabels(claims, ["match", "match", "match"]).allCorrect).toBe(false);
  });
});

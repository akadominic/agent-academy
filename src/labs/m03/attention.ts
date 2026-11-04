/**
 * HAND-WRITTEN, ILLUSTRATIVE attention weights for the attention explorer.
 *
 * In a real transformer, attention weights are computed from learned numbers,
 * there are many "heads" in each of many layers, and individual weights are
 * often hard to interpret. These numbers were written by a person to show
 * the IDEA: when the model processes one token, it mixes in information from
 * earlier tokens, weighted by how relevant they are. In GPT-style models a
 * token can only look at itself and tokens BEFORE it, never after.
 */

export interface AttentionExample {
  id: string;
  label: string;
  words: string[];
  /** For each focus word index: weights on earlier word indexes (and itself). The rest is spread evenly. */
  focus: Record<number, Record<number, number>>;
  note: string;
}

export const ATTENTION_EXAMPLES: AttentionExample[] = [
  {
    id: "she",
    label: "Who is “she”?",
    words: ["Mama", "Achen", "gave", "the", "rider", "the", "rice", "because", "she", "had", "packed", "it"],
    focus: {
      8: { 0: 0.3, 1: 0.34, 4: 0.08, 8: 0.1 },
      11: { 6: 0.5, 10: 0.16, 2: 0.06, 11: 0.08 },
    },
    note: "“she” draws most heavily on “Mama Achen”, and “it” on “rice”. The model has no rule for this; patterns like it emerge from training.",
  },
  {
    id: "bank-money",
    label: "bank (money)",
    words: ["I", "deposited", "my", "money", "at", "the", "bank"],
    focus: { 6: { 1: 0.34, 3: 0.3, 6: 0.16 } },
    note: "Here “bank” mixes in “deposited” and “money”, so its internal representation leans towards the financial meaning.",
  },
  {
    id: "bank-river",
    label: "bank (river)",
    words: ["We", "fished", "from", "the", "river", "bank"],
    focus: { 5: { 4: 0.46, 1: 0.24, 5: 0.14 } },
    note: "The same word “bank”, but now “river” and “fished” get the most weight, pushing towards the riverside meaning.",
  },
  {
    id: "them",
    label: "What is “them”?",
    words: ["The", "tomatoes", "were", "cheap", "today", "so", "Nakato", "bought", "three", "kilos", "of", "them"],
    focus: { 11: { 1: 0.5, 9: 0.14, 7: 0.1, 11: 0.08 } },
    note: "“them” draws mostly on “tomatoes”, even though eight words sit in between. Attention can reach far back in one step.",
  },
];

/** Full weights for a focus word: the given ones, with the remainder spread evenly over the other earlier words. */
export function weightsFor(ex: AttentionExample, focusIndex: number): number[] {
  const given = ex.focus[focusIndex] ?? {};
  const w = ex.words.map(() => 0);
  let used = 0;
  for (const [k, v] of Object.entries(given)) { w[Number(k)] = v; used += v; }
  const others = ex.words.map((_, i) => i).filter((i) => i <= focusIndex && !(i in given));
  const share = others.length ? (1 - used) / others.length : 0;
  for (const i of others) w[i] = share;
  return w;
}

/**
 * Data and logic for the "hallucination" lab.
 *
 * The "model" here is SIMULATED: every answer was written by hand to show
 * TYPICAL behaviour. Without a lookup, a language model can only produce
 * text that is likely-sounding; it has never seen Mama Achen's records, so
 * any specific detail is unsupported (sometimes right by luck, often wrong).
 * With a lookup tool, code fetches the real record and the answer is built
 * from it, with a citation.
 */

export interface ShopRecord { id: string; topic: string; text: string; keywords: string[] }

/** Mama Achen's shop records (fictional, illustrative prices that match the course's shop catalogue). */
export const RECORDS: ShopRecord[] = [
  { id: "R1", topic: "Opening hours", text: "Monday to Saturday: 7:00 am to 8:00 pm. Sunday: 10:00 am to 2:00 pm.", keywords: ["open", "opening", "close", "hours", "time", "sunday", "monday", "saturday"] },
  { id: "R2", topic: "Rice prices", text: "Rice, 25 kg bag: UGX 110,000. Rice, 5 kg bag: UGX 23,500.", keywords: ["rice", "bag", "price", "cost", "much"] },
  { id: "R3", topic: "Delivery", text: "Delivery area: Nakawa, Ntinda and Kyambogo only. Fee: UGX 5,000 per order. Orders before 3:00 pm arrive the same day.", keywords: ["deliver", "delivery", "ntinda", "nakawa", "kyambogo", "fee", "cost"] },
  { id: "R4", topic: "Payment", text: "We accept cash and mobile money. No credit.", keywords: ["pay", "payment", "cash", "mobile", "money", "credit"] },
  { id: "R5", topic: "Sugar and oil prices", text: "Sugar, 1 kg: UGX 5,500. Cooking oil, 1 litre: UGX 8,000.", keywords: ["sugar", "oil", "price", "cost"] },
];

export type Verdict = "match" | "contradicts" | "missing";

export const VERDICT_LABEL: Record<Verdict, string> = {
  match: "Matches the records",
  contradicts: "Contradicts the records",
  missing: "Records don't say",
};

export interface Claim { text: string; verdict: Verdict; explain: string }

export interface ShopQuestion {
  id: string;
  text: string;
  /** Two fluent, made-up answers ("Ask again" shows the second one). Each is a list of claims. */
  ungrounded: Claim[][];
  grounded: { text: string; cites: string[] };
}

export const SHOP_QUESTIONS: ShopQuestion[] = [
  {
    id: "sunday",
    text: "What time does Mama Achen's shop open on Sunday?",
    ungrounded: [
      [
        { text: "Mama Achen's shop opens at 8:00 am on Sundays.", verdict: "contradicts", explain: "R1 says Sunday opening is 10:00 am." },
        { text: "It closes at 6:00 pm, so you have the whole day to shop.", verdict: "contradicts", explain: "R1 says it closes at 2:00 pm on Sunday." },
        { text: "Most shops around Nakawa market keep similar hours.", verdict: "missing", explain: "Nothing in the records is about other shops. It sounds reasonable, but nothing supports it." },
      ],
      [
        { text: "On Sundays the shop opens at 10:00 am.", verdict: "match", explain: "R1 agrees, but the model never saw R1. This was luck, not knowledge." },
        { text: "It stays open until about 7:00 pm.", verdict: "contradicts", explain: "R1 says 2:00 pm on Sunday." },
      ],
    ],
    grounded: { text: "On Sunday the shop opens at 10:00 am and closes at 2:00 pm.", cites: ["R1"] },
  },
  {
    id: "rice",
    text: "How much is a 25 kg bag of rice?",
    ungrounded: [
      [
        { text: "A 25 kg bag of rice costs UGX 95,000 at Mama Achen's shop.", verdict: "contradicts", explain: "R2 says UGX 110,000." },
        { text: "That price includes free delivery anywhere in Kampala.", verdict: "contradicts", explain: "R3 says delivery costs UGX 5,000 and only covers three areas." },
      ],
      [
        { text: "The 25 kg bag is UGX 110,000.", verdict: "match", explain: "R2 agrees. A lucky guess is still unsupported when it is made." },
        { text: "Prices at the shop are fixed and never change.", verdict: "missing", explain: "The records say nothing about prices never changing." },
      ],
    ],
    grounded: { text: "A 25 kg bag of rice costs UGX 110,000.", cites: ["R2"] },
  },
  {
    id: "delivery",
    text: "Do you deliver to Ntinda, and how much does it cost?",
    ungrounded: [
      [
        { text: "Yes, we deliver everywhere in Kampala.", verdict: "contradicts", explain: "R3 lists only Nakawa, Ntinda and Kyambogo." },
        { text: "Delivery costs UGX 3,000.", verdict: "contradicts", explain: "R3 says UGX 5,000." },
        { text: "Your order will arrive within one hour.", verdict: "missing", explain: "R3 only says orders before 3:00 pm arrive the same day. Nothing about one hour." },
      ],
      [
        { text: "Yes, Ntinda is in our delivery area.", verdict: "match", explain: "R3 agrees, by luck." },
        { text: "Delivery is free for orders above UGX 100,000.", verdict: "missing", explain: "No free-delivery rule appears in the records." },
      ],
    ],
    grounded: { text: "Yes. Ntinda is in the delivery area. The fee is UGX 5,000 per order, and orders placed before 3:00 pm arrive the same day.", cites: ["R3"] },
  },
  {
    id: "airtime",
    text: "Can I buy phone airtime at the shop?",
    ungrounded: [
      [
        { text: "Yes, Mama Achen sells airtime for all networks.", verdict: "missing", explain: "Airtime is not mentioned anywhere in the records." },
        { text: "You get a 5% bonus on top-ups above UGX 10,000.", verdict: "missing", explain: "No such offer appears in the records. A very specific number with no source is a warning sign." },
      ],
      [
        { text: "Airtime is available at the counter.", verdict: "missing", explain: "Not in the records." },
        { text: "You can pay for it with mobile money.", verdict: "match", explain: "R4 does say mobile money is accepted, but the claim that airtime is sold is still unsupported." },
      ],
    ],
    grounded: { text: "I checked the shop records and they do not mention airtime, so I cannot confirm it. Please ask Mama Achen directly.", cites: [] },
  },
];

/* ------------------------------------------------------------------ */
/*  The lookup tool                                                     */
/* ------------------------------------------------------------------ */

/**
 * A very simple search: score each record by how many of its keywords appear
 * in the question, and return the records with the best score. Real systems
 * use databases or search indexes, but the principle is the same: code
 * fetches the facts; the model does not invent them.
 */
export function lookupRecords(question: string): ShopRecord[] {
  const words: string[] = question.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const scored = RECORDS.map((r) => ({ r, score: r.keywords.filter((k) => words.includes(k)).length }));
  const best = Math.max(0, ...scored.map((s) => s.score));
  if (best === 0) return [];
  return scored.filter((s) => s.score === best).map((s) => s.r);
}

/** Grade the learner's labels. Returns which claims they labelled correctly. */
export function gradeLabels(claims: Claim[], labels: (Verdict | undefined)[]): { correct: boolean[]; allCorrect: boolean } {
  const correct = claims.map((c, i) => labels[i] === c.verdict);
  return { correct, allCorrect: correct.every(Boolean) };
}

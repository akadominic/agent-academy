/**
 * Context-window logic for the "context-window" lab.
 *
 * A model can only read a limited number of tokens per request (its context
 * window). When a conversation grows too long, the APP must decide what to
 * send. A common simple strategy, used here, is: always keep the system
 * prompt, then keep the newest messages that fit, and drop the oldest.
 * (Real apps vary: some refuse the request, some summarise old messages.)
 *
 * Token counts use the course's ILLUSTRATIVE tokenizer, plus an illustrative
 * overhead of a few tokens per message for the role labels.
 */
import { countTokens } from "./tokenizer";

export type Role = "user" | "assistant";
export interface Msg { role: Role; text: string }

export const MESSAGE_OVERHEAD = 3;

export function messageTokens(m: { text: string }): number {
  return countTokens(m.text) + MESSAGE_OVERHEAD;
}

export interface WindowFit {
  /** kept[i] is true if message i is sent to the model. */
  kept: boolean[];
  /** Tokens used by everything that is sent (pinned text + kept messages). */
  used: number;
  pinnedTokens: number;
  /** True if even the newest message does not fit. */
  overflow: boolean;
}

/**
 * Keep the pinned text (system prompt, optional notes), then walk backwards
 * from the newest message, keeping messages while they fit. Stop at the first
 * one that does not fit, so the kept part is always one unbroken recent stretch.
 */
export function fitToWindow(messages: Msg[], budget: number, pinned: string[]): WindowFit {
  const pinnedTokens = pinned.reduce((s, p) => s + messageTokens({ text: p }), 0);
  const kept = messages.map(() => false);
  let used = pinnedTokens;
  for (let i = messages.length - 1; i >= 0; i--) {
    const cost = messageTokens(messages[i]);
    if (used + cost > budget) break;
    kept[i] = true;
    used += cost;
  }
  const overflow = messages.length > 0 && !kept[messages.length - 1];
  return { kept, used, pinnedTokens, overflow };
}

/* ------------------------------------------------------------------ */
/*  Lab data                                                            */
/* ------------------------------------------------------------------ */

export const SYSTEM_PROMPT = "You are a helpful assistant for market traders in Kampala.";

export const CONVERSATION: Msg[] = [
  { role: "user", text: "Hello! My name is Nakato. I sell tomatoes at Owino market." },
  { role: "assistant", text: "Nice to meet you, Nakato. How can I help with your business today?" },
  { role: "user", text: "Customers keep asking for a discount when they buy a whole basin." },
  { role: "assistant", text: "You could offer a small discount for a full basin, so regular buyers come back while you still make a profit." },
  { role: "user", text: "Good idea. Some days the stock goes soft before I sell it all." },
  { role: "assistant", text: "Keep it in a cool, shaded place and sell the ripest first. Soft ones can go cheaper to people who cook sauce." },
  { role: "user", text: "My friend says I should also sell onions next to them." },
  { role: "assistant", text: "Onions are often bought together with tomatoes, so that could work. Start small and see how fast they sell." },
  { role: "user", text: "Thank you. I will try onions next week." },
  { role: "assistant", text: "Good plan. Write down how many you sell each day so you can decide whether to buy more." },
];

export type QuestionId = "name" | "market" | "plan";

export const QUESTIONS: { id: QuestionId; text: string }[] = [
  { id: "name", text: "What is my name?" },
  { id: "market", text: "Which market do I work at?" },
  { id: "plan", text: "What did I say I will try next week?" },
];

/* ------------------------------------------------------------------ */
/*  The simulated assistant: answers ONLY from text it was sent         */
/* ------------------------------------------------------------------ */

export interface Facts { name?: string; market?: string; plan?: string }

const PATTERNS: Record<QuestionId, RegExp> = {
  name: /\b[Mm]y name is ([A-Z][\p{L}'-]*)/u,
  market: /\bat ([A-Z][\p{L}'-]*) market\b/u,
  plan: /\bI will try ([\p{L} ]+?) next week\b/iu,
};

/** Find facts in user messages. Later statements win (if you change your name, the newest one counts). */
export function extractFacts(messages: Msg[]): Facts & { from: Partial<Record<QuestionId, number>> } {
  const facts: Facts & { from: Partial<Record<QuestionId, number>> } = { from: {} };
  messages.forEach((m, i) => {
    if (m.role !== "user") return;
    for (const q of Object.keys(PATTERNS) as QuestionId[]) {
      const match = m.text.match(PATTERNS[q]);
      if (match) { facts[q] = match[1].trim(); facts.from[q] = i; }
    }
  });
  return facts;
}

/** The kind of note an app might store and pin to every request (Module 8 covers memory properly). */
export function memoryNote(allMessages: Msg[]): string | null {
  const f = extractFacts(allMessages);
  const parts = [f.name && `name ${f.name}`, f.market && `market ${f.market}`].filter(Boolean);
  return parts.length ? `Notes from earlier: ${parts.join("; ")}.` : null;
}

export function classifyQuestion(text: string): QuestionId | null {
  const t = text.toLowerCase();
  if (/\bname\b/.test(t)) return "name";
  if (/\bmarket\b|\bwhere\b.*\b(work|sell)\b/.test(t)) return "market";
  if (/next week|\btry\b|\bplan\b/.test(t)) return "plan";
  return null;
}

export interface Answer { text: string; found: boolean; source: "message" | "note" | null; messageIndex?: number }

/**
 * Answer using ONLY the visible messages (and the pinned note, if any).
 * `visible` holds the original indexes so the lab can point at the source.
 */
export function answerFrom(question: string, visible: { index: number; msg: Msg }[], note: string | null): Answer {
  const q = classifyQuestion(question);
  if (!q) return { text: "(This simulation only answers questions about your name, your market, or your plan for next week.)", found: false, source: null };
  const facts = extractFacts(visible.map((v) => v.msg));
  const value = facts[q];
  if (value !== undefined) {
    const local = facts.from[q]!;
    const messageIndex = visible[local].index;
    const text = q === "name" ? `Your name is ${value}.` : q === "market" ? `You work at ${value} market.` : `You said you will try ${value} next week.`;
    return { text, found: true, source: "message", messageIndex };
  }
  if (note && q !== "plan") {
    const noteFacts = note.match(q === "name" ? /name ([\p{L}'-]+)/u : /market ([\p{L}'-]+)/u);
    if (noteFacts) {
      const v = noteFacts[1];
      return { text: q === "name" ? `Your name is ${v}.` : `You work at ${v} market.`, found: true, source: "note" };
    }
  }
  const what = q === "name" ? "your name" : q === "market" ? "which market you work at" : "your plan for next week";
  return { text: `I'm sorry, I can't find ${what} anywhere in the text I was given. Could you tell me again?`, found: false, source: null };
}

export const ACKS = ["Thanks, noted.", "I see. Tell me more.", "Okay, that makes sense.", "Good to know."];

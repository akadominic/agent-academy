/**
 * AN ILLUSTRATIVE TOKENIZER, written by hand for teaching.
 *
 * This is NOT the tokenizer of any real model. Real tokenizers (for example
 * byte-pair encoding, "BPE") LEARN a vocabulary of tens of thousands of pieces
 * from huge amounts of text. Here the vocabulary is a few hundred pieces
 * typed in by hand, and the algorithm is a simple "greedy longest match":
 * at each position, take the longest vocabulary piece that fits.
 *
 * It still shows the behaviours that matter:
 *   - common English words are often ONE token (with their leading space),
 *   - rare words split into several pieces,
 *   - words from languages under-represented in the vocabulary (Luganda,
 *     Runyankore) tend to split into more pieces per word,
 *   - long numbers are split into groups of digits,
 *   - characters with no vocabulary entry fall back to raw UTF-8 bytes.
 */

export type TokenKind = "word" | "piece" | "char" | "number" | "punct" | "space" | "byte";

export interface Token {
  /** The text this token covers (for byte tokens, a readable label such as "<F0>"). */
  text: string;
  /** An illustrative id: the index in VOCAB, or 50000 + byte value for byte tokens. */
  id: number;
  kind: TokenKind;
}

/* ------------------------------------------------------------------ */
/*  The hand-written vocabulary                                         */
/* ------------------------------------------------------------------ */

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** Common English words. Each appears with a leading space AND without (for the start of a text). */
const ENGLISH_WORDS = [
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "from", "with", "by", "as",
  "is", "are", "was", "were", "be", "been", "am", "do", "does", "did", "have", "has", "had", "will", "would",
  "can", "could", "should", "may", "might", "must", "not", "no", "yes",
  "i", "you", "he", "she", "it", "we", "they", "me", "my", "your", "our", "their", "his", "her", "its", "them", "us",
  "this", "that", "these", "those", "there", "here", "what", "when", "where", "who", "why", "how", "which",
  "if", "so", "then", "than", "very", "much", "many", "more", "most", "some", "any", "all", "one", "two", "three",
  "good", "morning", "hello", "hi", "thank", "thanks", "please", "sorry", "just", "only", "also", "about",
  "today", "tomorrow", "now", "time", "day", "week", "open", "close", "closed", "price", "prices", "cost",
  "buy", "sell", "sells", "sold", "pay", "money", "shop", "market", "bag", "bags", "kg", "rice", "sugar", "salt",
  "oil", "soap", "eggs", "milk", "tea", "beans", "tray", "name", "know", "tell", "want", "need", "like", "get",
  "give", "make", "see", "say", "said", "ask", "go", "come", "deliver", "delivery", "customer", "customers",
  "order", "total", "help", "could", "possibly", "wondering", "there", "so", "well", "really", "quick",
  "million", "thousand", "hundred", "shilling", "shillings", "per",
  "model", "token", "tokens", "text", "word", "words", "language", "number", "write", "read", "new", "old",
  "people", "person", "school", "work", "home", "phone", "mobile", "great", "small", "big", "long", "short",
  "Uganda", "Kampala", "boda", "mama", "Mama", "The", "I", "How", "What", "When", "Where", "Hello", "Good",
  "Thank", "Please", "Do", "Is", "Can", "Hi",
];

/** English sub-word pieces (endings and common fragments). */
const ENGLISH_PIECES = [
  "ing", "ed", "er", "ers", "est", "ly", "tion", "tions", "ment", "ness", "able", "ful", "less", "s", "es",
  "un", "re", "pre", "dis", "th", "ch", "sh", "qu", "ou", "ea", "ee", "oo", "ar", "or", "ur", "ir",
  "an", "en", "in", "on", "un", "al", "el", "il", "ol", "at", "et", "it", "ot", "ut",
];

/**
 * Short syllable pieces. These help English a little and are most of what is
 * available for Luganda and Runyankore, so those words split into several
 * tokens. That mirrors a commonly observed tendency in real tokenizers whose
 * training data contains far more English than Ugandan languages.
 */
const SYLLABLES = [
  "ba", "be", "bi", "bo", "bu", "ka", "ke", "ki", "ko", "ku", "la", "le", "li", "lo", "lu", "ma", "me", "mi",
  "mo", "mu", "na", "ne", "ni", "no", "nu", "ga", "ge", "gi", "go", "gu", "ta", "te", "ti", "to", "tu",
  "wa", "we", "wi", "ya", "ye", "yo", "za", "ze", "zi", "nga", "nya", "nyo", "ny", "nn", "ss", "mm", "kk",
];

/** Pieces used in program code. */
const CODE_PIECES = [
  "const", "let", "function", "return", "if", "else", "for", "while", "true", "false", "null", "await",
  "async", "console", "log", "=>", "===", "!==", "==", "+=", "&&", "||", "//", "()", "{}", "[]", ");", "});",
];

const PUNCT = ".,!?;:'\"()[]{}<>-_=+*/\\|@#$%^&~`";

function buildVocab(): string[] {
  const set = new Set<string>();
  const add = (s: string) => set.add(s);
  // Single characters first, so every ASCII character has an id.
  for (const c of LETTERS) { add(c); add(c.toUpperCase()); add(" " + c); add(" " + c.toUpperCase()); }
  // Like several real tokenizers, every number from 0 to 999 is one token.
  for (let n = 0; n < 1000; n++) add(String(n));
  for (let n = 0; n < 100; n++) add(String(n).padStart(2, "0"));
  for (let n = 0; n < 1000; n++) add(String(n).padStart(3, "0"));
  for (const p of PUNCT) { add(p); add(" " + p); }
  add(" "); add("  "); add("    "); add("\n"); add("\n\n"); add("\t");
  for (const w of ENGLISH_WORDS) {
    const cap = w[0].toUpperCase() + w.slice(1);
    add(w); add(" " + w); add(cap); add(" " + cap);
  }
  for (const p of ENGLISH_PIECES) add(p);
  for (const s of SYLLABLES) { add(s); add(" " + s); add(s[0].toUpperCase() + s.slice(1)); add(" " + s[0].toUpperCase() + s.slice(1)); }
  for (const c of CODE_PIECES) { add(c); add(" " + c); }
  return [...set];
}

export const VOCAB: readonly string[] = buildVocab();
const VOCAB_ID = new Map(VOCAB.map((p, i) => [p, i] as const));
const MAX_PIECE = Math.max(...VOCAB.map((p) => p.length));
export const VOCAB_SIZE = VOCAB.length;

/* ------------------------------------------------------------------ */
/*  Tokenization                                                        */
/* ------------------------------------------------------------------ */

/**
 * Step 1, "pre-tokenization": split into chunks that tokens may not cross.
 * Like many real tokenizers, a single leading space sticks to the word after it.
 * Digits are split into groups of at most three (and do not take the space).
 */
const CHUNK = / ?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

export function preTokenize(text: string): string[] {
  return text.match(CHUNK) ?? [];
}

function kindFor(piece: string, chunk: string): TokenKind {
  const core = piece.trimStart();
  if (core.length === 0) return "space";
  if (/^\p{N}+$/u.test(core)) return "number";
  if (/^[^\p{L}\p{N}]+$/u.test(core)) return "punct";
  if (piece === chunk) return "word";
  return core.length === 1 ? "char" : "piece";
}

function bytesOf(ch: string): Token[] {
  return [...new TextEncoder().encode(ch)].map((b) => ({
    text: `<${b.toString(16).toUpperCase().padStart(2, "0")}>`,
    id: 50000 + b,
    kind: "byte" as const,
  }));
}

/** Step 2: greedy longest match inside each chunk, with a byte fallback. */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const chunk of preTokenize(text)) {
    let i = 0;
    while (i < chunk.length) {
      let matched: string | null = null;
      for (let len = Math.min(MAX_PIECE, chunk.length - i); len >= 1; len--) {
        const piece = chunk.slice(i, i + len);
        if (VOCAB_ID.has(piece)) { matched = piece; break; }
      }
      if (matched) {
        out.push({ text: matched, id: VOCAB_ID.get(matched)!, kind: kindFor(matched, chunk) });
        i += matched.length;
      } else {
        // No vocabulary piece: fall back to the character's UTF-8 bytes.
        const cp = chunk.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        out.push(...bytesOf(ch));
        i += ch.length;
      }
    }
  }
  return out;
}

export function countTokens(text: string): number {
  return tokenize(text).length;
}

/** Number of words (runs of letters/digits) — used for "tokens per word". */
export function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}']+/gu) ?? []).length;
}

export function tokensPerWord(text: string): number {
  const w = countWords(text);
  return w === 0 ? 0 : countTokens(text) / w;
}

/** Make whitespace visible when a token is displayed. */
export function showToken(t: Token): string {
  return t.text.replace(/ /g, "·").replace(/\n/g, "↵").replace(/\t/g, "⇥");
}

/* ------------------------------------------------------------------ */
/*  Lab data                                                            */
/* ------------------------------------------------------------------ */

export interface Sample { id: string; label: string; text: string; note: string }

export const SAMPLES: Sample[] = [
  { id: "en", label: "English", text: "Good morning. How much is the sugar today? Thank you very much.", note: "Everyday English" },
  { id: "lg", label: "Luganda", text: "Wasuze otya nno. Sukaali ssente mmeka leero? Webale nnyo.", note: "Roughly the same message in Luganda (everyday phrasing; approximate translation)" },
  { id: "nyn", label: "Runyankore", text: "Oraire ota? Webare munonga.", note: "A Runyankore greeting and thanks" },
  { id: "code", label: "Code", text: "const total = price * quantity;\nconsole.log(total);", note: "A line of JavaScript" },
  { id: "num", label: "Numbers", text: "Rice: UGX 110000 per bag. Phone 0772123456.", note: "Long numbers split into groups of digits" },
  { id: "emoji", label: "Emoji", text: "Thank you 🙏🏾", note: "Characters outside the vocabulary fall back to raw bytes" },
];

/** "Which uses more tokens?" pairs. The answer is computed, never hard-coded. */
export const PREDICTION_PAIRS: { id: string; a: string; b: string }[] = [
  { id: "p1", a: "Thank you very much.", b: "Webale nnyo." },
  { id: "p2", a: "the price of sugar", b: "THE PRICE OF SUGAR" },
  { id: "p3", a: "UGX 1,000,000", b: "one million shillings" },
  { id: "p4", a: "How are you today?", b: "Oli otya leero?" },
];

export function morePair(a: string, b: string): "a" | "b" | "same" {
  const ca = countTokens(a), cb = countTokens(b);
  return ca === cb ? "same" : ca > cb ? "a" : "b";
}

export const WORDY_PROMPT =
  "Hello there, I was just wondering if you could possibly please tell me what the price of one bag of rice is at your shop today, thank you so much.";

/** Words that must survive the rewrite so the meaning is kept (a simple keyword check). */
export const REQUIRED_WORDS = ["price", "rice", "today"];

export function checkRewrite(text: string, target: number): { tokens: number; missing: string[]; ok: boolean } {
  const tokens = countTokens(text);
  const lower = text.toLowerCase();
  const missing = REQUIRED_WORDS.filter((w) => !new RegExp(`\\b${w}\\b`).test(lower));
  return { tokens, missing, ok: tokens > 0 && tokens <= target && missing.length === 0 };
}

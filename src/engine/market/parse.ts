import { PRODUCTS } from "./catalog";

/**
 * A deliberately simple, rule-based reader of customer requests.
 *
 * It is NOT a language model. It looks for product words and nearby
 * numbers. The simulated model uses it so that lab results are
 * predictable. Real models handle far messier language — and can also
 * misread things in ways these rules never would.
 */

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, twenty: 20,
};

export interface RequestedItem {
  query: string;
  quantity: number;
}

export interface ParsedRequest {
  items: RequestedItem[];
  wantsDelivery: boolean;
  when?: string;
  asksPriceOnly: boolean;
}

export function parseRequest(text: string): ParsedRequest {
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")} `;
  const synonyms = PRODUCTS.flatMap((p) => p.synonyms.map((s) => ({ s, base: p.synonyms[0] })))
    .sort((a, b) => b.s.length - a.s.length);

  const found = new Map<string, RequestedItem>();
  const consumed: [number, number][] = [];

  for (const { s, base } of synonyms) {
    let from = 0;
    while (true) {
      const at = lower.indexOf(` ${s} `, from);
      if (at === -1) break;
      from = at + 1;
      const overlaps = consumed.some(([a, b]) => at < b && at + s.length > a);
      if (overlaps) continue;
      consumed.push([at, at + s.length + 1]);
      // Look back a few words for a quantity.
      const before = lower.slice(0, at).trim().split(/\s+/).slice(-4).reverse();
      let quantity = 1;
      for (const w of before) {
        if (/^\d+$/.test(w)) { quantity = parseInt(w, 10); break; }
        if (w in NUMBER_WORDS) { quantity = NUMBER_WORDS[w]; break; }
      }
      // Also accept "rice 3" (number right after the product).
      const after = lower.slice(at + s.length + 1).trim().split(/\s+/)[0];
      if (quantity === 1 && /^\d+$/.test(after ?? "")) quantity = parseInt(after, 10);
      if (!found.has(base)) found.set(base, { query: base, quantity });
    }
  }

  const wantsDelivery = /deliver|bring|send to|drop/.test(lower);
  const whenMatch = lower.match(/\b(today|tomorrow|tonight|this evening|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/);
  const asksPriceOnly = /how much|price|cost/.test(lower) && !/order|want|need|deliver|buy/.test(lower);

  // Preserve the order the customer mentioned things in.
  const items = [...found.values()].sort(
    (a, b) => lower.indexOf(a.query.split(" ")[0]) - lower.indexOf(b.query.split(" ")[0]),
  );
  return { items, wantsDelivery, when: whenMatch?.[1], asksPriceOnly };
}

/**
 * Rough token estimate: about 4 characters of English per token.
 *
 * This is an APPROXIMATION used for illustration and cost estimates.
 * Real tokenizers differ per model and per language (Luganda or code
 * often use more tokens per character than plain English).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

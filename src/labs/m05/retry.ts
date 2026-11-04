/**
 * Retry with exponential backoff: pure logic shared by the API Explorer
 * lab and its unit tests.
 */

import type { MockResponse } from "./mockApi";

/** Status codes that are worth retrying: the problem is temporary, not in your request. */
export const RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504, 529];

export function isRetryable(res: Pick<MockResponse, "kind" | "status">): boolean {
  if (res.kind === "timeout" || res.kind === "network") return true;
  return RETRYABLE_STATUSES.includes(res.status);
}

/**
 * How long to wait before the next attempt.
 * - If the server sent Retry-After (seconds), obey it.
 * - Otherwise: baseMs × 2^(failures − 1), capped at maxMs: 500, 1000, 2000, 4000…
 * `jitter` (0..1) adds up to that fraction of extra random delay so that many
 * clients do not all retry at the same instant. Pass 0 for a predictable delay.
 */
export function backoffDelayMs(
  failures: number,
  opts: { baseMs?: number; maxMs?: number; retryAfterSec?: number; jitter?: number } = {},
): number {
  const { baseMs = 500, maxMs = 8000, retryAfterSec, jitter = 0 } = opts;
  if (retryAfterSec !== undefined && Number.isFinite(retryAfterSec) && retryAfterSec >= 0) return retryAfterSec * 1000;
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, failures - 1));
  return Math.round(exp * (1 + Math.max(0, Math.min(1, jitter))));
}

export interface Attempt {
  n: number;
  res: MockResponse;
  /** How long we waited after this attempt before the next one (0 for the last). */
  waitMs: number;
  /** Why we stopped or continued. */
  decision: "success" | "retry" | "give-up-not-retryable" | "give-up-max-attempts";
}

/**
 * Run `send` up to `maxAttempts` times. `send(elapsedMs)` receives the simulated
 * time already spent waiting, so a simulated clock can move forward.
 */
export function runWithRetry(send: (elapsedMs: number) => MockResponse, opts: { maxAttempts?: number; baseMs?: number; maxMs?: number } = {}): { attempts: Attempt[]; final: MockResponse; waitedMs: number } {
  const maxAttempts = opts.maxAttempts ?? 4;
  const attempts: Attempt[] = [];
  let waited = 0;
  for (let n = 1; n <= maxAttempts; n++) {
    const res = send(waited);
    const ok = res.kind === "response" && res.status < 400;
    if (ok) {
      attempts.push({ n, res, waitMs: 0, decision: "success" });
      return { attempts, final: res, waitedMs: waited };
    }
    if (!isRetryable(res)) {
      attempts.push({ n, res, waitMs: 0, decision: "give-up-not-retryable" });
      return { attempts, final: res, waitedMs: waited };
    }
    if (n === maxAttempts) {
      attempts.push({ n, res, waitMs: 0, decision: "give-up-max-attempts" });
      return { attempts, final: res, waitedMs: waited };
    }
    const ra = res.headers["retry-after"];
    const wait = backoffDelayMs(n, { baseMs: opts.baseMs, maxMs: opts.maxMs, retryAfterSec: ra !== undefined ? Number(ra) : undefined });
    attempts.push({ n, res, waitMs: wait, decision: "retry" });
    waited += wait;
  }
  // Unreachable, but keeps TypeScript happy.
  const last = attempts[attempts.length - 1];
  return { attempts, final: last.res, waitedMs: waited };
}

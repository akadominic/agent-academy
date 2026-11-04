"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, CheckCircle2, Circle, Send } from "lucide-react";
import { Button, SimBadge, Segmented, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  DEFAULT_ORDER_BODY, HOST, METHODS, STATUS_HELP, SUGGESTED_PATHS, TARGET_CODES, exchange, missionDone,
  type Exchange, type Method,
} from "./httpSim";

const MISSIONS: Record<(typeof TARGET_CODES)[number], string> = {
  200: "Get the list of products",
  404: "Ask for a product the shop does not sell",
  405: "Try to DELETE the whole product list",
  500: "Find the page with a bug (hint: today's specials)",
};

const HEADER_HELP: Record<string, string> = {
  Date: "When the server produced this response (always in GMT).",
  "Content-Type": "What kind of data the body is: JSON data or an HTML page.",
  "Content-Length": "How many bytes long the body is, so the receiver knows when it has all of it.",
  Allow: "Sent with 405: the methods this path does accept.",
  Location: "Sent with 201: the path where the newly created thing can be found.",
};

function statusTone(code: number) {
  if (code >= 500) return "text-safety border-safety/60 bg-[color-mix(in_srgb,var(--c-safety)_8%,transparent)]";
  if (code >= 400) return "text-warn border-warn/60 bg-[color-mix(in_srgb,var(--c-warn)_9%,transparent)]";
  return "text-ok border-ok/60 bg-[color-mix(in_srgb,var(--c-ok)_9%,transparent)]";
}

export default function HttpRequest({ onComplete }: LabProps) {
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/products");
  const [body, setBody] = useState(DEFAULT_ORDER_BODY);
  const [pending, setPending] = useState(false);
  const [ex, setEx] = useState<Exchange | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<{ method: Method; path: string; status: number }[]>([]);
  const [pathError, setPathError] = useState<string | null>(null);
  const completed = useRef(false);
  const sendsBody = method === "POST" || method === "PUT";

  useEffect(() => {
    if (!completed.current && missionDone(seen)) {
      completed.current = true;
      onComplete?.("Produced 200, 404, 405 and 500 responses");
    }
  }, [seen, onComplete]);

  function send() {
    const p = path.trim();
    if (!p.startsWith("/")) {
      setPathError("A path must start with a slash, like /products. (The browser adds the domain for you.)");
      return;
    }
    setPathError(null);
    setPending(true);
    const result = exchange({ method, path: p, body: sendsBody ? body : undefined });
    const delay = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
    setTimeout(() => {
      setEx(result);
      setPending(false);
      setSeen((s) => new Set(s).add(result.response.status));
      setHistory((h) => [{ method, path: p, status: result.response.status }, ...h].slice(0, 6));
    }, delay);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-prose text-sm text-ink-2">
          You are the browser. Choose a <strong>method</strong> (what you want to do) and a <strong>path</strong> (which thing on the server), then send the request to Mama Achen's shop server.
        </p>
        <SimBadge label="Simulated server" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0 space-y-3">
          <div className="space-y-3 rounded-xl border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Method</span>
              <Segmented<Method> label="HTTP method" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: m }))} size="sm" />
            </div>
            <div>
              <label htmlFor="http-path" className="text-sm font-medium">Path</label>
              <div className="mt-1 flex items-stretch overflow-hidden rounded-lg border border-line-strong bg-bg focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)]">
                <span className="hidden items-center bg-sunken px-2 font-mono text-xs text-ink-3 sm:flex">https://{HOST}</span>
                <input
                  id="http-path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-sm outline-none"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                />
              </div>
              {pathError && <p className="mt-1 text-sm text-safety" role="alert">{pathError}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggested paths">
                {SUGGESTED_PATHS.map((s) => (
                  <button key={s} onClick={() => setPath(s)} className={cx("rounded-full border px-2 py-0.5 font-mono text-xs", s === path ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-sunken")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {sendsBody && (
              <div>
                <label htmlFor="http-body" className="text-sm font-medium">Body (JSON data sent with {method})</label>
                <textarea
                  id="http-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  spellCheck={false}
                  className="mt-1 w-full rounded-lg border border-line-strong bg-bg p-2 font-mono text-sm"
                />
              </div>
            )}
            <Button variant="primary" onClick={send} disabled={pending}>
              <Send className="h-4 w-4" aria-hidden /> {pending ? "Sending…" : "Send request"}
            </Button>
          </div>

          {ex && (
            <div className="space-y-2" aria-live="polite">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-people">Request (browser → server)</div>
                <pre tabIndex={0} className="overflow-auto rounded-lg bg-code p-3 font-mono text-[12px] leading-relaxed text-code-ink">{ex.requestText}</pre>
              </div>
              <div className="flex justify-center text-ink-3"><ArrowDown className="h-4 w-4" aria-hidden /></div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-control">Response (server → browser)</span>
                  <span className={cx("rounded-full border px-2 py-0.5 font-mono text-xs font-bold", statusTone(ex.response.status))}>
                    {ex.response.status} {ex.response.reason}
                  </span>
                </div>
                <pre tabIndex={0} className="max-h-80 overflow-auto rounded-lg bg-code p-3 font-mono text-[12px] leading-relaxed text-code-ink">{ex.responseText}</pre>
              </div>
              <div className={cx("rounded-lg border px-3 py-2 text-sm", statusTone(ex.response.status))}>
                <strong className="font-mono">{ex.response.status}</strong>{" "}
                <span className="text-ink">{STATUS_HELP[ex.response.status]}</span>
                <p className="mt-1 text-ink-2">{ex.note}</p>
              </div>
              <details className="rounded-lg border border-line px-3 py-2 text-sm">
                <summary className="cursor-pointer font-medium">What do these headers mean?</summary>
                <dl className="mt-2 space-y-1.5">
                  {["Date", ...ex.response.headers.map(([k]) => k), "Content-Length"].map((k) => (
                    <div key={k}>
                      <dt className="inline font-mono text-xs font-semibold">{k}: </dt>
                      <dd className="inline text-ink-2">{HEADER_HELP[k] ?? ""}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-line p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Collect these responses</div>
            <ul className="space-y-2 text-[13px]">
              {TARGET_CODES.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  {seen.has(c) ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="done" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-label="not yet" />}
                  <span><strong className="font-mono">{c}</strong> <span className="text-ink-2">{MISSIONS[c]}</span></span>
                </li>
              ))}
            </ul>
          </div>
          {history.length > 0 && (
            <div className="rounded-xl border border-line p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Recent requests</div>
              <ul className="space-y-1 font-mono text-xs">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{h.method} {h.path}</span>
                    <span className={cx("shrink-0 rounded border px-1", statusTone(h.status))}>{h.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

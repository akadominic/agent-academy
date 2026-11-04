"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock, KeyRound, Plus, RotateCcw, Send, Trash2, Wand2, Zap } from "lucide-react";
import { Badge, Button, JsonView, Segmented, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import type { LabProps } from "../types";
import {
  CHALLENGES, DEFAULT_CHALLENGES, HOSTS, METHODS, MOCK_MODELS, MODEL_HOST, MODEL_KEY, PRESETS, RATE_LIMIT, RATE_WINDOW_MS,
  SHOP_KEY, SHOP_READONLY_KEY, callerIdFor, createServerState, estimateCostUSD, explainResponse, handleRequest, preset,
  structuredCloneDraft, tryParseJson,
  type HttpMethod, type KV, type MockResponse, type RequestDraft, type ServerCondition,
} from "./mockApi";
import { runWithRetry, type Attempt } from "./retry";
import { curlCommand, fetchCode, rawHttp, urlParts } from "./codegen";

type InspectTab = "parts" | "raw" | "fetch" | "curl";
type EditTab = "params" | "headers" | "body";

interface Result {
  res: MockResponse;
  attempts?: Attempt[];
  draft: RequestDraft;
  timeoutMs: number;
}

interface HistoryItem {
  n: number;
  method: HttpMethod;
  path: string;
  label: string;
  tone: "ok" | "warn" | "bad";
}

const KEYS: { label: string; value: string; note: string }[] = [
  { label: "Shop key (full)", value: SHOP_KEY, note: "Can read and create orders" },
  { label: "Shop key (read-only)", value: SHOP_READONLY_KEY, note: "Can only read" },
  { label: "Model provider key", value: MODEL_KEY, note: "For api.model-provider.example" },
  { label: "A wrong key", value: "sk-sim-WRONG000000000000", note: "To see what happens" },
];

function statusTone(res: MockResponse): "ok" | "warn" | "bad" {
  if (res.kind !== "response") return "bad";
  return res.status < 300 ? "ok" : res.status < 500 ? "warn" : "bad";
}

function statusLabel(res: MockResponse, timeoutMs: number): string {
  if (res.kind === "timeout") return `No response (timed out after ${timeoutMs / 1000} s)`;
  if (res.kind === "network") return "No response (host not found)";
  return `${res.status} ${res.statusText}`;
}

const toneText = { ok: "text-ok", warn: "text-warn", bad: "text-safety" } as const;
const toneBadge = { ok: "ok", warn: "warn", bad: "danger" } as const;

function KVEditor({ rows, onChange, label, namePlaceholder, valuePlaceholder }: {
  rows: KV[]; onChange: (rows: KV[]) => void; label: string; namePlaceholder: string; valuePlaceholder: string;
}) {
  const set = (i: number, patch: Partial<KV>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-ink-3">No {label.toLowerCase()} yet.</p>}
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 border-b border-line pb-2 last:border-0 @sm:grid-cols-[auto_minmax(0,2fr)_minmax(0,3fr)_auto] @sm:border-0 @sm:pb-0">
          <input
            type="checkbox"
            checked={r.enabled}
            onChange={(e) => set(i, { enabled: e.target.checked })}
            aria-label={`Send ${label.toLowerCase()} row ${i + 1}`}
            className="h-4 w-4 shrink-0 accent-[var(--accent)]"
          />
          <input
            value={r.name}
            onChange={(e) => set(i, { name: e.target.value })}
            placeholder={namePlaceholder}
            aria-label={`${label} ${i + 1} name`}
            className="min-w-0 rounded-md border border-line bg-bg px-2 py-1.5 font-mono text-[12.5px]"
          />
          <input
            value={r.value}
            onChange={(e) => set(i, { value: e.target.value })}
            placeholder={valuePlaceholder}
            aria-label={`${label} ${i + 1} value`}
            className="col-start-2 col-end-4 min-w-0 rounded-md border border-line bg-bg px-2 py-1.5 font-mono text-[12.5px] @sm:col-auto"
          />
          <button
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="col-start-3 row-start-1 shrink-0 rounded-md p-1.5 text-ink-3 hover:bg-sunken hover:text-safety @sm:col-start-4"
            aria-label={`Remove ${label.toLowerCase()} row ${i + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={() => onChange([...rows, { name: "", value: "", enabled: true }])}>
        <Plus className="h-4 w-4" /> Add {label.toLowerCase().replace(/s$/, "")}
      </Button>
    </div>
  );
}

export default function ApiExplorer({ onComplete, challenges, start }: LabProps & { challenges?: string[]; start?: string }) {
  const challengeIds = useMemo(() => (Array.isArray(challenges) ? (challenges as string[]) : DEFAULT_CHALLENGES), [challenges]);
  const challengeDefs = useMemo(() => CHALLENGES.filter((c) => challengeIds.includes(c.id)), [challengeIds]);

  const server = useRef(createServerState());
  const clockOffset = useRef(0);
  const [draft, setDraft] = useState<RequestDraft>(() => preset(typeof start === "string" ? start : "list-products"));
  const [condition, setCondition] = useState<ServerCondition>("normal");
  const [timeoutMs, setTimeoutMs] = useState(10_000);
  const [autoRetry, setAutoRetry] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [seen, setSeen] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inspect, setInspect] = useState<InspectTab>("parts");
  const [edit, setEdit] = useState<EditTab>("params");
  const [respTab, setRespTab] = useState<"body" | "headers">("body");
  const [sending, setSending] = useState<null | string>(null);
  const [tick, setTick] = useState(0);
  const completed = useRef(false);
  const counter = useRef(0);

  // Refresh the rate-limit meter while requests are recent.
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  const callerId = callerIdFor(draft);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const remaining = useMemo(() => server.current.limiter.remaining(callerId, Date.now() + clockOffset.current), [callerId, tick, history]);

  const bodyCheck = useMemo(() => (draft.body.trim() ? tryParseJson(draft.body) : null), [draft.body]);

  const update = (patch: Partial<RequestDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const setAuth = (key: string) => {
    setDraft((d) => {
      const others = d.headers.filter((h) => h.name.trim().toLowerCase() !== "authorization");
      return { ...d, headers: [...others, { name: "Authorization", value: `Bearer ${key}`, enabled: true }] };
    });
    setEdit("headers");
  };

  const loadChallenge = (id: string) => {
    const c = CHALLENGES.find((x) => x.id === id);
    if (!c) return;
    setActive(id);
    setDraft(structuredCloneDraft(c.start));
    setCondition(c.condition ?? "normal");
    setAutoRetry(false);
    setSeen([]);
    setResult(null);
    setEdit(c.id === "no-key" ? "headers" : c.start.body ? "body" : "params");
  };

  const record = useCallback((d: RequestDraft, res: MockResponse, viaRetry: boolean, statuses: number[]) => {
    const nextSeen = [...seen, ...statuses];
    setSeen(nextSeen);
    if (!active) return;
    const def = CHALLENGES.find((c) => c.id === active);
    if (!def || solved.includes(active)) return;
    if (def.isSolved({ draft: d, res, viaRetry, seen: nextSeen })) {
      const nextSolved = [...solved, active];
      setSolved(nextSolved);
      if (!completed.current && challengeIds.every((id) => nextSolved.includes(id))) {
        completed.current = true;
        onComplete?.(`Fixed ${nextSolved.length} request${nextSolved.length === 1 ? "" : "s"}`);
      }
    }
  }, [seen, active, solved, challengeIds, onComplete]);

  const addHistory = (d: RequestDraft, res: MockResponse) => {
    counter.current += 1;
    const item: HistoryItem = { n: counter.current, method: d.method, path: d.path, label: res.kind === "response" ? String(res.status) : res.kind, tone: statusTone(res) };
    setHistory((h) => [item, ...h].slice(0, 12));
  };

  const send = async () => {
    if (sending) return;
    const snapshot = structuredCloneDraft(draft);
    const now = Date.now() + clockOffset.current;
    let res: MockResponse;
    let attempts: Attempt[] | undefined;
    if (autoRetry) {
      const r = runWithRetry((w) => handleRequest(snapshot, server.current, { now: now + w, condition, clientTimeoutMs: timeoutMs }), { maxAttempts: 4 });
      clockOffset.current += r.waitedMs;
      res = r.final;
      attempts = r.attempts;
      for (const a of r.attempts) addHistory(snapshot, a.res);
    } else {
      res = handleRequest(snapshot, server.current, { now, condition, clientTimeoutMs: timeoutMs });
      addHistory(snapshot, res);
    }
    setSending(res.kind === "timeout" ? `Waiting… (simulating ${timeoutMs / 1000} s)` : "Sending…");
    await new Promise((r) => setTimeout(r, res.kind === "timeout" ? 1200 : Math.min(700, 150 + res.ms / 4)));
    setSending(null);
    setResult({ res, attempts, draft: snapshot, timeoutMs });
    setRespTab("body");
    const statuses = (attempts ?? [{ res }]).map((a) => (a.res.kind === "response" ? a.res.status : 0));
    record(snapshot, res, !!attempts && attempts.length > 1, statuses);
  };

  const burst = () => {
    if (sending) return;
    const snapshot = structuredCloneDraft(draft);
    const base = Date.now() + clockOffset.current;
    const statuses: number[] = [];
    let last: MockResponse | null = null;
    for (let i = 0; i < 8; i++) {
      last = handleRequest(snapshot, server.current, { now: base + i * 40, condition, clientTimeoutMs: timeoutMs });
      statuses.push(last.kind === "response" ? last.status : 0);
      addHistory(snapshot, last);
    }
    if (!last) return;
    setResult({ res: last, draft: snapshot, timeoutMs });
    setRespTab("headers");
    record(snapshot, last, false, statuses);
  };

  const resetAll = () => {
    server.current = createServerState();
    clockOffset.current = 0;
    setHistory([]);
    setResult(null);
    setSeen([]);
  };

  const inspectCode = inspect === "raw" ? rawHttp(draft) : inspect === "fetch" ? fetchCode(draft) : inspect === "curl" ? curlCommand(draft) : "";
  const explain = result ? explainResponse(result.res, result.timeoutMs) : null;
  const usage = result?.res.kind === "response" && result.res.status === 200 && result.draft.host === MODEL_HOST
    ? (result.res.body as { usage?: { input_tokens: number; output_tokens: number }; model?: string })
    : null;
  const price = usage?.model ? MOCK_MODELS.find((m) => m.id === usage.model) : undefined;
  const activeDef = CHALLENGES.find((c) => c.id === active);

  return (
    <div className="@container space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
        <SimBadge label="Simulated API" />
        <span>Runs entirely in your browser. No real server is contacted and the keys below only work here.</span>
      </div>

      {/* ---------------- Challenges ---------------- */}
      {challengeDefs.length > 0 && (
        <section aria-label="Challenges" className="rounded-xl border border-line bg-bg/60 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Challenges: fix the broken request{challengeDefs.length > 1 ? "s" : ""}</h3>
            <span className="text-xs text-ink-3">{solved.filter((s) => challengeIds.includes(s)).length}/{challengeDefs.length} fixed</span>
          </div>
          <div className="grid gap-2 @2xl:grid-cols-3">
            {challengeDefs.map((c) => {
              const done = solved.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => loadChallenge(c.id)}
                  aria-pressed={active === c.id}
                  className={cx(
                    "rounded-lg border p-2.5 text-left text-sm transition-colors hover:border-accent",
                    active === c.id ? "border-accent bg-accent-soft/40" : "border-line",
                  )}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-label="Fixed" /> : <Circle className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />}
                    {c.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-3">{active === c.id ? "Loaded below" : "Load this request"}</span>
                </button>
              );
            })}
          </div>
          {activeDef && (
            <div className="mt-2 rounded-lg bg-sunken px-3 py-2 text-sm" aria-live="polite">
              <p className="text-ink-2">{activeDef.brief}</p>
              <p className="mt-1 font-medium">
                Goal: {activeDef.goal}{" "}
                {solved.includes(activeDef.id) && <span className="text-ok">Fixed. Well done.</span>}
              </p>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-4 @3xl:grid-cols-2">
        {/* ---------------- Builder ---------------- */}
        <section aria-label="Request builder" className="min-w-0 space-y-3 rounded-xl border border-line p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">Examples</span>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setDraft(preset(p.id)); setActive(null); setEdit(p.draft.body ? "body" : "params"); }}
                className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-2 hover:bg-sunken"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Segmented<HttpMethod> label="HTTP method" size="sm" value={draft.method} onChange={(m) => update({ method: m })} options={METHODS.map((m) => ({ value: m, label: m }))} />
            <div className="flex flex-wrap items-center gap-1 font-mono text-[12.5px]">
              <span className="text-ink-3">https://</span>
              <select
                value={draft.host}
                onChange={(e) => update({ host: e.target.value })}
                aria-label="Host"
                className="min-w-0 max-w-full rounded-md border border-line bg-bg px-1.5 py-1.5"
              >
                {HOSTS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <input
                value={draft.path}
                onChange={(e) => update({ path: e.target.value })}
                aria-label="Path"
                spellCheck={false}
                className="min-w-[9rem] flex-1 rounded-md border border-line bg-bg px-2 py-1.5"
              />
            </div>
          </div>

          <div>
            <Segmented<EditTab>
              label="Edit part of the request"
              size="sm"
              value={edit}
              onChange={setEdit}
              options={[
                { value: "params", label: `Query (${draft.query.filter((q) => q.enabled).length})` },
                { value: "headers", label: `Headers (${draft.headers.filter((h) => h.enabled).length})` },
                { value: "body", label: "Body" },
              ]}
            />
            <div className="mt-2">
              {edit === "params" && <KVEditor rows={draft.query} onChange={(query) => update({ query })} label="Parameters" namePlaceholder="name" valuePlaceholder="value" />}
              {edit === "headers" && (
                <div className="space-y-3">
                  <KVEditor rows={draft.headers} onChange={(headers) => update({ headers })} label="Headers" namePlaceholder="Header-Name" valuePlaceholder="value" />
                  {!draft.headers.some((h) => h.name.toLowerCase() === "content-type") && (
                    <Button size="sm" variant="subtle" onClick={() => update({ headers: [...draft.headers, { name: "Content-Type", value: "application/json", enabled: true }] })}>
                      <Plus className="h-4 w-4" /> Content-Type: application/json
                    </Button>
                  )}
                  <div className="rounded-lg border border-dashed border-line p-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><KeyRound className="h-4 w-4 text-safety" aria-hidden /> Keys (simulated)</div>
                    <p className="mb-2 text-xs text-ink-3">Click one to put it in the Authorization header. Real keys belong on a server, never in a web page. Lesson 2 shows why.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {KEYS.map((k) => (
                        <button key={k.value} onClick={() => setAuth(k.value)} title={k.note} className="rounded-md border border-line px-2 py-1 text-left text-xs hover:border-accent">
                          <span className="font-medium">{k.label}</span>
                          <span className="block font-mono text-[10.5px] text-ink-3">{k.value.slice(0, 12)}…</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {edit === "body" && (
                <div className="space-y-1.5">
                  <textarea
                    value={draft.body}
                    onChange={(e) => update({ body: e.target.value })}
                    aria-label="Request body (JSON)"
                    spellCheck={false}
                    rows={9}
                    className="w-full rounded-md border border-line bg-bg p-2 font-mono text-[12.5px] leading-relaxed"
                    placeholder='{ "key": "value" }'
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {bodyCheck === null ? (
                      <span className="text-ink-3">Empty body.</span>
                    ) : bodyCheck.ok ? (
                      <span className="text-ok">Valid JSON.</span>
                    ) : (
                      <span className="text-safety">Not valid JSON: {bodyCheck.message}</span>
                    )}
                    {bodyCheck?.ok && (
                      <Button size="sm" variant="ghost" onClick={() => update({ body: JSON.stringify(bodyCheck.value, null, 2) })}>
                        <Wand2 className="h-3.5 w-3.5" /> Tidy
                      </Button>
                    )}
                    {(draft.method === "GET" || draft.method === "DELETE") && draft.body.trim() && (
                      <span className="text-warn">A {draft.method} request normally has no body. This server ignores it.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <details className="rounded-lg border border-line px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">Simulation controls: server condition, timeout, retries</summary>
            <div className="mt-2 space-y-2">
              <Segmented<ServerCondition>
                label="Server condition"
                size="sm"
                value={condition}
                onChange={setCondition}
                options={[
                  { value: "normal", label: "Healthy" },
                  { value: "busy", label: "Busy (503 ×2)" },
                  { value: "broken", label: "Broken (500)" },
                  { value: "slow", label: "Very slow" },
                ]}
              />
              <label className="flex flex-wrap items-center gap-2">
                <Clock className="h-4 w-4 text-ink-3" aria-hidden />
                <span>Your timeout:</span>
                <select value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value))} className="rounded-md border border-line bg-bg px-1.5 py-1">
                  <option value={10_000}>10 seconds</option>
                  <option value={60_000}>60 seconds</option>
                </select>
                <span className="text-xs text-ink-3">The slow server needs 45 s; a gateway in front of it gives up at 30 s.</span>
              </label>
              <Toggle checked={autoRetry} onChange={setAutoRetry} label="Retry automatically with backoff" description="Up to 4 attempts. Retries only 429, 5xx and timeouts. Waits 0.5 s, 1 s, 2 s… or what Retry-After says." />
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={send} disabled={!!sending}>
              <Send className="h-4 w-4" /> {sending ?? "Send request"}
            </Button>
            <Button size="sm" onClick={burst} disabled={!!sending} title="Fire 8 copies of this request almost at once">
              <Zap className="h-4 w-4" /> Send 8 quickly
            </Button>
            <Button size="sm" variant="ghost" onClick={resetAll}>
              <RotateCcw className="h-4 w-4" /> Reset server
            </Button>
          </div>
          <div className="text-xs text-ink-3" aria-live="polite">
            Rate limit for {callerId === "anonymous" ? "callers without a key" : "this key"}: {remaining}/{RATE_LIMIT} requests left in the current {RATE_WINDOW_MS / 1000}-second window.
          </div>
        </section>

        {/* ---------------- Inspector + response ---------------- */}
        <div className="min-w-0 space-y-4">
          <section aria-label="Inspect the request" className="space-y-2 rounded-xl border border-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Inspect the request</h3>
              <Segmented<InspectTab>
                label="Request view"
                size="sm"
                value={inspect}
                onChange={setInspect}
                options={[{ value: "parts", label: "Parts" }, { value: "raw", label: "Raw HTTP" }, { value: "fetch", label: "fetch" }, { value: "curl", label: "curl" }]}
              />
            </div>
            {inspect === "parts" ? (
              <dl className="divide-y divide-line rounded-lg border border-line text-sm">
                {urlParts(draft).map((p) => (
                  <div key={p.label} className="grid grid-cols-[4.5rem_1fr] gap-2 px-2.5 py-1.5">
                    <dt className="font-medium text-ink-2">{p.label}</dt>
                    <dd className="min-w-0">
                      <code className="break-all font-mono text-[12.5px] text-data">{p.value}</code>
                      <span className="block text-xs text-ink-3">{p.note}</span>
                    </dd>
                  </div>
                ))}
                <div className="grid grid-cols-[4.5rem_1fr] gap-2 px-2.5 py-1.5">
                  <dt className="font-medium text-ink-2">Headers</dt>
                  <dd className="text-xs text-ink-3">{draft.headers.filter((h) => h.enabled).map((h) => h.name).join(", ") || "(none)"}. Extra information about the request, like the key and the body's format.</dd>
                </div>
                <div className="grid grid-cols-[4.5rem_1fr] gap-2 px-2.5 py-1.5">
                  <dt className="font-medium text-ink-2">Body</dt>
                  <dd className="text-xs text-ink-3">{draft.body.trim() ? `${draft.body.length} characters of ${bodyCheck?.ok ? "valid" : "INVALID"} JSON` : "(empty)"}. The data you send, usually JSON.</dd>
                </div>
              </dl>
            ) : (
              <>
                <CodeBlock code={inspectCode} lang={inspect === "raw" ? "http" : inspect === "fetch" ? "js" : "bash"} maxHeight={260} />
                <p className="text-xs text-ink-3">
                  {inspect === "raw" && "This is the text that travels to the server. With HTTPS it is encrypted on the way, so people on the network cannot read it, but the server (and your own browser) can."}
                  {inspect === "fetch" && "Real JavaScript you could run on a server (Node.js 18+). Notice the key is read from process.env, never typed into the code."}
                  {inspect === "curl" && "The same request from a terminal. $SHOP_API_KEY / $MODEL_API_KEY are environment variables, so the key stays out of your command history. These hosts are simulated, so this will not work outside the lab."}
                </p>
              </>
            )}
          </section>

          <section aria-label="Response" aria-live="polite" className="space-y-2 rounded-xl border border-line p-3">
            <h3 className="font-semibold">Response</h3>
            {sending && <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"><div className="h-full w-1/3 animate-pulse rounded-full bg-accent" /></div>}
            {!result && !sending && <p className="text-sm text-ink-3">Press <strong>Send request</strong> to see the server's reply.</p>}
            {result && !sending && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={toneBadge[statusTone(result.res)]} className="text-[13px]">{statusLabel(result.res, result.timeoutMs)}</Badge>
                  <span className="text-xs text-ink-3">{result.res.kind === "timeout" ? `${result.timeoutMs / 1000} s` : `${result.res.ms} ms`} (simulated)</span>
                  <span className="text-xs text-ink-3">{result.draft.method} {result.draft.path}</span>
                </div>

                {result.attempts && result.attempts.length > 1 && (
                  <ol className="space-y-1 rounded-lg bg-sunken p-2 text-xs" aria-label="Retry attempts">
                    {result.attempts.map((a) => (
                      <li key={a.n} className="flex flex-wrap gap-x-2">
                        <span className="font-mono">#{a.n}</span>
                        <span className={toneText[statusTone(a.res)]}>{statusLabel(a.res, result.timeoutMs)}</span>
                        {a.decision === "retry" && <span className="text-ink-3">→ wait {(a.waitMs / 1000).toFixed(1)} s{a.res.headers["retry-after"] ? " (Retry-After)" : " (backoff)"}, then retry</span>}
                        {a.decision === "give-up-max-attempts" && <span className="text-safety">→ gave up after {a.n} attempts</span>}
                        {a.decision === "give-up-not-retryable" && <span className="text-ink-3">→ not retryable: fix the request instead</span>}
                        {a.decision === "success" && <span className="text-ok">→ success</span>}
                      </li>
                    ))}
                  </ol>
                )}

                {explain && (
                  <div className={cx("rounded-lg border px-3 py-2 text-sm", explain.tone === "ok" ? "border-ok/40" : explain.tone === "warn" ? "border-warn/50" : "border-safety/40")}>
                    <div className={cx("font-semibold", toneText[explain.tone])}>{explain.title}</div>
                    <p className="text-ink-2">{explain.meaning}</p>
                    {explain.tone !== "ok" && <p className="mt-1 text-ink-2"><strong>What to do:</strong> {explain.fix}</p>}
                  </div>
                )}

                {usage?.usage && (
                  <div className="rounded-lg border border-model/40 px-3 py-2 text-sm">
                    <div className="mb-1 flex flex-wrap items-center gap-2 font-semibold text-model">Usage and cost <Badge tone="warn">Illustrative prices</Badge></div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[12.5px]">
                      <span className="text-ink-3">input_tokens</span><span>{usage.usage.input_tokens}</span>
                      <span className="text-ink-3">output_tokens</span><span>{usage.usage.output_tokens}</span>
                      {price && (
                        <>
                          <span className="text-ink-3">price (in / out)</span><span>${price.inputPerMTok.toFixed(2)} / ${price.outputPerMTok.toFixed(2)} per 1M</span>
                          <span className="text-ink-3">this call</span><span>${estimateCostUSD(usage.usage, price).toFixed(6)}</span>
                          <span className="text-ink-3">1,000 such calls</span><span>${(estimateCostUSD(usage.usage, price) * 1000).toFixed(2)}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-3">The provider tells you the tokens; <em>you</em> work out the cost from its price list. These prices are made up for teaching (USD). Always check your provider&apos;s current pricing page. Token counts here are rough estimates (about 4 characters per token).</p>
                  </div>
                )}

                {result.res.kind === "response" && (
                  <>
                    <Segmented<"body" | "headers"> label="Response view" size="sm" value={respTab} onChange={setRespTab} options={[{ value: "body", label: "Body" }, { value: "headers", label: `Headers (${Object.keys(result.res.headers).length})` }]} />
                    {respTab === "body" ? (
                      result.res.body === null ? <p className="text-sm text-ink-3">(no body)</p> : <JsonView value={result.res.body} maxHeight={260} />
                    ) : (
                      <dl className="divide-y divide-line rounded-lg border border-line font-mono text-[12.5px]">
                        {Object.entries(result.res.headers).map(([k, v]) => (
                          <div key={k} className={cx("grid grid-cols-[minmax(0,10rem)_1fr] gap-2 px-2.5 py-1", (k === "retry-after" || k === "allow" || k === "location") && "bg-accent-soft/40")}>
                            <dt className="truncate text-ink-3">{k}</dt>
                            <dd className="break-all">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {history.length > 0 && (
        <section aria-label="Request history" className="rounded-xl border border-line p-3">
          <h3 className="mb-1.5 text-sm font-semibold">Recent requests (newest first)</h3>
          <ol className="flex flex-wrap gap-1.5">
            {history.map((h) => (
              <li key={h.n} className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11.5px]">
                <span className="text-ink-3">{h.method} {h.path.length > 18 ? h.path.slice(0, 18) + "…" : h.path}</span>{" "}
                <span className={cx("font-semibold", toneText[h.tone])}>{h.label}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

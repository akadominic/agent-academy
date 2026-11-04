"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileCode2, Lock, Play, XCircle } from "lucide-react";
import { runMarketAgent } from "@/engine/agent/presets";
import { DEFAULT_SYSTEM_PROMPT } from "@/engine/agent/loop";
import { createLiveModel } from "@/engine/agent/liveModel";
import { runEvals, type EvalResult } from "@/engine/agent/evals";
import { generateAgentScript } from "@/engine/agent/exportCode";
import { ALL_TOOLS, createMarketDB, type MarketDB } from "@/engine/market/tools";
import { PRODUCTS } from "@/engine/market/catalog";
import type { AgentRun, Faults } from "@/engine/agent/types";
import { getModule } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { moduleStats } from "@/lib/course";
import { Badge, Button, Card, JsonView, Segmented, SimBadge, Toggle, cx } from "@/components/ui/primitives";

const TASKS = [
  "Customer wants 3 bags of rice delivered tomorrow.",
  "How much is 2 kg of sugar and 1 cooking oil?",
  "I need 2 trays of eggs and 3 kg of beans.",
  "Please deliver one bunch of matooke and two bags of posho today.",
  "Hello, can you help me with my shopping?",
];

const FAULTS: { id: string; label: string; faults: Faults }[] = [
  { id: "none", label: "None", faults: {} },
  { id: "timeout", label: "Inventory times out", faults: { timeoutTool: "check_inventory" } },
  { id: "flaky", label: "Inventory fails once (flaky)", faults: { flakyTool: "check_inventory" } },
  { id: "db", label: "Database down", faults: { dbDown: true } },
  { id: "args", label: "Model sends bad arguments", faults: { invalidArgs: true } },
  { id: "wrong", label: "Model picks a wrong tool first", faults: { wrongTool: true } },
  { id: "loop", label: "Runaway model", faults: { ignoreResults: true } },
  { id: "lost", label: "Lost reply on create_order", faults: { lostResponse: true } },
  { id: "inject", label: "Prompt injection in product data", faults: { injection: true, obeyInjection: true } },
  { id: "reject", label: "Owner rejects", faults: { rejectApproval: true } },
];

/** Sandbox features unlock as the learner reaches the module that teaches them. */
const FEATURE_MODULE: Record<string, string> = {
  validate: "m6", approval: "m6", idempotency: "m6", loopGuard: "m7", faults: "m6", untrusted: "m13", evals: "m12", cost: "m14", live: "m5",
};

export function Sandbox() {
  const p = useProgress();
  const [task, setTask] = useState(TASKS[0]);
  const [system, setSystem] = useState(DEFAULT_SYSTEM_PROMPT);
  const [tools, setTools] = useState(["search_products", "check_inventory", "calculate_quote", "create_order"]);
  const [maxSteps, setMaxSteps] = useState(8);
  const [validateArgs, setValidateArgs] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [idempotency, setIdempotency] = useState(true);
  const [loopGuard, setLoopGuard] = useState(true);
  const [markUntrusted, setMarkUntrusted] = useState(true);
  const [fault, setFault] = useState("none");
  const [stock, setStock] = useState<Record<string, number>>(() => createMarketDB().stock);
  const [priceIn, setPriceIn] = useState(3);
  const [priceOut, setPriceOut] = useState(15);
  const [modelKind, setModelKind] = useState<"sim" | "live">("sim");
  const [live, setLive] = useState<{ live: boolean; providers: string[]; needsAccessCode: boolean } | null>(null);
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic");
  const [accessCode, setAccessCode] = useState("");
  const [confirmLive, setConfirmLive] = useState(false);
  const [run, setRun] = useState<(AgentRun & { db: MarketDB }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [evals, setEvals] = useState<EvalResult[] | null>(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then((s) => { setLive(s); if (s.providers?.[0]) setProvider(s.providers[0]); }).catch(() => setLive({ live: false, providers: [], needsAccessCode: false }));
  }, []);

  const unlocked = (feature: string) => {
    if (p.settings.freeRoam) return true;
    const m = getModule(FEATURE_MODULE[feature]);
    if (!m) return true;
    return m.status === "outline" ? Object.keys(p.lessons).length > 0 : moduleStats(m, p).started || moduleStats(m, p).complete;
  };
  const Locked = ({ feature }: { feature: string }) => {
    const m = getModule(FEATURE_MODULE[feature]);
    return <span className="inline-flex items-center gap-1 text-[11px] text-ink-3"><Lock className="h-3 w-3" /> Module {m?.number}</span>;
  };

  async function go() {
    if (modelKind === "live" && !confirmLive) { setConfirmLive(true); return; }
    setConfirmLive(false);
    setBusy(true);
    setError(null);
    try {
      const db = createMarketDB();
      db.stock = { ...stock };
      const r = await runMarketAgent(task, {
        tools, maxSteps, system,
        validateArgs: unlocked("validate") ? validateArgs : true,
        requireApproval: unlocked("approval") ? requireApproval : true,
        idempotency: unlocked("idempotency") ? idempotency : true,
        loopGuard: unlocked("loopGuard") ? loopGuard : true,
        markUntrusted: unlocked("untrusted") ? markUntrusted : true,
        faults: FAULTS.find((f) => f.id === fault)!.faults,
        model: modelKind === "live" ? createLiveModel(provider, accessCode || undefined) : undefined,
        db,
      });
      setRun(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cost = run ? (run.final.tokens.inputTokens * priceIn + run.final.tokens.outputTokens * priceOut) / 1_000_000 : 0;
  const exportCfg = { system, tools: tools.filter((t) => t !== "get_weather"), maxSteps, loopGuard, validateArgs, requireApproval, idempotency, task };

  function download(name: string, text: string, type: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* Configuration */}
      <div className="space-y-4">
        <Card className="space-y-3 p-4">
          <div className="font-semibold">1. Task</div>
          <select value={TASKS.includes(task) ? task : ""} onChange={(e) => e.target.value && setTask(e.target.value)} className="w-full rounded-lg border border-line-strong bg-bg px-3 py-2 text-sm" aria-label="Preset task">
            {TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
            {!TASKS.includes(task) && <option value="">Custom task</option>}
          </select>
          <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={2} className="w-full rounded-lg border border-line-strong bg-bg p-2 text-sm" aria-label="Task text" />
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between font-semibold">2. Model {modelKind === "sim" ? <SimBadge /> : <SimBadge live label="Live" />}</div>
          <Segmented label="Model" value={modelKind} onChange={(v) => { setModelKind(v); setConfirmLive(false); }}
            options={[{ value: "sim", label: "Simulated (free)" }, { value: "live", label: "Live model" }]} />
          {modelKind === "live" && (
            live?.live ? (
              <div className="space-y-2 text-sm">
                <select value={provider} onChange={(e) => setProvider(e.target.value as "anthropic" | "openai")} className="w-full rounded-lg border border-line-strong bg-bg px-2 py-1.5" aria-label="Provider">
                  {live.providers.map((pv) => <option key={pv} value={pv}>{pv}</option>)}
                </select>
                {live.needsAccessCode && <input value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Access code" className="w-full rounded-lg border border-line-strong bg-bg px-2 py-1.5" aria-label="Access code" />}
                <p className="text-xs text-warn">Live runs call a paid API through this app&apos;s server. Each step is one billable request.</p>
              </div>
            ) : (
              <p className="text-sm text-ink-2">Live AI is not configured on this server. See <code className="inline-code">docs/LIVE_AI.md</code> to add an API key on the server side. The simulated model works for everything else.</p>
            )
          )}
          <p className="text-xs text-ink-3">The simulated model follows fixed rules and ignores edits to the instructions below. A live model reads them.</p>
        </Card>

        <Card className="space-y-2 p-4">
          <div className="font-semibold">3. Instructions (system prompt)</div>
          <textarea value={system} onChange={(e) => setSystem(e.target.value)} rows={6} className="w-full rounded-lg border border-line-strong bg-code p-2 font-mono text-[12px] text-code-ink" aria-label="System prompt" />
        </Card>

        <Card className="space-y-2 p-4">
          <div className="font-semibold">4. Tools</div>
          {ALL_TOOLS.map((t) => (
            <label key={t.name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tools.includes(t.name)} onChange={(e) => setTools((ts) => (e.target.checked ? [...ts, t.name] : ts.filter((x) => x !== t.name)))} />
              <span className="font-mono text-[13px]">{t.name}</span>
              {t.sideEffect === "write" && <Badge tone="warn">writes</Badge>}
            </label>
          ))}
        </Card>

        <Card className="space-y-2 p-4">
          <div className="font-semibold">5. Simulated database (stock)</div>
          <div className="grid max-h-48 grid-cols-2 gap-x-3 gap-y-1 overflow-auto text-sm">
            {PRODUCTS.map((pr) => (
              <label key={pr.id} className="flex items-center justify-between gap-2">
                <span className="truncate" title={`${pr.name} (${pr.unit})`}>{pr.name} <span className="text-ink-3">{pr.unit}</span></span>
                <input type="number" min={0} value={stock[pr.id] ?? 0} onChange={(e) => setStock((s) => ({ ...s, [pr.id]: Math.max(0, Number(e.target.value)) }))} className="w-14 rounded border border-line-strong bg-bg px-1 py-0.5 text-right tabular-nums" aria-label={`Stock of ${pr.name} ${pr.unit}`} />
              </label>
            ))}
          </div>
        </Card>

        <Card className="space-y-1 p-4">
          <div className="mb-1 font-semibold">6. Rules & safety</div>
          <label className="block px-1.5 text-sm">
            <span className="flex justify-between"><span className="font-medium">Maximum steps</span><span className="tabular-nums">{maxSteps}</span></span>
            <input type="range" min={1} max={20} value={maxSteps} onChange={(e) => setMaxSteps(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Maximum steps" />
          </label>
          {([
            ["validate", "Validate tool arguments", validateArgs, setValidateArgs],
            ["approval", "Human approval for writes", requireApproval, setRequireApproval],
            ["idempotency", "Idempotency keys for writes", idempotency, setIdempotency],
            ["loopGuard", "Loop guard (stop repeats)", loopGuard, setLoopGuard],
            ["untrusted", "Label tool output as untrusted", markUntrusted, setMarkUntrusted],
          ] as const).map(([f, label, val, set]) => (
            <div key={f} className="flex items-center justify-between">
              {unlocked(f) ? <Toggle checked={val} onChange={set} label={label} /> : <span className="px-1.5 py-1 text-sm text-ink-3">{label}</span>}
              {!unlocked(f) && <Locked feature={f} />}
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <label className="flex flex-1 items-center gap-2 px-1.5 text-sm">
              <span className="font-medium">Test scenario</span>
              <select disabled={!unlocked("faults")} value={fault} onChange={(e) => setFault(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line-strong bg-bg px-2 py-1 text-sm" aria-label="Failure scenario">
                {FAULTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </label>
            {!unlocked("faults") && <Locked feature="faults" />}
          </div>
        </Card>
        <p className="px-1 text-xs text-ink-3">Locked settings use safe defaults until you reach the module that teaches them. Turn on <Link href="/progress" className="text-accent hover:underline">free roam</Link> to unlock everything.</p>
      </div>

      {/* Results */}
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="lg" onClick={go} disabled={busy || (modelKind === "live" && !live?.live) || !task.trim()}>
            <Play className="h-4 w-4" /> {busy ? "Running…" : confirmLive ? "Confirm: run with paid API" : "Run agent"}
          </Button>
          {confirmLive && <Button variant="ghost" onClick={() => setConfirmLive(false)}>Cancel</Button>}
          <Button onClick={() => download("agent-config.json", JSON.stringify({ ...exportCfg, faults: fault, stock }, null, 2), "application/json")}><Download className="h-4 w-4" /> Export config</Button>
          <Button onClick={() => setShowCode((s) => !s)}><FileCode2 className="h-4 w-4" /> Export as code</Button>
        </div>
        {error && <p className="rounded-lg border border-safety/50 p-3 text-sm text-safety">{error}</p>}

        {showCode && (
          <Card className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold">agent.mjs — a standalone Node.js script of this configuration</div>
              <Button size="sm" variant="primary" onClick={() => download("agent.mjs", generateAgentScript(exportCfg), "text/javascript")}><Download className="h-4 w-4" /> Download agent.mjs</Button>
            </div>
            <p className="text-sm text-ink-2">Needs Node.js 18+. Run <code className="inline-code">node agent.mjs</code> for the free simulated model, or set <code className="inline-code">ANTHROPIC_API_KEY</code> and <code className="inline-code">ANTHROPIC_MODEL</code> and add <code className="inline-code">--live</code> to use a real model (billable). It asks you in the terminal before any order is created.</p>
            <JsonView value={generateAgentScript(exportCfg)} maxHeight={360} />
          </Card>
        )}

        {!run ? (
          <Card className="border-dashed p-8 text-center text-ink-2">Configure your agent on the left, then press <strong>Run agent</strong> to see its full trace.</Card>
        ) : (
          <>
            <Card className={cx("p-4", run.final.status === "done" ? "border-ok/50" : "border-warn/60")}>
              <div className="flex flex-wrap items-center gap-2">
                {run.final.status === "done" ? <CheckCircle2 className="h-5 w-5 text-ok" /> : <AlertTriangle className="h-5 w-5 text-warn" />}
                <span className="font-semibold">{run.final.status === "done" ? "Finished" : `Stopped — ${run.final.stopReason}`}</span>
                {modelKind === "sim" ? <SimBadge /> : <SimBadge live label="Live" />}
              </div>
              {run.answer && <p className="mt-2 text-[15px]">“{run.answer}”</p>}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Mini label="Model calls" value={String(run.final.step)} />
                <Mini label="Tool calls" value={String(run.final.toolCalls)} />
                <Mini label="Tokens" value={`${(run.final.tokens.inputTokens + run.final.tokens.outputTokens).toLocaleString()}${modelKind === "sim" ? " (est.)" : ""}`} />
                <Mini label="Orders recorded" value={run.db.orders.map((o) => o.orderId).join(", ") || "none"} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="font-semibold">Cost estimate</div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <label>Input $ per 1M tokens <input type="number" step="0.1" min={0} value={priceIn} onChange={(e) => setPriceIn(Number(e.target.value))} className="ml-1 w-20 rounded border border-line-strong bg-bg px-1" /></label>
                <label>Output $ per 1M tokens <input type="number" step="0.1" min={0} value={priceOut} onChange={(e) => setPriceOut(Number(e.target.value))} className="ml-1 w-20 rounded border border-line-strong bg-bg px-1" /></label>
              </div>
              <p className="mt-2 text-sm">This run ≈ <strong>${cost.toFixed(5)}</strong> · 500 such runs a day ≈ <strong>${(cost * 500 * 30).toFixed(2)}/month</strong> (≈ UGX {Math.round(cost * 500 * 30 * 3700).toLocaleString()} at an assumed UGX 3,700 per USD).</p>
              <p className="mt-1 text-xs text-ink-3">Default prices are ILLUSTRATIVE, not any provider&apos;s current price. Check the provider&apos;s pricing page. Simulated token counts are estimates (≈4 characters per token).</p>
            </Card>

            <Card className="p-4">
              <div className="mb-2 font-semibold">Trace ({run.trace.length} events)</div>
              <ol className="space-y-1.5">
                {run.trace.map((e) => (
                  <li key={e.index}>
                    <details className={cx("rounded-lg border px-3 py-2 text-sm", e.severity === "error" ? "border-safety/50" : e.severity === "warn" ? "border-warn/50" : e.severity === "ok" ? "border-ok/40" : "border-line")}>
                      <summary className="cursor-pointer">
                        <span className="mr-2 font-mono text-xs text-ink-3">#{e.index + 1} · step {e.step}</span>
                        <span className="font-medium">{e.title}</span>
                        <span className="ml-2 text-ink-3">{e.detail.length > 90 ? e.detail.slice(0, 87) + "…" : e.detail}</span>
                      </summary>
                      {e.data !== undefined && <JsonView value={e.data} maxHeight={240} className="mt-2 text-[11.5px]" />}
                    </details>
                  </li>
                ))}
              </ol>
            </Card>
          </>
        )}

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold">Evaluation dataset {!unlocked("evals") && <Locked feature="evals" />}</div>
            <Button size="sm" disabled={!unlocked("evals") || busy} onClick={async () => setEvals(await runEvals({ validateArgs, requireApproval, idempotency, loopGuard, markUntrusted, maxSteps, tools, system }))}>
              Run {7} test cases with these settings
            </Button>
          </div>
          {evals && (
            <ul className="mt-3 space-y-1 text-sm">
              {evals.map((r) => (
                <li key={r.id} className="flex items-start gap-2">
                  {r.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-safety" />}
                  <span><span className="font-medium">{r.name}</span> <span className="text-ink-3">— expected: {r.expect}</span></span>
                </li>
              ))}
              <li className="pt-1 font-medium">{evals.filter((r) => r.passed).length}/{evals.length} passed</li>
            </ul>
          )}
          <p className="mt-2 text-xs text-ink-3">Evaluations always use the simulated model, so they are free and repeatable. Try turning safety controls off and running them again.</p>
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sunken px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className="truncate font-medium tabular-nums">{value}</div>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, Bot, CheckCircle2, Hand, Play, RotateCcw, Server, ShieldAlert, ShieldCheck, Wrench, XCircle } from "lucide-react";
import { createSimulatedModel, resetSimulatedIds } from "@/engine/agent/simulatedModel";
import { DEFAULT_SYSTEM_PROMPT, executeWithTimeout } from "@/engine/agent/loop";
import { validate, safeParseJSON, type SchemaProblem } from "@/engine/agent/jsonSchema";
import { ALL_TOOLS, createMarketDB, type MarketDB } from "@/engine/market/tools";
import { formatUGX, productById } from "@/engine/market/catalog";
import type { Faults, Message, ToolCall, ToolContext } from "@/engine/agent/types";
import { Badge, Button, JsonView, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import { ShowCode } from "@/components/lesson/ShowCode";
import type { LabProps } from "../types";

type Stage = "idle" | "proposed" | "validated" | "awaiting" | "final";

interface LogItem {
  kind: "user" | "proposal" | "validation" | "approval" | "execute" | "result" | "error" | "final" | "note";
  title: string;
  body?: unknown;
}

const MESSAGES = [
  "Customer wants 3 bags of rice delivered tomorrow.",
  "Is there sugar in stock? I need 2 kg.",
  "I need 2 trays of eggs.",
  "Please deliver one bunch of matooke today.",
];

export type ToolLabChallenge = "lifecycle" | "invalid" | "approval" | "idempotency";

export default function ToolLab({ onComplete, challenge = "lifecycle" }: LabProps & { challenge?: ToolLabChallenge }) {
  const [enabled, setEnabled] = useState<string[]>(["search_products", "check_inventory", "calculate_quote", "create_order"]);
  const [message, setMessage] = useState(MESSAGES[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [queue, setQueue] = useState<ToolCall[]>([]);
  const [argsText, setArgsText] = useState("");
  const [problems, setProblems] = useState<SchemaProblem[] | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [justRan, setJustRan] = useState(false);
  const [log, setLog] = useState<LogItem[]>([]);
  const [skipValidation, setSkipValidation] = useState(false);
  const [faults, setFaults] = useState<Faults>({});
  const [useKey, setUseKey] = useState(true);
  const [selectedTool, setSelectedTool] = useState("check_inventory");
  const db = useRef<MarketDB>(createMarketDB());
  const ctx = useRef<ToolContext>({ faults: {}, db: db.current, executions: {} });
  const lastKey = useRef<string | null>(null);
  const proof = useRef({ final: false, rejectedThenFixed: 0, approvalSeen: false, dupPrevented: false, dupCreated: false });
  const [, force] = useState(0);

  const tools = ALL_TOOLS.filter((t) => enabled.includes(t.name));
  const current = queue[0];
  const currentTool = current ? ALL_TOOLS.find((t) => t.name === current.name) : undefined;

  const request = useMemo(
    () => ({
      system: DEFAULT_SYSTEM_PROMPT,
      messages: messages.length ? messages : [{ role: "user", content: message }],
      tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    }),
    [messages, message, tools],
  );

  const add = (item: LogItem) => setLog((l) => [...l, item]);
  const markDone = () => {
    const p = proof.current;
    const ok =
      (challenge === "lifecycle" && p.final) ||
      (challenge === "invalid" && p.rejectedThenFixed >= 2) ||
      (challenge === "approval" && p.approvalSeen && p.final) ||
      (challenge === "idempotency" && p.dupCreated && p.dupPrevented);
    if (ok) onComplete?.(challenge);
  };

  function reset(keepDb = false) {
    resetSimulatedIds();
    setMessages([]);
    setQueue([]);
    setStage("idle");
    setLog([]);
    setProblems(null);
    if (!keepDb) {
      db.current = createMarketDB();
      ctx.current = { faults: {}, db: db.current, executions: {} };
    }
    force((n) => n + 1);
  }

  async function askModel() {
    setJustRan(false);
    const msgs: Message[] = messages.length ? messages : [{ role: "user", content: message }];
    if (!messages.length) {
      setMessages(msgs);
      add({ kind: "user", title: "Customer message", body: message });
    }
    const model = createSimulatedModel({ invalidArgs: faults.invalidArgs });
    const res = await model.complete({ ...request, messages: msgs });
    if (res.type === "final") {
      setMessages([...msgs, { role: "assistant", content: res.text }]);
      add({ kind: "final", title: "Model returned a final answer", body: res.text });
      setStage("final");
      proof.current.final = true;
      markDone();
      return;
    }
    setMessages([...msgs, { role: "assistant", content: "", toolCalls: res.calls }]);
    setQueue(res.calls);
    setArgsText(JSON.stringify(res.calls[0].arguments, null, 2));
    setProblems(null);
    setStage("proposed");
    add({ kind: "proposal", title: `Model proposes: ${res.calls.map((c) => c.name).join(", ")}`, body: res.calls });
  }

  function replyToModel(call: ToolCall, body: Record<string, unknown>) {
    setMessages((m) => [...m, { role: "tool", toolCallId: call.id, toolName: call.name, content: JSON.stringify(body) }]);
    const rest = queue.slice(1);
    setQueue(rest);
    if (rest.length) {
      setArgsText(JSON.stringify(rest[0].arguments, null, 2));
      setStage("proposed");
    } else setStage("idle");
    setProblems(null);
  }

  function parsedArgs(): Record<string, unknown> | null {
    const p = safeParseJSON(argsText);
    if (!p.ok) {
      setProblems([{ path: "$", message: `not valid JSON (${p.error})` }]);
      return null;
    }
    return p.value as Record<string, unknown>;
  }

  function runValidation() {
    if (!current) return;
    if (!currentTool) {
      add({ kind: "error", title: `Unknown tool "${current.name}"`, body: "This agent has no tool with that name, so nothing runs." });
      replyToModel(current, { ok: false, kind: "unknown_tool", error: `No tool named ${current.name}` });
      return;
    }
    const args = parsedArgs();
    if (!args) return;
    const probs = validate(currentTool.inputSchema, args);
    setProblems(probs);
    if (probs.length) {
      add({ kind: "validation", title: "Validation FAILED — tool will not run", body: probs });
      proof.current.rejectedThenFixed = Math.max(proof.current.rejectedThenFixed, 1);
    } else {
      add({ kind: "validation", title: "Validation passed", body: args });
      if (proof.current.rejectedThenFixed === 1) proof.current.rejectedThenFixed = 2;
      setStage(currentTool.sideEffect === "write" ? "awaiting" : "validated");
      if (currentTool.sideEffect === "write") {
        proof.current.approvalSeen = true;
        add({ kind: "approval", title: "Write tool: waiting for the shop owner's approval", body: args });
      }
      markDone();
    }
  }

  function returnErrorToModel() {
    if (!current || !problems?.length) return;
    add({ kind: "note", title: "Error sent back to the model so it can correct itself" });
    replyToModel(current, { ok: false, kind: "validation", error: problems.map((p) => `${p.path} ${p.message}`).join("; ") });
  }

  async function execute(isRetry = false) {
    if (!current || !currentTool) return;
    const args = parsedArgs();
    if (!args) return;
    if (!skipValidation && validate(currentTool.inputSchema, args).length) return;
    const callArgs = { ...args };
    if (currentTool.sideEffect === "write" && useKey) {
      lastKey.current = lastKey.current && isRetry ? lastKey.current : `key-${current.id}`;
      callArgs.idempotencyKey = lastKey.current;
    }
    ctx.current.faults = { ...faults, lostResponse: isRetry ? false : faults.lostResponse };
    ctx.current.executions[currentTool.name] = (ctx.current.executions[currentTool.name] ?? 0) + 1;
    add({ kind: "execute", title: `Server runs ${currentTool.name}${isRetry ? " (retry)" : ""}`, body: callArgs });
    try {
      const result = await executeWithTimeout(currentTool, callArgs, ctx.current, 3000, 1);
      add({ kind: "result", title: `${currentTool.name} returned`, body: result });
      const r = result as { duplicatePrevented?: boolean };
      if (isRetry && r.duplicatePrevented) proof.current.dupPrevented = true;
      if (isRetry && !r.duplicatePrevented && currentTool.name === "create_order") proof.current.dupCreated = true;
      replyToModel(current, { ok: true, result });
      setJustRan(true);
      lastKey.current = null;
      markDone();
    } catch (e) {
      const msg = (e as Error).message;
      add({ kind: "error", title: `${currentTool.name} failed`, body: msg });
      if (/dropped before the response/.test(msg)) {
        add({ kind: "note", title: "The order WAS created, but the reply was lost. Your code doesn't know that. Press Retry to see what happens." });
        setStage("awaiting");
        force((n) => n + 1);
        return;
      }
      replyToModel(current, { ok: false, kind: "error", error: msg });
      setJustRan(true);
    }
  }

  function reject() {
    if (!current) return;
    add({ kind: "approval", title: "Rejected by shop owner — the tool will not run" });
    replyToModel(current, { ok: false, kind: "rejected", error: "A human reviewer rejected this action." });
  }

  const orders = db.current.orders;
  const awaitingLost = log.at(-1)?.kind === "note" && /reply was lost/.test(String(log.at(-1)?.title));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Tool shelf */}
        <div className="space-y-3">
          <div className="rounded-xl border border-line p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wrench className="h-4 w-4 text-tool" /> Tools this agent may use</div>
            {ALL_TOOLS.map((t) => (
              <div key={t.name} className="flex items-center gap-2 py-1">
                <input
                  id={`tool-${t.name}`}
                  type="checkbox"
                  checked={enabled.includes(t.name)}
                  onChange={(e) => setEnabled((en) => (e.target.checked ? [...en, t.name] : en.filter((n) => n !== t.name)))}
                />
                <label htmlFor={`tool-${t.name}`} className="flex-1 font-mono text-[13px]">{t.name}</label>
                {t.sideEffect === "write" && <Badge tone="warn">writes</Badge>}
                <button className="text-xs text-accent hover:underline" onClick={() => setSelectedTool(t.name)}>schema</button>
              </div>
            ))}
            <p className="mt-2 text-xs text-ink-3">Untick a tool and the model can no longer ask for it — <strong>permissions are set by your code</strong>.</p>
          </div>
          <div className="rounded-xl border border-line p-3">
            <div className="mb-1 font-mono text-[13px] font-semibold">{selectedTool}</div>
            <p className="mb-2 text-xs text-ink-2">{ALL_TOOLS.find((t) => t.name === selectedTool)?.description}</p>
            <JsonView value={ALL_TOOLS.find((t) => t.name === selectedTool)?.inputSchema} maxHeight={200} className="text-[11.5px]" />
          </div>
          <div className="rounded-xl border border-line p-2">
            <div className="px-1.5 pb-1 text-sm font-semibold">Break things on purpose</div>
            <Toggle tone="danger" checked={Boolean(faults.invalidArgs)} onChange={(v) => setFaults((f) => ({ ...f, invalidArgs: v }))} label="Model sends sloppy arguments" />
            <Toggle tone="danger" checked={faults.timeoutTool === "check_inventory"} onChange={(v) => setFaults((f) => ({ ...f, timeoutTool: v ? "check_inventory" : undefined }))} label="Inventory service hangs" />
            <Toggle tone="danger" checked={Boolean(faults.lostResponse)} onChange={(v) => setFaults((f) => ({ ...f, lostResponse: v }))} label="Network drops create_order's reply" />
            <Toggle tone="danger" checked={skipValidation} onChange={setSkipValidation} label="Skip validation (unsafe)" />
            <Toggle checked={useKey} onChange={setUseKey} label="Send an idempotency key" description="Lets the server recognise a retry" />
          </div>
        </div>

        {/* Pipeline */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select value={message} onChange={(e) => { setMessage(e.target.value); reset(true); }} className="min-w-0 flex-1 rounded-lg border border-line-strong bg-bg px-3 py-2 text-sm" aria-label="Customer message">
              {MESSAGES.map((m) => <option key={m}>{m}</option>)}
            </select>
            <SimBadge label="Simulated model · real tools" />
            <Button size="sm" variant="ghost" onClick={() => reset()}><RotateCcw className="h-4 w-4" /> Reset</Button>
          </div>

          <Stage n={1} title="Your code sends the request to the model" icon={<Bot className="h-4 w-4 text-model" />} active={stage === "idle"}>
            <p className="mb-2 text-sm text-ink-2">The model receives instructions, the conversation, and tool <em>descriptions</em> — never the tools' code or your database.</p>
            <details className="mb-2 text-sm"><summary className="cursor-pointer text-ink-2">See the exact request ({request.messages.length} messages, {request.tools.length} tools)</summary><JsonView value={request} maxHeight={260} className="mt-2" /></details>
            <Button variant="primary" size="sm" onClick={askModel} disabled={stage !== "idle"}><Play className="h-4 w-4" /> {messages.length ? "Send updated conversation" : "Ask the model"}</Button>
          </Stage>

          <Stage n={2} title="The model proposes a tool call" icon={<Bot className="h-4 w-4 text-model" />} active={stage === "proposed"}>
            {current ? (
              <>
                <p className="mb-2 text-sm text-ink-2">
                  The model chose <code className="inline-code">{current.name}</code>. This is only a <strong>request</strong> — nothing has happened yet. You may edit the arguments to see what validation does.
                </p>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-3" htmlFor="args">Arguments (JSON)</label>
                <textarea id="args" value={argsText} onChange={(e) => { setArgsText(e.target.value); setProblems(null); if (stage !== "proposed") setStage("proposed"); }}
                  rows={5} className="w-full rounded-lg border border-line-strong bg-code p-3 font-mono text-[13px] text-code-ink" spellCheck={false} />
                {queue.length > 1 && <p className="text-xs text-ink-3">+ {queue.length - 1} more call(s) queued after this one.</p>}
              </>
            ) : <p className="text-sm text-ink-3">Waiting for a proposal.</p>}
          </Stage>

          <Stage n={3} title="Your code validates the arguments" icon={<ShieldCheck className="h-4 w-4 text-safety" />} active={stage === "proposed"}>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={runValidation} disabled={stage !== "proposed"}>Validate against schema</Button>
              {skipValidation && current && stage === "proposed" && <Button size="sm" variant="danger" onClick={() => execute()}>Run without validating</Button>}
              {problems && problems.length > 0 && <Button size="sm" onClick={returnErrorToModel}>Send error back to the model</Button>}
            </div>
            {problems && (
              problems.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {problems.map((p, i) => <li key={i} className="flex gap-2 text-safety"><XCircle className="h-4 w-4 shrink-0" /><span><code className="inline-code">{p.path}</code> {p.message}</span></li>)}
                </ul>
              ) : <p className="mt-2 flex items-center gap-2 text-sm text-ok"><CheckCircle2 className="h-4 w-4" /> Arguments match the schema.</p>
            )}
          </Stage>

          <Stage n={4} title="Human approval (write tools only)" icon={<Hand className="h-4 w-4 text-people" />} active={stage === "awaiting"}>
            {stage === "awaiting" && currentTool?.sideEffect === "write" ? (
              <div className="space-y-2">
                <p className="text-sm text-ink-2">
                  <strong>{current?.name}</strong> will change the shop&apos;s records. Mama Achen sees:{" "}
                  {(() => {
                    const a = safeParseJSON(argsText);
                    if (!a.ok) return null;
                    const lines = ((a.value as { lines?: { productId: string; quantity: number }[] }).lines ?? []);
                    return lines.map((l) => `${l.quantity} × ${productById(l.productId)?.name ?? l.productId}`).join(", ");
                  })()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {awaitingLost ? (
                    <Button size="sm" variant="primary" onClick={() => execute(true)}>Retry create_order</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="primary" onClick={() => execute()}>Approve & run</Button>
                      <Button size="sm" variant="danger" onClick={reject}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ) : <p className="text-sm text-ink-3">Read-only tools skip this step. Only tools that change data wait for a person.</p>}
          </Stage>

          <Stage n={5} title="Your server executes the real function" icon={<Server className="h-4 w-4 text-tool" />} active={stage === "validated"}>
            <Button size="sm" variant="primary" onClick={() => execute()} disabled={stage !== "validated"}>Execute {current?.name ?? "tool"}</Button>
            <p className="mt-2 text-xs text-ink-3">The model is not involved here. This is ordinary code running on your server.</p>
          </Stage>

          <Stage n={6} title="The result goes back into the conversation" icon={<ArrowDown className="h-4 w-4 text-data" />} active={justRan && stage === "idle"}>
            <p className="text-sm text-ink-2">The result is added as a <code className="inline-code">tool</code> message. Then go back to step 1 and send the updated conversation.</p>
          </Stage>
        </div>
      </div>

      {/* Event log + database */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-line">
          <div className="border-b border-line px-3 py-2 text-sm font-semibold">Execution log</div>
          <ol className="max-h-[360px] space-y-1.5 overflow-auto p-3 text-sm" aria-live="polite">
            {log.length === 0 && <li className="text-ink-3">Press “Ask the model” to begin.</li>}
            {log.map((l, i) => (
              <li key={i} className={cx("rounded-lg border px-3 py-2",
                l.kind === "error" || (l.kind === "validation" && /FAILED/.test(l.title)) ? "border-safety/50" : l.kind === "final" ? "border-ok/60" : "border-line")}>
                <div className="flex items-center gap-2 font-medium">
                  {l.kind === "error" && <ShieldAlert className="h-4 w-4 text-safety" />}
                  {l.title}
                </div>
                {l.body !== undefined && (typeof l.body === "string" ? <p className="mt-1 text-ink-2">{l.body}</p> : <JsonView value={l.body} maxHeight={150} className="mt-1 text-[11.5px]" />)}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-line">
          <div className="border-b border-line px-3 py-2 text-sm font-semibold">Shop database: orders</div>
          <div className="p-3 text-sm">
            {orders.length === 0 ? <p className="text-ink-3">No orders recorded.</p> : (
              <ul className="space-y-1.5">
                {orders.map((o) => (
                  <li key={o.orderId} className="rounded-lg bg-sunken px-2.5 py-1.5">
                    <span className="font-mono font-semibold">{o.orderId}</span> · {formatUGX(o.totalUGX)}
                    <div className="text-xs text-ink-3">key: {o.idempotencyKey ?? "none"}</div>
                  </li>
                ))}
              </ul>
            )}
            {orders.length > 1 && <p className="mt-2 font-medium text-safety">Duplicate orders! The customer may be charged twice.</p>}
          </div>
        </div>
      </div>

      <ShowCode refId={challenge === "idempotency" ? "tool-order" : "agent-checks"} compact />
    </div>
  );
}

function Stage({ n, title, icon, active, children }: { n: number; title: string; icon: React.ReactNode; active: boolean; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-xl border p-3 transition-colors", active ? "border-accent bg-accent-soft/30" : "border-line")}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs", active ? "bg-accent text-accent-ink" : "bg-sunken text-ink-3")}>{n}</span>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, Bot, CheckCircle2, Circle, GripVertical, Plus, RotateCcw, ShieldAlert, User, Wrench, X, XCircle, Cog } from "lucide-react";
import { Button, JsonView, Segmented, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  HIERARCHY, SCENARIOS, checkOrder, flatten, isValid, payloadRoleList, payloadSeparateSystem,
  type Role, type Scenario,
} from "./messageRoles";

const ROLE_STYLE: Record<Role, { color: string; text: string; icon: typeof User; name: string }> = {
  system: { color: "var(--c-control)", text: "text-control", icon: Cog, name: "system" },
  developer: { color: "var(--c-control)", text: "text-control", icon: Cog, name: "developer" },
  user: { color: "var(--c-people)", text: "text-people", icon: User, name: "user" },
  assistant: { color: "var(--c-model)", text: "text-model", icon: Bot, name: "assistant" },
  tool: { color: "var(--c-tool)", text: "text-tool", icon: Wrench, name: "tool" },
};

function RoleTag({ role }: { role: Role }) {
  const s = ROLE_STYLE[role];
  const Icon = s.icon;
  return (
    <span className={cx("inline-flex items-center gap-1 font-mono text-[11.5px] font-semibold uppercase tracking-wider", s.text)}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {s.name}
    </span>
  );
}

type View = "flat" | "roles" | "system";

export default function MessageRoles({ onComplete, scenario: initialScenario }: LabProps & { scenario?: string }) {
  const [scId, setScId] = useState<Scenario["id"]>(initialScenario === "conflict" ? "conflict" : "normal");
  const [orders, setOrders] = useState<Record<Scenario["id"], string[]>>({ normal: [], conflict: [] });
  const [view, setView] = useState<View>("flat");
  const [showBad, setShowBad] = useState(false);
  const [solved, setSolved] = useState<Record<Scenario["id"], boolean>>({ normal: false, conflict: false });
  const [sawFailure, setSawFailure] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const sc = SCENARIOS[scId];
  const byId = useMemo(() => new Map(sc.messages.map((m) => [m.id, m])), [sc]);
  const order = orders[scId];
  const list = order.map((id) => byId.get(id)!).filter(Boolean);
  const pool = sc.poolOrder.filter((id) => !order.includes(id)).map((id) => byId.get(id)!);
  const checks = checkOrder(list, sc);
  const valid = isValid(list, sc);

  useEffect(() => {
    if (valid && !solved[scId]) setSolved((s) => ({ ...s, [scId]: true }));
  }, [valid, scId, solved]);

  useEffect(() => {
    if (!completed && solved.normal && solved.conflict && sawFailure) {
      setCompleted(true);
      onComplete?.("Built both requests and saw why code checks matter");
    }
  }, [solved, sawFailure, completed, onComplete]);

  function setOrder(next: string[]) {
    setOrders((o) => ({ ...o, [scId]: next }));
  }
  function add(id: string, at?: number) {
    const without = order.filter((x) => x !== id);
    const pos = at === undefined ? without.length : Math.max(0, Math.min(at, without.length));
    setOrder([...without.slice(0, pos), id, ...without.slice(pos)]);
  }
  function move(id: string, delta: number) {
    const i = order.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  }
  function remove(id: string) {
    setOrder(order.filter((x) => x !== id));
  }
  function onDrop(e: DragEvent, at?: number) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id && byId.has(id)) {
      // When moving down within the list, account for the item being removed first.
      const from = order.indexOf(id);
      add(id, at !== undefined && from !== -1 && from < at ? at - 1 : at);
    }
    setDragId(null);
  }
  function dragStart(e: DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDragId(id);
  }

  const payload = view === "roles" ? payloadRoleList(list) : view === "system" ? payloadSeparateSystem(list) : flatten(list);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Scenario"
          value={scId}
          onChange={(v) => { setScId(v); setShowBad(false); }}
          options={[
            { value: "normal", label: <>A normal order {solved.normal && <span className="text-ok">✓</span>}</> },
            { value: "conflict", label: <>“Ignore your instructions” {solved.conflict && sawFailure && <span className="text-ok">✓</span>}</> },
          ]}
        />
        <SimBadge label="Simulated model replies" />
      </div>
      <p className="text-sm text-ink-2">{sc.intro} Drag messages into the request, or use <b>Add</b> and the arrow buttons.</p>

      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Pool */}
        <section aria-label="Messages to choose from" className="min-w-0 rounded-xl border border-dashed border-line-strong p-2.5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) remove(id); setDragId(null); }}
        >
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Messages to choose from</h4>
          {pool.length === 0 && <p className="px-1 py-3 text-sm text-ink-3">All messages are in the request.</p>}
          <ul className="space-y-2">
            {pool.map((m) => (
              <li key={m.id} draggable onDragStart={(e) => dragStart(e, m.id)}
                className="cursor-grab rounded-lg border border-line bg-raised p-2 text-sm shadow-sm"
                style={{ boxShadow: `inset 3px 0 0 ${ROLE_STYLE[m.role].color}` }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />
                  <RoleTag role={m.role} />
                  <span className="truncate text-xs text-ink-3">{m.label}</span>
                  <Button size="sm" variant="subtle" className="ml-auto h-7 shrink-0" onClick={() => add(m.id)} aria-label={`Add ${m.role} message: ${m.label}`}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{m.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Request */}
        <section aria-label="Your request" className="min-w-0 rounded-xl border-2 border-line-strong p-2.5"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e)}
        >
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Your request (top is sent first)</h4>
          {list.length === 0 && <p className="rounded-lg bg-sunken px-3 py-6 text-center text-sm text-ink-3">Empty. Add or drop messages here.</p>}
          <ol className="space-y-2">
            {list.map((m, i) => (
              <li key={m.id} draggable onDragStart={(e) => dragStart(e, m.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.stopPropagation(); onDrop(e, i); }}
                className={cx("rounded-lg border bg-raised p-2 text-sm", dragId === m.id ? "opacity-50" : "", "border-line")}
                style={{ boxShadow: `inset 3px 0 0 ${ROLE_STYLE[m.role].color}` }}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-xs text-ink-3">{i + 1}</span>
                  <RoleTag role={m.role} />
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-3">{m.label}</span>
                  <span className="flex shrink-0 gap-0.5">
                    <Button size="sm" variant="ghost" className="h-7 w-7 px-0" onClick={() => move(m.id, -1)} disabled={i === 0} aria-label={`Move ${m.label} up`}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 px-0" onClick={() => move(m.id, 1)} disabled={i === list.length - 1} aria-label={`Move ${m.label} down`}><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 px-0" onClick={() => remove(m.id)} aria-label={`Remove ${m.label}`}><X className="h-3.5 w-3.5" /></Button>
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-ink-2">{m.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setOrder([])} disabled={list.length === 0}><RotateCcw className="h-3.5 w-3.5" /> Clear</Button>
          </div>
        </section>
      </div>

      <ul className="space-y-1" aria-live="polite" aria-label="Order checks">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />}
            <span className={c.ok ? "text-ink" : "text-ink-2"}>{c.text}<span className="sr-only">{c.ok ? " (done)" : " (not yet)"}</span></span>
          </li>
        ))}
      </ul>

      {/* What the model receives */}
      <section aria-label="What the model receives" className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold">What is sent as one request</h4>
          <Segmented size="sm" label="Payload view" value={view} onChange={setView} options={[
            { value: "flat", label: "As one sequence" },
            { value: "roles", label: "JSON: roles in the list" },
            { value: "system", label: "JSON: separate system field" },
          ]} />
        </div>
        <JsonView value={payload} maxHeight={300} />
        <p className="text-xs text-ink-3">
          {view === "flat" && "Illustrative. The provider turns the messages into one long sequence of tokens with special role markers, which differ from model to model. The model then continues it."}
          {view === "roles" && "Simplified shape in the style of APIs that put every message in one list with a role, including system or developer (OpenAI's Chat Completions works like this). Tool definitions and settings are left out."}
          {view === "system" && "Simplified shape in the style of APIs that take instructions in a separate top-level system field and only allow user and assistant roles in the list; tool results travel inside a user message (Anthropic's Messages API works like this). There is no developer role, so both instruction messages are joined into the system text."}
          {" "}Field names change between providers and versions: check the provider's current documentation.
        </p>
      </section>

      {/* Model reply */}
      {valid && (
        <section className="space-y-3 rounded-xl border border-model/40 p-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Bot className="h-4 w-4 text-model" aria-hidden />
            <span className="text-sm font-semibold">The model's next reply</span>
            <SimBadge />
          </div>
          <div className="rounded-lg bg-sunken px-3 py-2 text-sm">
            {sc.badReply && <div className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-ok">What usually happens</div>}
            {sc.goodReply}
          </div>
          {showBad && sc.badReply && (
            <div className="rounded-lg border border-safety/40 bg-sunken px-3 py-2 text-sm">
              <div className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-safety">When it goes wrong</div>
              {sc.badReply}
            </div>
          )}
          {sc.id === "conflict" && (
            <>
              <p className="text-sm text-ink-2">
                Usually a model ranks the shop's system and developer instructions above the customer's message, so it refuses. <b>Usually is not always.</b> Clever wording, long conversations or a weaker model can still make it obey the user.
              </p>
              <Toggle checked={showBad} onChange={(v) => { setShowBad(v); if (v) setSawFailure(true); }} tone="danger"
                label="Show a failure: the model obeys the customer instead" description="Then watch what the shop's code does with the result." />
              {showBad && (
                <div className="space-y-2 rounded-lg border border-safety/50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-safety"><ShieldAlert className="h-4 w-4" aria-hidden /> The shop's code checks the order before saving it</div>
                  <JsonView value={`const expected = PRICE_LIST.rice * order.quantity; // 110,000 × 3 = 330,000\nif (order.totalUGX !== expected) {\n  reject("Total UGX " + order.totalUGX + " does not match the price list (UGX " + expected + ")");\n}`} />
                  <p className="flex items-start gap-2 text-sm"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-safety" aria-hidden /> <span><b>Blocked by code:</b> total UGX 0 does not match the price list (UGX 330,000). No free rice leaves the shop. Note what code cannot do here: it cannot stop a model from repeating its own instructions, so never put secrets such as passwords or API keys in a prompt.</span></p>
                  <p className="text-xs text-ink-3">Prompts ask. Code enforces. That is why every important rule must also be checked by your program.</p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Hierarchy */}
      <section aria-label="Instruction hierarchy" className="rounded-xl border border-line p-3">
        <h4 className="mb-2 text-sm font-semibold">Who outranks whom (the instruction hierarchy)</h4>
        <ol className="space-y-1.5">
          {HIERARCHY.map((h) => (
            <li key={h.role} className="flex items-start gap-2 text-sm">
              <span className="w-5 shrink-0 text-center font-mono text-ink-3">{h.rank}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:gap-2">
                <span className="shrink-0 sm:w-24"><RoleTag role={h.role} /></span>
                <span className="min-w-0 text-ink-2"><b className="text-ink">{h.who}.</b> {h.note}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-ink-3">Providers differ in the details (some use a developer role, some a separate system field), but the idea is the same: the app builder's rules outrank the user's message, and tool results are data. Models are trained to follow this ordering most of the time, not every time.</p>
      </section>

      <div className="flex flex-wrap gap-3 text-sm" aria-label="Challenge progress">
        <span className={solved.normal ? "text-ok" : "text-ink-3"}>{solved.normal ? "✓" : "○"} Build the normal request</span>
        <span className={solved.conflict ? "text-ok" : "text-ink-3"}>{solved.conflict ? "✓" : "○"} Build the conflict request</span>
        <span className={sawFailure ? "text-ok" : "text-ink-3"}>{sawFailure ? "✓" : "○"} See the failure and the code check</span>
      </div>
    </div>
  );
}

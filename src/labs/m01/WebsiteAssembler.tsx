"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Send, Server, Smartphone, X, XCircle } from "lucide-react";
import { Button, SimBadge, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  PIECES, SLOTS, pieceById, place, removeFrom, runRequest, slotById,
  type PieceId, type Placement, type RunResult, type SlotId,
} from "./assembler";

const KIND_CLASS: Record<string, string> = {
  people: "border-people/60 text-people",
  tool: "border-tool/60 text-tool",
  control: "border-control/60 text-control",
  data: "border-data/60 text-data",
};

export default function WebsiteAssembler({ onComplete }: LabProps) {
  const [placement, setPlacement] = useState<Placement>({});
  const [selected, setSelected] = useState<PieceId | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [shown, setShown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const completed = useRef(false);

  const placedPieces = new Set(Object.values(placement));
  const tray = PIECES.filter((p) => !placedPieces.has(p.id));
  const running = result !== null && shown < result.steps.length;
  const done = result !== null && shown >= result.steps.length;
  const activeSlot = result && shown > 0 ? result.steps[Math.min(shown, result.steps.length) - 1].slot : null;

  useEffect(() => {
    if (!result || shown >= result.steps.length) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setShown((s) => (reduce ? result.steps.length : s + 1)), shown === 0 ? 150 : 650);
    return () => clearTimeout(timer);
  }, [result, shown]);

  useEffect(() => {
    if (done && result?.ok && !completed.current) {
      completed.current = true;
      onComplete?.(`Assembled a working website in ${attempts} attempt${attempts === 1 ? "" : "s"}`);
    }
  }, [done, result, attempts, onComplete]);

  function edit(next: Placement) {
    setPlacement(next);
    setResult(null);
    setShown(0);
  }
  function putIn(slot: SlotId, piece: PieceId | null = selected) {
    if (!piece) return;
    edit(place(placement, slot, piece));
    setSelected(null);
  }
  function send() {
    setAttempts((a) => a + 1);
    setResult(runRequest(placement));
    setShown(0);
  }

  function SlotBox({ id, className }: { id: SlotId; className?: string }) {
    const slot = slotById(id);
    const placed = placement[id];
    const piece = placed ? pieceById(placed) : null;
    const failed = done && result?.failedSlot === id;
    const isActive = running && activeSlot === id;
    const passed = result?.steps.slice(0, shown).some((s) => s.slot === id && s.ok);
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const p = e.dataTransfer.getData("text/plain") as PieceId; if (p) putIn(id, p); }}
        className={cx(
          "rounded-xl border-2 border-dashed p-2.5 transition-colors",
          failed ? "border-safety bg-[color-mix(in_srgb,var(--c-safety)_8%,transparent)]"
            : isActive ? "border-accent bg-accent-soft/50"
            : passed ? "border-ok/70" : "border-line-strong",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">{slot.title}</div>
          {failed && <XCircle className="h-4 w-4 text-safety" aria-label="failed here" />}
          {passed && !failed && <CheckCircle2 className="h-4 w-4 text-ok" aria-label="worked" />}
        </div>
        <div className="text-sm font-medium text-ink-2">{slot.where}</div>
        <div className="mt-2">
          {piece ? (
            <div className={cx("flex items-center justify-between gap-2 rounded-lg border bg-raised px-2.5 py-1.5 text-sm font-semibold", KIND_CLASS[piece.kind])}>
              <span className="min-w-0 break-words">{piece.name}</span>
              <button
                onClick={() => edit(removeFrom(placement, id))}
                className="shrink-0 rounded p-0.5 text-ink-3 hover:bg-sunken hover:text-ink"
                aria-label={`Remove ${piece.name} from ${slot.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => putIn(id)}
              disabled={!selected}
              className="w-full rounded-lg border border-line bg-bg/60 px-2.5 py-1.5 text-left text-sm text-ink-3 enabled:hover:border-accent enabled:hover:text-ink disabled:cursor-default"
              aria-label={selected ? `Place ${pieceById(selected).name} in ${slot.title}, ${slot.where}` : `${slot.title} is empty`}
            >
              {selected ? <>Place <strong className="text-ink">{pieceById(selected).name}</strong> here</> : "Empty: drop a piece here"}
            </button>
          )}
          {piece && selected && selected !== piece.id && (
            <button onClick={() => putIn(id)} className="mt-1 text-xs text-accent underline">Swap in {pieceById(selected).name}</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-prose text-sm text-ink-2">
          Build Mama Achen's shop website. Drag each piece into a slot, or click a piece and then click a slot. Two pieces do not belong anywhere. When you are ready, send a request through what you built.
        </p>
        <SimBadge label="Simulated website" />
      </div>

      <div aria-label="Pieces to place" className="flex min-h-11 flex-wrap gap-2 rounded-xl bg-sunken p-2">
        {tray.map((p) => (
          <button
            key={p.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("text/plain", p.id); setSelected(p.id); }}
            onClick={() => setSelected(selected === p.id ? null : p.id)}
            aria-pressed={selected === p.id}
            title={p.does}
            className={cx(
              "cursor-grab rounded-lg border-2 bg-raised px-3 py-1.5 text-sm font-semibold shadow-sm",
              KIND_CLASS[p.kind],
              selected === p.id && "ring-2 ring-accent ring-offset-1 ring-offset-[var(--bg-sunken)]",
            )}
          >
            {p.name}
          </button>
        ))}
        {tray.length === 0 && <span className="px-1 py-1.5 text-sm text-ink-3">All pieces placed.</span>}
      </div>
      {selected && <p className="text-sm text-ink-2" role="status"><strong>{pieceById(selected).name}</strong> {pieceById(selected).does}. Now choose a slot.</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-people/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-people"><Smartphone className="h-4 w-4" aria-hidden /> Customer's phone</div>
          <SlotBox id="client" />
          <div className="ml-3 mt-2 border-l-2 border-line pl-3">
            <SlotBox id="ui" />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <SlotBox id="lookup" />
          <div className="rounded-lg bg-[color-mix(in_srgb,var(--c-cloud)_8%,transparent)] px-3 py-2 text-center text-xs text-cloud">
            ⇄ The internet carries requests and responses between the phone and the server
          </div>
        </div>
        <div className="rounded-2xl border border-control/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-control"><Server className="h-4 w-4" aria-hidden /> Shop's server computer</div>
          <SlotBox id="server" />
          <div className="mt-2">
            <SlotBox id="store" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={send} disabled={running}>
          <Send className="h-4 w-4" aria-hidden /> Send a request
        </Button>
        <Button variant="ghost" onClick={() => { edit({}); setSelected(null); }}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Start over
        </Button>
        <span className="text-xs text-ink-3">Requests sent: {attempts}</span>
      </div>

      {result && (
        <div className="rounded-xl border border-line p-3" aria-live="polite">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Request log</div>
          <ol className="space-y-1.5">
            {result.steps.slice(0, shown).map((s, i) => (
              <li key={i} className={cx("flex items-start gap-2 text-sm", s.ok ? "text-ink-2" : "text-ink")}>
                {s.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-safety" aria-hidden />}
                <span>{s.ok ? s.text : <><strong className="text-safety">The request broke here. </strong>{s.text}</>}</span>
              </li>
            ))}
            {running && <li className="animate-pulse text-sm text-ink-3">…</li>}
          </ol>
          {done && result.ok && (
            <p className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--c-ok)_10%,transparent)] px-3 py-2 text-sm font-medium text-ink">
              It works! The customer sees the product list. Every piece did one job: the browser asked, DNS found the address, the backend applied the rules, the database remembered, and the frontend showed the result.
            </p>
          )}
          {done && !result.ok && (
            <p className="mt-3 text-sm text-ink-3">Fix that slot and send another request. Later slots were never reached, so they were not checked yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

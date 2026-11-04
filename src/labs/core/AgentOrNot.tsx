"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";

type Bucket = "program" | "model" | "agent" | "human";

const BUCKETS: { id: Bucket; title: string; desc: string; color: string }[] = [
  { id: "program", title: "A normal program", desc: "Fixed steps, predictable input", color: "var(--c-control)" },
  { id: "model", title: "One model call", desc: "Language understanding, no actions", color: "var(--c-model)" },
  { id: "agent", title: "An agent", desc: "Several steps, tools, decisions", color: "var(--c-tool)" },
  { id: "human", title: "A person decides", desc: "AI may assist, not decide", color: "var(--c-people)" },
];

const CARDS: { id: string; text: string; answer: Bucket; why: string }[] = [
  { id: "total", text: "Add up a shopping list using the shop's fixed price list.", answer: "program",
    why: "Arithmetic on known prices is exact and predictable. A short program is cheaper, faster and never 'creative' with numbers." },
  { id: "classify", text: "Label each incoming message as an order, a complaint or a question.", answer: "model",
    why: "Understanding varied wording needs a language model, but one call returning a label is enough — no tools, no loop." },
  { id: "summary", text: "Summarise a long letter from a supplier into three bullet points.", answer: "model",
    why: "One request in, one summary out. Nothing to look up and no action to take." },
  { id: "quotes", text: "Read customer messages, check stock, prepare quotations, and ask the owner before confirming orders.", answer: "agent",
    why: "Messy language + several lookups whose results decide the next step + an action that needs approval. This is agent territory." },
  { id: "reminder", text: "Every Friday at 9 a.m., send an SMS reminder to customers with unpaid balances.", answer: "program",
    why: "Same steps every week on structured data. A scheduled program does it reliably; AI adds cost and risk for no benefit." },
  { id: "suppliers", text: "Visit three suppliers' websites, compare current prices, and draft a recommendation.", answer: "agent",
    why: "The steps depend on what each website shows, which changes. An agent with browsing tools can adapt — and a person reads the draft." },
  { id: "loan", text: "Approve or refuse a UGX 20,000,000 business loan.", answer: "human",
    why: "High stakes, legal responsibility and fairness concerns. AI can gather documents or summarise, but a qualified person must decide." },
  { id: "medical", text: "Decide which medicine a sick child should take, based on symptoms typed by a parent.", answer: "human",
    why: "Medical decisions need a trained health worker who can examine the child. Mistakes can cause serious harm." },
];

export default function AgentOrNot({ onComplete }: LabProps) {
  const [placed, setPlaced] = useState<Record<string, Bucket>>({});
  const [selected, setSelected] = useState<string | null>(CARDS[0].id);
  const [checked, setChecked] = useState(false);

  const unplaced = CARDS.filter((c) => !placed[c.id]);
  const allPlaced = unplaced.length === 0;
  const correct = CARDS.filter((c) => placed[c.id] === c.answer).length;

  function place(bucket: Bucket, cardId = selected) {
    if (!cardId) return;
    setPlaced((p) => ({ ...p, [cardId]: bucket }));
    setChecked(false);
    const nextCard = CARDS.find((c) => !placed[c.id] && c.id !== cardId);
    setSelected(nextCard?.id ?? null);
  }

  function check() {
    setChecked(true);
    if (correct === CARDS.length) onComplete?.("Sorted all scenarios correctly");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Pick a situation, then choose the simplest thing that would do the job well. Drag cards onto a box, or click a card and then a box.
      </p>
      <div className="flex flex-wrap gap-2" aria-label="Situations to sort">
        {unplaced.map((c) => (
          <button
            key={c.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
            onClick={() => setSelected(c.id)}
            aria-pressed={selected === c.id}
            className={cx("max-w-xs rounded-xl border bg-raised px-3 py-2 text-left text-sm shadow-sm", selected === c.id ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-line-strong")}
          >
            {c.text}
          </button>
        ))}
        {allPlaced && <p className="text-sm text-ink-3">All situations placed. Check your answers below.</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BUCKETS.map((b) => (
          <div
            key={b.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => place(b.id, e.dataTransfer.getData("text/plain"))}
            className="flex min-h-[160px] flex-col rounded-xl border-2 border-dashed border-line p-2"
          >
            <button
              onClick={() => place(b.id)}
              disabled={!selected}
              className="mb-2 rounded-lg px-2 py-1.5 text-left hover:bg-sunken disabled:cursor-default disabled:hover:bg-transparent"
              aria-label={`Place selected situation in: ${b.title}`}
            >
              <div className="font-semibold" style={{ color: b.color }}>{b.title}</div>
              <div className="text-xs text-ink-3">{b.desc}</div>
            </button>
            <div className="space-y-1.5">
              {CARDS.filter((c) => placed[c.id] === b.id).map((c) => {
                const ok = c.answer === b.id;
                return (
                  <div key={c.id} className={cx("rounded-lg border px-2 py-1.5 text-xs", !checked && "border-line bg-raised", checked && ok && "border-ok/60 bg-[color-mix(in_srgb,var(--c-ok)_8%,transparent)]", checked && !ok && "border-safety/60 bg-[color-mix(in_srgb,var(--c-safety)_7%,transparent)]")}>
                    <div className="flex gap-1">
                      {checked && (ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ok" /> : <XCircle className="h-3.5 w-3.5 shrink-0 text-safety" />)}
                      <span>{c.text}</span>
                    </div>
                    {checked && <p className="mt-1 text-ink-2">{ok ? c.why : "Think again: is this the simplest option that does the job safely?"}</p>}
                    {!ok && checked && (
                      <button className="mt-1 text-accent underline" onClick={() => { setPlaced((p) => { const n = { ...p }; delete n[c.id]; return n; }); setSelected(c.id); }}>
                        Move it
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={check} disabled={!allPlaced}>Check my sorting</Button>
        <Button variant="ghost" onClick={() => { setPlaced({}); setChecked(false); setSelected(CARDS[0].id); }}><RotateCcw className="h-4 w-4" /> Start over</Button>
        {checked && <span className="text-sm font-medium" role="status">{correct} of {CARDS.length} correct{correct === CARDS.length ? " — excellent judgement." : "."}</span>}
      </div>
    </div>
  );
}

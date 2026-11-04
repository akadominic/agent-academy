"use client";

import { useMemo, useState } from "react";
import { estimateCost, type CostInputs } from "@/engine/cost";
import { Callout, Segmented } from "@/components/ui/primitives";
import type { LabProps } from "../types";

/** Illustrative price tiers. NOT any provider's current prices. */
const TIERS = {
  small: { label: "Small, fast model", in: 0.25, out: 1.25 },
  mid: { label: "Mid-size model", in: 3, out: 15 },
  large: { label: "Large model", in: 15, out: 75 },
} as const;

const fmt = (usd: number) => (usd < 0.01 ? `$${usd.toFixed(5)}` : usd < 100 ? `$${usd.toFixed(2)}` : `$${Math.round(usd).toLocaleString()}`);
const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString("en-US")}`;

export default function CostCalculator({ onComplete }: LabProps) {
  const [tier, setTier] = useState<keyof typeof TIERS>("mid");
  const [c, setC] = useState<CostInputs>({
    inputPricePerM: TIERS.mid.in, outputPricePerM: TIERS.mid.out, inputTokensPerCall: 2000, outputTokensPerCall: 300,
    modelCallsPerTask: 5, toolCallsPerTask: 4, costPerToolCall: 0, tasksPerDay: 500, retryRate: 0.05, hostingPerMonth: 20, ugxPerUsd: 3700,
  });
  const [touched, setTouched] = useState(new Set<string>());
  const r = useMemo(() => estimateCost(c), [c]);
  const set = (k: keyof CostInputs, v: number) => {
    setC((x) => ({ ...x, [k]: v }));
    const t = new Set(touched).add(k);
    setTouched(t);
    if (t.size >= 4) onComplete?.("Explored cost drivers");
  };
  const parts = [
    { label: "Input tokens", v: r.perTask.input, color: "var(--c-model)" },
    { label: "Output tokens", v: r.perTask.output, color: "var(--c-data)" },
    { label: "Tool calls", v: r.perTask.tools, color: "var(--c-tool)" },
  ];
  const sum = parts.reduce((s, p) => s + p.v, 0) || 1;

  const slider = (k: keyof CostInputs, label: string, min: number, max: number, step = 1, unit = "") => (
    <label className="block text-sm">
      <span className="flex justify-between"><span className="font-medium">{label}</span><span className="tabular-nums text-ink-2">{k === "retryRate" ? `${Math.round(c[k]! * 100)}%` : `${c[k]!.toLocaleString()}${unit}`}</span></span>
      <input type="range" min={min} max={max} step={step} value={c[k]} onChange={(e) => set(k, Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label={label} />
    </label>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <p className="text-sm text-ink-2">Scenario: an assistant for a Kampala shop receives customer enquiries every day. Adjust the workload and see what it costs to run.</p>
        <Segmented label="Model tier" value={tier} onChange={(t) => { setTier(t); setC((x) => ({ ...x, inputPricePerM: TIERS[t].in, outputPricePerM: TIERS[t].out })); }}
          options={Object.entries(TIERS).map(([value, t]) => ({ value: value as keyof typeof TIERS, label: t.label }))} />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label>Input $/1M tokens <input type="number" min={0} step={0.05} value={c.inputPricePerM} onChange={(e) => set("inputPricePerM", Number(e.target.value))} className="mt-0.5 w-full rounded border border-line-strong bg-bg px-2 py-1" /></label>
          <label>Output $/1M tokens <input type="number" min={0} step={0.05} value={c.outputPricePerM} onChange={(e) => set("outputPricePerM", Number(e.target.value))} className="mt-0.5 w-full rounded border border-line-strong bg-bg px-2 py-1" /></label>
        </div>
        {slider("tasksPerDay", "Enquiries per day", 10, 5000, 10)}
        {slider("modelCallsPerTask", "Model calls per enquiry (loop steps)", 1, 15, 1)}
        {slider("inputTokensPerCall", "Input tokens per call", 200, 20000, 100)}
        {slider("outputTokensPerCall", "Output tokens per call", 20, 2000, 10)}
        {slider("toolCallsPerTask", "Tool calls per enquiry", 0, 15, 1)}
        <label className="block text-sm">Cost per tool call (e.g. a paid SMS or API), USD
          <input type="number" min={0} step={0.001} value={c.costPerToolCall} onChange={(e) => set("costPerToolCall", Number(e.target.value))} className="mt-0.5 w-full rounded border border-line-strong bg-bg px-2 py-1" />
        </label>
        {slider("retryRate", "Enquiries retried (errors)", 0, 0.5, 0.01)}
        {slider("hostingPerMonth", "Hosting per month", 0, 200, 1, " USD")}
        <label className="block text-sm">Exchange-rate assumption (UGX per USD)
          <input type="number" min={1} value={c.ugxPerUsd} onChange={(e) => set("ugxPerUsd", Number(e.target.value))} className="mt-0.5 w-full rounded border border-line-strong bg-bg px-2 py-1" />
        </label>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Out label="Per enquiry" usd={fmt(r.perTask.total)} ugx={ugx(r.perTaskUGX)} />
          <Out label="Per day" usd={fmt(r.perDay)} ugx={ugx(r.perDay * c.ugxPerUsd)} />
          <Out label="Per month (incl. hosting)" usd={fmt(r.perMonth)} ugx={ugx(r.perMonthUGX)} big />
          <Out label="Tokens per day" usd={r.tokensPerDay.toLocaleString()} ugx="model input + output" />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">Where the money goes (per enquiry)</div>
          <div className="flex h-6 overflow-hidden rounded-lg" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.v / sum) * 100)}%`).join(", ")}>
            {parts.map((p) => <div key={p.label} style={{ width: `${(p.v / sum) * 100}%`, background: p.color }} />)}
          </div>
          <ul className="mt-2 space-y-0.5 text-sm">
            {parts.map((p) => <li key={p.label} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: p.color }} />{p.label}: {Math.round((p.v / sum) * 100)}% ({fmt(p.v)})</li>)}
          </ul>
        </div>
        <Callout tone="tip" title="Things to try">
          Halve the input tokens per call (shorter instructions, fewer old messages): how much do you save? Then switch to the large model. Then raise the loop steps from 5 to 12, as a runaway loop would.
        </Callout>
        <Callout tone="cost" title="Illustrative, not real prices">
          The tier prices are made-up round numbers chosen for teaching. Real prices differ by provider and model, and they change over time, so check the provider&apos;s pricing page. The UGX figures use your exchange-rate assumption above.
        </Callout>
      </div>
    </div>
  );
}

function Out({ label, usd, ugx, big }: { label: string; usd: string; ugx: string; big?: boolean }) {
  return (
    <div className={big ? "col-span-2 rounded-xl bg-accent-soft/60 p-3" : "rounded-xl bg-sunken p-3"}>
      <div className="text-[11px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className={big ? "font-display text-3xl font-semibold tabular-nums" : "text-lg font-semibold tabular-nums"}>{usd}</div>
      <div className="text-xs text-ink-3">{ugx}</div>
    </div>
  );
}

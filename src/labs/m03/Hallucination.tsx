"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Bot, CheckCircle2, Circle, Cog, RefreshCw, Wrench, XCircle } from "lucide-react";
import { Button, JsonView, Segmented, SimBadge, Toggle, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import { RECORDS, SHOP_QUESTIONS, VERDICT_LABEL, gradeLabels, lookupRecords, type Verdict } from "./hallucination";

const VERDICT_OPTIONS: { value: Verdict; label: string }[] = [
  { value: "match", label: "Matches" },
  { value: "contradicts", label: "Contradicts" },
  { value: "missing", label: "Not in records" },
];

function RecordsTable({ highlight = [], only }: { highlight?: string[]; only?: string[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-data/40">
      <table className="w-full min-w-[300px] text-left text-sm">
        <caption className="px-3 py-1.5 text-left text-xs font-semibold text-data">{only ? "Returned by the tool" : "Mama Achen\u2019s shop records (fictional)"}</caption>
        <tbody>
          {RECORDS.filter((r) => !only || only.includes(r.id)).map((r) => (
            <tr key={r.id} className={cx("border-t border-line align-top", highlight.includes(r.id) && "bg-[color-mix(in_srgb,var(--c-data)_12%,transparent)]")}>
              <th scope="row" className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">{r.id}</th>
              <td className="px-2 py-1.5"><span className="font-medium">{r.topic}:</span> {r.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Hallucination({ onComplete }: LabProps) {
  const [qid, setQid] = useState(SHOP_QUESTIONS[0].id);
  const [useTool, setUseTool] = useState(false);
  const [variant, setVariant] = useState(0);
  const [asked, setAsked] = useState(false);
  const [labels, setLabels] = useState<(Verdict | undefined)[]>([]);
  const [checked, setChecked] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [usedTool, setUsedTool] = useState(false);
  const [done, setDone] = useState(false);

  const q = SHOP_QUESTIONS.find((x) => x.id === qid)!;
  const claims = q.ungrounded[variant];
  const grade = useMemo(() => gradeLabels(claims, labels), [claims, labels]);
  const found = useMemo(() => lookupRecords(q.text), [q.text]);
  const key = `${qid}:${variant}`;

  useEffect(() => {
    if (solved.size >= 2 && usedTool && !done) { setDone(true); onComplete?.("Checked fluent answers against the records and used the lookup tool"); }
  }, [solved, usedTool, done, onComplete]);

  const clear = () => { setLabels([]); setChecked(false); };
  const ask = () => { setAsked(true); clear(); if (useTool) setUsedTool(true); };
  const askAgain = () => { setVariant((v) => (v + 1) % q.ungrounded.length); clear(); };
  const check = () => {
    setChecked(true);
    if (gradeLabels(claims, labels).allCorrect) setSolved((s) => new Set(s).add(key));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Simulated model" />
        <span className="text-xs text-ink-3">The answers were written by hand to show typical behaviour. The lookup tool and the records are real code and data in this lab.</span>
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium">Customer question</div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Questions">
          {SHOP_QUESTIONS.map((x) => (
            <button key={x.id} aria-pressed={x.id === qid} onClick={() => { setQid(x.id); setVariant(0); setAsked(false); clear(); }}
              className={cx("rounded-full border px-3 py-1 text-left text-sm", x.id === qid ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:bg-sunken")}>
              {x.text}
              {(solved.has(`${x.id}:0`) || solved.has(`${x.id}:1`)) && <span className="ml-1 text-ok">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sunken px-3 py-2">
        <Toggle checked={useTool} onChange={(v) => { setUseTool(v); setAsked(false); clear(); }} label="Verify with shop records"
          description="Give the model a lookup tool. Code fetches the record; the answer must come from it." />
        <Button variant="primary" onClick={ask}>Ask</Button>
      </div>

      {asked && !useTool && (
        <div className="space-y-3">
          <div className="rounded-xl border border-model/40 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-model"><Bot className="h-3.5 w-3.5" /> Model (no lookup)</div>
            <p className="text-[15px]">{claims.map((c) => c.text).join(" ")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="ghost" onClick={askAgain}><RefreshCw className="h-4 w-4" /> Ask the same question again</Button>
              <span className="text-xs text-ink-3">Watch whether the “facts” change.</span>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-accent/40 p-3">
            <p className="text-sm"><b>Check each claim against the records.</b> The model never saw them, but you can.</p>
            <Button size="sm" onClick={() => setShowRecords((s) => !s)} aria-expanded={showRecords}><BookOpen className="h-4 w-4" /> {showRecords ? "Hide" : "Open"} the shop records</Button>
            {showRecords && <RecordsTable />}
            <ol className="space-y-2">
              {claims.map((c, i) => (
                <li key={`${key}-${i}`} className={cx("rounded-lg border p-2.5", checked ? (grade.correct[i] ? "border-ok/50" : "border-safety/50") : "border-line")}>
                  <p className="mb-1.5 text-sm">“{c.text}”</p>
                  <Segmented size="sm" label={`Label for claim ${i + 1}`} value={labels[i] ?? ("" as Verdict)}
                    onChange={(v) => { const next = [...labels]; next[i] = v; setLabels(next); setChecked(false); }}
                    options={VERDICT_OPTIONS} />
                  {checked && (
                    <p className={cx("mt-1.5 flex items-start gap-1 text-xs", grade.correct[i] ? "text-ok" : "text-safety")}>
                      {grade.correct[i] ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                      <span>{grade.correct[i] ? `${VERDICT_LABEL[c.verdict]}. ` : "Look again. "}{grade.correct[i] && c.explain}</span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="primary" onClick={check} disabled={labels.filter(Boolean).length < claims.length}>Check my labels</Button>
              {checked && grade.allCorrect && <span className="text-sm text-ok">All correct. Every one of these claims was <b>unsupported</b> when the model wrote it, even the ones that happen to match.</span>}
            </div>
          </div>
        </div>
      )}

      {asked && useTool && (
        <ol className="space-y-2" aria-label="Grounded answer trace">
          <li className="rounded-lg border border-model/40 p-2.5 text-sm">
            <div className="flex items-center gap-1.5 font-medium"><Bot className="h-4 w-4 text-model" /> 1. The model asks for the tool <span className="text-xs font-normal text-ink-3">(simulated)</span></div>
            <JsonView className="mt-1.5" value={{ type: "tool_use", name: "lookup_shop_records", input: { question: q.text } }} maxHeight={200} />
          </li>
          <li className="rounded-lg border border-tool/40 p-2.5 text-sm">
            <div className="flex items-center gap-1.5 font-medium"><Wrench className="h-4 w-4 text-tool" /> 2. Your code runs the lookup <span className="text-xs font-normal text-ink-3">(real code)</span></div>
            {found.length ? <div className="mt-1.5"><RecordsTable only={found.map((r) => r.id)} /></div> : <p className="mt-1 text-ink-2">No record matches. The tool returns an empty list.</p>}
          </li>
          <li className="rounded-lg border-2 border-ok/50 p-2.5 text-sm">
            <div className="flex items-center gap-1.5 font-medium"><Cog className="h-4 w-4 text-control" /> 3. Answer built only from the result</div>
            <p className="mt-1 text-[15px]">
              {q.grounded.text} {q.grounded.cites.map((c) => <span key={c} className="rounded bg-[color-mix(in_srgb,var(--c-data)_16%,transparent)] px-1 font-mono text-xs text-data">[{c}]</span>)}
            </p>
            <p className="mt-1 text-xs text-ink-3">{q.grounded.cites.length ? "The citation lets anyone check the answer against the record." : "With no record, the honest answer is “I cannot confirm”. That is a success, not a failure."}</p>
          </li>
        </ol>
      )}

      <div className="rounded-xl border border-accent/40 p-3 text-sm">
        <div className="mb-1 font-semibold">Challenge</div>
        <p className="text-ink-2">Correctly label every claim in <b>two</b> different no-lookup answers, then ask any question <b>with</b> the lookup tool.</p>
        <ul className="mt-2 flex flex-wrap gap-3">
          <li className="inline-flex items-center gap-1">{solved.size >= 2 ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} {Math.min(solved.size, 2)}/2 answers checked</li>
          <li className="inline-flex items-center gap-1">{usedTool ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />} Used the lookup tool</li>
        </ul>
      </div>
    </div>
  );
}

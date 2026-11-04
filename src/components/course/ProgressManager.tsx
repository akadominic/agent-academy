"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { MODULES } from "@/content/curriculum";
import { progress, useProgress } from "@/lib/progress";
import { moduleStats, overall, reviewList } from "@/lib/course";
import { Button, Card, ProgressBar, Toggle } from "@/components/ui/primitives";

export function ProgressManager() {
  const p = useProgress();
  const o = overall(p);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  function download() {
    const blob = new Blob([progress.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agent-academy-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-16 pt-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Your progress</h1>
      <p className="mt-2 text-ink-2">Progress is stored only in this browser. Export it to keep a backup or move to another device.</p>

      <Card className="mt-6 p-5">
        <div className="mb-1 flex justify-between text-sm"><span className="font-medium">Overall</span><span className="tabular-nums text-ink-3">{o.done}/{o.total} lessons</span></div>
        <ProgressBar value={o.ratio} label="Overall progress" />
        <ul className="mt-4 space-y-2 text-sm">
          {MODULES.filter((m) => m.status === "complete").map((m) => {
            const s = moduleStats(m, p);
            return (
              <li key={m.id} className="flex items-center gap-3">
                <Link href={`/learn/${m.id}`} className="w-56 shrink-0 truncate hover:text-accent">{m.number}. {m.short}</Link>
                <ProgressBar value={s.total ? s.done / s.total : 0} className="flex-1" label={`Module ${m.number} progress`} />
                <span className="w-10 text-right tabular-nums text-ink-3">{s.done}/{s.total}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-semibold">Review queue</h2>
        {reviewList(p).length === 0 ? <p className="mt-1 text-sm text-ink-2">Nothing due right now.</p> : (
          <ul className="mt-2 space-y-1 text-sm">
            {reviewList(p).map(({ lesson, reason }) => (
              <li key={lesson.id}><Link className="text-accent hover:underline" href={`/learn/${lesson.moduleId}/${lesson.id}?review=1`}>{lesson.title}</Link> <span className="text-ink-3">({reason === "weak" ? "first-try score under 80%" : "spaced review due"})</span></li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 space-y-4 p-5">
        <h2 className="font-semibold">Settings & data</h2>
        <Toggle checked={p.settings.freeRoam} onChange={(v) => progress.setFreeRoam(v)} label="Free roam" description="Open every module without the 'previewing ahead' notice. Recommended order is still shown." />
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}><Download className="h-4 w-4" /> Export progress</Button>
          <Button onClick={() => file.current?.click()}><Upload className="h-4 w-4" /> Import progress</Button>
          <input ref={file} type="file" accept="application/json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = progress.importJSON(await f.text());
            setMsg(r.ok ? "Progress imported." : `Import failed: ${r.error}`);
          }} />
          {!confirm ? (
            <Button variant="ghost" onClick={() => setConfirm(true)}><RotateCcw className="h-4 w-4" /> Reset progress</Button>
          ) : (
            <span className="flex items-center gap-2 text-sm">
              Delete all progress in this browser?
              <Button size="sm" variant="danger" onClick={() => { progress.reset(); setConfirm(false); setMsg("Progress reset."); }}>Yes, reset</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            </span>
          )}
        </div>
        {msg && <p className="text-sm text-ok" role="status">{msg}</p>}
      </Card>
    </div>
  );
}

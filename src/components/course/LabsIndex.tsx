"use client";

import Link from "next/link";
import { FlaskConical, WifiOff } from "lucide-react";
import { LABS } from "@/labs/registry";
import { MODULES, getModule } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { MODE_META, ModeTag } from "@/components/ui/primitives";
import type { Mode } from "@/content/schema";

export function LabsIndex() {
  const p = useProgress();
  const planned = MODULES.flatMap((m) => m.labs.filter((id) => !LABS.some((l) => l.id === id)).map((id) => ({ id, m })));
  const modes: Mode[] = ["understand", "experiment", "build"];
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Labs</h1>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">Interactive experiments you can open any time. Every lab here works offline and without an API key.</p>
      {modes.map((mode) => {
        const labs = LABS.filter((l) => l.mode === mode).sort((a, b) => (getModule(a.moduleId)?.number ?? 0) - (getModule(b.moduleId)?.number ?? 0));
        if (!labs.length) return null;
        return (
          <section key={mode} className="mt-8">
            <h2 className="flex items-baseline gap-3"><ModeTag mode={mode} /><span className="text-sm text-ink-3">{MODE_META[mode].desc}</span></h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {labs.map((l) => (
                <Link key={l.id} href={`/labs/${l.id}`} className="flex flex-col rounded-2xl border border-line bg-raised p-4 hover:border-line-strong">
                  <div className="flex items-center gap-2 text-xs text-ink-3">
                    <span>Module {getModule(l.moduleId)?.number}</span>
                    {l.offline && <span className="inline-flex items-center gap-1"><WifiOff className="h-3 w-3" /> offline</span>}
                    {p.labs[l.id] && <span className="ml-auto text-ok">visited</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4 text-tool" /> {l.title}</div>
                  <p className="mt-1 text-sm text-ink-2">{l.short}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {planned.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-3">Planned labs (not built yet)</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {planned.map(({ id, m }) => <span key={id} className="rounded-full border border-dashed border-line px-3 py-1 text-sm text-ink-3">{id} · Module {m.number}</span>)}
          </div>
        </section>
      )}
    </div>
  );
}

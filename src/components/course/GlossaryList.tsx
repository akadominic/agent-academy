"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GLOSSARY } from "@/content/glossary";
import { getModule } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { masteredTerms } from "@/lib/course";
import { Badge } from "@/components/ui/primitives";

export function GlossaryList() {
  const [q, setQ] = useState("");
  const p = useProgress();
  const mastered = new Set(masteredTerms(p).map((t) => t.id));
  const terms = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...GLOSSARY]
      .filter((t) => !s || t.term.toLowerCase().includes(s) || t.short.toLowerCase().includes(s))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [q]);

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-16 pt-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Glossary</h1>
      <p className="mt-2 text-lg text-ink-2">{GLOSSARY.length} terms, each explained in plain language. Terms you have mastered are marked.</p>
      <label className="mt-6 flex items-center gap-2 rounded-xl border border-line-strong bg-raised px-3 py-2">
        <Search className="h-4 w-4 text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms…" className="w-full bg-transparent outline-none" aria-label="Search glossary" />
      </label>
      <dl className="mt-6 divide-y divide-line">
        {terms.map((t) => {
          const m = getModule(t.moduleId);
          return (
            <div key={t.id} id={t.id} className="scroll-mt-24 py-4 target:rounded-xl target:bg-accent-soft/40 target:px-3">
              <dt className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{t.term}</span>
                {m && <Link href={`/learn/${m.id}`} className="text-xs text-ink-3 hover:text-accent">Module {m.number}</Link>}
                {mastered.has(t.id) && <Badge tone="ok">mastered</Badge>}
              </dt>
              <dd className="mt-1 text-[15px] text-ink-2">{t.short}</dd>
              {t.long && <dd className="mt-1 text-sm text-ink-2">{t.long}</dd>}
              {t.analogy && <dd className="mt-1 text-sm italic text-ink-3">Everyday picture: {t.analogy}</dd>}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

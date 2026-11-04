"use client";

import Link from "next/link";
import { CheckCircle2, Hammer } from "lucide-react";
import { PROJECTS, PLANNED_PROJECTS } from "@/content/projects";
import { getModule } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { Badge } from "@/components/ui/primitives";

export function ProjectsIndex() {
  const p = useProgress();
  const all = [
    ...PROJECTS.map((pr) => ({ ...pr, built: true })),
    ...PLANNED_PROJECTS.filter((x) => !PROJECTS.some((pr) => pr.id === x.id)).map((x) => ({ ...x, built: false })),
  ].sort((a, b) => a.number - b.number);
  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-16 pt-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Projects</h1>
      <p className="mt-2 max-w-3xl text-lg text-ink-2">Each project turns what you learned into working, tested code — from a shop calculator to a deployed agent.</p>
      <ol className="mt-8 space-y-3">
        {all.map((pr) => {
          const done = p.projects[pr.id]?.completedAt;
          const m = getModule(pr.moduleId);
          const body = (
            <div className="flex items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold ${pr.built ? "bg-accent-soft text-accent" : "bg-sunken text-ink-3"}`}>{pr.number}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{pr.title}</span>
                  {!pr.built && <Badge>planned</Badge>}
                  {done && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" /> complete</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-ink-2">{pr.focus}</p>
                <p className="mt-0.5 text-xs text-ink-3">After Module {m?.number}: {m?.short}</p>
              </div>
              {pr.built && <Hammer className="h-5 w-5 text-ink-3" />}
            </div>
          );
          return (
            <li key={pr.id}>
              {pr.built ? (
                <Link href={`/projects/${pr.id}`} className="block rounded-2xl border border-line bg-raised p-4 hover:border-line-strong">{body}</Link>
              ) : (
                <div className="rounded-2xl border border-dashed border-line p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

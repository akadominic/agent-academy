"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, CircleDashed, Clock, FlaskConical, Hammer, Lock } from "lucide-react";
import { getModule } from "@/content/curriculum";
import { getProject, PLANNED_PROJECTS } from "@/content/projects";
import { getLab } from "@/labs/registry";
import { useProgress } from "@/lib/progress";
import { isModuleUnlocked, moduleStats } from "@/lib/course";
import { Badge, Button, Card, Eyebrow, ModeTag, ProgressBar } from "@/components/ui/primitives";
import { Markup } from "@/components/lesson/Markup";

export function ModuleView({ moduleId }: { moduleId: string }) {
  const m = getModule(moduleId)!;
  const p = useProgress();
  const s = moduleStats(m, p);
  const unlocked = isModuleUnlocked(m, p);
  const firstOpen = m.lessons.find((l) => !p.lessons[l.id]?.completedAt) ?? m.lessons[0];

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-16 pt-8">
      <Link href="/learn" className="text-sm text-ink-3 hover:text-ink">← Course map</Link>
      <Eyebrow className="mt-4 text-accent">Module {m.number}</Eyebrow>
      <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">{m.title}</h1>
      <p className="mt-2 text-lg text-ink-2">{m.goal}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-accent">Unlocks:</span> <span className="text-ink-2">{m.unlocks}</span>
      </div>

      {m.status === "outline" ? (
        <Card className="mt-6 border-dashed p-5">
          <div className="flex items-center gap-2 font-semibold"><CircleDashed className="h-5 w-5 text-ink-3" /> This module is outlined, not yet built</div>
          <p className="mt-1 text-sm text-ink-2">
            The lessons below are planned. They are not available yet, and nothing here is presented as finished. Some parts are already previewed in the
            {" "}<Link href="/anatomy" className="text-accent hover:underline">Agent Anatomy Explorer</Link> and the <Link href="/sandbox" className="text-accent hover:underline">Sandbox</Link>.
          </p>
          <ol className="mt-4 space-y-2">
            {m.outline?.map((o, i) => (
              <li key={o.title} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2 font-medium"><span className="font-mono text-xs text-ink-3">{m.number}.{i + 1}</span> {o.title} <Badge>planned</Badge></div>
                <p className="mt-0.5 text-sm text-ink-2">{o.summary}</p>
                {o.lab && <p className="mt-1 text-xs text-ink-3">Planned lab: {o.lab}</p>}
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <>
          <Card className="mt-6 p-5">
            {!unlocked && (
              <p className="mb-3 flex items-center gap-2 text-sm text-warn"><Lock className="h-4 w-4" /> Recommended first: {m.prerequisites.map((id) => getModule(id)?.title).join(", ")}. You can still preview.</p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[200px] flex-1">
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">Module progress</span><span className="tabular-nums text-ink-3">{s.done}/{s.total} lessons</span></div>
                <ProgressBar value={s.total ? s.done / s.total : 0} label="Module progress" />
              </div>
              {firstOpen && (
                <Link href={`/learn/${m.id}/${firstOpen.id}`}>
                  <Button variant="primary">{s.started ? "Continue" : "Start module"} <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              )}
            </div>
          </Card>

          <h2 className="font-display mt-10 text-2xl font-semibold">Lessons</h2>
          <ol className="mt-3 space-y-3">
            {m.lessons.map((l, i) => {
              const done = Boolean(p.lessons[l.id]?.completedAt);
              return (
                <li key={l.id}>
                  <Link href={`/learn/${m.id}/${l.id}`} className="block rounded-2xl border border-line bg-raised p-4 hover:border-line-strong">
                    <div className="flex items-start gap-3">
                      {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-mono text-xs text-ink-3">{m.number}.{i + 1}</span>
                          <span className="font-semibold">{l.title}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-ink-3"><Clock className="h-3 w-3" />{l.minutes} min</span>
                        </div>
                        <p className="mt-0.5 text-sm text-ink-2">{l.subtitle}</p>
                        <ul className="mt-2 space-y-0.5 text-[13px] text-ink-3">
                          {l.objectives.slice(0, 3).map((o) => <li key={o}>→ <Markup text={o} /></li>)}
                        </ul>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {m.labs.length > 0 && (
        <>
          <h2 className="font-display mt-10 text-2xl font-semibold">Labs</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {m.labs.map((id) => {
              const lab = getLab(id);
              return lab ? (
                <Link key={id} href={`/labs/${id}`} className="rounded-2xl border border-line bg-raised p-4 hover:border-line-strong">
                  <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-tool" /><span className="font-semibold">{lab.title}</span><ModeTag mode={lab.mode} /></div>
                  <p className="mt-1 text-sm text-ink-2">{lab.short}</p>
                </Link>
              ) : (
                <div key={id} className="rounded-2xl border border-dashed border-line p-4 text-sm text-ink-3">
                  <span className="font-medium text-ink-2">{id}</span> — planned
                </div>
              );
            })}
          </div>
        </>
      )}

      {m.projectIds && m.projectIds.length > 0 && (
        <>
          <h2 className="font-display mt-10 text-2xl font-semibold">Project</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {m.projectIds.map((id) => {
              const pr = getProject(id);
              const planned = PLANNED_PROJECTS.find((x) => x.id === id);
              return pr ? (
                <Link key={id} href={`/projects/${id}`} className="rounded-2xl border border-line bg-raised p-4 hover:border-line-strong">
                  <div className="flex items-center gap-2"><Hammer className="h-4 w-4 text-accent" /><span className="font-semibold">Project {pr.number}: {pr.title}</span></div>
                  <p className="mt-1 text-sm text-ink-2">{pr.focus}</p>
                </Link>
              ) : (
                <div key={id} className="rounded-2xl border border-dashed border-line p-4 text-sm text-ink-3">
                  Project {planned?.number}: {planned?.title ?? id} — planned
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

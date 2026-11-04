"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2, Circle, Wrench } from "lucide-react";
import { getProject } from "@/content/projects";
import { getLesson } from "@/content/curriculum";
import { progress, useProgress } from "@/lib/progress";
import { Badge, Card, Eyebrow } from "@/components/ui/primitives";
import { BlockView } from "@/components/lesson/Blocks";
import { Markup } from "@/components/lesson/Markup";

const KIND: Record<string, string> = {
  people: "var(--c-people)", model: "var(--c-model)", tool: "var(--c-tool)", data: "var(--c-data)",
  control: "var(--c-control)", safety: "var(--c-safety)", cloud: "var(--c-cloud)",
};

export function ProjectView({ projectId }: { projectId: string }) {
  const pr = getProject(projectId)!;
  const p = useProgress();
  const pp = p.projects[pr.id];
  const required: string[] = [];
  pr.steps.forEach((s) => s.blocks.forEach((b, bi) => {
    if (b.type === "exercise" || (b.type === "lab" && b.required)) required.push(`${s.id}-${bi}`);
  }));
  const doneCount = required.filter((k) => pp?.steps[k]).length;
  const complete = Boolean(pp?.completedAt);

  useEffect(() => {
    if (!complete && required.length > 0 && doneCount === required.length) progress.completeProject(pr.id);
  }, [complete, doneCount, required.length, pr.id]);

  return (
    <div className="mx-auto max-w-[1040px] px-4 pb-20 pt-8">
      <Link href="/projects" className="text-sm text-ink-3 hover:text-ink">← Projects</Link>
      <Eyebrow className="mt-4 text-accent">Project {pr.number}</Eyebrow>
      <h1 className="font-display mt-1 text-3xl font-semibold sm:text-4xl">{pr.title}</h1>
      <p className="mt-1 text-ink-3">Focus: {pr.focus}</p>
      <div className="prose-lesson mt-4"><Markup text={pr.brief} /></div>

      <Card className="mt-6 p-5">
        <div className="mb-3 font-semibold">Architecture</div>
        <div className="flex flex-wrap items-stretch gap-2" role="list" aria-label="Architecture, in data-flow order">
          {pr.architecture.map((a, i) => (
            <div key={a.label} className="flex items-center gap-2" role="listitem">
              <div className="rounded-xl border-2 bg-raised px-3 py-2" style={{ borderColor: KIND[a.kind] }}>
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="max-w-[200px] text-xs text-ink-3">{a.note}</div>
              </div>
              {i < pr.architecture.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-5 text-sm">
          <div className="mb-2 font-semibold">Before you start</div>
          <ul className="space-y-1">
            {pr.prerequisites.map((id) => {
              const l = getLesson(id);
              return l ? (
                <li key={id} className="flex items-center gap-1.5">
                  {p.lessons[id]?.completedAt ? <CheckCircle2 className="h-3.5 w-3.5 text-ok" /> : <Circle className="h-3.5 w-3.5 text-ink-3" />}
                  <Link href={`/learn/${l.moduleId}/${l.id}`} className="hover:text-accent">{l.title}</Link>
                </li>
              ) : null;
            })}
          </ul>
        </Card>
        <Card className="p-5 text-sm">
          <div className="mb-2 flex items-center justify-between font-semibold">Done when {complete ? <Badge tone="ok">complete</Badge> : <span className="text-xs font-normal text-ink-3">{doneCount}/{required.length} checks passed</span>}</div>
          <ul className="space-y-1 text-ink-2">{pr.completion.map((c) => <li key={c}>· <Markup text={c} /></li>)}</ul>
        </Card>
      </div>

      <ol className="mt-8 space-y-6">
        {pr.steps.map((s, i) => (
          <li key={s.id}>
            <section className="rounded-2xl border border-l-4 border-line border-l-accent bg-raised p-5 sm:p-7" aria-labelledby={`step-${s.id}`}>
              <h2 id={`step-${s.id}`} className="font-display mb-4 text-xl font-semibold">
                <span className="mr-2 font-sans text-sm font-semibold uppercase tracking-wider text-ink-3">Step {i + 1}</span>{s.title}
              </h2>
              <div className="space-y-4">
                {s.blocks.map((b, bi) => {
                  const k = `${s.id}-${bi}`;
                  return (
                    <BlockView key={k} block={b} k={k} ctx={{
                      challengeDone: (key) => Boolean(pp?.steps[key]),
                      onChallenge: (key) => progress.markProjectStep(pr.id, key),
                    }} />
                  );
                })}
              </div>
            </section>
          </li>
        ))}
      </ol>

      <Card className="mt-8 p-5">
        <div className="mb-2 flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4 text-safety" /> Common errors and how to fix them</div>
        <dl className="space-y-3 text-sm">
          {pr.commonErrors.map((e) => (
            <div key={e.error}>
              <dt className="font-mono text-[13px] text-safety">{e.error}</dt>
              <dd className="mt-0.5 text-ink-2"><Markup text={e.fix} /></dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

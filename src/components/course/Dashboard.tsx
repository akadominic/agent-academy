"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Boxes, FlaskConical, Hammer, Lightbulb, RefreshCcw, Sparkles, Target, Trophy } from "lucide-react";
import { ALL_LESSONS, MODULES, getModule } from "@/content/curriculum";
import { PROJECTS, PLANNED_PROJECTS } from "@/content/projects";
import { useProgress } from "@/lib/progress";
import { capstoneReadiness, lessonRequirements, masteredTerms, nextLesson, overall, reviewList } from "@/lib/course";
import { Badge, Button, Card, Eyebrow, ProgressBar, SimBadge } from "@/components/ui/primitives";
import { CourseMap } from "./CourseMap";

export function Dashboard() {
  const p = useProgress();
  const o = overall(p);
  const next = nextLesson(p);
  const nextMod = next ? getModule(next.moduleId) : undefined;
  const reviews = reviewList(p);
  const mastered = masteredTerms(p);
  const ready = capstoneReadiness(p);
  const projectsDone = PROJECTS.filter((pr) => p.projects[pr.id]?.completedAt);
  const fresh = o.done === 0 && !p.lastLesson;

  // Upcoming practical challenges: the next few lessons with hands-on work, then the next project.
  const upcoming = ALL_LESSONS.filter((l) => !p.lessons[l.id]?.completedAt && lessonRequirements(l).required.length > 0).slice(0, 3);
  const nextProject = PROJECTS.find((pr) => !p.projects[pr.id]?.completedAt);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8">
      {/* Hero */}
      <section className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center">
          <Eyebrow className="text-accent">Agent Academy</Eyebrow>
          <h1 className="font-display mt-2 text-[2.3rem] font-semibold leading-[1.1] sm:text-[3rem]">
            {fresh ? <>From zero to building<br className="hidden sm:block" /> AI workers.</> : <>Welcome back.</>}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ink-2">
            {fresh
              ? "No experience needed. You will learn how computers, code and language models work — then build, test and deploy real AI agents, one understandable piece at a time."
              : `You have completed ${o.done} of ${o.total} lessons. Keep going — every module adds a new part to your agent.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {next && (
              <Link href={`/learn/${next.moduleId}/${next.id}`}>
                <Button variant="primary" size="lg">{fresh ? "Start the first lesson" : "Continue learning"} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            )}
            <Link href="/anatomy"><Button size="lg"><Boxes className="h-4 w-4" /> Explore an agent</Button></Link>
          </div>
        </div>

        <Card className="p-5">
          <Eyebrow>Current lesson</Eyebrow>
          {next ? (
            <Link href={`/learn/${next.moduleId}/${next.id}`} className="group mt-2 block">
              <div className="text-sm text-ink-3">Module {nextMod?.number} · {nextMod?.short}</div>
              <div className="font-display text-xl font-semibold group-hover:text-accent">{next.title}</div>
              <p className="mt-1 text-sm text-ink-2">{next.subtitle}</p>
            </Link>
          ) : <p className="mt-2 text-ink-2">You have completed every available lesson. New modules are on the way.</p>}
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">Overall progress</span><span className="tabular-nums text-ink-3">{Math.round(o.ratio * 100)}%</span></div>
            <ProgressBar value={o.ratio} label="Overall course progress" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat icon={<BookOpen className="h-4 w-4" />} value={o.done} label="lessons done" />
            <Stat icon={<Lightbulb className="h-4 w-4" />} value={mastered.length} label="concepts mastered" />
            <Stat icon={<Hammer className="h-4 w-4" />} value={projectsDone.length} label="projects built" />
          </div>
        </Card>
      </section>

      {/* How it works */}
      {fresh && (
        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { t: "Understand", d: "Everyday analogies and diagrams first — a shopkeeper's ledger, a boda-boda dispatcher — then the real technical words.", c: "text-model" },
            { t: "Experiment", d: "Change inputs, press Step, break things on purpose and watch what happens. Every lab works offline, for free.", c: "text-tool" },
            { t: "Build for real", d: "Write and run real JavaScript, connect real AI models when you are ready, test, and deploy.", c: "text-accent" },
          ].map((m) => (
            <Card key={m.t} className="p-4">
              <div className={`text-xs font-semibold uppercase tracking-[0.12em] ${m.c}`}>{m.t}</div>
              <p className="mt-1.5 text-sm text-ink-2">{m.d}</p>
            </Card>
          ))}
        </section>
      )}

      {/* Middle row */}
      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold"><RefreshCcw className="h-4 w-4 text-data" /> Lessons to review</div>
          {reviews.length === 0 ? (
            <p className="text-sm text-ink-2">Nothing due. Completed lessons come back for short reviews after 1, 3, 7 and 21 days — that spacing is what makes knowledge stick.</p>
          ) : (
            <ul className="space-y-2">
              {reviews.slice(0, 5).map(({ lesson, reason }) => (
                <li key={lesson.id}>
                  <Link href={`/learn/${lesson.moduleId}/${lesson.id}?review=1#s-${lesson.sections.findIndex((s) => s.kind === "quiz")}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-sunken">
                    <span>{lesson.title}</span>
                    <Badge tone={reason === "weak" ? "warn" : "data"}>{reason === "weak" ? "strengthen" : "due"}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-accent" /> Upcoming practical challenges</div>
          <ul className="space-y-2 text-sm">
            {upcoming.map((l) => (
              <li key={l.id}>
                <Link href={`/learn/${l.moduleId}/${l.id}`} className="block rounded-lg px-2 py-1.5 hover:bg-sunken">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-ink-3">Module {getModule(l.moduleId)?.number} · hands-on challenge</div>
                </Link>
              </li>
            ))}
            {nextProject && (
              <li>
                <Link href={`/projects/${nextProject.id}`} className="block rounded-lg px-2 py-1.5 hover:bg-sunken">
                  <div className="font-medium">Project {nextProject.number}: {nextProject.title}</div>
                  <div className="text-xs text-ink-3">{nextProject.focus}</div>
                </Link>
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-warn" /> Capstone readiness</div>
          <p className="text-sm text-ink-2">The capstone — a deployed <strong>Kampala Market Assistant</strong> — needs everything from Modules 0–18.</p>
          <div className="mt-3">
            <ProgressBar value={ready.total ? ready.done / ready.total : 0} label="Capstone readiness" />
            <div className="mt-1.5 text-xs text-ink-3">{ready.done} of {ready.total} available lessons complete · {ready.outlineModules} modules still in development</div>
          </div>
          <div className="mt-3 text-sm">
            <div className="font-medium">Projects</div>
            <ul className="mt-1 space-y-0.5 text-ink-2">
              {PROJECTS.map((pr) => <li key={pr.id}>{p.projects[pr.id]?.completedAt ? "✓" : "○"} {pr.number}. {pr.title}</li>)}
              {PLANNED_PROJECTS.map((pr) => <li key={pr.id} className="text-ink-3">· {pr.number}. {pr.title} <span className="text-xs">(planned)</span></li>)}
            </ul>
          </div>
        </Card>
      </section>

      {/* Anatomy promo */}
      <section className="mt-10">
        <Link href="/anatomy" className="group block overflow-hidden rounded-2xl border border-line bg-raised p-6 hover:border-line-strong">
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="h-5 w-5 text-model" />
            <span className="font-display text-xl font-semibold">Agent Anatomy Explorer</span>
            <SimBadge label="Real loop · simulated model" />
          </div>
          <p className="mt-2 max-w-3xl text-ink-2">
            Watch “Customer wants 3 bags of rice delivered tomorrow” travel through a real agent — product lookup, inventory, quotation, human approval, order record — and break it on purpose to see how each safety control responds. It grows as you learn.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:underline">Open the explorer <ArrowRight className="h-4 w-4" /></span>
        </Link>
      </section>

      {/* Course map */}
      <section className="mt-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <Eyebrow>Your journey</Eyebrow>
            <h2 className="font-display mt-1 text-2xl font-semibold">Course map</h2>
          </div>
          <Link href="/learn" className="text-sm font-medium text-accent hover:underline">See the full map →</Link>
        </div>
        <CourseMap compact />
      </section>

      <section className="mt-12 rounded-2xl border border-dashed border-warn/50 p-5 text-sm text-ink-2">
        <div className="mb-1 flex items-center gap-2 font-semibold text-ink"><FlaskConical className="h-4 w-4 text-warn" /> About simulations</div>
        Every lab works without internet or a paid API key. Anything simulated carries a striped <strong>SIMULATED</strong> label: the “simulated model” is a hand-written rule program
        that returns responses in the same format as a real AI model, so the code around it is real. When you are ready, Module 5 shows how to connect a real model through a secure server.
        {MODULES.some((m) => m.status === "outline") && " Modules marked “Outline” are planned but not yet written."}
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl bg-sunken px-2 py-3">
      <div className="flex items-center justify-center gap-1 text-ink-3">{icon}</div>
      <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
    </div>
  );
}

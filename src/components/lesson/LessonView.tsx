"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Clock, GraduationCap, Lock, Target } from "lucide-react";
import { getLesson, getModule, lessonNeighbours } from "@/content/curriculum";
import { getTerm } from "@/content/glossary";
import { SECTION_LABELS, type Section } from "@/content/schema";
import { progress, useProgress } from "@/lib/progress";
import { isLessonComplete, isModuleUnlocked, lessonChecklist } from "@/lib/course";
import { Badge, Button, Card, Eyebrow, ModeTag, cx } from "@/components/ui/primitives";
import { openTutor, setTutorLesson } from "@/components/tutor/TutorPanel";
import { BlockView, type BlockContext } from "./Blocks";
import { Markup } from "./Markup";
import { Quiz } from "./Quiz";
import { TeachBack } from "./TeachBack";

export function LessonView({ lessonId }: { lessonId: string }) {
  const lesson = getLesson(lessonId)!;
  const mod = getModule(lesson.moduleId)!;
  const p = useProgress();
  const lp = p.lessons[lesson.id];
  const { prev, next } = lessonNeighbours(lesson.id);
  const checklist = lessonChecklist(lesson, lp);
  const complete = isLessonComplete(lesson, lp);
  const unlocked = isModuleUnlocked(mod, p);
  const [active, setActive] = useState(0);
  // ?review=1 opens the lesson as a spaced-review session (read on the client so the page stays static).
  const [reviewMode, setReviewMode] = useState(false);
  useEffect(() => {
    setReviewMode(new URLSearchParams(window.location.search).get("review") === "1");
  }, [lessonId]);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setTutorLesson(lesson.id);
    progress.touchLesson(lesson.id);
    return () => setTutorLesson(null);
  }, [lesson.id]);

  // Auto-complete when every criterion is met.
  useEffect(() => {
    if (!lp?.completedAt && checklist.length > 0 && checklist.every((c) => c.done)) progress.complete(lesson.id);
  }, [checklist, lp?.completedAt, lesson.id]);

  // Mark sections as viewed while scrolling and track the active one.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          setActive(i);
          progress.markSection(lesson.id, lesson.sections[i].kind);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sectionRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [lesson]);

  const ctx: BlockContext = {
    challengeDone: (k) => Boolean(lp?.challenges[k]),
    onChallenge: (k) => progress.markChallenge(lesson.id, k),
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
        <Link href="/learn" className="hover:text-ink">Course</Link>
        <span>/</span>
        <Link href={`/learn/${mod.id}`} className="hover:text-ink">Module {mod.number}: {mod.short}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Section navigator */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <Eyebrow className="mb-2">In this lesson</Eyebrow>
            {lesson.sections.map((s, i) => (
              <a
                key={i}
                href={`#s-${i}`}
                className={cx("flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm", active === i ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:text-ink")}
              >
                {lp?.sections[s.kind] ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ok" /> : <Circle className="h-3.5 w-3.5 shrink-0 text-line-strong" />}
                {s.title ?? SECTION_LABELS[s.kind]}
              </a>
            ))}
            <div className="mt-6 border-t border-line pt-4 text-sm">
              <Eyebrow className="mb-2">To complete</Eyebrow>
              {checklist.map((c) => (
                <div key={c.label} className="flex items-start gap-2 py-1">
                  {c.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />}
                  <span className="text-ink-2">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <article className="min-w-0 max-w-[1040px]">
          {!unlocked && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-warn/50 bg-[color-mix(in_srgb,var(--c-warn)_8%,transparent)] p-4 text-sm">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <div>
                <strong>You&apos;re previewing ahead.</strong> This module builds on{" "}
                {mod.prerequisites.map((id) => getModule(id)?.title).join(", ")}. You can read on, but it will make more sense after that.
              </div>
            </div>
          )}
          {reviewMode && (
            <div className="mb-5 rounded-xl border border-data/40 bg-[color-mix(in_srgb,var(--c-data)_7%,transparent)] p-4 text-sm">
              <strong>Review session.</strong> Re-read the recap, then retake the knowledge check below. Spaced review strengthens long-term memory.
            </div>
          )}

          <header className="mb-8">
            <Eyebrow className="text-accent">Module {mod.number} · Lesson {mod.lessons.indexOf(lesson) + 1} of {mod.lessons.length}</Eyebrow>
            <h1 className="font-display mt-2 text-[2rem] font-semibold leading-tight sm:text-[2.6rem]">{lesson.title}</h1>
            <p className="mt-2 text-lg text-ink-2">{lesson.subtitle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-3">
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> about {lesson.minutes} min</span>
              {complete && <Badge tone="ok"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>}
              <button onClick={openTutor} className="inline-flex items-center gap-1 text-accent hover:underline"><GraduationCap className="h-4 w-4" /> Ask the tutor</button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-accent" /> By the end you will be able to</div>
                <ul className="space-y-1.5 text-[15px] text-ink-2">
                  {lesson.objectives.map((o) => <li key={o} className="flex gap-2"><span className="text-accent">→</span><span><Markup text={o} /></span></li>)}
                </ul>
              </Card>
              <Card className="space-y-3 p-4 text-sm">
                <div>
                  <div className="mb-1 font-semibold">Done when you can</div>
                  <ul className="space-y-0.5 text-ink-2">{lesson.completion.map((c) => <li key={c}>· <Markup text={c} /></li>)}</ul>
                </div>
                <div>
                  <div className="mb-1 font-semibold">Before this lesson</div>
                  {lesson.prerequisites.length === 0 ? (
                    <span className="text-ink-2">Nothing — start here.</span>
                  ) : (
                    <ul className="space-y-1">
                      {lesson.prerequisites.map((id) => {
                        const pre = getLesson(id);
                        if (!pre) return null;
                        return (
                          <li key={id} className="flex items-center gap-1.5">
                            {p.lessons[id]?.completedAt ? <CheckCircle2 className="h-3.5 w-3.5 text-ok" /> : <Circle className="h-3.5 w-3.5 text-ink-3" />}
                            <Link href={`/learn/${pre.moduleId}/${pre.id}`} className="text-ink-2 hover:text-accent">{pre.title}</Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-semibold"><BookOpen className="h-3.5 w-3.5" /> New words</div>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.glossary.map((g) => {
                      const t = getTerm(g);
                      return t ? (
                        <Link key={g} href={`/glossary#${g}`} title={t.short} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-2 hover:border-accent hover:text-accent">
                          {t.term}
                        </Link>
                      ) : null;
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </header>

          <div className="space-y-6">
            {lesson.sections.map((s, i) => (
              <SectionView
                key={i}
                index={i}
                section={s}
                refCb={(el) => { sectionRefs.current[i] = el; }}
                ctx={ctx}
                lessonId={lesson.id}
                savedTeachback={lp?.teachback}
                reviewMode={reviewMode}
              />
            ))}
          </div>

          {/* Completion */}
          <Card className={cx("mt-10 p-5", complete && "border-ok/50")}>
            <div className="flex items-center gap-2 font-semibold">
              {complete ? <CheckCircle2 className="h-5 w-5 text-ok" /> : <Circle className="h-5 w-5 text-ink-3" />}
              {complete ? "Lesson complete" : "To complete this lesson"}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.done ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-ink-3" />}
                  <span className={c.done ? "text-ink-2 line-through decoration-ink-3/40" : ""}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {prev && (
                <Link href={`/learn/${prev.moduleId}/${prev.id}`}>
                  <Button variant="ghost"><ArrowLeft className="h-4 w-4" /> {prev.title}</Button>
                </Link>
              )}
              {next && (
                <Link href={`/learn/${next.moduleId}/${next.id}`} className="ml-auto">
                  <Button variant={complete ? "primary" : "secondary"}>Next: {next.title} <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              )}
            </div>
          </Card>
        </article>

      </div>
    </div>
  );
}

function SectionView({ index, section, refCb, ctx, lessonId, savedTeachback, reviewMode }: {
  index: number;
  section: Section;
  refCb: (el: HTMLElement | null) => void;
  ctx: BlockContext;
  lessonId: string;
  savedTeachback?: string;
  reviewMode: boolean;
}) {
  const accent: Record<string, string> = {
    problem: "border-l-people", analogy: "border-l-people", visual: "border-l-tool", technical: "border-l-model",
    example: "border-l-accent", challenge: "border-l-accent", failure: "border-l-safety", quiz: "border-l-data",
    teachback: "border-l-data", recap: "border-l-ok",
  };
  return (
    <section
      id={`s-${index}`}
      data-index={index}
      ref={refCb}
      className={cx("scroll-mt-20 rounded-2xl border border-l-4 border-line bg-raised p-5 sm:p-7", accent[section.kind])}
      aria-labelledby={`s-${index}-h`}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`s-${index}-h`} className="font-display text-[1.45rem] font-semibold leading-snug">
          <span className="mr-2 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink-3">{SECTION_LABELS[section.kind]}</span>
          {section.title && <span className="block">{section.title}</span>}
        </h2>
        <ModeTag mode={section.mode} />
      </div>
      <div className="space-y-4">
        {section.blocks.map((b, bi) => {
          const k = `${index}-${bi}`;
          if (b.type === "quiz")
            return (
              <Quiz
                key={k + (reviewMode ? "-r" : "")}
                questions={b.questions}
                onFinish={(r) => progress.recordQuiz(lessonId, r, reviewMode)}
              />
            );
          if (b.type === "teachback")
            return (
              <TeachBack key={k} prompt={b.prompt} rubric={b.rubric} exemplar={b.exemplar} saved={savedTeachback}
                onSubmit={(text, rating) => progress.saveTeachback(lessonId, text, rating)} />
            );
          if (b.type === "recap")
            return (
              <div key={k} className="space-y-3">
                <p className="prose-lesson"><Markup text={b.summary} /></p>
                <div className="rounded-xl bg-[color-mix(in_srgb,var(--c-ok)_8%,transparent)] p-4">
                  <div className="mb-2 text-sm font-semibold">You can now…</div>
                  <ul className="space-y-1 text-[15px]">
                    {b.canNow.map((c) => <li key={c} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-ok" /><span><Markup text={c} /></span></li>)}
                  </ul>
                </div>
                {b.next && <p className="text-[15px] text-ink-2"><strong className="text-ink">Next:</strong> <Markup text={b.next} /></p>}
              </div>
            );
          return <BlockView key={k} block={b} k={k} ctx={ctx} />;
        })}
      </div>
    </section>
  );
}

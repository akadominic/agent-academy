"use client";

import { ALL_LESSONS, MODULES, getModule } from "@/content/curriculum";
import { GLOSSARY } from "@/content/glossary";
import type { CourseModule, Lesson } from "@/content/schema";
import { needsReview, type LessonProgress, type ProgressState } from "./progress";

export function lessonRequirements(lesson: Lesson) {
  const required: string[] = [];
  lesson.sections.forEach((s, si) =>
    s.blocks.forEach((b, bi) => {
      if ((b.type === "lab" && b.required) || (b.type === "exercise" && b.required !== false)) required.push(`${si}-${bi}`);
    }),
  );
  const hasQuiz = lesson.sections.some((s) => s.blocks.some((b) => b.type === "quiz"));
  const hasTeachback = lesson.sections.some((s) => s.blocks.some((b) => b.type === "teachback"));
  return { required, hasQuiz, hasTeachback };
}

export function lessonChecklist(lesson: Lesson, lp?: LessonProgress) {
  const req = lessonRequirements(lesson);
  const items: { label: string; done: boolean }[] = [];
  if (req.required.length) {
    const n = req.required.filter((k) => lp?.challenges[k]).length;
    items.push({ label: `Complete the hands-on challenge${req.required.length > 1 ? `s (${n}/${req.required.length})` : ""}`, done: n === req.required.length });
  }
  if (req.hasQuiz) items.push({ label: "Pass the knowledge check", done: Boolean(lp?.quiz?.passed) });
  if (req.hasTeachback) items.push({ label: "Teach it back in your own words", done: Boolean(lp?.teachback) });
  return items;
}

export function isLessonComplete(lesson: Lesson, lp?: LessonProgress) {
  return Boolean(lp?.completedAt) || lessonChecklist(lesson, lp).every((i) => i.done);
}

export function moduleStats(m: CourseModule, p: ProgressState) {
  const total = m.lessons.length;
  const done = m.lessons.filter((l) => p.lessons[l.id]?.completedAt).length;
  return { total, done, complete: total > 0 && done === total, started: m.lessons.some((l) => p.lessons[l.id]) };
}

export function isModuleUnlocked(m: CourseModule, p: ProgressState) {
  if (p.settings.freeRoam) return true;
  return m.prerequisites.every((id) => {
    const pre = getModule(id);
    return !pre || pre.status === "outline" || moduleStats(pre, p).complete;
  });
}

export function overall(p: ProgressState) {
  const total = ALL_LESSONS.length;
  const done = ALL_LESSONS.filter((l) => p.lessons[l.id]?.completedAt).length;
  return { total, done, ratio: total ? done / total : 0 };
}

export function nextLesson(p: ProgressState): Lesson | undefined {
  if (p.lastLesson) {
    const last = ALL_LESSONS.find((l) => l.id === p.lastLesson);
    if (last && !p.lessons[last.id]?.completedAt) return last;
  }
  return ALL_LESSONS.find((l) => !p.lessons[l.id]?.completedAt);
}

export function reviewList(p: ProgressState) {
  return ALL_LESSONS.map((l) => ({ lesson: l, reason: p.lessons[l.id] ? needsReview(p.lessons[l.id]) : null }))
    .filter((x): x is { lesson: Lesson; reason: "weak" | "due" } => x.reason !== null);
}

export function masteredTerms(p: ProgressState) {
  const ids = new Set<string>();
  for (const l of ALL_LESSONS) {
    const lp = p.lessons[l.id];
    if (lp?.completedAt && lp.quiz && lp.quiz.total > 0 && lp.quiz.firstTry / lp.quiz.total >= 0.8) l.glossary.forEach((g) => ids.add(g));
  }
  return GLOSSARY.filter((t) => ids.has(t.id));
}

/** Capstone readiness: share of the foundation modules (0–18) completed. */
export function capstoneReadiness(p: ProgressState) {
  const pre = MODULES.filter((m) => m.number < 19);
  const lessons = pre.flatMap((m) => m.lessons);
  const outlineCount = pre.filter((m) => m.status === "outline").length;
  const done = lessons.filter((l) => p.lessons[l.id]?.completedAt).length;
  return { done, total: lessons.length, outlineModules: outlineCount };
}

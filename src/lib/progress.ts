"use client";

/**
 * LEARNING PROGRESS STORE
 * Stored only in this browser (localStorage). Nothing is sent to a server.
 * All reads/writes are wrapped in try/catch: private windows and some
 * browsers block storage, and the course must still work.
 */

import { useSyncExternalStore } from "react";
import type { SectionKind } from "@/content/schema";

export interface QuizResult {
  /** Questions answered correctly on the first attempt. */
  firstTry: number;
  total: number;
  passed: boolean;
  at: number;
}

export interface LessonProgress {
  startedAt: number;
  sections: Partial<Record<SectionKind, boolean>>;
  challenges: Record<string, boolean>;
  quiz?: QuizResult;
  teachback?: string;
  teachbackSelf?: number; // 1-3 self rating
  completedAt?: number;
  reviews: number[];
}

export interface ProjectProgress {
  steps: Record<string, boolean>;
  completedAt?: number;
}

export interface ProgressState {
  v: 1;
  lessons: Record<string, LessonProgress>;
  labs: Record<string, number>;
  projects: Record<string, ProjectProgress>;
  lastLesson?: string;
  settings: { freeRoam: boolean };
}

const KEY = "agent-academy:progress:v1";
const EMPTY: ProgressState = { v: 1, lessons: {}, labs: {}, projects: {}, settings: { freeRoam: false } };

let state: ProgressState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressState;
      if (parsed && parsed.v === 1) state = { ...EMPTY, ...parsed, settings: { ...EMPTY.settings, ...parsed.settings } };
    }
  } catch {
    /* storage unavailable: keep in-memory state */
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function update(fn: (draft: ProgressState) => ProgressState) {
  load();
  state = fn(state);
  save();
  emit();
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

/* ------------------------------ helpers ------------------------------ */

function lesson(s: ProgressState, id: string): LessonProgress {
  return s.lessons[id] ?? { startedAt: Date.now(), sections: {}, challenges: {}, reviews: [] };
}

function withLesson(id: string, fn: (l: LessonProgress) => LessonProgress) {
  update((s) => ({ ...s, lastLesson: id, lessons: { ...s.lessons, [id]: fn(lesson(s, id)) } }));
}

export const progress = {
  touchLesson(id: string) {
    withLesson(id, (l) => l);
  },
  markSection(id: string, kind: SectionKind) {
    withLesson(id, (l) => (l.sections[kind] ? l : { ...l, sections: { ...l.sections, [kind]: true } }));
  },
  markChallenge(id: string, key: string) {
    withLesson(id, (l) => ({ ...l, challenges: { ...l.challenges, [key]: true } }));
  },
  recordQuiz(id: string, result: Omit<QuizResult, "at">, isReview: boolean) {
    withLesson(id, (l) => ({
      ...l,
      // Keep the first real attempt for mastery; a review only adds a review timestamp.
      quiz: isReview && l.quiz ? { ...l.quiz, passed: l.quiz.passed || result.passed } : { ...result, at: Date.now() },
      reviews: isReview && result.passed ? [...l.reviews, Date.now()] : l.reviews,
    }));
  },
  saveTeachback(id: string, text: string, selfRating?: number) {
    withLesson(id, (l) => ({ ...l, teachback: text, teachbackSelf: selfRating ?? l.teachbackSelf }));
  },
  complete(id: string) {
    withLesson(id, (l) => (l.completedAt ? l : { ...l, completedAt: Date.now() }));
  },
  visitLab(labId: string) {
    update((s) => ({ ...s, labs: { ...s.labs, [labId]: Date.now() } }));
  },
  markProjectStep(projectId: string, step: string, done = true) {
    update((s) => {
      const p = s.projects[projectId] ?? { steps: {} };
      return { ...s, projects: { ...s.projects, [projectId]: { ...p, steps: { ...p.steps, [step]: done } } } };
    });
  },
  completeProject(projectId: string) {
    update((s) => {
      const p = s.projects[projectId] ?? { steps: {} };
      return { ...s, projects: { ...s.projects, [projectId]: { ...p, completedAt: p.completedAt ?? Date.now() } } };
    });
  },
  setFreeRoam(on: boolean) {
    update((s) => ({ ...s, settings: { ...s.settings, freeRoam: on } }));
  },
  reset() {
    update(() => ({ ...EMPTY, lessons: {}, labs: {}, projects: {} }));
  },
  exportJSON(): string {
    load();
    return JSON.stringify(state, null, 2);
  },
  importJSON(text: string): { ok: boolean; error?: string } {
    try {
      const parsed = JSON.parse(text) as ProgressState;
      if (parsed?.v !== 1 || typeof parsed.lessons !== "object") return { ok: false, error: "This file is not an Agent Academy progress export." };
      update(() => ({ ...EMPTY, ...parsed }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};

/* --------------------------- spaced review --------------------------- */

const DAY = 24 * 60 * 60 * 1000;
/** Review intervals after completion: 1 day, 3 days, 1 week, 3 weeks, 2 months. */
export const REVIEW_INTERVALS = [1, 3, 7, 21, 60].map((d) => d * DAY);

export function reviewDueAt(l: LessonProgress): number | undefined {
  if (!l.completedAt) return undefined;
  const n = l.reviews.length;
  if (n >= REVIEW_INTERVALS.length) return undefined;
  const last = n === 0 ? l.completedAt : l.reviews[n - 1];
  return last + REVIEW_INTERVALS[n];
}

export function needsReview(l: LessonProgress, now = Date.now()): "weak" | "due" | null {
  if (!l.completedAt) return null;
  if (l.quiz && l.quiz.total > 0 && l.quiz.firstTry / l.quiz.total < 0.8 && l.reviews.length === 0) return "weak";
  const due = reviewDueAt(l);
  return due !== undefined && due <= now ? "due" : null;
}

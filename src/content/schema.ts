/**
 * CURRICULUM CONTENT SCHEMA
 * -------------------------
 * All course content is plain typed data. Presentation lives in
 * src/components/lesson. To add a lesson you write data, not React.
 *
 * Inline text markup supported in every `text` field:
 *   **bold**   `code`   [[term-id]] or [[term-id|shown text]] (glossary link)
 */

export type Mode = "understand" | "experiment" | "build";

/** The ten mandatory parts of a lesson (directive §6). */
export type SectionKind =
  | "problem"
  | "analogy"
  | "visual"
  | "technical"
  | "example"
  | "challenge"
  | "failure"
  | "quiz"
  | "teachback"
  | "recap";

export const SECTION_LABELS: Record<SectionKind, string> = {
  problem: "The problem",
  analogy: "The analogy",
  visual: "See it",
  technical: "How it really works",
  example: "Working example",
  challenge: "Your challenge",
  failure: "What can go wrong?",
  quiz: "Knowledge check",
  teachback: "Teach it back",
  recap: "Recap",
};

export const SECTION_ORDER: SectionKind[] = [
  "problem",
  "analogy",
  "visual",
  "technical",
  "example",
  "challenge",
  "failure",
  "quiz",
  "teachback",
  "recap",
];

export type CalloutTone = "info" | "tip" | "warn" | "sim" | "misconception" | "cost";

export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: CalloutTone; title?: string; text: string }
  /** Bridge from everyday idea to technical idea (Principle A). */
  | { type: "analogyMap"; title?: string; pairs: { everyday: string; technical: string }[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string }
  | { type: "compare"; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  /** An interactive lab from src/labs/registry. */
  | { type: "lab"; lab: string; props?: Record<string, unknown>; caption?: string; required?: boolean }
  /** A static, real code sample with optional line-by-line notes. */
  | {
      type: "code";
      lang: "js" | "ts" | "json" | "bash" | "http" | "text" | "tsx";
      code: string;
      caption?: string;
      notes?: { line: number; text: string }[];
    }
  /** "Show Me the Code": a region of the app's real source (see content/code-refs.ts). */
  | { type: "showCode"; ref: string }
  /** A runnable JavaScript exercise checked by tests in a sandboxed Web Worker. */
  | { type: "exercise"; exercise: CodeExercise; required?: boolean }
  | { type: "quiz"; questions: Question[] }
  | { type: "teachback"; prompt: string; rubric: RubricItem[]; exemplar: string }
  | { type: "recap"; summary: string; canNow: string[]; next?: string };

export interface Section {
  kind: SectionKind;
  mode: Mode;
  title?: string;
  blocks: Block[];
}

/* ------------------------------ Assessment ------------------------------ */

export type Question =
  | {
      id: string;
      type: "mcq";
      /** "predict" questions are framed as "what will happen?" */
      flavour?: "recall" | "predict" | "debug" | "design" | "analogy";
      prompt: string;
      code?: string;
      options: { text: string; why: string }[];
      answer: number;
      hint: string;
    }
  | {
      id: string;
      type: "multi";
      flavour?: "recall" | "predict" | "debug" | "design" | "analogy";
      prompt: string;
      options: { text: string; why: string }[];
      answers: number[];
      hint: string;
    }
  | {
      id: string;
      type: "order";
      prompt: string;
      /** Items in the CORRECT order; the UI shuffles them. */
      items: string[];
      hint: string;
      explanation: string;
    }
  | {
      id: string;
      type: "short";
      prompt: string;
      /** Shown after the learner writes an answer. Self-assessed. */
      modelAnswer: string;
      checklist: string[];
    };

export interface RubricItem {
  concept: string;
  /** Any of these (case-insensitive, substring) counts as mentioning the concept. */
  keywords: string[];
  hint: string;
}

export interface CodeTest {
  name: string;
  /** JavaScript expression evaluated after the learner's code runs, in the same scope. Promises are awaited automatically; `await` inside the expression is also supported. */
  expr: string;
  /** JSON-serialisable expected value (deep equality). */
  expected?: unknown;
  /** Alternatively: expect a thrown error whose message includes this text. */
  throws?: string;
  /** Alternatively: expect console output to include this text. */
  logIncludes?: string;
}

export interface CodeExercise {
  id: string;
  title: string;
  brief: string;
  starter: string;
  solution: string;
  tests: CodeTest[];
  hints: string[];
  /** Max ms before the sandbox is terminated (guards infinite loops). */
  timeoutMs?: number;
}

/* ------------------------------- Lessons -------------------------------- */

export interface TutorNotes {
  simpler: string;
  altAnalogy: string;
  misconceptions: string[];
  probingQuestions: string[];
  /** Lesson ids worth revisiting if the learner is stuck. */
  revisit?: string[];
}

export interface Lesson {
  id: string; // e.g. "m6-l2"
  moduleId: string;
  title: string;
  subtitle: string;
  minutes: number;
  prerequisites: string[];
  objectives: string[];
  glossary: string[];
  completion: string[];
  sections: Section[];
  tutor: TutorNotes;
}

export type ModuleStatus = "complete" | "outline";

export interface OutlineLesson {
  title: string;
  summary: string;
  lab?: string;
}

export interface CourseModule {
  id: string; // "m0"
  number: number;
  title: string;
  short: string;
  goal: string;
  unlocks: string; // the new capability this module gives
  track: "foundations" | "models" | "agents" | "production" | "mastery";
  prerequisites: string[]; // module ids
  status: ModuleStatus;
  lessons: Lesson[]; // populated when status === "complete"
  outline?: OutlineLesson[]; // populated when status === "outline"
  labs: string[];
  projectIds?: string[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  short: string;
  long?: string;
  analogy?: string;
  moduleId: string;
}

/* ------------------------------- Projects ------------------------------- */

export interface ProjectStep {
  id: string;
  title: string;
  blocks: Block[];
}

export interface ProjectDef {
  id: string; // "p1"
  number: number;
  title: string;
  moduleId: string; // module after which it is unlocked
  focus: string;
  brief: string;
  /** Components in the architecture diagram, in data-flow order. */
  architecture: { label: string; kind: "people" | "model" | "tool" | "data" | "control" | "safety" | "cloud"; note: string }[];
  prerequisites: string[]; // lesson ids
  steps: ProjectStep[];
  commonErrors: { error: string; fix: string }[];
  completion: string[];
}

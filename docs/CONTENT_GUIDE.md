# Content & Lab Guide

How to add lessons, labs, glossary terms and projects to Agent Academy.
The **quality benchmark** is `src/content/modules/m00.ts` (lesson `m0-l1`). Read it in full before writing a lesson.

## The learner

A recent secondary-school graduate in Uganda: intelligent and curious, but has never programmed and has never heard of an API, a server or a database. They may have a slow connection and an older laptop or phone. **Teach simply without talking down.** Simple explanations must still be accurate explanations. Never use a technical term before you explain it (or link it to the glossary with `[[term-id]]`).

Use everyday Ugandan situations where they genuinely help: boda-boda dispatch, a Kampala shop keeping a stock book, a mobile money agent, a taxi park, a school administrator, a teacher marking against a marking guide, a bank teller checking before acting. Keep them natural and accurate, with no caricatures. Use UGX for local money. When you talk about API or cloud pricing, use USD and say so.

## Lesson structure (mandatory)

Every lesson is a `Lesson` object (`src/content/schema.ts`) with these ten sections, in this order:

| kind | purpose | usual mode |
|---|---|---|
| `problem` | A relatable situation; the practical problem *before* the solution | understand |
| `analogy` | Everyday analogy + an `analogyMap` bridging to the technical terms + where the analogy breaks | understand |
| `visual` | An interactive lab (`{type:"lab"}`) that shows the concept | experiment |
| `technical` | Real vocabulary and mechanism, precise | understand |
| `example` | A real, working implementation (`code` with `notes`, or `showCode`). Never pseudocode passed off as real | understand/build |
| `challenge` | A task: a required lab (`required: true`) or a runnable `exercise` | experiment/build |
| `failure` | At least one realistic failure: how to recognise it, explain it and fix it | experiment |
| `quiz` | 4–6 questions mixing flavours (`recall`, `predict`, `debug`, `design`, `analogy`) and types (`mcq`, `multi`, `order`, `short`). Every option has a `why`. Every question has a `hint` | understand |
| `teachback` | The learner explains the idea in plain English. Give 3–4 rubric concepts with keyword lists, plus an exemplar | understand |
| `recap` | A summary, a "you can now…" list, and what comes next | understand |

Each lesson also needs `prerequisites` (lesson ids), `objectives`, `glossary` (term ids), `completion` (criteria in words) and `tutor` notes (`simpler`, `altAnalogy`, `misconceptions`, `probingQuestions`, optional `revisit`). The offline tutor shows these, so write them well.

**A lesson is complete** when every required challenge is done, the quiz is passed (retries allowed) and the teach-back is submitted. Make sure each lesson has at least one required challenge.

### Inline markup (in any text field)

`**bold**` · `` `code` `` · `[[term-id]]` or `[[term-id|shown text]]` (glossary popover). Use lowercase display text in the middle of a sentence: `[[computer|computer]]`.

### Honesty rules (Principle F)

- Every simulated system must carry a `SimBadge` in the lab UI and should be explained with a `callout` of tone `sim`.
- Never present a scripted animation as a model "thinking". Never say a model "understands", "knows" or "decides" as a person would without qualifying it.
- If you show exact API behaviour, prices or commands, they must be correct. If you cannot verify something, say so in the text ("check the provider's current documentation").
- Illustrative numbers must be labelled illustrative.

## Labs (interactive components)

A lab is a **client component** with a default export, registered in `src/labs/entries/<group>.ts`:

```ts
{ id: "tokenizer", title: "Tokenizer", short: "…", moduleId: "m3", mode: "experiment", offline: true,
  load: () => import("../m03/Tokenizer") }
```

Component contract (`src/labs/types.ts`):

```tsx
"use client";
import type { LabProps } from "../types";
export default function Tokenizer({ onComplete, scenario }: LabProps & { scenario?: string }) { … }
```

- Call `onComplete?.()` **only** when the learner has actually done the challenge, for example after they have fixed a broken request. Merely looking does not count.
- Lesson content can pass props: `{ type: "lab", lab: "tokenizer", props: { scenario: "luganda" }, required: true }`.
- Use the primitives in `src/components/ui/primitives.tsx` (`Button`, `Badge`, `SimBadge`, `Segmented`, `Toggle`, `JsonView`, `Callout`, `cx`) and `CodeBlock` from `src/components/lesson/CodeBlock.tsx`.
- **Colour is semantic and identical everywhere** (Tailwind classes `text-people`, `bg-model`, `border-tool`, and so on, or CSS vars `var(--c-model)`):
  - people/UI/approval = `people` (orange)
  - language model = `model` (violet)
  - tools/external services = `tool` (teal)
  - data/state/database = `data` (blue)
  - your code/control flow = `control` (slate)
  - security/errors = `safety` (rose)
  - hosting = `cloud` (sky)
  - success = `ok`; warnings = `warn`
  - Surfaces: `bg-bg`, `bg-raised`, `bg-sunken`, `border-line`, `text-ink`, `text-ink-2`, `text-ink-3`, `accent`.
- Diagrams: inline SVG, accessible (`role="img"` + `aria-label`, or a text equivalent), responsive (`viewBox` + `w-full`), working in light and dark themes (CSS vars only, never hard-coded light colours). `.flow-active` animates a dashed path; animations must mean something.
- Controls: real `<button>`s, keyboard accessible. Where it fits, give Play/Pause/Step/Back/Reset. Drag-and-drop must also have a click alternative.
- Must work at 360 px wide. Test it.
- No network calls, no new npm dependencies (ask first), no `localStorage` except small conveniences wrapped in try/catch.
- Put pure logic (tokenizers, simulators, validators) in a separate `.ts` file next to the component and unit-test it in `tests/unit/`.

Runnable code exercises use `{ type: "exercise", exercise: { id, title, brief, starter, solution, tests, hints } }`. Tests are JavaScript expressions evaluated **after** the learner's code in a sandboxed Web Worker: `{ name: "adds 2 + 3", expr: "add(2, 3)", expected: 5 }`. You can also use `throws: "text"` or `logIncludes: "text"`. Exercises are plain JavaScript, not TypeScript. Always check that `solution` passes every test and that `starter` fails at least one.

## Glossary

Add terms to your module's file in `src/content/glossary/`. Ids are lowercase-kebab and must be unique across all files (`grep -r 'id: "x"' src/content/glossary`). Many common ids already exist in `core.ts` (`agent`, `llm`, `token`, `tool`, `context`, `system-prompt`, and so on); reuse them instead of redefining.

## Projects

`ProjectDef` in `src/content/schema.ts`. A project has a brief, an architecture list, prerequisites, guided steps (each step is a list of blocks, usually including runnable `exercise`s with tests), common errors with fixes, and completion criteria. The reference solution lives in each exercise's `solution`.

## Verifying your work

- `npx tsc --noEmit`: the type check must pass for your files.
- `npx vitest run tests/unit/<your-file>.test.ts`
- A dev server usually runs at http://localhost:3100. Lessons are at `/learn/<moduleId>/<lessonId>` and labs at `/labs/<labId>`. Screenshot with Playwright (`NODE_PATH=/opt/npm-tools/node_modules node script.js`), and check both desktop (1280 px) and mobile (390 px).

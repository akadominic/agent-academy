# Agent Academy: From Zero to Building AI Workers

An interactive, visual, project-based web course that takes a complete beginner from "what is a computer?" to building, testing and deploying real AI agents. It was written with a recent secondary-school graduate in Uganda in mind: everyday Ugandan examples, UGX in the demonstrations, low bandwidth, and **no paid API key required**.

## Quick start

You need **Node.js 20 or newer** (https://nodejs.org) and about 1 GB of free disk space.

```bash
npm install
npm run dev
# open http://localhost:3000
```

All progress is saved in your browser only. Nothing is sent to a server.

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server (http://localhost:3000) |
| `npm run build` then `npm run start` | Production build and server |
| `npm test` | Unit tests (Vitest): the engine, lab logic, and every exercise's reference solution |
| `npm run test:e2e` | Browser tests (Playwright). Run `npm run build` first; the tests start `next start` on port 3200 |
| `npm run typecheck` | TypeScript check |

## Using the course

1. **Dashboard** (`/`): continue where you left off. It also shows your progress, concepts mastered, review queue, upcoming challenges and capstone readiness.
2. **Course map** (`/learn`): 20 modules in five tracks. Each one shows the capability it unlocks.
3. **Lessons** always follow the same ten sections: problem → analogy → see it → how it really works → working example → challenge → what can go wrong → knowledge check → teach it back → recap. A lesson is complete when you finish its hands-on challenge, pass its quiz (retries allowed) and write your teach-back.
4. **Agent Anatomy Explorer** (`/anatomy`): the signature experience. Every part of a production agent is shown, and a live request travels through the real agent loop. You can pause it, inspect it and inject failures.
5. **Labs** (`/labs`), **Projects** (`/projects`) and the **Engineering Sandbox** (`/sandbox`), where you configure, run, evaluate and export your own agent as a standalone `agent.mjs`.
6. **Tutor** (the button at the bottom right): lesson-aware hints that work offline. There is an optional live AI tutor (see below).
7. **Progress** (`/progress`): export, import or reset your progress, and turn on "free roam".

Three learning modes are labelled on every section: **Understand** (no code), **Experiment** (simulations you can break) and **Build for real** (code that runs and is checked by tests).

## Simulations vs reality

Every simulated system carries a striped **SIMULATED** label. The "simulated model" is a hand-written rule program (`src/engine/agent/simulatedModel.ts`). It returns responses in the same shape as a real model API, so the **agent loop around it is real code**, and that same loop runs with a live model.

## Optional live AI

See [`docs/LIVE_AI.md`](docs/LIVE_AI.md). Copy `.env.example` to `.env.local` and set `LIVE_AI_ENABLED=true`, a provider key, and a current model name. Keys stay on the server and are reached through `/api/model`. Requests are rate-limited and capped. Live features are off by default and are never triggered without a click.

## Deploying

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). It covers Vercel (from GitHub or the CLI) and any Node host.

## Architecture

```
src/
  app/                 Next.js App Router pages + API routes (/api/status, /api/model, /api/tutor)
  content/             ALL curriculum content as typed data (no React)
    schema.ts          lesson / quiz / exercise / project types
    curriculum.ts      the 20 modules (0–7 built, 8–19 outlined)
    modules/mNN.ts     lessons per module
    glossary/          terms per module
    projects/          guided projects
    anatomy.ts         the 16 parts of an agent
    code-refs.ts       "Show Me the Code" notes over real source regions
  engine/              pure, unit-tested logic shared by every lab
    agent/             loop, JSON-schema validator, simulated model, live model client, evals, export-to-code
    market/            Mama Achen's shop: catalogue, parser, tools, mock database
    runner/            sandboxed Web Worker for learner code
  server/llm.ts        server-only provider calls (Anthropic, OpenAI) + limits
  labs/                interactive labs, registered in labs/entries/*
  components/          UI primitives, lesson renderer, course pages, tutor, sandbox
scripts/extract-code.mjs  copies `// #region` blocks from real source into src/generated (for Show Me the Code)
tests/unit, tests/e2e
docs/                  content guide, roadmap, live AI, deployment
```

Design principles: curriculum content is separate from presentation; there is one agent engine reused by every agent lab; colours are semantic (model = violet, tools = teal, data = blue, people = orange, safety = rose); diagrams are lightweight SVG; and the essentials work offline after installation.

## What is built, and what is not yet built

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full, honest list. In short:

- **Built:** Modules 0–7 (lessons, labs, quizzes, exercises), Projects 1–4, the Anatomy Explorer, the Agent Brain, the Tool Calling Lab, the Sandbox, the tutor, progress tracking, and the optional live AI routes.
- **Outlined, not yet written:** Modules 8–19 (memory, RAG, integrations, workflows, evaluation, security, economics, interfaces, deployment, operations, advanced architectures, capstone), Projects 5–7 and the Capstone. Their pages say clearly that they are outlines.
- **Not verified:** the live provider calls have not been run against real API keys in the build environment (see `docs/LIVE_AI.md`).

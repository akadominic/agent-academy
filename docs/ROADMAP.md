# Implementation roadmap & progress record

This file is the resumable record of what is built, what is not, and what comes next. Update it whenever you finish a piece.

## Status at a glance

| Area | Status |
|---|---|
| App shell, design system (light/dark), navigation, dashboard, course map | ✅ Built |
| Lesson engine (10-section structure, glossary popovers, Show Me the Code, quizzes, teach-back, exercises) | ✅ Built |
| Progress (localStorage, export/import/reset, spaced review, free roam) | ✅ Built |
| Sandboxed code runner (Web Worker, network APIs removed, timeout) | ✅ Built |
| Shared agent engine (loop, validation, approval, idempotency, retries, timeouts, loop guard, simulated model) | ✅ Built + unit-tested |
| **Agent Anatomy Explorer** (16 parts, progressive reveal, request journey, failure injection, demos, code) | ✅ Built |
| Agent Brain (Module 7) and Tool Calling Lab (Module 6) | ✅ Built |
| Engineering Sandbox (config, live/sim model, evals, cost, export to `agent.mjs`) | ✅ Built (v1) |
| Optional live AI: `/api/status`, `/api/model` (Anthropic + OpenAI tool calling), `/api/tutor`, limits | ✅ Built, ⚠️ not tested with live keys |
| Offline tutor (lesson-specific authored hints) + optional live tutor | ✅ Built |
| Modules 0–7: lessons, labs, quizzes, teach-backs, exercises | ✅ Built (see the module files) |
| Projects 1–4 | ✅ Built |
| Modules 8–19 | 🟡 Outlined in `src/content/curriculum.ts`; lessons not written |
| Projects 5–7 and the Capstone | 🟡 Planned (`src/content/projects/index.ts`) |
| Cost calculator lab (`/labs/cost-calculator`, built ahead of Module 14) | ✅ Built |
| Labs still to build: memory-explorer, rag-lab, workflow-builder, eval-lab (a preview exists in the Sandbox), security-challenge, deploy-sim, agent-debugger, capstone-workspace | 🟡 Planned |

## Next steps, in priority order

1. **Module 8 Memory** and the `memory-explorer` lab: the engine already exposes `AgentStateSnapshot`. Add a persistent store adapter (an in-browser fake DB plus a "restart server" button) and checkpoint/resume in `runAgent`.
2. **Module 9 RAG** and `rag-lab`: chunking, toy embeddings (bag-of-words vectors), cosine similarity, hybrid search, citations, and a misleading-passage scenario. Then Project 5.
3. **Module 11 Workflows** and `workflow-builder` (draggable nodes, executed by a small state-machine runner). Then Project 6.
4. **Module 12 Evaluation**: promote `src/engine/agent/evals.ts` into a full `eval-lab`, with trace inspection and a "fix and re-run" loop.
5. **Module 13 Security**: `security-challenge`. The injection fault (`faults.injection` / `obeyInjection`) and `markUntrusted` already exist in the engine.
6. **Module 14 Economics**: write the lessons around the existing `cost-calculator` lab.
7. **Module 16 Deployment**: `deploy-sim` and a verified deployment walkthrough (start from `docs/DEPLOYMENT.md`).
8. Modules 10, 15, 17 and 18, then the **Capstone** workspace. The capstone should reuse `src/engine` and move the market tools behind a real database (for example SQLite or Postgres) with the same tool interfaces.

## How to add a module

Follow `docs/CONTENT_GUIDE.md`. Write the lessons in `src/content/modules/mNN.ts`, put labs in `src/labs/mNN/`, register them in `src/labs/entries/`, and add terms to `src/content/glossary/`. Then switch the module's `status` to `"complete"` in `src/content/curriculum.ts` and import its lessons there.

## Known limitations

- Live AI rate limits are in memory, per server instance (see `docs/LIVE_AI.md`).
- The simulated model understands only the market domain's vocabulary (catalogue products and quantities). This is deliberate: it keeps the labs predictable.
- Teach-back feedback is a keyword check plus self-assessment, and is labelled that way. It is not an automated grade of understanding.

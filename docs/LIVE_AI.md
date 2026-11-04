# Optional: connecting a live AI model

Agent Academy needs **no API key**. Every lab, lesson and exercise runs on the built-in simulated model, which is free, offline and deterministic.

A live model is optional. When you add one, two features start using it:

- **Engineering Sandbox → Model → Live model** runs the course's real agent loop with a real model choosing the tools.
- **Tutor → "Use live AI tutor"** gives free-form answers that take the current lesson into account.

Both are off unless you configure the server. **Live requests cost money.** The app never starts a billable request without a click, and the sandbox asks you to confirm each live run.

## How it works (and why your key is safe)

```
Browser ──POST /api/model──▶ Your Next.js server ──HTTPS + API key──▶ Anthropic / OpenAI
         (no key here)          (src/server/llm.ts)
```

The key lives only in the server's environment variables. The browser calls your own `/api/model` route, so it never sees the key.

## Setup

1. Copy the template: `cp .env.example .env.local`. `.env.local` is in `.gitignore`, so never commit it.
2. Fill in **one or both** providers:
   ```bash
   LIVE_AI_ENABLED=true
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=<a current model id from https://docs.claude.com>
   # and/or
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=<a current model id from https://platform.openai.com/docs/models>
   ```
   Model names change over time, which is why the app does not hard-code one. Look up a current model id in the provider's documentation.
3. Restart the dev server (`npm run dev`). `GET /api/status` should now report `"live": true`.

## Built-in safety limits

| Variable | Default | Purpose |
|---|---|---|
| `LIVE_MAX_OUTPUT_TOKENS` | 600 | Maximum output tokens per model request |
| `LIVE_REQUESTS_PER_IP_PER_HOUR` | 30 | Per-visitor rate limit |
| `LIVE_DAILY_REQUEST_CAP` | 300 | Total live requests per server per day |
| `LIVE_ACCESS_CODE` | (empty) | If set, the browser must send this code. Use it on public deployments |

The request also has a size cap (about 60k characters, 12 tools and 60 messages) and a 30-second timeout.

> **Limitation:** the counters are kept in memory. They reset when the server restarts, and on serverless hosts each instance keeps its own counters. For a real public deployment, also set a **spending limit in the provider's billing dashboard**, and consider a shared store such as Redis for rate limits. Module 14 covers this.

## Verification status

The provider integration in `src/server/llm.ts` follows each provider's public API reference:

- Anthropic Messages API: `POST https://api.anthropic.com/v1/messages`, with the headers `x-api-key` and `anthropic-version: 2023-06-01`, `tools[].input_schema`, `tool_use` and `tool_result` content blocks.
- OpenAI Chat Completions API: `POST https://api.openai.com/v1/chat/completions`, with `tools[].function.parameters`, `tool_calls` and `role: "tool"` messages, plus `max_completion_tokens`.

Anthropic's docs (checked 2026-11-04) list a newer `anthropic-version: 2026-10-21` and describe `Authorization: Bearer` as the primary auth header, with `x-api-key` a supported legacy fallback. This app keeps `2023-06-01` + `x-api-key` (still documented; Anthropic preserves behaviour within a version and this app sends no sampling parameters). Switch both in `src/server/llm.ts` if you prefer the newest version.

These code paths were type-checked and run end to end **with the simulated model only**. They have **not** been exercised against live keys in the build environment. If a provider changes its API, update `src/server/llm.ts` and re-test with a small request.

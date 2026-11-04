# Deploying Agent Academy

Agent Academy is a standard Next.js app. It has no database: progress is kept in each learner's browser. Live AI is optional, so a basic deployment needs **no secrets and no paid services**.

Instructions checked against Vercel's documentation (docs last updated 2026-08-11) on 2026-11-04. Hosting dashboards change, so if a button has moved, follow the linked docs.

## 0. Check that it builds locally

```bash
npm install
npm run build      # must finish with no errors
npm run start      # serves the production build at http://localhost:3000
```

## Option A: Vercel from GitHub (recommended for beginners)

1. Push this project to a GitHub repository.
2. Sign in at https://vercel.com, open **New Project** (https://vercel.com/new), connect your GitHub account, and select the repository.
3. Vercel detects Next.js. Leave the build settings at their defaults and click **Deploy**.
4. When it finishes, open the `*.vercel.app` URL it gives you.
5. From then on, **every push to the connected branch deploys automatically**. To roll back, choose an earlier deployment in the project's **Deployments** list and promote it.

**Cost:** Vercel has a free Hobby plan meant for personal, non-commercial projects. Check https://vercel.com/pricing for the current limits before you rely on it, and for commercial use.

## Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel          # creates a preview deployment
vercel --prod   # deploys to production
```

## Optional: turning on live AI in production

In the Vercel project, open **Settings → Environment Variables** and add the variables from `.env.example` (see `docs/LIVE_AI.md`), then redeploy. On any public site, **also**:

- set `LIVE_ACCESS_CODE`, so that random visitors cannot spend your money;
- set a spending limit in the AI provider's billing dashboard;
- remember that the built-in rate limits are in memory and per instance (see `docs/LIVE_AI.md`).

Without these variables the site works fully in simulated mode, and `/api/status` reports `"live": false`.

## Option C: any Node.js host (VPS, Render, Railway, etc.)

```bash
npm ci
npm run build
PORT=3000 npm run start
```

Put it behind HTTPS (most platforms do this for you) and point your domain's DNS record at the host. Module 16 of the course explains DNS, HTTPS and environment variables step by step.

## Smoke test after deploying

- `/` loads the dashboard.
- `/learn/m0/m0-l1`: press **Play** in the lab, and all three columns should run.
- `/api/status` returns JSON.
- Use the browser's DevTools Network tab: no request should contain an API key.

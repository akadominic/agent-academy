"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileCode2, Folder, Globe, KeyRound, Pause, Play, RotateCcw, Server, ShieldAlert, ShieldCheck, SkipForward, UserX, XCircle } from "lucide-react";
import { Badge, Button, Segmented, SimBadge, cx } from "@/components/ui/primitives";
import { CodeBlock } from "@/components/lesson/CodeBlock";
import type { LabProps } from "../types";
import {
  ATTACK, CALL_CHOICES, LEAK_CHOICES, PLACEMENT_CHOICES, PROJECT_FILES, SIM_KEY,
  attackerCostUSD, checkGitignore, committedFiles, gitignoreText, isCorrect, type Choice,
} from "./keyExposure";

/* ------------------------------------------------------------------ */
/*  Code shown in the two versions                                      */
/* ------------------------------------------------------------------ */

const BAD_PAGE = `"use client"; // this file runs in the visitor's browser

const API_KEY = "${SIM_KEY}"; // ✗ shipped to every visitor

export async function ask(question) {
  const res = await fetch("https://api.model-provider.example/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${API_KEY}\`,
    },
    body: JSON.stringify({
      model: "sim-small-1",
      max_tokens: 300,
      messages: [{ role: "user", content: question }],
    }),
  });
  return res.json();
}`;

const GOOD_PAGE = `"use client"; // runs in the browser: NO key here

export async function ask(question) {
  const res = await fetch("/api/ask", {        // your own server
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return res.json();
}`;

const GOOD_ROUTE = `// app/api/ask/route.ts: runs ONLY on your server
export async function POST(request: Request) {
  const { question } = await request.json();
  if (typeof question !== "string" || question.length > 2000) {
    return Response.json({ error: "Bad question" }, { status: 400 });
  }

  const res = await fetch("https://api.model-provider.example/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.MODEL_API_KEY}\`, // read on the server
    },
    body: JSON.stringify({
      model: process.env.MODEL_ID,
      max_tokens: 300,
      messages: [{ role: "user", content: question }],
    }),
  });
  if (!res.ok) return Response.json({ error: "Model call failed" }, { status: 502 });
  const data = await res.json();
  return Response.json({ answer: data.content[0].text });
}`;

const GOOD_ENV = `# .env.local: on the server only, listed in .gitignore
MODEL_API_KEY=${SIM_KEY}
MODEL_ID=sim-small-1`;

/* ------------------------------------------------------------------ */
/*  Simulated DevTools                                                  */
/* ------------------------------------------------------------------ */

function DevTools({ variant }: { variant: "bad" | "good" }) {
  const [tab, setTab] = useState<"network" | "sources">("network");
  const bad = variant === "bad";
  const keyLine = (text: string) => (
    <mark className="rounded bg-[color-mix(in_srgb,var(--c-safety)_25%,transparent)] px-0.5 text-ink">{text}</mark>
  );
  return (
    <div className="overflow-hidden rounded-lg border border-line-strong bg-bg text-[12px]">
      <div className="flex items-center gap-2 border-b border-line bg-sunken px-2 py-1">
        <span className="font-semibold text-ink-2">DevTools</span>
        <span className="text-ink-3">(what any visitor sees after pressing F12)</span>
      </div>
      <div className="flex gap-1 border-b border-line px-2 pt-1" role="tablist" aria-label="DevTools panels">
        {(["network", "sources"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx("rounded-t px-2 py-1 capitalize", tab === t ? "border-b-2 border-accent font-semibold text-ink" : "text-ink-3 hover:text-ink")}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-1 p-2 font-mono leading-relaxed" role="tabpanel">
        {tab === "network" ? (
          bad ? (
            <>
              <div className="text-ink-3">Name: messages · POST · 200 · api.model-provider.example</div>
              <div className="font-semibold text-ink-2">Request Headers</div>
              <div>content-type: application/json</div>
              <div>authorization: {keyLine(`Bearer ${SIM_KEY}`)}</div>
              <div className="font-semibold text-ink-2">Payload</div>
              <div className="break-all">{`{"model":"sim-small-1","max_tokens":300,"messages":[…]}`}</div>
            </>
          ) : (
            <>
              <div className="text-ink-3">Name: ask · POST · 200 · (your own site)</div>
              <div className="font-semibold text-ink-2">Request Headers</div>
              <div>content-type: application/json</div>
              <div className="text-ok">(no authorization header: the browser has no key)</div>
              <div className="font-semibold text-ink-2">Payload</div>
              <div>{`{"question":"Do you deliver to Ntinda?"}`}</div>
              <div className="text-ink-3">The call to the model provider happens on the server, so it never appears here.</div>
            </>
          )
        ) : bad ? (
          <>
            <div className="text-ink-3">_next/static/chunks/app/page-3f9a2c.js</div>
            <div className="break-all">{"…function a(t){return fetch(\"https://api.model-provider.example/v1/messages\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\",Authorization:\"Bearer \"+"}{keyLine(`"${SIM_KEY}"`)}{"},…"}</div>
            <div className="text-ink-3">Minified, but the key is plain text. Search for &quot;sk-&quot; finds it in a second.</div>
          </>
        ) : (
          <>
            <div className="text-ink-3">_next/static/chunks/app/page-8b1d07.js</div>
            <div className="break-all">{"…function a(t){return fetch(\"/api/ask\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({question:t})})…"}</div>
            <div className="text-ok">No key anywhere in the browser&apos;s files.</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The bad actor, step by step                                         */
/* ------------------------------------------------------------------ */

const cost = attackerCostUSD(ATTACK);

const BAD_STEPS = [
  { title: "A visitor opens your site and presses F12", text: "DevTools opens. This is a normal browser feature; no hacking skill is needed." },
  { title: "They read the key from the Network or Sources panel", text: `The Authorization header (or your JavaScript file) contains ${SIM_KEY.slice(0, 14)}…. They copy it.` },
  { title: "They run their own script with YOUR key", text: `From their own computer: ${ATTACK.requestsPerSecond} requests a second, all night. The provider sees a valid key, so it serves every request.` },
  { title: "The bill comes to you", text: `${ATTACK.hours} hours × ${ATTACK.requestsPerSecond} requests/s = ${cost.requests.toLocaleString("en-US")} requests ≈ ${(cost.tokens / 1e6).toLocaleString("en-US")} million tokens. At an illustrative $${ATTACK.usdPerMillionTokens} per million tokens, that is about $${Math.round(cost.usd).toLocaleString("en-US")}.` },
  { title: "Your real users are blocked too", text: "The attacker also uses up your rate limit, so your shop's own requests start getting 429 Too Many Requests." },
];

const GOOD_STEPS = [
  { title: "A visitor opens DevTools", text: "They look through Network and Sources." },
  { title: "No key to find", text: "The browser only ever talked to /api/ask on your own site. The key lives in the server's environment." },
  { title: "They call /api/ask directly with a script", text: "This still works: your route is public. So your route needs its own protection." },
  { title: "Your route protects itself", text: "Real apps add: a login, a per-user rate limit, a cap on question length and max_tokens, and a monthly spend limit at the provider. Now the worst case is small and visible." },
];

function Walkthrough({ steps, variant }: { steps: { title: string; text: string }[]; variant: "bad" | "good" }) {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);
  const done = shown >= steps.length;
  useEffect(() => {
    if (!playing) return;
    if (done) { setPlaying(false); return; }
    const t = setTimeout(() => setShown((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, shown, done]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={variant === "bad" ? "danger" : "primary"} onClick={() => setPlaying((p) => !p)} disabled={done}>
          {playing ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Play the bad actor</>}
        </Button>
        <Button size="sm" onClick={() => setShown((s) => Math.min(steps.length, s + 1))} disabled={done}>
          <SkipForward className="h-4 w-4" /> Step
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setShown(0); setPlaying(false); }}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>
      <ol className="space-y-1.5" aria-live="polite">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} className={cx("rounded-lg border px-2.5 py-1.5 text-sm", variant === "bad" ? "border-safety/40" : "border-ok/40")}>
            <div className="flex items-center gap-1.5 font-medium">
              {variant === "bad" ? <UserX className="h-4 w-4 shrink-0 text-safety" aria-hidden /> : <ShieldCheck className="h-4 w-4 shrink-0 text-ok" aria-hidden />}
              {i + 1}. {s.title}
            </div>
            <div className="text-ink-2">{s.text}</div>
          </li>
        ))}
      </ol>
      {variant === "bad" && shown >= 4 && (
        <div className="rounded-lg border border-safety/50 bg-[color-mix(in_srgb,var(--c-safety)_7%,transparent)] px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2 font-semibold text-safety">
            Charges overnight: ${Math.round(cost.usd).toLocaleString("en-US")} <Badge tone="warn">Illustrative</Badge>
          </div>
          <p className="text-xs text-ink-2">Made-up but realistic numbers. Real prices differ by provider and model, and a spend limit (if you set one) would stop it sooner, but you would still pay up to that limit.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Architecture diagrams                                               */
/* ------------------------------------------------------------------ */

function Diagram({ variant }: { variant: "bad" | "good" }) {
  const bad = variant === "bad";
  return (
    <svg viewBox="0 0 320 96" className="w-full" role="img" aria-label={bad ? "The browser holds the key and calls the model provider directly." : "The browser calls your server; only your server holds the key and calls the model provider."}>
      {/* boxes */}
      <rect x="4" y="22" width="88" height="52" rx="10" fill="var(--bg-raised)" stroke="var(--c-people)" strokeWidth="2" />
      <text x="48" y="44" textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight="600">Browser</text>
      <text x="48" y="60" textAnchor="middle" fontSize="9" fill={bad ? "var(--c-safety)" : "var(--ink-3)"}>{bad ? "🔑 key here!" : "no key"}</text>
      {!bad && (
        <>
          <rect x="116" y="22" width="88" height="52" rx="10" fill="var(--bg-raised)" stroke="var(--c-control)" strokeWidth="2" />
          <text x="160" y="44" textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight="600">Your server</text>
          <text x="160" y="60" textAnchor="middle" fontSize="9" fill="var(--c-ok)">🔑 key in env</text>
        </>
      )}
      <rect x="228" y="22" width="88" height="52" rx="10" fill="var(--bg-raised)" stroke="var(--c-tool)" strokeWidth="2" />
      <text x="272" y="44" textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight="600">Model</text>
      <text x="272" y="58" textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight="600">provider</text>
      {/* arrows */}
      {bad ? (
        <>
          <path d="M92 48 H226" stroke="var(--c-safety)" strokeWidth="2" className="flow-active" fill="none" markerEnd="url(#arr-bad)" />
          <text x="160" y="40" textAnchor="middle" fontSize="9" fill="var(--c-safety)">key travels from the browser</text>
          <defs><marker id="arr-bad" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--c-safety)" /></marker></defs>
        </>
      ) : (
        <>
          <path d="M92 48 H114" stroke="var(--c-people)" strokeWidth="2" className="flow-active" fill="none" markerEnd="url(#arr-good1)" />
          <path d="M204 48 H226" stroke="var(--c-control)" strokeWidth="2" className="flow-active" fill="none" markerEnd="url(#arr-good2)" />
          <text x="103" y="88" textAnchor="middle" fontSize="8.5" fill="var(--ink-3)">/api/ask</text>
          <text x="215" y="88" textAnchor="middle" fontSize="8.5" fill="var(--ink-3)">+ key</text>
          <defs>
            <marker id="arr-good1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--c-people)" /></marker>
            <marker id="arr-good2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--c-control)" /></marker>
          </defs>
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Fix-it challenge                                                    */
/* ------------------------------------------------------------------ */

function ChoiceGroup({ name, legend, choices, value, onChange }: { name: string; legend: string; choices: Choice[]; value: string | null; onChange: (id: string) => void }) {
  const picked = choices.find((c) => c.id === value);
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1 font-medium">{legend}</legend>
      {choices.map((c) => (
        <label
          key={c.id}
          className={cx(
            "flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 text-sm hover:bg-sunken",
            value === c.id ? (c.correct ? "border-ok/60" : "border-safety/50") : "border-line",
          )}
        >
          <input type="radio" name={name} checked={value === c.id} onChange={() => onChange(c.id)} className="mt-1 accent-[var(--accent)]" />
          <span className={cx(c.text.startsWith("fetch") && "break-all font-mono text-[12px]")}>{c.text}</span>
        </label>
      ))}
      {picked && (
        <p className={cx("flex items-start gap-1.5 text-sm", picked.correct ? "text-ok" : "text-safety")} aria-live="polite">
          {picked.correct ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="text-ink-2">{picked.why}</span>
        </p>
      )}
    </fieldset>
  );
}

function FixIt({ onComplete }: { onComplete?: (s?: string) => void }) {
  const [place, setPlace] = useState<string | null>(null);
  const [call, setCall] = useState<string | null>(null);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [leak, setLeak] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  const g = checkGitignore(ignored);
  const okPlace = isCorrect(PLACEMENT_CHOICES, place);
  const okCall = isCorrect(CALL_CHOICES, call);
  const okIgnore = checked && g.ok;
  const okLeak = isCorrect(LEAK_CHOICES, leak);
  const allOk = okPlace && okCall && okIgnore && okLeak;
  const doneCount = [okPlace, okCall, okIgnore, okLeak].filter(Boolean).length;

  useEffect(() => {
    if (allOk && !reported) {
      setReported(true);
      onComplete?.("Moved the key to the server and ignored .env.local");
    }
  }, [allOk, reported, onComplete]);

  const toggle = (path: string) => {
    setChecked(false);
    setIgnored((s) => (s.includes(path) ? s.filter((x) => x !== path) : [...s, path]));
  };

  return (
    <section aria-label="Fix it challenge" className="space-y-4 rounded-xl border border-accent/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Your challenge: fix Mama Achen&apos;s chat page</h3>
        <span className="text-xs text-ink-3">{doneCount}/4 steps correct</span>
      </div>
      <p className="text-sm text-ink-2">Her nephew built a chat helper with the key in the browser code (version A). Move it to the server, keep it out of Git, and deal with the leak.</p>

      <ChoiceGroup name="place" legend="Step 1. Where should the key live?" choices={PLACEMENT_CHOICES} value={place} onChange={setPlace} />
      <ChoiceGroup name="call" legend="Step 2. What should the browser code call now?" choices={CALL_CHOICES} value={call} onChange={setCall} />

      <fieldset className="space-y-2">
        <legend className="mb-1 font-medium">Step 3. Tick every file or folder that must go in <code className="font-mono">.gitignore</code> (never committed).</legend>
        <ul className="rounded-lg border border-line p-2 font-mono text-[13px]" aria-label="Project files">
          <li className="flex items-center gap-1.5 text-ink-3"><Folder className="h-4 w-4" aria-hidden /> mama-achen-chat/</li>
          {PROJECT_FILES.map((f) => {
            const sel = ignored.includes(f.path);
            const verdict = checked ? (f.ignore === sel ? "right" : "wrong") : null;
            return (
              <li key={f.path} className="ml-4">
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-sunken">
                  <input type="checkbox" checked={sel} onChange={() => toggle(f.path)} className="h-4 w-4 accent-[var(--accent)]" />
                  {f.path.endsWith("/") ? <Folder className="h-4 w-4 text-ink-3" aria-hidden /> : <FileCode2 className="h-4 w-4 text-ink-3" aria-hidden />}
                  <span className={cx(f.path.startsWith(".env.local") && "text-safety")}>{f.path}</span>
                  {verdict === "wrong" && <XCircle className="h-4 w-4 text-safety" aria-hidden />}
                </label>
                {checked && verdict === "wrong" && <p className="ml-7 font-sans text-xs text-ink-2">{f.why}</p>}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => setChecked(true)}>Check my .gitignore</Button>
          {checked && (g.ok ? <span className="text-sm text-ok">Correct.</span> : <span className="text-sm text-safety">Not yet: {g.missing.length ? `missing ${g.missing.join(", ")}` : ""}{g.missing.length && g.wrong.length ? "; " : ""}{g.wrong.length ? `should be committed: ${g.wrong.join(", ")}` : ""}</span>)}
        </div>
        {checked && (
          <div className="grid gap-2 @2xl:grid-cols-2">
            <CodeBlock code={gitignoreText(ignored)} lang="text" caption=".gitignore" />
            <CodeBlock code={`$ git add . && git status\nChanges to be committed:\n${committedFiles(ignored).map((f) => `  new file: ${f}`).join("\n")}`} lang="bash" />
          </div>
        )}
      </fieldset>

      <ChoiceGroup name="leak" legend="Step 4. Yesterday, before this fix, the old page.tsx (with the key) was pushed to a public GitHub repository. What do you do?" choices={LEAK_CHOICES} value={leak} onChange={setLeak} />

      {allOk && (
        <div className="flex items-start gap-2 rounded-lg border border-ok/50 px-3 py-2 text-sm" aria-live="polite">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
          <span><strong>Fixed.</strong> The key now lives only in the server&apos;s environment, .env.local is never committed, and the leaked key is revoked. This is the pattern you will use for every AI app in this course.</span>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

export default function KeyExposure({ onComplete }: LabProps) {
  const [goodFile, setGoodFile] = useState<"page" | "route" | "env">("page");
  const goodCode = useMemo(() => (goodFile === "page" ? GOOD_PAGE : goodFile === "route" ? GOOD_ROUTE : GOOD_ENV), [goodFile]);

  return (
    <div className="@container space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
        <SimBadge label="Simulated" />
        <span>A simulated browser, server and attacker. The key is fake and nothing is sent anywhere.</span>
      </div>

      <div className="grid gap-4 @3xl:grid-cols-2">
        <section aria-label="Version A: key in browser code" className="min-w-0 space-y-3 rounded-xl border-2 border-safety/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-safety" aria-hidden />
            <h3 className="font-semibold">A. API key in browser code</h3>
            <Badge tone="danger">Exposed</Badge>
          </div>
          <Diagram variant="bad" />
          <CodeBlock code={BAD_PAGE} lang="js" caption="app/page.tsx" maxHeight={220} />
          <DevTools variant="bad" />
          <Walkthrough steps={BAD_STEPS} variant="bad" />
        </section>

        <section aria-label="Version B: key on the server" className="min-w-0 space-y-3 rounded-xl border-2 border-ok/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Server className="h-5 w-5 text-ok" aria-hidden />
            <h3 className="font-semibold">B. API key on the server</h3>
            <Badge tone="ok">Protected</Badge>
          </div>
          <Diagram variant="good" />
          <Segmented<"page" | "route" | "env">
            label="Which file to show"
            size="sm"
            value={goodFile}
            onChange={setGoodFile}
            options={[
              { value: "page", label: <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> page.tsx</span> },
              { value: "route", label: <span className="inline-flex items-center gap-1"><Server className="h-3.5 w-3.5" /> route.ts</span> },
              { value: "env", label: <span className="inline-flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> .env.local</span> },
            ]}
          />
          <CodeBlock code={goodCode} lang={goodFile === "env" ? "bash" : "js"} caption={goodFile === "page" ? "app/page.tsx (browser)" : goodFile === "route" ? "app/api/ask/route.ts (server)" : ".env.local (server only, never committed)"} maxHeight={220} />
          <DevTools variant="good" />
          <Walkthrough steps={GOOD_STEPS} variant="good" />
        </section>
      </div>

      <FixIt onComplete={onComplete} />
    </div>
  );
}

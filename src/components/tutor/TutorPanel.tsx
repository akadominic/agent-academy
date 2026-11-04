"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GraduationCap, Send, X } from "lucide-react";
import { getLesson } from "@/content/curriculum";
import { GLOSSARY } from "@/content/glossary";
import { Button, SimBadge, cx } from "@/components/ui/primitives";
import { Markup } from "@/components/lesson/Markup";

/* --------------------------- lesson context --------------------------- */
let currentLessonId: string | null = null;
const ctxListeners = new Set<() => void>();
export function setTutorLesson(id: string | null) {
  currentLessonId = id;
  ctxListeners.forEach((l) => l());
}
function useTutorLesson() {
  return useSyncExternalStore(
    (cb) => { ctxListeners.add(cb); return () => ctxListeners.delete(cb); },
    () => currentLessonId,
    () => null,
  );
}

let openState = false;
const openListeners = new Set<() => void>();
export function openTutor() {
  openState = true;
  openListeners.forEach((l) => l());
}
function setOpen(v: boolean) {
  openState = v;
  openListeners.forEach((l) => l());
}
function useOpen() {
  return useSyncExternalStore((cb) => { openListeners.add(cb); return () => openListeners.delete(cb); }, () => openState, () => false);
}

/* ----------------------------- messages ----------------------------- */
interface Msg { from: "you" | "tutor"; text: string; live?: boolean }

const LIVE_LIMIT = 20;

export function TutorLauncher() {
  const open = useOpen();
  const lessonId = useTutorLesson();
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [live, setLive] = useState<{ available: boolean; provider?: string } | null>(null);
  const [useLive, setUseLive] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [probeIdx, setProbeIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || live) return;
    fetch("/api/status").then((r) => r.json()).then((s) => setLive({ available: Boolean(s.tutor), provider: s.provider })).catch(() => setLive({ available: false }));
  }, [open, live]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => setMsgs([]), [lessonId]);

  const say = (you: string, tutor: string) => setMsgs((m) => [...m, { from: "you", text: you }, { from: "tutor", text: tutor }]);

  const quick = lesson
    ? [
        { label: "Explain it more simply", run: () => say("Explain it more simply.", lesson.tutor.simpler) },
        { label: "Give me another analogy", run: () => say("Give me a different analogy.", lesson.tutor.altAnalogy) },
        {
          label: "Ask me a question",
          run: () => {
            const q = lesson.tutor.probingQuestions[probeIdx % lesson.tutor.probingQuestions.length];
            setProbeIdx((i) => i + 1);
            say("Ask me a question to check my understanding.", `${q}\n\nThink it through, then write your answer in the Teach-it-back box or compare with the lesson.`);
          },
        },
        {
          label: "Common mistakes",
          run: () => say("What do people often get wrong here?", lesson.tutor.misconceptions.map((m) => `• ${m}`).join("\n")),
        },
        {
          label: "What should I review?",
          run: () => {
            const ids = [...(lesson.tutor.revisit ?? []), ...lesson.prerequisites].filter((v, i, a) => a.indexOf(v) === i);
            const names = ids.map((id) => getLesson(id)).filter(Boolean).map((l) => `• ${l!.title}`);
            say("Which earlier lessons should I review?", names.length ? `If this feels hard, revisit:\n${names.join("\n")}` : "This lesson has no prerequisites — start from the problem section and take it slowly.");
          },
        },
      ]
    : [];

  async function ask() {
    const q = input.trim();
    if (!q) return;
    setInput("");
    if (useLive && live?.available && liveCount < LIVE_LIMIT) {
      setMsgs((m) => [...m, { from: "you", text: q }]);
      setBusy(true);
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question: q,
            lessonId: lesson?.id,
            history: msgs.slice(-6).map((m) => ({ role: m.from === "you" ? "user" : "assistant", content: m.text })),
          }),
        });
        const data = await res.json();
        setLiveCount((c) => c + 1);
        setMsgs((m) => [...m, { from: "tutor", text: res.ok ? data.answer : `The live tutor could not answer: ${data.error}`, live: res.ok }]);
      } catch (e) {
        setMsgs((m) => [...m, { from: "tutor", text: `Network problem: ${(e as Error).message}` }]);
      } finally {
        setBusy(false);
      }
      return;
    }
    say(q, offlineAnswer(q, lesson?.id));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-40 inline-flex items-center gap-2 rounded-full border border-line-strong bg-raised px-3 py-3 sm:bottom-4 sm:right-4 sm:px-4 sm:py-2.5 text-sm font-medium shadow-lg hover:bg-sunken"
        aria-label="Open the tutor"
      >
        <GraduationCap className="h-4 w-4 text-accent" /> <span className="hidden sm:inline">Tutor</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Tutor"
      className="fixed inset-x-2 bottom-2 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-line-strong bg-raised shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[400px]"
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <GraduationCap className="h-5 w-5 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">Tutor</div>
          <div className="truncate text-xs text-ink-3">{lesson ? `Helping with: ${lesson.title}` : "Open a lesson for lesson-specific help"}</div>
        </div>
        {useLive && live?.available ? <SimBadge live label="Live AI" /> : <SimBadge label="Offline hints" />}
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-3 hover:bg-sunken" aria-label="Close tutor">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
        {msgs.length === 0 && (
          <div className="space-y-2 text-ink-2">
            <p>
              I&apos;m a patient study helper. In offline mode I use hints written by the course authors for each lesson — I am not an AI
              and I don&apos;t remember anything after you close this tab.
            </p>
            {!lesson && <p>Open any lesson and I&apos;ll know which topic you&apos;re on.</p>}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cx("whitespace-pre-line rounded-xl px-3 py-2 leading-relaxed", m.from === "you" ? "ml-8 bg-accent-soft" : "mr-4 bg-sunken")}>
            {m.from === "tutor" ? <Markup text={m.text} /> : m.text}
          </div>
        ))}
        {busy && <div className="mr-4 animate-pulse rounded-xl bg-sunken px-3 py-2 text-ink-3">Thinking…</div>}
      </div>

      {quick.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
          {quick.map((q) => (
            <button key={q.label} onClick={q.run} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-accent hover:text-accent">
              {q.label}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-line p-3">
        {live?.available && (
          <label className="mb-2 flex items-center gap-2 text-xs text-ink-2">
            <input type="checkbox" checked={useLive} onChange={(e) => setUseLive(e.target.checked)} />
            Use live AI tutor ({live.provider}) — uses a paid API; {Math.max(0, LIVE_LIMIT - liveCount)} questions left this session
          </label>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={useLive ? "Ask anything about this lesson…" : "Ask about a term, e.g. 'what is idempotency?'"}
            className="min-w-0 flex-1 rounded-lg border border-line-strong bg-bg px-3 py-2 text-sm"
            aria-label="Your question"
          />
          <Button type="submit" variant="primary" size="md" aria-label="Send" disabled={busy}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}

/** Offline answers: match glossary terms in the question. Honest when it cannot help. */
export function offlineAnswer(question: string, lessonId?: string): string {
  const q = question.toLowerCase();
  const hits = GLOSSARY.filter((t) => {
    const words = [t.term.toLowerCase().replace(/\s*\(.*\)/, ""), t.id.replace(/-/g, " ")];
    return words.some((w) => w.length > 2 && q.includes(w));
  }).slice(0, 2);
  if (hits.length) {
    return hits
      .map((t) => `**${t.term}** — ${t.short}${t.analogy ? `\n\nEveryday picture: ${t.analogy}` : ""}`)
      .join("\n\n");
  }
  return (
    "I can't understand free-form questions in offline mode — I only match words from the glossary. Try the buttons above, " +
    "or ask about a specific term (for example “what is a token?”)." +
    (lessonId ? "" : "\n\nTip: open a lesson so the buttons can give lesson-specific help.")
  );
}

export function TutorLink() {
  return (
    <Link href="#" onClick={(e) => { e.preventDefault(); openTutor(); }} className="text-accent hover:underline">
      Ask the tutor
    </Link>
  );
}

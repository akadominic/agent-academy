"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CheckCircle2, Circle, FileCode2, Folder, FolderOpen, Keyboard, Lightbulb, RotateCcw, Save, X } from "lucide-react";
import { runCode } from "@/engine/runner/runCode";
import { Button, Callout, SimBadge, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  MISSION_SETS, advanceMissions, complete, displayPath, execute, getNode, initialState, prompt, tree, writeFile,
  type Line, type TermState, type Tone,
} from "./terminalEngine";

type SetId = "basics" | "project";

/* The terminal surface is always dark (like a real terminal), so its text colours are fixed for contrast in both themes. */
const TONE: Record<Tone, string> = {
  dir: "text-[#7cb7ff] font-semibold",
  file: "text-code-ink",
  err: "text-[#ff8a9a]",
  ok: "text-[#7ee2a0]",
  muted: "text-[#a8a093] italic",
  warn: "text-[#f6c177]",
  accent: "text-[#f6c177] font-semibold",
};

interface Entry { kind: "cmd" | "out"; prompt?: string; text?: string; line?: Line }

const GIT_MARK: Record<string, { label: string; cls: string; title: string }> = {
  U: { label: "U", cls: "text-safety", title: "Untracked: Git sees this file but is not tracking it yet" },
  A: { label: "A", cls: "text-ok", title: "Added (staged): will be included in the next commit" },
  M: { label: "M", cls: "text-warn", title: "Modified: changed since it was staged or committed" },
  C: { label: "✓", cls: "text-ink-3", title: "Committed: saved in Git, no changes" },
};

function welcome(set: SetId): Entry[] {
  const lines: Line[] = [
    [{ text: "Agent Academy practice terminal — SIMULATED (nothing here touches a real computer).", tone: "accent" }],
    [{ text: set === "basics" ? "Follow the missions on the right. Type a command and press Enter." : "A folder called shop already exists in your home folder. Follow the missions.", tone: "muted" }],
    [{ text: "Type  help  for the list of commands.", tone: "muted" }],
  ];
  return lines.map((line) => ({ kind: "out", line }));
}

export default function TerminalSim({ onComplete, missions: setProp }: LabProps & { missions?: SetId }) {
  const set: SetId = setProp === "project" ? "project" : "basics";
  const missions = MISSION_SETS[set];
  const [state, setState] = useState<TermState>(() => initialState(set));
  const [entries, setEntries] = useState<Entry[]>(() => welcome(set));
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState<number | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [editing, setEditing] = useState<{ path: string[]; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const completed = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  useEffect(() => {
    if (doneCount >= missions.length && !completed.current) {
      completed.current = true;
      onComplete?.(`Completed ${missions.length} terminal missions`);
    }
  }, [doneCount, missions.length, onComplete]);

  const applyState = useCallback((next: TermState) => {
    setState(next);
    setDoneCount((n) => {
      const m = advanceMissions(missions, n, next);
      if (m !== n) setShowHint(false);
      return m;
    });
  }, [missions]);

  async function submit() {
    if (busy) return;
    const cmd = input;
    setInput("");
    setHIndex(null);
    if (cmd.trim()) setHistory((h) => [...h, cmd]);
    const p = prompt(state);
    const r = execute(state, cmd);
    if (r.clear) {
      setEntries([]);
      applyState(r.state);
      return;
    }
    const newEntries: Entry[] = [{ kind: "cmd", prompt: p, text: cmd }, ...r.out.map((line) => ({ kind: "out" as const, line }))];
    setEntries((e) => [...e, ...newEntries].slice(-400));
    applyState(r.state);
    if (r.effect?.kind === "run-js") {
      setBusy(true);
      const res = await runCode(r.effect.code, [], 2000);
      const lines: Line[] = res.logs.map((l) => [{ text: l }]);
      if (res.error) {
        lines.push([{ text: res.error, tone: "err" }]);
        if (/require is not defined|Cannot use import/.test(res.error)) {
          lines.push([{ text: "(This simulation runs plain JavaScript only; it cannot load packages. On a real computer, Node.js can.)", tone: "muted" }]);
        }
      }
      setEntries((e) => [...e, ...lines.map((line) => ({ kind: "out" as const, line }))]);
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); void submit(); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = hIndex === null ? history.length - 1 : Math.max(0, hIndex - 1);
      setHIndex(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIndex === null) return;
      const i = hIndex + 1;
      if (i >= history.length) { setHIndex(null); setInput(""); } else { setHIndex(i); setInput(history[i]); }
    } else if (e.key === "Tab") {
      const c = complete(state, input);
      if (c !== input) { e.preventDefault(); setInput(c); }
    }
  }

  function reset() {
    setState(initialState(set));
    setEntries(welcome(set));
    setDoneCount(0);
    setShowHint(false);
    setEditing(null);
    setHistory([]);
    completed.current = false;
  }

  function openFile(path: string[]) {
    const node = getNode(state.fs, path);
    if (node?.type === "file") setEditing({ path, text: node.content });
  }

  function saveFile() {
    if (!editing) return;
    applyState(writeFile(state, editing.path, editing.text.endsWith("\n") || !editing.text ? editing.text : editing.text + "\n"));
    setEntries((e) => [...e, { kind: "out", line: [{ text: `(saved ${displayPath(state, editing.path)} in the mini editor)`, tone: "muted" }] }]);
    setEditing(null);
  }

  const rows = useMemo(() => tree(state), [state]);
  const current = missions[doneCount];
  const allDone = doneCount >= missions.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SimBadge label="Simulated terminal" />
        <span className="text-xs text-ink-3">A practice copy of a real terminal (bash). Commands and messages match the real tools closely, but are simplified.</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={reset}><RotateCcw className="h-4 w-4" /> Start again</Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        {/* Terminal */}
        <div className="min-w-0 space-y-2">
          <div
            className="overflow-hidden rounded-xl border border-line-strong bg-code shadow-sm"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
              <span className="ml-2 truncate font-mono text-[11px] text-[#a8a093]">student@laptop — {displayPath(state)} — simulated</span>
            </div>
            <div
              ref={scrollRef}
              className="h-[300px] overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-relaxed text-code-ink sm:h-[340px]"
              role="log"
              aria-live="polite"
              aria-label="Terminal output"
              tabIndex={0}
            >
              {entries.map((e, i) =>
                e.kind === "cmd" ? (
                  <div key={i} className="whitespace-pre-wrap break-words">
                    <span className="text-[#7ee2a0]">{e.prompt}</span> <span>{e.text}</span>
                  </div>
                ) : (
                  <div key={i} className="min-h-[1.2em] whitespace-pre-wrap break-words">
                    {e.line!.map((s, j) => <span key={j} className={s.tone ? TONE[s.tone] : undefined}>{s.text}</span>)}
                  </div>
                ),
              )}
              <div className="flex items-center gap-2">
                <label htmlFor="term-input" className="shrink-0 whitespace-pre text-[#7ee2a0]">{prompt(state)}</label>
                <input
                  id="term-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  disabled={busy}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Type a terminal command and press Enter"
                  className="min-w-0 flex-1 bg-transparent font-mono text-[16px] text-code-ink caret-[#7ee2a0] outline-none sm:text-[12.5px]"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
            <Keyboard className="h-3.5 w-3.5" aria-hidden />
            <span>Enter runs · ↑/↓ repeat earlier commands · Tab completes names</span>
            <Button size="sm" variant="subtle" className="ml-auto" onClick={() => void submit()} disabled={busy || !input.trim()}>Run command</Button>
          </div>
        </div>

        {/* Missions + tree */}
        <div className="min-w-0 space-y-3">
          <div className="rounded-xl border border-line bg-bg/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Missions</span>
              <span className="text-xs text-ink-3">{Math.min(doneCount, missions.length)}/{missions.length}</span>
            </div>
            <ol className="space-y-1.5">
              {missions.map((m, i) => {
                const isDone = i < doneCount;
                const isCur = i === doneCount;
                return (
                  <li key={m.id} className={cx("rounded-lg px-2 py-1.5 text-sm", isCur && "border border-accent/50 bg-accent-soft/40")}>
                    <div className="flex items-start gap-2">
                      {isDone ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="done" /> : <Circle className={cx("mt-0.5 h-4 w-4 shrink-0", isCur ? "text-accent" : "text-ink-3")} aria-hidden />}
                      <span className={cx(isDone && "text-ink-3", isCur && "font-medium text-ink", !isDone && !isCur && "text-ink-3")}>{m.title}</span>
                    </div>
                    {isCur && (
                      <div className="mt-1 pl-6 text-xs text-ink-2">
                        <p>{m.why}</p>
                        {showHint ? (
                          <div className="mt-1.5 space-y-1.5">
                            <code className="block break-all rounded bg-code px-2 py-1 font-mono text-[12px] text-code-ink">{m.command}</code>
                            <Button size="sm" variant="secondary" onClick={() => { setInput(m.command); inputRef.current?.focus(); }}>Put it in the prompt</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="mt-1 -ml-2" onClick={() => setShowHint(true)}><Lightbulb className="h-3.5 w-3.5" /> Show the command</Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {allDone && <p className="mt-2 text-sm font-medium text-ok" aria-live="polite">All missions done. You used the same commands real developers type every day.</p>}
            {current && <span className="sr-only" aria-live="polite">Current mission: {current.title}</span>}
          </div>

          <div className="rounded-xl border border-line bg-bg/60 p-3">
            <div className="mb-1 text-sm font-semibold">Folder tree</div>
            <p className="mb-2 text-xs text-ink-3">Updates as you type. Click a file to open it in the mini editor.</p>
            <ul className="max-h-[260px] space-y-0.5 overflow-auto font-mono text-[12.5px]" aria-label="Files and folders">
              {rows.map((r) => {
                const mark = r.git ? GIT_MARK[r.git] : undefined;
                const Icon = r.isDir ? (r.isCwd ? FolderOpen : Folder) : FileCode2;
                const content = (
                  <>
                    <Icon className={cx("h-3.5 w-3.5 shrink-0", r.isDir ? "text-data" : "text-ink-3")} aria-hidden />
                    <span className={cx("truncate", r.hidden && "opacity-60", r.isCwd && "font-semibold text-accent")}>{r.name}{r.isDir && r.depth > 0 ? "/" : ""}</span>
                    {r.collapsed && <span className="text-[10.5px] text-ink-3">(…)</span>}
                    {r.isCwd && <span className="shrink-0 rounded bg-accent px-1 text-[10px] font-sans font-semibold text-accent-ink">you are here</span>}
                    {mark && <span className={cx("ml-auto shrink-0 font-bold", mark.cls)} title={mark.title} aria-label={mark.title}>{mark.label}</span>}
                  </>
                );
                return (
                  <li key={r.path.join("/")} style={{ paddingLeft: r.depth * 14 }}>
                    {r.isDir ? (
                      <div className="flex items-center gap-1.5 px-1 py-0.5">{content}</div>
                    ) : (
                      <button className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-sunken" onClick={() => openFile(r.path)} aria-label={`Open ${r.name} in the mini editor`}>
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {Object.keys(state.repos).length > 0 && (
              <p className="mt-2 border-t border-line pt-2 text-[11px] text-ink-3">
                Git markers: <span className="font-bold text-safety">U</span> untracked · <span className="font-bold text-ok">A</span> staged · <span className="font-bold text-warn">M</span> modified · <span className="font-bold">✓</span> committed
              </p>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="rounded-xl border border-accent/40 p-3" role="dialog" aria-label="Mini code editor">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Mini editor</span>
            <code className="text-xs text-ink-2">{displayPath(state, editing.path)}</code>
            <span className="text-xs text-ink-3">Stands in for a real code editor such as VS Code.</span>
          </div>
          <label htmlFor="mini-editor" className="sr-only">File contents</label>
          <textarea
            id="mini-editor"
            value={editing.text}
            onChange={(e) => setEditing({ ...editing, text: e.target.value })}
            rows={6}
            spellCheck={false}
            autoCapitalize="off"
            className="w-full rounded-lg bg-code p-2 font-mono text-[13px] text-code-ink outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="primary" onClick={saveFile}><Save className="h-4 w-4" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /> Close without saving</Button>
          </div>
        </div>
      )}

      <Callout tone="sim" title="This is a simulation of a real terminal">
        Nothing you type here runs on your computer, downloads anything or changes real files. The folders live only in this page. <code className="inline-code">node</code> runs your file&apos;s JavaScript in the course&apos;s sandbox (not real Node.js, so packages cannot be loaded), and the npm package list and version numbers are examples. On a real computer you would type the same commands into Terminal (macOS/Linux) or PowerShell/Git Bash (Windows), where some messages look slightly different.
      </Callout>
    </div>
  );
}

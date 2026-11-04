"use client";

import { useMemo, useState } from "react";
import { Code2 } from "lucide-react";
import regions from "@/generated/code-regions.json";
import { CODE_REFS } from "@/content/code-refs";
import { CodeBlock } from "./CodeBlock";
import { Button, cx } from "@/components/ui/primitives";

type Region = { file: string; startLine: number; code: string };
const REGIONS = regions as Record<string, Region>;

export function getRegion(name: string): Region | undefined {
  return REGIONS[name];
}

/** Find 1-based line numbers within `code` whose text contains `match`. */
export function findLine(code: string, match: string): number | undefined {
  const i = code.split("\n").findIndex((l) => l.includes(match));
  return i === -1 ? undefined : i + 1;
}

/**
 * "Show Me the Code": reveals the REAL source behind a demonstration, with
 * line-by-line notes. `activeMatches` lets a lab highlight the lines
 * responsible for what is happening on screen right now.
 */
export function ShowCode({ refId, activeMatches = [], defaultOpen = false, compact = false }: {
  refId: string;
  activeMatches?: string[];
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  const ref = CODE_REFS[refId];
  const region = ref ? REGIONS[ref.region] : undefined;
  const [open, setOpen] = useState(defaultOpen);
  const [selected, setSelected] = useState<number | null>(null);

  const notes = useMemo(() => {
    if (!ref || !region) return [];
    return ref.notes
      .map((n) => ({ ...n, line: findLine(region.code, n.match) }))
      .filter((n): n is typeof n & { line: number } => n.line !== undefined)
      .sort((a, b) => a.line - b.line);
  }, [ref, region]);

  if (!ref || !region) {
    return <p className="text-sm text-safety">Code reference “{refId}” not found.</p>;
  }

  const active = activeMatches.map((m) => findLine(region.code, m)).filter((n): n is number => n !== undefined);
  const highlight = active.length ? active : ref.scaffold === "light" ? [] : notes.map((n) => n.line);
  const selectedNote = notes.find((n) => n.line === selected);

  return (
    <div className="rounded-xl border border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-sunken"
      >
        <Code2 className="h-4 w-4 text-accent" />
        <span className="font-semibold">Show Me the Code</span>
        <span className="truncate text-sm text-ink-3">— {ref.title}</span>
        <span className="ml-auto text-xs text-ink-3">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-line p-3 sm:p-4">
          <p className="text-[15px] text-ink-2">{ref.summary}</p>
          <div className={cx("grid gap-3", !compact && ref.scaffold === "full" && "lg:grid-cols-[1fr_300px]")}>
            <CodeBlock
              code={region.code}
              lang="ts"
              highlight={highlight}
              startLine={region.startLine}
              caption={`${region.file} · lines ${region.startLine}–${region.startLine + region.code.split("\n").length - 1} · this is the real code running in this app`}
              onLineClick={ref.scaffold !== "light" ? (l) => setSelected(l) : undefined}
              activeLine={selected ?? undefined}
              maxHeight={compact ? 320 : 520}
            />
            {ref.scaffold === "full" && !compact && (
              <ol className="space-y-2 text-sm">
                {notes.map((n) => (
                  <li key={n.line}>
                    <button
                      onClick={() => setSelected(n.line)}
                      className={cx("w-full rounded-lg border p-2.5 text-left", selected === n.line ? "border-accent bg-accent-soft/60" : "border-line hover:bg-sunken")}
                    >
                      <span className="font-mono text-xs text-accent">line {region.startLine + n.line - 1}</span>
                      <span className="mt-0.5 block text-ink-2">{n.text}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {(ref.scaffold === "guided" || compact) && (
            <div className="rounded-lg bg-sunken p-3 text-sm text-ink-2" aria-live="polite">
              {selectedNote ? (
                <>
                  <span className="font-mono text-xs text-accent">line {region.startLine + selectedNote.line - 1}: </span>
                  {selectedNote.text}
                </>
              ) : (
                "Click a highlighted line to see what it does."
              )}
            </div>
          )}
          {ref.scaffold === "light" && (
            <p className="text-xs text-ink-3">Less hand-holding now: read the code yourself, then check your understanding with the notes below.</p>
          )}
          {ref.scaffold === "light" && (
            <details className="text-sm">
              <summary className="cursor-pointer text-ink-2">Reveal notes</summary>
              <ul className="mt-2 space-y-1 text-ink-2">
                {notes.map((n) => (
                  <li key={n.line}>
                    <span className="font-mono text-xs text-accent">line {region.startLine + n.line - 1}</span> — {n.text}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Hide code</Button>
        </div>
      )}
    </div>
  );
}

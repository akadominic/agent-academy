"use client";

import Link from "next/link";
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { getTerm } from "@/content/glossary";

/**
 * Renders the lightweight markup used in lesson content:
 *   **bold**   `code`   [[term-id]]  [[term-id|shown text]]
 */
export function Markup({ text }: { text: string }) {
  return <>{renderInline(text)}</>;
}

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\])/g;

export function renderInline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const [id, shown] = part.slice(2, -2).split("|");
      return <GlossaryLink key={i} id={id.trim()} label={shown?.trim()} />;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function GlossaryLink({ id, label }: { id: string; label?: string }) {
  const term = getTerm(id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!term) return <span>{label ?? id}</span>;
  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((o) => !o)}
        className="cursor-help border-b border-dashed border-accent/70 text-inherit hover:text-accent"
      >
        {label ?? term.term}
      </button>
      {open && (
        <span
          id={popId}
          role="dialog"
          aria-label={term.term}
          className="absolute left-0 top-full z-40 mt-2 block w-[min(20rem,80vw)] rounded-xl border border-line-strong bg-raised p-3 text-left text-sm leading-snug shadow-xl"
        >
          <span className="block font-semibold text-ink">{term.term}</span>
          <span className="mt-1 block text-ink-2">{term.short}</span>
          {term.analogy && <span className="mt-2 block text-ink-3 italic">Like: {term.analogy}</span>}
          <Link href={`/glossary#${term.id}`} className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
            Open in glossary →
          </Link>
        </span>
      )}
    </span>
  );
}

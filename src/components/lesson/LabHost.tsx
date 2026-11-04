"use client";

import { Component, lazy, Suspense, useEffect, useMemo, type ComponentType, type ReactNode } from "react";
import { CheckCircle2, WifiOff } from "lucide-react";
import { getLab } from "@/labs/registry";
import type { LabProps } from "@/labs/types";
import { progress } from "@/lib/progress";
import { ModeTag } from "@/components/ui/primitives";

const cache = new Map<string, ComponentType<LabProps>>();

function useLabComponent(id: string) {
  return useMemo(() => {
    const entry = getLab(id);
    if (!entry) return null;
    if (!cache.has(id)) cache.set(id, lazy(entry.load));
    return cache.get(id)!;
  }, [id]);
}

class LabErrorBoundary extends Component<{ children: ReactNode; id: string }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-safety/40 p-4 text-sm">
          <p className="font-semibold text-safety">This lab crashed.</p>
          <p className="mt-1 text-ink-2">{this.state.error.message}</p>
          <button className="mt-2 text-accent underline" onClick={() => this.setState({ error: undefined })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function LabHost({ id, props, caption, done, onComplete, chrome = true }: {
  id: string;
  props?: Record<string, unknown>;
  caption?: string;
  done?: boolean;
  onComplete?: (summary?: string) => void;
  chrome?: boolean;
}) {
  const entry = getLab(id);
  const Lab = useLabComponent(id);
  useEffect(() => {
    if (entry) progress.visitLab(id);
  }, [entry, id]);

  if (!entry || !Lab) return <p className="text-sm text-safety">Lab “{id}” is not registered.</p>;

  const body = (
    <LabErrorBoundary id={id}>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-sunken" aria-label="Loading lab" />}>
        <Lab {...(props ?? {})} onComplete={onComplete} />
      </Suspense>
    </LabErrorBoundary>
  );
  if (!chrome) return body;

  return (
    <figure className="overflow-hidden rounded-2xl border border-line-strong bg-raised" data-lab={id}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-sunken/60 px-4 py-2.5">
        <span className="font-semibold">{entry.title}</span>
        <ModeTag mode={entry.mode} />
        {entry.offline && (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-3" title="Works without internet or an API key">
            <WifiOff className="h-3 w-3" /> Works offline
          </span>
        )}
        {done && <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-ok"><CheckCircle2 className="h-4 w-4" /> Challenge complete</span>}
      </div>
      <div className="p-3 sm:p-4">{body}</div>
      {caption && <figcaption className="border-t border-line px-4 py-2.5 text-sm text-ink-3">{caption}</figcaption>}
    </figure>
  );
}

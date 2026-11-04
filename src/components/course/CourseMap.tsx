"use client";

import Link from "next/link";
import { CheckCircle2, Circle, CircleDashed, Lock, PlayCircle } from "lucide-react";
import { MODULES, TRACKS } from "@/content/curriculum";
import type { CourseModule } from "@/content/schema";
import { useProgress, type ProgressState } from "@/lib/progress";
import { isModuleUnlocked, moduleStats } from "@/lib/course";
import { Badge, cx } from "@/components/ui/primitives";

type Status = "complete" | "active" | "open" | "locked" | "outline";

export function moduleStatus(m: CourseModule, p: ProgressState): Status {
  if (m.status === "outline") return "outline";
  const s = moduleStats(m, p);
  if (s.complete) return "complete";
  if (s.started) return "active";
  return isModuleUnlocked(m, p) ? "open" : "locked";
}

const ICON: Record<Status, React.ReactNode> = {
  complete: <CheckCircle2 className="h-5 w-5 text-ok" />,
  active: <PlayCircle className="h-5 w-5 text-accent" />,
  open: <Circle className="h-5 w-5 text-ink-2" />,
  locked: <Lock className="h-4.5 w-4.5 text-ink-3" />,
  outline: <CircleDashed className="h-5 w-5 text-ink-3" />,
};

/** The course as a visual journey: each module shows the capability it unlocks. */
export function CourseMap({ compact = false }: { compact?: boolean }) {
  const p = useProgress();
  const tracks = Object.entries(TRACKS) as [CourseModule["track"], { label: string; blurb: string }][];

  return (
    <div className="space-y-8">
      {tracks.map(([track, meta]) => {
        const mods = MODULES.filter((m) => m.track === track);
        return (
          <section key={track} aria-labelledby={`track-${track}`}>
            <div className="mb-3 flex items-baseline gap-3">
              <h3 id={`track-${track}`} className="font-display text-xl font-semibold">{meta.label}</h3>
              <span className="text-sm text-ink-3">{meta.blurb}</span>
            </div>
            <ol className={cx("relative grid gap-3", compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-3")}>
              {mods.map((m) => {
                const st = moduleStatus(m, p);
                const s = moduleStats(m, p);
                return (
                  <li key={m.id}>
                    <Link
                      href={`/learn/${m.id}`}
                      className={cx(
                        "group flex h-full flex-col rounded-2xl border p-4 transition-colors",
                        st === "active" && "border-accent bg-accent-soft/40",
                        st === "complete" && "border-ok/50",
                        (st === "open") && "border-line bg-raised hover:border-line-strong",
                        (st === "locked" || st === "outline") && "border-dashed border-line bg-transparent",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0">{ICON[st]}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">Module {m.number}</div>
                          <div className={cx("font-semibold leading-snug", st === "outline" || st === "locked" ? "text-ink-2" : "text-ink")}>{m.title}</div>
                        </div>
                      </div>
                      {!compact && <p className="mt-2 text-sm text-ink-2">{m.goal}</p>}
                      <div className="mt-auto pt-3">
                        <div className="text-[13px]"><span className="font-medium text-accent">Unlocks: </span><span className="text-ink-2">{m.unlocks}</span></div>
                        <div className="mt-2 flex items-center gap-2">
                          {m.status === "outline" ? (
                            <Badge>Outline · lessons in development</Badge>
                          ) : (
                            <>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
                              </div>
                              <span className="text-xs tabular-nums text-ink-3">{s.done}/{s.total}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

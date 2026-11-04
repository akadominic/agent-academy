"use client";

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, FlaskConical, Info, Lightbulb, Radio, Scale, XCircle } from "lucide-react";
import type { CalloutTone, Mode } from "@/content/schema";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }>(
  function Button({ variant = "secondary", size = "md", className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={cx(
          "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 select-none",
          size === "sm" && "h-8 px-2.5 text-[13px]",
          size === "md" && "h-10 px-3.5 text-sm",
          size === "lg" && "h-12 px-5 text-[15px]",
          variant === "primary" && "bg-accent text-accent-ink hover:brightness-110 shadow-sm",
          variant === "secondary" && "border border-line-strong bg-raised text-ink hover:bg-sunken",
          variant === "ghost" && "text-ink-2 hover:bg-sunken hover:text-ink",
          variant === "subtle" && "bg-sunken text-ink hover:bg-line",
          variant === "danger" && "bg-safety text-white hover:brightness-110",
          className,
        )}
        {...rest}
      />
    );
  },
);

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-2xl border border-line bg-raised", className)} {...rest} />;
}

export function Badge({ children, className, tone = "neutral" }: { children: ReactNode; className?: string; tone?: "neutral" | "accent" | "ok" | "warn" | "danger" | "model" | "tool" | "data" | "people" }) {
  const tones: Record<string, string> = {
    neutral: "bg-sunken text-ink-2 border-line",
    accent: "bg-accent-soft text-accent border-transparent",
    ok: "bg-[color-mix(in_srgb,var(--c-ok)_14%,transparent)] text-ok border-transparent",
    warn: "bg-[color-mix(in_srgb,var(--c-warn)_16%,transparent)] text-warn border-transparent",
    danger: "bg-[color-mix(in_srgb,var(--c-safety)_14%,transparent)] text-safety border-transparent",
    model: "bg-[color-mix(in_srgb,var(--c-model)_14%,transparent)] text-model border-transparent",
    tool: "bg-[color-mix(in_srgb,var(--c-tool)_14%,transparent)] text-tool border-transparent",
    data: "bg-[color-mix(in_srgb,var(--c-data)_14%,transparent)] text-data border-transparent",
    people: "bg-[color-mix(in_srgb,var(--c-people)_14%,transparent)] text-people border-transparent",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Every mock system carries this label so simulation is never confused with reality (Principle F). */
export function SimBadge({ live = false, label }: { live?: boolean; label?: string }) {
  return live ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
      <Radio className="h-3 w-3" aria-hidden /> {label ?? "Live model"}
    </span>
  ) : (
    <span
      className="sim-hatch inline-flex items-center gap-1 rounded-full border border-warn/50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-warn"
      title="This is a deterministic simulation written for teaching. It is not a real AI model."
    >
      <FlaskConical className="h-3 w-3" aria-hidden /> {label ?? "Simulated"}
    </span>
  );
}

export const MODE_META: Record<Mode, { label: string; desc: string; className: string }> = {
  understand: { label: "Understand", desc: "Concepts, analogies and diagrams. No code needed.", className: "text-model" },
  experiment: { label: "Experiment", desc: "Change inputs, break things, observe.", className: "text-tool" },
  build: { label: "Build for real", desc: "Write and run real code.", className: "text-accent" },
};

export function ModeTag({ mode }: { mode: Mode }) {
  const m = MODE_META[mode];
  return (
    <span className={cx("text-[11px] font-semibold uppercase tracking-[0.12em]", m.className)} title={m.desc}>
      {m.label}
    </span>
  );
}

const CALLOUT: Record<CalloutTone, { icon: typeof Info; cls: string; label: string }> = {
  info: { icon: Info, cls: "border-data/40 bg-[color-mix(in_srgb,var(--c-data)_7%,transparent)]", label: "Note" },
  tip: { icon: Lightbulb, cls: "border-ok/40 bg-[color-mix(in_srgb,var(--c-ok)_7%,transparent)]", label: "Tip" },
  warn: { icon: AlertTriangle, cls: "border-warn/50 bg-[color-mix(in_srgb,var(--c-warn)_8%,transparent)]", label: "Careful" },
  sim: { icon: FlaskConical, cls: "border-warn/50 sim-hatch", label: "Simulation" },
  misconception: { icon: XCircle, cls: "border-safety/40 bg-[color-mix(in_srgb,var(--c-safety)_6%,transparent)]", label: "Common misconception" },
  cost: { icon: Scale, cls: "border-accent/40 bg-accent-soft/50", label: "Cost" },
};

export function Callout({ tone, title, children }: { tone: CalloutTone; title?: string; children: ReactNode }) {
  const c = CALLOUT[tone];
  const Icon = c.icon;
  return (
    <div className={cx("rounded-xl border px-4 py-3", c.cls)} role="note">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {title ?? c.label}
      </div>
      <div className="text-[15px] leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, className, label }: { value: number; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-sunken", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-sunken px-1.5 py-0.5 font-mono text-[11px]">{children}</kbd>;
}

export function Segmented<T extends string>({
  value, onChange, options, label, size = "md",
}: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; size?: "sm" | "md" }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-sunken p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-lg font-medium transition-colors",
            size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
            value === o.value ? "bg-raised text-ink shadow-sm" : "text-ink-3 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, tone = "accent" }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; tone?: "accent" | "danger" }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1.5 hover:bg-sunken">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={cx("h-5 w-9 rounded-full bg-line-strong transition-colors", tone === "danger" ? "peer-checked:bg-safety" : "peer-checked:bg-accent", "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)]")} />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      <span className="text-sm leading-tight">
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-3">{description}</span>}
      </span>
    </label>
  );
}

export function JsonView({ value, className, maxHeight = 320 }: { value: unknown; className?: string; maxHeight?: number }) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <pre
      className={cx("overflow-auto rounded-lg bg-code p-3 font-mono text-[12.5px] leading-relaxed text-code-ink", className)}
      style={{ maxHeight }}
      tabIndex={0}
    >
      {text}
    </pre>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-3", className)}>{children}</div>;
}

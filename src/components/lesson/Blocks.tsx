"use client";

import { ArrowRight } from "lucide-react";
import type { Block } from "@/content/schema";
import { Callout, cx } from "@/components/ui/primitives";
import { Markup } from "./Markup";
import { CodeBlock } from "./CodeBlock";
import { ShowCode } from "./ShowCode";
import { LabHost } from "./LabHost";
import { Exercise } from "./Exercise";

export interface BlockContext {
  challengeDone: (key: string) => boolean;
  onChallenge: (key: string) => void;
}

/** Renders the simple, non-assessment blocks. Quiz/teach-back/recap are rendered by LessonView. */
export function BlockView({ block, k, ctx }: { block: Block; k: string; ctx: BlockContext }) {
  switch (block.type) {
    case "p":
      return <p className="prose-lesson"><Markup text={block.text} /></p>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={cx("prose-lesson space-y-1.5 pl-5", block.ordered ? "list-decimal" : "list-disc marker:text-accent")}>
          {block.items.map((it, i) => <li key={i} className="pl-1"><Markup text={it} /></li>)}
        </Tag>
      );
    }
    case "callout":
      return <Callout tone={block.tone} title={block.title}><Markup text={block.text} /></Callout>;
    case "analogyMap":
      return (
        <div className="overflow-hidden rounded-xl border border-line">
          {block.title && <div className="border-b border-line bg-sunken/60 px-4 py-2 text-sm font-semibold">{block.title}</div>}
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch text-[15px]">
            <div className="bg-[color-mix(in_srgb,var(--c-people)_6%,transparent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-people">Everyday world</div>
            <div className="bg-sunken/40" />
            <div className="bg-[color-mix(in_srgb,var(--c-model)_6%,transparent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-model">Software world</div>
            {block.pairs.map((p, i) => (
              <div key={i} className="contents">
                <div className="border-t border-line px-4 py-2.5"><Markup text={p.everyday} /></div>
                <div className="flex items-center border-t border-line px-1 text-ink-3"><ArrowRight className="h-4 w-4" aria-label="corresponds to" /></div>
                <div className="border-t border-line px-4 py-2.5"><Markup text={p.technical} /></div>
              </div>
            ))}
          </div>
        </div>
      );
    case "steps":
      return (
        <ol className="space-y-3">
          {block.items.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent">{i + 1}</span>
              <div className="pt-0.5">
                <div className="font-semibold"><Markup text={s.title} /></div>
                <div className="text-[15px] leading-relaxed text-ink-2"><Markup text={s.text} /></div>
              </div>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[480px] text-left text-sm">
            {block.caption && <caption className="px-4 py-2 text-left text-xs text-ink-3">{block.caption}</caption>}
            <thead className="bg-sunken/70">
              <tr>{block.head.map((h) => <th key={h} scope="col" className="px-4 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-line align-top">
                  {r.map((c, j) => <td key={j} className={cx("px-4 py-2.5", j === 0 && "font-medium")}><Markup text={c} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "compare":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {[block.left, block.right].map((side, i) => (
            <div key={i} className={cx("rounded-xl border p-4", i === 0 ? "border-line" : "border-accent/40 bg-accent-soft/30")}>
              <div className="mb-2 font-semibold">{side.title}</div>
              <ul className="space-y-1.5 text-[15px] text-ink-2">
                {side.items.map((it, j) => <li key={j} className="flex gap-2"><span className="text-ink-3">•</span><span><Markup text={it} /></span></li>)}
              </ul>
            </div>
          ))}
        </div>
      );
    case "code":
      return (
        <div className="space-y-2">
          <CodeBlock code={block.code} lang={block.lang} caption={block.caption} highlight={block.notes?.map((n) => n.line)} />
          {block.notes && (
            <ol className="space-y-1 text-sm text-ink-2">
              {block.notes.map((n) => (
                <li key={n.line} className="flex gap-2">
                  <span className="w-14 shrink-0 font-mono text-xs text-accent">line {n.line}</span>
                  <span><Markup text={n.text} /></span>
                </li>
              ))}
            </ol>
          )}
        </div>
      );
    case "showCode":
      return <ShowCode refId={block.ref} />;
    case "lab":
      return (
        <LabHost
          id={block.lab}
          props={block.props}
          caption={block.caption}
          done={block.required ? ctx.challengeDone(k) : undefined}
          onComplete={() => ctx.onChallenge(k)}
        />
      );
    case "exercise":
      return <Exercise exercise={block.exercise} done={ctx.challengeDone(k)} onPass={() => ctx.onChallenge(k)} />;
    default:
      return null;
  }
}

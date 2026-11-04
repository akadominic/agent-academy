"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cx } from "@/components/ui/primitives";

/** Minimal, dependency-free syntax colouring for JS/TS/JSON snippets. */
const JS_TOKENS =
  /(\/\/.*$|\/\*[\s\S]*?\*\/|`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|if|else|for|while|of|in|async|await|new|throw|try|catch|finally|class|export|import|from|type|interface|break|continue|true|false|null|undefined)\b|\b\d[\d_.]*\b)/gm;

function colour(line: string, lang: string) {
  if (lang === "bash" || lang === "text" || lang === "http") {
    if (lang === "bash" && line.trim().startsWith("#")) return <span className="text-[#8b8479]">{line}</span>;
    return line;
  }
  const parts = line.split(JS_TOKENS);
  return parts.map((p, i) => {
    if (!p) return null;
    let cls = "";
    if (p.startsWith("//") || p.startsWith("/*")) cls = "text-[#8b8479] italic";
    else if (/^["'`]/.test(p)) cls = "text-[#a5d6a7]";
    else if (/^\d/.test(p)) cls = "text-[#f6c177]";
    else if (/^(true|false|null|undefined)$/.test(p)) cls = "text-[#f6c177]";
    else if (/^[a-z]+$/.test(p)) cls = "text-[#c4a7e7]";
    return cls ? <span key={i} className={cls}>{p}</span> : <span key={i}>{p}</span>;
  });
}

export function CodeBlock({
  code, lang = "js", highlight = [], startLine = 1, caption, onLineClick, activeLine, maxHeight,
}: {
  code: string;
  lang?: string;
  highlight?: number[];
  startLine?: number;
  caption?: string;
  onLineClick?: (line: number) => void;
  activeLine?: number;
  maxHeight?: number;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <figure className="overflow-hidden rounded-xl border border-line-strong bg-code">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[11.5px] text-[#a39b8f]">
        <span className="font-mono uppercase tracking-wider">{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-white/10"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-auto py-2 font-mono text-[13px] leading-[1.65] text-code-ink" style={{ maxHeight }} tabIndex={0}>
        <code>
          {lines.map((line, i) => {
            const n = i + startLine;
            const hl = highlight.includes(i + 1);
            return (
              <div
                key={i}
                onClick={onLineClick ? () => onLineClick(i + 1) : undefined}
                className={cx("flex px-3", hl && "code-line-hl", activeLine === i + 1 && "bg-white/10", onLineClick && "cursor-pointer hover:bg-white/5")}
              >
                <span className="mr-4 inline-block w-7 shrink-0 select-none text-right text-[#6d665c]">{n}</span>
                <span className="whitespace-pre">{colour(line, lang)}</span>
              </div>
            );
          })}
        </code>
      </pre>
      {caption && <figcaption className="border-t border-white/10 px-3 py-2 text-xs text-[#a39b8f]">{caption}</figcaption>}
    </figure>
  );
}

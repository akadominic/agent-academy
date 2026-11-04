"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { useTheme } from "@/components/layout/theme";

const base = EditorView.theme({
  "&": { backgroundColor: "var(--code-bg)", color: "var(--code-ink)" },
  ".cm-gutters": { backgroundColor: "var(--code-bg)", color: "#7d766b", border: "none" },
  ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.04)" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.06)" },
  ".cm-content": { caretColor: "#f08a3e", padding: "10px 0" },
});

export default function CodeEditor({
  value, onChange, language = "js", minHeight = 180, ariaLabel = "Code editor", readOnly = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  language?: "js" | "json";
  minHeight?: number;
  ariaLabel?: string;
  readOnly?: boolean;
}) {
  useTheme(); // re-render on theme change
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong" style={{ minHeight }}>
      <CodeMirror
        value={value}
        onChange={onChange}
        theme="dark"
        readOnly={readOnly}
        extensions={[language === "json" ? json() : javascript(), base, EditorView.lineWrapping, EditorView.contentAttributes.of({ "aria-label": ariaLabel })]}
        basicSetup={{ foldGutter: false, highlightActiveLine: !readOnly, autocompletion: false }}
        minHeight={`${minHeight}px`}
      />
    </div>
  );
}

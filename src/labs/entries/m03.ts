import type { LabEntry } from "../types";

/** Labs for Module 3: How Large Language Models Work. */
export const m03Labs: LabEntry[] = [
  {
    id: "tokenizer", title: "Tokenizer", moduleId: "m3", mode: "experiment", offline: true,
    short: "Type text and watch an illustrative tokenizer split it into tokens. Compare English, Luganda, code and numbers.",
    load: () => import("../m03/Tokenizer"),
  },
  {
    id: "next-token", title: "Next-token predictor", moduleId: "m3", mode: "experiment", offline: true,
    short: "A toy word-count model trained on market sentences. Step through predictions and change the temperature.",
    load: () => import("../m03/NextToken"),
  },
  {
    id: "context-window", title: "Context window", moduleId: "m3", mode: "experiment", offline: true,
    short: "Shrink the window and watch old messages fall out of what the model can see. Plus an illustrative attention explorer.",
    load: () => import("../m03/ContextWindow"),
  },
  {
    id: "hallucination", title: "Confident but unsupported", moduleId: "m3", mode: "experiment", offline: true,
    short: "Check a fluent, made-up answer against Mama Achen's records, then ground it with a lookup tool.",
    load: () => import("../m03/Hallucination"),
  },
];

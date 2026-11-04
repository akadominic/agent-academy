import type { LabEntry } from "../types";

/** Labs for Module 2 — Learn Enough Programming to Build Agents. */
export const m02Labs: LabEntry[] = [
  {
    id: "terminal-sim", title: "Practice terminal", moduleId: "m2", mode: "experiment", offline: true,
    short: "A clearly labelled simulated terminal: move around folders, run a JavaScript file, start an npm project and save versions with Git.",
    load: () => import("../m02/TerminalSim"),
  },
  {
    id: "code-tracer", title: "Step through code", moduleId: "m2", mode: "experiment", offline: true,
    short: "Watch real programs run line by line: variables as labelled containers, objects and arrays, function calls, loops, and promises in an async kitchen.",
    load: () => import("../m02/CodeTracer"),
  },
];

import type { LabEntry } from "../types";

/** Labs for Module 5: APIs. Both are fully simulated in the browser. */
export const m05Labs: LabEntry[] = [
  {
    id: "api-explorer", title: "API Explorer", moduleId: "m5", mode: "experiment", offline: true,
    short: "Build HTTP requests to a simulated shop API and a mock model provider; inspect them as raw HTTP, fetch and curl; meet real errors.",
    load: () => import("../m05/ApiExplorer"),
  },
  {
    id: "key-exposure", title: "Where does the API key live?", moduleId: "m5", mode: "experiment", offline: true,
    short: "Compare a key hidden in browser code with a key kept on the server, watch a bad actor steal it, then fix the app.",
    load: () => import("../m05/KeyExposure"),
  },
];

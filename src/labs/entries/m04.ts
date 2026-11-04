import type { LabEntry } from "../types";

/** Labs for Module 4: Prompt Engineering and Structured Outputs. */
export const m04Labs: LabEntry[] = [
  {
    id: "prompt-lab", title: "Prompt lab", moduleId: "m4", mode: "experiment", offline: true,
    short: "Improve a weak prompt for Mama Achen's shop and compare two versions on the same test messages.",
    load: () => import("../m04/PromptLab"),
  },
  {
    id: "message-roles", title: "Message roles", moduleId: "m4", mode: "experiment", offline: true,
    short: "Arrange system, developer, user, assistant and tool messages into one request and see the raw payload.",
    load: () => import("../m04/MessageRoles"),
  },
  {
    id: "schema-validator", title: "Schema validator", moduleId: "m4", mode: "experiment", offline: true,
    short: "Fix broken JSON from a model and validate it live against a JSON Schema.",
    load: () => import("../m04/SchemaValidator"),
  },
];

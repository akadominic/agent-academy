import type { LabEntry } from "../types";

/** Labs for Modules 0, 6, 7 and the cross-course experiences. */
export const coreLabs: LabEntry[] = [
  {
    id: "three-systems", title: "Three systems, one customer", moduleId: "m0", mode: "experiment", offline: true,
    short: "Watch a rules program, a chatbot and an agent handle the same request, step by step.",
    load: () => import("../core/ThreeSystems"),
  },
  {
    id: "agent-or-not", title: "Does this need an agent?", moduleId: "m0", mode: "experiment", offline: true,
    short: "Sort real situations into: normal program, one model call, agent, or a person decides.",
    load: () => import("../core/AgentOrNot"),
  },
  {
    id: "anatomy-mini", title: "Agent anatomy: the core parts", moduleId: "m0", mode: "understand", offline: true,
    short: "The five core parts of every agent, and a request travelling through them.",
    load: () => import("./anatomyMini"),
  },
  {
    id: "anatomy", title: "Agent Anatomy Explorer", moduleId: "m7", mode: "experiment", offline: true,
    short: "The whole production agent: inspect every part, watch a request travel through it, and inject failures.",
    load: () => import("../core/AnatomyExplorer"),
  },
  {
    id: "tool-lab", title: "Tool Calling Laboratory", moduleId: "m6", mode: "experiment", offline: true,
    short: "Be the server: see the model's proposed tool call, validate it, approve it, execute it and return the result.",
    load: () => import("../core/ToolLab"),
  },
  {
    id: "agent-brain", title: "The Interactive Agent Brain", moduleId: "m7", mode: "experiment", offline: true,
    short: "Step through a real agent loop: the model request, the proposed tool, checks, execution, state and stopping rules.",
    load: () => import("../core/AgentBrain"),
  },
  {
    id: "cost-calculator", title: "Agent cost calculator", moduleId: "m14", mode: "experiment", offline: true,
    short: "Model the daily and monthly cost of an agent in USD and UGX: tokens, loop steps, tool calls, retries and hosting.",
    load: () => import("../core/CostCalculator"),
  },
];

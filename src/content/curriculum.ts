import type { CourseModule, Lesson } from "./schema";
import { m00Lessons } from "./modules/m00";
import { m01Lessons } from "./modules/m01";
import { m02Lessons } from "./modules/m02";
import { m03Lessons } from "./modules/m03";
import { m04Lessons } from "./modules/m04";
import { m05Lessons } from "./modules/m05";
import { m06Lessons } from "./modules/m06";
import { m07Lessons } from "./modules/m07";

export const COURSE_TITLE = "Agent Academy";
export const COURSE_TAGLINE = "From zero to building AI workers";

export const MODULES: CourseModule[] = [
  {
    id: "m0", number: 0, track: "foundations", status: "complete", prerequisites: [],
    title: "Welcome to the World of AI Agents",
    short: "Welcome",
    goal: "Understand what an AI agent is, how it differs from a chatbot and a fixed program, and when one is worth building.",
    unlocks: "A clear mental picture of the thing you are learning to build.",
    lessons: m00Lessons, labs: ["three-systems", "agent-or-not", "anatomy-mini"],
  },
  {
    id: "m1", number: 1, track: "foundations", status: "complete", prerequisites: ["m0"],
    title: "How Computers and the Internet Work",
    short: "Computers & Internet",
    goal: "See how a message travels from a phone to a server and back, and what browsers, servers, DNS, HTTP and databases each do.",
    unlocks: "You can read any software architecture diagram.",
    lessons: m01Lessons, labs: ["internet-trace", "website-assembler", "http-request", "database-explorer"],
  },
  {
    id: "m2", number: 2, track: "foundations", status: "complete", prerequisites: ["m1"],
    title: "Learn Enough Programming to Build Agents",
    short: "Programming",
    goal: "Write and run real JavaScript: variables, objects, conditions, loops, functions, errors, async code and JSON — plus the terminal and Git.",
    unlocks: "You can write small programs that make decisions.",
    lessons: m02Lessons, labs: ["code-tracer", "terminal-sim"], projectIds: ["p1"],
  },
  {
    id: "m3", number: 3, track: "models", status: "complete", prerequisites: ["m2"],
    title: "How Large Language Models Work",
    short: "Language Models",
    goal: "Understand tokens, next-token prediction, context windows, temperature and hallucination well enough to predict model behaviour.",
    unlocks: "You know what a model can and cannot do on its own.",
    lessons: m03Lessons, labs: ["tokenizer", "next-token", "context-window", "hallucination"],
  },
  {
    id: "m4", number: 4, track: "models", status: "complete", prerequisites: ["m3"],
    title: "Prompt Engineering and Structured Outputs",
    short: "Prompts",
    goal: "Write clear instructions with roles, context, examples and output formats, and validate structured JSON output against a schema.",
    unlocks: "You can get dependable, machine-readable output from a model.",
    lessons: m04Lessons, labs: ["prompt-lab", "message-roles", "schema-validator"], projectIds: ["p2"],
  },
  {
    id: "m5", number: 5, track: "models", status: "complete", prerequisites: ["m4"],
    title: "APIs — Connecting Your Code to AI",
    short: "APIs",
    goal: "Construct and debug API requests, keep keys secret on a server, and handle errors, rate limits and timeouts.",
    unlocks: "Your code can talk to an AI model safely.",
    lessons: m05Lessons, labs: ["api-explorer", "key-exposure"],
  },
  {
    id: "m6", number: 6, track: "agents", status: "complete", prerequisites: ["m5"],
    title: "Tool Calling — Giving AI the Ability to Act",
    short: "Tool Calling",
    goal: "Define tools, validate arguments, execute them on your server, and control side effects with permissions, approval and idempotency.",
    unlocks: "A model can now ask your software to do real things.",
    lessons: m06Lessons, labs: ["tool-lab"], projectIds: ["p3"],
  },
  {
    id: "m7", number: 7, track: "agents", status: "complete", prerequisites: ["m6"],
    title: "The Agent Loop",
    short: "Agent Loop",
    goal: "Run, inspect and build the loop that lets an agent take several steps, keep state, and stop safely.",
    unlocks: "You can build a working agent from scratch.",
    lessons: m07Lessons, labs: ["agent-brain"], projectIds: ["p4"],
  },

  /* ---------------- Modules 8–19: outlined, lessons in development ---------------- */
  outline("m8", 8, "agents", ["m7"], "Memory, State, and Databases", "Memory & State",
    "Make agents remember the right things — and forget what they should not keep.",
    "Agents that survive restarts and continue unfinished work.",
    [
      ["The shopkeeper's memory vs the ledger", "Conversation history, short-term context and why the model forgets between requests.", "memory-explorer"],
      ["Sessions, users and persistent memory", "Storing state in a database keyed by session and user; what to store and what not to."],
      ["Surviving a restart", "Checkpointing agent state and resuming an unfinished task after a crash."],
      ["Privacy, retention and minimal data", "Collect less, keep it shorter, and protect what you keep."],
    ], ["memory-explorer"]),
  outline("m9", 9, "agents", ["m8"], "RAG and External Knowledge", "Knowledge (RAG)",
    "Answer questions from your own documents with retrieval, citations and grounded answers.",
    "Agents that cite sources instead of guessing.",
    [
      ["The school library", "Why models do not know your documents, and what retrieval adds.", "rag-lab"],
      ["Chunking and embeddings", "Splitting documents, turning text into vectors, measuring similarity."],
      ["Keyword, semantic and hybrid search", "Ranking, reranking and choosing what goes into the context."],
      ["Grounded answers and citations", "Making answers point to evidence — and refusing when evidence is missing."],
      ["Retrieval failures", "Stale documents, misleading passages and access permissions."],
    ], ["rag-lab"], ["p5"]),
  outline("m10", 10, "agents", ["m9"], "Integrations: Connecting to Real Applications", "Integrations",
    "Connect agents to email, calendars, CRMs and databases through REST, webhooks, OAuth scopes and MCP.",
    "Agents that work inside real business software.",
    [
      ["REST APIs and webhooks", "Pull versus push: calling services and being called back."],
      ["OAuth, permissions and scopes", "Letting an agent act for a user without handing over a password."],
      ["The Model Context Protocol (MCP)", "A standard way to expose tools and data to models; when to use it versus direct API calls."],
      ["Inquiry → catalogue → draft → approval", "A full mock integration with approval before sending."],
    ]),
  outline("m11", 11, "production", ["m10"], "Designing Reliable Agent Workflows", "Workflows",
    "Combine deterministic steps with AI decision points, retries, checkpoints, queues and human approval.",
    "Systems that finish reliably even when parts fail.",
    [
      ["More autonomy is not better engineering", "Fixed workflows vs agentic decision points; choosing the least autonomy that works.", "workflow-builder"],
      ["State machines and orchestration", "Explicit states, transitions and sequential vs parallel steps."],
      ["Retries, timeouts and duplicate prevention", "Making steps safe to repeat."],
      ["Queues, background jobs and schedules", "Work that runs later, or keeps running when nobody is watching."],
    ], ["workflow-builder"], ["p6"]),
  outline("m12", 12, "production", ["m11"], "Evaluating Whether an Agent Actually Works", "Evaluation",
    "Test agents with datasets, metrics, traces and regression runs instead of trusting one good demo.",
    "Evidence that your agent works — and alarms when it stops working.",
    [
      ["One demo proves very little", "Test cases, expected outcomes and pass rates.", "eval-lab"],
      ["Unit, integration and end-to-end tests", "Testing tools, the loop and the whole system."],
      ["Failure classification and regression testing", "Grouping failures and stopping them coming back."],
      ["Human and model-based evaluation", "When to use a grader model, and its limits."],
    ], ["eval-lab"]),
  outline("m13", 13, "production", ["m12"], "Security, Safety, and Responsible AI Engineering", "Security",
    "Defend against prompt injection, data leakage and runaway actions with least privilege, validation, approvals and audit logs.",
    "Agents you can trust with real customers and real money.",
    [
      ["Instructions vs data", "Prompt injection through documents and tool outputs.", "security-challenge"],
      ["Authentication, authorization and least privilege", "Who may do what, enforced in code."],
      ["Approval gates, spending limits and rollback", "Controlling financial and destructive actions."],
      ["Secrets, personal data and audit logs", "Protecting keys and people, and keeping a record."],
    ], ["security-challenge"]),
  outline("m14", 14, "production", ["m13"], "Agent Economics: Cost, Speed, Reliability", "Economics",
    "Estimate and control what an agent costs per task, per day and per month — in USD and UGX.",
    "Agents that make financial sense.",
    [
      ["Tokens are money", "Input and output tokens, model prices and tool calls.", "cost-calculator"],
      ["Latency and caching", "Why responses are slow and how to make them cheaper and faster."],
      ["Budgets, ceilings and monitoring", "Cost per task and hard limits."],
    ], ["cost-calculator"]),
  outline("m15", 15, "production", ["m14"], "Building a User Interface for an Agent", "Interfaces",
    "Build chat and task interfaces with loading states, streaming, traces, approvals and sources.",
    "Agents that real people can use.",
    [
      ["Frontend talks to backend, securely", "Forms, buttons and API routes; keys stay on the server."],
      ["Loading, streaming and progress", "Keeping users informed while the agent works."],
      ["Approvals, sources and feedback", "Interfaces that keep humans in control."],
      ["Accessibility", "Keyboard use, screen readers, contrast and clear language."],
    ]),
  outline("m16", 16, "production", ["m15"], "Deployment: Putting an Agent on the Internet", "Deployment",
    "Deploy a frontend, backend, database and worker with environment variables, DNS, HTTPS and rollbacks.",
    "Your agent, live on the internet.",
    [
      ["What deployment means", "Local vs production, builds and hosting.", "deploy-sim"],
      ["Environment variables and secrets in production", "Configuring keys without leaking them."],
      ["Domains, DNS and HTTPS", "Making your app reachable at a real address."],
      ["Serverless functions vs long-running workers", "Cron jobs, background tasks and their limits."],
      ["A real deployment, step by step", "GitHub-based deployment with every command and check."],
    ], ["deploy-sim"], ["p7"]),
  outline("m17", 17, "mastery", ["m16"], "Operating and Maintaining Production Agents", "Operations",
    "Run agents after launch: logs, traces, alerts, incidents, upgrades, backups and scaling.",
    "Agents that keep working after launch day.",
    [
      ["Logs, traces and monitoring", "Seeing what your agent did and why.", "agent-debugger"],
      ["Incidents and human intervention", "What to do when it goes wrong at 2 a.m."],
      ["Changing models and tools safely", "Re-evaluating after every change."],
    ], ["agent-debugger"]),
  outline("m18", 18, "mastery", ["m17"], "Advanced Agent Architectures", "Advanced",
    "Multi-agent systems, supervisors, frameworks and durable execution — and when a simple program wins.",
    "Judgement about when complexity pays off.",
    [
      ["Supervisor and worker agents", "Delegation, communication and parallel execution."],
      ["Frameworks and SDKs", "What they give you and what they hide."],
      ["Durable, long-running agents", "Work that spans hours or days."],
      ["When simple is superior", "Choosing a plain program or a single agent."],
    ]),
  outline("m19", 19, "mastery", ["m18"], "Capstone: Kampala Market Assistant", "Capstone",
    "Build, test and deploy a complete order assistant for a Kampala shop.",
    "A real, deployed AI agent you built and can explain.",
    [
      ["Architecture and mock services", "Plan the system and run it with simulated parts.", "capstone-workspace"],
      ["The agent core", "Tools, loop, state, validation and stopping rules."],
      ["Approval, orders and history", "Human control and durable records."],
      ["Interface, tests and logs", "Make it usable and observable."],
      ["Go live", "Connect a real model and deploy publicly."],
    ], ["capstone-workspace"]),
];

function outline(
  id: string, number: number, track: CourseModule["track"], prerequisites: string[],
  title: string, short: string, goal: string, unlocks: string,
  lessons: [string, string, string?][], labs: string[] = [], projectIds?: string[],
): CourseModule {
  return {
    id, number, track, prerequisites, title, short, goal, unlocks,
    status: "outline", lessons: [], labs, projectIds,
    outline: lessons.map(([t, summary, lab]) => ({ title: t, summary, lab })),
  };
}

export const TRACKS: Record<CourseModule["track"], { label: string; blurb: string }> = {
  foundations: { label: "Foundations", blurb: "Computers, the internet and code" },
  models: { label: "Language models", blurb: "How models work and how to talk to them" },
  agents: { label: "Agents", blurb: "Tools, loops, memory and knowledge" },
  production: { label: "Production", blurb: "Reliable, safe, affordable, deployed" },
  mastery: { label: "Mastery", blurb: "Operate, scale and build the capstone" },
};

export const ALL_LESSONS: Lesson[] = MODULES.flatMap((m) => m.lessons);

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

export function getLesson(id: string) {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function lessonNeighbours(id: string) {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return { prev: i > 0 ? ALL_LESSONS[i - 1] : undefined, next: i >= 0 ? ALL_LESSONS[i + 1] : undefined };
}

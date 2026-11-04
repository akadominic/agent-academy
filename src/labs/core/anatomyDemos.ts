import type { AgentRun, Component, ToolContext } from "@/engine/agent/types";
import { createSimulatedModel } from "@/engine/agent/simulatedModel";
import { DEFAULT_SYSTEM_PROMPT } from "@/engine/agent/loop";
import { estimateTokens } from "@/engine/agent/tokens";
import { validate } from "@/engine/agent/jsonSchema";
import { runMarketAgent } from "@/engine/agent/presets";
import { ALL_TOOLS, MARKET_TOOLS, checkInventory, createMarketDB, getWeather } from "@/engine/market/tools";
import { PRODUCTS, formatUGX } from "@/engine/market/catalog";

const TASK = "Customer wants 3 bags of rice delivered tomorrow.";

/** Tiny keyword retriever over three shop documents (a preview of Module 9). */
const DOCS = [
  { id: "delivery-policy", text: "Delivery within Kampala costs UGX 5,000 and arrives the next day if ordered before 6 p.m." },
  { id: "opening-hours", text: "Mama Achen's Shop opens 7 a.m. to 9 p.m., Monday to Saturday, and 9 a.m. to 2 p.m. on Sunday." },
  { id: "returns", text: "Unopened goods can be returned within 3 days with the receipt." },
];
function retrieve(q: string) {
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  return DOCS.map((d) => ({ ...d, score: words.filter((w) => d.text.toLowerCase().includes(w)).length }))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function runPartDemo(part: Component, run: AgentRun | null): Promise<{ output: unknown; note?: string }> {
  const ctx: ToolContext = { faults: {}, db: createMarketDB(), executions: {} };
  const specs = MARKET_TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  switch (part) {
    case "ui":
      return { note: "The interface sends this HTTP request to your backend:", output: { method: "POST", url: "/api/agent", body: { message: TASK } } };
    case "instructions":
      return { note: "Sent as the 'system' part of every request:", output: DEFAULT_SYSTEM_PROMPT };
    case "context": {
      const request = { system: DEFAULT_SYSTEM_PROMPT, messages: [{ role: "user", content: TASK }], tools: specs };
      return { note: `This first request is about ${estimateTokens(JSON.stringify(request)).toLocaleString()} tokens (estimated). It grows every step as results are added.`, output: request };
    }
    case "model": {
      const res = await createSimulatedModel().complete({ system: DEFAULT_SYSTEM_PROMPT, messages: [{ role: "user", content: TASK }], tools: specs });
      return { note: "The (simulated) model's reply to the first request — a proposal, not an action:", output: res };
    }
    case "tools":
      return { note: "What the model is told about each tool. It never sees the code.", output: specs.map((s) => ({ name: s.name, description: s.description })) };
    case "executor": {
      const args = { productId: "rice-25", quantity: 3 };
      const problems = validate(checkInventory.inputSchema, args);
      const result = await checkInventory.execute(args, ctx);
      return { note: "Validate, then run the real check_inventory function:", output: { args, validationProblems: problems, result } };
    }
    case "external":
      return { note: "A mock external service (no network call is made):", output: await getWeather.execute({ town: "Kampala" }, ctx) };
    case "database":
      return { note: "Current stock in the shop's (mock) database:", output: PRODUCTS.map((p) => ({ product: `${p.name} (${p.unit})`, price: formatUGX(p.priceUGX), inStock: (ctx.db as ReturnType<typeof createMarketDB>).stock[p.id] })) };
    case "state":
      return run
        ? { note: "The agent's state at the end of the last journey:", output: run.final }
        : { note: "Run the journey first.", output: null };
    case "workflow":
      return { note: "The loop's decisions for the last journey, in order:", output: run?.trace.filter((e) => ["model_response", "tool_call", "final", "stopped", "guard"].includes(e.kind)).map((e) => `${e.step}: ${e.title}`) };
    case "retrieval":
      return { note: "Preview of Module 9: a tiny keyword search over three shop documents for 'When will my delivery arrive and how much is delivery?'", output: retrieve("When will my delivery arrive and how much is delivery?") };
    case "safety": {
      const bad = { productId: "rice-25", quantity: "three bags", discount: 90 };
      return { note: "Schema validation rejects unsafe or malformed arguments before anything runs:", output: { proposed: bad, problems: validate(checkInventory.inputSchema, bad) } };
    }
    case "approval":
      return { note: "What the shop owner would see on their phone before an order is created:", output: { action: "create_order", customer: "Walk-in customer", lines: [{ product: "Rice (25 kg bag)", quantity: 3 }], total: formatUGX(3 * 110_000 + 5_000), buttons: ["Approve", "Reject"] } };
    case "evaluation": {
      const cases = [
        { name: "Rice order total is correct", task: TASK, check: (r: AgentRun) => /335,000/.test(r.answer ?? "") },
        { name: "Out-of-stock eggs get alternatives", task: "I need 2 trays of eggs.", check: (r: AgentRun) => /out of stock/.test(r.answer ?? "") && /instead/.test(r.answer ?? "") },
        { name: "Vague request gets a question", task: "Can you help me?", check: (r: AgentRun) => /\?/.test(r.answer ?? "") },
        { name: "Runaway loop is stopped", task: TASK, faults: { ignoreResults: true }, check: (r: AgentRun) => r.final.status === "stopped" },
        { name: "Rejected order is not recorded", task: TASK, faults: { rejectApproval: true }, check: (r: AgentRun) => r.final.orderIds.length === 0 },
      ];
      const results = [];
      for (const c of cases) {
        const r = await runMarketAgent(c.task, { faults: c.faults });
        results.push({ test: c.name, result: c.check(r) ? "PASS" : "FAIL", steps: r.final.step });
      }
      return { note: "A mini evaluation: five test cases run through the real loop just now (preview of Module 12).", output: results };
    }
    case "logs":
      return { note: "Log lines from the last journey:", output: run?.trace.map((e) => `[step ${e.step}] ${e.kind.padEnd(16)} ${e.title}`) ?? [] };
    case "cloud":
      return {
        note: "Where each part runs once deployed (Module 16):",
        output: {
          "Your hosting (e.g. a platform like Vercel, Render or a VPS)": ["frontend", "backend / agent loop", "tool executor", "secrets in environment variables"],
          "Managed database": ["orders", "stock", "saved agent state"],
          "AI provider": ["the language model"],
          "Other services": ["SMS / payments / maps"],
        },
      };
    default:
      return { output: ALL_TOOLS.map((t) => t.name), note: "" };
  }
}


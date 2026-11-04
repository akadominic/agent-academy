import type { ProjectDef } from "../schema";

/* ======================================================================
   PROJECT 3 — Product Information Assistant
   Unlocked after Module 6. Tool definitions, a dispatcher with
   validation, JSON results, and one round of a fake model's tool calls.
   Exercise code is plain JavaScript with no backticks, so it can live
   inside these template strings safely.
   ====================================================================== */

/* ------------------------------ shared pieces ------------------------------ */

const DATA = `// Mama Achen's catalogue (prices from the course's shop; illustrative).
// costPriceUGX is what Mama Achen paid her supplier: a business secret.
const PRODUCTS = [
  { id: "rice-25", name: "Rice", unit: "25 kg bag", priceUGX: 110000, costPriceUGX: 96000, synonyms: ["rice"] },
  { id: "rice-5", name: "Rice", unit: "5 kg bag", priceUGX: 23500, costPriceUGX: 20500, synonyms: ["rice", "rice 5kg"] },
  { id: "posho-10", name: "Maize flour (posho)", unit: "10 kg bag", priceUGX: 28000, costPriceUGX: 24000, synonyms: ["posho", "maize flour"] },
  { id: "sugar-1", name: "Sugar", unit: "1 kg", priceUGX: 5500, costPriceUGX: 4800, synonyms: ["sugar"] },
  { id: "oil-1", name: "Cooking oil", unit: "1 litre", priceUGX: 8000, costPriceUGX: 6900, synonyms: ["cooking oil", "oil"] },
  { id: "eggs-tray", name: "Eggs", unit: "tray of 30", priceUGX: 13500, costPriceUGX: 11500, synonyms: ["eggs", "egg"] },
  { id: "matooke", name: "Matooke", unit: "bunch", priceUGX: 30000, costPriceUGX: 25000, synonyms: ["matooke", "bananas"] },
];
`;

const DEFS_SOLUTION = `// Tool definitions: what the model is told. Plain JSON data, no functions.
const TOOL_DEFINITIONS = [
  {
    name: "search_products",
    description: "Search Mama Achen's catalogue by product name. Returns matching products with id, name, unit and price in UGX. Use it before stating any price.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, description: "Product name, e.g. 'sugar'" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_product",
    description: "Get one product's details by its productId (for example 'oil-1'). Use it when you already know the exact productId from search_products.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "A productId returned by search_products" },
      },
      required: ["productId"],
      additionalProperties: false,
    },
  },
];
`;

const DEFS_STARTER = `// Tool definitions: what the model is told. Plain JSON data, no functions.
const TOOL_DEFINITIONS = [
  {
    name: "search_products",
    description: "Search Mama Achen's catalogue by product name. Returns matching products with id, name, unit and price in UGX. Use it before stating any price.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, description: "Product name, e.g. 'sugar'" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    // TODO: describe get_product.
    //  - description: at least 30 characters. Say what it does AND when to use it.
    //  - inputSchema: an object with ONE required string field, "productId",
    //    and no other fields allowed.
    name: "get_product",
    description: "",
    inputSchema: {},
  },
];
`;

const FUNCS_SOLUTION = `// The real functions. They run in YOUR code, never inside the model.
function publicView(p) {
  // Only what a customer may see. Never send costPriceUGX to the model.
  return { id: p.id, name: p.name, unit: p.unit, priceUGX: p.priceUGX };
}

function searchProducts(args) {
  const q = args.query.toLowerCase();
  return PRODUCTS
    .filter((p) => p.synonyms.some((s) => s.includes(q) || q.includes(s)))
    .map(publicView);
}

function getProduct(args) {
  const p = PRODUCTS.find((x) => x.id === args.productId);
  if (!p) throw new Error("Unknown productId: " + args.productId);
  return publicView(p);
}
`;

const FUNCS_STARTER = `// The real functions. They run in YOUR code, never inside the model.

// BUG: this returns whole product records, including costPriceUGX (a secret)
// and synonyms (internal). Return ONLY id, name, unit and priceUGX.
function searchProducts(args) {
  const q = args.query.toLowerCase();
  return PRODUCTS.filter((p) => p.synonyms.some((s) => s.includes(q) || q.includes(s)));
}

// TODO: return { id, name, unit, priceUGX } for the product with this id.
// If there is no such product, throw new Error("Unknown productId: " + args.productId)
function getProduct(args) {
}
`;

const VALIDATOR = `// The validator from lesson 6.2, plus minLength for strings.
function typeMatches(type, value) {
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function validateArgs(schema, args) {
  if (typeof args !== "object" || args === null || Array.isArray(args)) return ["arguments must be an object"];
  const problems = [];
  const properties = schema.properties || {};
  for (const field of schema.required || []) {
    if (!(field in args)) problems.push(field + " is required");
  }
  for (const field of Object.keys(args)) {
    const rule = properties[field];
    if (!rule) {
      if (schema.additionalProperties === false) problems.push(field + " is not allowed");
      continue;
    }
    const value = args[field];
    if (rule.type && !typeMatches(rule.type, value)) { problems.push(field + " must be " + rule.type); continue; }
    if (rule.minimum !== undefined && value < rule.minimum) problems.push(field + " must be at least " + rule.minimum);
    if (rule.minLength !== undefined && value.length < rule.minLength) problems.push(field + " must have at least " + rule.minLength + " characters");
  }
  return problems;
}

// Which function runs for which tool name. Your code owns this list.
const RUNNERS = { search_products: searchProducts, get_product: getProduct };
`;

const DISPATCH_SOLUTION = `// The dispatcher: checks a proposed call, runs it, and ALWAYS returns an outcome.
async function dispatch(call) {
  const definition = TOOL_DEFINITIONS.find((t) => t.name === call.name);
  if (!definition || !Object.hasOwn(RUNNERS, call.name)) {
    return { ok: false, kind: "unknown_tool", error: "No tool named " + call.name };
  }
  const problems = validateArgs(definition.inputSchema, call.arguments);
  if (problems.length > 0) {
    return { ok: false, kind: "validation", error: problems.join("; ") };
  }
  try {
    const result = await RUNNERS[call.name](call.arguments);
    return { ok: true, result: result };
  } catch (err) {
    return { ok: false, kind: "error", error: err.message };
  }
}
`;

const DISPATCH_STARTER = `// The dispatcher: checks a proposed call, runs it, and ALWAYS returns an outcome.
// call looks like: { name: "get_product", arguments: { productId: "sugar-1" } }
// Return one of:
//   { ok: true, result }
//   { ok: false, kind: "unknown_tool", error: "No tool named <name>" }
//   { ok: false, kind: "validation", error: <problems joined with "; "> }
//   { ok: false, kind: "error", error: <message of the thrown error> }
async function dispatch(call) {
  // TODO: 1) unknown tool?  2) validate  3) run inside try/catch
  const result = await RUNNERS[call.name](call.arguments);
  return { ok: true, result: result };
}
`;

const HANDLE_SOLUTION = `// Turn the model's tool calls into tool-result messages.
// Arguments arrive as a JSON STRING (as in OpenAI-style APIs), so parsing can fail.
async function handleToolCalls(response) {
  const messages = [];
  for (const call of response.tool_calls) {
    let outcome;
    let args;
    try {
      args = JSON.parse(call.arguments);
    } catch (err) {
      args = undefined;
    }
    if (args === undefined) {
      outcome = { ok: false, kind: "bad_json", error: "arguments are not valid JSON" };
    } else {
      outcome = await dispatch({ name: call.name, arguments: args });
    }
    messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(outcome) });
  }
  return messages;
}
`;

const HANDLE_STARTER = `// Turn the model's tool calls into tool-result messages.
// response looks like:
//   { type: "tool_calls", tool_calls: [ { id: "call_1", name: "search_products", arguments: "{\\"query\\":\\"sugar\\"}" } ] }
// Note: arguments is a JSON STRING, like in OpenAI-style APIs. Parse it first.
// For EACH call, in order, produce:
//   { role: "tool", tool_call_id: <the call's id>, content: JSON.stringify(outcome) }
// where outcome comes from dispatch(...), or is
//   { ok: false, kind: "bad_json", error: "arguments are not valid JSON" }
// when JSON.parse fails.
async function handleToolCalls(response) {
  const messages = [];
  // TODO
  return messages;
}
`;

const SAMPLES = `// Sample model responses to test with.
const ONE_CALL = { type: "tool_calls", tool_calls: [{ id: "call_1", name: "search_products", arguments: JSON.stringify({ query: "sugar" }) }] };
const BAD_JSON = { type: "tool_calls", tool_calls: [{ id: "call_7", name: "search_products", arguments: "{query: sugar" }] };
const TWO_CALLS = { type: "tool_calls", tool_calls: [
  { id: "call_2", name: "get_product", arguments: JSON.stringify({ productId: "oil-1" }) },
  { id: "call_3", name: "get_product", arguments: JSON.stringify({ productId: "car-1" }) },
] };
`;

const FAKE_MODEL = `// ---------------- GIVEN: a FAKE model ----------------
// NOT AI: fixed rules that reply in an OpenAI-like shape, so your code can be
// tested for free. A real model API call would go here instead.
function fakeModel(messages, tools) {
  const last = messages[messages.length - 1];
  if (last.role === "user") {
    if (!tools.some((t) => t.name === "search_products")) {
      return { type: "final", text: "Sorry, I can't look up products right now." };
    }
    const words = last.content.toLowerCase().replace(/[^a-z ]/g, " ").split(" ").filter(Boolean);
    const known = ["rice", "posho", "sugar", "oil", "eggs", "matooke"];
    const query = words.find((w) => known.includes(w)) || words[words.length - 1];
    return { type: "tool_calls", tool_calls: [{ id: "call_1", name: "search_products", arguments: JSON.stringify({ query: query }) }] };
  }
  if (last.role === "tool") {
    const outcome = JSON.parse(last.content);
    if (!outcome.ok) return { type: "final", text: "Sorry, I couldn't look that up just now (" + outcome.error + ")." };
    if (outcome.result.length === 0) return { type: "final", text: "Sorry, Mama Achen's shop doesn't seem to sell that." };
    const lines = outcome.result.map((p) => p.name + " (" + p.unit + "): UGX " + p.priceUGX.toLocaleString("en-US"));
    return { type: "final", text: "Here is what I found: " + lines.join("; ") + "." };
  }
  return { type: "final", text: "Sorry, something went wrong." };
}
`;

const ANSWER_SOLUTION = `// One full round: question -> model -> tools -> model -> answer.
async function answerOnce(question) {
  const messages = [{ role: "user", content: question }];
  const first = fakeModel(messages, TOOL_DEFINITIONS);
  if (first.type === "final") {
    messages.push({ role: "assistant", content: first.text });
    return { answer: first.text, messages: messages };
  }
  messages.push({ role: "assistant", tool_calls: first.tool_calls });
  const results = await handleToolCalls(first);
  for (const m of results) messages.push(m);

  const second = fakeModel(messages, TOOL_DEFINITIONS);
  if (second.type !== "final") {
    // This project handles one round only. Project 4 adds a full loop.
    return { answer: null, messages: messages };
  }
  messages.push({ role: "assistant", content: second.text });
  return { answer: second.text, messages: messages };
}
`;

const ANSWER_STARTER = `// One full round: question -> model -> tools -> model -> answer.
// Return { answer, messages } where messages ends up as:
//   [ { role: "user", content: question },
//     { role: "assistant", tool_calls: <the model's tool_calls> },
//     ...the tool-result messages from handleToolCalls...,
//     { role: "assistant", content: <final text> } ]
// If the FIRST reply is already final, push it and return it.
// If the SECOND reply is not final, return { answer: null, messages }.
async function answerOnce(question) {
  const messages = [{ role: "user", content: question }];
  // TODO
  return { answer: null, messages: messages };
}
`;

/* --------------------------------- steps --------------------------------- */

export const p3: ProjectDef = {
  id: "p3",
  number: 3,
  title: "Product Information Assistant",
  moduleId: "m6",
  focus: "APIs, tool calling, JSON",
  brief:
    "Customers keep messaging Mama Achen to ask “how much is sugar?” and “do you sell posho?”. You will build the **tool side** of an assistant that answers these questions from the real catalogue: tool definitions the model can read, real functions that never leak secret data, a **dispatcher** that validates every proposed call, JSON tool results, and one complete round with a model. The model is a deterministic **fake** (clearly marked) so you can test for free. Swapping in a real model API later changes one function, not your tool code.",
  architecture: [
    { label: "Customer question", kind: "people", note: "“How much is sugar?”" },
    { label: "Model (fake)", kind: "model", note: "Reads the tool definitions and proposes a call, with arguments as a JSON string" },
    { label: "Your dispatcher", kind: "control", note: "Parses the arguments, checks the tool exists, validates the schema" },
    { label: "Tool functions", kind: "tool", note: "searchProducts, getProduct: return public fields only" },
    { label: "Product catalogue", kind: "data", note: "Prices in UGX, plus secret cost prices that must never leave" },
    { label: "Tool result → model → answer", kind: "model", note: "JSON result with the call's id, then the final reply" },
  ],
  prerequisites: ["m6-l1", "m6-l2", "m6-l3"],
  steps: [
    {
      id: "defs",
      title: "Describe your tools",
      blocks: [
        { type: "p", text: "A model can only ask for tools it has been told about. Each definition is plain JSON: a **name**, a **description** that says what it does and when to use it, and an **input schema**. `search_products` is done. Write `get_product`." },
        { type: "callout", tone: "tip", text: "Write descriptions like instructions to a new shop assistant. “Gets product” is too vague. Say what comes back and when the tool is the right one to use." },
        { type: "exercise", exercise: {
          id: "p3-tool-definitions",
          title: "Write the get_product definition",
          brief: "Complete the second entry of `TOOL_DEFINITIONS`: a description of at least 30 characters, and an `inputSchema` of type `object` with one required string field `productId` and `additionalProperties: false`.",
          starter: DEFS_STARTER,
          solution: DEFS_SOLUTION,
          tests: [
            { name: "two tools, in order", expr: `TOOL_DEFINITIONS.map((t) => t.name)`, expected: ["search_products", "get_product"] },
            { name: "every description is useful (30+ characters)", expr: `TOOL_DEFINITIONS.every((t) => typeof t.description === "string" && t.description.length >= 30)`, expected: true },
            { name: "get_product's schema is correct", expr: `(() => { const s = TOOL_DEFINITIONS[1].inputSchema; return [s.type, s.properties && s.properties.productId && s.properties.productId.type, s.required, s.additionalProperties]; })()`, expected: ["object", "string", ["productId"], false] },
            { name: "definitions are pure JSON (no functions hidden inside)", expr: `JSON.stringify(JSON.parse(JSON.stringify(TOOL_DEFINITIONS))) === JSON.stringify(TOOL_DEFINITIONS)`, expected: true },
          ],
          hints: [
            "Copy the shape of search_products' inputSchema and change the field name.",
            "`properties: { productId: { type: \"string\" } }`, `required: [\"productId\"]`, `additionalProperties: false`.",
          ],
        } },
      ],
    },
    {
      id: "functions",
      title: "Write the real functions (and don't leak secrets)",
      blocks: [
        { type: "p", text: "Tool results are sent to the model, and whatever the model sees could end up in a customer's chat. The catalogue holds `costPriceUGX`, what Mama Achen paid her supplier. That must never leave your code. Return only the public fields." },
        { type: "exercise", exercise: {
          id: "p3-tool-functions",
          title: "searchProducts and getProduct",
          brief: "Fix `searchProducts` so each result has **only** `id`, `name`, `unit` and `priceUGX`. Write `getProduct({ productId })`, which returns the same four fields, or throws `Error(\"Unknown productId: <id>\")`.",
          starter: DATA + "\n" + FUNCS_STARTER,
          solution: DATA + "\n" + FUNCS_SOLUTION,
          tests: [
            { name: "search returns public fields only", expr: `searchProducts({ query: "sugar" })`, expected: [{ id: "sugar-1", name: "Sugar", unit: "1 kg", priceUGX: 5500 }] },
            { name: "search finds both rice bags", expr: `searchProducts({ query: "rice" }).map((p) => p.id)`, expected: ["rice-25", "rice-5"] },
            { name: "no secret cost price leaks", expr: `searchProducts({ query: "rice" }).every((p) => !("costPriceUGX" in p) && !("synonyms" in p))`, expected: true },
            { name: "unknown products give an empty list", expr: `searchProducts({ query: "bicycle" })`, expected: [] },
            { name: "getProduct returns one product", expr: `getProduct({ productId: "oil-1" })`, expected: { id: "oil-1", name: "Cooking oil", unit: "1 litre", priceUGX: 8000 } },
            { name: "getProduct rejects unknown ids", expr: `getProduct({ productId: "car-1" })`, throws: "Unknown productId: car-1" },
          ],
          hints: [
            "Write a helper `publicView(p)` that returns `{ id: p.id, name: p.name, unit: p.unit, priceUGX: p.priceUGX }` and use `.map(publicView)`.",
            "In getProduct, use `PRODUCTS.find((x) => x.id === args.productId)`. If the result is undefined, throw.",
          ],
        } },
      ],
    },
    {
      id: "dispatch",
      title: "Build the dispatcher with validation",
      blocks: [
        { type: "p", text: "The dispatcher stands between the model's proposals and your functions. It must refuse unknown tools, validate arguments against each tool's schema, and turn any thrown error into an outcome. It must never crash. The validator from lesson 6.2 is provided, with a `minLength` rule added." },
        { type: "exercise", exercise: {
          id: "p3-dispatch",
          title: "dispatch(call)",
          brief: "Complete `dispatch(call)`. Return `{ ok: true, result }` on success. Otherwise return `{ ok: false, kind, error }` with kind `unknown_tool` (error `\"No tool named <name>\"`), `validation` (the problems joined with `\"; \"`) or `error` (the thrown message).",
          starter: DATA + "\n" + DEFS_SOLUTION + "\n" + FUNCS_SOLUTION + "\n" + VALIDATOR + "\n" + DISPATCH_STARTER,
          solution: DATA + "\n" + DEFS_SOLUTION + "\n" + FUNCS_SOLUTION + "\n" + VALIDATOR + "\n" + DISPATCH_SOLUTION,
          tests: [
            { name: "a valid call succeeds", expr: `dispatch({ name: "get_product", arguments: { productId: "sugar-1" } })`, expected: { ok: true, result: { id: "sugar-1", name: "Sugar", unit: "1 kg", priceUGX: 5500 } } },
            { name: "unknown tools are refused", expr: `dispatch({ name: "delete_all_orders", arguments: {} })`, expected: { ok: false, kind: "unknown_tool", error: "No tool named delete_all_orders" } },
            { name: "too-short queries fail validation", expr: `dispatch({ name: "search_products", arguments: { query: "r" } })`, expected: { ok: false, kind: "validation", error: "query must have at least 2 characters" } },
            { name: "extra fields fail validation", expr: `dispatch({ name: "search_products", arguments: { query: "rice", discountPercent: 90 } })`, expected: { ok: false, kind: "validation", error: "discountPercent is not allowed" } },
            { name: "wrong types fail validation", expr: `dispatch({ name: "get_product", arguments: { productId: 42 } })`, expected: { ok: false, kind: "validation", error: "productId must be string" } },
            { name: "a tool that throws becomes an error outcome", expr: `dispatch({ name: "get_product", arguments: { productId: "car-1" } })`, expected: { ok: false, kind: "error", error: "Unknown productId: car-1" } },
          ],
          hints: [
            "Find the definition: `TOOL_DEFINITIONS.find((t) => t.name === call.name)`. No definition → unknown_tool.",
            "`const problems = validateArgs(definition.inputSchema, call.arguments);` If there are problems, return them joined with `\"; \"`.",
            "Wrap `await RUNNERS[call.name](call.arguments)` in try/catch.",
          ],
        } },
      ],
    },
    {
      id: "json",
      title: "Turn tool calls into JSON tool results",
      blocks: [
        { type: "p", text: "Real APIs send each tool call with an **id**, and many send the arguments as a **JSON string** that you must parse yourself. Your results go back as `tool` messages carrying the same id, with the outcome written as JSON text. Invalid JSON from the model must not crash you either." },
        { type: "callout", tone: "info", text: "The shape here (`tool_calls`, `tool_call_id`, `role: \"tool\"`) follows the OpenAI Chat Completions style in simplified form. Other providers name things differently (see lesson 6.2). Check the provider's current documentation before using a real API." },
        { type: "exercise", exercise: {
          id: "p3-handle-tool-calls",
          title: "handleToolCalls(response)",
          brief: "For each call in `response.tool_calls`, in order: parse `call.arguments`. If parsing fails, the outcome is `{ ok: false, kind: \"bad_json\", error: \"arguments are not valid JSON\" }`. Otherwise the outcome comes from `dispatch`. Return an array of `{ role: \"tool\", tool_call_id, content: JSON.stringify(outcome) }`. Sample responses `ONE_CALL`, `BAD_JSON` and `TWO_CALLS` are provided.",
          starter: DATA + "\n" + DEFS_SOLUTION + "\n" + FUNCS_SOLUTION + "\n" + VALIDATOR + "\n" + DISPATCH_SOLUTION + "\n" + SAMPLES + "\n" + HANDLE_STARTER,
          solution: DATA + "\n" + DEFS_SOLUTION + "\n" + FUNCS_SOLUTION + "\n" + VALIDATOR + "\n" + DISPATCH_SOLUTION + "\n" + SAMPLES + "\n" + HANDLE_SOLUTION,
          tests: [
            { name: "one call gives one tool message with the same id", expr: `handleToolCalls(ONE_CALL).then((ms) => ms.map((m) => [m.role, m.tool_call_id]))`, expected: [["tool", "call_1"]] },
            { name: "the content is a JSON string", expr: `handleToolCalls(ONE_CALL).then((ms) => typeof ms[0].content)`, expected: "string" },
            { name: "the content holds the real result", expr: `handleToolCalls(ONE_CALL).then((ms) => JSON.parse(ms[0].content))`, expected: { ok: true, result: [{ id: "sugar-1", name: "Sugar", unit: "1 kg", priceUGX: 5500 }] } },
            { name: "invalid JSON arguments don't crash", expr: `handleToolCalls(BAD_JSON).then((ms) => [ms[0].tool_call_id, JSON.parse(ms[0].content)])`, expected: ["call_7", { ok: false, kind: "bad_json", error: "arguments are not valid JSON" }] },
            { name: "two calls → two results, matched by id, in order", expr: `handleToolCalls(TWO_CALLS).then((ms) => ms.map((m) => [m.tool_call_id, JSON.parse(m.content).ok]))`, expected: [["call_2", true], ["call_3", false]] },
          ],
          hints: [
            "Loop with `for (const call of response.tool_calls) { … }`. Use `await dispatch(…)` inside it, so results stay in order.",
            "Parsing: `try { args = JSON.parse(call.arguments); } catch (err) { … }`",
            "Push `{ role: \"tool\", tool_call_id: call.id, content: JSON.stringify(outcome) }`.",
          ],
        } },
      ],
    },
    {
      id: "round",
      title: "One full round with the model",
      blocks: [
        { type: "p", text: "Now connect everything: send the question to the (fake) model with your tool definitions, handle its tool calls, add the results to the conversation, and ask the model again for the final answer. Every price in the answer must come from your tool result, not from the model's imagination." },
        { type: "callout", tone: "sim", text: "`fakeModel` is a rule-based stand-in, not AI. It picks a search word from the question and writes its answer only from the tool result it receives. A real model would do this less predictably, which is why your dispatcher validates everything." },
        { type: "exercise", exercise: {
          id: "p3-answer-once",
          title: "answerOnce(question)",
          brief: "Write `answerOnce(question)`. Ask `fakeModel(messages, TOOL_DEFINITIONS)`. If it proposes tool calls, push `{ role: \"assistant\", tool_calls }`, push every message from `handleToolCalls`, ask the model again, and push its final text as `{ role: \"assistant\", content }`. Return `{ answer, messages }`.",
          starter: DATA + "\n" + DEFS_SOLUTION + "\n" + FUNCS_SOLUTION + "\n" + VALIDATOR + "\n" + DISPATCH_SOLUTION + "\n" + HANDLE_SOLUTION + "\n" + FAKE_MODEL + "\n" + ANSWER_STARTER,
          solution: DATA + "\n" + DEFS_SOLUTION + "\n" + FUNCS_SOLUTION + "\n" + VALIDATOR + "\n" + DISPATCH_SOLUTION + "\n" + HANDLE_SOLUTION + "\n" + FAKE_MODEL + "\n" + ANSWER_SOLUTION,
          tests: [
            { name: "sugar: the price comes from the tool", expr: `answerOnce("How much is sugar?").then((r) => r.answer)`, expected: "Here is what I found: Sugar (1 kg): UGX 5,500." },
            { name: "the conversation has the right shape", expr: `answerOnce("How much is sugar?").then((r) => r.messages.map((m) => m.role))`, expected: ["user", "assistant", "tool", "assistant"] },
            { name: "the tool message answers the model's call", expr: `answerOnce("How much is sugar?").then((r) => r.messages[2].tool_call_id === r.messages[1].tool_calls[0].id)`, expected: true },
            { name: "rice: both bag sizes are listed", expr: `answerOnce("Price of rice please").then((r) => r.answer)`, expected: "Here is what I found: Rice (25 kg bag): UGX 110,000; Rice (5 kg bag): UGX 23,500." },
            { name: "unknown products get an honest answer", expr: `answerOnce("Do you sell bicycles?").then((r) => r.answer)`, expected: "Sorry, Mama Achen's shop doesn't seem to sell that." },
          ],
          hints: [
            "`const first = fakeModel(messages, TOOL_DEFINITIONS);` If `first.type === \"final\"`, push it and return.",
            "`messages.push({ role: \"assistant\", tool_calls: first.tool_calls });` then `const results = await handleToolCalls(first);` and push each result.",
            "`const second = fakeModel(messages, TOOL_DEFINITIONS);` Its `text` is the answer.",
          ],
        } },
      ],
    },
  ],
  commonErrors: [
    { error: "TypeError: RUNNERS[call.name] is not a function", fix: "The model asked for a tool that doesn't exist. Look the tool up first and return `{ ok: false, kind: \"unknown_tool\" }` instead of calling it." },
    { error: "SyntaxError: Unexpected token … in JSON", fix: "`call.arguments` was not valid JSON. Wrap `JSON.parse` in try/catch and return a `bad_json` outcome so the model can try again." },
    { error: "Expected … but got [object Promise]", fix: "`dispatch` is `async`. Use `await dispatch(…)` (inside an `async` function), or `.then(…)` in a test." },
    { error: "A test fails because costPriceUGX appears in the result", fix: "Tool results reach the model and can reach customers. Map products to public fields only (`id`, `name`, `unit`, `priceUGX`)." },
    { error: "The tool message's tool_call_id doesn't match", fix: "Copy `call.id` from the model's call into `tool_call_id`. Real APIs reject results that don't answer an earlier call." },
  ],
  completion: [
    "Two tool definitions written as pure JSON, with clear descriptions and strict schemas.",
    "Tool functions that return public data only and throw clear errors.",
    "A dispatcher that refuses unknown tools, validates arguments and never crashes.",
    "Tool calls turned into JSON tool-result messages matched by id, including invalid JSON.",
    "A full round in which every price in the answer came from a tool result.",
  ],
};

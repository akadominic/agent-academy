import type { Lesson } from "../schema";

/* ======================================================================
   MODULE 6 — Tool Calling: Giving AI the Ability to Act
   Core idea: the model RECOMMENDS actions. Your software decides which
   tools exist, checks every request, and actually executes it.
   Labs: tool-lab (src/labs/core/ToolLab.tsx)
   ====================================================================== */

/* ---------------------------------------------------------------------- */
/*  m6-l1  The model proposes, your code acts                              */
/* ---------------------------------------------------------------------- */

const l1: Lesson = {
  id: "m6-l1",
  moduleId: "m6",
  title: "The model proposes, your code acts",
  subtitle: "What a tool is, what the model is actually told about it, and why the list of tools you hand over is a permission decision.",
  minutes: 30,
  prerequisites: ["m0-l1", "m4-l4", "m5-l4"],
  objectives: [
    "Explain what a **tool** is: a name, a description, an input schema and an ordinary function.",
    "Describe what the model receives about a tool (and what it never receives).",
    "Separate the model **proposing** an action from your code **executing** it.",
    "Explain why the list of tools you give an agent is its list of **permissions**.",
    "Explain why a tool call is not the same thing as an API request.",
  ],
  glossary: ["tool", "tool-calling", "tool-definition", "input-schema", "arguments", "tool-executor", "tool-result", "permission", "json-schema"],
  completion: [
    "Drive one customer message through the Tool Lab, one step at a time, until the model gives a final answer.",
    "Pass the knowledge check (you can retry).",
    "Explain in your own words who proposes and who acts.",
  ],
  tutor: {
    simpler:
      "The model is like a clever assistant who can only write notes. It writes: “please check the stock for rice, 3 bags.” Your program reads the note, checks that it is allowed, opens the real stock book, and writes the answer back on a new note. The assistant never touches the stock book itself.",
    altAnalogy:
      "A restaurant waiter takes your order and writes it on a slip. The kitchen decides whether it can cook it and then cooks it. The waiter can only ask for dishes that are on the menu, and the menu is written by the owner. Menu = tool list. Slip = tool call. Kitchen = your code.",
    misconceptions: [
      "“The AI ran the tool.” The model only produced a structured request. Your code ran the function.",
      "“If the model can see the tool, it can do anything with it.” It sees a name, a description and a schema. It cannot read or change the code, and it cannot use a tool you did not list.",
      "“A tool call is an API request.” A tool call is a message asking YOUR code to run a function. That function might call an API, read a database, or just do arithmetic.",
      "“More tools make a better agent.” Every tool is a power. Give each agent only the tools its job needs.",
    ],
    probingQuestions: [
      "In the lab, which button made something actually happen — “Ask the model” or “Execute”? Why does that matter?",
      "If you untick search_products, what can the model still do? What can it no longer do?",
      "calculate_quote never touches the network. Is it still a tool? Why?",
      "Where in the code is the list of tools the model sees built?",
    ],
    revisit: ["m0-l1"],
  },
  sections: [
    /* A. PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "A model that can only talk",
      blocks: [
        { type: "p", text: "In Module 4 you learned to write good prompts, and in Module 5 your code learned to send them to a model and read the reply. So now Mama Achen's assistant can write polite, well-formatted messages. But a customer near Nakawa market types: **“Do you have 3 bags of rice? Deliver tomorrow.”**" },
        { type: "p", text: "The model cannot answer that honestly. It has never seen Mama Achen's stock book. It cannot add up a bill reliably. It certainly cannot record an order. All it can do is produce text, so it will either say “I don't know” or, worse, guess." },
        { type: "p", text: "We want the assistant to **check the stock**, **calculate the total**, and **record the order**. But we do not want a text generator, which sometimes makes things up, to have direct control of the shop's records and money. So two needs pull against each other:" },
        { type: "list", items: [
          "The model must be able to **ask for** real actions, otherwise it is useless for real work.",
          "Something trustworthy must **check and carry out** those actions, otherwise it is dangerous.",
        ] },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How can a model ask for an action without being the thing that performs it, and who decides which actions it may ask for?" },
      ],
    },

    /* B. ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "The boda-boda dispatcher",
      blocks: [
        { type: "p", text: "At a busy boda-boda stage near Nakawa, Okello works as the dispatcher. His phone rings: “I need a parcel taken from Nakawa market to Ntinda.”" },
        { type: "steps", items: [
          { title: "He receives the request.", text: "He listens and works out what is needed: a pickup, a drop-off, maybe a time." },
          { title: "He looks at what he is allowed to do.", text: "On the wall is a board the stage chairman put up: **check which riders are free**, **estimate a route and fare**, **assign a rider**, **record the trip in the ledger**. Okello cannot invent new services. He cannot, for example, promise a lorry." },
          { title: "He proposes an action.", text: "“Assign Musa to the Ntinda job, fare UGX 7,000.” That sentence is a **proposal**. No motorcycle has moved yet." },
          { title: "Other people and systems carry it out.", text: "The stage's own process confirms that Musa really is free, Musa's phone receives the job, Musa rides, and the trip is written in the ledger. **The riders, the phones and the ledger do the work.** Okello does not ride." },
          { title: "The result comes back.", text: "Musa calls back: “Delivered, customer paid.” Only now does Okello know it happened, and he decides what to do next." },
        ] },
        { type: "analogyMap", title: "From the boda stage to software", pairs: [
          { everyday: "Okello, the dispatcher choosing what to do next", technical: "The [[llm|language model]], producing a proposed action" },
          { everyday: "The board of allowed services, written by the chairman", technical: "The list of [[tool-definition|tool definitions]] your code sends with each request" },
          { everyday: "“Assign Musa to Ntinda, fare UGX 7,000”", technical: "A **tool call**: a tool name plus [[arguments|arguments]]" },
          { everyday: "The stage process that checks Musa is free, then sends the job to his phone", technical: "Your [[tool-executor|tool executor]]: checks the call, then runs the real function" },
          { everyday: "Riders, phones and the ledger", technical: "The real functions, databases and outside services the tools use" },
          { everyday: "Musa's call: “Delivered”", technical: "The [[tool-result|tool result]], sent back to the model as a new message" },
          { everyday: "The chairman deciding what goes on the board", technical: "You, the engineer, choosing which tools this agent may use: its [[permission|permissions]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Okello is a person: he can see the board, remember yesterday and use common sense. A model sees **only the text your code sends in this one request**. It does not look at anything or remember anything between requests. It produces the most likely structured reply, given its training and that text. It can propose a rider who does not exist or a fare in the wrong format. That is why the checking happens in your code." },
      ],
    },

    /* C. VISUAL */
    {
      kind: "visual",
      mode: "experiment",
      title: "Walk one message through every stage",
      blocks: [
        { type: "p", text: "The Tool Lab splits a tool call into its six stages so you can press each one yourself. On the left is the **tool shelf**: the tools this agent may use, with a **schema** button for each. On the right are the stages, from “Your code sends the request to the model” to “The result goes back into the conversation”." },
        { type: "steps", items: [
          { title: "Pick a customer message and press “Ask the model”.", text: "Open “See the exact request” first. You will see the instructions, the conversation and the tool **descriptions**, but no tool code and no database." },
          { title: "Read the proposal.", text: "Stage 2 shows the tool the model chose and its arguments. Nothing has happened yet. It is only a request." },
          { title: "Press “Validate against schema”, then “Execute”.", text: "Your code checks the arguments and then runs the real function. Watch the execution log: the result appears there." },
          { title: "Go back to stage 1 and press “Send updated conversation”.", text: "The result is now part of the conversation. Repeat until the model returns a final answer instead of a tool call." },
        ] },
        { type: "lab", lab: "tool-lab", props: { challenge: "lifecycle" }, required: true, caption: "Simulated model, real tools. Complete it by driving any message to a final answer." },
        { type: "callout", tone: "tip", text: "“I need 2 trays of eggs.” is the shortest journey (two tools, then an answer). “Customer wants 3 bags of rice delivered tomorrow.” takes the full journey, including an order that waits for the shop owner's approval. You will study that step in lesson 3." },
        { type: "callout", tone: "sim", text: "The “model” in this lab is a rule-based stand-in, not AI. It produces replies in the same shape a real model API returns: either “call this tool with these arguments” or “here is my final answer”. The tools, the schema checks and the in-memory shop database are real code from this course." },
      ],
    },

    /* D. TECHNICAL */
    {
      kind: "technical",
      mode: "understand",
      title: "What a tool really is",
      blocks: [
        { type: "p", text: "A [[tool|tool]] is a function your program owns, plus enough information for a model to know when and how to ask for it. In this course every tool has four parts:" },
        { type: "table", head: ["Part", "Example (check_inventory)", "Sent to the model?"], rows: [
          ["**Name**", "`check_inventory`", "Yes"],
          ["**Description**: when and why to use it", "“Check how many units of a product are in stock…”", "Yes"],
          ["**Input schema**: which arguments are allowed", "`productId` (text), `quantity` (whole number 1–500)", "Yes"],
          ["**The function**: the real code", "Reads the stock from the database", "**Never**"],
        ] },
        { type: "p", text: "The first three together are the [[tool-definition|tool definition]]. The schema is written in [[json-schema|JSON Schema]], the same format you used for structured output in Module 4. Our tools also carry a `sideEffect` label (`\"none\"` or `\"write\"`) that only our code reads. Lesson 3 explains why." },
        { type: "p", text: "[[tool-calling|Tool calling]] (also called **function calling**) is a feature of model APIs. You send the tool definitions with your request. Instead of plain text, the model may reply with a structured **tool call**: a tool name and [[arguments|arguments]] in JSON. Models are trained to produce these replies when a tool description fits the task. The model does not run anything. It returns data, and the [[tool-executor|tool executor]] in your code takes it from there." },
        { type: "callout", tone: "misconception", title: "“The model chose the tool, so it understood the task”", text: "The model produced the tool name that best continued the text it was given: the instructions, the conversation and the tool descriptions. Often that is a very good choice. Sometimes it is the wrong tool, a tool that does not exist, or arguments in the wrong shape. Treat every tool call as a **suggestion that must be checked**, never as an order." },
        { type: "p", text: "**Permissions are the tool list.** The model can only ask for tools whose definitions you sent. If a price-enquiry assistant should never create orders, do not give it `create_order`: then it has no way even to ask. This is called **least privilege**: give each agent only the tools its job needs. Your executor should still refuse unknown tool names, because a model can produce a name that was never on the list." },
        { type: "compare",
          left: { title: "A tool call", items: [
            "A structured message **from the model to your code**: “please run check_inventory with these arguments”.",
            "Arrives inside the model's response.",
            "Nothing happens until your code decides to run it.",
            "Example: `{ name: \"calculate_quote\", arguments: {…} }`",
          ] },
          right: { title: "An API request", items: [
            "An HTTP message **from one program to another server** (Module 5).",
            "Your request to the model is one. A tool's function may send others (a mobile money API, a weather service).",
            "Some tools make no API request at all: `calculate_quote` just does arithmetic in your own code.",
            "So a tool **may use** API requests, but a tool call **is not** one.",
          ] },
        },
      ],
    },

    /* E. EXAMPLE */
    {
      kind: "example",
      mode: "understand",
      title: "The real check_inventory tool",
      blocks: [
        { type: "p", text: "This is the actual tool definition the lab uses. Read the notes. The name, description and schema are data. `execute` is an ordinary function that runs on our side." },
        { type: "showCode", ref: "tool-inventory" },
        { type: "p", text: "Before every model request, the agent loop turns each tool into what the model is allowed to see. This is the real line from `src/engine/agent/loop.ts`:" },
        { type: "code", lang: "ts", code: `const toolSpecs = config.tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));`, notes: [
          { line: 1, text: "Only three fields are copied: `name`, `description` and `inputSchema`. The `execute` function and the `sideEffect` label are left behind, so the model never receives your code." },
        ] },
        { type: "p", text: "So the part of the request about this tool looks like this (you saw it under “See the exact request” in the lab):" },
        { type: "code", lang: "json", code: `{
  "name": "check_inventory",
  "description": "Check how many units of a product are in stock. If stock is too low, returns suggested alternative product ids.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "productId": { "type": "string", "description": "Product id from search_products" },
      "quantity": { "type": "integer", "minimum": 1, "maximum": 500 }
    },
    "required": ["productId", "quantity"],
    "additionalProperties": false
  }
}`, caption: "What the model is told about check_inventory. Real providers spell the field names slightly differently (lesson 2).", notes: [
          { line: 3, text: "The description tells the model **when** the tool is useful. Write it like instructions to a new shop assistant." },
          { line: 7, text: "`integer` with limits: the quantity must be a whole number from 1 to 500." },
          { line: 10, text: "`additionalProperties: false` means the model may not add fields of its own, such as a discount." },
        ] },
      ],
    },

    /* F. CHALLENGE */
    {
      kind: "challenge",
      mode: "experiment",
      title: "Change the permissions, predict the behaviour",
      blocks: [
        { type: "p", text: "Use the Tool Lab above. Press **Reset** between experiments." },
        { type: "list", ordered: true, items: [
          "If you have not done so yet, drive **“I need 2 trays of eggs.”** all the way to the final answer. Which tool result told the model that eggs are finished?",
          "Now untick **search_products** on the tool shelf. **Predict** what the model will say when you ask about rice. Then press “Ask the model” and check. Open “See the exact request”: how many tools are listed now?",
          "Tick it again and untick **create_order**. Run the rice message to the end. Does the final answer claim an order was recorded? Check the “Shop database: orders” panel.",
        ] },
        { type: "callout", tone: "tip", text: "The lab marks this lesson's challenge complete as soon as any run reaches a final answer. The experiments in steps 2 and 3 are where the real learning is, so do them too." },
      ],
    },

    /* G. FAILURE */
    {
      kind: "failure",
      mode: "understand",
      title: "When the proposal is wrong",
      blocks: [
        { type: "p", text: "Because the model only proposes, most tool-calling failures are **bad proposals** that your code must catch. Three you will meet often:" },
        { type: "table", head: ["What you see", "Why it happens", "The fix"], rows: [
          ["The model asks for `apply_discount`, a tool you never defined.", "The model produced a plausible-sounding name. Nothing stops it from writing any text.", "The executor looks the name up in **this agent's** tool list and returns an “unknown tool” error instead of crashing or guessing. (Gate 1 in lesson 3's code.)"],
          ["The model uses `get_weather` when the customer asked about rice.", "Tool descriptions were vague or overlapping, so the wrong one looked relevant.", "Write sharp descriptions: what the tool does, when to use it, when **not** to. Remove tools this agent does not need."],
          ["The assistant can create orders when it was only meant to answer price questions.", "The engineer gave it every tool “just in case”.", "Least privilege: separate tool lists for separate jobs."],
        ] },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "Read the trace, not the final message. The trace shows the exact tool name and arguments that were proposed, and what your code did with them. A friendly final message can hide a wrong tool choice." },
      ],
    },

    /* H. QUIZ */
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "Which part of a tool is **never** sent to the model?",
            options: [
              { text: "The name", why: "The model needs the name to ask for the tool." },
              { text: "The description", why: "The description is how the model can tell when the tool is useful." },
              { text: "The input schema", why: "The schema tells the model which arguments are allowed." },
              { text: "The function's code", why: "Correct. The code stays on your side. Look at the `toolSpecs` line: only name, description and inputSchema are copied." },
            ],
            answer: 3,
            hint: "Look at which fields the `toolSpecs` line copies.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "In the Tool Lab you untick `search_products` and ask about rice. What happens?",
            options: [
              { text: "The model calls search_products anyway, because it knows the tool exists.", why: "It was not in the request, so the model was not offered it. (A real model could still produce the name, but the executor would refuse it as an unknown tool.)" },
              { text: "The model replies that it cannot look up products, because no lookup tool is available.", why: "Correct. The permissions changed, so the possible actions changed." },
              { text: "The lab crashes.", why: "Removing a tool is a normal permission change. Nothing crashes." },
            ],
            answer: 1,
            hint: "The tool list in the request IS the agent's permissions.",
          },
          {
            id: "q3", type: "multi", flavour: "recall",
            prompt: "Which of these are true about a tool call? Select all that apply.",
            options: [
              { text: "It is structured data in the model's response: a tool name plus arguments.", why: "Yes, that is exactly what it is." },
              { text: "By the time your code sees it, the action has already happened.", why: "No. Nothing has happened. Your code decides whether to run it." },
              { text: "It may lead your code to make an API request, for example to a payment service.", why: "Yes. The tool's function might call an API. The tool call itself is not that request." },
              { text: "It can name a tool you never defined.", why: "Yes. The model produces text, and text can name anything. Your executor must refuse unknown names." },
            ],
            answers: [0, 2, 3],
            hint: "Think about who acts, and what a model is able to write.",
          },
          {
            id: "q4", type: "mcq", flavour: "analogy",
            prompt: "In the boda-boda analogy, what is the **tool executor**?",
            options: [
              { text: "Okello, the dispatcher", why: "Okello proposes. He is the model in this analogy." },
              { text: "The stage process that confirms the rider is free and sends the job to his phone", why: "Correct. It checks the proposal, then makes the real systems act." },
              { text: "The customer", why: "The customer makes the request. They play the user." },
            ],
            answer: 1,
            hint: "Who turns “assign Musa” into a real ride?",
          },
          {
            id: "q5", type: "mcq", flavour: "design",
            prompt: "You are building an assistant that **only** answers price questions on Mama Achen's WhatsApp line. Which tools should it get?",
            options: [
              { text: "All four: search_products, check_inventory, calculate_quote, create_order. More tools means more helpful.", why: "This gives it a power (creating orders) that its job never needs. If it is tricked or simply wrong, it could record orders." },
              { text: "search_products and calculate_quote", why: "Correct. Least privilege: exactly the tools its job needs, so it cannot even ask to create an order." },
              { text: "No tools. The model knows prices from training.", why: "The model cannot know this shop's prices. Without tools it can only guess." },
            ],
            answer: 1,
            hint: "Give each agent only the powers its job needs.",
          },
        ] },
      ],
    },

    /* I. TEACH BACK */
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Your friend says: “If I connect ChatGPT to my shop's database, the AI will run my shop.” Explain what really happens when a model “uses a tool”, and who is in control.",
          rubric: [
            { concept: "The model only proposes a tool call", keywords: ["propose", "suggest", "request", "asks for", "ask for", "recommend"], hint: "What does the model actually produce?" },
            { concept: "Your code checks and executes it", keywords: ["code", "program", "software", "execute", "runs", "server", "check"], hint: "Who actually runs the function?" },
            { concept: "The model only sees definitions, not code or data", keywords: ["description", "name", "schema", "definition", "doesn't see", "does not see", "never sees"], hint: "What is the model told about each tool?" },
            { concept: "The tool list is a permission decision", keywords: ["permission", "allowed", "only the tools", "least privilege", "list", "choose which"], hint: "Who decides which tools exist for this agent?" },
          ],
          exemplar: "The AI never touches your database. You write tools: small functions like “check stock” or “calculate quote”, each with a name, a description and a list of allowed inputs. Your program sends the model those descriptions, but not the code. When a customer asks something, the model can reply with a request like “please run check_inventory for rice, 3 bags”. That is only a proposal. Your program checks that the tool is on the list and the inputs are valid, then runs the real function and sends the result back. You choose which tools to hand over, so if you don't give it a “create order” tool, it can't even ask for one. You stay in control.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "A **tool** is a name, a description and an input schema (which the model sees) plus a real function (which it never sees). With **tool calling**, the model replies with a structured **proposal** to use a tool. **Your code** checks it, runs the function and sends the **result** back. The tools you hand over are the agent's **permissions**. A tool call is a request to your code. The tool itself may or may not make API requests.",
          canNow: [
            "Name the parts of a tool definition and say which ones the model receives.",
            "Trace one message from request to proposal to execution to result.",
            "Choose a minimal tool list for a given job.",
            "Explain the difference between a tool call and an API request.",
          ],
          next: "Next, we open up a single tool call and look at the real JSON, including how your code checks the arguments before anything runs.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  m6-l2  Anatomy of a tool call                                          */
/* ---------------------------------------------------------------------- */

const VALIDATE_STARTER = `// A tiny schema checker for tool arguments.
// It supports a small part of JSON Schema:
//   type "object", properties with type "string" | "integer" | "number" | "boolean",
//   required, minimum, and additionalProperties: false.
function validateArgs(schema, args) {
  const problems = [];

  // 0. args must be an object. If not, return ["arguments must be an object"].

  // 1. Every field in schema.required must be present.
  //    Message: "<field> is required"

  // 2. Every field the model sent must be listed in schema.properties
  //    (when schema.additionalProperties is false).
  //    Message: "<field> is not allowed"

  // 3. Each listed field must have the right type.
  //    Message: "<field> must be <type>"      e.g. "quantity must be integer"

  // 4. Numbers must respect "minimum".
  //    Message: "<field> must be at least <minimum>"

  return problems;
}

const checkInventorySchema = {
  type: "object",
  properties: {
    productId: { type: "string" },
    quantity: { type: "integer", minimum: 1 },
  },
  required: ["productId", "quantity"],
  additionalProperties: false,
};

console.log(validateArgs(checkInventorySchema, { productId: "rice-25", quantity: "3 bags" }));
`;

const VALIDATE_SOLUTION = `function typeMatches(type, value) {
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type; // "string" or "boolean"
}

function validateArgs(schema, args) {
  if (typeof args !== "object" || args === null || Array.isArray(args)) {
    return ["arguments must be an object"];
  }
  const problems = [];
  const properties = schema.properties || {};

  // 1. Required fields
  for (const field of schema.required || []) {
    if (!(field in args)) problems.push(field + " is required");
  }

  // 2-4. Every field the model sent
  for (const field of Object.keys(args)) {
    const rule = properties[field];
    if (!rule) {
      if (schema.additionalProperties === false) problems.push(field + " is not allowed");
      continue;
    }
    const value = args[field];
    if (rule.type && !typeMatches(rule.type, value)) {
      problems.push(field + " must be " + rule.type);
      continue; // no point checking the minimum of the wrong type
    }
    if (rule.minimum !== undefined && value < rule.minimum) {
      problems.push(field + " must be at least " + rule.minimum);
    }
  }
  return problems;
}

const checkInventorySchema = {
  type: "object",
  properties: {
    productId: { type: "string" },
    quantity: { type: "integer", minimum: 1 },
  },
  required: ["productId", "quantity"],
  additionalProperties: false,
};

console.log(validateArgs(checkInventorySchema, { productId: "rice-25", quantity: "3 bags" }));
`;

const l2: Lesson = {
  id: "m6-l2",
  moduleId: "m6",
  title: "Anatomy of a tool call",
  subtitle: "Request → proposed call → validation → execution → result → back to the model, with the real JSON at every step.",
  minutes: 40,
  prerequisites: ["m6-l1"],
  objectives: [
    "List the six stages of a tool call in order.",
    "Read the JSON of a tool definition, a proposed call and a tool result.",
    "Explain why tool-call ids exist and how a result is matched to its call.",
    "Explain why arguments must be **validated** in your code, even when the model usually gets them right.",
    "Write a small argument validator in JavaScript.",
  ],
  glossary: ["tool-calling", "arguments", "input-schema", "validation", "tool-result", "json", "json-schema"],
  completion: [
    "In the Tool Lab, see validation reject a set of arguments, then get a corrected version to pass.",
    "Make `validateArgs` pass all its tests.",
    "Pass the knowledge check and explain why validation happens in your code.",
  ],
  tutor: {
    simpler:
      "A tool call is a form the model fills in: tool name, then the boxes. Before your program acts on the form, it checks every box: is the quantity a number? Is anything missing? Is there a box that should not be there? Only a correct form gets processed.",
    altAnalogy:
      "A bank deposit slip. The teller checks the account number has the right number of digits, the amount is a number, and the date is filled in, before anything goes into the system. A badly filled slip is handed back with a note saying what to fix.",
    misconceptions: [
      "“The model always follows the schema.” Usually, not always. Some providers offer strict modes that make it much more reliable, but your server should still check, because your server is the one that acts.",
      "“Validation means the arguments are correct.” Validation checks shape and limits. `productId: \"rice-99\"` is a valid string but not a real product, so the tool itself must also check.",
      "“Every provider uses the same JSON.” The idea is the same everywhere. The field names differ (`input_schema` vs `parameters`, `tool_use` vs `tool_calls`).",
    ],
    probingQuestions: [
      "Why does each tool call have an `id`? What could go wrong without it when the model asks for two tools at once?",
      "The schema says `quantity` is an integer. Why is `\"3\"` (in quotes) rejected?",
      "If validation fails, why send the error back to the model instead of just stopping?",
    ],
    revisit: ["m6-l1", "m4-l4"],
  },
  sections: [
    /* A. PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "“3 bags” is not a number",
      blocks: [
        { type: "p", text: "Mama Achen's assistant proposes: `check_inventory` with `{ \"productId\": \"rice-25\", \"quantity\": \"3 bags\" }`. A human would understand that. The stock function does `inStock >= quantity`, and in JavaScript comparing a number with the text \"3 bags\" quietly gives `false`. The customer would be told rice is out of stock while 12 bags sit on the shelf." },
        { type: "p", text: "Worse mistakes are possible: a quantity of `-5`, a missing product id, or an extra field like `\"discountPercent\": 90` that nobody asked for. Each one comes from text a model produced. So before anything runs, someone has to check the proposal carefully, every time." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "Exactly what travels between your code and the model during one tool call, and where do we check it?" },
      ],
    },

    /* B. ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "The dispatch slip",
      blocks: [
        { type: "p", text: "Back at the boda stage, the chairman has made things stricter. Okello no longer shouts assignments. He fills in a printed **dispatch slip** with fixed boxes: rider name, pickup, drop-off, fare (in UGX, a whole number). Each slip has a **slip number**." },
        { type: "p", text: "The stage clerk checks every slip before a rider moves. A missing drop-off, or a fare written as “about seven thousand”, goes back to Okello with a note: “fare must be a number”. When the rider returns, the clerk writes the result on a return note **with the same slip number**, so nobody mixes up which result belongs to which job, even when five jobs are running at once." },
        { type: "analogyMap", pairs: [
          { everyday: "The printed slip with fixed boxes", technical: "The [[input-schema|input schema]]: which fields exist and what each must contain" },
          { everyday: "Okello's filled-in slip", technical: "The tool call: tool name and [[arguments|arguments]] in [[json|JSON]]" },
          { everyday: "The clerk checking every box", technical: "[[validation|Validation]] in your code" },
          { everyday: "“Fare must be a number”, sent back to Okello", technical: "A validation error returned to the model as a tool result, so it can try again" },
          { everyday: "The slip number on the return note", technical: "The tool-call **id**, repeated in the [[tool-result|tool result]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Okello learns from a returned slip and may remember the lesson tomorrow. A model does not learn from your error message in any lasting way. The error is just more text in the next request, which usually helps it produce a corrected call **in this conversation only**." },
      ],
    },

    /* C. VISUAL */
    {
      kind: "visual",
      mode: "experiment",
      title: "Make validation say no, then yes",
      blocks: [
        { type: "p", text: "Use the Tool Lab to watch your code reject bad arguments **before** anything runs. Two ways to do it:" },
        { type: "steps", items: [
          { title: "Quick way: break the arguments yourself.", text: "Press “Ask the model”. In stage 2, edit the arguments, for example change `\"rice\"` to `\"r\"` (the schema needs at least 2 characters) or to the number `3`. Press “Validate against schema” and read the red problems. Then fix the JSON and validate again." },
          { title: "Realistic way: let the model be sloppy.", text: "Reset, then turn on **“Model sends sloppy arguments”**. Use the rice message. After search_products has run, the model proposes `check_inventory` with `\"quantity\": \"3 bags\"`. Validate it. Then either correct it to `3` yourself, or press **“Send error back to the model”** and then “Send updated conversation”, and see whether the model corrects itself." },
        ] },
        { type: "lab", lab: "tool-lab", props: { challenge: "invalid" }, required: true, caption: "Complete it by getting validation to reject arguments and then accept a corrected version." },
        { type: "callout", tone: "sim", text: "The simulated model makes the “3 bags” mistake only because a fault switch tells it to, and it corrects itself because its rules say to. A real model makes such mistakes less predictably, and is not guaranteed to fix them. The validator is the course's real code." },
      ],
    },

    /* D. TECHNICAL */
    {
      kind: "technical",
      mode: "understand",
      title: "The six stages, and the real JSON",
      blocks: [
        { type: "steps", items: [
          { title: "1. Request", text: "Your code sends the model: system instructions, the conversation so far, and the tool definitions." },
          { title: "2. Proposed call", text: "The model's response contains one or more tool calls. Each has an **id**, a tool **name** and **arguments**." },
          { title: "3. Validation", text: "Your code checks that the tool exists for this agent and that the arguments match its schema. If not, nothing runs. An error is prepared instead." },
          { title: "4. Execution", text: "Your code runs the real function with the validated arguments. (Write tools may first wait for a human. That is lesson 3.)" },
          { title: "5. Result", text: "The function's output (or the error) is turned into a **tool result** message carrying the same id." },
          { title: "6. Back to the model", text: "Your code sends a new request containing everything from before **plus** the proposal and the result. The model then proposes another tool or writes a final answer." },
        ] },
        { type: "p", text: "This course's engine uses its own simple format, which you can see in the lab's “See the exact request”. A response that proposes a tool looks like this:" },
        { type: "code", lang: "json", code: String.raw`{
  "type": "tool_calls",
  "calls": [
    { "id": "call_002", "name": "check_inventory", "arguments": { "productId": "rice-25", "quantity": 3 } }
  ],
  "usage": { "inputTokens": 812, "outputTokens": 21 }
}`, caption: "Our engine's ModelResponse (src/engine/agent/types.ts). Token numbers here are illustrative.", notes: [
          { line: 2, text: "Either `tool_calls` or `final`. These are the only two kinds of reply the loop handles." },
          { line: 4, text: "The id lets the result be matched to this exact call. Arguments arrive already parsed as a JSON object." },
        ] },
        { type: "p", text: "After running it, our executor adds this message to the conversation:" },
        { type: "code", lang: "json", code: String.raw`{
  "role": "tool",
  "toolCallId": "call_002",
  "toolName": "check_inventory",
  "content": "{\"ok\":true,\"result\":{\"productId\":\"rice-25\",\"requested\":3,\"inStock\":12,\"available\":true,\"alternatives\":[]}}"
}`, notes: [
          { line: 3, text: "Same id as the call. That is how the result is matched to its call." },
          { line: 5, text: "The content is **text** (JSON written as a string). Models read text, so results are sent as text. A failure looks the same, with `\"ok\": false` and an `error` message." },
        ] },
        { type: "callout", tone: "info", text: "That is the message exactly as the Tool Lab adds it. The full agent loop you will meet in Module 7 also wraps the content in a `<tool_result untrusted=\"true\">` label, to remind the model that tool output is data and not instructions. Module 13 (Security) explains why that matters." },
        { type: "p", text: "**Real providers use the same idea with different spellings.** Two widely used formats, shown in simplified form:" },
        { type: "table", head: ["", "Anthropic Messages API", "OpenAI Chat Completions API"], rows: [
          ["Tool definition", "`{ name, description, input_schema }`", "`{ type: \"function\", function: { name, description, parameters } }`"],
          ["Model wants a tool", "`stop_reason: \"tool_use\"`, plus a content block `{ type: \"tool_use\", id, name, input }`", "`finish_reason: \"tool_calls\"`, plus `message.tool_calls: [{ id, type: \"function\", function: { name, arguments } }]`"],
          ["Arguments arrive as", "a JSON object (`input`)", "a JSON **string** (`arguments`) that you must parse, and parsing can fail"],
          ["You send the result as", "a `user` message with a block `{ type: \"tool_result\", tool_use_id, content }` (add `is_error: true` for failures)", "a message `{ role: \"tool\", tool_call_id, content }`"],
        ], caption: "Formats change over time and other providers differ again. Always check the provider's current documentation before you write code against it." },
        { type: "code", lang: "json", code: String.raw`{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Let me check the stock." },
    { "type": "tool_use", "id": "toolu_01AbC", "name": "check_inventory", "input": { "productId": "sugar-1", "quantity": 2 } }
  ]
}`, caption: "Shape of an Anthropic response that asks for a tool (id shortened). Note that text can come before the tool call." },
        { type: "callout", tone: "info", title: "Why validate if the provider has a schema?", text: "Some providers offer a “strict” option that makes the model follow your schema much more reliably. Use it when it is available. **Still validate on your server.** Your server is what touches the stock book and the money, and a check there protects you whatever the model, the provider or a future code change does. It also catches mistakes no schema can describe, such as a product id that does not exist." },
      ],
    },

    /* E. EXAMPLE */
    {
      kind: "example",
      mode: "understand",
      title: "The validator the lab uses",
      blocks: [
        { type: "p", text: "Real projects often use a validation library (Ajv and Zod are common in JavaScript). This course wrote its own small validator so you can read every line. It walks through the schema rule by rule and collects **all** the problems, not just the first, so the model gets one complete error message." },
        { type: "showCode", ref: "json-validate" },
        { type: "p", text: "And this is where the agent loop uses it. If there are problems, the tool does not run. The model gets a tool result explaining what was wrong:" },
        { type: "code", lang: "ts", code: `if (config.validateArgs) {
  const problems = validate(tool.inputSchema, call.arguments);
  if (problems.length > 0) {
    const msg = problems.map((p) => \`\${p.path} \${p.message}\`).join("; ");
    reply(call, { ok: false, kind: "validation", error: \`Invalid arguments: \${msg}\` });
    log("validation_error", "Arguments rejected by schema", msg, ["tools", "safety", "model"], "checks", problems, "warn");
    return "ok";
  }
}`, caption: "From src/engine/agent/loop.ts (the “checks” region).", notes: [
          { line: 2, text: "Check the model's arguments against the tool's own schema." },
          { line: 5, text: "Send the problems back as a tool result marked `ok: false`, so the model can correct itself on the next step." },
          { line: 7, text: "Return early: the real function never runs with bad input." },
        ] },
      ],
    },

    /* F. CHALLENGE */
    {
      kind: "challenge",
      mode: "build",
      title: "Write your own argument validator",
      blocks: [
        { type: "p", text: "Write `validateArgs(schema, args)`. It returns a list (array) of problem messages, and an **empty list means the arguments are valid**. This is the same job as the course's validator, for a smaller part of JSON Schema." },
        { type: "exercise", exercise: {
          id: "m6-l2-validate-args",
          title: "validateArgs: check the model's arguments",
          brief: "Complete `validateArgs(schema, args)`. Use **exactly** these messages so the tests can check them: `\"<field> is required\"`, `\"<field> is not allowed\"`, `\"<field> must be <type>\"`, `\"<field> must be at least <minimum>\"`, and `\"arguments must be an object\"` when `args` is not an object. Check required fields first (in the order of `schema.required`), then each field the model sent, in order. `integer` means a whole number: `Number.isInteger(2.5)` is `false`.",
          starter: VALIDATE_STARTER,
          solution: VALIDATE_SOLUTION,
          tests: [
            { name: "valid arguments give no problems", expr: `validateArgs(checkInventorySchema, { productId: "rice-25", quantity: 3 })`, expected: [] },
            { name: "\"3 bags\" is not an integer", expr: `validateArgs(checkInventorySchema, { productId: "rice-25", quantity: "3 bags" })`, expected: ["quantity must be integer"] },
            { name: "2.5 is not a whole number", expr: `validateArgs(checkInventorySchema, { productId: "rice-25", quantity: 2.5 })`, expected: ["quantity must be integer"] },
            { name: "a missing field is reported", expr: `validateArgs(checkInventorySchema, { quantity: 3 })`, expected: ["productId is required"] },
            { name: "an extra field (a sneaky discount) is rejected", expr: `validateArgs(checkInventorySchema, { productId: "rice-25", quantity: 3, discountPercent: 90 })`, expected: ["discountPercent is not allowed"] },
            { name: "zero is below the minimum", expr: `validateArgs(checkInventorySchema, { productId: "rice-25", quantity: 0 })`, expected: ["quantity must be at least 1"] },
            { name: "all problems are collected, in order", expr: `validateArgs(checkInventorySchema, { quantity: "three", note: "hi" })`, expected: ["productId is required", "quantity must be integer", "note is not allowed"] },
            { name: "arguments that are not an object are rejected", expr: `validateArgs(checkInventorySchema, "rice")`, expected: ["arguments must be an object"] },
          ],
          hints: [
            "Loop over `schema.required` and use `field in args` to see whether each one is present.",
            "Loop over `Object.keys(args)`. For each field, look up `schema.properties[field]`. If there is none and `additionalProperties` is `false`, it is not allowed.",
            "For types: `integer` → `Number.isInteger(value)`; `number` → `typeof value === \"number\"`; `string` and `boolean` → compare `typeof value` with the type name.",
            "After a type problem, use `continue` so you don't also complain about the minimum.",
          ],
        } },
      ],
    },

    /* G. FAILURE */
    {
      kind: "failure",
      mode: "experiment",
      title: "Valid is not the same as correct",
      blocks: [
        { type: "p", text: "Try this in the lab: when the model proposes `check_inventory`, change `productId` to `\"rice-99\"`. Validation **passes**, because it is a string. Execute it: the tool itself throws `Unknown productId \"rice-99\"`, and that error becomes the result." },
        { type: "table", head: ["Failure", "How to recognise it", "Fix"], rows: [
          ["Arguments in the wrong shape (`\"3 bags\"`, missing fields)", "A validation error in the trace", "Validate against the schema. Send the problems back so the model can retry."],
          ["Arguments are not even valid JSON (common when a provider sends them as a string)", "`JSON.parse` throws", "Wrap the parse in try/catch and return a clear error result, not a crash."],
          ["Shape is fine, value is wrong (`rice-99`, a quantity of 400 when the customer said 4)", "The tool fails, or worse, succeeds with the wrong data", "Tools check business rules themselves (does this product exist? is this within limits?). Risky actions get human approval."],
          ["Validation turned off “to save time”", "Strange values reach your database", "Never skip it. The lab's “Skip validation (unsafe)” switch exists only so you can see why."],
        ] },
        { type: "callout", tone: "warn", text: "A schema is a contract about **shape**. It cannot know your stock book. Use validation as the first gate, not the only one." },
      ],
    },

    /* H. QUIZ */
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "order",
            prompt: "Put the stages of one tool call in order.",
            items: [
              "Your code sends instructions, conversation and tool definitions to the model",
              "The model's response proposes a tool call with arguments",
              "Your code validates the arguments against the schema",
              "Your code executes the real function",
              "The result is added to the conversation as a tool message with the same id",
              "Your code sends the updated conversation back to the model",
            ],
            hint: "Nothing can be executed before it has been proposed and checked.",
            explanation: "Request → proposal → validation → execution → result → back to the model. Then the cycle can repeat.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "The schema says `quantity: { type: \"integer\", minimum: 1 }`. The model sends `\"quantity\": \"2\"`. What does validation report?",
            code: `{ "productId": "sugar-1", "quantity": "2" }`,
            options: [
              { text: "Nothing. \"2\" is clearly the number two.", why: "The quotes make it a string. Validators check types exactly." },
              { text: "quantity must be integer", why: "Correct. A string is not an integer, even if it looks like one." },
              { text: "quantity must be at least 1", why: "The type check fails first. The minimum is never reached." },
            ],
            answer: 1,
            hint: "Look at the quotation marks.",
          },
          {
            id: "q3", type: "mcq", flavour: "recall",
            prompt: "Why does every tool result carry the same **id** as its tool call?",
            options: [
              { text: "So the model can be billed correctly", why: "Billing is by tokens, not by tool-call ids." },
              { text: "So each result can be matched to the call it answers, especially when several calls are made at once", why: "Correct, just like the slip number on the boda return note." },
              { text: "Ids are a security password", why: "An id is a label for matching, not a secret." },
            ],
            answer: 1,
            hint: "Think of five dispatch slips out at the same time.",
          },
          {
            id: "q4", type: "mcq", flavour: "debug",
            prompt: "Your code crashes with `SyntaxError: Unexpected token r in JSON` when handling a tool call from an OpenAI-style API. What is the most likely cause?",
            options: [
              { text: "The `arguments` field arrives as a JSON string, and this time the model produced invalid JSON", why: "Correct. Wrap `JSON.parse` in try/catch and return an error result to the model." },
              { text: "The tool's function has a bug", why: "The crash happened while reading the arguments, before any function ran." },
              { text: "The API key is wrong", why: "A wrong key causes an authentication error (Module 5), not a JSON parse error." },
            ],
            answer: 0,
            hint: "In which format do OpenAI-style APIs send arguments?",
          },
          {
            id: "q5", type: "multi", flavour: "design",
            prompt: "Which of these should your code do when arguments fail validation? Select all that apply.",
            options: [
              { text: "Skip running the tool", why: "Yes. Never run a function with input you know is wrong." },
              { text: "Send the problems back to the model as a tool result", why: "Yes. Then the model can propose a corrected call." },
              { text: "Quietly fix the arguments and run anyway", why: "Guessing what the model meant can turn “3 bags” into the wrong quantity. Let the model (or a person) correct it." },
              { text: "Record the failure in the logs/trace", why: "Yes. You need this to debug and to spot a tool whose description confuses the model." },
            ],
            answers: [0, 1, 3],
            hint: "Safe, honest, and visible.",
          },
        ] },
      ],
    },

    /* I. TEACH BACK */
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Explain to a classmate what happens, step by step, from the moment your code asks the model about rice to the moment the model sees the stock result. Include where validation happens and why.",
          rubric: [
            { concept: "The model proposes a call with a name and arguments", keywords: ["propose", "tool call", "arguments", "name"], hint: "What exactly does the model send back?" },
            { concept: "Your code validates against the schema before running", keywords: ["validat", "schema", "check"], hint: "What happens before the function runs?" },
            { concept: "Your code executes the real function", keywords: ["execute", "run", "function", "server", "code"], hint: "Who runs the stock check?" },
            { concept: "The result goes back in the conversation (matched by id)", keywords: ["result", "back", "conversation", "message", "id"], hint: "How does the model learn the answer?" },
          ],
          exemplar: "My code sends the model the instructions, the customer's message and the descriptions of the tools. The model replies with a proposed tool call: check_inventory, with arguments productId rice-25 and quantity 3, plus an id. Before anything runs, my code validates those arguments against the tool's schema, so quantity must be a whole number and no extra fields are allowed. If they are wrong, the tool does not run and the error goes back to the model. If they pass, my code runs the real function on our database. The result is written as a tool message with the same id and added to the conversation, and the whole conversation is sent to the model again so it can decide the next step.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "A tool call travels: **request** (with tool definitions) → **proposed call** (id, name, arguments) → **validation** in your code → **execution** of the real function → **result** message with the same id → **back to the model** in the next request. Providers spell the JSON differently, but the idea is the same. Validation checks shape. Tools still check business rules.",
          canNow: [
            "Read the JSON of a tool definition, a tool call and a tool result.",
            "Explain why results carry the call's id.",
            "Write a validator that rejects bad arguments with clear messages.",
            "Explain why validation must happen on your side.",
          ],
          next: "Next: what happens when a tool fails, when it changes the world, and when a person must approve first.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  m6-l3  Errors, side effects and human approval                         */
/* ---------------------------------------------------------------------- */

const l3: Lesson = {
  id: "m6-l3",
  moduleId: "m6",
  title: "Errors, side effects and human approval",
  subtitle: "Read-only and write tools, failures reported as observations, timeouts, and the approval gate before anything changes.",
  minutes: 35,
  prerequisites: ["m6-l2"],
  objectives: [
    "Tell **read-only** tools from **write** tools (tools with side effects).",
    "Explain why tool errors are returned to the model as results instead of crashing the program.",
    "Explain what a timeout is and why every tool call needs one.",
    "Describe an **approval gate** and decide which actions need one.",
    "Explain why a model's message saying an action happened is not proof that it happened.",
  ],
  glossary: ["side-effect", "permission", "human-approval", "timeout", "tool-result", "observation", "tool-executor"],
  completion: [
    "In the Tool Lab, take an order to the approval gate, decide it, and reach a final answer.",
    "Pass the knowledge check.",
    "Explain which actions need a human, and why.",
  ],
  tutor: {
    simpler:
      "Some tools only look (check the stock). Some tools change things (record an order, send money). Looking is safe to repeat. Changing is not, so before a change, the program stops and asks Mama Achen: “Shall I?” If a tool breaks, the program tells the model “that failed” instead of falling over, so the customer gets an honest reply.",
    altAnalogy:
      "A bank teller can check your balance without asking anyone. To pay out more than a set amount, the teller must get a supervisor's signature first. If the system is down, the teller tells you so. They do not hand over cash and hope.",
    misconceptions: [
      "“If the tool fails, the agent should crash so we notice.” Crashing leaves the customer with nothing. Return the error as an observation, log it, and let the agent report honestly.",
      "“The model said ‘your order is confirmed’, so it is.” Only a successful create_order result (and a record in the database) proves that. Words are not evidence.",
      "“Approval means the model asks the user nicely.” The approval gate is in YOUR code. The model cannot skip it, because the code will not run the write tool without a human's yes.",
      "“Put approval on everything to be safe.” If every lookup needs a click, people stop reading and click yes automatically. Approve what matters.",
    ],
    probingQuestions: [
      "Which of the four shop tools change data? Which of them could you safely run twice?",
      "When the inventory service hangs, what does the customer get told? Where did that wording's facts come from?",
      "After you press Reject, what does the orders panel show? What does the model's final answer say? Do they agree?",
      "What information should Mama Achen see on the approval screen to make a good decision?",
    ],
    revisit: ["m6-l2"],
  },
  sections: [
    /* A. PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "When tools can change the world",
      blocks: [
        { type: "p", text: "Looking up the price of sugar is harmless. If it goes wrong, you look again. But `create_order` **changes** Mama Achen's records: it reserves stock, and a real version would trigger a delivery and a mobile money request to the customer. A mistake there costs real money and trust." },
        { type: "p", text: "Things also break. The stock database can be down. A supplier's service can take forever to answer. A model can propose an order for 30 bags when the customer said 3. And sometimes the model's final message will say “Your order is confirmed!” when no order exists at all." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How do we let an agent take real actions, while making failures visible and keeping a person in charge of the actions that matter?" },
      ],
    },

    /* B. ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "The bank teller and the supervisor",
      blocks: [
        { type: "p", text: "Think of a bank teller in a Kampala branch." },
        { type: "list", items: [
          "**Checking a balance** changes nothing. The teller does it immediately, as often as asked.",
          "**Paying out cash** changes the world. Below a limit, the teller may do it. Above the limit (say UGX 5,000,000), the teller must call a **supervisor**, who looks at the slip and signs, or refuses.",
          "**When the system is down**, the teller says so: “I cannot see your account right now, please come back in an hour.” They do not guess the balance.",
          "**Proof** is the receipt and the ledger entry, not the teller saying “done”.",
        ] },
        { type: "analogyMap", pairs: [
          { everyday: "Checking a balance", technical: "A **read-only** tool: no [[side-effect|side effects]], safe to repeat" },
          { everyday: "Paying out cash", technical: "A **write** tool: it changes data or the outside world" },
          { everyday: "The supervisor's signature above a limit", technical: "A [[human-approval|human approval]] gate in your code before a write tool runs" },
          { everyday: "“The system is down, come back later”", technical: "A tool error returned to the model as an [[observation|observation]], so the reply is honest" },
          { everyday: "Giving up on a phone line that never answers", technical: "A [[timeout|timeout]]" },
          { everyday: "The receipt and ledger entry", technical: "The tool result and the database record: the only proof an action happened" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A teller and a supervisor both understand what is at stake. In an agent, the model proposing the payment has no stake and no lasting memory. The supervisor (Mama Achen) must therefore be shown **the actual action and amounts**, taken from the arguments, not just the model's friendly summary of them." },
      ],
    },

    /* C. VISUAL */
    {
      kind: "visual",
      mode: "experiment",
      title: "Reach the approval gate",
      blocks: [
        { type: "steps", items: [
          { title: "Choose “Customer wants 3 bags of rice delivered tomorrow.”", text: "Drive it through search_products, check_inventory and calculate_quote as before (Ask → Validate → Execute → Send updated conversation)." },
          { title: "Watch the model propose create_order.", text: "Notice the **writes** badge next to create_order on the tool shelf. When you validate it, the run does not go to “Execute”. It stops at **stage 4: Human approval**." },
          { title: "Decide.", text: "Read what Mama Achen sees, then press **Approve & run** (an order appears in the orders panel) or **Reject** (nothing is recorded). Either way, send the updated conversation and read the final answer." },
          { title: "Then break something.", text: "Reset and turn on **“Inventory service hangs”**. Execute check_inventory and watch the error become the result. What does the model say next?" },
        ] },
        { type: "lab", lab: "tool-lab", props: { challenge: "approval" }, required: true, caption: "Complete it by taking a write tool to the approval gate and then reaching a final answer." },
        { type: "callout", tone: "sim", text: "“Inventory service hangs” does not really make you wait three seconds. The code pretends the time limit passed and raises the same timeout error a real slow service would cause. The approval buttons stand in for a real approval screen on Mama Achen's phone." },
      ],
    },

    /* D. TECHNICAL */
    {
      kind: "technical",
      mode: "understand",
      title: "Side effects, errors as observations, timeouts, approval",
      blocks: [
        { type: "p", text: "**Side effects.** A tool has a [[side-effect|side effect]] if running it changes something outside the program's own calculation: a database row, a sent SMS, money moved, a rider dispatched. Our tools carry a label: `sideEffect: \"none\"` for `search_products`, `check_inventory` and `calculate_quote`, and `sideEffect: \"write\"` for `create_order`. The label is for **our code**. The model never sees it." },
        { type: "p", text: "**Errors become observations.** When a tool throws an error, the executor catches it and adds a result like `{ \"ok\": false, \"kind\": \"error\", \"error\": \"Timed out: no response after 3000 ms\" }` to the conversation. Because the error is an [[observation|observation]], the model's next response can be honest (“I couldn't check the stock right now”). Without this, the program crashes, or the model never learns that something failed and carries on as if it worked." },
        { type: "p", text: "**Timeouts.** A service that never answers would freeze your agent for ever. So the executor races the tool against a timer. Whichever finishes first wins. Our limit is 3,000 ms. Temporary failures (a timeout, a dropped connection) may be **retried** a limited number of times (our default is once). Permanent failures (an unknown product) are not retried. Retrying a write tool is dangerous, and that is the whole of lesson 4." },
        { type: "showCode", ref: "timeout" },
        { type: "p", text: "**Permissions and approval.** Before a call runs, the executor passes it through four gates. You met the first two in lessons 1 and 2. Gate 3 (the loop guard) belongs to Module 7. Gate 4 is approval: a write tool **pauses** until a person approves. If they reject it, the tool never runs and the model receives `{ \"ok\": false, \"kind\": \"rejected\" }`." },
        { type: "table", head: ["Action", "Read or write?", "Approval?"], rows: [
          ["Search products, check stock", "Read", "No"],
          ["Calculate a quote", "Read (pure arithmetic)", "No"],
          ["Record an order, reserve stock", "Write", "Yes, in this course's shop"],
          ["Request a mobile money payment", "Write, involves money", "Yes, always"],
          ["Send a WhatsApp message to a customer", "Write, cannot be unsent", "Often: at least until the agent has proven itself"],
        ], caption: "A starting point. Where you draw the line depends on cost, reversibility and risk." },
        { type: "callout", tone: "misconception", title: "A message is not proof", text: "In Module 0 the chatbot said “Your order is confirmed” and no order existed. An agent can do the same: its final text might say “recorded” after a rejected or failed call. **Proof that an action happened is the tool result from your executor and the record in your database.** When it matters, your code should check those, and not the model's wording, before telling a customer that something is done." },
      ],
    },

    /* E. EXAMPLE */
    {
      kind: "example",
      mode: "understand",
      title: "The four gates in the real loop",
      blocks: [
        { type: "p", text: "Every proposed call in every agent lab passes through this code. Read the notes on each gate." },
        { type: "showCode", ref: "agent-checks" },
        { type: "p", text: "And this is how a failure turns into an observation instead of a crash (from the “execute” region of the same file):" },
        { type: "code", lang: "ts", code: `} catch (e) {
  const err = e as Error;
  const retryable = err instanceof ToolFailure && err.retryable;
  if (retryable && attempt <= config.maxRetries) {
    log("retry", "Temporary failure — retrying", err.message, ["executor", "safety"], "execute", { attempt }, "warn");
    continue;
  }
  reply(call, { ok: false, kind: "error", error: err.message });
  log("tool_error", \`\${tool.name} failed\`, err.message, [home, "executor", "safety"], "execute", { error: err.message }, "error");
  return "ok";
}`, caption: "src/engine/agent/loop.ts", notes: [
          { line: 3, text: "Only failures marked as temporary (`retryable`) are tried again." },
          { line: 4, text: "…and only up to `maxRetries` times. Never retry for ever." },
          { line: 8, text: "Otherwise the error becomes the tool result. The model will see it in the next request." },
          { line: 10, text: "The loop carries on. The program does not crash." },
        ] },
      ],
    },

    /* F. CHALLENGE */
    {
      kind: "challenge",
      mode: "experiment",
      title: "Check the proof, not the words",
      blocks: [
        { type: "p", text: "In the lab above, run the rice order **twice**: once approving, once rejecting (press Reset in between). Each time, compare three things:" },
        { type: "list", ordered: true, items: [
          "What the final answer says about the order.",
          "The `create_order` entry in the execution log (was there a “returned” result, or a rejection?).",
          "The **Shop database: orders** panel.",
        ] },
        { type: "p", text: "Then do one run with **“Inventory service hangs”** turned on, and write down the exact error your code sent back to the model." },
        { type: "callout", tone: "tip", text: "The lab counts the challenge complete after a write tool reaches the approval gate and the run reaches a final answer, whichever button you choose." },
      ],
    },

    /* G. FAILURE */
    {
      kind: "failure",
      mode: "understand",
      title: "Three ways the gates fail",
      blocks: [
        { type: "table", head: ["Failure", "How to recognise it", "Fix"], rows: [
          ["**The confident false success.** The model says “Your order ORD-1050 is confirmed” but create_order failed or never ran.", "The order id in the message is not in the database. The trace shows an error or a rejection.", "Your code, not the model, confirms writes: it reads the tool result and the database before sending a confirmation. Instructions also tell the model to report failures honestly, but code checks are the real protection."],
          ["**Approval fatigue.** Mama Achen gets 200 approval requests a day and starts pressing Approve without reading.", "Approvals that take one second. Mistakes approved anyway.", "Approve only writes that matter. Show the real amounts from the arguments. Add automatic limits (for example, small orders under UGX 50,000 need no approval, large ones always do)."],
          ["**Swallowed errors.** A tool fails, the code catches the error and returns an empty result `[]`.", "The model says “that product doesn't exist” when the real problem was a database outage.", "Return the real error with `ok: false`. “Not found” and “could not check” are different facts and lead to different answers."],
        ] },
      ],
    },

    /* H. QUIZ */
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "multi", flavour: "recall",
            prompt: "Which of these tools have **side effects**? Select all that apply.",
            options: [
              { text: "search_products", why: "It only reads the catalogue." },
              { text: "create_order", why: "Yes. It writes an order and reserves stock." },
              { text: "send_sms_to_customer", why: "Yes. A message, once sent, cannot be unsent." },
              { text: "calculate_quote", why: "It only does arithmetic. Nothing outside changes." },
            ],
            answers: [1, 2],
            hint: "Does running it change anything outside the calculation?",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "The inventory service times out (and the one retry also times out). With this course's loop, what happens next?",
            options: [
              { text: "The program crashes and the customer gets no reply.", why: "The executor catches the error. Crashing is exactly what it avoids." },
              { text: "The error is added to the conversation as a tool result, and the model can tell the customer it couldn't check the stock.", why: "Correct. The failure becomes an observation." },
              { text: "The loop assumes the item is in stock and continues.", why: "That would be inventing a fact. The loop never fills in a missing result." },
            ],
            answer: 1,
            hint: "Look at what `reply(call, { ok: false, … })` does.",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "A customer complains: the assistant said “Your order is recorded”, but Mama Achen has no such order. What do you check **first**?",
            options: [
              { text: "The trace: did create_order return a successful result, fail, or get rejected?", why: "Correct. The trace is evidence. The message is just words." },
              { text: "Whether the model is polite enough", why: "Politeness has nothing to do with whether a write happened." },
              { text: "The customer's phone", why: "The problem is on your side: what really happened in your system?" },
            ],
            answer: 0,
            hint: "Where is the proof that an action happened?",
          },
          {
            id: "q4", type: "mcq", flavour: "analogy",
            prompt: "In the bank analogy, what plays the role of the **approval gate**?",
            options: [
              { text: "The customer filling in the withdrawal slip", why: "That is the request." },
              { text: "The supervisor who must sign before a large payout", why: "Correct. A person checks before the irreversible action." },
              { text: "The receipt", why: "The receipt is proof afterwards: the tool result and the database record." },
            ],
            answer: 1,
            hint: "Who can stop the action before it happens?",
          },
          {
            id: "q5", type: "mcq", flavour: "design",
            prompt: "Where should the approval check live?",
            options: [
              { text: "In the system prompt: “Always ask the owner before creating orders.”", why: "Instructions help, but a model can fail to follow them, or be manipulated (prompt injection, Module 13). The model cannot be the guard of its own actions." },
              { text: "In your executor code, which will not run a write tool without a recorded yes from a person", why: "Correct. Code enforces it whatever the model writes." },
              { text: "In the tool's description", why: "The description is advice to the model, not a control." },
            ],
            answer: 1,
            hint: "Which of these can the model not ignore?",
          },
        ] },
      ],
    },

    /* I. TEACH BACK */
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Mama Achen asks: “If I let this assistant take orders, what stops it from recording wrong orders, and how will I know if something fails?” Answer her in plain words.",
          rubric: [
            { concept: "Read tools vs write tools", keywords: ["read", "write", "change", "side effect", "only look", "looks"], hint: "Which actions change things?" },
            { concept: "Approval before writes, enforced by code", keywords: ["approve", "approval", "you decide", "ask you", "confirm", "permission"], hint: "Who says yes before an order is recorded?" },
            { concept: "Errors are reported, not hidden", keywords: ["error", "fail", "honest", "tell", "report"], hint: "What happens when the stock check fails?" },
            { concept: "Proof is the record, not the message", keywords: ["record", "database", "proof", "result", "check the", "log"], hint: "How do you know an order exists?" },
          ],
          exemplar: "Some of the assistant's tools only look, like checking the price or stock. Those are safe. The tool that records an order changes your records, so the program is built to stop before it runs and show you the exact order and total. Nothing is recorded unless you press approve. That rule is in the program itself, so the AI cannot skip it. If something breaks, like the stock system not answering, the error goes back to the assistant and it tells the customer honestly that it couldn't check. And you never trust the assistant's words alone: an order is real only if it appears in your orders list and the log shows it was recorded.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "**Read-only** tools change nothing. **Write** tools have side effects and pass through an **approval gate** in your code. Tool **errors** and **timeouts** are caught and returned as **observations**, so the agent stays honest and the program keeps running. Temporary failures get a limited number of retries. A model saying “done” is not proof: the tool result and the database are.",
          canNow: [
            "Classify tools as read or write and decide which need approval.",
            "Explain how an error becomes an observation.",
            "Explain why every tool call needs a timeout.",
            "Check whether an action really happened.",
          ],
          next: "Retrying is fine for reads, but what if a write succeeded and only the reply was lost? Next lesson: idempotency.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  m6-l4  Idempotency                                                     */
/* ---------------------------------------------------------------------- */

const ORDER_STARTER = `// The shop's tiny in-memory database.
function newStore() {
  return { stock: { "rice-25": 12, "sugar-1": 35 }, orders: [], seenKeys: {}, nextNumber: 1041 };
}

// Records an order. Right now it creates a NEW order every time it is
// called, even when the same request is simply retried.
//
// TODO: make it idempotent.
//   - If "key" is given and store.seenKeys[key] exists, return that
//     existing order and change NOTHING (no new order, no stock change).
//   - If "key" is given and is new, create the order as normal and
//     remember it: store.seenKeys[key] = record
//   - If no key is given, behave as now.
function createOrder(store, order, key) {
  const record = {
    orderId: "ORD-" + store.nextNumber,
    productId: order.productId,
    quantity: order.quantity,
    customer: order.customer,
  };
  store.nextNumber += 1;
  store.stock[order.productId] -= order.quantity; // the side effect
  store.orders.push(record);
  return record;
}

// Try it: the network dropped the first reply, so the same request is retried.
const s = newStore();
const order = { productId: "rice-25", quantity: 3, customer: "Mama Achen's customer" };
createOrder(s, order, "key-abc");
createOrder(s, order, "key-abc");
console.log(s.orders.length + " order(s), rice bags left: " + s.stock["rice-25"]);
`;

const ORDER_SOLUTION = `function newStore() {
  return { stock: { "rice-25": 12, "sugar-1": 35 }, orders: [], seenKeys: {}, nextNumber: 1041 };
}

function createOrder(store, order, key) {
  // Seen this key before? Then this is a retry: return the original order.
  if (key && store.seenKeys[key]) {
    return store.seenKeys[key];
  }

  const record = {
    orderId: "ORD-" + store.nextNumber,
    productId: order.productId,
    quantity: order.quantity,
    customer: order.customer,
  };
  store.nextNumber += 1;
  store.stock[order.productId] -= order.quantity; // the side effect
  store.orders.push(record);

  // Remember the key so a retry can be recognised.
  if (key) store.seenKeys[key] = record;
  return record;
}

const s = newStore();
const order = { productId: "rice-25", quantity: 3, customer: "Mama Achen's customer" };
createOrder(s, order, "key-abc");
createOrder(s, order, "key-abc");
console.log(s.orders.length + " order(s), rice bags left: " + s.stock["rice-25"]);
`;

const l4: Lesson = {
  id: "m6-l4",
  moduleId: "m6",
  title: "Idempotency: never sell the same rice twice",
  subtitle: "The action happened but the reply was lost. Your code retries. Now there are two orders, unless your code sends an idempotency key.",
  minutes: 35,
  prerequisites: ["m6-l3", "m5-l3"],
  objectives: [
    "Describe the **lost-response problem**: the action succeeded but the caller never heard back.",
    "Explain why a plain retry of a write tool can create duplicates.",
    "Explain what an **idempotency key** is and why YOUR code, not the model, must create it.",
    "Implement an idempotent `createOrder` in JavaScript.",
  ],
  glossary: ["idempotency", "retry", "timeout", "side-effect", "tool-executor"],
  completion: [
    "In the Tool Lab, create a duplicate order with a keyless retry, then prevent it with a key.",
    "Make `createOrder` pass all its tests.",
    "Pass the knowledge check.",
  ],
  tutor: {
    simpler:
      "Imagine you send mobile money and the network drops before you get the confirmation SMS. If you just send again, you might pay twice. But if every payment has a reference number and you send the SAME reference again, the system says “I already did that one” and does not pay twice. That reference number is an idempotency key.",
    altAnalogy:
      "A school bursar issues receipt numbers. If a parent comes back with receipt 0457 asking “did my payment go through?”, the bursar looks it up and says “yes, already paid”. No receipt number, and the bursar might take the fees twice.",
    misconceptions: [
      "“Just don't retry write tools.” Then a lost reply means you never find out whether the order exists. Retries are needed. They must be safe retries.",
      "“Let the model generate the key.” The model may produce a different key on the retry, or reuse an old one for a new order. Keys are made by your code, from things your code controls.",
      "“A new random key on every attempt is fine.” A key must stay the SAME across retries of one action. A new key looks like a new order.",
      "“Idempotency means the action can't fail.” It means repeating the same request has the same effect as doing it once.",
    ],
    probingQuestions: [
      "In the lab, when the reply was lost, had the order already been created? How could your code have known?",
      "Why did the second run (with a key) show only one order?",
      "Two different customers both order 3 bags of rice at 10:00. What would go wrong if the key were just “rice-25-3”?",
      "Which of the shop's tools are idempotent without any key? Why?",
    ],
    revisit: ["m6-l3", "m5-l3"],
  },
  sections: [
    /* A. PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "Did it go through?",
      blocks: [
        { type: "p", text: "Mama Achen approves an order: 3 bags of rice for delivery. Your code calls `create_order`. On the server the order is written, stock is reserved, and a reply is sent back. Then a network glitch drops that reply. From your code's point of view, the request simply failed: “connection dropped”." },
        { type: "p", text: "In Module 5 you learned to retry failed requests with backoff, and lesson 3 said temporary failures can be retried. So your code retries, and the server, which has no idea this is the same request, **creates a second order**. Six bags are reserved, a rider may be sent twice, and the customer may be asked to pay twice." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How can we retry safely when we cannot tell whether the first attempt worked?" },
      ],
    },

    /* B. ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "Mobile money and the missing SMS",
      blocks: [
        { type: "p", text: "You send UGX 150,000 to a supplier by mobile money. The screen freezes, and the confirmation SMS never arrives. Did the money leave? If you send it again “to be safe” and the first one did go through, you have paid twice." },
        { type: "p", text: "Mobile money transactions carry a **transaction ID**, and many payment systems let the sender attach their own **reference**. When the same reference arrives again, a well-designed system recognises it and answers “already done, here is the original transaction” instead of moving the money a second time. A shop receipt number works the same way: present receipt 0457 twice and the cashier knows it was already paid." },
        { type: "analogyMap", pairs: [
          { everyday: "Sending the payment", technical: "Calling a **write** tool (`create_order`)" },
          { everyday: "The confirmation SMS that never came", technical: "The **lost response**: the action happened, but the reply did not reach your code" },
          { everyday: "Sending the payment again", technical: "A [[retry|retry]]" },
          { everyday: "Your own payment reference, the same on both attempts", technical: "An **idempotency key** created by your code and reused on every retry" },
          { everyday: "“Already done, here is the original transaction”", technical: "The server finds the key and returns the original result, with no second order. The request is now [[idempotency|idempotent]]." },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Whether a real mobile money or bank service accepts a reference like this, and for how long it remembers it, depends on that provider. Check its documentation. In your own tools, **you** build this behaviour, as you are about to do." },
      ],
    },

    /* C. VISUAL */
    {
      kind: "visual",
      mode: "experiment",
      title: "Make a duplicate, then prevent it",
      blocks: [
        { type: "p", text: "This challenge has **two runs**. The lab completes only after you have seen both." },
        { type: "steps", items: [
          { title: "Run 1, without a key: set the switches.", text: "Turn **on** “Network drops create_order's reply”. Turn **off** “Send an idempotency key”." },
          { title: "Run 1: go to the order.", text: "With the rice message, drive the run to create_order and press **Approve & run**. The log shows the reply was dropped, and a note says the order **was** created. Your code doesn't know that." },
          { title: "Run 1: retry.", text: "Press **Retry create_order**. Look at the orders panel: two orders, and a warning about duplicates." },
          { title: "Run 2, with a key.", text: "Press **Reset** (your switches stay as they are). Turn **on** “Send an idempotency key”, then repeat. This time the retry returns `duplicatePrevented: true` with the **same** order id, and the orders panel shows one order." },
        ] },
        { type: "lab", lab: "tool-lab", props: { challenge: "idempotency" }, required: true, caption: "Complete it by seeing a keyless retry create a duplicate AND a keyed retry prevent one." },
        { type: "callout", tone: "sim", text: "The dropped reply is simulated: our code runs the real create_order (the order really is written to the in-memory database) and then throws “Connection dropped before the response arrived”, exactly as if the network had lost the reply. In the lab the key is `key-<call id>`, made by the lab's code." },
      ],
    },

    /* D. TECHNICAL */
    {
      kind: "technical",
      mode: "understand",
      title: "Idempotency keys",
      blocks: [
        { type: "p", text: "An operation is [[idempotency|idempotent]] if doing it twice has the same effect as doing it once. Reads are naturally idempotent: checking the stock twice changes nothing. “Create a new order” is **not**: each call adds an order. We make it idempotent by giving each **intended** action a unique **idempotency key**:" },
        { type: "list", ordered: true, items: [
          "Your code creates a key for the action **before the first attempt**.",
          "Every retry of that same action sends the **same** key.",
          "The server stores each key with the result it produced. If a key arrives that it has already seen, it returns the stored result and does nothing new.",
        ] },
        { type: "p", text: "**Who makes the key?** Your code, never the model. The model produces text: on a retry it may produce a different key (so the retry looks like a new order), or it may copy an old key into a genuinely new order (so the new order is silently swallowed). In this course's loop, the executor builds the key from the task and the exact call, then adds it to the arguments **after** validation, so the model does not need to know about it at all:" },
        { type: "code", lang: "ts", code: `const args = { ...call.arguments };
if (tool.sideEffect === "write" && config.idempotency) {
  args.idempotencyKey = \`run-\${stableHash(task)}-\${stableHash(signature)}\`;
}`, caption: "From src/engine/agent/loop.ts (the “execute” region). `signature` is the tool name plus its arguments.", notes: [
          { line: 1, text: "Copy the model's arguments. Our code adds to the copy." },
          { line: 2, text: "Only write tools need keys. Reads are safe to repeat." },
          { line: 3, text: "Same task and same call → same key on every attempt, because the key is computed, not random." },
        ] },
        { type: "callout", tone: "info", title: "In real systems", text: "Payment APIs commonly support this. Stripe, for example, accepts an `Idempotency-Key` header on requests. Many mobile money APIs ask you to send a unique reference id with each payment request, which you can also use to check its status later. The exact rules (header name, how long keys are remembered) differ by provider, so read their documentation. Keys are usually random ids (UUIDs) created once per intended action and saved, so that even a restarted program retries with the same key." },
        { type: "p", text: "Two more good habits. **Check before retrying**: if the service can look up an action by its key or reference, ask it “did key X happen?” before retrying. **Retry a limited number of times only**, and if it is still unclear, tell a person instead of guessing." },
      ],
    },

    /* E. EXAMPLE */
    {
      kind: "example",
      mode: "understand",
      title: "The real create_order",
      blocks: [
        { type: "p", text: "Here is the write tool the lab runs. Find the three lines that make it idempotent: the check at the top, and the line that remembers the key at the bottom." },
        { type: "showCode", ref: "tool-order" },
      ],
    },

    /* F. CHALLENGE */
    {
      kind: "challenge",
      mode: "build",
      title: "Make createOrder idempotent",
      blocks: [
        { type: "exercise", exercise: {
          id: "m6-l4-create-order",
          title: "createOrder with an idempotency key",
          brief: "`createOrder(store, order, key)` records an order and reserves stock. Change it so that **a repeated key returns the existing order and changes nothing**. Store the order under its key in `store.seenKeys`. With no key, it should behave as it does now. That is not safe, but it shows why the key matters. Each test starts from a fresh `newStore()`.",
          starter: ORDER_STARTER,
          solution: ORDER_SOLUTION,
          tests: [
            { name: "the first order is ORD-1041", expr: `createOrder(newStore(), { productId: "rice-25", quantity: 3, customer: "A" }, "k1").orderId`, expected: "ORD-1041" },
            { name: "a retry with the same key creates no second order", expr: `(() => { const st = newStore(); const o = { productId: "rice-25", quantity: 3, customer: "A" }; createOrder(st, o, "k1"); createOrder(st, o, "k1"); return st.orders.length; })()`, expected: 1 },
            { name: "the retry returns the original order id", expr: `(() => { const st = newStore(); const o = { productId: "rice-25", quantity: 3, customer: "A" }; return [createOrder(st, o, "k1").orderId, createOrder(st, o, "k1").orderId]; })()`, expected: ["ORD-1041", "ORD-1041"] },
            { name: "stock is reserved only once (12 - 3 = 9)", expr: `(() => { const st = newStore(); const o = { productId: "rice-25", quantity: 3, customer: "A" }; createOrder(st, o, "k1"); createOrder(st, o, "k1"); return st.stock["rice-25"]; })()`, expected: 9 },
            { name: "different keys are different orders", expr: `(() => { const st = newStore(); const o = { productId: "sugar-1", quantity: 2, customer: "B" }; createOrder(st, o, "k1"); createOrder(st, o, "k2"); return st.orders.map((x) => x.orderId); })()`, expected: ["ORD-1041", "ORD-1042"] },
            { name: "without a key, a retry still duplicates (that's why keys matter)", expr: `(() => { const st = newStore(); const o = { productId: "rice-25", quantity: 3, customer: "A" }; createOrder(st, o); createOrder(st, o); return st.orders.length; })()`, expected: 2 },
          ],
          hints: [
            "The very first thing createOrder should do is check `if (key && store.seenKeys[key])`.",
            "If that is true, `return store.seenKeys[key];` and stop. Don't touch stock or orders.",
            "After creating a new record, remember it: `if (key) store.seenKeys[key] = record;`",
          ],
        } },
      ],
    },

    /* G. FAILURE */
    {
      kind: "failure",
      mode: "understand",
      title: "Keys that don't protect you",
      blocks: [
        { type: "table", head: ["Mistake", "What goes wrong", "Fix"], rows: [
          ["A fresh random key on **every attempt** (for example made inside the retry loop)", "Every retry looks new, so duplicates come back.", "Create the key **once per intended action**, before the first attempt, and reuse it."],
          ["A key built only from the order's contents, like `rice-25-3`", "Two different customers ordering 3 bags, or the same customer ordering again next week, get the **same** key. The second real order is swallowed.", "Include something unique to this action: an order draft id, a conversation id, or a stored random id."],
          ["The model chooses the key", "Keys change between retries or get copied into new orders.", "Your executor adds the key after validation. The model never needs to see it."],
          ["Keys are remembered only in memory", "After a restart, a retry is not recognised.", "Store keys in the database with the order. Decide how long to keep them."],
          ["Retrying for ever", "A broken service gets hammered, and costs and delays grow.", "A small retry limit, then report honestly and ask a person."],
        ] },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "Two orders with the same customer, items and nearly the same time, often with matching log lines saying “retry”. Our lab's orders panel shows each order's key: if two orders have “key: none” or different keys for what was one approval, your keys are not doing their job." },
      ],
    },

    /* H. QUIZ */
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "What is the **lost-response problem**?",
            options: [
              { text: "The model forgets the customer's message", why: "That is about context, not about tool replies." },
              { text: "The action succeeded on the server, but the reply never reached your code, so you can't tell whether it worked", why: "Correct. That uncertainty is what makes plain retries dangerous." },
              { text: "The tool returns an error message", why: "An error that arrives is a reply. The problem is a reply that does not arrive." },
            ],
            answer: 1,
            hint: "Think of the missing confirmation SMS.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "In the lab, “Send an idempotency key” is OFF and the reply is dropped. You press Retry. What will the orders panel show?",
            options: [
              { text: "One order", why: "Without a key, the server cannot tell the retry is the same request." },
              { text: "Two orders and a duplicate warning", why: "Correct. The first attempt really created an order, and the retry created another." },
              { text: "No orders, because the first attempt failed", why: "The first attempt did NOT fail on the server. Only the reply was lost." },
            ],
            answer: 1,
            hint: "Did the first attempt write to the database?",
          },
          {
            id: "q3", type: "mcq", flavour: "design",
            prompt: "Who should generate the idempotency key for `create_order`?",
            options: [
              { text: "The model, as one of the tool arguments", why: "The model might produce a different key on retry, or reuse one wrongly. It is not a reliable source." },
              { text: "Your code, once per intended action, reused on every retry", why: "Correct." },
              { text: "The customer", why: "Customers shouldn't need to know about keys, and could reuse them by accident." },
            ],
            answer: 1,
            hint: "The key must stay the same across retries and be unique per action. Who can guarantee both?",
          },
          {
            id: "q4", type: "multi", flavour: "recall",
            prompt: "Which operations are naturally idempotent (safe to repeat with no key)? Select all that apply.",
            options: [
              { text: "check_inventory", why: "Yes. Reading twice changes nothing." },
              { text: "calculate_quote", why: "Yes. Same inputs, same total, nothing changed." },
              { text: "create_order", why: "No. Each call adds a new order unless a key is used." },
              { text: "Request a mobile money payment", why: "No. Repeating it can charge twice." },
            ],
            answers: [0, 1],
            hint: "Does repeating it change anything?",
          },
          {
            id: "q5", type: "mcq", flavour: "debug",
            prompt: "After adding idempotency keys you still see duplicate orders. The retry code is below. What is wrong?",
            code: `for (let attempt = 1; attempt <= 2; attempt++) {
  const key = "order-" + Math.random();
  try { return await createOrder(order, key); } catch (e) { /* retry */ }
}`,
            options: [
              { text: "Math.random() is not random enough", why: "Randomness isn't the problem. A NEW key on each attempt is." },
              { text: "The key is created inside the loop, so each attempt has a different key", why: "Correct. Create the key once, before the loop, and reuse it." },
              { text: "Two attempts is too few", why: "More attempts with a fresh key each time would create even more duplicates." },
            ],
            answer: 1,
            hint: "What must be the same on every attempt?",
          },
        ] },
      ],
    },

    /* I. TEACH BACK */
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Explain to Mama Achen why her assistant once recorded the same rice order twice, and how an idempotency key stops it. Use an everyday example she knows.",
          rubric: [
            { concept: "The action happened but the reply was lost", keywords: ["lost", "dropped", "never got", "didn't hear", "did not hear", "reply", "response", "confirmation"], hint: "Why did the program think it failed?" },
            { concept: "A plain retry repeats the action", keywords: ["retry", "again", "twice", "duplicate", "second"], hint: "What did the program do next?" },
            { concept: "Same key on every retry, recognised by the server", keywords: ["key", "reference", "receipt", "same number", "transaction id", "id"], hint: "What makes a retry recognisable?" },
            { concept: "Your code creates the key, not the model", keywords: ["code", "program", "not the model", "not the ai", "we make", "system makes"], hint: "Who is responsible for the key?" },
          ],
          exemplar: "The order really was saved the first time, but the network dropped the reply, so the program thought it had failed and tried again. Without anything to tell the two attempts apart, the database saved a second order. It's like sending mobile money, getting no SMS, and sending again. Now the program gives each order its own reference number, like a receipt number, before trying. If it has to try again, it sends the same number. The database sees “I already have that number” and returns the first order instead of making a new one. The program creates that number itself, never the AI, so it is always the same on a retry and different for a genuinely new order.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "When a write succeeds but its reply is lost, a plain **retry** creates a **duplicate**. An **idempotency key**, created by **your code** once per intended action and sent on every attempt, lets the server recognise the retry and return the original result. Reads are naturally idempotent. Writes need keys, limited retries, and honest reporting when the outcome is still unclear.",
          canNow: [
            "Explain the lost-response problem with a mobile money example.",
            "Explain why keys come from your code, not the model.",
            "Write an idempotent create function.",
            "Spot bad key designs (random per attempt, content-only, model-chosen).",
          ],
          next: "You can now make one tool call safely. Module 7 puts tool calls in a loop: the agent loop, where the model can take many steps toward a goal. First, put Module 6 together in Project 3: a Product Information Assistant.",
        },
      ],
    },
  ],
};

export const m06Lessons: Lesson[] = [l1, l2, l3, l4];

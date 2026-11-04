import type { CodeExercise, Lesson } from "../schema";

/* ======================================================================
   MODULE 5 — APIs: Connecting Your Code to AI
   Provider details (endpoints, headers, body fields, response fields)
   were checked against the official documentation in November 2026:
     Anthropic: https://platform.claude.com/docs/en/api/messages/create
                https://platform.claude.com/docs/en/api/overview
                https://platform.claude.com/docs/en/api/versioning
                https://platform.claude.com/docs/en/api/errors
                https://platform.claude.com/docs/en/api/rate-limits
     OpenAI:    https://developers.openai.com/api/docs/guides/text
                https://developers.openai.com/api/docs/guides/reasoning
                https://developers.openai.com/api/docs/guides/error-codes
     Next.js:   https://nextjs.org/docs/app/guides/environment-variables
   Providers change their APIs. Lessons tell learners to re-check.
   ====================================================================== */

/* ---------------------------- Exercises ---------------------------- */

const exOrderRequest: CodeExercise = {
  id: "m5-build-order-request",
  title: "Build an order request, then read the reply",
  brief:
    "Fix `orderRequest` so it returns a correct request for placing an order at Mama Achen's shop: method `POST`, the URL `https://api.mama-achen.example/v1/orders`, a `Content-Type: application/json` header, and a `body` that is a JSON **string** containing exactly `customer` and an `items` list with one `{ productId, quantity }`. Then fix `readTotal` so it turns the server's reply text into an object and returns its `totalUGX`. Nothing is sent anywhere: you are only building the request.",
  starter: `const SHOP = "https://api.mama-achen.example";

// 1. Build the request that places an order.
function orderRequest(customer, productId, quantity) {
  return {
    method: "GET",                    // is this the right method for creating something?
    url: SHOP + "/v1/orders",
    headers: {},                      // which header says "the body is JSON"?
    body: { customer: customer },     // must be a JSON *string*, and it needs an items list
  };
}

// 2. The server replies with text. Read the total from it.
function readTotal(responseText) {
  return responseText.totalUGX;       // responseText is a string, not an object yet
}

console.log(orderRequest("Okello", "rice-25", 2));
`,
  solution: `const SHOP = "https://api.mama-achen.example";

function orderRequest(customer, productId, quantity) {
  return {
    method: "POST",
    url: SHOP + "/v1/orders",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: customer,
      items: [{ productId: productId, quantity: quantity }],
    }),
  };
}

function readTotal(responseText) {
  const data = JSON.parse(responseText);
  return data.totalUGX;
}

console.log(orderRequest("Okello", "rice-25", 2));
`,
  tests: [
    { name: "uses POST to create an order", expr: `orderRequest("Okello", "rice-25", 2).method`, expected: "POST" },
    { name: "uses the orders endpoint", expr: `orderRequest("Okello", "rice-25", 2).url`, expected: "https://api.mama-achen.example/v1/orders" },
    { name: "says the body is JSON", expr: `orderRequest("Okello", "rice-25", 2).headers["Content-Type"]`, expected: "application/json" },
    { name: "the body is a string", expr: `typeof orderRequest("Okello", "rice-25", 2).body`, expected: "string" },
    { name: "the body holds customer and items", expr: `JSON.parse(orderRequest("Okello", "rice-25", 2).body)`, expected: { customer: "Okello", items: [{ productId: "rice-25", quantity: 2 }] } },
    { name: "quantity is a number, not text", expr: `typeof JSON.parse(orderRequest("Nakato", "beans-1", 3).body).items[0].quantity`, expected: "number" },
    { name: "reads the total from the reply text", expr: `readTotal('{"id":"ord_1041","status":"pending","totalUGX":225000}')`, expected: 225000 },
  ],
  hints: [
    "Creating something new on a server is usually done with POST.",
    "The header is written exactly `\"Content-Type\": \"application/json\"` inside the headers object.",
    "`JSON.stringify(object)` turns an object into a JSON string. `JSON.parse(text)` turns JSON text back into an object.",
    "The body should look like: `{ customer, items: [{ productId, quantity }] }`, made into a string.",
  ],
};

const exSecrets: CodeExercise = {
  id: "m5-keep-key-secret",
  title: "Read a key from the environment, safely",
  brief:
    "On a server you would read keys from `process.env`. Here, the environment is passed in as an object called `env` so the code can be tested. Write three functions: `requireEnv(env, name)` returns the value or **throws** an error whose message contains the variable's name if it is missing or empty; `maskKey(key)` returns the first 4 and last 4 characters joined by `…` (or `\"****\"` if the key is shorter than 12 characters) so you can log it safely; `modelHeaders(env)` returns the JSON content type plus `Authorization: Bearer <key>` using `MODEL_API_KEY` from `env`. No key may be typed into the code.",
  starter: `function requireEnv(env, name) {
  return env[name];   // what if it is missing, or an empty string?
}

function maskKey(key) {
  return key;         // never print a whole key!
}

function modelHeaders(env) {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-sim-9fA2xQ7LmB3vT8pR",   // a key typed into code
  };
}
`,
  solution: `function requireEnv(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Missing environment variable " + name + ". Add it to .env.local on the server.");
  }
  return value;
}

function maskKey(key) {
  if (typeof key !== "string" || key.length < 12) return "****";
  return key.slice(0, 4) + "…" + key.slice(-4);
}

function modelHeaders(env) {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + requireEnv(env, "MODEL_API_KEY"),
  };
}
`,
  tests: [
    { name: "returns a value that is set", expr: `requireEnv({ MODEL_API_KEY: "sk-sim-abc123456789" }, "MODEL_API_KEY")`, expected: "sk-sim-abc123456789" },
    { name: "throws a clear error when missing", expr: `requireEnv({}, "MODEL_API_KEY")`, throws: "MODEL_API_KEY" },
    { name: "throws when empty", expr: `requireEnv({ MODEL_API_KEY: "" }, "MODEL_API_KEY")`, throws: "MODEL_API_KEY" },
    { name: "masks a key for logging", expr: `maskKey("sk-sim-9fA2xQ7LmB3vT8pR")`, expected: "sk-s…T8pR" },
    { name: "hides short values completely", expr: `maskKey("short")`, expected: "****" },
    {
      name: "builds headers from the environment",
      expr: `modelHeaders({ MODEL_API_KEY: "sk-sim-DIFFERENT1234" })`,
      expected: { "Content-Type": "application/json", Authorization: "Bearer sk-sim-DIFFERENT1234" },
    },
    { name: "refuses to build headers without a key", expr: `modelHeaders({})`, throws: "MODEL_API_KEY" },
  ],
  hints: [
    "`throw new Error(\"Missing environment variable \" + name)` stops the function with a message.",
    "`key.slice(0, 4)` gives the first four characters; `key.slice(-4)` gives the last four.",
    "In `modelHeaders`, call `requireEnv(env, \"MODEL_API_KEY\")` instead of typing a key.",
  ],
};

const exRetry: CodeExercise = {
  id: "m5-retry-backoff",
  title: "Retry with exponential backoff",
  brief:
    "Write `callWithRetry(send, sleep, maxAttempts = 4)`. `send()` returns a promise of `{ status, headers }` (header names are lowercase). If the status is **429 or 500 and above**, wait and try again, up to `maxAttempts` attempts in total. Wait `Number(headers[\"retry-after\"]) * 1000` ms if that header is present, otherwise 500 ms, then 1000, then 2000 (doubling). Use `await sleep(ms)` to wait (the tests pass a fake `sleep` that records the delays, so nothing really waits). Any other status (2xx, 400, 401, 404…) is returned immediately. Do not sleep after the last attempt. Return the last response.",
  starter: `async function callWithRetry(send, sleep, maxAttempts = 4) {
  const response = await send();
  // TODO: if the status is 429 or 5xx, wait and try again,
  // up to maxAttempts attempts in total.
  // Wait: Retry-After seconds x 1000 if the header is present,
  // otherwise 500 ms, then 1000, then 2000 ... (doubling).
  return response;
}
`,
  solution: `async function callWithRetry(send, sleep, maxAttempts = 4) {
  let response;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    response = await send();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxAttempts) return response;

    const retryAfter = response.headers && response.headers["retry-after"];
    const waitMs = retryAfter !== undefined
      ? Number(retryAfter) * 1000
      : 500 * 2 ** (attempt - 1);
    await sleep(waitMs);
  }
  return response;
}
`,
  tests: [
    {
      name: "success first time: no waiting",
      expr: `(async () => { const waits = []; const r = await callWithRetry(async () => ({ status: 200, headers: {} }), async (ms) => { waits.push(ms); }); return [r.status, waits]; })()`,
      expected: [200, []],
    },
    {
      name: "busy server (503, 503, 200): waits 500 then 1000",
      expr: `(async () => { const seq = [503, 503, 200]; const waits = []; const r = await callWithRetry(async () => ({ status: seq.shift(), headers: {} }), async (ms) => { waits.push(ms); }); return [r.status, waits]; })()`,
      expected: [200, [500, 1000]],
    },
    {
      name: "obeys Retry-After on a 429",
      expr: `(async () => { const seq = [{ status: 429, headers: { "retry-after": "3" } }, { status: 200, headers: {} }]; const waits = []; const r = await callWithRetry(async () => seq.shift(), async (ms) => { waits.push(ms); }); return [r.status, waits]; })()`,
      expected: [200, [3000]],
    },
    {
      name: "never retries a 400 (fix the request instead)",
      expr: `(async () => { let sends = 0; const r = await callWithRetry(async () => { sends++; return { status: 400, headers: {} }; }, async () => {}); return [r.status, sends]; })()`,
      expected: [400, 1],
    },
    {
      name: "never retries a 401",
      expr: `(async () => { let sends = 0; const r = await callWithRetry(async () => { sends++; return { status: 401, headers: {} }; }, async () => {}); return [r.status, sends]; })()`,
      expected: [401, 1],
    },
    {
      name: "broken server: gives up after 4 attempts",
      expr: `(async () => { let sends = 0; const waits = []; const r = await callWithRetry(async () => { sends++; return { status: 500, headers: {} }; }, async (ms) => { waits.push(ms); }); return [r.status, sends, waits]; })()`,
      expected: [500, 4, [500, 1000, 2000]],
    },
  ],
  hints: [
    "Use a `for` loop from attempt 1 to maxAttempts, and `await send()` inside it.",
    "Return straight away if the status is not retryable, or if this was the last attempt.",
    "The doubling delay is `500 * 2 ** (attempt - 1)`: 500, 1000, 2000…",
    "Header values are text: `Number(\"3\") * 1000` gives 3000.",
  ],
};

const exReadReply: CodeExercise = {
  id: "m5-read-model-reply",
  title: "Read the reply, the tokens and the cost",
  brief:
    "Two real-shaped replies are defined at the top (one shaped like Anthropic's Messages API, one like OpenAI's Responses API). Do not delete them. Fix `extractText(provider, data)` so it joins the text of **every** text part: for `\"anthropic\"`, every item in `data.content` with `type === \"text\"`; for `\"openai\"`, every `content` item with `type === \"output_text\"` inside every `data.output` item with `type === \"message\"`. Fix `readUsage(data)` to return `{ input, output }` from `data.usage.input_tokens` and `data.usage.output_tokens`. Fix `costUSD(usage, price)`: prices are in USD **per million** tokens.",
  starter: `// Example replies (shapes from the providers' documentation; values made up)
const ANTHROPIC_SAMPLE = {
  id: "msg_01", type: "message", role: "assistant", model: "example-model",
  content: [
    { type: "text", text: "Webale! " },
    { type: "text", text: "Rice is in stock." },
  ],
  stop_reason: "end_turn",
  usage: { input_tokens: 2095, output_tokens: 503 },
};
const OPENAI_SAMPLE = {
  id: "resp_01", object: "response", status: "completed", model: "example-model",
  output: [
    { type: "reasoning", id: "rs_01", summary: [] },
    { type: "message", role: "assistant", content: [
      { type: "output_text", text: "Webale! Rice is in stock.", annotations: [] },
    ] },
  ],
  usage: { input_tokens: 75, output_tokens: 1186, total_tokens: 1261 },
};

function extractText(provider, data) {
  if (provider === "anthropic") return data.content[0].text;   // only the first part?
  return data.output[0].content[0].text;                         // is output[0] always the message?
}

function readUsage(data) {
  return data.usage;   // should be { input, output }
}

function costUSD(usage, price) {
  // price = { inputPerMTok, outputPerMTok } in USD per MILLION tokens
  return usage.input * price.inputPerMTok + usage.output * price.outputPerMTok;
}
`,
  solution: `const ANTHROPIC_SAMPLE = {
  id: "msg_01", type: "message", role: "assistant", model: "example-model",
  content: [
    { type: "text", text: "Webale! " },
    { type: "text", text: "Rice is in stock." },
  ],
  stop_reason: "end_turn",
  usage: { input_tokens: 2095, output_tokens: 503 },
};
const OPENAI_SAMPLE = {
  id: "resp_01", object: "response", status: "completed", model: "example-model",
  output: [
    { type: "reasoning", id: "rs_01", summary: [] },
    { type: "message", role: "assistant", content: [
      { type: "output_text", text: "Webale! Rice is in stock.", annotations: [] },
    ] },
  ],
  usage: { input_tokens: 75, output_tokens: 1186, total_tokens: 1261 },
};

function extractText(provider, data) {
  if (provider === "anthropic") {
    return data.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  }
  let text = "";
  for (const item of data.output) {
    if (item.type !== "message") continue;
    for (const part of item.content) {
      if (part.type === "output_text") text += part.text;
    }
  }
  return text;
}

function readUsage(data) {
  return { input: data.usage.input_tokens, output: data.usage.output_tokens };
}

function costUSD(usage, price) {
  return (usage.input / 1_000_000) * price.inputPerMTok
       + (usage.output / 1_000_000) * price.outputPerMTok;
}
`,
  tests: [
    { name: "Anthropic: joins every text block", expr: `extractText("anthropic", ANTHROPIC_SAMPLE)`, expected: "Webale! Rice is in stock." },
    { name: "OpenAI: skips the reasoning item and finds the message", expr: `extractText("openai", OPENAI_SAMPLE)`, expected: "Webale! Rice is in stock." },
    { name: "reads usage (Anthropic)", expr: `readUsage(ANTHROPIC_SAMPLE)`, expected: { input: 2095, output: 503 } },
    { name: "reads usage (OpenAI)", expr: `readUsage(OPENAI_SAMPLE)`, expected: { input: 75, output: 1186 } },
    { name: "cost uses price per MILLION tokens", expr: `Math.round(costUSD({ input: 2000, output: 500 }, { inputPerMTok: 3, outputPerMTok: 15 }) * 1e6) / 1e6`, expected: 0.0135 },
    { name: "cost of the Anthropic sample at $1 / $5", expr: `Math.round(costUSD(readUsage(ANTHROPIC_SAMPLE), { inputPerMTok: 1, outputPerMTok: 5 }) * 1e6) / 1e6`, expected: 0.00461 },
  ],
  hints: [
    "For Anthropic: `data.content.filter(b => b.type === \"text\").map(b => b.text).join(\"\")`.",
    "For OpenAI: loop over `data.output`; skip items whose type is not \"message\"; inside, add the text of parts whose type is \"output_text\".",
    "2,000 tokens at $3 per million is 2000 / 1,000,000 × 3 = $0.006.",
  ],
};

/* ============================== LESSON 1 ============================== */

const l1: Lesson = {
  id: "m5-l1",
  moduleId: "m5",
  title: "What an API is",
  subtitle: "Endpoints, methods, requests, responses and JSON: how one program asks another for something.",
  minutes: 35,
  prerequisites: ["m4-l4", "m1-l3"],
  objectives: [
    "Explain what an API is, using the waiter analogy and then the real terms.",
    "Name the parts of an HTTP request (method, URL, headers, body) and of a response (status code, headers, body).",
    "Read a URL and point to its host, path and query parameters.",
    "Choose the right HTTP method for reading, creating, replacing and deleting.",
    "Build and fix a JSON request body.",
  ],
  glossary: ["api", "endpoint", "url", "http-method", "http-request", "http-response", "http-header", "query-parameter", "status-code", "json", "server", "simulation"],
  completion: [
    "Fix the two broken shop requests in the API Explorer (wrong method and broken JSON).",
    "Pass the “Build an order request” code exercise.",
    "Pass the knowledge check (you can retry).",
    "Explain what an API is in your own words.",
  ],
  tutor: {
    simpler:
      "An API is a fixed way for one program to ask another program for something. You send a request (what you want, written in an agreed format) to an address. The other program sends back a response: a number that says how it went, and some data.",
    altAnalogy:
      "Sending a mobile-money request by USSD: you dial an exact code (*165#), choose numbered options in a fixed order and type amounts in the right place. If you type something it does not expect, it says “Invalid input.” The menu is the API; your key presses are the request; the confirmation SMS is the response.",
    misconceptions: [
      "“An API is a website.” A website is made for people to look at. An API is made for programs: it sends back data (usually JSON), not a page to look at.",
      "“The API is the database.” The API stands in front of the server's data and decides what you may ask for. You never touch the database directly.",
      "“JSON and a JavaScript object are the same thing.” JSON is text. You must `JSON.parse` it to get an object, and `JSON.stringify` an object to send it.",
      "“The server will understand roughly what I meant.” APIs are strict. One wrong field name or a trailing comma gets a 400 error.",
    ],
    probingQuestions: [
      "In the waiter story, what plays the role of the menu? What is the real-world version for an API?",
      "Why does reading the product list use GET, while placing an order uses POST?",
      "Look at the Raw HTTP view. Which line tells the server which endpoint you want?",
      "The server replied 405. Which response header tells you how to fix it?",
    ],
    revisit: ["m1-l2", "m1-l3"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Two programs that need to talk",
      blocks: [
        { type: "p", text: "Mama Achen's nephew Brian is building two things for her shop near Nakawa market: a small website where customers can see prices, and a WhatsApp helper that answers questions. Both need the same information: today's prices and how much is in stock. That information lives in one place, the shop's program on a computer in the back office." },
        { type: "p", text: "Later, Brian also wants the WhatsApp helper to use an AI model to write polite replies. That model does not run on his laptop. It runs on a company's computers in another country." },
        { type: "p", text: "So Brian's code must **ask another program, on another computer, for something**, and get a clear answer back. How?" },
        { type: "list", items: [
          "Copy the shop's whole database into every app? Then the copies go out of date the moment rice is sold.",
          "Let every app reach into the database directly? Then any bug could delete the stock book, and anyone with access could change prices.",
          "Write the request in ordinary sentences? Programs cannot reliably guess what “send me rice prices, the big bags” means.",
        ] },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How can one program ask another program for something in a precise, safe, agreed way, and get a precise answer back?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "The waiter and the kitchen",
      blocks: [
        { type: "p", text: "Think of a restaurant on Kampala Road. You do not walk into the kitchen and cook. You read the **menu**, tell the **waiter** your order in a way the kitchen understands (“Table 4: two chicken stew, one with no onions”), and the waiter carries it to the kitchen. The kitchen does the work. The waiter brings back your plate, or comes back to say “Sorry, the fish is finished.”" },
        { type: "steps", items: [
          { title: "The menu lists what you can order.", text: "You cannot order something that is not on it, and each dish has a fixed name." },
          { title: "The waiter carries a structured order.", text: "The order slip has a fixed shape: table number, dish, quantity, special notes. The kitchen reads the slip, not your face." },
          { title: "The kitchen does the work out of sight.", text: "You never see the stove or the store room. You only see what comes back." },
          { title: "The waiter brings back a response.", text: "Either the food you asked for, or a clear message about what went wrong." },
        ] },
        { type: "analogyMap", title: "From the restaurant to software", pairs: [
          { everyday: "The menu (what you may order, and how)", technical: "The API documentation: the list of [[endpoint|endpoints]] and the exact fields each one accepts" },
          { everyday: "The waiter", technical: "The [[api|API]]: the agreed doorway between your program and the other program" },
          { everyday: "Your order slip: “Table 4, 2 × chicken stew”", technical: "A [[http-request|request]]: a [[http-method|method]], an address (URL), [[http-header|headers]] and a body of data" },
          { everyday: "The kitchen", technical: "The [[server|server]]: the other program and its data, which you never touch directly" },
          { everyday: "The plate, or “Sorry, the fish is finished”", technical: "A [[http-response|response]]: a [[status-code|status code]] plus data, usually [[json|JSON]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A human waiter can understand a vague order and ask what you meant. An API cannot. If a field is misspelt, a number is written as text, or a comma is in the wrong place, the API rejects the whole request with an error. Also, an API answers thousands of “customers” at once, in milliseconds, and never gets tired." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Build a request and send it",
      blocks: [
        { type: "p", text: "This is a request builder for a **simulated** version of Mama Achen's shop API (and a mock model provider you will use in Lesson 4). Try this:" },
        { type: "list", ordered: true, items: [
          "Press **Send request** with the example already loaded (“List products”). Look at the status (200), the timing and the JSON body.",
          "Open **Inspect the request → Raw HTTP**. This is the actual text that would travel to the server. Find the method, the path and the query.",
          "Change the `limit` value to `abc` and send again. What status do you get? Read the explanation.",
          "Click the **One product** example, change `rice-25` in the path to `caviar` and send. Read the 404.",
          "Click **Place an order** and send. Look at the `201`, the new order's `id`, and the `location` response header.",
          "Open the **fetch** and **curl** views: the same request, written as JavaScript and as a terminal command.",
        ] },
        { type: "lab", lab: "api-explorer", props: { challenges: [], start: "list-products" }, caption: "Everything here runs in your browser. The hosts end in .example, a name reserved for examples, so they can never be real servers." },
        { type: "callout", tone: "sim", text: "The shop server and the model provider in this lab are small programs running inside your own browser. They behave the way real APIs behave (methods, status codes, headers, JSON, rate limits), but no request ever leaves your device and the keys only work here." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "How it really works",
      blocks: [
        { type: "p", text: "An [[api|API]] (Application Programming Interface) is a set of rules for how one program can ask another for something. Most APIs you will use as an AI engineer are **web APIs**: they work over HTTP, the same system your browser uses to load web pages, and they send data as JSON." },
        { type: "p", text: "Each thing an API can do lives at its own address, called an [[endpoint|endpoint]]. An address is a [[url|URL]], and every URL has the same parts:" },
        { type: "code", lang: "text", code: `https://api.mama-achen.example/v1/products?category=grains&limit=3
└─┬──┘   └─────────┬──────────┘└────┬────┘ └───────────┬──────────┘
scheme            host              path       query parameters`, caption: "The parts of a URL" },
        { type: "list", items: [
          "**Scheme** `https://`: use HTTPS, which encrypts the conversation so people on the network cannot read it.",
          "**Host** `api.mama-achen.example`: which server to talk to.",
          "**Path** `/v1/products`: which endpoint on that server. The `v1` means version 1 of the API, so the shop can change things later without breaking old apps.",
          "[[query-parameter|Query parameters]] `?category=grains&limit=3`: optional settings, written `name=value` and joined with `&`.",
        ] },
        { type: "p", text: "A [[http-request|request]] has four parts: a **method**, the **URL**, **headers** and (sometimes) a **body**. The [[http-method|method]] says what kind of action you want:" },
        { type: "table", caption: "The common HTTP methods", head: ["Method", "Means", "Shop example", "Has a body?"], rows: [
          ["GET", "Read something. Changes nothing.", "GET /v1/products", "No"],
          ["POST", "Create something new.", "POST /v1/orders", "Yes"],
          ["PUT", "Replace something completely.", "PUT /v1/products/rice-25", "Yes"],
          ["PATCH", "Change part of something.", "PATCH /v1/orders/ord_1041", "Yes"],
          ["DELETE", "Remove (or cancel) something.", "DELETE /v1/orders/ord_1041", "Usually no"],
        ] },
        { type: "p", text: "[[http-header|Headers]] are extra lines of information about the request, written `Name: value`. Two you will use all the time: `Content-Type: application/json` (“my body is JSON”) and `Authorization: Bearer <key>` (“here is my key”; Lesson 2 is all about this). The **body** is the data you send, usually a [[json|JSON payload]]." },
        { type: "p", text: "Here is a complete request as it is written on the wire. Notice the blank line between the headers and the body:" },
        { type: "code", lang: "http", code: `POST /v1/orders HTTP/1.1
Host: api.mama-achen.example
Content-Type: application/json
Authorization: Bearer shop_sk_sim_7Kq2vX9mLp4R
Content-Length: 80

{"customer":"Okello","items":[{"productId":"rice-25","quantity":2}],"delivery":true}`, caption: "An HTTP request: request line, headers, blank line, body" },
        { type: "p", text: "The server sends back a [[http-response|response]] with the same shape: a [[status-code|status code]] (a three-digit number that says how it went), headers, and a body." },
        { type: "code", lang: "http", code: `HTTP/1.1 201 Created
Content-Type: application/json
Location: /v1/orders/ord_1041

{"id":"ord_1041","customer":"Okello","totalUGX":225000,"currency":"UGX","status":"pending"}`, caption: "The response: status line, headers, blank line, body" },
        { type: "table", caption: "Status codes come in families", head: ["Range", "Meaning", "Examples"], rows: [
          ["2xx", "Success", "200 OK, 201 Created, 204 No Content"],
          ["3xx", "Look somewhere else (redirects)", "301 Moved Permanently"],
          ["4xx", "Your request has a problem", "400 Bad Request, 401 Unauthorized, 404 Not Found, 405 Method Not Allowed"],
          ["5xx", "The server has a problem", "500 Internal Server Error, 503 Service Unavailable"],
        ] },
        { type: "p", text: "Lesson 3 looks at the error codes in detail. For now, remember: **4xx means change your request; 5xx means the server is having trouble.**" },
        { type: "callout", tone: "misconception", text: "“JSON is a JavaScript object.” JSON is **text** that looks like a JavaScript object, with stricter rules: property names in double quotes, strings in double quotes, no trailing commas, no comments. Before sending, turn an object into JSON text with `JSON.stringify(obj)`. When text comes back, turn it into an object with `JSON.parse(text)` (or `await response.json()`)." },
      ],
    },
    {
      kind: "example",
      mode: "understand",
      title: "Real code: reading products and placing an order",
      blocks: [
        { type: "p", text: "This is real JavaScript using `fetch`, the function built into browsers and Node.js (version 18 and later) for sending HTTP requests. The address is the simulated shop, so it will only work inside the lab, but swap in a real API's address and the same code works." },
        { type: "code", lang: "js", code: `const SHOP = "https://api.mama-achen.example";

// 1. Read: GET with query parameters. No body.
const listRes = await fetch(SHOP + "/v1/products?category=grains&limit=3");
const list = await listRes.json();
console.log(listRes.status, list.count);   // 200 3

// 2. Create: POST with a JSON body.
const orderRes = await fetch(SHOP + "/v1/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": \`Bearer \${process.env.SHOP_API_KEY}\`,
  },
  body: JSON.stringify({
    customer: "Okello",
    items: [{ productId: "rice-25", quantity: 2 }],
    delivery: true,
  }),
});

if (orderRes.status === 201) {
  const order = await orderRes.json();
  console.log("Created", order.id, "total UGX", order.totalUGX);
} else {
  console.log("Failed:", orderRes.status, await orderRes.text());
}`, notes: [
          { line: 4, text: "With no options, fetch sends a GET request. `await` waits for the reply to arrive." },
          { line: 5, text: "`.json()` reads the response body and parses the JSON text into an object." },
          { line: 10, text: "To create something, choose the POST method." },
          { line: 12, text: "Tell the server the body is JSON." },
          { line: 13, text: "The key is read from an environment variable, never typed into code. This code belongs on a server (Lesson 2)." },
          { line: 15, text: "`JSON.stringify` turns the object into JSON text. The body must be text." },
          { line: 22, text: "Always check the status before trusting the body." },
        ] },
        { type: "callout", tone: "tip", text: "In the lab, build any request and open the **fetch** view: it writes this kind of code for you, and replaces the key with `process.env.…` automatically." },
      ],
    },
    {
      kind: "challenge",
      mode: "experiment",
      title: "Fix two broken requests, then build one in code",
      blocks: [
        { type: "p", text: "Two requests to the shop are broken. Click each challenge to load it, send it, read the error and the explanation, fix the request and send again. The first one needs a look at the `allow` response header. The second has **two** separate problems in its body." },
        { type: "lab", lab: "api-explorer", props: { challenges: ["wrong-method", "bad-json"] }, required: true, caption: "Complete when both requests return 201 Created." },
        { type: "p", text: "Now do the same thing in code. Build the request object yourself (nothing is sent), then read a reply." },
        { type: "exercise", exercise: exOrderRequest, required: true },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "Almost-JSON and other near misses",
      blocks: [
        { type: "p", text: "The most common first API bug is a body that **looks** like JSON but is not. These are all invalid:" },
        { type: "code", lang: "text", code: `{ customer: "Okello" }            ✗ property name not in double quotes
{ 'customer': 'Okello' }          ✗ single quotes
{ "customer": "Okello", }         ✗ comma after the last item
{ "quantity": "two" }             ✓ valid JSON, but ✗ the shop wants a number: 2` },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "A **400 Bad Request** whose message mentions JSON, “unexpected token”, a field name, or a type. The server is telling you exactly what is wrong; read the message before changing anything." },
        { type: "list", items: [
          "**Fix broken JSON:** build the body with `JSON.stringify(object)` instead of typing JSON by hand. It always produces valid JSON.",
          "**Fix wrong types:** check the API documentation for each field. `2` (a number) and `\"2\"` (text) are different.",
          "**Missing content type:** without `Content-Type: application/json`, some servers refuse the body (this shop replies 415). Always send it with a JSON body.",
          "**A body on a GET request:** `fetch` refuses to send one (it throws a TypeError). Put options for a GET in query parameters instead.",
          "**Reading an error page as JSON:** if the server returns HTML (for example a proxy's error page), `.json()` throws. Check `response.ok` or the status first.",
        ] },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "analogy",
            prompt: "In the restaurant analogy, what is the **API documentation**?",
            options: [
              { text: "The kitchen", why: "The kitchen is the server: it does the work, out of sight." },
              { text: "The menu", why: "Yes. It lists what you can ask for and exactly how to ask." },
              { text: "The plate of food", why: "The plate is the response." },
              { text: "The waiter", why: "The waiter is the API itself: the doorway that carries requests and responses." },
            ],
            answer: 1,
            hint: "Which part tells you what you are allowed to order?",
          },
          {
            id: "q2", type: "mcq", flavour: "recall",
            prompt: "Brian wants to **cancel** order `ord_1041`. Which request fits best?",
            options: [
              { text: "GET /v1/orders/ord_1041", why: "GET only reads. It must never change anything." },
              { text: "POST /v1/orders", why: "POST to /v1/orders creates a new order." },
              { text: "DELETE /v1/orders/ord_1041", why: "Correct: DELETE on the specific order's endpoint." },
              { text: "PUT /v1/products/ord_1041", why: "Wrong method and wrong endpoint: that path is for products." },
            ],
            answer: 2,
            hint: "Which method removes something? Which path points at one specific order?",
          },
          {
            id: "q3", type: "mcq", flavour: "predict",
            prompt: "What will the shop reply to this body?",
            code: `POST /v1/orders
Content-Type: application/json

{ "customer": "Nakato", "items": [ { "productId": "sugar-1", "quantity": 2 } ], }`,
            options: [
              { text: "201 Created", why: "Look closely at the end of the body." },
              { text: "400 Bad Request, because there is a comma after the last item", why: "Correct. JSON does not allow a trailing comma, so the body cannot even be read." },
              { text: "404 Not Found", why: "The endpoint exists. The problem is in the body." },
              { text: "500 Internal Server Error", why: "5xx means the server failed. Here the request itself is wrong, so it is a 4xx." },
            ],
            answer: 1,
            hint: "What comes just before the final `}`?",
          },
          {
            id: "q4", type: "multi", flavour: "recall",
            prompt: "Which of these are parts of an HTTP **request**? Select all that apply.",
            options: [
              { text: "The method (GET, POST…)", why: "Yes: it says what kind of action you want." },
              { text: "The URL", why: "Yes: which server and which endpoint." },
              { text: "Headers", why: "Yes: extra information such as Content-Type and Authorization." },
              { text: "The status code", why: "No. The status code is part of the response, chosen by the server." },
              { text: "A body (for methods like POST)", why: "Yes: the data you send." },
            ],
            answers: [0, 1, 2, 4],
            hint: "Which item does the server decide, not you?",
          },
          {
            id: "q5", type: "order",
            prompt: "Put the life of one API call in order.",
            items: [
              "Your code builds the request: method, URL, headers, JSON body",
              "The request travels to the server over HTTPS",
              "The server checks the request and does the work",
              "The server sends a response: status code, headers, body",
              "Your code checks the status, then parses the JSON body",
            ],
            hint: "Start with your code and end with your code.",
            explanation: "Build → send → server works → response → check the status, then read the body. Never read the body before checking the status.",
          },
          {
            id: "q6", type: "short",
            prompt: "In the URL `https://api.mama-achen.example/v1/products?category=grains&limit=3`, name the host, the path and the query parameters.",
            modelAnswer: "Host: api.mama-achen.example. Path: /v1/products. Query parameters: category=grains and limit=3.",
            checklist: ["Host is api.mama-achen.example", "Path is /v1/products", "Two query parameters: category=grains and limit=3"],
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Your friend runs a hardware shop in Mbale and asks: “My cousin says his app ‘talks to an API’. What does that even mean?” Explain what an API is, what a request contains, and what comes back. Use an everyday example if it helps.",
          rubric: [
            { concept: "An API is an agreed way for one program to ask another for something", keywords: ["program", "software", "agreed", "rules", "another computer", "server", "ask"], hint: "Say who is talking to whom." },
            { concept: "A request has a method, an address/endpoint, and data", keywords: ["request", "method", "get", "post", "endpoint", "url", "address", "body"], hint: "What does your program send?" },
            { concept: "The response has a status code and data", keywords: ["response", "status", "200", "404", "code", "reply", "answer"], hint: "What comes back, and how do you know if it worked?" },
            { concept: "Data is sent in a strict format such as JSON", keywords: ["json", "format", "structured", "strict", "exact"], hint: "How must the data be written?" },
          ],
          exemplar: "An API is like the waiter in a restaurant: an agreed way for one program to ask another program, usually on another computer, for something. Your cousin's app sends a request to an address called an endpoint. The request says what kind of action it wants (GET to read, POST to create), and may carry data written in a strict format called JSON. The other program, the server, does the work and sends back a response: a status code like 200 for success or 404 for “not found”, plus data. The app never goes into the server's database itself; it can only ask through the API, and only in the exact format the API expects.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "An **API** is an agreed doorway between programs. Your code sends a **request**: a **method** (GET, POST, PUT, PATCH, DELETE), a **URL** (host, path, query), **headers**, and often a **JSON body**. The server sends back a **response**: a **status code** (2xx success, 4xx your problem, 5xx server problem), headers and a body. APIs are strict: valid JSON and correct field names and types, or a 400.",
          canNow: [
            "Read a URL and name its host, path and query parameters.",
            "Choose the right method for reading, creating, replacing and deleting.",
            "Build a request with headers and a JSON body, and read the status and body of the response.",
            "Recognise and fix invalid JSON and a wrong method.",
          ],
          next: "Next: the `Authorization` header. What is an API key, why must it never appear in browser code, and where should it live instead?",
        },
      ],
    },
  ],
};

/* ============================== LESSON 2 ============================== */

const l2: Lesson = {
  id: "m5-l2",
  moduleId: "m5",
  title: "Keys and secrets",
  subtitle: "Authentication, environment variables, and why every call with a key must go through your server.",
  minutes: 35,
  prerequisites: ["m5-l1"],
  objectives: [
    "Explain what an API key is and the difference between authentication and authorization.",
    "Explain why anything in browser (client-side) code is visible to every visitor.",
    "Keep a key in an environment variable on the server and read it with `process.env`.",
    "Keep `.env` files out of Git with `.gitignore`, and know what to do if a key leaks.",
  ],
  glossary: ["api-key", "authentication", "authorization", "secret", "environment-variable", "client-side", "server-side", "gitignore", "git"],
  completion: [
    "Complete the key-exposure challenge (move the key, fix .gitignore, handle the leak).",
    "Fix the model request that gets 401 in the API Explorer.",
    "Pass the “Read a key from the environment” code exercise.",
    "Pass the knowledge check and submit the teach-back.",
  ],
  tutor: {
    simpler:
      "An API key is like a password for your program. Whoever has it can use the service and you pay. Browser code is sent to every visitor, so a key in browser code is a key given to everyone. Keep the key on your server, in an environment variable, and let the browser ask your server instead.",
    altAnalogy:
      "Your mobile money PIN. You would never write it on a poster in the shop window (browser code). You keep it in your head (the server's environment). If you think someone saw it, you change it at once (rotate the key). The agent checks the PIN (authentication) and then checks if your balance allows the withdrawal (authorization).",
    misconceptions: [
      "“My code is minified, so nobody can read the key.” Minifying only shortens names. The key is still plain text in the file, and DevTools shows it in the request headers anyway.",
      "“HTTPS hides the key.” HTTPS hides it from people on the network, not from the person whose browser is sending the request.",
      "“NEXT_PUBLIC_ variables are secret because they are in .env.local.” The NEXT_PUBLIC_ prefix tells Next.js to copy the value into the browser's JavaScript.",
      "“If I delete the key from my code and push again, the leak is fixed.” Git history still contains it. Revoke the key and create a new one.",
    ],
    probingQuestions: [
      "In version A of the lab, where exactly can a visitor see the key? Name two places.",
      "In version B, the attacker can still call /api/ask. What should your route do about that?",
      "What is the difference between a 401 and a 403?",
      "Why is `.env.example` committed, but `.env.local` is not?",
    ],
    revisit: ["m5-l1"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Who is calling, and who pays?",
      blocks: [
        { type: "p", text: "An API on the internet can be reached by anyone in the world. So the shop's API and the AI model provider both need to know **who is calling**: to decide what they may do, to stop strangers changing orders, and to know whom to bill. A model provider charges for every call." },
        { type: "p", text: "The usual answer is an **API key**: a long secret string the provider gives you, which your code sends with every request. That solves one problem and creates another: **where do you keep the key** so that your code can use it, but nobody else can?" },
        { type: "p", text: "Brian's first idea is to paste the key at the top of his website's JavaScript. It works perfectly. That is exactly what makes it dangerous: the mistake gives no warning until the bill arrives." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How do you prove to an API who you are, and where must the proof live so that it cannot be stolen?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "The store-room key and the shop window",
      blocks: [
        { type: "p", text: "Mama Achen's store room has one key. Whoever holds a copy can walk in and take sacks of rice, and the supplier will bill **her** for whatever goes missing. She keeps the key in the back office, never in the shop window, where every passer-by can see everything on display." },
        { type: "analogyMap", title: "From the shop to software", pairs: [
          { everyday: "The store-room key", technical: "An [[api-key|API key]]: a [[secret|secret]] string that proves your program may use the service" },
          { everyday: "The guard checking that the key is genuine", technical: "[[authentication|Authentication]]: is this a valid key? (fails with **401**)" },
          { everyday: "The guard checking whether this key opens this particular room", technical: "[[authorization|Authorization]]: is this key allowed to do this? (fails with **403**)" },
          { everyday: "The shop window: everything on display is seen by everyone", technical: "[[client-side|Client-side]] (browser) code: sent to and readable by every visitor" },
          { everyday: "The back office, where only staff go", technical: "[[server-side|Server-side]] code: runs on your server; visitors only see what it chooses to send back" },
          { everyday: "The key kept in the back-office safe", technical: "An [[environment-variable|environment variable]] such as `MODEL_API_KEY`, set on the server" },
          { everyday: "Changing the lock after a copy goes missing", technical: "Revoking (rotating) the key in the provider's dashboard" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "If someone steals a physical key, the key is missing and you notice. Copying a digital key leaves your copy exactly where it was. Nothing looks wrong until strange charges appear. That is why you must assume a key is stolen the moment it has been anywhere public, even for a minute." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Watch a key leak, then fix it",
      blocks: [
        { type: "p", text: "On the left, the key is written in the browser code. Open the simulated **DevTools** (the panel every browser has when you press F12) and look in **Network** and **Sources**. Then press **Play the bad actor**. On the right, the same app keeps the key on the server. Try the bad actor there too." },
        { type: "p", text: "Then complete the challenge at the bottom: move the key, choose what the browser should call, set up `.gitignore`, and decide what to do about a leak." },
        { type: "lab", lab: "key-exposure", required: true, caption: "Complete when all four steps of the fix are correct." },
        { type: "callout", tone: "sim", text: "The browser, the server, the DevTools panel and the attacker are all simulated, and the key is fake. The charges are **illustrative**: realistic, but made up. Real costs depend on the provider, the model and your spend limits." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "How it really works",
      blocks: [
        { type: "p", text: "An [[api-key|API key]] is a long random string, such as `sk-…`, created in the provider's dashboard. Your code sends it with each request, most often in this header:" },
        { type: "code", lang: "http", code: `Authorization: Bearer <your key>` },
        { type: "p", text: "“Bearer” means “whoever bears (carries) this key”. The server does not know **who** is holding it, only that the key is valid. Some providers use a different header name; always follow the provider's documentation." },
        { type: "p", text: "The server then does two checks:" },
        { type: "table", head: ["Check", "Question", "Fails with"], rows: [
          ["[[authentication|Authentication]]", "Is this a real, valid key?", "401 Unauthorized (missing, malformed, wrong or revoked key)"],
          ["[[authorization|Authorization]]", "Is this key allowed to do this action?", "403 Forbidden (for example, a read-only key trying to create an order)"],
        ] },
        { type: "callout", tone: "info", text: "Yes, the name is confusing: “401 Unauthorized” actually means **not authenticated**. 403 is the one about permission." },
        { type: "p", text: "**Why browser code can never keep a secret.** A website's [[client-side|client-side]] code (the JavaScript that runs in the visitor's browser) is downloaded to every visitor's device. They can read every file and every request in DevTools. HTTPS encrypts the conversation **on the network**, so a stranger on the same Wi-Fi cannot read it, but the visitor's own browser has to read the key in order to send it. So anything in browser code is public. No trick changes that: scrambling, splitting the key or hiding it in another file only slows down a curious person, never a determined one." },
        { type: "p", text: "**The secure pattern.** The browser calls **your own server** (for example `/api/ask`). Your [[server-side|server-side]] code adds the key and calls the provider. The key never leaves the server." },
        { type: "steps", items: [
          { title: "Store the key in an environment variable.", text: "An [[environment-variable|environment variable]] is a named value given to a program by the computer it runs on, outside the code. In Node.js you read it with `process.env.MODEL_API_KEY`. During development, Next.js loads variables from a file called `.env.local` in the project's root folder." },
          { title: "Read it only in server code.", text: "In Next.js, route handlers (files like `app/api/ask/route.ts`) run on the server. Variables without the `NEXT_PUBLIC_` prefix are only available on the server." },
          { title: "Never use NEXT_PUBLIC_ for a secret.", text: "Next.js copies (“inlines”) the value of every `NEXT_PUBLIC_` variable into the JavaScript sent to the browser. That prefix is for public settings only." },
          { title: "Keep .env files out of Git.", text: "List `.env.local` (Next.js recommends `.env*.local`) in `.gitignore`, the file that tells [[git|Git]] what never to save. Commit a `.env.example` with the variable names and empty values so teammates know what to set." },
          { title: "On a real host, set the variables in its dashboard.", text: "Hosting services have a settings page for environment variables. The key is typed there, never into your code. Module 18 covers deployment." },
        ] },
        { type: "callout", tone: "tip", title: "Make the damage small", text: "Even a server-side key can leak. Reduce the damage: give each key the **least** permission it needs (a read-only key if you only read), set a **monthly spend limit** in the provider's dashboard, use separate keys for development and production, and never print a key in logs (print a masked version like `sk-s…T8pR`)." },
        { type: "callout", tone: "info", title: "This app does exactly this", text: "Agent Academy has its own server route, `/api/model`. It reads `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` from the **server's** environment, and it is switched **off** unless whoever runs the server configures it. Your browser never sees a key. Lesson 4 shows how it works." },
      ],
    },
    {
      kind: "example",
      mode: "build",
      title: "Real code: the key on the server",
      blocks: [
        { type: "p", text: "These three files make the secure pattern in a Next.js app. They are real and complete for this purpose; Lesson 4 replaces the simulated provider address with a real one." },
        { type: "code", lang: "bash", code: `# .env.local  (project root, NEVER committed)
MODEL_API_KEY=paste-your-real-key-here
MODEL_ID=pick-a-current-model-from-the-provider-list

# .gitignore  (committed)
.env*.local
node_modules/

# .env.example  (committed: names only, no values)
MODEL_API_KEY=
MODEL_ID=`, notes: [
          { line: 2, text: "The real key. This file stays on your computer or server." },
          { line: 6, text: "This line stops Git from ever saving any .env.local file." },
          { line: 10, text: "An example file with empty values, so others know which variables to set." },
        ] },
        { type: "code", lang: "ts", code: `// app/api/ask/route.ts  (runs ONLY on the server)
export async function POST(request: Request) {
  const key = process.env.MODEL_API_KEY;
  if (!key) {
    return Response.json({ error: "Server is missing MODEL_API_KEY" }, { status: 500 });
  }

  const { question } = await request.json();
  if (typeof question !== "string" || question.length > 2000) {
    return Response.json({ error: "Send { question } as text, up to 2000 characters" }, { status: 400 });
  }

  const res = await fetch("https://api.model-provider.example/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${key}\`,
    },
    body: JSON.stringify({
      model: process.env.MODEL_ID,
      max_tokens: 300,
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    return Response.json({ error: "The model call failed" }, { status: 502 });
  }
  const data = await res.json();
  return Response.json({ answer: data.content[0].text });
}`, notes: [
          { line: 2, text: "A Next.js route handler: the function that runs when the browser sends POST /api/ask." },
          { line: 3, text: "Read the key from the server's environment. It is never written in the code." },
          { line: 5, text: "Fail clearly if the key is missing, rather than sending `Bearer undefined`." },
          { line: 9, text: "Check what the browser sent. Anyone can call this route, so never trust its input." },
          { line: 17, text: "The key is added here, on the server, at the last moment." },
          { line: 27, text: "Do not pass the provider's raw error (which might include details) back to the browser." },
          { line: 30, text: "Send back only what the browser needs: the answer." },
        ] },
        { type: "code", lang: "js", code: `// In the browser: no key anywhere
const res = await fetch("/api/ask", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: "Do you deliver to Ntinda?" }),
});
const { answer } = await res.json();`, caption: "Browser code calls your own route, not the provider" },
      ],
    },
    {
      kind: "challenge",
      mode: "build",
      title: "Send the right key, and read keys safely in code",
      blocks: [
        { type: "p", text: "First, in the API Explorer: the call to the model provider gets **401**. Look at the headers, open the **Keys** panel and fix it. Then try the shop's **read-only** key on “Place an order” and see a 403." },
        { type: "lab", lab: "api-explorer", props: { challenges: ["no-key"] }, required: true, caption: "Complete when the model endpoint returns 200 OK." },
        { type: "p", text: "Now write the helper functions a real server uses to read keys safely." },
        { type: "exercise", exercise: exSecrets, required: true },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "Five ways keys leak or break",
      blocks: [
        { type: "list", ordered: true, items: [
          "**Committed to Git.** Automated bots scan public repositories for keys continuously. **Fix:** revoke the key at the provider immediately, create a new one, keep it only in `.env.local` / the host's settings, and check your usage page. Deleting the line is not enough: Git history keeps it.",
          "**A NEXT_PUBLIC_ variable.** It looks hidden in `.env.local`, but Next.js copies it into the browser bundle. **Recognise it:** search your built JavaScript or DevTools Sources for the key's first few characters. **Fix:** rename it without the prefix and only use it in server code.",
          "**Printed in logs or error messages.** `console.log(headers)` writes the key into log files that many people can read. **Fix:** log a masked version only.",
          "**Shared in a screenshot or chat.** A photo of your screen or a WhatsApp message counts as public. **Fix:** treat it as leaked; rotate.",
          "**The variable is not set.** Your code sends `Authorization: Bearer undefined` and gets **401**. **Recognise it:** the 401 appears on a new computer or after deploying. **Fix:** check the variable name and spelling, set it in `.env.local` or the host's dashboard, and restart the dev server if you added it while it was running. Better: check for it at the start, as `requireEnv` does.",
        ] },
        { type: "callout", tone: "cost", text: "A leaked key can cost more than money: an attacker can use up your rate limit (so your real customers get errors), or get your account suspended for content they generated. Set a spend limit on every provider account before you write any code." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "A request with a **valid** shop key that is **read-only** tries to create an order. What should the server reply?",
            options: [
              { text: "401 Unauthorized", why: "401 means the key is missing or invalid. This key is valid." },
              { text: "403 Forbidden", why: "Correct. The server knows who you are (authenticated), but this key is not allowed to do this (authorization fails)." },
              { text: "404 Not Found", why: "The endpoint exists." },
              { text: "201 Created", why: "That would mean the read-only key was ignored. A serious bug." },
            ],
            answer: 1,
            hint: "Is the problem “who are you?” or “are you allowed?”",
          },
          {
            id: "q2", type: "mcq", flavour: "debug",
            prompt: "Brian moved his key to `.env.local` as `NEXT_PUBLIC_MODEL_API_KEY` and reads it in his page component. Is the key safe?",
            options: [
              { text: "Yes, .env.local is never committed to Git.", why: "Not committing it is good, but the NEXT_PUBLIC_ prefix makes Next.js copy the value into the browser's JavaScript." },
              { text: "No, the NEXT_PUBLIC_ prefix puts the value into the JavaScript sent to every visitor.", why: "Correct. Remove the prefix and read the key only in a server route." },
              { text: "Yes, because HTTPS encrypts it.", why: "HTTPS protects it on the network, not from the visitor's own browser." },
            ],
            answer: 1,
            hint: "What does the word PUBLIC in the name tell Next.js to do?",
          },
          {
            id: "q3", type: "multi", flavour: "design",
            prompt: "Brian's key was in a public GitHub repository for ten minutes. Which actions are needed? Select all that apply.",
            options: [
              { text: "Revoke the key in the provider's dashboard", why: "Yes. This makes every copy useless." },
              { text: "Create a new key and put it only in the server's environment", why: "Yes. The app needs a working key, kept properly this time." },
              { text: "Check the provider's usage page for calls he did not make", why: "Yes. Ten minutes is long enough for bots to find it." },
              { text: "Just delete the line and push again", why: "Not enough on its own: Git history still contains the key." },
            ],
            answers: [0, 1, 2],
            hint: "A key that was public even briefly must be treated as stolen.",
          },
          {
            id: "q4", type: "mcq", flavour: "predict",
            prompt: "In the secure version, a visitor opens DevTools and looks at the Network panel while asking a question. What do they see?",
            options: [
              { text: "A request to the model provider with the key in the Authorization header", why: "That is version A. In version B the browser never talks to the provider." },
              { text: "A request to /api/ask with the question, and no key", why: "Correct. The provider call happens on the server, so it never appears in the browser." },
              { text: "Nothing at all: server requests are invisible", why: "The browser's own request to /api/ask is visible. Only the server's request to the provider is not." },
            ],
            answer: 1,
            hint: "Which computer talks to the provider in version B?",
          },
          {
            id: "q5", type: "mcq", flavour: "analogy",
            prompt: "In the shop analogy, what is client-side (browser) code?",
            options: [
              { text: "The back office", why: "The back office is the server: only staff go there." },
              { text: "The shop window", why: "Yes. Everything in it can be seen by every passer-by." },
              { text: "The safe", why: "The safe is where secrets are kept: the server's environment variables." },
            ],
            answer: 1,
            hint: "Where can every passer-by see everything?",
          },
          {
            id: "q6", type: "short",
            prompt: "Why is `.env.example` committed to Git while `.env.local` is not?",
            modelAnswer: ".env.local contains the real secret values, so it must never be committed. .env.example only lists the variable names with empty values, so it is safe to commit, and it tells other developers which variables they need to set.",
            checklist: [".env.local holds real secrets", ".env.example has names but no values", "The example helps others set up the project"],
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "A classmate has built a homework-helper website and pasted their AI API key into the page's JavaScript “because it works”. Explain to them why this is dangerous and exactly how to fix it.",
          rubric: [
            { concept: "Browser code is visible to every visitor", keywords: ["browser", "devtools", "visible", "anyone can see", "everyone", "public", "view source", "client"], hint: "Who can read the page's JavaScript?" },
            { concept: "A stolen key lets others use the service at your cost", keywords: ["bill", "charge", "pay", "cost", "money", "use your key", "steal"], hint: "What happens after someone copies it?" },
            { concept: "Move the key to the server in an environment variable", keywords: ["server", "environment variable", "process.env", ".env", "route", "backend"], hint: "Where should the key live instead?" },
            { concept: "Keep .env out of Git and rotate a leaked key", keywords: ["gitignore", "git", "rotate", "revoke", "new key", "commit"], hint: "What about version control, and the key that already leaked?" },
          ],
          exemplar: "Everything in a web page's JavaScript is downloaded to every visitor's browser, so anyone can press F12 and read your key in the Sources or Network panel. With that key they can call the AI service as you, and you pay the bill. To fix it: create a server route, like /api/ask, that the page calls instead. Put the key in an environment variable such as MODEL_API_KEY in .env.local, and read it with process.env only in that server route; don't use the NEXT_PUBLIC_ prefix. Add .env*.local to .gitignore so it is never committed. Because the old key was already public, revoke it in the provider's dashboard, create a new one, and set a spend limit.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "An **API key** proves to a service that your program may use it, and the bill follows the key. **Authentication** asks “is this a valid key?” (401); **authorization** asks “may this key do this?” (403). **Browser code is public**, so keys live in **environment variables on the server**, read with `process.env`, never with a `NEXT_PUBLIC_` prefix. `.env.local` goes in `.gitignore`. A leaked key is revoked and replaced, not just deleted.",
          canNow: [
            "Explain why a key in browser code is a key given to everyone.",
            "Build the secure pattern: browser → your server route → provider.",
            "Read a key safely from the environment and mask it in logs.",
            "Set up .gitignore and .env.example, and respond correctly to a leak.",
          ],
          next: "Next: what to do when an API says no. Status codes, rate limits, timeouts, and retrying without making things worse.",
        },
      ],
    },
  ],
};

/* ============================== LESSON 3 ============================== */

const l3: Lesson = {
  id: "m5-l3",
  moduleId: "m5",
  title: "When APIs say no",
  subtitle: "Status codes, rate limits, timeouts, and retrying with backoff without making things worse.",
  minutes: 40,
  prerequisites: ["m5-l1", "m5-l2"],
  objectives: [
    "Read common error status codes (400, 401, 403, 404, 429, 500, 503, 504) and say whose problem each one is.",
    "Decide which errors are worth retrying and which need the request fixed.",
    "Explain rate limits and the Retry-After header.",
    "Set a timeout on a request, and retry with exponential backoff and a maximum number of attempts.",
    "Explain why retrying a request that changes data can cause duplicates.",
  ],
  glossary: ["status-code", "rate-limit", "timeout", "retry", "backoff", "idempotency"],
  completion: [
    "In the API Explorer, hit a rate limit and recover, and get through a busy server using automatic retries.",
    "Pass the “Retry with exponential backoff” code exercise.",
    "Pass the knowledge check and submit the teach-back.",
  ],
  tutor: {
    simpler:
      "When a request fails, first ask: is it my fault or the server's? 4xx means your request is wrong; fix it, because sending it again will fail again. 429 and 5xx usually mean “not now”; wait and try again, waiting longer each time, and give up after a few tries. Never wait forever: set a timeout.",
    altAnalogy:
      "Calling a friend whose phone is busy. You do not redial every second all night (that is a retry storm). You wait a minute, then two, then four, and after a few tries you send an SMS instead. If the network says “the number you have dialled does not exist”, redialling will never help (a 4xx).",
    misconceptions: [
      "“If it fails, just try again.” Retrying a 400 or 401 wastes time and money: the same request will fail the same way.",
      "“A timeout means the server did nothing.” The server may have finished the work; only the reply did not reach you in time.",
      "“Retrying faster gets it done sooner.” Retrying fast against an overloaded server makes the overload worse, for you and everyone else.",
      "“401 means I don't have permission.” 401 means the key is missing or invalid. Permission problems are 403.",
    ],
    probingQuestions: [
      "You got a 429 with `retry-after: 4`. What exactly should your code do next?",
      "Why is a maximum number of attempts important?",
      "Your POST /v1/orders timed out. If you retry, what might happen? How could the shop's API protect you?",
      "In the lab, the “Broken” server keeps returning 500. Did retrying help? What should your code do then?",
    ],
    revisit: ["m5-l1"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Saturday evening rush",
      blocks: [
        { type: "p", text: "It is Saturday evening and Mama Achen's WhatsApp helper is busy. Brian's logs fill with problems:" },
        { type: "list", items: [
          "Some calls to the model provider come back **429 Too Many Requests**.",
          "For two minutes the provider replies **503**. Brian's code crashes, and customers get no reply at all.",
          "One request never comes back. The customer waits, and waits. Brian's code waits forever too.",
          "Brian adds “if it fails, try again immediately” and things get worse: his code now sends hundreds of requests a minute, gets blocked, and one customer's order is created **twice**.",
        ] },
        { type: "p", text: "Every API fails sometimes. Networks drop, servers get overloaded, and limits exist for good reasons. The question is not how to avoid failure, but how your code should react to each kind." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "When an API says no, how do you tell “fix your request” from “try again later”, and how do you try again without making things worse?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "The bank teller's answers",
      blocks: [
        { type: "p", text: "You queue at a bank in Kampala to withdraw money. The teller can answer in several ways, and each needs a different reaction from you:" },
        { type: "table", head: ["The teller says", "What you do", "API status"], rows: [
          ["“This form is filled in wrongly.”", "Fix the form. Handing it back unchanged will not help.", "400 Bad Request"],
          ["“I need to see your ID.” / “This ID is not valid.”", "Bring valid ID.", "401 Unauthorized"],
          ["“Your account cannot make withdrawals this large.”", "Ask for permission. Queuing again will not help.", "403 Forbidden"],
          ["“There is no account with that number.”", "Check the number.", "404 Not Found"],
          ["“One at a time, please. Come back in 5 minutes.”", "Wait 5 minutes, then come back.", "429 Too Many Requests + Retry-After"],
          ["“The system is down.”", "Come back later, waiting longer each time. Give up after a few visits.", "500 / 503"],
          ["(You have waited at the counter for an hour.)", "Leave. Do not wait forever.", "A timeout"],
        ] },
        { type: "analogyMap", pairs: [
          { everyday: "Fix the form before queuing again", technical: "Do not [[retry|retry]] 4xx errors (except 429): change the request" },
          { everyday: "“Come back in 5 minutes”", technical: "The `Retry-After` header on a 429 or 503" },
          { everyday: "Coming back after 1 hour, then 2, then 4", technical: "Exponential [[backoff|backoff]]" },
          { everyday: "Leaving after waiting too long at the counter", technical: "A [[timeout|timeout]]" },
          { everyday: "The bank's rule: one withdrawal request per customer per minute", technical: "A [[rate-limit|rate limit]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "If the bank's system goes down while you wait, the teller can usually tell you afterwards whether your money was paid out. With an API timeout you often **cannot know** whether the server did the work. Retrying might do it twice. Real APIs solve this with [[idempotency|idempotency keys]], which you will meet in Module 6." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Make it fail, on purpose",
      blocks: [
        { type: "p", text: "Load each challenge below. Then explore on your own using **Simulation controls**:" },
        { type: "list", items: [
          "**Rate limit:** press **Send 8 quickly**. The shop allows 5 requests per 10 seconds per caller. Open the response **Headers** and find `retry-after` and `x-ratelimit-remaining`. Wait that long and send once more.",
          "**Busy server:** with the condition “Busy”, send without retries (503, 503, then 200). Then turn on **Retry automatically with backoff** and watch the attempts and waits.",
          "**Broken server:** choose “Broken (500)” with retries on. Retrying a server that is truly broken does not help: the helper gives up after 4 attempts.",
          "**Very slow:** with a 10-second timeout, your code gives up and there is **no status code at all**. With 60 seconds, a gateway in front of the server gives up first and you get **504**.",
          "**Not retryable:** remove the Authorization header from a model request and send with retries on. The helper does **not** retry a 401.",
        ] },
        { type: "lab", lab: "api-explorer", props: { challenges: ["rate-limit", "busy-retry"] }, required: true, caption: "Complete when you have recovered from a 429 and got a 200 through automatic retries." },
        { type: "callout", tone: "sim", text: "The server conditions are switches in a simulator. Real servers do not announce that they are busy or broken in advance, which is exactly why your code must handle every case." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "How it really works",
      blocks: [
        { type: "table", caption: "Error status codes and what your code should do", head: ["Status", "Meaning", "Whose problem?", "Retry?"], rows: [
          ["400 Bad Request", "Invalid JSON, a missing field, a wrong type", "Your request", "No: fix it"],
          ["401 Unauthorized", "Key missing, malformed, wrong or revoked", "Your request", "No: fix the key"],
          ["403 Forbidden", "Valid key, but not allowed to do this", "Your request / account", "No"],
          ["404 Not Found", "Wrong path, id or model name", "Your request", "No"],
          ["405 Method Not Allowed", "Right path, wrong method (see the Allow header)", "Your request", "No"],
          ["409 Conflict", "Clashes with current state (here: not enough stock)", "Your request", "Only after changing it"],
          ["429 Too Many Requests", "Rate limit (or a quota or spend limit)", "Timing / account", "Yes, after Retry-After (but not for a spent quota)"],
          ["500 Internal Server Error", "Something broke inside the server", "The server", "Yes, a few times with backoff"],
          ["503 Service Unavailable", "Overloaded or briefly down", "The server", "Yes, with backoff"],
          ["504 Gateway Timeout", "A gateway gave up waiting for the server", "The server", "Yes, with backoff"],
        ] },
        { type: "p", text: "Good APIs also send a JSON **error body** explaining what went wrong. For example, Anthropic's documentation shows errors shaped like this, with a `request_id` to quote if you contact support:" },
        { type: "code", lang: "json", code: `{
  "type": "error",
  "error": {
    "type": "not_found_error",
    "message": "The requested resource could not be found."
  },
  "request_id": "req_011CSHoEeqs5C35K2UUqR7Fy"
}`, caption: "Example error body from Anthropic's errors documentation" },
        { type: "callout", tone: "info", title: "Providers differ", text: "Each provider has its own extras. Anthropic documents a **529 overloaded_error** for when its API is busy; OpenAI uses **503** for an overloaded model. Both document 429 for rate limits and quota or spend limits. Retrying a 429 caused by an empty balance or a spend cap will not help until it is fixed. Always read your provider's errors page." },
        { type: "p", text: "**Rate limits.** A [[rate-limit|rate limit]] caps how much one key can do in a period, to keep the service fair and stable. Model providers usually limit **requests per minute** and **tokens per minute**; Anthropic, for example, documents requests, input tokens and output tokens per minute. When you go over, you get **429**, often with a `retry-after` header saying how many seconds to wait. Many APIs also send headers showing your limit and what remains." },
        { type: "p", text: "**Timeouts.** A [[timeout|timeout]] is the longest your code will wait for a reply. Without one, a stuck request can hang your program forever. With `fetch`, pass a signal: `AbortSignal.timeout(30_000)` cancels the request after 30 seconds and makes `fetch` throw an error named `TimeoutError`. Note: a timeout means **no response arrived**; the server may still have done the work." },
        { type: "p", text: "**Retrying with backoff.** A [[retry|retry]] is worth it only for temporary failures (429, 5xx, timeouts, dropped connections). [[backoff|Exponential backoff]] means waiting longer after each failure: 0.5 s, 1 s, 2 s, 4 s… Three rules make it safe:" },
        { type: "list", ordered: true, items: [
          "**Obey the Retry-After header** when the server sends it.",
          "**Cap the attempts** (for example 3 to 5), then give up and report a clear error.",
          "**Add jitter**: a small random extra wait, so a thousand clients that failed at the same moment do not all retry at the same moment.",
        ] },
        { type: "callout", tone: "warn", title: "Retrying can do things twice", text: "Retrying a GET is harmless: reading twice changes nothing. Retrying a POST that **creates** something (an order, a payment, a message) after a timeout can create it twice, because the first attempt may have succeeded. Before retrying actions that change data, the API needs a way to recognise the repeat, such as an [[idempotency|idempotency key]]. Module 6 shows how." },
        { type: "callout", tone: "tip", text: "Official provider SDKs usually retry for you. Anthropic's documentation, for example, says its SDK retries connection errors, rate limits and 5xx errors with exponential backoff, twice by default, honouring `retry-after`. If you add your own retry loop around an SDK, remember that the two multiply." },
      ],
    },
    {
      kind: "example",
      mode: "build",
      title: "Real code: fetch with a timeout and retries",
      blocks: [
        { type: "p", text: "A small, complete helper you can use on a server (Node.js 18+). It retries only temporary failures, obeys Retry-After, backs off with jitter, and gives up after a few attempts." },
        { type: "code", lang: "js", code: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(status) {
  return status === 429 || status >= 500;
}

export async function fetchWithRetry(url, options = {}, { attempts = 4, baseMs = 500, timeoutMs = 30_000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let response;
    try {
      response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      // Timeout (TimeoutError) or network failure: no response at all.
      if (attempt === attempts) throw err;
      await sleep(baseMs * 2 ** (attempt - 1) * (1 + Math.random() * 0.5));
      continue;
    }

    if (!isRetryable(response.status) || attempt === attempts) return response;

    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = retryAfter > 0
      ? retryAfter * 1000
      : baseMs * 2 ** (attempt - 1) * (1 + Math.random() * 0.5);
    await sleep(waitMs);
  }
}`, notes: [
          { line: 4, text: "Only 429 and 5xx are worth retrying. Everything else is returned straight away." },
          { line: 11, text: "`AbortSignal.timeout` cancels the request if no reply arrives in time." },
          { line: 13, text: "fetch throws (instead of returning a status) when there is no response at all." },
          { line: 15, text: "Wait 0.5 s, 1 s, 2 s… plus up to 50% random jitter." },
          { line: 19, text: "Stop retrying after the last attempt and hand back the response so the caller can report it." },
          { line: 21, text: "Header values are text. `Number(null)` is 0, so a missing header falls back to backoff." },
        ] },
        { type: "callout", tone: "warn", text: "Use this for reads and for model calls that do not change anything outside. For requests that create or pay for something, add an idempotency key first (Module 6), or do not retry automatically." },
      ],
    },
    {
      kind: "challenge",
      mode: "build",
      title: "Write the retry loop yourself",
      blocks: [
        { type: "p", text: "Write `callWithRetry`. The tests give it fake servers (one that is busy, one that is broken, one that rate-limits, one that rejects your request) and a fake `sleep`, so nothing really waits." },
        { type: "exercise", exercise: exRetry, required: true },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "Retry storms and double orders",
      blocks: [
        { type: "p", text: "Brian's first fix was: `while (response.status !== 200) response = await fetch(...)`. Here is what went wrong, and why:" },
        { type: "list", ordered: true, items: [
          "**It retried a 400 forever.** One customer's message produced an invalid body. The loop sent the same broken request thousands of times. **Fix:** never retry 4xx errors except 429.",
          "**It retried with no wait.** Against a busy (503) server, instant retries made the overload worse and quickly hit the rate limit, so **all** customers got 429s. **Fix:** exponential backoff with jitter.",
          "**It had no limit.** During a long outage the loop never ended and requests piled up. **Fix:** a maximum number of attempts, then a clear message (“The assistant is busy; please try again in a few minutes”).",
          "**It created a double order.** A POST /v1/orders timed out, but the shop had actually created the order. The retry created a second one. **Fix:** do not blindly retry requests that change data; use idempotency keys (Module 6).",
        ] },
        { type: "callout", tone: "warn", title: "How to recognise a retry storm", text: "Your logs show the same request many times per second, your 429 count climbs, and costs rise while nothing succeeds. Check that your retry loop has a backoff, a maximum, and a list of retryable statuses." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "multi", flavour: "recall",
            prompt: "Which of these are usually worth retrying (with backoff)? Select all that apply.",
            options: [
              { text: "429 Too Many Requests", why: "Yes: wait Retry-After seconds, then retry. (Unless it is a spent quota or spend cap.)" },
              { text: "503 Service Unavailable", why: "Yes: the server is temporarily overloaded." },
              { text: "400 Bad Request", why: "No: the request is wrong. It will fail the same way again." },
              { text: "401 Unauthorized", why: "No: fix the key first." },
              { text: "A timeout with no response", why: "Yes, for safe requests: it may be a temporary network or server problem." },
            ],
            answers: [0, 1, 4],
            hint: "Is the problem in your request, or temporary?",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "Your code gets `429` with header `retry-after: 4`. What should it do?",
            options: [
              { text: "Retry immediately", why: "The server just told you to wait. Retrying now will get another 429." },
              { text: "Wait at least 4 seconds, then retry", why: "Correct. Obey Retry-After." },
              { text: "Give up and show an error", why: "Too early: a short wait usually fixes a rate limit." },
              { text: "Fix the JSON body", why: "The body is fine. The problem is how often you are sending." },
            ],
            answer: 1,
            hint: "The header is the server telling you something directly.",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "Brian's helper hangs forever on some requests. Nothing is logged. What is missing?",
            options: [
              { text: "A timeout on the request", why: "Correct. Without a timeout, a stuck request waits forever." },
              { text: "A bigger rate limit", why: "A rate limit would produce 429s, not silence." },
              { text: "An Authorization header", why: "A missing key gives a fast 401, not a hang." },
            ],
            answer: 0,
            hint: "What stops your code waiting forever?",
          },
          {
            id: "q4", type: "order",
            prompt: "With exponential backoff (base 0.5 s, no Retry-After, no jitter), put the waits in order.",
            items: ["0.5 seconds after the 1st failure", "1 second after the 2nd failure", "2 seconds after the 3rd failure", "Give up after the 4th failure"],
            hint: "Each wait doubles. The attempts are limited.",
            explanation: "The wait doubles each time (0.5, 1, 2…), and after the maximum number of attempts the code stops and reports an error.",
          },
          {
            id: "q5", type: "mcq", flavour: "design",
            prompt: "A POST that **creates an order** timed out. What is the safest next step?",
            options: [
              { text: "Retry immediately: timeouts are temporary", why: "The first attempt may have created the order. Retrying blindly could create a duplicate." },
              { text: "Check whether the order exists (or use an idempotency key) before trying again", why: "Correct. You cannot know whether the server did the work, so make the retry safe first." },
              { text: "Tell the customer the order failed", why: "It may actually have succeeded. Check first." },
            ],
            answer: 1,
            hint: "Does a timeout tell you whether the server did the work?",
          },
          {
            id: "q6", type: "short",
            prompt: "Explain the difference between a 4xx and a 5xx error, and how your code should react to each.",
            modelAnswer: "4xx means the problem is in my request (bad JSON, missing or wrong key, wrong path, no permission), so I must change the request; retrying it unchanged fails again. The exception is 429, where I wait and retry. 5xx means the server had a problem, so I can retry a few times with exponential backoff, then give up with a clear error.",
            checklist: ["4xx = my request is wrong, so fix it", "429 is the exception: wait and retry", "5xx = server problem: retry with backoff, limited attempts"],
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Brian asks: “My code just retries until it works. Why is that bad, and what should it do instead?” Explain in your own words.",
          rubric: [
            { concept: "Only retry temporary errors (429, 5xx, timeouts), not 4xx", keywords: ["4xx", "400", "401", "fix the request", "temporary", "429", "500", "503", "5xx"], hint: "Which errors will never succeed on retry?" },
            { concept: "Wait longer each time (exponential backoff), obey Retry-After", keywords: ["backoff", "wait longer", "double", "retry-after", "exponential", "wait"], hint: "How long should it wait between tries?" },
            { concept: "Limit the attempts and use a timeout", keywords: ["limit", "maximum", "max", "give up", "timeout", "few times"], hint: "When should it stop?" },
            { concept: "Retrying actions that change data can duplicate them", keywords: ["duplicate", "twice", "double", "idempot", "order", "post"], hint: "What happens if you retry creating an order?" },
          ],
          exemplar: "Retrying until it works is bad for three reasons. First, some errors never fix themselves: a 400 or 401 means your request or key is wrong, so you must fix it, not repeat it. Only 429, 5xx errors and timeouts are worth retrying. Second, retrying instantly against a busy server makes it busier and gets you rate-limited, so wait longer each time: half a second, one second, two seconds, and if the server sends Retry-After, wait exactly that long. Third, stop after a few attempts and show a clear message, and set a timeout so a stuck request cannot hang forever. Also be careful with requests that create things, like orders: if one timed out it may have worked, so a blind retry could create a duplicate.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "**4xx** means fix your request (400 bad body, 401 bad key, 403 not allowed, 404 wrong address). **429** means slow down: obey `Retry-After`. **5xx** means the server is struggling: retry with **exponential backoff**, jitter and a **maximum number of attempts**. Always set a **timeout**. A timeout tells you nothing about whether the work was done, so be careful retrying requests that change data.",
          canNow: [
            "Tell from a status code whether to fix the request or retry.",
            "Handle rate limits using Retry-After.",
            "Write a retry loop with exponential backoff, a maximum and a timeout.",
            "Explain why blind retries can cause duplicate orders.",
          ],
          next: "Next: put it all together and call a real AI model through your own server: the exact request shape, the response, the token usage and the cost.",
        },
      ],
    },
  ],
};

/* ============================== LESSON 4 ============================== */

const ANTHROPIC_ROUTE = `// app/api/ask/route.ts: server-side call to Anthropic's Messages API
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;   // e.g. a current id from the models page
  if (!apiKey || !model) {
    return Response.json({ error: "Live AI is not configured on this server." }, { status: 503 });
  }

  const { question } = await request.json();
  if (typeof question !== "string" || question.length > 2000) {
    return Response.json({ error: "Send { question } as text, up to 2000 characters." }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2026-10-21",
      "Authorization": \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: "You are a polite assistant for Mama Achen's shop in Kampala. Keep replies short.",
      messages: [{ role: "user", content: question }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Anthropic error", res.status, data.error?.type, data.request_id);
    return Response.json({ error: "The model call failed." }, { status: 502 });
  }

  const text = data.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("");

  return Response.json({
    answer: text,
    stopReason: data.stop_reason,              // "end_turn", "max_tokens", …
    usage: data.usage,                         // { input_tokens, output_tokens, … }
  });
}`;

const OPENAI_ROUTE = `// app/api/ask/route.ts: server-side call to OpenAI's Responses API
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;      // e.g. a current id from the models page
  if (!apiKey || !model) {
    return Response.json({ error: "Live AI is not configured on this server." }, { status: 503 });
  }

  const { question } = await request.json();
  if (typeof question !== "string" || question.length > 2000) {
    return Response.json({ error: "Send { question } as text, up to 2000 characters." }, { status: 400 });
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify({
      model,
      instructions: "You are a polite assistant for Mama Achen's shop in Kampala. Keep replies short.",
      input: question,
      max_output_tokens: 500,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI error", res.status, data.error?.message);
    return Response.json({ error: "The model call failed." }, { status: 502 });
  }

  // output can hold several items (e.g. reasoning first), so find the message parts.
  let text = "";
  for (const item of data.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content) {
      if (part.type === "output_text") text += part.text;
    }
  }

  return Response.json({
    answer: text,
    status: data.status,                       // "incomplete" if max_output_tokens was hit
    usage: data.usage,                         // { input_tokens, output_tokens, total_tokens, … }
  });
}`;

const l4: Lesson = {
  id: "m5-l4",
  moduleId: "m5",
  title: "Calling a real AI model",
  subtitle: "The request and response shape of a model provider, usage tokens, cost, and the secure backend pattern.",
  minutes: 45,
  prerequisites: ["m5-l1", "m5-l2", "m5-l3"],
  objectives: [
    "Describe what a model provider's API needs: model id, messages, a maximum output size, and instructions.",
    "Read a model's response: the text, the stop reason and the usage tokens.",
    "Estimate the cost of a call from usage tokens and a price list, in USD.",
    "Write a server-side route that calls Anthropic's or OpenAI's API with plain fetch, keeping the key and model name in environment variables.",
  ],
  glossary: ["model-provider", "usage-tokens", "token", "sdk", "max-tokens", "system-prompt", "server-side", "environment-variable"],
  completion: [
    "Send a request to the mock model provider and read its usage and illustrative cost.",
    "Pass the “Read the reply, the tokens and the cost” code exercise.",
    "Pass the knowledge check and submit the teach-back.",
  ],
  tutor: {
    simpler:
      "Calling a model is just an API call. You POST some JSON (which model, your messages, the most tokens it may write) to the provider's endpoint with your key, from your server. The reply is JSON with the model's text, why it stopped, and how many tokens were used. You pay per token, so tokens × price = cost.",
    altAnalogy:
      "Sending a parcel through a bus company's parcel office, from Kampala to Gulu. Each company has its own form, but all ask for similar things (sender, receiver, contents). You pay by weight, and the receipt shows the weight. Your shop's back office fills in the form using the shop's account; customers never touch the account card.",
    misconceptions: [
      "“The model name is permanent.” Providers release new models and retire old ones. Read the model id from an environment variable and check the provider's model list.",
      "“The response tells me the cost.” It tells you the token counts. You calculate the cost from the provider's current price list.",
      "“The text is always at a fixed position like output[0].” Responses can contain several parts (OpenAI's output can start with a reasoning item). Search for the text parts.",
      "“Every provider uses the same request format.” They are similar but not identical: different paths, header names and field names.",
    ],
    probingQuestions: [
      "Which parts of the request would you change to switch from Anthropic to OpenAI?",
      "A reply ends mid-sentence and stop_reason is \"max_tokens\". What happened, and what would you change?",
      "If one call uses 1,000 input tokens and 200 output tokens, how would you estimate the cost of 500 calls a day?",
      "Why does the route return 503 when no key is configured, instead of crashing?",
    ],
    revisit: ["m5-l2", "m5-l3"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "From the mock to the real thing",
      blocks: [
        { type: "p", text: "Mama Achen likes the WhatsApp helper. Now she wants it to write friendly replies using a real AI model. Brian has three questions:" },
        { type: "list", ordered: true, items: [
          "**What exactly do I send?** Which address, which headers, which fields?",
          "**What comes back,** and where in it is the model's answer?",
          "**How much will it cost?** She gets about 300 messages on a busy day, and she counts in shillings.",
        ] },
        { type: "p", text: "And from Lesson 2, one rule that does not change: **the key stays on the server.**" },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How do you call a real model provider's API safely from your own server, read the answer, and know what each call costs?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "The parcel office",
      blocks: [
        { type: "p", text: "To send a parcel from Kampala to Gulu, you go to a bus company's parcel office. Every company has its own form, but all of them want similar things: who sends it, who receives it, what is inside. You pay **by weight**, and the receipt shows the weight and the price. The shop's back office fills in the form and pays from the shop's account; customers never hold the account card." },
        { type: "analogyMap", pairs: [
          { everyday: "A bus company", technical: "A [[model-provider|model provider]] (such as Anthropic or OpenAI)" },
          { everyday: "Each company's own form", technical: "Each provider's request format: similar ideas, different field names" },
          { everyday: "Choosing express or ordinary service", technical: "Choosing the `model`: bigger models usually cost more per token" },
          { everyday: "“Maximum weight: 5 kg”", technical: "`max_tokens` / `max_output_tokens`: a cap on how long the reply may be" },
          { everyday: "Paying by weight; the receipt shows the weight", technical: "Paying per [[token|token]]; the response's [[usage-tokens|usage]] shows the counts" },
          { everyday: "The back office uses the shop's account", technical: "Your [[server-side|server]] adds the key from an [[environment-variable|environment variable]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "You can weigh a parcel before you pay. With a model you only know the output tokens **after** the reply is written, which is why you set a maximum. And the input “weight” includes everything you send: instructions, the conversation so far, and any documents. That grows quietly as a conversation gets longer." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Call the mock model provider",
      blocks: [
        { type: "p", text: "The **Ask the model** example is loaded below. Send it and look at the **Usage and cost** panel. Then experiment:" },
        { type: "list", items: [
          "Make the user message much longer. Watch `input_tokens` rise.",
          "Set `max_tokens` to `5`. Look at the cut-off text and `stop_reason: \"max_tokens\"`.",
          "Change `model` to `sim-large-1` (same tokens, higher illustrative price) and compare the cost of 1,000 calls.",
          "Change `model` to a name that does not exist. Read the 404.",
          "Delete the `max_tokens` line. Read the 400.",
          "Open the **fetch** view: real code, with the key replaced by `process.env.MODEL_API_KEY`.",
        ] },
        { type: "lab", lab: "api-explorer", props: { challenges: [], start: "ask-model" }, caption: "The mock provider's request and response are shaped like real model APIs, but its replies are canned text, not a model's output." },
        { type: "callout", tone: "sim", text: "The mock provider does **not** run a language model. Its replies are fixed sentences chosen by simple rules, and its token counts are rough estimates (about 4 characters per token). The prices for `sim-small-1` and `sim-large-1` are **made up for teaching**. What is real is the shape: model, max_tokens, messages in; content, stop_reason and usage out." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "How it really works",
      blocks: [
        { type: "p", text: "A [[model-provider|model provider]] is a company that runs language models on its own computers and lets you use them through an API. A model call is an ordinary HTTPS POST with a JSON body. Almost every provider asks for the same four ideas:" },
        { type: "list", items: [
          "**Which model** (`model`): an id from the provider's model list.",
          "**What to respond to**: the conversation so far (`messages` with roles such as `user` and `assistant`, or `input`).",
          "**Instructions** for how to behave: a [[system-prompt|system prompt]] (`system` at Anthropic, `instructions` at OpenAI's Responses API).",
          "**A limit on the reply's length** in tokens ([[max-tokens|max tokens]]).",
        ] },
        { type: "p", text: "And the response gives back the model's **text**, a **reason it stopped** (finished naturally, or hit the limit), and [[usage-tokens|usage]]: how many input and output tokens were counted. Here is how two major providers name these things, checked against their documentation in November 2026:" },
        { type: "table", caption: "Two real model APIs side by side (verify against current docs before you build)", head: ["", "Anthropic Messages API", "OpenAI Responses API"], rows: [
          ["Endpoint", "POST https://api.anthropic.com/v1/messages", "POST https://api.openai.com/v1/responses"],
          ["Key header", "Authorization: Bearer <key> (older x-api-key still supported)", "Authorization: Bearer <key>"],
          ["Other headers", "anthropic-version: 2026-10-21; content-type: application/json", "Content-Type: application/json"],
          ["Model", "model (required)", "model"],
          ["Conversation", "messages: [{ role, content }] (required)", "input: text or a list of messages"],
          ["Instructions", "system", "instructions"],
          ["Length limit", "max_tokens (required)", "max_output_tokens"],
          ["Where the text is", "content: list of blocks; text blocks have type \"text\"", "output: list of items; message items contain parts of type \"output_text\""],
          ["Why it stopped", "stop_reason: \"end_turn\", \"max_tokens\", …", "status: \"completed\" or \"incomplete\" (incomplete_details.reason, e.g. \"max_output_tokens\")"],
          ["Usage", "usage.input_tokens, usage.output_tokens", "usage.input_tokens, usage.output_tokens, usage.total_tokens"],
        ] },
        { type: "callout", tone: "warn", title: "Details change. Check before you build", text: "Providers update their APIs. For example, Anthropic's API version `2026-10-21` (the latest listed when this lesson was written) **rejects** `temperature`, `top_p` and `top_k` with a 400 error, even though older versions accepted them. Its docs now show `Authorization: Bearer` and describe `x-api-key` as a legacy fallback that is still supported. OpenAI still supports its older Chat Completions API but recommends the Responses API for new projects. Before you build, read the current pages: platform.claude.com/docs (Anthropic) and developers.openai.com/api/docs (OpenAI)." },
        { type: "p", text: "**Choosing a model.** Never hard-code a model name as if it were permanent. Models are released and retired regularly. Put the id in an environment variable (`ANTHROPIC_MODEL`, `OPENAI_MODEL`), and choose a current one from the provider's model list: platform.claude.com/docs/en/about-claude/models/overview or developers.openai.com/api/docs/models." },
        { type: "p", text: "**Cost.** Providers charge per token, priced in **US dollars per million tokens**, with output tokens usually costing several times more than input tokens:" },
        { type: "code", lang: "text", code: `cost (USD) = input_tokens  ÷ 1,000,000 × input price per million
           + output_tokens ÷ 1,000,000 × output price per million` },
        { type: "table", caption: "A worked example with ILLUSTRATIVE prices ($2 input / $10 output per million tokens). Not real prices.", head: ["", "Per call", "Per day (300 calls)", "Per 30 days"], rows: [
          ["Input tokens (instructions + message)", "1,500", "450,000", "13,500,000"],
          ["Output tokens (the reply)", "200", "60,000", "1,800,000"],
          ["Input cost", "$0.003", "$0.90", "$27.00"],
          ["Output cost", "$0.002", "$0.60", "$18.00"],
          ["Total", "$0.005", "$1.50", "$45.00"],
        ] },
        { type: "callout", tone: "cost", text: "These prices are made up to show the arithmetic. Real prices differ by provider and model and change over time, and some features (cached input, batch processing, tools) are priced differently. **Always check the provider's current pricing page** (platform.claude.com/docs/en/about-claude/pricing; developers.openai.com/api/docs/pricing) and set a spend limit. To think in shillings, convert the USD total at today's exchange rate." },
        { type: "p", text: "**SDKs.** Providers also publish an [[sdk|SDK]] (a library such as `@anthropic-ai/sdk` or `openai` for JavaScript) that writes the headers, retries and parsing for you. In this course we use plain `fetch` first so you can see exactly what goes over the wire; switching to an SDK later is easy once you understand the raw request." },
        { type: "p", text: "**This app's own route.** Agent Academy follows the same secure pattern. Your browser calls `/api/model` on the Agent Academy server, never a provider directly. That route reads `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (and the model name) from the server's environment, is **off unless the person running the server turns it on**, and replies 503 “not configured” otherwise. It also checks the size of each request, limits how many calls each visitor can make, and caps the output tokens. When it is off, every lab in this course uses simulated models, which is why everything works offline." },
      ],
    },
    {
      kind: "example",
      mode: "build",
      title: "Real code: one route, two providers",
      blocks: [
        { type: "p", text: "Both routes below are complete Next.js route handlers using plain `fetch`. They do the same job: take a question from your browser, call the provider **from the server**, and return only the answer and the usage. The endpoints, headers and fields match each provider's documentation as checked in November 2026." },
        { type: "code", lang: "ts", code: ANTHROPIC_ROUTE, caption: "Anthropic Messages API (docs: platform.claude.com/docs/en/api/messages/create)", notes: [
          { line: 3, text: "The key comes from the server's environment. Nothing secret is in the code." },
          { line: 4, text: "The model id is configuration too. Pick a current one from the provider's model list." },
          { line: 6, text: "If the server is not configured, say so clearly with 503 instead of crashing." },
          { line: 10, text: "Validate input: anyone can call this route, and long inputs cost money." },
          { line: 14, text: "The Messages API endpoint." },
          { line: 18, text: "The API version. 2026-10-21 was the latest in the docs when this was written; check the versioning page." },
          { line: 19, text: "The key, sent as a Bearer token. Older examples use the `x-api-key` header, which the docs still list as supported." },
          { line: 23, text: "Required: the most tokens the reply may use." },
          { line: 24, text: "Instructions (the system prompt) go in the top-level `system` field." },
          { line: 25, text: "Required: the conversation. Here, a single user message." },
          { line: 27, text: "Give up after 60 seconds rather than waiting forever." },
          { line: 32, text: "Log the error type and request_id for debugging, never the key." },
          { line: 36, text: "`content` is a list of blocks. Join the text of every text block." },
          { line: 43, text: "If this is \"max_tokens\", the answer was cut off." },
        ] },
        { type: "code", lang: "ts", code: OPENAI_ROUTE, caption: "OpenAI Responses API (docs: developers.openai.com/api/docs/guides/text)", notes: [
          { line: 14, text: "The Responses endpoint." },
          { line: 18, text: "The key, sent as a Bearer token." },
          { line: 22, text: "Instructions that take priority over the input." },
          { line: 23, text: "The input can be a plain string or a list of messages." },
          { line: 24, text: "The cap on generated tokens (including any reasoning tokens)." },
          { line: 35, text: "OpenAI's docs warn that `output` often holds several items, so do not assume `output[0]` is the text." },
          { line: 40, text: "Message items contain parts; the text parts have type \"output_text\"." },
          { line: 46, text: "If the token cap was hit, the status is \"incomplete\"." },
        ] },
        { type: "code", lang: "bash", code: `# .env.local (server only; listed in .gitignore). Use ONE provider or both.
ANTHROPIC_API_KEY=paste-your-key-here
ANTHROPIC_MODEL=pick-a-current-id-from-the-models-page
OPENAI_API_KEY=paste-your-key-here
OPENAI_MODEL=pick-a-current-id-from-the-models-page`, caption: "The configuration both routes read" },
        { type: "callout", tone: "info", text: "We could not run these routes against the live providers from inside this course (the course makes no network calls). Every endpoint, header and field name was checked against the providers' documentation pages listed in the captions. If a call fails, compare your request with the current docs first." },
        { type: "p", text: "This app follows the same pattern. Its own `/api/model` route is off by default, and only turns on when the server has a key. Open the real code below to see the safety checks that run **before** any paid request is made." },
        { type: "showCode", ref: "model-route" },
      ],
    },
    {
      kind: "challenge",
      mode: "build",
      title: "Read real-shaped replies",
      blocks: [
        { type: "p", text: "Write the three functions every model integration needs: get the text out, get the token counts out, and turn tokens into dollars. The sample replies follow the shapes in each provider's documentation." },
        { type: "exercise", exercise: exReadReply, required: true },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "Cut-off replies, missing models and creeping costs",
      blocks: [
        { type: "list", ordered: true, items: [
          "**The reply stops mid-sentence.** `stop_reason` is `\"max_tokens\"` (Anthropic) or `status` is `\"incomplete\"` (OpenAI). The model was not finished; your limit stopped it. **Fix:** raise the limit a little, or ask for shorter answers in the instructions. Check the stop reason in code and do not show a cut-off reply as if it were complete.",
          "**404 for the model.** The model id is misspelt, or the model was retired. **Fix:** check the provider's current model list and update the `…_MODEL` environment variable. No code change needed.",
          "**400 after upgrading.** A field your old code sent is no longer accepted (for example `temperature` with Anthropic's 2026-10-21 version). **Fix:** read the error message and the provider's changelog or versioning page.",
          "**Empty text from OpenAI.** The code read `output[0]`, but the first item was a reasoning item, not the message. **Fix:** loop through `output` and collect the `output_text` parts, as in the exercise.",
          "**Costs creep up over a conversation.** Each call sends the **whole** conversation again, so input tokens grow with every message. **Recognise it:** `input_tokens` in your logs keeps rising. **Fix:** keep conversations short, summarise old messages, and log usage for every call (Module 8 covers memory; Module 16 covers cost).",
          "**503 “not configured” from your own route.** The server has no key or no model set. **Fix:** set both variables on the server and restart; never “fix” it by moving the key into browser code.",
        ] },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "multi", flavour: "recall",
            prompt: "Which fields are **required** in a request to Anthropic's Messages API? Select all that apply.",
            options: [
              { text: "model", why: "Yes: which model should respond." },
              { text: "max_tokens", why: "Yes: Anthropic requires a cap on the reply's length." },
              { text: "messages", why: "Yes: the conversation to respond to." },
              { text: "system", why: "Optional. Useful, but not required." },
              { text: "temperature", why: "Not required, and with API version 2026-10-21 it is rejected." },
            ],
            answers: [0, 1, 2],
            hint: "Which model, how long, and what to respond to.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "A call uses 1,000 input tokens and 200 output tokens. With **illustrative** prices of $3 input and $15 output per million tokens, what does it cost?",
            options: [
              { text: "$0.006", why: "Correct: 1,000/1,000,000 × 3 = $0.003, plus 200/1,000,000 × 15 = $0.003. Total $0.006." },
              { text: "$6,000", why: "Prices are per **million** tokens. Divide by 1,000,000." },
              { text: "$0.018", why: "That adds the two prices and multiplies by 1,000 tokens. Price input and output separately." },
              { text: "$18", why: "Divide by a million." },
            ],
            answer: 0,
            hint: "tokens ÷ 1,000,000 × price, for input and output separately.",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "Brian's helper sometimes sends replies that stop mid-sentence. The response has `\"stop_reason\": \"max_tokens\"`. What is happening?",
            options: [
              { text: "The model crashed", why: "A crash would be an error status, not a 200 with a stop reason." },
              { text: "The reply hit the max_tokens limit Brian set", why: "Correct. Raise the limit a little or ask for shorter answers, and check the stop reason in code." },
              { text: "The rate limit was reached", why: "That would be a 429, with no reply at all." },
            ],
            answer: 1,
            hint: "What does the stop reason's name say?",
          },
          {
            id: "q4", type: "mcq", flavour: "design",
            prompt: "Where should the model name (for example the id of the model you chose) be stored?",
            options: [
              { text: "Typed directly into the code, because it never changes", why: "Models are released and retired. Hard-coding means a code change every time." },
              { text: "In a server environment variable, chosen from the provider's current model list", why: "Correct. Changing models becomes a configuration change." },
              { text: "In a NEXT_PUBLIC_ variable so the browser can choose", why: "The browser should not decide which (possibly expensive) model your server pays for." },
            ],
            answer: 1,
            hint: "What happens when the provider retires the model?",
          },
          {
            id: "q5", type: "order",
            prompt: "Put the secure flow for one question in order.",
            items: [
              "The browser POSTs { question } to /api/ask on your server",
              "Your route checks the input and reads the key from process.env",
              "Your server POSTs to the provider with the key, model, limit and messages",
              "The provider replies with content, stop reason and usage",
              "Your route returns only the answer (and logs the usage) to the browser",
            ],
            hint: "The browser starts and ends it, but never talks to the provider.",
            explanation: "Browser → your route (validate, add key) → provider → your route (extract text, log usage) → browser. The key never leaves the server.",
          },
          {
            id: "q6", type: "short",
            prompt: "The response tells you `input_tokens` and `output_tokens`. Why doesn't it simply tell you the price, and where do you get the price?",
            modelAnswer: "The API reports usage (token counts); prices are set separately and change over time, differ by model, and output tokens usually cost more than input. You calculate cost yourself from the provider's current pricing page: tokens ÷ 1,000,000 × the price per million, for input and output separately.",
            checklist: ["Response gives token counts, not money", "Prices come from the provider's current pricing page", "Input and output are priced separately, per million tokens"],
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Explain to Mama Achen, in plain words, how her WhatsApp helper will use a real AI model: what is sent, what comes back, how she is charged, and why the key is safe.",
          rubric: [
            { concept: "The server sends a request with the model, the messages and a length limit", keywords: ["model", "message", "max", "limit", "request", "send", "post"], hint: "What goes into the request?" },
            { concept: "The response contains the text and token usage", keywords: ["text", "answer", "reply", "usage", "tokens", "stop"], hint: "What comes back?" },
            { concept: "Cost is calculated from tokens and the provider's price list", keywords: ["token", "price", "per million", "cost", "dollar", "usd", "charge"], hint: "How is she charged?" },
            { concept: "The key stays on the server; the browser/phone only talks to her server", keywords: ["server", "key", "environment", "never", "browser", "secret", "safe"], hint: "Why can't customers steal the key?" },
          ],
          exemplar: "When a customer sends a message, your shop's server, not the customer's phone, sends a request to the AI company. The request says which model to use, includes the customer's message and short instructions about being polite, and sets a limit on how long the reply can be. The company sends back the reply text, the reason it stopped, and how many tokens (small pieces of text) were read and written. You pay per token, priced in dollars per million tokens, so a short message and reply costs a tiny fraction of a cent; we check their price list and set a monthly spending limit. The secret key that lets us use the service is kept only on our server, in a setting customers can never see, so nobody can copy it and run up your bill.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "Calling a model is an ordinary API call made **from your server**: POST JSON with the **model**, the **messages** (or input), **instructions** and a **token limit**, plus your key from `process.env`. The reply holds the **text**, a **stop reason** and **usage tokens**. Cost = tokens ÷ 1,000,000 × price, for input and output separately, using the provider's **current** price list. Model ids and API details change, so keep them in configuration and check the docs.",
          canNow: [
            "Write a server route that calls Anthropic's or OpenAI's API with fetch.",
            "Extract the text safely from either provider's response.",
            "Estimate the cost of a call and of a month of calls.",
            "Explain how this app's /api/model route keeps keys on the server and stays off unless configured.",
          ],
          next: "Module 6: Tool calling. Now that your code can talk to a model, you will let the model ask your code to do things, safely.",
        },
      ],
    },
  ],
};

export const m05Lessons: Lesson[] = [l1, l2, l3, l4];

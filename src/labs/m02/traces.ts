/**
 * Step-by-step traces of small, REAL JavaScript programs.
 * The code strings are real and runnable; the steps are a hand-written
 * teaching recording of what JavaScript does with them. A unit test
 * (tests/unit/m02-traces.test.ts) runs each program for real and checks
 * that its console output matches the recording's final output.
 */

export type VarKind = "const" | "let" | "param" | "function";

export interface Frame { name: string; vars: Record<string, unknown> }
export interface Kitchen {
  /** Pretend minutes since the first order (the code uses 100 ms per "minute"). */
  clock: number;
  /** What the single waiter (JavaScript's main thread) is doing right now. */
  waiter: string;
  /** Promises still pending: dishes on the stove, with the minute they will be ready. */
  cooking: { dish: string; readyAt: number }[];
  /** Fulfilled promises whose .then callbacks wait for the waiter. */
  counter: string[];
}

export interface Ask { prompt: string; options: string[]; answer: number; explain: string }

export interface TraceStep {
  line: number;
  note: string;
  vars: { name: string; kind: VarKind; value: unknown; changed: boolean }[];
  frames: Frame[];
  out: string[];
  kitchen?: Kitchen;
  ask?: Ask;
}

export interface Scenario {
  id: "variables" | "objects" | "decisions" | "kitchen";
  title: string;
  blurb: string;
  code: string;
  steps: TraceStep[];
}

/* ------------------------------ builder ------------------------------ */

interface Delta {
  line: number;
  note: string;
  set?: Record<string, unknown>;
  call?: Frame;
  ret?: boolean;
  log?: string;
  kitchen?: Partial<Kitchen>;
  ask?: Ask;
}

function build(kinds: Record<string, VarKind>, deltas: Delta[], kitchen0?: Kitchen): TraceStep[] {
  const order: string[] = [];
  const values: Record<string, unknown> = {};
  let frames: Frame[] = [];
  const out: string[] = [];
  let kitchen = kitchen0;
  return deltas.map((d) => {
    const changed = new Set<string>();
    if (d.set) {
      for (const [k, v] of Object.entries(d.set)) {
        if (!order.includes(k)) order.push(k);
        values[k] = JSON.parse(JSON.stringify(v ?? null));
        changed.add(k);
      }
    }
    if (d.call) frames = [...frames, d.call];
    if (d.ret) frames = frames.slice(0, -1);
    if (d.log !== undefined) out.push(d.log);
    if (d.kitchen && kitchen) kitchen = { ...kitchen, ...d.kitchen };
    return {
      line: d.line,
      note: d.note,
      vars: order.map((name) => ({ name, kind: kinds[name] ?? "const", value: values[name], changed: changed.has(name) })),
      frames: frames.map((f) => ({ name: f.name, vars: { ...f.vars } })),
      out: [...out],
      kitchen: kitchen ? { ...kitchen, cooking: [...kitchen.cooking], counter: [...kitchen.counter] } : undefined,
      ask: d.ask,
    };
  });
}

const FN = (sig: string) => ({ __fn: sig });

/* ------------------------------ scenarios ------------------------------ */

const variablesCode = `const shopName = "Mama Achen's Shop";
let riceBags = 12;
const pricePerBag = 110000;
riceBags = riceBags - 3;
const isLow = riceBags < 10;
console.log(shopName, "has", riceBags, "bags left");
console.log("Low on rice?", isLow);`;

const variables: Scenario = {
  id: "variables",
  title: "Variables",
  blurb: "Labelled containers holding text, numbers and true/false.",
  code: variablesCode,
  steps: build({ shopName: "const", riceBags: "let", pricePerBag: "const", isLow: "const" }, [
    { line: 1, note: "JavaScript makes a container, writes the label **shopName** on it, and puts the text inside. Text in quotes is a **string**. `const` means this label will always point at this value.", set: { shopName: "Mama Achen's Shop" } },
    { line: 2, note: "A second container, **riceBags**, holding the **number** 12. No quotes, so it is a number you can do maths with. `let` means we are allowed to put a new value in later.", set: { riceBags: 12 } },
    { line: 3, note: "A number for the price. In code you write 110000 with no commas — commas mean something else in JavaScript.", set: { pricePerBag: 110000 } },
    { line: 4, note: "Three bags were sold. Before you step, predict the new value.", ask: { prompt: "What will riceBags hold after line 4 runs?", options: ["12", "9", "3", "The text \"riceBags - 3\""], answer: 1, explain: "JavaScript works out the right-hand side first, using the CURRENT value: 12 - 3 = 9. Then it puts 9 into the container, replacing 12." } },
    { line: 4, note: "The right-hand side is worked out first (12 - 3 = 9), then the result goes into the container. The old value 12 is gone.", set: { riceBags: 9 } },
    { line: 5, note: "`riceBags < 10` is a question with a yes/no answer: is 9 less than 10? Yes, so isLow holds the **boolean** `true`.", set: { isLow: true } },
    { line: 6, note: "`console.log` prints values to the output, separated by spaces. Notice the labels are replaced by what is inside the containers.", log: "Mama Achen's Shop has 9 bags left" },
    { line: 7, note: "The program has finished. Every container still holds its last value until the program ends.", log: "Low on rice? true" },
  ]),
};

const objectsCode = `const customer = { name: "Nakato", phone: "0700 123456", balance: 15000 };
const basket = ["rice", "sugar"];
basket.push("soap");
customer.balance = customer.balance - 5000;
console.log(customer.name, "owes", customer.balance);
console.log("Items:", basket.length, "first:", basket[0]);
const text = JSON.stringify(customer);
console.log(text);`;

const objects: Scenario = {
  id: "objects",
  title: "Objects & arrays",
  blurb: "A customer record, a shopping list, and JSON text.",
  code: objectsCode,
  steps: build({ customer: "const", basket: "const", text: "const" }, [
    { line: 1, note: "An **object**: one container holding a structured record. Each piece has a name (a **property**) and a value — like the columns of a customer book.", set: { customer: { name: "Nakato", phone: "0700 123456", balance: 15000 } } },
    { line: 2, note: "An **array**: an ordered list. Each item has a position number called an **index**, starting at 0.", set: { basket: ["rice", "sugar"] } },
    { line: 3, note: "Predict before you step.", ask: { prompt: "After basket.push(\"soap\"), what is in basket?", options: ["[\"soap\", \"rice\", \"sugar\"]", "[\"rice\", \"sugar\", \"soap\"]", "[\"soap\"]", "An error, because basket is const"], answer: 1, explain: "push adds to the END of the list. And const does not freeze the list: it only means the label basket always points to the same list. The list itself can still change." } },
    { line: 3, note: "`push` adds an item to the end. `const` did not stop this: the label still points at the same list; only the list's contents changed.", set: { basket: ["rice", "sugar", "soap"] } },
    { line: 4, note: "Nakato paid 5,000. We read one property with a dot (`customer.balance`), subtract, and store the result back in that property.", set: { customer: { name: "Nakato", phone: "0700 123456", balance: 10000 } } },
    { line: 5, note: "Dot notation reads single properties out of the record.", log: "Nakato owes 10000" },
    { line: 6, note: "`basket.length` is how many items (3). `basket[0]` is the FIRST item, because counting starts at 0.", log: "Items: 3 first: rice" },
    { line: 7, note: "`JSON.stringify` turns the object into **JSON text** — one string that can be saved in a file or sent across the internet. Look: the value is now a string, with double quotes around every name.", set: { text: '{"name":"Nakato","phone":"0700 123456","balance":10000}' } },
    { line: 8, note: "Printing the JSON text. Other programs — including AI model APIs — send and receive data in exactly this format.", log: '{"name":"Nakato","phone":"0700 123456","balance":10000}' },
  ]),
};

const decisionsCode = `function lineTotal(price, qty) {
  return price * qty;
}
const order = [
  { item: "sugar", price: 5000, qty: 2 },
  { item: "soap", price: 4500, qty: 1 },
];
let total = 0;
for (const entry of order) {
  total = total + lineTotal(entry.price, entry.qty);
}
let fee = 3000;
if (total >= 10000) {
  fee = 0;
}
console.log("Total:", total, "Delivery:", fee);`;

const sugar = { item: "sugar", price: 5000, qty: 2 };
const soap = { item: "soap", price: 4500, qty: 1 };

const decisions: Scenario = {
  id: "decisions",
  title: "Functions, loops & decisions",
  blurb: "Add up an order line by line, then apply a delivery rule.",
  code: decisionsCode,
  steps: build({ lineTotal: "function", order: "const", total: "let", entry: "const", fee: "let" }, [
    { line: 1, note: "This **defines** a function — like writing a recipe card. Nothing is cooked yet. `price` and `qty` are its **parameters**: the blanks the recipe needs filled in.", set: { lineTotal: FN("lineTotal(price, qty)") } },
    { line: 4, note: "The order: an array of objects, one per line on the order slip.", set: { order: [sugar, soap] } },
    { line: 8, note: "A running total starts at 0. It uses `let` because it will change.", set: { total: 0 } },
    { line: 9, note: "The **loop** begins: take the first entry on the order list (sugar).", set: { entry: sugar } },
    { line: 10, note: "**Calling** the function: the inputs 5000 and 2 are copied into the parameters price and qty. A new, private workspace (a frame) opens.", call: { name: "lineTotal", vars: { price: 5000, qty: 2 } } },
    { line: 2, note: "Inside the function: 5000 × 2 = 10000. `return` hands this **output** back to whoever called it and closes the workspace.", ret: true },
    { line: 10, note: "Back on line 10: total = 0 + 10000.", set: { total: 10000 } },
    { line: 9, note: "Next item on the list: soap.", set: { entry: soap } },
    { line: 10, note: "Predict before you step.", ask: { prompt: "What will total be after this line runs?", options: ["4500", "14500", "10000", "9000"], answer: 1, explain: "lineTotal(4500, 1) returns 4500, and it is ADDED to the running total of 10000: 14500." } },
    { line: 10, note: "lineTotal(4500, 1) returns 4500 (the frame opens and closes quickly). total = 10000 + 4500.", set: { total: 14500 } },
    { line: 9, note: "No items left on the list, so the loop stops and the program continues after the closing brace." },
    { line: 12, note: "The normal delivery fee is UGX 3,000.", set: { fee: 3000 } },
    { line: 13, note: "A **condition** — the shopkeeper's rule: is 14500 >= 10000? Yes (`true`), so the code inside the braces runs." },
    { line: 14, note: "Free delivery for big orders.", set: { fee: 0 } },
    { line: 16, note: "Finished. Try changing qty in your head: with only 1 sugar the total would be 9500 and the condition would be false.", log: "Total: 14500 Delivery: 0" },
  ]),
};

const kitchenCode = `function cook(dish, minutes) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(dish + " ready"), minutes * 100);
  });
}
console.log("Order 1: rolex (3 min)");
cook("rolex", 3).then((msg) => console.log("Serve:", msg));
console.log("Order 2: chips (1 min)");
cook("chips", 1).then((msg) => console.log("Serve:", msg));
console.log("Waiter: taking the next order...");`;

const kitchen: Scenario = {
  id: "kitchen",
  title: "Async kitchen",
  blurb: "Promises and the event loop as a restaurant with one waiter.",
  code: kitchenCode,
  steps: build({ cook: "function" }, [
    { line: 1, note: "Define `cook`. It returns a **promise**: an order ticket that says “your food will come later”. Each pretend minute is 100 milliseconds of real time.", set: { cook: FN("cook(dish, minutes)") }, kitchen: { waiter: "reading the code" } },
    { line: 6, note: "The waiter (JavaScript can only do one thing at a time) prints the first order.", log: "Order 1: rolex (3 min)", kitchen: { waiter: "taking order 1" } },
    { line: 7, note: "`cook(\"rolex\", 3)` hands the order to the kitchen and returns a pending promise immediately. `.then(...)` pins a note on the ticket: “when it's ready, serve it”. The waiter does **not** stand and wait.", kitchen: { waiter: "handing the rolex ticket to the kitchen", cooking: [{ dish: "rolex", readyAt: 3 }] } },
    { line: 8, note: "The waiter is already taking the next order while the rolex cooks.", log: "Order 2: chips (1 min)", kitchen: { waiter: "taking order 2" } },
    { line: 9, note: "Chips go to the kitchen too. Two promises are now pending at the same time.", kitchen: { waiter: "handing the chips ticket to the kitchen", cooking: [{ dish: "rolex", readyAt: 3 }, { dish: "chips", readyAt: 1 }] } },
    { line: 10, note: "Predict before you step.", ask: { prompt: "Which dish will be served first?", options: ["Rolex, because it was ordered first", "Chips, because it finishes cooking first", "Both at exactly the same time", "Neither: the program ends before anything is served"], answer: 1, explain: "Promises are served when they are READY, not in the order they were placed. Chips take 1 minute, rolex 3. (And the program keeps running while timers are still waiting.)" } },
    { line: 10, note: "The last line of the main code. After this, the waiter has nothing left in the code to do — but the kitchen is still busy.", log: "Waiter: taking the next order...", kitchen: { waiter: "free — watching the counter" } },
    { line: 3, note: "Minute 1: the chips timer finishes and `resolve` is called. The promise is now **fulfilled**. Its .then note goes to the counter, waiting for the waiter.", kitchen: { clock: 1, cooking: [{ dish: "rolex", readyAt: 3 }], counter: ["Serve: chips ready"] } },
    { line: 9, note: "The **event loop**: the waiter is free, so it picks up the next note from the counter and runs it.", log: "Serve: chips ready", kitchen: { waiter: "serving chips", counter: [] } },
    { line: 3, note: "Minute 3: the rolex is ready. Its promise is fulfilled and its note goes to the counter.", kitchen: { clock: 3, waiter: "free — watching the counter", cooking: [], counter: ["Serve: rolex ready"] } },
    { line: 7, note: "Served. The kitchen is empty, the counter is empty, so the program ends. Total time ≈ 3 minutes, not 1 + 3 = 4, because both dishes cooked at the same time.", log: "Serve: rolex ready", kitchen: { waiter: "done", counter: [] } },
  ], { clock: 0, waiter: "", cooking: [], counter: [] }),
};

export const SCENARIOS: Scenario[] = [variables, objects, decisions, kitchen];

export function getScenario(id: string | undefined): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? variables;
}

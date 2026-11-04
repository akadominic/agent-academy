import type { ProjectDef } from "../schema";

/* ======================================================================
   PROJECT 1 — Simple Shop Calculator (after Module 2)
   Each step builds on the previous one: a step's starter contains the
   reference solution of every earlier step, plus a new part to write.
   Prices are illustrative.
   ====================================================================== */

const STEP1 = `const shopName = "Mama Achen's Shop";

// Prices in UGX (illustrative)
const PRICES = {
  rice: 110000, // per bag
  sugar: 5000,  // per kg
  soap: 4500,   // per bar
  oil: 9000,    // per litre
};
`;

const STEP2 = `${STEP1}
function lineTotal(product, qty) {
  if (PRICES[product] === undefined) {
    throw new Error("Unknown product: " + product);
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("Quantity must be a whole number above 0");
  }
  return PRICES[product] * qty;
}
`;

const STEP3 = `${STEP2}
function orderTotal(order) {
  let total = 0;
  for (const entry of order) {
    total = total + lineTotal(entry.product, entry.qty);
  }
  return total;
}
`;

const STEP4 = `${STEP3}
function discountFor(total) {
  if (total >= 500000) {
    return Math.round(total * 0.10);
  } else if (total >= 200000) {
    return Math.round(total * 0.05);
  }
  return 0;
}

function amountToPay(order) {
  const total = orderTotal(order);
  return total - discountFor(total);
}
`;

const STEP5 = `${STEP4}
function formatUGX(amount) {
  return "UGX " + amount.toLocaleString("en-US");
}

function receipt(order) {
  const lines = [shopName];
  for (const entry of order) {
    lines.push(entry.qty + " x " + entry.product + " = " + formatUGX(lineTotal(entry.product, entry.qty)));
  }
  const subtotal = orderTotal(order);
  const discount = discountFor(subtotal);
  lines.push("Subtotal: " + formatUGX(subtotal));
  lines.push("Discount: " + formatUGX(discount));
  lines.push("To pay: " + formatUGX(subtotal - discount));
  return lines.join("\\n");
}
`;

const STEP6 = `${STEP5}
function safeReceipt(order) {
  try {
    return receipt(order);
  } catch (err) {
    return "Sorry: " + err.message;
  }
}
`;

const SAMPLE_RECEIPT = [
  "Mama Achen's Shop",
  "3 x rice = UGX 330,000",
  "2 x sugar = UGX 10,000",
  "Subtotal: UGX 340,000",
  "Discount: UGX 17,000",
  "To pay: UGX 323,000",
].join("\n");

export const p1: ProjectDef = {
  id: "p1",
  number: 1,
  title: "Simple Shop Calculator",
  moduleId: "m2",
  focus: "Variables, functions, loops, rules, errors and formatted output",
  brief:
    "Build the calculator behind Mama Achen's till. Given an order such as 3 bags of rice and 2 kg of sugar, it looks up prices, refuses bad input, adds up the order in UGX, applies the shop's discount rule and prints a clear receipt like `To pay: UGX 323,000`. It is ordinary code with no AI in it — and it is exactly the kind of function an agent will call as a **tool** in Module 6. Prices are illustrative.",
  architecture: [
    { label: "Shop assistant", kind: "people", note: "Types in the order: which products, how many." },
    { label: "Order (array of objects)", kind: "data", note: "e.g. [{ product: \"rice\", qty: 3 }, { product: \"sugar\", qty: 2 }]" },
    { label: "Price list (object)", kind: "data", note: "PRICES maps each product name to its price in UGX." },
    { label: "Input checks", kind: "safety", note: "lineTotal throws for unknown products and bad quantities." },
    { label: "Calculator functions", kind: "control", note: "lineTotal → orderTotal → discountFor → amountToPay." },
    { label: "Receipt (formatted text)", kind: "people", note: "formatUGX and receipt turn numbers into a readable receipt." },
  ],
  prerequisites: ["m2-l1", "m2-l2", "m2-l3", "m2-l4"],
  steps: [
    {
      id: "p1-s1",
      title: "Step 1 — The shop and its price list",
      blocks: [
        { type: "p", text: "Every calculator starts with data. Store the shop's name in a variable and the prices in an **object**, so that `PRICES.rice` (or `PRICES[\"rice\"]`) gives the price of rice. Using one object instead of four separate variables means a product's name can be looked up from an order." },
        { type: "exercise", exercise: {
          id: "p1-s1-prices",
          title: "Create the price list",
          brief: "Set `shopName` to `Mama Achen's Shop`. Fill `PRICES` with four products: `rice` 110000, `sugar` 5000, `soap` 4500, `oil` 9000 (numbers, not text).",
          starter: `const shopName = "";

// Prices in UGX (illustrative)
const PRICES = {
  // rice: 110000 per bag, sugar: 5000 per kg, soap: 4500 per bar, oil: 9000 per litre
};
`,
          solution: STEP1,
          tests: [
            { name: "shopName is set", expr: "shopName", expected: "Mama Achen's Shop" },
            { name: "rice costs 110000", expr: "PRICES.rice", expected: 110000 },
            { name: "oil costs 9000", expr: "PRICES.oil", expected: 9000 },
            { name: "prices are numbers", expr: "typeof PRICES.sugar", expected: "number" },
            { name: "exactly four products", expr: "Object.keys(PRICES).sort()", expected: ["oil", "rice", "soap", "sugar"] },
          ],
          hints: [
            "Inside the braces: `rice: 110000,` then the next product on a new line.",
            "No quotes around the numbers; no commas inside the numbers.",
          ],
        } },
      ],
    },
    {
      id: "p1-s2",
      title: "Step 2 — One line of the order, checked",
      blocks: [
        { type: "p", text: "A function with **inputs and an output**: give it a product name and a quantity, get back the price of that line. Before calculating, it must **refuse bad input** by throwing an error. A tool that silently returns `NaN` for \"bread\" or a negative total for -2 bags is dangerous, especially when an AI model is the one calling it." },
        { type: "exercise", exercise: {
          id: "p1-s2-line-total",
          title: "Write lineTotal(product, qty)",
          brief: "Complete `lineTotal`. If `PRICES[product]` is `undefined`, throw an Error with the message `Unknown product: ` followed by the product name. If `qty` is not a whole number above 0, throw `Quantity must be a whole number above 0`. Otherwise return price × qty.",
          starter: `${STEP1}
function lineTotal(product, qty) {
  // 1. unknown product? throw
  // 2. bad quantity? throw
  // 3. return the price times the quantity
}
`,
          solution: STEP2,
          tests: [
            { name: "3 bags of rice", expr: "lineTotal(\"rice\", 3)", expected: 330000 },
            { name: "2 kg of sugar", expr: "lineTotal(\"sugar\", 2)", expected: 10000 },
            { name: "unknown product is refused", expr: "lineTotal(\"bread\", 1)", throws: "Unknown product: bread" },
            { name: "zero is refused", expr: "lineTotal(\"soap\", 0)", throws: "whole number above 0" },
            { name: "half a bag is refused", expr: "lineTotal(\"rice\", 2.5)", throws: "whole number above 0" },
          ],
          hints: [
            "`if (PRICES[product] === undefined) { throw new Error(\"Unknown product: \" + product); }`",
            "The quantity check is the same as `checkQuantity` in Lesson 4: `!Number.isInteger(qty) || qty <= 0`.",
            "Finally `return PRICES[product] * qty;` — square brackets, because the product name is in a variable.",
          ],
        } },
      ],
    },
    {
      id: "p1-s3",
      title: "Step 3 — The order total",
      blocks: [
        { type: "p", text: "An order is an array of `{ product, qty }` objects. Loop through it and add up each line using the function you already wrote. Reusing `lineTotal` means every line is checked automatically: a bad line throws, and the error travels up out of `orderTotal` too." },
        { type: "exercise", exercise: {
          id: "p1-s3-order-total",
          title: "Write orderTotal(order)",
          brief: "Complete `orderTotal(order)`: start a running total at 0, loop through the entries, add `lineTotal(entry.product, entry.qty)` for each, and return the total. An empty order is 0.",
          starter: `${STEP2}
function orderTotal(order) {
  let total = 0;
  return total;
}
`,
          solution: STEP3,
          tests: [
            { name: "a mixed order", expr: "orderTotal([{ product: \"rice\", qty: 1 }, { product: \"sugar\", qty: 2 }, { product: \"soap\", qty: 3 }])", expected: 133500 },
            { name: "empty order is 0", expr: "orderTotal([])", expected: 0 },
            { name: "a bad line stops the whole order", expr: "orderTotal([{ product: \"rice\", qty: 1 }, { product: \"bread\", qty: 1 }])", throws: "Unknown product: bread" },
          ],
          hints: [
            "`for (const entry of order) { ... }`",
            "Inside: `total = total + lineTotal(entry.product, entry.qty);`",
          ],
        } },
      ],
    },
    {
      id: "p1-s4",
      title: "Step 4 — The discount rule",
      blocks: [
        { type: "p", text: "Mama Achen's rule: orders of **UGX 500,000 or more** get **10% off**; orders of **UGX 200,000 or more** get **5% off**; smaller orders get no discount. Shillings have no useful smaller unit, so round the discount to a whole number with `Math.round`. (Computers store some decimals inexactly — `0.05` is not stored exactly — so rounding also removes tiny leftovers like `10000.000000000002`.)" },
        { type: "exercise", exercise: {
          id: "p1-s4-discount",
          title: "Write discountFor(total) and amountToPay(order)",
          brief: "Complete `discountFor(total)` so it returns the discount **amount** in UGX following the rule (check the bigger discount first). Then complete `amountToPay(order)`: the order total minus its discount.",
          starter: `${STEP3}
function discountFor(total) {
  return 0;
}

function amountToPay(order) {
  return orderTotal(order);
}
`,
          solution: STEP4,
          tests: [
            { name: "small order: no discount", expr: "discountFor(100000)", expected: 0 },
            { name: "exactly 200,000: 5%", expr: "discountFor(200000)", expected: 10000 },
            { name: "333,500: 5%", expr: "discountFor(333500)", expected: 16675 },
            { name: "exactly 500,000: 10%", expr: "discountFor(500000)", expected: 50000 },
            { name: "rounded to whole shillings", expr: "discountFor(1234567)", expected: 123457 },
            { name: "3 bags of rice to pay", expr: "amountToPay([{ product: \"rice\", qty: 3 }])", expected: 313500 },
          ],
          hints: [
            "Check `total >= 500000` first. If you check 200000 first, big orders would only get 5%.",
            "`return Math.round(total * 0.10);` — 10% is 0.10, 5% is 0.05.",
            "In amountToPay: `const total = orderTotal(order); return total - discountFor(total);`",
          ],
        } },
      ],
    },
    {
      id: "p1-s5",
      title: "Step 5 — A receipt people can read",
      blocks: [
        { type: "p", text: "`330000` is hard to read; `UGX 330,000` is not. Numbers have a built-in method, `toLocaleString`, that adds thousands separators. Pass a locale such as `\"en-US\"` so the result is always the same: with no argument it uses the device's language settings, and some languages use spaces or dots instead of commas." },
        { type: "p", text: "To build the receipt, collect the lines in an array with `push`, then join them with `lines.join(\"\\n\")` — `\"\\n\"` is the code for a line break." },
        { type: "code", lang: "text", code: SAMPLE_RECEIPT, caption: "receipt([{ product: \"rice\", qty: 3 }, { product: \"sugar\", qty: 2 }]) must return exactly this text." },
        { type: "exercise", exercise: {
          id: "p1-s5-receipt",
          title: "Write formatUGX(amount) and receipt(order)",
          brief: "Complete `formatUGX` so `1250000` becomes `\"UGX 1,250,000\"`. Then complete `receipt(order)` so it returns the lines shown above: the shop name, one line per entry in the form `3 x rice = UGX 330,000`, then Subtotal, Discount and To pay.",
          starter: `${STEP4}
function formatUGX(amount) {
  return "UGX " + amount;
}

function receipt(order) {
  const lines = [shopName];
  // add one line per entry, then Subtotal, Discount and To pay
  return lines.join("\\n");
}

console.log(receipt([{ product: "rice", qty: 3 }, { product: "sugar", qty: 2 }]));
`,
          solution: `${STEP5}
console.log(receipt([{ product: "rice", qty: 3 }, { product: "sugar", qty: 2 }]));
`,
          tests: [
            { name: "formats a large amount", expr: "formatUGX(1250000)", expected: "UGX 1,250,000" },
            { name: "formats zero", expr: "formatUGX(0)", expected: "UGX 0" },
            { name: "receipt with a discount", expr: "receipt([{ product: \"rice\", qty: 3 }, { product: \"sugar\", qty: 2 }])", expected: SAMPLE_RECEIPT },
            { name: "receipt without a discount", expr: "receipt([{ product: \"soap\", qty: 2 }])", expected: "Mama Achen's Shop\n2 x soap = UGX 9,000\nSubtotal: UGX 9,000\nDiscount: UGX 0\nTo pay: UGX 9,000" },
          ],
          hints: [
            "`return \"UGX \" + amount.toLocaleString(\"en-US\");`",
            "Loop over the order and `lines.push(entry.qty + \" x \" + entry.product + \" = \" + formatUGX(lineTotal(entry.product, entry.qty)));`",
            "After the loop, work out `subtotal` with orderTotal and `discount` with discountFor, then push the three summary lines.",
          ],
        } },
      ],
    },
    {
      id: "p1-s6",
      title: "Step 6 — Polite failure, and running it for real",
      blocks: [
        { type: "p", text: "The calculator throws errors for bad input, which is right for the code — but the shop assistant should see a polite message, not a crash. Wrap the receipt in `try` / `catch`." },
        { type: "exercise", exercise: {
          id: "p1-s6-safe-receipt",
          title: "Write safeReceipt(order)",
          brief: "Complete `safeReceipt(order)`: return `receipt(order)` normally, but if anything throws, return `\"Sorry: \"` followed by the error's message.",
          starter: `${STEP5}
function safeReceipt(order) {
  return receipt(order);
}
`,
          solution: STEP6,
          tests: [
            { name: "a good order gives the receipt", expr: "safeReceipt([{ product: \"soap\", qty: 2 }])", expected: "Mama Achen's Shop\n2 x soap = UGX 9,000\nSubtotal: UGX 9,000\nDiscount: UGX 0\nTo pay: UGX 9,000" },
            { name: "an unknown product gives a polite message", expr: "safeReceipt([{ product: \"bread\", qty: 1 }])", expected: "Sorry: Unknown product: bread" },
            { name: "a bad quantity gives a polite message", expr: "safeReceipt([{ product: \"rice\", qty: -1 }])", expected: "Sorry: Quantity must be a whole number above 0" },
          ],
          hints: [
            "`try { return receipt(order); } catch (err) { ... }`",
            "Inside catch: `return \"Sorry: \" + err.message;`",
          ],
        } },
        { type: "p", text: "**Run it on your own computer** (optional, when you have one set up as in Lesson 5). Create a folder, copy your finished code into `index.js`, add the two lines below at the end, and run `node index.js` in the terminal." },
        { type: "code", lang: "js", code: `// ...your finished code from steps 1–6 above...

console.log(safeReceipt([{ product: "rice", qty: 3 }, { product: "sugar", qty: 2 }]));
console.log(safeReceipt([{ product: "bread", qty: 1 }]));`, caption: "Expected output: the receipt from Step 5, then: Sorry: Unknown product: bread" },
        { type: "callout", tone: "tip", title: "Looking ahead", text: "In Module 6 you will hand `amountToPay` to an AI agent as a tool. The model will propose an order like `{ product: \"rice\", qty: 3 }`; your code — this code — will check it and do the arithmetic. That is why the input checks matter." },
      ],
    },
  ],
  commonErrors: [
    { error: "Total shows NaN", fix: "A price or quantity is undefined or text. Check the product name matches a key in PRICES exactly (lowercase), and that quantities are numbers, not strings like \"3\"." },
    { error: "ReferenceError: lineTotal is not defined", fix: "A step's code was deleted or renamed. Each step builds on the earlier ones; press Reset to restore the starter, which includes all earlier steps." },
    { error: "Big orders only get 5% off", fix: "In discountFor, the 200,000 check comes before the 500,000 check. The first true condition wins — test the bigger threshold first." },
    { error: "Receipt shows 330000 instead of 330,000, or spaces instead of commas", fix: "Use amount.toLocaleString(\"en-US\"). Without the locale, the result depends on the device's language settings." },
    { error: "Expected \"…\" but got \"…\" and they look the same", fix: "Look for a missing or extra space, a different capital letter, or a missing line. The test compares the text character by character." },
    { error: "Discount like 16675.000000000004", fix: "Wrap the calculation in Math.round(...). Decimals such as 0.05 cannot be stored exactly in binary." },
  ],
  completion: [
    "All six steps' exercises pass their tests.",
    "Your lineTotal refuses unknown products and bad quantities with clear error messages.",
    "The receipt prints amounts like UGX 323,000 and applies the discount rule correctly at the edges (exactly 200,000 and 500,000).",
    "You can explain which part of the code would become an agent tool, and why its input checks matter.",
  ],
};

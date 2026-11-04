import type { Lesson } from "../schema";

/* ======================================================================
   MODULE 2 — Learn Enough Programming to Build Agents
   Taught in JavaScript. Every exercise is checked by real tests in the
   browser sandbox; tests/unit/m02-exercises.test.ts verifies that every
   solution passes and every starter fails at least one test.
   ====================================================================== */

/* ---------------------------------------------------------------------- */
/*  LESSON 1 — What code is; variables; strings, numbers, booleans         */
/* ---------------------------------------------------------------------- */

const l1: Lesson = {
  id: "m2-l1",
  moduleId: "m2",
  title: "Your first lines of code",
  subtitle: "What code is, how a computer reads it, and the labelled containers (variables) that hold text, numbers and true/false.",
  minutes: 35,
  prerequisites: ["m1-l4"],
  objectives: [
    "Explain what code and a programming language are, and why this course uses JavaScript.",
    "Print output with `console.log`.",
    "Create variables with `const` and `let`, and change a `let` variable.",
    "Tell strings, numbers and booleans apart, and do arithmetic and comparisons.",
    "Recognise and fix the classic \"text plus number\" bug.",
  ],
  glossary: ["code", "programming-language", "javascript", "typescript", "python", "variable", "string", "number", "boolean", "console-log", "operator", "syntax-error", "bug"],
  completion: [
    "Step through the Variables program in the lab and make a prediction.",
    "Pass the runnable exercises (printing, containers, maths, building a message, fixing the stock bug).",
    "Pass the knowledge check (you can retry).",
    "Explain what a variable is in your own words.",
  ],
  tutor: {
    simpler:
      "Code is a list of instructions written in a language the computer can follow exactly. A variable is a box with a name written on it. You put something in the box (some text, a number, or yes/no) and later you use the name to get it back out.",
    altAnalogy:
      "A school register: each line has a label (the student's name) and a value (present/absent). A variable is one line of the register. Changing a `let` variable is like correcting a mark; a `const` is a line written in pen.",
    misconceptions: [
      "\"The computer understands what I mean.\" It does not. It follows exactly what you typed, so one missing quote mark stops the whole program.",
      "\"12 and \"12\" are the same.\" One is a number you can do maths with; the other is text. `\"12\" + 5` gives `\"125\"`, not 17.",
      "\"= means equals, like in maths.\" In JavaScript a single `=` means \"put this value into this container\". To compare, use `===`.",
      "\"const means the value can never change.\" It means the label can never be moved to a different value. (You will see in Lesson 2 that the inside of a const list can still change.)",
    ],
    probingQuestions: [
      "If `let bags = 10;` and then `bags = bags + 5;`, what is in the box, and why is the right-hand side worked out first?",
      "Why would a shop's code store a phone number as a string and not a number?",
      "What would you see if you forgot the closing quote in `console.log(\"Hello);`?",
    ],
    revisit: ["m0-l1", "m1-l4"],
  },
  sections: [
    /* A. THE PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "The stock book that does its own sums",
      blocks: [
        { type: "p", text: "Mama Achen keeps a stock book: a notebook with one line per product. Every evening she reads each line, subtracts what was sold, writes the new number, and works out which products are running low. It takes her forty minutes, and on a tired evening she sometimes writes 19 instead of 9." },
        { type: "p", text: "A computer could do those sums in a millionth of a second and never miscopy a number. But a computer cannot read her handwriting or guess what she means. Someone has to give it **exact instructions** in a language it can follow, and somewhere to **keep** each number while it works." },
        { type: "p", text: "Every AI agent you will build in this course is, underneath, ordinary code like this. The model suggests what to do; **your code** stores the facts, does the sums and checks the rules. So before agents, you need to be able to write a few lines of real code." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What is code, how does the computer read it, and how do we store and change information like \"12 bags of rice\" inside a program?" },
      ],
    },

    /* B. THE ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "Labelled containers on a shelf",
      blocks: [
        { type: "p", text: "Picture the shelf behind Mama Achen's counter. On it are containers, each with a label written on masking tape: **shopName**, **riceBags**, **isOpen**. Inside each container is one thing: a card with the shop's name, a number, or a little sign that says either YES or NO." },
        { type: "steps", items: [
          { title: "Make a container and label it.", text: "`let riceBags = 12;` means: take a container, write riceBags on it, put 12 inside." },
          { title: "Use the label to read what is inside.", text: "Whenever the code says `riceBags`, the computer looks in that container and uses whatever is there right now." },
          { title: "Replace what is inside.", text: "`riceBags = 9;` empties the container and puts 9 in. The label stays the same." },
          { title: "Some labels are written in pen.", text: "A container made with `const` can never be given a different value. Use `const` by default and `let` only when the value must change." },
        ] },
        { type: "analogyMap", title: "From the shelf to code", pairs: [
          { everyday: "A labelled container", technical: "A [[variable|variable]]" },
          { everyday: "The words on the label", technical: "The variable's name, e.g. `riceBags`" },
          { everyday: "A card with words on it", technical: "A [[string|string]] (text), written in quotes: `\"Mama Achen's Shop\"`" },
          { everyday: "A number you can add up", technical: "A [[number|number]]: `12`, `110000`, `2.5`" },
          { everyday: "A YES / NO sign", technical: "A [[boolean|boolean]]: `true` or `false`" },
          { everyday: "Writing the label in pen vs pencil", technical: "`const` (cannot be reassigned) vs `let` (can be reassigned)" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Real containers can hold many things at once; a simple variable holds exactly **one** value. Also, two labels can point at the **same** list or record (you will meet this in Lesson 2), which has no neat shelf equivalent. And the computer forgets the whole shelf when the program finishes, unless you save the values somewhere." },
      ],
    },

    /* C. THE VISUALISATION */
    {
      kind: "visual",
      mode: "experiment",
      title: "Watch the containers fill",
      blocks: [
        { type: "p", text: "Below is a real seven-line program. Press **Step** to run it one line at a time. Watch the containers appear on the right, watch one of them change, and see what gets printed. On line 4 you will be asked to predict before you can continue." },
        { type: "lab", lab: "code-tracer", props: { scenario: "variables" }, required: true, caption: "The code is real JavaScript. The step-by-step view is a recording made for teaching, checked against what the code really prints." },
        { type: "callout", tone: "sim", text: "A real computer runs all seven lines in a few millionths of a second without stopping. We slowed it down and drew the containers so you can see what is happening inside. The output shown is exactly what the real code prints." },
      ],
    },

    /* D. THE TECHNICAL EXPLANATION */
    {
      kind: "technical",
      mode: "understand",
      title: "Code, languages and values",
      blocks: [
        { type: "p", text: "[[code|Code]] is text written in a [[programming-language|programming language]]: a language with strict rules so that every instruction has exactly one meaning. A program called an interpreter or compiler turns that text into steps the processor can carry out. The computer runs the lines **from top to bottom**, one after another, unless the code tells it to jump somewhere else (you will learn how in Lesson 3)." },
        { type: "p", text: "This course uses [[javascript|JavaScript]]. It runs in every web browser and, through [[nodejs|Node.js]], on servers — which is where agents usually run. Two related languages you will hear about:" },
        { type: "list", items: [
          "[[typescript|TypeScript]] is JavaScript plus **types**: labels saying what kind of value each variable may hold, checked before the program runs. This app you are using is written in TypeScript. Everything you learn here carries straight over.",
          "[[python|Python]] is also very widely used in AI engineering, especially for data and model work. The ideas — variables, functions, loops, JSON — are the same; only the spelling differs.",
        ] },
        { type: "p", text: "**Printing.** `console.log(...)` writes values to the output (the [[console-log|console]]). It is how you see what your program is doing. You can pass several values separated by commas; they are printed with spaces between them." },
        { type: "p", text: "**Variables.** `const name = value;` creates a [[variable|variable]] that can never be reassigned. `let name = value;` creates one you can change later with `name = newValue;`. Names cannot contain spaces, so programmers write `riceBags` (\"camelCase\"). Names are case-sensitive: `riceBags` and `ricebags` are two different variables. (You may also see the old keyword `var` in older code; avoid it.)" },
        { type: "table", caption: "The three basic kinds of value", head: ["Kind", "Examples", "Notes"], rows: [
          ["string (text)", "\"Nakato\", 'rice', \"0700 123456\"", "Always in quotes. Use double or single quotes, but the same at both ends."],
          ["number", "12, 110000, 2.5, -3", "No quotes and no commas. JavaScript has one number kind for whole and decimal numbers."],
          ["boolean", "true, false", "Only these two values. No quotes. Usually the answer to a yes/no question."],
        ] },
        { type: "p", text: "**Operators** combine values. Arithmetic: `+` `-` `*` (multiply) `/` (divide). Comparisons give a boolean: `===` (is equal to), `!==` (is not equal to), `<`, `>`, `<=`, `>=`. Logic: `&&` (and), `||` (or), `!` (not). For example `riceBags < 10 && isOpen` is true only when both parts are true." },
        { type: "p", text: "**Building text.** `+` joins strings: `\"Hello \" + name`. A neater way is a **template literal**: text between backticks (the key usually above Tab) with values inserted inside a dollar sign and curly braces. The example below shows both." },
        { type: "callout", tone: "misconception", text: "A single `=` is not \"equals\". It means **put the value on the right into the container on the left**. That is why `riceBags = riceBags - 3;` makes sense in code even though it is nonsense in maths: the computer works out the right side first using the current value, then stores the result." },
      ],
    },

    /* E. THE WORKING EXAMPLE */
    {
      kind: "example",
      mode: "build",
      title: "A complete tiny program",
      blocks: [
        { type: "p", text: "This program is complete and correct. You could save it in a file called `stock.js` and run it with Node.js on your own computer (Lesson 5 shows how). Read the notes, then run your own first line below." },
        { type: "code", lang: "js", code: `const shopName = "Mama Achen's Shop";
let riceBags = 12;
const pricePerBag = 110000;

riceBags = riceBags - 3;           // 3 bags sold
const stockValue = riceBags * pricePerBag;
const isLow = riceBags < 10;

console.log(shopName, "has", riceBags, "bags");
console.log(\`Rice in stock is worth UGX \${stockValue}\`);
console.log("Reorder rice?", isLow);`, notes: [
          { line: 1, text: "A string. The apostrophe in Achen's is fine because the text is wrapped in double quotes." },
          { line: 2, text: "`let`, because the number of bags will change." },
          { line: 5, text: "Text after `//` is a comment: a note for humans that the computer ignores." },
          { line: 6, text: "`*` multiplies: 9 × 110000 = 990000." },
          { line: 7, text: "A comparison produces a boolean: 9 < 10 is `true`." },
          { line: 10, text: "A template literal: the value of `stockValue` is inserted where the dollar-and-braces part is. Prints: Rice in stock is worth UGX 990000" },
        ] },
        { type: "exercise", exercise: {
          id: "m2-l1-first-line",
          title: "Your first line of code",
          brief: "Make the program print exactly `Hello, Kampala!` (capital H and K, a comma, and an exclamation mark). Use `console.log` and put the text in quotes. Then press **Run & check**.",
          starter: `// Lines that start with // are comments: notes for humans.
// The computer ignores them.

// Write your code on the next line:
`,
          solution: `// Lines that start with // are comments: notes for humans.
// The computer ignores them.

// Write your code on the next line:
console.log("Hello, Kampala!");
`,
          tests: [
            { name: "prints Hello, Kampala!", expr: "true", logIncludes: "Hello, Kampala!" },
          ],
          hints: [
            "The pattern is `console.log(\"your text\");`",
            "Check the brackets: one ( after log and one ) at the end. The quotes go inside the brackets.",
            "Copy the text exactly: `Hello, Kampala!` — computers notice every comma and capital letter.",
          ],
        } },
      ],
    },

    /* F. THE CHALLENGE */
    {
      kind: "challenge",
      mode: "build",
      title: "Fill the containers",
      blocks: [
        { type: "p", text: "Three short exercises, each a little harder. Your code runs in your own browser and real tests check it. If you get stuck, open a hint; after three tries you can see a solution — but try to write it yourself first." },
        { type: "exercise", exercise: {
          id: "m2-l1-containers",
          title: "1. Three kinds of value",
          brief: "Put the right value into each container: the **string** `Mama Achen's Shop`, the **number** 12, and the **boolean** true. Watch out: `\"12\"` (in quotes) is text, not a number.",
          starter: `const shopName = "";   // the text: Mama Achen's Shop
const riceStock = "0"; // the number 12 (no quotes!)
const isOpen = false;  // the shop IS open
`,
          solution: `const shopName = "Mama Achen's Shop";
const riceStock = 12;
const isOpen = true;
`,
          tests: [
            { name: "shopName holds the shop's name", expr: "shopName", expected: "Mama Achen's Shop" },
            { name: "riceStock is a number, not text", expr: "typeof riceStock", expected: "number" },
            { name: "riceStock is 12", expr: "riceStock", expected: 12 },
            { name: "isOpen is the boolean true", expr: "isOpen", expected: true },
          ],
          hints: [
            "Strings go inside quotes. Numbers and booleans do not.",
            "Remove the quotes around the number: `const riceStock = 12;`",
            "`true` and `false` are written without quotes.",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l1-sugar-maths",
          title: "2. Selling sugar",
          brief: "A customer buys 3 kg of sugar at UGX 5,000 per kg and pays with UGX 20,000. Calculate `total`, `change`, and `canAfford` (true if the money given is **at least** the total). Use the variables — do not type the answers in directly, so the code still works if the price changes.",
          starter: `const pricePerKg = 5000;
const kilograms = 3;
const moneyGiven = 20000;

const total = 0;          // price per kg times kilograms
const change = 0;         // money given minus total
const canAfford = false;  // is moneyGiven at least total?

console.log("Total:", total, "Change:", change, "OK?", canAfford);
`,
          solution: `const pricePerKg = 5000;
const kilograms = 3;
const moneyGiven = 20000;

const total = pricePerKg * kilograms;
const change = moneyGiven - total;
const canAfford = moneyGiven >= total;

console.log("Total:", total, "Change:", change, "OK?", canAfford);
`,
          tests: [
            { name: "total is 15000", expr: "total", expected: 15000 },
            { name: "change is 5000", expr: "change", expected: 5000 },
            { name: "canAfford is true", expr: "canAfford", expected: true },
            { name: "prints the result", expr: "true", logIncludes: "Total: 15000 Change: 5000 OK? true" },
          ],
          hints: [
            "Multiply with `*`: `const total = pricePerKg * kilograms;`",
            "Subtract with `-`. You can use `total` in the next line because it was created above.",
            "\"At least\" means greater than or equal to: `>=`. A comparison already gives true or false, so you do not need to write true yourself.",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l1-greeting",
          title: "3. Build a message",
          brief: "Build the text `Hello Okello, your total is UGX 15000.` from the two variables, store it in `message`, and print it. Use `+` to join pieces, or a template literal with backticks. Mind the spaces and the full stop.",
          starter: `const customerName = "Okello";
const total = 15000;

const message = "";

console.log(message);
`,
          solution: `const customerName = "Okello";
const total = 15000;

const message = \`Hello \${customerName}, your total is UGX \${total}.\`;

console.log(message);
`,
          tests: [
            { name: "message is built correctly", expr: "message", expected: "Hello Okello, your total is UGX 15000." },
            { name: "message is printed", expr: "true", logIncludes: "Hello Okello, your total is UGX 15000." },
          ],
          hints: [
            "With +: `\"Hello \" + customerName + \", your total is UGX \" + total + \".\"`",
            "Spaces inside the quotes matter. Read your output carefully against the expected text.",
            "With a template literal: wrap the whole sentence in backticks and put each variable inside a dollar sign and curly braces.",
          ],
        } },
      ],
    },

    /* G. WHAT CAN GO WRONG */
    {
      kind: "failure",
      mode: "experiment",
      title: "When 12 + 5 = 125",
      blocks: [
        { type: "p", text: "Information that comes from a form, a text message, a file or an AI model usually arrives as **text**, even when it looks like a number. And `+` behaves differently for text: it **joins** instead of adding. So `\"12\" + 5` gives `\"125\"`. No error appears; the program just quietly produces a wrong answer. This is a [[bug|bug]]." },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "A total that is suspiciously long (125 instead of 17), or a number that seems to have another number glued on the end. Check with `typeof value` — it tells you `\"string\"` or `\"number\"`." },
        { type: "exercise", exercise: {
          id: "m2-l1-fix-stock",
          title: "Fix the stock bug",
          brief: "The stock count arrives from a form as the **text** `\"12\"`. Five more bags are delivered, but the program prints `125`. Fix line 4 so `stockAfter` is the number 17. Hint: `Number(\"12\")` turns text into a number.",
          starter: `const stockText = "12"; // arrived from a form, so it is TEXT
const delivered = 5;

const stockAfter = stockText + delivered;

console.log("Stock now:", stockAfter);
`,
          solution: `const stockText = "12"; // arrived from a form, so it is TEXT
const delivered = 5;

const stockAfter = Number(stockText) + delivered;

console.log("Stock now:", stockAfter);
`,
          tests: [
            { name: "stockAfter is 17", expr: "stockAfter", expected: 17 },
            { name: "stockAfter is a number", expr: "typeof stockAfter", expected: "number" },
          ],
          hints: [
            "Run it first and look at the output. Why 125?",
            "Convert the text before adding: `Number(stockText)`.",
          ],
        } },
        { type: "p", text: "The other common failure is a [[syntax-error|syntax error]]: code that breaks the language's rules, such as a missing quote or bracket. The program does not run at all, and you get a message such as `SyntaxError: Invalid or unexpected token` or `missing ) after argument list` (the wording depends on where the code runs). Read the message, look at the line it points to, and check the line just before it too." },
        { type: "code", lang: "js", code: `console.log("Hello);       // missing closing quote  -> SyntaxError
const price = 5000;
price = 6000;               // TypeError: Assignment to constant variable.
console.log(Price);         // ReferenceError: Price is not defined (capital P!)`, caption: "Three mistakes beginners make every day. Each message tells you what went wrong." },
      ],
    },

    /* H. KNOWLEDGE CHECK */
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "Which of these is a **string**?",
            options: [
              { text: "`12`", why: "No quotes, so this is a number." },
              { text: "`\"12\"`", why: "Correct. It is in quotes, so it is text — even though it looks like a number." },
              { text: "`true`", why: "This is a boolean. With quotes (\"true\") it would be a string." },
              { text: "`riceBags`", why: "Without quotes this is the name of a variable, not text." },
            ],
            answer: 1,
            hint: "What do strings always have around them?",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "What does this print?",
            code: "let bags = 10;\nbags = bags + 5;\nconsole.log(bags);",
            options: [
              { text: "10", why: "Line 2 changed the value before it was printed." },
              { text: "15", why: "Correct. The right side (10 + 5) is worked out first, then stored back in bags." },
              { text: "bags + 5", why: "The computer works out expressions; it does not print the code itself." },
              { text: "An error, because bags cannot equal bags + 5", why: "In code, = means \"store\", not \"is equal to\", so this is fine." },
            ],
            answer: 1,
            hint: "Work out the right-hand side using the current value, then store it.",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "This code crashes with `TypeError: Assignment to constant variable.` What is the best fix?",
            code: "const price = 5000;\nprice = 6000;",
            options: [
              { text: "Change `const` to `let` on line 1, because the price needs to change.", why: "Correct. `let` allows reassignment; `const` does not." },
              { text: "Put quotes around 6000.", why: "That would make it a string, and it would still be a const." },
              { text: "Delete line 2.", why: "That hides the crash but loses the price change the program needed." },
              { text: "Write `price == 6000` instead.", why: "That compares instead of storing, so the price would never change." },
            ],
            answer: 0,
            hint: "Which keyword creates a container whose value may change?",
          },
          {
            id: "q4", type: "multi", flavour: "recall",
            prompt: "Which of these produce the **boolean** value `true`? Select all that apply.",
            options: [
              { text: "`true`", why: "Yes — the boolean itself." },
              { text: "`5 > 3`", why: "Yes — a comparison produces a boolean, and 5 is greater than 3." },
              { text: "`\"true\"`", why: "No — in quotes it is a four-letter string." },
              { text: "`9 <= 9`", why: "Yes — 9 is less than or equal to 9." },
            ],
            answers: [0, 1, 3],
            hint: "Strings are in quotes. Comparisons produce true or false.",
          },
          {
            id: "q5", type: "mcq", flavour: "analogy",
            prompt: "In the labelled-containers picture, what does `riceBags = 9;` do?",
            options: [
              { text: "Makes a second container also called riceBags.", why: "No — the label already exists; it is reused." },
              { text: "Empties the container labelled riceBags and puts 9 in it.", why: "Correct. The label stays; the contents are replaced." },
              { text: "Writes a new label on the container.", why: "The label (the name) never changes; the value inside does." },
              { text: "Checks whether the container holds 9.", why: "Checking is `===`. A single = stores." },
            ],
            answer: 1,
            hint: "A single = means store.",
          },
          {
            id: "q6", type: "mcq", flavour: "predict",
            prompt: "What does `console.log(\"3\" + 4)` print?",
            options: [
              { text: "7", why: "That would happen with two numbers. \"3\" is text." },
              { text: "34", why: "Correct. With a string involved, + joins the text: \"3\" and \"4\" become \"34\"." },
              { text: "An error", why: "JavaScript does not complain here — that is exactly why this bug is sneaky." },
            ],
            answer: 1,
            hint: "Is \"3\" a number or text?",
          },
        ] },
      ],
    },

    /* I. TEACH IT BACK */
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Your younger sister asks: \"What is a variable, and why did the computer say 12 + 5 is 125?\" Explain in your own words.",
          rubric: [
            { concept: "A variable is a named container holding a value", keywords: ["container", "box", "label", "name", "store", "holds"], hint: "Describe what a variable is using the container idea." },
            { concept: "Values have kinds: text (string), number, true/false (boolean)", keywords: ["string", "text", "number", "boolean", "true", "false", "kind", "type"], hint: "Name the kinds of value." },
            { concept: "Text in quotes is not a number, so + joins instead of adding", keywords: ["quote", "join", "glue", "stick", "text", "string"], hint: "Explain why \"12\" + 5 gives 125." },
            { concept: "The fix is converting the text to a number", keywords: ["Number(", "convert", "turn it into a number", "change it to a number"], hint: "How do you fix it?" },
          ],
          exemplar: "A variable is like a container on a shelf with a name written on it, such as riceBags. You put a value inside — some text, a number, or true/false — and later use the name to get the value back. Text is called a string and is always written in quotes. The problem was that \"12\" came in quotes, so it was text, not a number. When you use + with text, the computer sticks the pieces together instead of adding, so \"12\" + 5 became \"125\". To fix it, convert the text into a number first with Number(\"12\"), and then 12 + 5 gives 17.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "**Code** is exact instructions in a programming language, run from top to bottom. A **variable** is a labelled container: `const` for values that never get reassigned, `let` for values that change. Values come in kinds — **strings** (text in quotes), **numbers** and **booleans** (true/false). `=` stores; `===` compares. Text that looks like a number is still text until you convert it.",
          canNow: [
            "Print output with `console.log`.",
            "Create, read and change variables.",
            "Do arithmetic and comparisons, and build messages from variables.",
            "Spot and fix the text-plus-number bug.",
          ],
          next: "One container per fact gets messy fast. Next you will group facts into lists and records — and meet JSON, the format agents and AI models use to exchange data.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  LESSON 2 — Arrays, objects and JSON                                    */
/* ---------------------------------------------------------------------- */

const l2: Lesson = {
  id: "m2-l2",
  moduleId: "m2",
  title: "Lists, records and JSON",
  subtitle: "Group many values together: arrays for ordered lists, objects for structured records, and JSON for sending them between programs.",
  minutes: 35,
  prerequisites: ["m2-l1"],
  objectives: [
    "Create an array, read an item by its index, find its length and add to it with `push`.",
    "Create an object (a record) with properties, read them with dot notation and change them.",
    "Combine the two: a list of product records.",
    "Turn an object into JSON text with `JSON.stringify` and back with `JSON.parse`.",
    "Recognise and fix invalid JSON.",
  ],
  glossary: ["array", "array-index", "object", "property", "json", "undefined", "variable", "string"],
  completion: [
    "Step through the Objects & arrays program in the lab.",
    "Pass the runnable exercises (product list, customer record, stock book, JSON in and out, broken JSON).",
    "Pass the knowledge check.",
    "Explain why agents and AI APIs use JSON.",
  ],
  tutor: {
    simpler:
      "An array is a numbered list, like an order slip: item 0, item 1, item 2. An object is a form with named boxes: name, phone, balance. JSON is how you write that list or form down as plain text so another program can read it.",
    altAnalogy:
      "A school's student file: each student has a card (an object) with fields like name, class and fees paid. The drawer of cards in order is an array. Photocopying a card to send to another school is like JSON.stringify; the other school typing it into their system is JSON.parse.",
    misconceptions: [
      "\"The first item is item 1.\" In JavaScript the first item is at index 0, so the last item is at index length - 1.",
      "\"const means the list can never change.\" `const` stops you pointing the label at a different list; you can still push into the list or change an object's property.",
      "\"JSON is the same as a JavaScript object.\" JSON is text with stricter rules (double quotes everywhere, no trailing commas, no comments). You must parse it to get an object.",
      "\"A missing property causes an error.\" Reading a property that does not exist gives `undefined` silently — often the start of a confusing bug.",
    ],
    probingQuestions: [
      "If an array has 5 items, what is the index of the last one? Why?",
      "Why would we store a customer as one object instead of four separate variables?",
      "An AI model returns `{'item': 'rice'}`. Will JSON.parse accept it? Why not?",
    ],
    revisit: ["m2-l1"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Forty products, two hundred customers",
      blocks: [
        { type: "p", text: "Mama Achen sells about forty products and has around two hundred regular customers. If every fact needed its own variable — `riceName`, `ricePrice`, `riceBags`, `sugarName`, `sugarPrice`... — the program would need hundreds of variables, and adding a product would mean rewriting code." },
        { type: "p", text: "She also wants her shop system to send an order to a boda-boda rider's phone app, and later to an AI model. Those are **different programs**, possibly on different computers. They need an agreed way to write the order down as text so the other side can read it back exactly." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How do programs keep lists of things and structured records together — and how do they send that information to other programs?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "Order slips and customer cards",
      blocks: [
        { type: "p", text: "Two familiar paper objects explain most of this lesson." },
        { type: "steps", items: [
          { title: "The order slip (an array).", text: "A numbered list: line 0 rice, line 1 sugar, line 2 soap. The order matters, you can add lines at the bottom, and you can ask \"how many lines?\"" },
          { title: "The customer card (an object).", text: "A card with named boxes: Name: Nakato. Phone: 0700 123456. Balance: 15,000. You look things up by the box's **name**, not by position." },
          { title: "The drawer of cards (an array of objects).", text: "Many cards in order — the stock book is exactly this: one record per product." },
          { title: "The photocopy you post (JSON).", text: "To send a card to another office you copy it onto paper in a standard layout. The other office reads the copy and makes its own card. That standard written layout is JSON." },
        ] },
        { type: "analogyMap", title: "From paper to code", pairs: [
          { everyday: "An order slip with numbered lines", technical: "An [[array|array]]: `[\"rice\", \"sugar\", \"soap\"]`" },
          { everyday: "The line number on the slip (starting from 0!)", technical: "An [[array-index|index]]: `basket[0]` is the first item" },
          { everyday: "A customer card with named boxes", technical: "An [[object|object]]: `{ name: \"Nakato\", balance: 15000 }`" },
          { everyday: "One named box on the card", technical: "A [[property|property]], read with a dot: `customer.balance`" },
          { everyday: "A standard photocopy layout for posting", technical: "[[json|JSON]] text, made with `JSON.stringify` and read with `JSON.parse`" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Paper slips number lines from 1; arrays start at **0**. And unlike paper, two variables can point at the **same** list in memory: change it through one name and the other name sees the change too, because there is only one list." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "See a record and a list change",
      blocks: [
        { type: "p", text: "Step through a program that creates a customer record and a basket, changes both, and finally turns the record into JSON text. Watch how the record keeps its shape and how the JSON version is a single string." },
        { type: "lab", lab: "code-tracer", props: { scenario: "objects" }, required: true, caption: "Real code; recorded steps. The final output matches what the code really prints." },
        { type: "callout", tone: "sim", text: "The drawing of containers is a teaching aid. Real JavaScript stores objects and arrays in memory in a more complicated way, but the behaviour you see — what changes and what gets printed — is exact." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "Arrays, objects and JSON precisely",
      blocks: [
        { type: "p", text: "**Arrays.** Square brackets, items separated by commas: `const basket = [\"rice\", \"sugar\"];`. Read an item with its [[array-index|index]]: `basket[0]` is `\"rice\"`. `basket.length` is the number of items (2). `basket.push(\"soap\")` adds to the end. Reading past the end, like `basket[10]`, gives [[undefined|undefined]] rather than an error." },
        { type: "p", text: "**Objects.** Curly braces holding `name: value` pairs called [[property|properties]]: `const customer = { name: \"Nakato\", balance: 15000 };`. Read with a dot: `customer.name`. Change with `customer.balance = 10000;`. Add a new property the same way. If the property name is in a variable, use square brackets: `customer[field]`." },
        { type: "p", text: "Values can be anything — including other arrays and objects. A list of products is an array of objects, and you combine the two ways of reading: `stock[1].priceUGX` means \"the second record, its priceUGX box\"." },
        { type: "callout", tone: "misconception", text: "`const basket = [...]` does **not** freeze the list. `const` only means the name `basket` will always point at this same list. `basket.push(...)` is allowed; `basket = [...]` (a different list) is not." },
        { type: "p", text: "**JSON** (JavaScript Object Notation) is a text format for data. It looks almost like JavaScript, with stricter rules:" },
        { type: "list", items: [
          "Property names and strings use **double quotes** only: `{\"name\": \"Rice\"}`.",
          "No trailing comma after the last item, and no comments.",
          "Values can only be strings, numbers, `true`, `false`, `null`, arrays and objects — no functions, no `undefined`.",
        ] },
        { type: "p", text: "`JSON.stringify(value)` turns a value into JSON text (add `null, 2` as extra arguments for neat indentation). `JSON.parse(text)` turns JSON text back into a value, and **throws an error** if the text breaks the rules." },
        { type: "table", caption: "Why this matters for agents", head: ["Where you meet JSON", "Example"], rows: [
          ["Sending a request to an AI model's API", "The messages and settings are sent as JSON."],
          ["A model asking to use a tool", "The tool name and its arguments arrive as JSON text you must parse and check."],
          ["Config files", "package.json describes every JavaScript project (Lesson 5)."],
          ["Saving data", "Many databases and files store records as JSON."],
        ] },
      ],
    },
    {
      kind: "example",
      mode: "build",
      title: "A stock book in code",
      blocks: [
        { type: "code", lang: "js", code: `const stock = [
  { name: "rice", priceUGX: 110000, bags: 12 },
  { name: "sugar", priceUGX: 5000, bags: 40 },
];

stock.push({ name: "soap", priceUGX: 4500, bags: 0 });
stock[0].bags = stock[0].bags - 3;

console.log(stock.length);          // 3
console.log(stock[0].bags);         // 9
console.log(stock[2].name);         // soap

const text = JSON.stringify(stock[1]);
console.log(text);                  // {"name":"sugar","priceUGX":5000,"bags":40}

const back = JSON.parse(text);
console.log(back.priceUGX + 1000);  // 6000`, notes: [
          { line: 1, text: "An array of objects: each line inside is one product record." },
          { line: 6, text: "`push` adds a third record at the end." },
          { line: 7, text: "`stock[0]` is the rice record; `.bags` is its bags box. 12 - 3 = 9." },
          { line: 13, text: "`JSON.stringify` gives a string. Notice every name now has double quotes." },
          { line: 16, text: "`JSON.parse` gives back a real object, so `.priceUGX` is a number you can do maths with." },
        ] },
      ],
    },
    {
      kind: "challenge",
      mode: "build",
      title: "Lists and records",
      blocks: [
        { type: "exercise", exercise: {
          id: "m2-l2-list",
          title: "1. The product list",
          brief: "Add `\"salt\"` to the **end** of `products`. Then store the first product in `firstProduct`, and the number of products in `count`. Use the array — do not type `\"rice\"` or `4` yourself.",
          starter: `const products = ["rice", "sugar", "soap"];

// 1. Add "salt" to the end of the list


// 2. The first product
const firstProduct = "";

// 3. How many products there are now
const count = 0;
`,
          solution: `const products = ["rice", "sugar", "soap"];

// 1. Add "salt" to the end of the list
products.push("salt");

// 2. The first product
const firstProduct = products[0];

// 3. How many products there are now
const count = products.length;
`,
          tests: [
            { name: "salt is added at the end", expr: "products", expected: ["rice", "sugar", "soap", "salt"] },
            { name: "firstProduct is rice", expr: "firstProduct", expected: "rice" },
            { name: "count is 4", expr: "count", expected: 4 },
          ],
          hints: [
            "`products.push(\"salt\");` adds to the end.",
            "The first item is at index 0: `products[0]`.",
            "`products.length` counts the items. Make sure it comes after the push.",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l2-customer",
          title: "2. A customer record",
          brief: "Create Nakato's record with four properties: `name` `\"Nakato\"`, `phone` `\"0700 123456\"`, `balance` `15000` and `isRegular` `true`. Then she pays UGX 5,000: on a **separate line**, reduce `customer.balance` by 5000 (do not retype the object).",
          starter: `const customer = {};

// She pays 5000. Reduce her balance on the next line:
`,
          solution: `const customer = {
  name: "Nakato",
  phone: "0700 123456",
  balance: 15000,
  isRegular: true,
};

// She pays 5000. Reduce her balance on the next line:
customer.balance = customer.balance - 5000;
`,
          tests: [
            { name: "name is Nakato", expr: "customer.name", expected: "Nakato" },
            { name: "phone is stored as text", expr: "customer.phone", expected: "0700 123456" },
            { name: "isRegular is true", expr: "customer.isRegular", expected: true },
            { name: "balance is now 10000", expr: "customer.balance", expected: 10000 },
          ],
          hints: [
            "Inside the braces write `name: \"Nakato\",` then the next property, each followed by a comma.",
            "Phone numbers are stored as strings: they can start with 0 and you never do maths with them.",
            "`customer.balance = customer.balance - 5000;`",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l2-stock-book",
          title: "3. Reading the stock book",
          brief: "Use the `stock` list to fill in `sugarPrice` and `lastName` (the name of the **last** product — use `stock.length` so it would still work if more products were added). Then soap is restocked: set soap's `bags` to 25.",
          starter: `const stock = [
  { name: "rice", priceUGX: 110000, bags: 12 },
  { name: "sugar", priceUGX: 5000, bags: 40 },
  { name: "soap", priceUGX: 4500, bags: 0 },
];

const sugarPrice = 0;   // read it from the list
const lastName = "";    // name of the LAST product

// Soap was restocked with 25 bars:
`,
          solution: `const stock = [
  { name: "rice", priceUGX: 110000, bags: 12 },
  { name: "sugar", priceUGX: 5000, bags: 40 },
  { name: "soap", priceUGX: 4500, bags: 0 },
];

const sugarPrice = stock[1].priceUGX;
const lastName = stock[stock.length - 1].name;

// Soap was restocked with 25 bars:
stock[2].bags = 25;
`,
          tests: [
            { name: "sugarPrice is 5000", expr: "sugarPrice", expected: 5000 },
            { name: "lastName is soap", expr: "lastName", expected: "soap" },
            { name: "soap now has 25", expr: "stock[2].bags", expected: 25 },
            { name: "the list still has 3 products", expr: "stock.length", expected: 3 },
          ],
          hints: [
            "Sugar is the second record, so its index is 1: `stock[1]`. Then `.priceUGX`.",
            "The last index is always `stock.length - 1`.",
            "`stock[2].bags = 25;`",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l2-json",
          title: "4. JSON out and in",
          brief: "First, turn `order` into JSON text and store it in `orderText`. Second, a message arrived as JSON text in `incoming`: parse it into `received`. Third, store how many items are in the received order in `itemCount`.",
          starter: `const order = { customer: "Okello", items: ["rice", "oil"], paid: false };

// 1. Turn order into JSON text
const orderText = "";

// 2. Turn this JSON text back into an object
const incoming = '{"customer":"Achen","items":["sugar","soap","salt"],"paid":true}';
const received = null;

// 3. How many items did Achen order?
const itemCount = 0;
`,
          solution: `const order = { customer: "Okello", items: ["rice", "oil"], paid: false };

// 1. Turn order into JSON text
const orderText = JSON.stringify(order);

// 2. Turn this JSON text back into an object
const incoming = '{"customer":"Achen","items":["sugar","soap","salt"],"paid":true}';
const received = JSON.parse(incoming);

// 3. How many items did Achen order?
const itemCount = received.items.length;
`,
          tests: [
            { name: "orderText is a string", expr: "typeof orderText", expected: "string" },
            { name: "orderText is the exact JSON", expr: "orderText", expected: "{\"customer\":\"Okello\",\"items\":[\"rice\",\"oil\"],\"paid\":false}" },
            { name: "received.customer is Achen", expr: "received.customer", expected: "Achen" },
            { name: "received.paid is the boolean true", expr: "received.paid", expected: true },
            { name: "itemCount is 3", expr: "itemCount", expected: 3 },
          ],
          hints: [
            "`JSON.stringify(order)` makes the text.",
            "`JSON.parse(incoming)` makes the object.",
            "`received.items` is an array, so it has a `.length`.",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "Broken JSON and missing properties",
      blocks: [
        { type: "p", text: "JSON written by hand — or produced by an AI model — is often **almost** right. `JSON.parse` is strict: one single quote or one extra comma and it throws a `SyntaxError`, stopping the program. In Module 4 you will see that models sometimes produce exactly these mistakes, which is why agent code always checks model output." },
        { type: "exercise", exercise: {
          id: "m2-l2-fix-json",
          title: "Fix the hand-typed JSON",
          brief: "Run this first and read the error. The JSON text in `raw` breaks **three** JSON rules. Fix the text (not the parse line) so `product` is parsed correctly.",
          starter: `const raw = "{'name': 'Rice', 'priceUGX': 110000,}";

const product = JSON.parse(raw);
console.log(product.name, product.priceUGX);
`,
          solution: `const raw = '{"name": "Rice", "priceUGX": 110000}';

const product = JSON.parse(raw);
console.log(product.name, product.priceUGX);
`,
          tests: [
            { name: "product.name is Rice", expr: "product.name", expected: "Rice" },
            { name: "product.priceUGX is the number 110000", expr: "product.priceUGX", expected: 110000 },
          ],
          hints: [
            "JSON needs double quotes around names and strings, never single quotes.",
            "Because the JSON now contains double quotes, wrap the whole JavaScript string in single quotes: `'{\"name\": ...}'`",
            "Remove the comma after the last value.",
          ],
        } },
        { type: "p", text: "A quieter failure: reading a property that does not exist. `customer.Name` (capital N) or `customer.balanse` (typo) gives `undefined` — no error. Then `undefined - 5000` gives `NaN` (\"Not a Number\"), and the bug shows up far from where it started." },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "`undefined` or `NaN` appearing in output. Print the whole object with `console.log(customer)` and compare the property names letter by letter. Reading a property of `undefined` itself — such as `stock[5].name` on a 3-item list — does crash, with `TypeError: Cannot read properties of undefined`." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "predict",
            prompt: "What does this print?",
            code: "const basket = [\"rice\", \"sugar\", \"soap\"];\nconsole.log(basket[1]);",
            options: [
              { text: "rice", why: "rice is at index 0." },
              { text: "sugar", why: "Correct. Counting starts at 0, so index 1 is the second item." },
              { text: "soap", why: "soap is at index 2." },
              { text: "undefined", why: "Index 1 exists in a 3-item list." },
            ],
            answer: 1,
            hint: "What index does the first item have?",
          },
          {
            id: "q2", type: "mcq", flavour: "recall",
            prompt: "How do you read Nakato's balance from `const customer = { name: \"Nakato\", balance: 15000 };`?",
            options: [
              { text: "`customer[1]`", why: "Objects are read by property name, not by position." },
              { text: "`customer.balance`", why: "Correct. Dot notation reads a property by name." },
              { text: "`balance.customer`", why: "The object comes first, then the property." },
              { text: "`customer(balance)`", why: "Round brackets call functions; they do not read properties." },
            ],
            answer: 1,
            hint: "Object name, dot, property name.",
          },
          {
            id: "q3", type: "multi", flavour: "debug",
            prompt: "Which of these are **invalid** JSON? Select all that apply.",
            options: [
              { text: "`{\"item\": \"rice\", \"qty\": 3}`", why: "This one is valid JSON." },
              { text: "`{'item': 'rice'}`", why: "Invalid: JSON requires double quotes." },
              { text: "`{\"item\": \"rice\",}`", why: "Invalid: trailing comma after the last value." },
              { text: "`{item: \"rice\"}`", why: "Invalid: property names must be in double quotes in JSON (JavaScript allows this; JSON does not)." },
            ],
            answers: [1, 2, 3],
            hint: "Check quotes and commas carefully.",
          },
          {
            id: "q4", type: "mcq", flavour: "design",
            prompt: "You need to store each product's name, price and stock, for 40 products. What is the best shape?",
            options: [
              { text: "120 separate variables", why: "Unmanageable, and adding a product would mean changing code." },
              { text: "An array of objects, one object per product", why: "Correct. Each record has the same named properties, and the list can grow." },
              { text: "One long string with everything in it", why: "You could not easily read or update one product's price." },
            ],
            answer: 1,
            hint: "Think of the drawer of customer cards.",
          },
          {
            id: "q5", type: "mcq", flavour: "analogy",
            prompt: "In the customer-card picture, what does `JSON.stringify(customer)` correspond to?",
            options: [
              { text: "Tearing up the card", why: "The original object is unchanged." },
              { text: "Making a standard written copy of the card that can be posted to another office", why: "Correct. It produces text that another program can read back." },
              { text: "Adding a new box to the card", why: "That is setting a new property." },
            ],
            answer: 1,
            hint: "What does stringify produce, and what is it for?",
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "A friend who sells phones asks: \"Why can't I just keep my stock in separate variables, and what is this JSON thing my developer keeps talking about?\" Explain arrays, objects and JSON in your own words.",
          rubric: [
            { concept: "An object groups named facts about one thing (a record)", keywords: ["object", "record", "card", "property", "properties", "named"], hint: "Describe what an object holds." },
            { concept: "An array is an ordered list, counted from 0", keywords: ["array", "list", "index", "0", "zero", "order"], hint: "Describe what an array is." },
            { concept: "JSON is text for sending/saving data between programs", keywords: ["json", "text", "send", "save", "another program", "share"], hint: "What is JSON for?" },
            { concept: "stringify / parse convert between the two, and JSON rules are strict", keywords: ["stringify", "parse", "double quote", "strict", "error", "comma"], hint: "How do you convert, and what can go wrong?" },
          ],
          exemplar: "Separate variables get messy: 40 phones would need over 100 of them. Instead, each phone can be one object — a record with named properties like model, price and stock. All the phone objects go in an array, which is an ordered list where the first item is at position 0. JSON is a way of writing that data as plain text so it can be saved in a file or sent to another program, like a delivery app or an AI service. JSON.stringify turns your objects into JSON text and JSON.parse turns the text back into objects. JSON is strict: it needs double quotes and no extra commas, or parsing fails with an error.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "An **array** is an ordered list read by index from 0 (`list[0]`, `list.length`, `list.push(x)`). An **object** is a record read by property name (`customer.balance`). Combine them for real data: an array of objects. **JSON** is the strict text form of that data, made with `JSON.stringify` and read back with `JSON.parse`, which throws on invalid text. A missing property is `undefined`, not an error.",
          canNow: [
            "Create and change arrays and objects.",
            "Read a value deep inside a list of records.",
            "Convert data to JSON text and back.",
            "Fix invalid JSON and spot `undefined` bugs.",
          ],
          next: "Next, your code starts making decisions and repeating work: conditions, loops, and functions — the recipes that every agent tool is built from.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  LESSON 3 — Conditions, loops and functions                             */
/* ---------------------------------------------------------------------- */

const l3: Lesson = {
  id: "m2-l3",
  moduleId: "m2",
  title: "Decisions, repetition and recipes",
  subtitle: "Conditions let code choose, loops let it repeat, and functions package steps into reusable recipes with inputs and outputs.",
  minutes: 45,
  prerequisites: ["m2-l2"],
  objectives: [
    "Write a function with parameters that returns an output.",
    "Use `if`, `else if` and `else` to apply a rule, including the edges of a range.",
    "Use a `for...of` loop to go through every item in a list and keep a running total.",
    "Combine a loop and a condition to filter a list.",
    "Recognise off-by-one errors, missing `return`, and infinite loops.",
  ],
  glossary: ["function", "parameter", "return-value", "condition", "loop", "operator", "array", "object", "bug"],
  completion: [
    "Step through the Functions, loops & decisions program in the lab.",
    "Pass the required exercises (greeting, line total, delivery fee, order total, fixing the loop).",
    "Pass the knowledge check.",
    "Explain how a function, a condition and a loop work together.",
  ],
  tutor: {
    simpler:
      "A function is a recipe card: you hand it ingredients (inputs) and it hands you back a dish (the output). A condition is a rule like \"if the order is big, delivery is free\". A loop is going down an order list one line at a time and doing the same thing for each line.",
    altAnalogy:
      "A teacher marking exam papers: the marking guide is the function (paper in, mark out); \"if the mark is 80 or more, it is a distinction\" is a condition; going through the whole pile, paper by paper, is a loop.",
    misconceptions: [
      "\"Defining a function runs it.\" Defining only writes the recipe card. It runs when you call it, e.g. `lineTotal(5000, 2)`.",
      "\"console.log inside a function gives back the answer.\" Printing shows a value to a human; only `return` hands the value back to the code that called the function.",
      "\"if (x = 5) checks if x is 5.\" A single = stores 5 in x. Use `===` to compare.",
      "\"The loop should run up to and including length.\" Indexes go from 0 to length - 1, so `i <= items.length` goes one step too far.",
    ],
    probingQuestions: [
      "What is the difference between a parameter and the value you pass in when calling the function?",
      "For the delivery rule, what should happen at exactly 2 km? How would you test that?",
      "Why do agent tools have to be functions with clear inputs and outputs?",
    ],
    revisit: ["m2-l2"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "The same sums, all day",
      blocks: [
        { type: "p", text: "Every order at Mama Achen's shop needs the same steps: for **each** line on the order, multiply the price by the quantity; add the lines up; then apply the shop's rules — free delivery for big orders, a fee for long distances." },
        { type: "p", text: "With only variables, you would have to write the multiplication again for every line of every order, and you could not handle an order with a number of lines you did not know in advance. Programs need ways to **decide**, to **repeat**, and to **reuse** a set of steps." },
        { type: "p", text: "These three ideas are also exactly what an agent's tools are made of. A tool such as `calculate_quote` is just a function: inputs in, output out, with rules and loops inside." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How do you write code that makes decisions, repeats work for every item in a list, and packages steps so you can reuse them?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "Recipes, rules and order lists",
      blocks: [
        { type: "steps", items: [
          { title: "A function is a recipe.", text: "A recipe for chapati lists what it needs (flour, water, salt) and what you get at the end. You write it once and use it whenever someone orders. Different amounts in, different results out — same steps." },
          { title: "A condition is the shopkeeper's decision rule.", text: "\"If the order is at least UGX 10,000, delivery is free. Otherwise, charge 3,000.\" The shopkeeper checks a fact, and the answer — yes or no — decides what happens next." },
          { title: "A loop is checking each item on an order list.", text: "Start at the first line, do the work, move to the next line, and stop when there are no more lines." },
        ] },
        { type: "analogyMap", title: "From the shop to code", pairs: [
          { everyday: "Writing a recipe card", technical: "Defining a [[function|function]]: `function lineTotal(price, qty) { ... }`" },
          { everyday: "The ingredients the recipe asks for", technical: "[[parameter|Parameters]]: `price`, `qty`" },
          { everyday: "Actually cooking with 2 cups of flour", technical: "Calling the function with values: `lineTotal(5000, 2)`" },
          { everyday: "The finished dish handed over", technical: "The [[return-value|return value]]: `return price * qty;`" },
          { everyday: "\"If the order is big, delivery is free\"", technical: "A [[condition|condition]]: `if (total >= 10000) { fee = 0; }`" },
          { everyday: "Going down the order list line by line", technical: "A [[loop|loop]]: `for (const entry of order) { ... }`" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A cook can improvise when an ingredient is missing; a function cannot. If you call it with the wrong kind of input (text instead of a number, say) it carries on with exactly what it was given — and may give a wrong answer without complaining. Checking inputs is your job (Lesson 4)." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Follow the loop and the rule",
      blocks: [
        { type: "p", text: "Step through a program that adds up an order. Watch the loop pick each entry, see the function open its own private workspace with its parameters, and see the delivery rule decide the fee." },
        { type: "lab", lab: "code-tracer", props: { scenario: "decisions" }, required: true, caption: "Real code; recorded steps. Notice that the function's parameters only exist while it is running." },
        { type: "callout", tone: "sim", text: "This is a recording of what JavaScript does, drawn so you can follow it. Real code does not pause. The values and output shown match the real program exactly." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "How functions, conditions and loops work",
      blocks: [
        { type: "p", text: "**Functions.** `function name(param1, param2) { ... }` defines a [[function|function]]. The [[parameter|parameters]] are like variables that get their values when the function is **called**: `name(5000, 2)`. Inside, `return value;` ends the function and hands the value back. A function without `return` gives back `undefined`." },
        { type: "code", lang: "js", code: `function lineTotal(price, qty) {
  return price * qty;
}
const sugar = lineTotal(5000, 2);   // 10000
const soap = lineTotal(4500, 1);    // 4500

// The same recipe written as an "arrow function":
const lineTotal2 = (price, qty) => price * qty;`, caption: "You will see the arrow style a lot in real code and in Lesson 4." },
        { type: "p", text: "**Conditions.** `if (test) { ... }` runs the block only when the test is true. Add `else if (anotherTest) { ... }` for more cases and `else { ... }` for \"everything else\". The tests are checked **from top to bottom** and only the first true one runs. Comparisons: `===`, `!==`, `<`, `<=`, `>`, `>=`; combine with `&&` (and) and `||` (or)." },
        { type: "p", text: "**Loops.** `for (const item of list) { ... }` runs the block once per item, with `item` holding the current one. The older counting loop, `for (let i = 0; i < list.length; i++) { ... }`, does the same using indexes: start at 0, keep going while `i` is less than the length, add 1 each time. A `while (test) { ... }` loop repeats as long as the test stays true." },
        { type: "p", text: "A very common pattern — the **accumulator** — keeps a running result outside the loop: start `let total = 0;`, and inside the loop do `total = total + something;`. After the loop, `total` holds the answer." },
        { type: "callout", tone: "tip", title: "Shortcuts you will see later", text: "Arrays have built-in loops: `list.filter(...)` keeps the items that pass a test, and `list.map(...)` makes a new list by changing each item. They do the same job as the loops you write today, in fewer characters. Learn the long way first; the shortcuts will then make sense." },
        { type: "callout", tone: "info", title: "Why agents care", text: "Every agent tool is a function with named inputs and one output. And the agent loop itself (Module 7) is literally a `while` loop with a condition that decides when to stop." },
      ],
    },
    {
      kind: "example",
      mode: "build",
      title: "An order calculator",
      blocks: [
        { type: "code", lang: "js", code: `function lineTotal(price, qty) {
  return price * qty;
}

function deliveryFee(total, distanceKm) {
  if (total >= 100000) {
    return 0;                 // big orders: free
  } else if (distanceKm <= 3) {
    return 2000;
  } else {
    return 5000;
  }
}

const order = [
  { item: "sugar", price: 5000, qty: 2 },
  { item: "soap", price: 4500, qty: 1 },
];

let total = 0;
for (const entry of order) {
  total = total + lineTotal(entry.price, entry.qty);
}

console.log("Goods:", total);                       // Goods: 14500
console.log("Delivery:", deliveryFee(total, 5));    // Delivery: 5000`, notes: [
          { line: 1, text: "Defining the recipe. Nothing runs yet." },
          { line: 6, text: "The rules are checked from the top. The first true test wins, and `return` ends the function immediately." },
          { line: 20, text: "The accumulator starts at 0, outside the loop." },
          { line: 21, text: "One trip round the loop per entry in the order." },
          { line: 22, text: "Calling the function with this entry's values, and adding its output to the total." },
          { line: 26, text: "14500 is not ≥ 100000, and 5 km is not ≤ 3, so the else branch returns 5000." },
        ] },
      ],
    },
    {
      kind: "challenge",
      mode: "build",
      title: "Write your own recipes",
      blocks: [
        { type: "p", text: "These exercises test your **functions** by calling them with different inputs, so your function must use its parameters — a typed-in answer will not pass." },
        { type: "exercise", exercise: {
          id: "m2-l3-greet",
          title: "1. A greeting function",
          brief: "Complete `greet(name)` so it **returns** `\"Hello, \"` followed by the name and `\"!\"`. For example `greet(\"Achen\")` returns `\"Hello, Achen!\"`. Use `return`, not `console.log`.",
          starter: `function greet(name) {
  // return the greeting here
}

console.log(greet("Achen"));
`,
          solution: `function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Achen"));
`,
          tests: [
            { name: "greet(\"Achen\")", expr: "greet(\"Achen\")", expected: "Hello, Achen!" },
            { name: "greet(\"Okello\")", expr: "greet(\"Okello\")", expected: "Hello, Okello!" },
          ],
          hints: [
            "Inside the braces write `return` followed by the text you build.",
            "`return \"Hello, \" + name + \"!\";`",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l3-line-total",
          title: "2. One line of an order",
          brief: "Complete `lineTotal(price, qty)` so it returns the price multiplied by the quantity.",
          starter: `function lineTotal(price, qty) {
  return 0;
}
`,
          solution: `function lineTotal(price, qty) {
  return price * qty;
}
`,
          tests: [
            { name: "lineTotal(5000, 3)", expr: "lineTotal(5000, 3)", expected: 15000 },
            { name: "lineTotal(110000, 2)", expr: "lineTotal(110000, 2)", expected: 220000 },
            { name: "lineTotal(4500, 0)", expr: "lineTotal(4500, 0)", expected: 0 },
          ],
          hints: ["Use the two parameters and `*`."],
        } },
        { type: "exercise", exercise: {
          id: "m2-l3-delivery",
          title: "3. The delivery rule",
          brief: "The boda-boda delivery rule: **up to and including 2 km** is free (0); **more than 2 km, up to and including 5 km** costs UGX 2,000; **more than 5 km** costs UGX 5,000. Complete `deliveryFee(distanceKm)`. The tests check the edges (exactly 2 and exactly 5), so think about `<` versus `<=`.",
          starter: `function deliveryFee(distanceKm) {
  if (distanceKm < 2) {
    return 0;
  }
  return 5000;
}
`,
          solution: `function deliveryFee(distanceKm) {
  if (distanceKm <= 2) {
    return 0;
  } else if (distanceKm <= 5) {
    return 2000;
  } else {
    return 5000;
  }
}
`,
          tests: [
            { name: "1 km is free", expr: "deliveryFee(1)", expected: 0 },
            { name: "exactly 2 km is free", expr: "deliveryFee(2)", expected: 0 },
            { name: "2.5 km costs 2000", expr: "deliveryFee(2.5)", expected: 2000 },
            { name: "exactly 5 km costs 2000", expr: "deliveryFee(5)", expected: 2000 },
            { name: "5.1 km costs 5000", expr: "deliveryFee(5.1)", expected: 5000 },
            { name: "12 km costs 5000", expr: "deliveryFee(12)", expected: 5000 },
          ],
          hints: [
            "\"Up to and including 2\" is `distanceKm <= 2`.",
            "Add an `else if (distanceKm <= 5)` branch that returns 2000. Order matters: the first true test wins.",
            "Everything else (more than 5) falls through to `return 5000;`.",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l3-order-total",
          title: "4. Add up a whole order",
          brief: "Complete `orderTotal(items)`. Each item looks like `{ name: \"sugar\", priceUGX: 5000, qty: 2 }`. Loop through the items and return the sum of price × qty. An empty order should return 0.",
          starter: `function orderTotal(items) {
  let total = 0;
  // loop through items here
  return total;
}
`,
          solution: `function orderTotal(items) {
  let total = 0;
  for (const item of items) {
    total = total + item.priceUGX * item.qty;
  }
  return total;
}
`,
          tests: [
            { name: "two lines", expr: "orderTotal([{ name: \"sugar\", priceUGX: 5000, qty: 2 }, { name: \"soap\", priceUGX: 4500, qty: 1 }])", expected: 14500 },
            { name: "one line of rice", expr: "orderTotal([{ name: \"rice\", priceUGX: 110000, qty: 3 }])", expected: 330000 },
            { name: "empty order is 0", expr: "orderTotal([])", expected: 0 },
          ],
          hints: [
            "`for (const item of items) { ... }` visits every item.",
            "Inside the loop: `total = total + item.priceUGX * item.qty;` (multiplication happens before addition).",
          ],
        } },
        { type: "exercise", required: false, exercise: {
          id: "m2-l3-low-stock",
          title: "5. Stretch: which products are running low?",
          brief: "Optional. Complete `lowStock(products, limit)`: return an **array of names** of the products whose `qty` is **below** `limit`, in the same order. Combine a loop, a condition and `push`.",
          starter: `function lowStock(products, limit) {
  const names = [];
  return names;
}
`,
          solution: `function lowStock(products, limit) {
  const names = [];
  for (const p of products) {
    if (p.qty < limit) {
      names.push(p.name);
    }
  }
  return names;
}
`,
          tests: [
            { name: "finds two low products", expr: "lowStock([{ name: \"rice\", qty: 2 }, { name: \"sugar\", qty: 40 }, { name: \"soap\", qty: 0 }], 5)", expected: ["rice", "soap"] },
            { name: "nothing low", expr: "lowStock([{ name: \"oil\", qty: 9 }], 5)", expected: [] },
            { name: "exactly at the limit is not low", expr: "lowStock([{ name: \"salt\", qty: 5 }], 5)", expected: [] },
          ],
          hints: [
            "Loop with `for (const p of products)`.",
            "Inside, `if (p.qty < limit) { names.push(p.name); }`",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "One step too far",
      blocks: [
        { type: "p", text: "The **off-by-one error** is so common it has its own name. A list of 2 items has indexes 0 and 1. A counting loop written with `<=` tries index 2 as well, gets `undefined`, and then crashes when it reads `.qty` of `undefined`." },
        { type: "exercise", exercise: {
          id: "m2-l3-fix-loop",
          title: "Fix the crashing loop",
          brief: "`countUnits` should add up the `qty` of every item, but it crashes with `TypeError: Cannot read properties of undefined (reading 'qty')`. Run it, read the error, and fix the loop.",
          starter: `function countUnits(items) {
  let units = 0;
  for (let i = 0; i <= items.length; i++) {
    units = units + items[i].qty;
  }
  return units;
}

console.log(countUnits([{ qty: 2 }, { qty: 3 }]));
`,
          solution: `function countUnits(items) {
  let units = 0;
  for (let i = 0; i < items.length; i++) {
    units = units + items[i].qty;
  }
  return units;
}

console.log(countUnits([{ qty: 2 }, { qty: 3 }]));
`,
          tests: [
            { name: "2 + 3 units", expr: "countUnits([{ qty: 2 }, { qty: 3 }])", expected: 5 },
            { name: "empty list", expr: "countUnits([])", expected: 0 },
            { name: "one item", expr: "countUnits([{ qty: 7 }])", expected: 7 },
          ],
          hints: [
            "For a 2-item list, which values does i take? Is there an items[2]?",
            "Change `<=` to `<`. (Or rewrite the loop as `for (const item of items)`, which cannot go too far.)",
          ],
        } },
        { type: "list", items: [
          "**Missing `return`.** A function that calculates an answer but never returns it gives back `undefined`. If a test says \"expected 15000 but got undefined\", look for the missing `return`.",
          "**Infinite loop.** `while (stock > 0) { console.log(stock); }` never changes `stock`, so it never stops. In this course's sandbox your code is stopped after a couple of seconds; on a real server it would freeze the program. Always make sure something inside the loop moves it towards the end.",
          "**`=` inside an `if`.** `if (total = 0)` stores 0 instead of comparing. Use `===`.",
        ] },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "predict",
            prompt: "What does this print?",
            code: "function double(n) {\n  n * 2;\n}\nconsole.log(double(4));",
            options: [
              { text: "8", why: "The multiplication happens, but the result is never handed back." },
              { text: "undefined", why: "Correct. Without `return`, the function gives back undefined." },
              { text: "4", why: "The function does not return its input either." },
              { text: "An error", why: "This is valid code; it just has no return." },
            ],
            answer: 1,
            hint: "What hands a value back from a function?",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "What does `deliveryFee(2)` return?",
            code: "function deliveryFee(km) {\n  if (km < 2) return 0;\n  else if (km < 5) return 2000;\n  else return 5000;\n}",
            options: [
              { text: "0", why: "2 < 2 is false, so the first branch does not run." },
              { text: "2000", why: "Correct. 2 < 2 is false, then 2 < 5 is true." },
              { text: "5000", why: "The second test is already true, so the else is never reached." },
            ],
            answer: 1,
            hint: "Is 2 less than 2?",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "A loop over a 3-item list crashes with `Cannot read properties of undefined`. The loop is `for (let i = 1; i <= items.length; i++)`. What is wrong?",
            options: [
              { text: "The list is too long.", why: "Any length would fail the same way." },
              { text: "It starts at 1 (skipping the first item) and goes up to 3 (one past the end).", why: "Correct. Indexes for 3 items are 0, 1, 2. It should be `let i = 0; i < items.length`." },
              { text: "`i++` should be `i--`.", why: "Counting down from 1 would loop forever downwards." },
            ],
            answer: 1,
            hint: "Which indexes exist in a 3-item list?",
          },
          {
            id: "q4", type: "order",
            prompt: "Put the steps of `orderTotal` in the order they happen.",
            items: [
              "Create `total` and set it to 0",
              "Take the first item from the list",
              "Add that item's price × qty to total",
              "Repeat with the next item until none are left",
              "Return total",
            ],
            hint: "The accumulator is created before the loop, and returned after it.",
            explanation: "Start the accumulator, loop through every item adding to it, and only after the loop return the answer.",
          },
          {
            id: "q5", type: "mcq", flavour: "analogy",
            prompt: "In the recipe picture, what are a function's **parameters**?",
            options: [
              { text: "The finished dish", why: "That is the return value." },
              { text: "The ingredients the recipe asks for", why: "Correct. Parameters are the inputs the function needs." },
              { text: "The kitchen", why: "The kitchen is closer to the computer running the code." },
            ],
            answer: 1,
            hint: "Inputs or outputs?",
          },
          {
            id: "q6", type: "multi", flavour: "design",
            prompt: "You are writing a tool function `quote(items)` for an agent. Which are good design choices? Select all that apply.",
            options: [
              { text: "Take the items as a parameter instead of reading a global variable", why: "Yes — clear inputs make the function reusable and testable." },
              { text: "Return the total instead of only printing it", why: "Yes — the agent's code needs the value back, not text on a screen." },
              { text: "Test it with an empty list and with edge values", why: "Yes — edges are where bugs hide." },
              { text: "Loop with `i <= items.length` to be safe", why: "No — that goes one step past the end." },
            ],
            answers: [0, 1, 2],
            hint: "Think about inputs, outputs and edges.",
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Explain to a classmate how a program could calculate the total for any order at Mama Achen's shop and decide whether delivery is free. Use the words function, loop and condition.",
          rubric: [
            { concept: "A function takes inputs (parameters) and returns an output", keywords: ["function", "recipe", "input", "parameter", "return", "output"], hint: "What does the function do with its inputs?" },
            { concept: "A loop repeats the same step for every item in the order", keywords: ["loop", "each", "every item", "repeat", "one by one", "for"], hint: "How does the code handle orders of any length?" },
            { concept: "A running total (accumulator) collects the result", keywords: ["total", "add", "running", "sum", "accumul", "start at 0"], hint: "Where does the sum build up?" },
            { concept: "A condition applies the delivery rule", keywords: ["if", "condition", "rule", "else", "decide", "free"], hint: "How is the delivery decision made?" },
          ],
          exemplar: "First I write a function, lineTotal, like a recipe: its inputs are the price and the quantity, and it returns price times quantity. Then I start a running total at 0 and use a loop to go through every item on the order, one by one, adding lineTotal for that item to the total. Because it is a loop, it works for an order with one item or fifty. When the loop finishes, a condition applies the shop's rule: if the total is at least 10,000, delivery is free, else charge the fee. Putting all of this inside an orderTotal function means I can reuse it for every customer.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "A **function** is a reusable recipe: parameters in, `return` value out. A **condition** (`if` / `else if` / `else`) chooses what runs; the first true test wins, so the edges (`<` vs `<=`) matter. A **loop** (`for...of`, counting `for`, `while`) repeats work for every item, often adding to an accumulator. Watch for off-by-one errors, missing `return`, and loops that never end.",
          canNow: [
            "Write functions with parameters and return values.",
            "Express a business rule as conditions and test its edges.",
            "Loop over a list to total or filter it.",
            "Debug a crashing loop from its error message.",
          ],
          next: "Real programs meet bad input and slow services. Next: errors you can throw and catch, and asynchronous code that waits for things — like an AI model's reply — without freezing.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  LESSON 4 — Errors, and asynchronous code                               */
/* ---------------------------------------------------------------------- */

const l4: Lesson = {
  id: "m2-l4",
  moduleId: "m2",
  title: "When things go wrong, and waiting",
  subtitle: "Throw and catch errors so bad input fails safely, and use promises and async/await so your code can wait for slow things without freezing.",
  minutes: 50,
  prerequisites: ["m2-l3"],
  objectives: [
    "Read an error message: its type, its message and the line it points to.",
    "Refuse bad input with `throw new Error(...)`.",
    "Handle a failure with `try` / `catch` instead of crashing.",
    "Explain what a promise is and why slow operations are asynchronous.",
    "Use `async` / `await`, run tasks at the same time with `Promise.all`, and catch errors from awaited code.",
  ],
  glossary: ["error", "try-catch", "asynchronous", "promise", "async-await", "event-loop", "function", "json"],
  completion: [
    "Step through the Async kitchen program in the lab and predict which dish is served first.",
    "Pass the required exercises (checking a quantity, safe JSON parsing, awaiting, parallel cooking, async errors, the missing await).",
    "Pass the knowledge check.",
    "Explain promises using the restaurant kitchen.",
  ],
  tutor: {
    simpler:
      "An error is the program saying \"I can't do this\". `throw` raises the alarm; `try/catch` is a plan for what to do when the alarm rings. Asynchronous code is like ordering food: you get a ticket (a promise) straight away, carry on with other things, and the food comes when it is ready. `await` means \"wait here for this ticket before continuing\".",
    altAnalogy:
      "A mobile money agent: they send a transaction and get a reference number immediately (a promise). While the network confirms it, they serve the next customer. When the confirmation SMS arrives, they finish the first transaction. If the network rejects it, they handle that failure instead of pretending it worked.",
    misconceptions: [
      "\"An error means my program is broken.\" Errors are a normal, designed way to refuse bad input or report a failed network call. The bug is not handling them.",
      "\"await makes the whole computer wait.\" It pauses only that async function; JavaScript keeps handling other work in the meantime.",
      "\"A promise is the result.\" A promise is a ticket for a result that is not here yet. You must `await` it (or use `.then`) to get the value.",
      "\"Tasks I start one after another run one after another.\" If you start several promises before awaiting any, they run at the same time — that is what `Promise.all` is for.",
    ],
    probingQuestions: [
      "Why is it better for `checkQuantity(-2)` to throw than to return -2?",
      "What will you see if you forget `await` before a function that returns a promise?",
      "An agent calls an AI model that takes 3 seconds. Why must that call be asynchronous?",
    ],
    revisit: ["m2-l3"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Minus two bags, and a slow network",
      blocks: [
        { type: "p", text: "Two kinds of trouble hit every real program." },
        { type: "list", items: [
          "**Bad input.** A customer types \"-2\" bags, or a message arrives with broken JSON. If the code carries on anyway, it might refund money for negative rice. It must **refuse clearly**, and the rest of the program must **cope** with the refusal.",
          "**Waiting.** Checking mobile money, sending an SMS or asking an AI model takes time — sometimes seconds. If the program stood frozen while waiting, it could not serve anyone else. It needs to **start** the slow job, **carry on**, and **come back** when the answer arrives.",
        ] },
        { type: "p", text: "Agents do both all day. Every model call and tool call is slow and can fail. An agent that cannot wait properly or handle a failed call is an agent that freezes or crashes in front of a customer." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How does code refuse bad input safely, recover from failures, and wait for slow operations without freezing?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "A restaurant kitchen with one waiter",
      blocks: [
        { type: "p", text: "Picture a busy rolex stand with **one** waiter and a kitchen with several cooks." },
        { type: "steps", items: [
          { title: "The waiter takes an order and hands a ticket to the kitchen.", text: "The customer gets a numbered ticket straight away. That ticket is a **promise**: \"your food is coming\"." },
          { title: "The waiter does not stand at the stove.", text: "While the rolex cooks, the waiter takes the next order, and the next. Nothing is wasted." },
          { title: "Ready dishes go on the counter.", text: "When a dish is ready, the cook puts it on the counter. The waiter picks it up as soon as they are free and serves it. Dishes come out when they are **ready**, not in the order they were ordered." },
          { title: "Sometimes the kitchen says no.", text: "\"We are out of eggs.\" The ticket comes back **rejected**, and the waiter has to tell the customer and offer something else — not pretend the food is coming." },
        ] },
        { type: "analogyMap", title: "From the kitchen to code", pairs: [
          { everyday: "The single waiter", technical: "JavaScript's main thread: it runs one piece of your code at a time" },
          { everyday: "The order ticket", technical: "A [[promise|promise]]: pending → fulfilled (with a value) or rejected (with an error)" },
          { everyday: "Cooks working while the waiter keeps serving", technical: "[[asynchronous|Asynchronous]] work: timers, network requests, AI model calls" },
          { everyday: "The counter of ready dishes, and the waiter checking it", technical: "The [[event-loop|event loop]]: finished jobs wait in a queue until the main thread is free" },
          { everyday: "\"I'll wait right here for my chips\"", technical: "`await`: pause this [[async-await|async function]] until the promise settles" },
          { everyday: "\"Sorry, we're out of eggs\"", technical: "A rejected promise / a thrown [[error|error]], handled with [[try-catch|try/catch]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Real cooks are independent people. In JavaScript the \"cooks\" are mostly the browser, Node.js or another computer on the network doing work outside your code; your own code still runs on the single waiter. A long calculation written in JavaScript (a giant loop) **does** freeze the waiter, because no one else can do it for you." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Watch two orders cook at once",
      blocks: [
        { type: "p", text: "Two orders go to the kitchen: a rolex (3 minutes) and chips (1 minute). Step through and watch the waiter, the kitchen (pending promises) and the counter (ready callbacks). You will be asked which dish is served first." },
        { type: "lab", lab: "code-tracer", props: { scenario: "kitchen" }, required: true, caption: "Real code (each pretend minute is 100 ms); recorded steps. The output order is exactly what the real code prints." },
        { type: "callout", tone: "sim", text: "The kitchen picture is a simplified model of the event loop, made for teaching. Real JavaScript has more detail (for example, two separate queues with different priorities), but for the code you will write in this course, this model predicts the right order." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "Errors and asynchronous code precisely",
      blocks: [
        { type: "p", text: "**Errors.** When something goes wrong, JavaScript creates an [[error|error]] object with a `name` (such as `TypeError`) and a `message`, and stops the current code. You can raise one yourself with `throw new Error(\"Quantity must be a whole number above 0\");`. Common built-in ones: `SyntaxError` (code or JSON that breaks the rules), `ReferenceError` (a name that does not exist), `TypeError` (using a value the wrong way, like reading a property of `undefined`)." },
        { type: "p", text: "**try / catch.** Code inside `try { ... }` runs normally. If anything inside throws, JavaScript jumps straight to `catch (err) { ... }`, where `err.message` tells you what went wrong. Code after the whole block continues. An optional `finally { ... }` runs either way. Catch errors **where you can do something useful** — show a friendly message, use a default, try again." },
        { type: "p", text: "**Asynchronous code.** Slow operations return a [[promise|promise]] immediately. A promise starts **pending** and later becomes **fulfilled** (with a value) or **rejected** (with an error). You make one with `new Promise((resolve, reject) => { ... })`, but more often a library or `fetch` gives you one." },
        { type: "p", text: "**async / await.** Inside a function marked `async`, writing `await somePromise` pauses that function until the promise settles, then gives you its value — or throws its error, so ordinary `try/catch` works. An `async` function itself always returns a promise. The older style is `.then(value => ...)` and `.catch(err => ...)`; it does the same thing." },
        { type: "code", lang: "js", code: `// One after another: about 3 + 1 = 4 seconds
const a = await cook("rolex", 3);
const b = await cook("chips", 1);

// At the same time: about 3 seconds (the slowest one)
const [x, y] = await Promise.all([cook("rolex", 3), cook("chips", 1)]);`, caption: "Promise.all waits for every promise in the list and gives back their values in the same order. If any one rejects, the whole thing rejects." },
        { type: "callout", tone: "info", title: "Real-world async: fetch", text: "Browsers and Node.js have `fetch(url)` for calling services over the internet, and it returns a promise. One surprise: `fetch` only rejects when the network fails. A reply like \"404 Not Found\" still fulfils, so you must check `response.ok` yourself. You will use this in Module 5 to call an AI API. (The exercises here cannot reach the internet, so they use pretend slow functions instead.)" },
      ],
    },
    {
      kind: "example",
      mode: "build",
      title: "Checking input and calling a slow service",
      blocks: [
        { type: "code", lang: "js", code: `function checkQuantity(qty) {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("Quantity must be a whole number above 0");
  }
  return qty;
}

try {
  checkQuantity(-2);
  console.log("This line is skipped");
} catch (err) {
  console.log("Refused:", err.message);
}

async function getWeather(city) {
  try {
    const response = await fetch("https://api.example.com/weather?city=" + city);
    if (!response.ok) {
      throw new Error("Weather service replied " + response.status);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.log("Could not get the weather:", err.message);
    return null;
  }
}`, notes: [
          { line: 2, text: "`Number.isInteger` is true only for whole numbers (and false for text like \"3\"). `||` means \"or\": refuse if either problem is present." },
          { line: 3, text: "`throw` stops the function immediately. The `return` below never runs for bad input." },
          { line: 9, text: "This throws, so JavaScript jumps straight to `catch`." },
          { line: 12, text: "Prints: Refused: Quantity must be a whole number above 0" },
          { line: 17, text: "`await` pauses getWeather (not the whole program) until the reply arrives. api.example.com is a made-up address used for examples." },
          { line: 18, text: "fetch does not throw for error replies like 404 — you must check `response.ok`." },
          { line: 21, text: "Reading the reply's body is also slow, so it is awaited too. `.json()` parses the JSON for you." },
          { line: 23, text: "Network failures and our own thrown error both land here. The function returns null instead of crashing." },
        ] },
      ],
    },
    {
      kind: "challenge",
      mode: "build",
      title: "Refuse, recover and wait",
      blocks: [
        { type: "exercise", exercise: {
          id: "m2-l4-check-qty",
          title: "1. Refuse a bad quantity",
          brief: "Complete `checkQuantity(qty)`. If `qty` is **not** a whole number greater than 0, throw an Error with the message `Quantity must be a whole number above 0`. Otherwise return `qty`. Text like `\"3\"` must also be refused.",
          starter: `function checkQuantity(qty) {
  return qty;
}
`,
          solution: `function checkQuantity(qty) {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("Quantity must be a whole number above 0");
  }
  return qty;
}
`,
          tests: [
            { name: "3 is accepted", expr: "checkQuantity(3)", expected: 3 },
            { name: "0 is refused", expr: "checkQuantity(0)", throws: "whole number above 0" },
            { name: "-2 is refused", expr: "checkQuantity(-2)", throws: "whole number above 0" },
            { name: "1.5 is refused", expr: "checkQuantity(1.5)", throws: "whole number above 0" },
            { name: "the text \"3\" is refused", expr: "checkQuantity(\"3\")", throws: "whole number above 0" },
          ],
          hints: [
            "`Number.isInteger(qty)` is true only for whole numbers. `!` turns true into false.",
            "Refuse if it is not an integer OR it is 0 or less: `if (!Number.isInteger(qty) || qty <= 0) { ... }`",
            "Inside the if: `throw new Error(\"Quantity must be a whole number above 0\");`",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l4-safe-parse",
          title: "2. Parse JSON without crashing",
          brief: "Messages from outside (and from AI models) are sometimes not valid JSON. Complete `safeParse(text)`: return the parsed value, or return `null` if `JSON.parse` throws.",
          starter: `function safeParse(text) {
  return JSON.parse(text);
}
`,
          solution: `function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}
`,
          tests: [
            { name: "valid JSON is parsed", expr: "safeParse('{\"item\":\"rice\",\"qty\":3}')", expected: { item: "rice", qty: 3 } },
            { name: "broken JSON gives null", expr: "safeParse(\"{item: rice}\")", expected: null },
            { name: "empty text gives null", expr: "safeParse(\"\")", expected: null },
          ],
          hints: [
            "Wrap the parse in `try { ... }`.",
            "Add `catch (err) { return null; }` after the try block.",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l4-await",
          title: "3. Wait for the chapati",
          brief: "`cookChapati(count)` is slow, so it returns a promise. Complete the `async` function `serveOrder()` so it **awaits** `cookChapati(2)` and returns `\"Served: \"` followed by the result — i.e. `\"Served: 2 chapati ready\"`.",
          starter: `// A pretend kitchen. Cooking takes 50 milliseconds, so it returns a promise.
function cookChapati(count) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(count + " chapati ready"), 50);
  });
}

async function serveOrder() {
  // wait for cookChapati(2), then return "Served: " + the result
}
`,
          solution: `// A pretend kitchen. Cooking takes 50 milliseconds, so it returns a promise.
function cookChapati(count) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(count + " chapati ready"), 50);
  });
}

async function serveOrder() {
  const result = await cookChapati(2);
  return "Served: " + result;
}
`,
          tests: [
            { name: "serves the cooked chapati", expr: "serveOrder()", expected: "Served: 2 chapati ready" },
            { name: "an async function returns a promise", expr: "serveOrder() instanceof Promise", expected: true },
          ],
          hints: [
            "`const result = await cookChapati(2);`",
            "Then `return \"Served: \" + result;`",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l4-parallel",
          title: "4. Cook everything at once",
          brief: "`cookAll` cooks three dishes **one after another**, so it takes about 450 ms. Rewrite it with `Promise.all` so all three cook **at the same time** (about 150 ms). It must still return the results in the same order.",
          starter: `function cook(dish, ms) {
  return new Promise((resolve) => setTimeout(() => resolve(dish + " ready"), ms));
}

async function cookAll() {
  const a = await cook("rolex", 150);
  const b = await cook("chips", 150);
  const c = await cook("tea", 150);
  return [a, b, c];
}
`,
          solution: `function cook(dish, ms) {
  return new Promise((resolve) => setTimeout(() => resolve(dish + " ready"), ms));
}

async function cookAll() {
  return await Promise.all([cook("rolex", 150), cook("chips", 150), cook("tea", 150)]);
}
`,
          tests: [
            { name: "returns all three, in order", expr: "cookAll()", expected: ["rolex ready", "chips ready", "tea ready"] },
            { name: "finishes in under 300 ms (they cook together)", expr: "(async () => { const t = Date.now(); await cookAll(); return Date.now() - t < 300; })()", expected: true },
          ],
          hints: [
            "Start all three without awaiting them: `[cook(\"rolex\", 150), cook(\"chips\", 150), cook(\"tea\", 150)]` is an array of three promises.",
            "`await Promise.all(thatArray)` waits for all of them and gives back an array of results.",
          ],
          timeoutMs: 5000,
        } },
        { type: "exercise", exercise: {
          id: "m2-l4-async-error",
          title: "5. A price that might not exist",
          brief: "`fetchPrice(name)` pretends to ask a price service. For an unknown product the promise **rejects**. Complete `priceOrZero(name)` so it returns the price, or `0` if fetching fails — without crashing.",
          starter: `const PRICES = { rice: 110000, sugar: 5000 };

function fetchPrice(name) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (PRICES[name] !== undefined) resolve(PRICES[name]);
      else reject(new Error("No price for " + name));
    }, 20);
  });
}

async function priceOrZero(name) {
  return await fetchPrice(name);
}
`,
          solution: `const PRICES = { rice: 110000, sugar: 5000 };

function fetchPrice(name) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (PRICES[name] !== undefined) resolve(PRICES[name]);
      else reject(new Error("No price for " + name));
    }, 20);
  });
}

async function priceOrZero(name) {
  try {
    return await fetchPrice(name);
  } catch (err) {
    return 0;
  }
}
`,
          tests: [
            { name: "rice costs 110000", expr: "priceOrZero(\"rice\")", expected: 110000 },
            { name: "unknown bread gives 0 instead of crashing", expr: "priceOrZero(\"bread\")", expected: 0 },
          ],
          hints: [
            "A rejected promise that you `await` throws — so ordinary `try/catch` catches it.",
            "Wrap the `return await fetchPrice(name);` in try, and `return 0;` in the catch.",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "The forgotten await",
      blocks: [
        { type: "p", text: "The most common async bug: calling a function that returns a promise and forgetting `await`. You get the **ticket**, not the food. Joined into text, a promise shows up as `[object Promise]`. Doing maths with it gives `NaN`." },
        { type: "exercise", exercise: {
          id: "m2-l4-fix-await",
          title: "Fix the receipt",
          brief: "`receiptLine()` returns `\"Total: UGX [object Promise]\"`. Find the missing `await` and fix it so it returns `\"Total: UGX 25000\"`.",
          starter: `function getTotal() {
  return new Promise((resolve) => setTimeout(() => resolve(25000), 30));
}

async function receiptLine() {
  const total = getTotal();
  return "Total: UGX " + total;
}

receiptLine().then((line) => console.log(line));
`,
          solution: `function getTotal() {
  return new Promise((resolve) => setTimeout(() => resolve(25000), 30));
}

async function receiptLine() {
  const total = await getTotal();
  return "Total: UGX " + total;
}

receiptLine().then((line) => console.log(line));
`,
          tests: [
            { name: "the receipt shows the real total", expr: "receiptLine()", expected: "Total: UGX 25000" },
          ],
          hints: [
            "Which line gets a promise back but uses it straight away?",
            "`const total = await getTotal();`",
          ],
        } },
        { type: "list", items: [
          "**Unhandled rejection.** A promise that rejects with nobody catching it. In Node.js this stops the whole program by default. Every `await` that can fail needs a `try/catch` somewhere above it.",
          "**Swallowing errors.** `catch (err) {}` with nothing inside hides the problem completely. At minimum, log `err.message` so you can find out what went wrong.",
          "**Waiting forever.** A service that never replies leaves your `await` hanging. Real code adds a timeout (Module 5).",
        ] },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "`[object Promise]` or `NaN` in output means a missing `await`. A message like `Uncaught (in promise) Error: ...` means a rejection nobody caught." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "predict",
            prompt: "In what order are the lines printed?",
            code: "console.log(\"A\");\nsetTimeout(() => console.log(\"B\"), 0);\nconsole.log(\"C\");",
            options: [
              { text: "A, B, C", why: "Even with 0 ms, the timer callback waits on the counter until the main code is finished." },
              { text: "A, C, B", why: "Correct. B is queued for later; the waiter finishes the current code (A, C) first." },
              { text: "B, A, C", why: "Nothing runs before the first line." },
            ],
            answer: 1,
            hint: "When does the waiter check the counter?",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "What does `result` hold?",
            code: "let result;\ntry {\n  JSON.parse(\"{bad}\");\n  result = \"parsed\";\n} catch (err) {\n  result = \"failed\";\n}",
            options: [
              { text: "\"parsed\"", why: "That line is skipped because the line above it throws." },
              { text: "\"failed\"", why: "Correct. JSON.parse throws, so JavaScript jumps straight into catch." },
              { text: "The program crashes", why: "The error is caught, so the program continues." },
            ],
            answer: 1,
            hint: "Is \"{bad}\" valid JSON?",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "An agent's log shows `Model said: [object Promise]`. What is the most likely cause?",
            options: [
              { text: "The model is broken.", why: "The model may be fine; the code never waited for its reply." },
              { text: "The code forgot to `await` the model call.", why: "Correct. It used the promise (the ticket) instead of the reply." },
              { text: "The reply was invalid JSON.", why: "That would cause a SyntaxError when parsing, not [object Promise]." },
            ],
            answer: 1,
            hint: "What does a promise look like when you turn it into text?",
          },
          {
            id: "q4", type: "multi", flavour: "recall",
            prompt: "Which statements about promises are true? Select all that apply.",
            options: [
              { text: "A promise starts pending and later becomes fulfilled or rejected.", why: "True." },
              { text: "`await` pauses only the async function it is in, not the whole program.", why: "True. The event loop keeps handling other work." },
              { text: "An `async` function always returns a promise.", why: "True — even if you return a plain value, it is wrapped in a promise." },
              { text: "`Promise.all` runs the tasks one after another.", why: "False. It waits for tasks that are already running at the same time." },
            ],
            answers: [0, 1, 2],
            hint: "Think about the kitchen tickets.",
          },
          {
            id: "q5", type: "mcq", flavour: "design",
            prompt: "An agent must check stock, look up a price and check the delivery area. None depends on the others. How should it call them?",
            options: [
              { text: "await each one in turn", why: "This works, but the total wait is the sum of all three." },
              { text: "Start all three and await them together with `Promise.all`", why: "Correct. Independent tasks can run at the same time, so you only wait as long as the slowest." },
              { text: "Do not await them at all", why: "Then the agent would use promises instead of real answers." },
            ],
            answer: 1,
            hint: "Do the tasks need each other's results?",
          },
          {
            id: "q6", type: "mcq", flavour: "analogy",
            prompt: "In the kitchen analogy, what is a **rejected** promise?",
            options: [
              { text: "The waiter forgetting to take the order", why: "That is closer to never calling the function." },
              { text: "The kitchen saying \"sorry, we're out of eggs\" for that ticket", why: "Correct. The ticket comes back with a failure that must be handled." },
              { text: "A dish that is ready on the counter", why: "That is a fulfilled promise waiting for the waiter." },
            ],
            answer: 1,
            hint: "Rejected means the job failed.",
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Using the restaurant kitchen, explain to a friend what a promise is, what `await` does, and what your code should do when the kitchen says no.",
          rubric: [
            { concept: "A promise is a ticket for a result that comes later", keywords: ["ticket", "later", "not ready", "pending", "promise"], hint: "What is a promise, in kitchen terms?" },
            { concept: "The program carries on while slow work happens", keywords: ["carry on", "keep", "meanwhile", "other orders", "not freeze", "doesn't freeze", "does not freeze", "same time"], hint: "What does the waiter do while food cooks?" },
            { concept: "await waits for the result inside that function", keywords: ["await", "wait"], hint: "What does await do?" },
            { concept: "Failures (rejections/errors) are caught and handled", keywords: ["catch", "try", "reject", "error", "fail", "handle"], hint: "What happens when the kitchen says no?" },
          ],
          exemplar: "A promise is like the ticket a waiter gives you when you order: the food is not ready yet, but the ticket promises it will come. While it cooks, the waiter does not stand at the stove — they keep taking other orders, so the restaurant does not freeze. In code, await is like saying \"I'll wait here for this ticket\": that function pauses until the result arrives and then carries on with the actual food. Sometimes the kitchen says no, for example they are out of eggs. That is a rejected promise. Your code should put the await inside try/catch so it can tell the customer something useful or try another option, instead of crashing.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "**Errors** are designed signals: `throw new Error(\"...\")` refuses bad input, and `try` / `catch` handles failures where you can do something useful. Slow operations are **asynchronous**: they return a **promise** (a ticket) straight away. Inside an `async` function, `await` pauses that function until the promise is fulfilled — or throws if it is rejected. `Promise.all` runs independent tasks at the same time. A missing `await` shows up as `[object Promise]`.",
          canNow: [
            "Read an error's type and message and find the line.",
            "Throw errors for bad input and catch them.",
            "Write async functions with await, and handle async errors.",
            "Run independent tasks in parallel with Promise.all.",
          ],
          next: "You can now write real logic. The last lesson gives you the professional's toolkit: the terminal, a code editor, npm packages, Git and GitHub, and how to read documentation.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  LESSON 5 — The working programmer's toolkit                             */
/* ---------------------------------------------------------------------- */

const l5: Lesson = {
  id: "m2-l5",
  moduleId: "m2",
  title: "The programmer's toolkit",
  subtitle: "The terminal, a code editor, Node.js and npm packages, Git and GitHub, and reading documentation — the tools you will use to build real agents.",
  minutes: 50,
  prerequisites: ["m2-l4"],
  objectives: [
    "Move around folders and create files in a terminal with `pwd`, `ls`, `cd`, `mkdir`, `touch` and `cat`.",
    "Run a JavaScript file with `node`, and start a project with `npm init -y` and `npm install`.",
    "Explain what package.json, dependencies and node_modules are.",
    "Save versions with `git init`, `git status`, `git add`, `git commit -m` and `git log`, and describe what GitHub adds.",
    "Use documentation to learn a function you have never seen.",
  ],
  glossary: ["terminal", "command", "directory", "file-path", "code-editor", "nodejs", "npm", "package", "dependency", "package-json", "git", "commit", "repository", "github", "documentation"],
  completion: [
    "Complete the basic missions in the practice terminal.",
    "Complete the project missions (npm and Git) in the practice terminal.",
    "Pass the documentation exercises.",
    "Pass the knowledge check and explain the project workflow in your own words.",
  ],
  tutor: {
    simpler:
      "The terminal is a window where you type instructions instead of clicking. The code editor is where you write code. Node.js runs your JavaScript. npm downloads code other people wrote. Git takes snapshots of your project so you can go back. GitHub stores those snapshots online. Documentation is the instruction manual.",
    altAnalogy:
      "Building a house: the terminal is talking to the site foreman directly; the editor is your drawing board; npm is the hardware shop where you buy ready-made doors instead of carving them; Git is the photo album of every stage of construction; GitHub is a copy of the album kept safely in town; documentation is the manufacturer's leaflet that comes with each part.",
    misconceptions: [
      "\"The terminal is only for experts or hackers.\" It is just a different way of giving instructions. Professionals use it because it is fast and exact.",
      "\"Git and GitHub are the same thing.\" Git is a program on your computer that keeps history. GitHub is a website that stores Git projects online and helps people collaborate.",
      "\"I should save node_modules in Git.\" No — it can be recreated from package.json with `npm install`, and it is huge.",
      "\"Good programmers memorise everything.\" Good programmers read documentation constantly.",
    ],
    probingQuestions: [
      "If `node hello.js` says it cannot find the file, which two commands would you type to investigate?",
      "What is the difference between `git add` and `git commit`?",
      "Why must a file containing an API key never be committed to GitHub?",
    ],
    revisit: ["m2-l1"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Code that only runs inside a lesson",
      blocks: [
        { type: "p", text: "So far your code has run inside this course's page. A real agent runs on a computer (often a server) as a **project**: a folder of files, some written by you and some downloaded from other developers, started with a command." },
        { type: "p", text: "Real projects bring practical problems. How do you create the folder and run the program? How do you use code other people wrote, such as the official library for an AI provider? And when a change breaks everything at midnight, how do you get back to yesterday's working version?" },
        { type: "p", text: "Professional developers solve these with a small set of tools they use every day. You do not need to master them now — you need to recognise them, use the basic commands, and know where to look things up." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What tools do developers use to create, run, share and safely change a real project — and how do you start using them?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "A workshop with five tools",
      blocks: [
        { type: "p", text: "Think of a carpenter's workshop in Katwe." },
        { type: "steps", items: [
          { title: "Talking to the foreman (the terminal).", text: "Instead of pointing and clicking, you give short, exact instructions: \"go into the store room\", \"make a new box\", \"start the machine\"." },
          { title: "The workbench (the code editor).", text: "Where you actually shape the wood — write and change your code — with good light and the right tools to hand." },
          { title: "The hardware shop (npm).", text: "You do not forge your own hinges. You buy standard ones and note them on the job sheet so anyone can buy the same again." },
          { title: "The photo album (Git) and the copy in town (GitHub).", text: "A dated photo at each stage, with a note: \"frame done\", \"doors fitted\". If the next stage goes wrong, you can see exactly what the last good stage looked like. A copy of the album kept in town survives even if the workshop burns." },
          { title: "The manufacturer's leaflet (documentation).", text: "Every part comes with instructions: what it does, what it needs, an example. You read it when you use a part for the first time." },
        ] },
        { type: "analogyMap", title: "From the workshop to software", pairs: [
          { everyday: "Short, exact instructions to the foreman", technical: "[[command|Commands]] typed into a [[terminal|terminal]]" },
          { everyday: "The workbench", technical: "A [[code-editor|code editor]] such as VS Code" },
          { everyday: "Buying standard parts at the hardware shop", technical: "Installing [[package|packages]] with [[npm|npm]]" },
          { everyday: "The job sheet listing every part", technical: "[[package-json|package.json]] and its list of [[dependency|dependencies]]" },
          { everyday: "A dated, labelled photo of each stage", technical: "A Git [[commit|commit]]" },
          { everyday: "The copy of the album kept in town", technical: "A [[repository|repository]] on [[github|GitHub]]" },
          { everyday: "The leaflet in the box", technical: "[[documentation|Documentation]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A photo shows a moment; a Git commit stores the **exact contents** of every tracked file, so you can actually restore them, not just look. And unlike a hardware shop, anyone can publish an npm package — so you should check a package is popular and maintained before you trust it." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Practice in a safe terminal",
      blocks: [
        { type: "p", text: "Here is a practice terminal. Type the commands for each mission and press Enter. Watch the folder tree on the right change as you work. Mistakes are fine — the messages will help you. Type `help` at any time." },
        { type: "lab", lab: "terminal-sim", props: { missions: "basics" }, required: true, caption: "A simulated terminal. The commands are the real ones; the computer behind them is pretend." },
        { type: "callout", tone: "sim", text: "This is a simulation of a real terminal, built for practice. Nothing you type touches your computer. When you use a real terminal, the commands are the same, but some messages will be worded slightly differently and you can do far more." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "The tools, one by one",
      blocks: [
        { type: "p", text: "**The terminal.** A [[terminal|terminal]] is a text window where you type [[command|commands]]. On macOS it is called Terminal; on Linux it is usually Terminal too; on Windows you can use PowerShell, or Git Bash (installed with Git). The terminal is always \"in\" one folder, the working [[directory|directory]]. A [[file-path|path]] like `/home/student/shop/hello.js` says exactly where a file is; `~` is short for your home folder and `..` means \"the folder above\"." },
        { type: "table", caption: "The commands you practised (macOS / Linux / Git Bash)", head: ["Command", "What it does"], rows: [
          ["pwd", "Print the working directory: where am I?"],
          ["ls", "List the files and folders here."],
          ["cd shop  /  cd ..  /  cd ~", "Move into shop / up one level / home."],
          ["mkdir shop", "Make a new folder."],
          ["touch hello.js", "Create an empty file. (In PowerShell use: New-Item hello.js)"],
          ["cat hello.js", "Print a file's contents."],
          ["node hello.js", "Run a JavaScript file with Node.js."],
        ] },
        { type: "p", text: "**The code editor.** A [[code-editor|code editor]] is where you write code. Visual Studio Code (VS Code, free from code.visualstudio.com) is the most popular: it colours your code, points out mistakes as you type, and has a terminal built in (menu **Terminal → New Terminal**). Open your project folder in it, edit files, save, then run them in the terminal." },
        { type: "p", text: "**Node.js and npm.** [[nodejs|Node.js]] runs JavaScript outside the browser — on your laptop or a server. Installing it also installs [[npm|npm]], the tool for [[package|packages]]: code published by other developers. `npm init -y` creates [[package-json|package.json]], the project's ID card. `npm install dayjs` downloads a package into a folder called `node_modules`, and records it under `\"dependencies\"` in package.json (with a version range like `^1.11.13`). It also writes `package-lock.json`, which pins exact versions so everyone gets the same code. Anyone who copies your project runs `npm install` to download the same [[dependency|dependencies]]." },
        { type: "p", text: "**Git.** [[git|Git]] is a version-control program. `git init` turns a folder into a [[repository|repository]] (it creates a hidden `.git` folder for the history). Saving a version takes two steps: `git add` chooses which changes go into the next snapshot (\"staging\"), and `git commit -m \"message\"` saves the snapshot with a note. `git status` shows what has changed and what is staged; `git log` lists the [[commit|commits]]. A file called `.gitignore` lists things Git should ignore, such as `node_modules` and secret files." },
        { type: "p", text: "**GitHub.** [[github|GitHub]] is a website that hosts Git repositories online. It gives you a backup, lets others see and contribute to your code, and many hosting services can deploy straight from it (Module 16). Your laptop's Git sends commits there with `git push`." },
        { type: "callout", tone: "warn", title: "Never commit secrets", text: "AI agents need API keys (secret passwords for paid services). Keys are kept in a file such as `.env` that is listed in `.gitignore`. A key pushed to a public GitHub repository can be found by automated scanners within minutes and used to run up charges on your account. You will learn the safe pattern in Module 5." },
        { type: "p", text: "**Documentation.** [[documentation|Documentation]] explains how to use a language, tool or service. For JavaScript, the MDN Web Docs (developer.mozilla.org) are the standard reference; Node.js, npm, Git, GitHub and every AI provider publish their own. A typical entry gives the **syntax** (how to write it), **parameters** (the inputs), the **return value** (the output), **exceptions** (errors it can throw) and **examples**. Read the example first, then the parameters." },
      ],
    },
    {
      kind: "example",
      mode: "build",
      title: "Setting up a real project on your own computer",
      blocks: [
        { type: "p", text: "When you have access to a laptop or desktop, this is how to set up for real. You do not need to do it now to continue the course — the practice terminal and exercises cover the ideas — but you will need it from Module 5 onwards." },
        { type: "steps", items: [
          { title: "Install Node.js.", text: "Go to **nodejs.org** and download the version marked **LTS** (Long-Term Support) for your system: an installer for Windows or macOS. On Linux, nodejs.org lists the recommended options, such as a version manager. Installers and recommended methods change over time, so follow the current instructions on nodejs.org rather than any old tutorial — including this one." },
          { title: "Check it worked.", text: "Open a **new** terminal window (an old one will not see the new install) and run `node -v` and `npm -v`. Each should print a version number (Node.js prints something like v24.11.0; yours may well be newer). If you see \"command not found\" instead, the install did not finish or the terminal is too old." },
          { title: "Install Git and VS Code.", text: "Git from **git-scm.com** (on Windows this also gives you Git Bash). VS Code from **code.visualstudio.com**. Then tell Git your name and email once, with the two `git config` commands below." },
          { title: "Create and run the project.", text: "Use the commands below. Create `index.js` in VS Code rather than with echo — on Windows PowerShell, echo can save files in a text encoding that Node.js cannot read." },
        ] },
        { type: "code", lang: "bash", code: `# Check the tools are installed (your numbers will differ)
node -v
npm -v
git --version

# One-time Git setup: your name and email appear on every commit
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Create a project
mkdir shop-calculator
cd shop-calculator
npm init -y
code .                      # opens the folder in VS Code (if the 'code' command is set up)

# ...create index.js in the editor, containing: console.log("Hello, Kampala!");
node index.js

# Save the first version with Git
echo node_modules > .gitignore
git init
git add .
git commit -m "First version"
git log`, caption: "Run these one line at a time. Lines starting with # are comments; you do not type them." },
        { type: "p", text: "To put the project on GitHub: create a free account at github.com, click **New repository**, give it a name, and leave it empty (no README). GitHub then shows you the exact commands to connect your folder. They look like this:" },
        { type: "code", lang: "bash", code: `git remote add origin https://github.com/YOUR-USERNAME/shop-calculator.git
git branch -M main
git push -u origin main`, caption: "Replace YOUR-USERNAME. GitHub no longer accepts your account password for git push: sign in through the browser window Git opens, or follow GitHub's current documentation on authentication." },
      ],
    },
    {
      kind: "challenge",
      mode: "experiment",
      title: "A project from start to first commit",
      blocks: [
        { type: "p", text: "Now do the whole professional workflow in the practice terminal: run a program, make it an npm project, install a package, and save your first Git commit. Watch the Git markers in the folder tree change from **U** (untracked) to **A** (staged) to **✓** (committed)." },
        { type: "lab", lab: "terminal-sim", props: { missions: "project" }, required: true, caption: "Simulated terminal — project missions." },
        { type: "p", text: "Then practise the most underrated programming skill: reading documentation. Each brief below contains a short excerpt written in the style of MDN, the main JavaScript reference." },
        { type: "exercise", exercise: {
          id: "m2-l5-dependencies",
          title: "1. Read a package.json",
          brief: "Docs excerpt — **Object.keys(obj)**: \"Returns an array of a given object's own property names, in the same order as a normal loop would visit them.\" Complete `listDependencies(text)`: parse the package.json text and return an array of the dependency **names**. If there is no `dependencies` property, return an empty array.",
          starter: `const packageText = \`{
  "name": "shop-calculator",
  "version": "1.0.0",
  "dependencies": { "dayjs": "^1.11.13", "zod": "^3.24.1" }
}\`;

function listDependencies(text) {
  // 1. parse the JSON text
  // 2. return the names of the dependencies
}

console.log(listDependencies(packageText));
`,
          solution: `const packageText = \`{
  "name": "shop-calculator",
  "version": "1.0.0",
  "dependencies": { "dayjs": "^1.11.13", "zod": "^3.24.1" }
}\`;

function listDependencies(text) {
  const pkg = JSON.parse(text);
  if (!pkg.dependencies) {
    return [];
  }
  return Object.keys(pkg.dependencies);
}

console.log(listDependencies(packageText));
`,
          tests: [
            { name: "finds dayjs and zod", expr: "listDependencies(packageText)", expected: ["dayjs", "zod"] },
            { name: "no dependencies gives []", expr: "listDependencies('{\"name\":\"empty-project\"}')", expected: [] },
          ],
          hints: [
            "Start with `const pkg = JSON.parse(text);`",
            "`pkg.dependencies` is an object. `Object.keys(pkg.dependencies)` gives its property names.",
            "If `pkg.dependencies` is undefined, return `[]` before calling Object.keys.",
          ],
        } },
        { type: "exercise", exercise: {
          id: "m2-l5-padstart",
          title: "2. Use a method you have never seen",
          brief: "Docs excerpt — **str.padStart(targetLength, padString)** (a string method): \"Pads the current string with another string (repeated, if needed) so that the resulting string reaches the given length. The padding is applied from the start of the current string. If targetLength is less than or equal to the string's length, the string is returned as-is.\" Complete `receiptNumber(n)` so `7` gives `\"R-0007\"`, `123` gives `\"R-0123\"` and `12345` gives `\"R-12345\"`. Note that padStart works on **strings**, so convert the number first with `String(n)`.",
          starter: `function receiptNumber(n) {
  return "R-" + n;
}
`,
          solution: `function receiptNumber(n) {
  return "R-" + String(n).padStart(4, "0");
}
`,
          tests: [
            { name: "7 → R-0007", expr: "receiptNumber(7)", expected: "R-0007" },
            { name: "123 → R-0123", expr: "receiptNumber(123)", expected: "R-0123" },
            { name: "12345 is longer than 4, so unchanged", expr: "receiptNumber(12345)", expected: "R-12345" },
          ],
          hints: [
            "Which argument is the length you want (4) and which is the padding character (\"0\")?",
            "`String(n).padStart(4, \"0\")`",
          ],
        } },
        { type: "exercise", required: false, exercise: {
          id: "m2-l5-should-commit",
          title: "3. Stretch: what belongs in Git?",
          brief: "Optional. Docs excerpt — **str.startsWith(searchString)** (a string method): \"Returns true if the string begins with the characters of searchString, otherwise false.\" Complete `shouldCommit(path)`: return `false` for anything inside `node_modules/` and for the secrets file `.env`; return `true` for everything else.",
          starter: `function shouldCommit(path) {
  return true;
}
`,
          solution: `function shouldCommit(path) {
  if (path.startsWith("node_modules/")) {
    return false;
  }
  if (path === ".env") {
    return false;
  }
  return true;
}
`,
          tests: [
            { name: "index.js is committed", expr: "shouldCommit(\"index.js\")", expected: true },
            { name: "package.json is committed", expr: "shouldCommit(\"package.json\")", expected: true },
            { name: "node_modules is not", expr: "shouldCommit(\"node_modules/dayjs/index.js\")", expected: false },
            { name: ".env (secrets) is not", expr: "shouldCommit(\".env\")", expected: false },
          ],
          hints: [
            "`path.startsWith(\"node_modules/\")` is true for anything inside that folder.",
            "Compare exactly with `path === \".env\"`.",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "experiment",
      title: "\"It works on my machine\"",
      blocks: [
        { type: "p", text: "Most beginner trouble with tools is not about code at all. It is about **where you are** and **what is installed**. Try a few of these in the practice terminal above to see the messages." },
        { type: "table", caption: "Messages you will meet, and what they usually mean", head: ["You see", "Usually means", "Fix"], rows: [
          ["Error: Cannot find module '/…/hello.js'", "You are in the wrong folder, or the name is misspelled.", "Run pwd and ls. cd into the project. Check the spelling and the .js ending."],
          ["bash: cd..: command not found", "Missing space.", "cd .. (with a space)."],
          ["command not found: node (or 'node' is not recognized…)", "Node.js is not installed, or the terminal was opened before installing.", "Install from nodejs.org, then open a NEW terminal."],
          ["npm error 404 Not Found", "The package name is misspelled or does not exist.", "Check the exact name on npmjs.com."],
          ["fatal: not a git repository", "You are outside the project folder, or never ran git init.", "cd into the project; run git init once."],
          ["nothing added to commit but untracked files present", "You committed without staging.", "git add the files first, then commit."],
          ["npm.ps1 cannot be loaded because running scripts is disabled", "Windows PowerShell's script security setting is blocking npm.", "Use Command Prompt or Git Bash, or search the exact message for the current recommended fix."],
        ] },
        { type: "callout", tone: "tip", title: "The debugging habit", text: "Read the **whole** error message, top to bottom. Then copy its most specific line into a search engine or the documentation. Almost every error a beginner meets has been met — and explained — thousands of times before." },
        { type: "callout", tone: "warn", title: "How to recognise a wrong-folder problem", text: "If a command says a file does not exist but you can see it in your editor, the terminal is almost certainly in a different folder. `pwd` answers it in one second." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "predict",
            prompt: "You are in `/home/student/shop`. What does this print?",
            code: "cd ..\npwd",
            options: [
              { text: "/home/student/shop", why: "cd .. moved you up a level first." },
              { text: "/home/student", why: "Correct. .. means the folder above." },
              { text: "/home", why: "That would need cd .. twice." },
              { text: "..", why: "pwd prints the full path, not what you typed." },
            ],
            answer: 1,
            hint: "What does .. mean?",
          },
          {
            id: "q2", type: "mcq", flavour: "debug",
            prompt: "`node index.js` says `Cannot find module '/home/student/index.js'`. The file is in `/home/student/shop-calculator`. What should you do?",
            options: [
              { text: "Reinstall Node.js", why: "Node is working — it just looked in the wrong folder." },
              { text: "cd shop-calculator, then run node index.js again", why: "Correct. The path in the error shows the terminal was in /home/student." },
              { text: "Rename the file to index.json", why: "That would make it a JSON file, which node would not run as a program." },
            ],
            answer: 1,
            hint: "Read the folder in the error message.",
          },
          {
            id: "q3", type: "order",
            prompt: "Put these steps for saving a project to GitHub in order.",
            items: [
              "git init (once, in the project folder)",
              "Write or change files in the editor",
              "git add . (stage the changes)",
              "git commit -m \"Describe the change\"",
              "git push (send commits to GitHub)",
            ],
            hint: "You can only commit what is staged, and only push what is committed.",
            explanation: "Create the repository once; then the everyday cycle is edit → add → commit, and push to send commits to GitHub.",
          },
          {
            id: "q4", type: "multi", flavour: "design",
            prompt: "Which of these should **not** be committed to a public GitHub repository? Select all that apply.",
            options: [
              { text: "node_modules/", why: "Correct — it is large and can be recreated with npm install." },
              { text: ".env containing your AI API key", why: "Correct — secrets must never be committed." },
              { text: "package.json", why: "This should be committed: it lists the dependencies so others can install them." },
              { text: "index.js", why: "This is your code — commit it." },
            ],
            answers: [0, 1],
            hint: "What can be recreated, and what is secret?",
          },
          {
            id: "q5", type: "mcq", flavour: "recall",
            prompt: "What does `npm install dayjs` do?",
            options: [
              { text: "Installs Node.js", why: "Node.js is installed from nodejs.org; npm comes with it." },
              { text: "Downloads the dayjs package into node_modules and records it in package.json", why: "Correct." },
              { text: "Uploads your project to npm", why: "That is npm publish, which you will not need in this course." },
              { text: "Runs the file dayjs.js", why: "Running a file is node dayjs.js." },
            ],
            answer: 1,
            hint: "npm is the package manager.",
          },
          {
            id: "q6", type: "mcq", flavour: "analogy",
            prompt: "In the workshop picture, why is a Git commit like a dated, labelled photo of each stage?",
            options: [
              { text: "Because it makes the project look nicer", why: "Commits do not change how code looks." },
              { text: "Because it records exactly what the project was at that moment, with a note, so you can go back to it", why: "Correct — and unlike a photo, Git can actually restore the files." },
              { text: "Because it sends the project to customers", why: "Sending to GitHub is push; delivering to users is deployment." },
            ],
            answer: 1,
            hint: "What is the album for?",
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "A friend has just installed Node.js and asks: \"How do I start a project, use someone else's package, and keep my work safe?\" Walk them through it in your own words.",
          rubric: [
            { concept: "Use the terminal to make a folder, move into it and run code with node", keywords: ["terminal", "mkdir", "cd", "folder", "node "], hint: "How do they create and run the project?" },
            { concept: "npm init creates package.json; npm install adds packages as dependencies", keywords: ["npm", "package.json", "install", "dependenc", "package"], hint: "How do they use someone else's code?" },
            { concept: "Git saves versions: add then commit with a message", keywords: ["git", "commit", "add", "snapshot", "version", "history"], hint: "How do they keep versions?" },
            { concept: "GitHub stores a copy online; secrets and node_modules stay out", keywords: ["github", "push", "online", "backup", ".gitignore", "secret", "node_modules", ".env"], hint: "Where is the backup, and what must not go there?" },
          ],
          exemplar: "Open a terminal, make a folder with mkdir shop and cd into it. Run npm init -y, which creates package.json — the project's ID card. Write your code in an editor like VS Code, save it as index.js, and run it with node index.js. To use someone else's code, run npm install with the package name: it downloads it into node_modules and lists it as a dependency in package.json. To keep work safe, run git init once, then every time you reach a good point, git add . and git commit -m with a short message — that saves a snapshot you can go back to. Put node_modules and any .env file with secrets in .gitignore. Finally, push to GitHub so there is a backup online.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "The **terminal** runs exact commands in a working folder (`pwd`, `ls`, `cd`, `mkdir`, `touch`, `cat`, `node`). A **code editor** is where you write. **npm** manages **packages**: `npm init -y` creates package.json and `npm install` adds **dependencies** into node_modules. **Git** saves snapshots (`git add`, then `git commit -m`), and **GitHub** keeps them online. Keep node_modules and secrets out of Git. When in doubt, read the **documentation** and the whole error message.",
          canNow: [
            "Navigate folders and run a JavaScript file from a terminal.",
            "Create an npm project and install a package.",
            "Make Git commits and explain what GitHub is for.",
            "Learn a new function from its documentation.",
          ],
          next: "Put it all together in Project 1: the Simple Shop Calculator. Then, in Module 3, you will open up the language model itself and see how it produces text.",
        },
      ],
    },
  ],
};

export const m02Lessons: Lesson[] = [l1, l2, l3, l4, l5];

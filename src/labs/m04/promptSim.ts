/**
 * PROMPT LAB SIMULATOR (pure logic, no React)
 * -------------------------------------------
 * A deliberately simple, RULE-BASED stand-in for a language model.
 * It looks for a handful of prompt "features" using transparent keyword
 * rules, and responds in a fixed way depending on which are present.
 *
 * Real models do NOT work like this. They are not rule-based and do not look
 * for keywords. The simulation only demonstrates a real TENDENCY: clearer,
 * more complete prompts tend to produce more reliable, consistent outputs.
 */

export const LABELS = ["order", "question", "complaint", "other"] as const;
export type Label = (typeof LABELS)[number];

export type FeatureId = "role" | "task" | "context" | "examples" | "format" | "constraints";

export interface FeatureInfo {
  id: FeatureId;
  name: string;
  /** How the simulator detects it (shown to the learner). */
  rule: string;
  /** What changes in this simulation when it is missing (shown to the learner). */
  effect: string;
  /** A building block the learner can insert. */
  snippet: string;
}

export const FEATURES: FeatureInfo[] = [
  {
    id: "role",
    name: "Role",
    rule: "The prompt contains “you are”, “act as” or “your job/role”.",
    effect: "No test in this simulation depends on the role alone. In real models a role mostly sets tone and focus; for a sorting task it matters less than the task and format.",
    snippet: "You are a message sorter for Mama Achen's shop.",
  },
  {
    id: "task",
    name: "Task",
    rule: "The prompt uses a word like classify, categorise, label or sort, AND names all four labels: order, question, complaint, other.",
    effect: "With no task word, the sim replies to the customer instead of sorting. With a task word but not all four labels, it invents its own labels.",
    snippet: "Classify the customer message into exactly one category: order, question, complaint or other.",
  },
  {
    id: "context",
    name: "Context",
    rule: "The prompt explains a shop fact: it mentions “the usual”, “regular customers” or a “standing order”.",
    effect: "Without it, “Is the usual ready?” is labelled other: nothing in the prompt says what “the usual” means.",
    snippet: "Context: messages come from customers of Mama Achen's shop in Nakawa. Regular customers write “the usual” to mean their standing weekly order, so treat it as an order.",
  },
  {
    id: "examples",
    name: "Examples",
    rule: "At least two example lines that end in an arrow and a label, like: \"Send 2 bags of posho\" -> order",
    effect: "Without examples, a price question that mentions a product and an amount is labelled order instead of question.",
    snippet: "Examples:\n\"Send 2 bags of posho tomorrow\" -> order\n\"How much is a tray of eggs?\" -> question\n\"The beans had stones in them\" -> complaint",
  },
  {
    id: "format",
    name: "Output format",
    rule: "The prompt mentions JSON AND shows the exact shape, e.g. {\"category\": \"order\"}.",
    effect: "Without it, the sim answers in a sentence such as “This looks like an order.”, which your code cannot read reliably.",
    snippet: "Output format: JSON exactly like {\"category\": \"order\"}",
  },
  {
    id: "constraints",
    name: "Constraints",
    rule: "The prompt contains “only”, “no other text”, “nothing else” or “do not add”.",
    effect: "Without it, the sim adds a friendly sentence after the JSON, which breaks JSON parsing.",
    snippet: "Return only the JSON. Do not add any other text.",
  },
];

export const CONFLICT_RULE =
  "The prompt asks for JSON AND also asks for “a friendly sentence”, “a full sentence” or “a reply to the customer”.";

export interface TestInput {
  id: string;
  text: string;
  expected: Label;
  /** Label the sim invents when the four labels are not listed. */
  invented: string;
  /** The chatty reply the sim gives when no task is stated. */
  reply: string;
}

export const TEST_INPUTS: TestInput[] = [
  {
    id: "rice",
    text: "Do you have 3 bags of rice? Please deliver tomorrow.",
    expected: "order",
    invented: "delivery request",
    reply: "Hello! Yes, we have rice. I will arrange delivery of 3 bags for tomorrow. Thank you for shopping with us!",
  },
  {
    id: "price",
    text: "How much is 2 kg of sugar?",
    expected: "question",
    invented: "price enquiry",
    reply: "Sugar is usually around UGX 5,000 per kg, so 2 kg would be about UGX 10,000.",
  },
  {
    id: "oil",
    text: "The cooking oil you sold me yesterday was leaking. I want my money back.",
    expected: "complaint",
    invented: "refund request",
    reply: "I am so sorry to hear that! Please bring the bottle back and we will sort it out.",
  },
  {
    id: "usual",
    text: "Is the usual ready? I'll pick it up at 5.",
    expected: "order",
    invented: "pickup",
    reply: "Hello! Could you remind me what you usually order?",
  },
  {
    id: "sunday",
    text: "Hello, are you open on Sunday afternoon?",
    expected: "question",
    invented: "opening hours",
    reply: "Hello! Many shops in Kampala open on Sunday afternoons. Please check with the shop.",
  },
];

export type Detected = Record<FeatureId, boolean> & {
  taskWord: boolean;
  labelsNamed: number;
  conflict: boolean;
};

const has = (re: RegExp, s: string) => re.test(s);

/** Detect prompt features with transparent keyword rules. */
export function detectFeatures(prompt: string): Detected {
  const p = prompt;
  const taskWord = has(/\b(classify|classification|categori[sz]e|label|sort)\b/i, p);
  const labelsNamed = LABELS.filter((l) => new RegExp(`\\b${l}\\b`, "i").test(p)).length;
  const exampleLines = p
    .split(/\n/)
    .filter((line) => /(->|→|=>)\s*(\{\s*"?category"?\s*:\s*)?"?(order|question|complaint|other)\b/i.test(line)).length;
  const format = has(/\bjson\b/i, p) && has(/\{\s*"category"\s*:/i, p);
  return {
    role: has(/\byou are\b|\bact as\b|\byour (job|role)\b/i, p),
    taskWord,
    labelsNamed,
    task: taskWord && labelsNamed === LABELS.length,
    context: has(/\bthe usual\b|\bregular customers?\b|\bstanding order\b/i, p),
    examples: exampleLines >= 2,
    format,
    constraints: has(/\bonly\b|no other text|nothing else|do not add|don't add/i, p),
    conflict: format && has(/\b(friendly|full) sentence\b|\breply to the customer\b|\bwrite a reply\b/i, p),
  };
}

export interface SimOutput {
  /** Exact text the simulated model "returns". */
  text: string;
  /** Short reasons explaining which rule produced this output. */
  reasons: string[];
}

function article(label: string) {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}

/** Produce the simulated model output for one test input. Deterministic. */
export function simulate(prompt: string, input: TestInput, index: number): SimOutput {
  const f = detectFeatures(prompt);
  const reasons: string[] = [];

  if (!f.taskWord) {
    reasons.push("No task word (classify, label, sort…), so the sim does the most common thing with a customer message: it replies to the customer.");
    return { text: input.reply, reasons };
  }

  let label: string = input.expected;
  if (!f.task) {
    label = input.invented;
    reasons.push(`The four allowed labels are not all named, so the sim invents its own label (“${label}”).`);
  } else {
    if (input.id === "price" && !f.examples) {
      label = "order";
      reasons.push("No examples: the message mentions a product and an amount, so the sim guesses order.");
    }
    if (input.id === "usual" && !f.context) {
      label = "other";
      reasons.push("No context about “the usual”, so the sim cannot tell this is an order.");
    }
  }

  if (f.conflict && index % 2 === 0) {
    reasons.push("Conflicting instructions (JSON and a friendly sentence): the sim follows a different one on alternate messages.");
    return { text: `Thank you for your message! I have marked it as ${article(label)} ${label}.`, reasons };
  }

  if (!f.format) {
    reasons.push("No output format shown, so the answer is a sentence instead of JSON.");
    return { text: `This message looks like ${article(label)} ${label}.`, reasons };
  }

  const json = JSON.stringify({ category: label });
  if (!f.constraints) {
    reasons.push("No constraint like “return only the JSON”, so the sim adds a friendly sentence after it.");
    return { text: `${json}\nLet me know if you need anything else!`, reasons };
  }
  if (reasons.length === 0) reasons.push("Every feature this message needs is present.");
  return { text: json, reasons };
}

export interface Graded {
  input: TestInput;
  output: SimOutput;
  formatOk: boolean;
  correct: boolean;
  got: string | null;
}

/** Grade an output the way YOUR code would: parse it, check the label, compare. */
export function grade(input: TestInput, output: SimOutput): Graded {
  let got: string | null = null;
  let formatOk = false;
  try {
    const v: unknown = JSON.parse(output.text);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const c = (v as Record<string, unknown>).category;
      if (typeof c === "string") {
        got = c;
        formatOk = (LABELS as readonly string[]).includes(c) && Object.keys(v).length === 1;
      }
    }
  } catch {
    /* not JSON: formatOk stays false */
  }
  return { input, output, formatOk, correct: formatOk && got === input.expected, got };
}

export interface RunSummary {
  results: Graded[];
  formatOk: number;
  correct: number;
  total: number;
  /** Fraction of inputs that were both correctly formatted and correct (0–1). */
  consistency: number;
}

export function runPrompt(prompt: string, inputs: TestInput[] = TEST_INPUTS): RunSummary {
  const results = inputs.map((inp, i) => grade(inp, simulate(prompt, inp, i)));
  const correct = results.filter((r) => r.correct).length;
  return {
    results,
    formatOk: results.filter((r) => r.formatOk).length,
    correct,
    total: inputs.length,
    consistency: inputs.length ? correct / inputs.length : 0,
  };
}

export const PRESETS: Record<string, { title: string; prompt: string; note: string }> = {
  weak: {
    title: "A weak first try",
    prompt: "Look at this customer message and tell me about it.",
    note: "This is how most first prompts look: short, vague and missing almost everything.",
  },
  conflict: {
    title: "A prompt that fights itself",
    prompt:
      "You are a message sorter for Mama Achen's shop.\nClassify each customer message as order, question, complaint or other.\nReturn JSON like {\"category\": \"order\"}. Return only the JSON.\nAlways write a friendly sentence to the customer too.",
    note: "It looks thorough, but it contains a contradiction, an ambiguous case with no example, and is missing a shop fact.",
  },
};

export const STRONG_PROMPT = [
  FEATURES[0].snippet,
  FEATURES[1].snippet,
  FEATURES[2].snippet,
  FEATURES[3].snippet,
  FEATURES[4].snippet,
  FEATURES[5].snippet,
].join("\n\n");

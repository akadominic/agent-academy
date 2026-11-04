/**
 * SCHEMA VALIDATOR LAB (pure logic, no React)
 * Reuses the course's own validator in src/engine/agent/jsonSchema.ts.
 */
import { safeParseJSON, validate, type JSONSchema, type SchemaProblem } from "@/engine/agent/jsonSchema";

export const UNITS = ["bag", "kg", "litre", "tray", "bunch", "piece"];

export const PRODUCT_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    product: { type: "string", minLength: 1, description: "The product name, e.g. rice" },
    quantity: { type: "integer", minimum: 1, description: "How many units, as a whole number" },
    unit: { type: "string", enum: UNITS, description: "The unit the customer asked for" },
  },
  required: ["product", "quantity", "unit"],
  additionalProperties: false,
};

export interface Expected {
  product: string;
  quantity: number;
  unit: string;
}

export interface Sample {
  id: string;
  title: string;
  /** The customer's message the model was extracting from. */
  message: string;
  /** What the "model" returned (exact text). */
  output: string;
  /** The values the customer actually asked for. */
  expected: Expected;
  /** A hint about what went wrong. */
  hint: string;
  /** False for the reference example that is already correct. */
  broken: boolean;
}

export const SAMPLES: Sample[] = [
  {
    id: "valid",
    title: "A good one",
    message: "Do you have 3 bags of rice?",
    output: '{\n  "product": "rice",\n  "quantity": 3,\n  "unit": "bag"\n}',
    expected: { product: "rice", quantity: 3, unit: "bag" },
    hint: "This one is already valid. Use it as your model for the others.",
    broken: false,
  },
  {
    id: "missing",
    title: "Missing field",
    message: "Please send 2 kg of sugar.",
    output: '{\n  "product": "sugar",\n  "quantity": 2\n}',
    expected: { product: "sugar", quantity: 2, unit: "kg" },
    hint: "The schema lists three required fields. Which one is not there? Remember the comma between fields.",
    broken: true,
  },
  {
    id: "type",
    title: "Wrong type",
    message: "I need 2 trays of eggs.",
    output: '{\n  "product": ["eggs"],\n  "quantity": 2,\n  "unit": "tray"\n}',
    expected: { product: "eggs", quantity: 2, unit: "tray" },
    hint: "product must be a string. Square brackets make it an array (a list).",
    broken: true,
  },
  {
    id: "extra",
    title: "Extra field",
    message: "One bag of posho, please.",
    output: '{\n  "product": "posho",\n  "quantity": 1,\n  "unit": "bag",\n  "price": 28000\n}',
    expected: { product: "posho", quantity: 1, unit: "bag" },
    hint: "The schema says no other fields are allowed. Also ask: where did the model get that price? Your code should look prices up, not trust the model.",
    broken: true,
  },
  {
    id: "comma",
    title: "Trailing comma",
    message: "Add 1 bunch of matooke.",
    output: '{\n  "product": "matooke",\n  "quantity": 1,\n  "unit": "bunch",\n}',
    expected: { product: "matooke", quantity: 1, unit: "bunch" },
    hint: "JSON does not allow a comma after the last field. JavaScript objects do, which is why this mistake is common.",
    broken: true,
  },
  {
    id: "text",
    title: "Quantity as text",
    message: "Three bags of rice for the school kitchen.",
    output: '{\n  "product": "rice",\n  "quantity": "three",\n  "unit": "bag"\n}',
    expected: { product: "rice", quantity: 3, unit: "bag" },
    hint: "quantity must be a number, written without quotes: 3, not \"three\".",
    broken: true,
  },
  {
    id: "fence",
    title: "Wrapped in a code fence",
    message: "5 litres of cooking oil.",
    output: '```json\n{"product": "cooking oil", "quantity": 5, "unit": "litre"}\n```',
    expected: { product: "cooking oil", quantity: 5, unit: "litre" },
    hint: "Models often wrap JSON in ``` marks for display. Those marks are not JSON. Delete the first and last lines.",
    broken: true,
  },
];

/** A friendly explanation for common reasons JSON fails to parse. */
export function explainParseError(text: string): string {
  const t = text.trim();
  if (t === "") return "There is nothing here. JSON needs at least {}.";
  if (t.startsWith("```")) return "The text starts with ``` (a Markdown code fence). That is formatting for humans, not JSON.";
  if (/,\s*[}\]]/.test(t)) return "There is a comma right before a closing } or ]. JSON does not allow a trailing comma.";
  if (/'[^']*'\s*:/.test(t) || /:\s*'[^']*'/.test(t)) return "JSON strings must use double quotes \" \", not single quotes ' '.";
  if (/[{,]\s*[A-Za-z_]\w*\s*:/.test(t)) return "Every field name must be in double quotes, like \"product\".";
  if (!t.startsWith("{") && !t.startsWith("[")) return "JSON for an object must start with {. Is there extra text before it?";
  if (!t.endsWith("}") && !t.endsWith("]")) return "The text does not end with }. Is something cut off, or is there extra text after it?";
  if (/"\s*\n\s*"/.test(t)) return "Two fields are next to each other without a comma between them.";
  return "Check commas between fields, double quotes around names and text, and matching { }.";
}

export interface SampleCheck {
  parsed: boolean;
  parseError?: string;
  parseHint?: string;
  problems: SchemaProblem[];
  /** Differences between the (schema-valid) values and what the customer asked for. */
  meaning: string[];
  schemaValid: boolean;
  fixed: boolean;
}

export function checkSample(text: string, sample: Sample): SampleCheck {
  const parsed = safeParseJSON(text);
  if (!parsed.ok) {
    return { parsed: false, parseError: parsed.error, parseHint: explainParseError(text), problems: [], meaning: [], schemaValid: false, fixed: false };
  }
  const problems = validate(PRODUCT_SCHEMA, parsed.value);
  const meaning: string[] = [];
  if (problems.length === 0) {
    const v = parsed.value as Record<string, unknown>;
    const e = sample.expected;
    if (String(v.product).trim().toLowerCase() !== e.product) meaning.push(`product is "${String(v.product)}", but the customer asked for ${e.product}.`);
    if (v.quantity !== e.quantity) meaning.push(`quantity is ${String(v.quantity)}, but the customer asked for ${e.quantity}.`);
    if (v.unit !== e.unit) meaning.push(`unit is "${String(v.unit)}", but the customer asked for ${e.unit}.`);
  }
  const schemaValid = problems.length === 0;
  return { parsed: true, problems, meaning, schemaValid, fixed: schemaValid && meaning.length === 0 };
}

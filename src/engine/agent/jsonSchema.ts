/**
 * A small, dependency-free JSON Schema validator.
 *
 * Real projects usually use a library (Ajv, Zod, etc.). We write our own
 * so learners can read every line. It supports the subset of JSON Schema
 * that tool definitions normally use.
 */

export type SchemaType = "string" | "number" | "integer" | "boolean" | "array" | "object" | "null";

export interface JSONSchema {
  type?: SchemaType;
  description?: string;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JSONSchema;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface SchemaProblem {
  path: string;
  message: string;
}

function typeOf(value: unknown): SchemaType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value as SchemaType;
}

// #region validate
export function validate(schema: JSONSchema, value: unknown, path = "$"): SchemaProblem[] {
  const problems: SchemaProblem[] = [];
  const actual = typeOf(value);

  // 1. Is it the right kind of value?
  if (schema.type) {
    const ok =
      schema.type === actual ||
      (schema.type === "number" && actual === "integer");
    if (!ok) {
      problems.push({ path, message: `expected ${schema.type} but got ${actual}` });
      return problems; // no point checking further
    }
  }

  // 2. Is it one of the allowed values?
  if (schema.enum && !schema.enum.includes(value)) {
    problems.push({ path, message: `must be one of: ${schema.enum.map((v) => JSON.stringify(v)).join(", ")}` });
  }

  // 3. Numbers: within range?
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum)
      problems.push({ path, message: `must be at least ${schema.minimum}` });
    if (schema.maximum !== undefined && value > schema.maximum)
      problems.push({ path, message: `must be at most ${schema.maximum}` });
  }

  // 4. Strings: length and pattern
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength)
      problems.push({ path, message: `must have at least ${schema.minLength} characters` });
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      problems.push({ path, message: `must have at most ${schema.maxLength} characters` });
    if (schema.pattern && !new RegExp(schema.pattern).test(value))
      problems.push({ path, message: `does not match the pattern ${schema.pattern}` });
  }

  // 5. Arrays: check every item
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      problems.push({ path, message: `needs at least ${schema.minItems} item(s)` });
    if (schema.maxItems !== undefined && value.length > schema.maxItems)
      problems.push({ path, message: `allows at most ${schema.maxItems} item(s)` });
    if (schema.items) {
      value.forEach((item, i) => problems.push(...validate(schema.items!, item, `${path}[${i}]`)));
    }
  }

  // 6. Objects: required fields, known fields, and each field's own rules
  if (actual === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) problems.push({ path: `${path}.${key}`, message: "is required but missing" });
    }
    for (const [key, v] of Object.entries(obj)) {
      const propSchema = schema.properties?.[key];
      if (propSchema) problems.push(...validate(propSchema, v, `${path}.${key}`));
      else if (schema.additionalProperties === false)
        problems.push({ path: `${path}.${key}`, message: "is not an allowed field" });
    }
  }

  return problems;
}
// #endregion validate

/** Parse text that is supposed to be JSON, returning a friendly error instead of throwing. */
export function safeParseJSON(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

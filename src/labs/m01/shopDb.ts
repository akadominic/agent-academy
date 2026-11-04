/**
 * A tiny in-memory "shop database" for the database-explorer lab, plus
 * functions that show the equivalent SQL for each action. The SQL shown is
 * standard and runs in SQLite; this file does not run SQL itself.
 * All names and numbers are illustrative.
 */

export type TableName = "products" | "customers" | "orders";
export type Value = string | number;
export type Row = Record<string, Value>;

export interface Column {
  name: string;
  type: "integer" | "text";
  /** Filled in automatically on insert. */
  auto?: "id" | "date";
  /** Foreign key: this column holds an id from another table. */
  ref?: TableName;
  min?: number;
  placeholder?: string;
}

export const SCHEMA: Record<TableName, Column[]> = {
  products: [
    { name: "id", type: "integer", auto: "id" },
    { name: "name", type: "text", placeholder: "Salt" },
    { name: "unit", type: "text", placeholder: "1 kg" },
    { name: "price_ugx", type: "integer", min: 0, placeholder: "1500" },
    { name: "stock", type: "integer", min: 0, placeholder: "30" },
  ],
  customers: [
    { name: "id", type: "integer", auto: "id" },
    { name: "name", type: "text", placeholder: "Nakato Sarah" },
    { name: "area", type: "text", placeholder: "Mukono" },
    { name: "joined", type: "text", auto: "date" },
  ],
  orders: [
    { name: "id", type: "integer", auto: "id" },
    { name: "customer_id", type: "integer", ref: "customers", min: 1, placeholder: "2" },
    { name: "product_id", type: "integer", ref: "products", min: 1, placeholder: "1" },
    { name: "quantity", type: "integer", min: 1, placeholder: "3" },
    { name: "ordered_on", type: "text", auto: "date" },
  ],
};

export type Db = Record<TableName, Row[]>;

const SEED: Db = {
  products: [
    { id: 1, name: "Rice", unit: "25 kg bag", price_ugx: 110000, stock: 14 },
    { id: 2, name: "Sugar", unit: "1 kg", price_ugx: 5500, stock: 60 },
    { id: 3, name: "Maize flour (posho)", unit: "10 kg bag", price_ugx: 28000, stock: 22 },
    { id: 4, name: "Beans", unit: "1 kg", price_ugx: 5000, stock: 35 },
    { id: 5, name: "Cooking oil", unit: "1 litre", price_ugx: 8500, stock: 0 },
    { id: 6, name: "Bar soap", unit: "1 bar", price_ugx: 3000, stock: 48 },
  ],
  customers: [
    { id: 1, name: "Okello James", area: "Nakawa", joined: "2025-03-12" },
    { id: 2, name: "Nansubuga Ritah", area: "Ntinda", joined: "2025-06-01" },
    { id: 3, name: "Mugisha Brian", area: "Kireka", joined: "2025-09-20" },
    { id: 4, name: "Atim Grace", area: "Bweyogerere", joined: "2026-01-15" },
  ],
  orders: [
    { id: 1, customer_id: 1, product_id: 1, quantity: 2, ordered_on: "2026-10-28" },
    { id: 2, customer_id: 2, product_id: 2, quantity: 5, ordered_on: "2026-10-30" },
    { id: 3, customer_id: 3, product_id: 4, quantity: 3, ordered_on: "2026-11-01" },
    { id: 4, customer_id: 1, product_id: 6, quantity: 4, ordered_on: "2026-11-02" },
    { id: 5, customer_id: 4, product_id: 3, quantity: 1, ordered_on: "2026-11-03" },
  ],
};

export function createDb(): Db {
  return {
    products: SEED.products.map((r) => ({ ...r })),
    customers: SEED.customers.map((r) => ({ ...r })),
    orders: SEED.orders.map((r) => ({ ...r })),
  };
}

/* ------------------------------ queries ------------------------------ */

export type Op = "=" | "contains" | ">" | "<";

export interface Query {
  table: TableName;
  filter?: { column: string; op: Op; value: string };
  sort?: { column: string; dir: "asc" | "desc" };
}

export function column(table: TableName, name: string): Column | undefined {
  return SCHEMA[table].find((c) => c.name === name);
}

/** Quote a text value for SQL: wrap in single quotes and double any quote inside. */
export function sqlString(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlValue(col: Column, raw: string): string {
  return col.type === "integer" ? String(Number(raw)) : sqlString(raw);
}

export function validateQuery(q: Query): string | null {
  if (!q.filter) return null;
  const col = column(q.table, q.filter.column);
  if (!col) return `The ${q.table} table has no column called ${q.filter.column}.`;
  if (q.filter.value.trim() === "") return "Type a value to filter by.";
  if ((q.filter.op === ">" || q.filter.op === "<") && col.type !== "integer") return `“Greater than” and “less than” need a number column; ${col.name} holds text.`;
  if (col.type === "integer" && q.filter.op !== "contains" && !Number.isFinite(Number(q.filter.value))) return `${col.name} holds numbers, so the value must be a number.`;
  return null;
}

export function runQuery(db: Db, q: Query): Row[] {
  let rows = db[q.table].slice();
  const f = q.filter;
  if (f && f.value.trim() !== "" && !validateQuery(q)) {
    const col = column(q.table, f.column)!;
    rows = rows.filter((r) => {
      const v = r[f.column];
      if (f.op === "contains") return String(v).toLowerCase().includes(f.value.toLowerCase());
      if (col.type === "integer") {
        const n = Number(f.value);
        return f.op === "=" ? v === n : f.op === ">" ? (v as number) > n : (v as number) < n;
      }
      return v === f.value; // text "=" is an exact match
    });
  }
  if (q.sort && column(q.table, q.sort.column)) {
    const { column: c, dir } = q.sort;
    const mul = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const x = a[c], y = b[c];
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return cmp * mul;
    });
  }
  return rows;
}

export function toSql(q: Query): string {
  const lines = [`SELECT * FROM ${q.table}`];
  const f = q.filter;
  if (f && f.value.trim() !== "") {
    const col = column(q.table, f.column);
    if (col) {
      if (f.op === "contains") lines.push(`WHERE ${f.column} LIKE ${sqlString(`%${f.value}%`)}`);
      else lines.push(`WHERE ${f.column} ${f.op} ${sqlValue(col, f.value)}`);
    }
  }
  if (q.sort) lines.push(`ORDER BY ${q.sort.column} ${q.sort.dir.toUpperCase()}`);
  return lines.join("\n") + ";";
}

/* ------------------------------ inserts ------------------------------ */

export type InsertResult =
  | { ok: true; row: Row; sql: string }
  | { ok: false; errors: Record<string, string> };

export function editableColumns(table: TableName): Column[] {
  return SCHEMA[table].filter((c) => !c.auto);
}

export function validateInsert(db: Db, table: TableName, input: Record<string, string>, today: string): InsertResult {
  const errors: Record<string, string> = {};
  const row: Row = {};
  for (const col of SCHEMA[table]) {
    if (col.auto === "id") {
      row[col.name] = db[table].reduce((m, r) => Math.max(m, r.id as number), 0) + 1;
      continue;
    }
    if (col.auto === "date") {
      row[col.name] = today;
      continue;
    }
    const raw = (input[col.name] ?? "").trim();
    if (raw === "") { errors[col.name] = "Required."; continue; }
    if (col.type === "integer") {
      const n = Number(raw);
      if (!Number.isInteger(n)) { errors[col.name] = "Must be a whole number."; continue; }
      if (col.min !== undefined && n < col.min) { errors[col.name] = `Must be ${col.min} or more.`; continue; }
      if (col.ref && !db[col.ref].some((r) => r.id === n)) {
        errors[col.name] = `No ${col.ref === "customers" ? "customer" : "product"} has id ${n}. An order must point at a row that exists.`;
        continue;
      }
      row[col.name] = n;
    } else {
      if (raw.length > 60) { errors[col.name] = "Keep it under 60 characters."; continue; }
      row[col.name] = raw;
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, row, sql: insertSql(table, row) };
}

export function insertSql(table: TableName, row: Row): string {
  const cols = SCHEMA[table].filter((c) => c.auto !== "id");
  const values = cols.map((c) => (c.type === "integer" ? String(row[c.name]) : sqlString(String(row[c.name]))));
  return `INSERT INTO ${table} (${cols.map((c) => c.name).join(", ")})\nVALUES (${values.join(", ")});`;
}

export function insert(db: Db, table: TableName, row: Row): Db {
  return { ...db, [table]: [...db[table], row] };
}

/* ------------------------------ lookups ------------------------------ */

export interface OrderDetails {
  order_id: number;
  customer: string;
  area: string;
  product: string;
  quantity: number;
  total_ugx: number;
  ordered_on: string;
}

/** Follow an order's ids to the customer and product rows (a JOIN). */
export function lookupOrder(db: Db, id: number): OrderDetails | null {
  const o = db.orders.find((r) => r.id === id);
  if (!o) return null;
  const c = db.customers.find((r) => r.id === o.customer_id);
  const p = db.products.find((r) => r.id === o.product_id);
  if (!c || !p) return null;
  return {
    order_id: id,
    customer: String(c.name),
    area: String(c.area),
    product: String(p.name),
    quantity: o.quantity as number,
    total_ugx: (p.price_ugx as number) * (o.quantity as number),
    ordered_on: String(o.ordered_on),
  };
}

export function lookupSql(id: number): string {
  return `SELECT orders.id AS order_id,
       customers.name AS customer,
       customers.area,
       products.name AS product,
       orders.quantity,
       products.price_ugx * orders.quantity AS total_ugx,
       orders.ordered_on
FROM orders
JOIN customers ON customers.id = orders.customer_id
JOIN products  ON products.id  = orders.product_id
WHERE orders.id = ${id};`;
}

/** SQL that creates the three tables (used in the lesson's example). */
export const CREATE_SQL = `CREATE TABLE products (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  unit      TEXT NOT NULL,
  price_ugx INTEGER NOT NULL,
  stock     INTEGER NOT NULL
);`;

/* ----------------------------- challenge ----------------------------- */

export interface DbProgress {
  queried: boolean;
  lookedUp: boolean;
  added: boolean;
  reloadedAfterAdd: boolean;
}

export function dbChallengeDone(p: DbProgress): boolean {
  return p.queried && p.lookedUp && p.added && p.reloadedAfterAdd;
}

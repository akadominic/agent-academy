import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import {
  SCHEMA, createDb, dbChallengeDone, insert, insertSql, lookupOrder, lookupSql, runQuery, sqlString, toSql, validateInsert, validateQuery,
  type Db, type Query, type TableName,
} from "@/labs/m01/shopDb";

describe("shop database: queries", () => {
  const db = createDb();

  it("filters with contains (case-insensitive, like SQLite LIKE)", () => {
    const rows = runQuery(db, { table: "products", filter: { column: "name", op: "contains", value: "RICE" } });
    expect(rows.map((r) => r.name)).toEqual(["Rice"]);
  });

  it("filters numbers and sorts", () => {
    const rows = runQuery(db, {
      table: "products",
      filter: { column: "price_ugx", op: ">", value: "5000" },
      sort: { column: "price_ugx", dir: "desc" },
    });
    expect(rows.map((r) => r.price_ugx)).toEqual([110000, 28000, 8500, 5500]);
  });

  it("text = is an exact match", () => {
    expect(runQuery(db, { table: "customers", filter: { column: "area", op: "=", value: "Nakawa" } })).toHaveLength(1);
    expect(runQuery(db, { table: "customers", filter: { column: "area", op: "=", value: "nakawa" } })).toHaveLength(0);
  });

  it("writes matching SQL, escaping quotes", () => {
    expect(toSql({ table: "products" })).toBe("SELECT * FROM products;");
    expect(toSql({ table: "products", filter: { column: "price_ugx", op: ">", value: "20000" }, sort: { column: "price_ugx", dir: "desc" } }))
      .toBe("SELECT * FROM products\nWHERE price_ugx > 20000\nORDER BY price_ugx DESC;");
    expect(toSql({ table: "customers", filter: { column: "name", op: "contains", value: "O'Neil" } }))
      .toBe("SELECT * FROM customers\nWHERE name LIKE '%O''Neil%';");
    expect(sqlString("it's")).toBe("'it''s'");
  });

  it("rejects nonsense queries with a helpful message", () => {
    expect(validateQuery({ table: "products", filter: { column: "name", op: ">", value: "a" } })).toMatch(/number column/);
    expect(validateQuery({ table: "products", filter: { column: "stock", op: "=", value: "lots" } })).toMatch(/must be a number/);
  });
});

describe("shop database: inserts and lookups", () => {
  it("adds a product with the next id and shows the INSERT", () => {
    const db = createDb();
    const res = validateInsert(db, "products", { name: "Salt", unit: "1 kg", price_ugx: "1500", stock: "30" }, "2026-11-04");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.row.id).toBe(7);
    expect(res.sql).toBe("INSERT INTO products (name, unit, price_ugx, stock)\nVALUES ('Salt', '1 kg', 1500, 30);");
    expect(insert(db, "products", res.row).products).toHaveLength(7);
    expect(db.products).toHaveLength(6); // insert does not mutate
  });

  it("refuses an order that points at a customer who does not exist", () => {
    const res = validateInsert(createDb(), "orders", { customer_id: "99", product_id: "1", quantity: "2" }, "2026-11-04");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errors.customer_id).toMatch(/No customer has id 99/);
  });

  it("requires fields and whole numbers", () => {
    const res = validateInsert(createDb(), "products", { name: "", unit: "1 kg", price_ugx: "12.5", stock: "-1" }, "2026-11-04");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(Object.keys(res.errors).sort()).toEqual(["name", "price_ugx", "stock"]);
  });

  it("looks up an order by following its ids", () => {
    expect(lookupOrder(createDb(), 3)).toEqual({
      order_id: 3, customer: "Mugisha Brian", area: "Kireka", product: "Beans", quantity: 3, total_ugx: 15000, ordered_on: "2026-11-01",
    });
    expect(lookupOrder(createDb(), 42)).toBeNull();
  });

  it("challenge needs all four tasks", () => {
    expect(dbChallengeDone({ queried: true, lookedUp: true, added: true, reloadedAfterAdd: false })).toBe(false);
    expect(dbChallengeDone({ queried: true, lookedUp: true, added: true, reloadedAfterAdd: true })).toBe(true);
  });
});

/* Cross-check: the SQL we show really runs, and gives the same answers, in SQLite. */
type SqliteDb = { exec(sql: string): void; prepare(sql: string): { all(): Record<string, unknown>[] } };
let DatabaseSync: (new (path: string) => SqliteDb) | null = null;
try {
  const require = createRequire(import.meta.url);
  // node:sqlite exists in Node 22.13+; older Node versions skip this block.
  DatabaseSync = require("node:sqlite").DatabaseSync;
} catch {
  DatabaseSync = null;
}

function loadIntoSqlite(db: Db): SqliteDb {
  const s = new DatabaseSync!(":memory:");
  for (const table of Object.keys(SCHEMA) as TableName[]) {
    const cols = SCHEMA[table].map((c) => `${c.name} ${c.type === "integer" ? "INTEGER" : "TEXT"}${c.auto === "id" ? " PRIMARY KEY" : ""}`);
    s.exec(`CREATE TABLE ${table} (${cols.join(", ")});`);
    for (const row of db[table]) {
      const names = SCHEMA[table].map((c) => c.name);
      const vals = SCHEMA[table].map((c) => (c.type === "integer" ? String(row[c.name]) : sqlString(String(row[c.name]))));
      s.exec(`INSERT INTO ${table} (${names.join(", ")}) VALUES (${vals.join(", ")});`);
    }
  }
  return s;
}

describe.skipIf(!DatabaseSync)("shown SQL matches real SQLite", () => {
  const queries: Query[] = [
    { table: "products", filter: { column: "name", op: "contains", value: "RiCe" } },
    { table: "products", filter: { column: "price_ugx", op: ">", value: "5000" }, sort: { column: "price_ugx", dir: "desc" } },
    { table: "customers", filter: { column: "area", op: "=", value: "Ntinda" } },
    { table: "orders", filter: { column: "quantity", op: "<", value: "4" }, sort: { column: "quantity", dir: "asc" } },
  ];
  it.each(queries.map((q) => [toSql(q), q] as const))("%s", (sql, q) => {
    const s = loadIntoSqlite(createDb());
    const ids = s.prepare(sql).all().map((r) => Number(r.id));
    expect(ids).toEqual(runQuery(createDb(), q).map((r) => r.id));
  });

  it("the lookup JOIN and an INSERT run in SQLite", () => {
    const db = createDb();
    const s = loadIntoSqlite(db);
    const [row] = s.prepare(lookupSql(3)).all();
    expect({ ...row }).toEqual({ ...lookupOrder(db, 3) });
    const res = validateInsert(db, "customers", { name: "Nakato Sarah", area: "Mukono" }, "2026-11-04");
    if (!res.ok) throw new Error("insert should be valid");
    s.exec(insertSql("customers", res.row));
    const ids = s.prepare("SELECT id FROM customers ORDER BY id;").all().map((r) => Number(r.id));
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });
});

"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Database, Laptop, Play, Plus, RefreshCw, RotateCcw, Search } from "lucide-react";
import { Button, SimBadge, Segmented, cx } from "@/components/ui/primitives";
import type { LabProps } from "../types";
import {
  SCHEMA, createDb, dbChallengeDone, editableColumns, insert, lookupOrder, lookupSql, runQuery, toSql, validateInsert, validateQuery,
  type Db, type DbProgress, type Op, type OrderDetails, type Query, type Row, type TableName,
} from "./shopDb";

/**
 * The simulated "database server". It lives outside the page component, so
 * reloading the page (remounting it) does not touch it, just like a real
 * database on a server. A real browser refresh does reset it, because this
 * whole simulation runs inside your browser.
 */
let serverDb: Db = createDb();

const TABLES: TableName[] = ["products", "customers", "orders"];
const OPS: { value: Op; label: string }[] = [
  { value: "=", label: "is exactly (=)" },
  { value: "contains", label: "contains (LIKE)" },
  { value: ">", label: "greater than (>)" },
  { value: "<", label: "less than (<)" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(v: unknown, col: string) {
  if (typeof v === "number" && (col.endsWith("_ugx"))) return v.toLocaleString("en-US");
  return String(v);
}

function SqlBox({ sql, label = "Equivalent SQL" }: { sql: string; label?: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-data">{label}</div>
      <pre tabIndex={0} className="overflow-auto rounded-lg bg-code p-2.5 font-mono text-[12px] leading-relaxed text-code-ink">{sql}</pre>
    </div>
  );
}

function ResultTable({ table, rows, highlight }: { table: TableName; rows: Row[]; highlight?: number }) {
  const cols = SCHEMA[table];
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-[color-mix(in_srgb,var(--c-data)_9%,transparent)]">
          <tr>{cols.map((c) => <th key={c.name} scope="col" className="whitespace-nowrap px-2.5 py-1.5 font-mono text-xs font-semibold text-data">{c.name}{c.ref && <span className="font-normal text-ink-3"> → {c.ref}</span>}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id as number} className={cx("border-t border-line", r.id === highlight && "bg-[color-mix(in_srgb,var(--c-ok)_12%,transparent)]")}>
              {cols.map((c) => <td key={c.name} className={cx("whitespace-nowrap px-2.5 py-1.5", c.type === "integer" && "text-right font-mono")}>{fmt(r[c.name], c.name)}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={cols.length} className="px-2.5 py-3 text-center text-ink-3">No rows match.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const selectCls = "rounded-lg border border-line-strong bg-bg px-2 py-1.5 text-sm";

/** Everything in here is "the page": it is thrown away on reload. */
function Page({ db, onInsert, mark, lastAddedId, reloadNote }: {
  db: Db;
  onInsert: (table: TableName, row: Row) => void;
  mark: (k: keyof DbProgress) => void;
  lastAddedId: { table: TableName; id: number } | null;
  reloadNote: string | null;
}) {
  const [table, setTable] = useState<TableName>(lastAddedId?.table ?? "products");
  const [filterCol, setFilterCol] = useState("name");
  const [op, setOp] = useState<Op>("contains");
  const [value, setValue] = useState("");
  const [sortCol, setSortCol] = useState("");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [ran, setRan] = useState<Query>({ table: "products" });
  const [queryError, setQueryError] = useState<string | null>(null);
  const [lookupId, setLookupId] = useState("3");
  const [lookup, setLookup] = useState<{ id: number; result: OrderDetails | null } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [insertedSql, setInsertedSql] = useState<string | null>(null);

  const draft: Query = {
    table,
    filter: value.trim() ? { column: filterCol, op, value } : undefined,
    sort: sortCol ? { column: sortCol, dir } : undefined,
  };
  const shownQuery: Query = ran.table === table ? ran : { table };
  const rows = runQuery(db, shownQuery);

  function changeTable(t: TableName) {
    setTable(t);
    setFilterCol(SCHEMA[t][1].name);
    setOp("contains");
    setValue("");
    setSortCol("");
    setRan({ table: t });
    setQueryError(null);
    setForm({});
    setFormErrors({});
    setInsertedSql(null);
  }
  function run() {
    const err = validateQuery(draft);
    setQueryError(err);
    if (err) return;
    setRan(draft);
    if (draft.filter || draft.sort) mark("queried");
  }
  function doLookup() {
    const id = Number(lookupId);
    if (!Number.isInteger(id)) { setLookup({ id: NaN, result: null }); return; }
    const result = lookupOrder(db, id);
    setLookup({ id, result });
    if (result) mark("lookedUp");
  }
  function doInsert() {
    const res = validateInsert(db, table, form, todayIso());
    if (!res.ok) { setFormErrors(res.errors); setInsertedSql(null); return; }
    setFormErrors({});
    setForm({});
    setInsertedSql(res.sql);
    setRan({ table });
    onInsert(table, res.row);
  }

  const cols = SCHEMA[table];

  return (
    <div className="space-y-4">
      {reloadNote && (
        <p role="status" className="rounded-lg border border-data/40 bg-[color-mix(in_srgb,var(--c-data)_7%,transparent)] px-3 py-2 text-sm text-ink-2">{reloadNote}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Table</span>
        <Segmented<TableName> label="Choose a table" value={table} onChange={changeTable} options={TABLES.map((t) => ({ value: t, label: `${t} (${db[t].length})` }))} size="sm" />
      </div>

      {/* Query builder */}
      <div className="space-y-3 rounded-xl border border-line p-3">
        <div className="text-sm font-semibold">Filter and sort</div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-3">Where</span>
          <select aria-label="Filter column" className={selectCls} value={filterCol} onChange={(e) => setFilterCol(e.target.value)}>
            {cols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <select aria-label="Comparison" className={selectCls} value={op} onChange={(e) => setOp(e.target.value as Op)}>
            {OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            aria-label="Filter value"
            className={cx(selectCls, "w-32 min-w-0")}
            value={value}
            placeholder="e.g. rice"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(); }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-3">Sort by</span>
          <select aria-label="Sort column" className={selectCls} value={sortCol} onChange={(e) => setSortCol(e.target.value)}>
            <option value="">(no sorting)</option>
            {cols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <select aria-label="Sort direction" className={selectCls} value={dir} onChange={(e) => setDir(e.target.value as "asc" | "desc")} disabled={!sortCol}>
            <option value="asc">smallest first (ASC)</option>
            <option value="desc">largest first (DESC)</option>
          </select>
          <Button size="sm" variant="primary" onClick={run}><Play className="h-4 w-4" aria-hidden /> Run query</Button>
        </div>
        {queryError && <p className="text-sm text-safety" role="alert">{queryError}</p>}
        <SqlBox sql={toSql(draft)} label="SQL for this query (updates as you choose)" />
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">Result: {rows.length} row{rows.length === 1 ? "" : "s"} from <code className="inline-code">{table}</code></span>
          <span className="text-xs text-ink-3">Last query run: <code className="font-mono">{toSql(shownQuery).replace(/\n/g, " ")}</code></span>
        </div>
        <ResultTable table={table} rows={rows} highlight={lastAddedId?.table === table ? lastAddedId.id : undefined} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Lookup */}
        <div className="min-w-0 space-y-2 rounded-xl border border-line p-3">
          <div className="text-sm font-semibold">Look up an order</div>
          <p className="text-xs text-ink-3">An order only stores ids. A lookup follows them to the customer and product tables (a JOIN).</p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="lookup-id" className="text-sm">Order id</label>
            <input id="lookup-id" inputMode="numeric" className={cx(selectCls, "w-20")} value={lookupId} onChange={(e) => setLookupId(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doLookup(); }} />
            <Button size="sm" onClick={doLookup}><Search className="h-4 w-4" aria-hidden /> Look up</Button>
          </div>
          {lookup && (
            lookup.result ? (
              <div className="space-y-2">
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg bg-sunken p-2.5 text-sm">
                  <dt className="text-ink-3">Customer</dt><dd>{lookup.result.customer} ({lookup.result.area})</dd>
                  <dt className="text-ink-3">Product</dt><dd>{lookup.result.product}</dd>
                  <dt className="text-ink-3">Quantity</dt><dd>{lookup.result.quantity}</dd>
                  <dt className="text-ink-3">Total</dt><dd>UGX {lookup.result.total_ugx.toLocaleString("en-US")}</dd>
                  <dt className="text-ink-3">Date</dt><dd>{lookup.result.ordered_on}</dd>
                </dl>
                <SqlBox sql={lookupSql(lookup.id)} />
              </div>
            ) : (
              <p className="text-sm text-safety" role="alert">No order with that id. The query would return 0 rows.</p>
            )
          )}
        </div>

        {/* Insert */}
        <div className="min-w-0 space-y-2 rounded-xl border border-line p-3">
          <div className="text-sm font-semibold">Add a row to <code className="inline-code">{table}</code></div>
          <p className="text-xs text-ink-3">The id{SCHEMA[table].some((c) => c.auto === "date") ? " and date are" : " is"} filled in by the database.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {editableColumns(table).map((c) => (
              <div key={c.name}>
                <label htmlFor={`ins-${c.name}`} className="font-mono text-xs">{c.name}{c.ref && <span className="text-ink-3"> (id in {c.ref})</span>}</label>
                <input
                  id={`ins-${c.name}`}
                  inputMode={c.type === "integer" ? "numeric" : undefined}
                  placeholder={c.placeholder ? `e.g. ${c.placeholder}` : undefined}
                  value={form[c.name] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [c.name]: e.target.value }))}
                  aria-invalid={Boolean(formErrors[c.name])}
                  aria-describedby={formErrors[c.name] ? `err-${c.name}` : undefined}
                  className={cx(selectCls, "mt-0.5 w-full", formErrors[c.name] && "border-safety")}
                />
                {formErrors[c.name] && <p id={`err-${c.name}`} className="mt-0.5 text-xs text-safety">{formErrors[c.name]}</p>}
              </div>
            ))}
          </div>
          <Button size="sm" variant="primary" onClick={doInsert}><Plus className="h-4 w-4" aria-hidden /> Insert row</Button>
          {insertedSql && (
            <div className="space-y-2">
              <p className="text-sm text-ok" role="status">Saved in the database. The new row is highlighted in the table.</p>
              <SqlBox sql={insertedSql} label="SQL sent to the database" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DatabaseExplorer({ onComplete }: LabProps) {
  const [db, setDb] = useState<Db>(serverDb);
  const [pageKey, setPageKey] = useState(0);
  const [reloading, setReloading] = useState(false);
  const [reloadNote, setReloadNote] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<{ table: TableName; id: number } | null>(null);
  const [progress, setProgress] = useState<DbProgress>({ queried: false, lookedUp: false, added: false, reloadedAfterAdd: false });
  const completed = useRef(false);

  useEffect(() => {
    if (!completed.current && dbChallengeDone(progress)) {
      completed.current = true;
      onComplete?.("Queried, looked up, inserted and saw data survive a reload");
    }
  }, [progress, onComplete]);

  const mark = (k: keyof DbProgress) => setProgress((p) => (p[k] ? p : { ...p, [k]: true }));

  function onInsert(table: TableName, row: Row) {
    serverDb = insert(serverDb, table, row);
    setDb(serverDb);
    setLastAdded({ table, id: row.id as number });
    setReloadNote(null);
    mark("added");
  }

  function reload() {
    setReloading(true);
    const delay = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 500;
    setTimeout(() => {
      // The page is rebuilt from scratch and asks the database again.
      setDb(serverDb);
      setPageKey((k) => k + 1);
      setReloading(false);
      const survived = lastAdded && serverDb[lastAdded.table].some((r) => r.id === lastAdded.id);
      setReloadNote(
        survived
          ? `Page reloaded. Your filters and anything typed in the forms are gone, because they only lived in the page. But your new row (id ${lastAdded!.id} in ${lastAdded!.table}) is still here: the page fetched it again from the database.`
          : "Page reloaded. Filters and form inputs were reset because they only lived in the page. The rows came back from the database. Now add a row, then reload again.",
      );
      if (survived) mark("reloadedAfterAdd");
    }, delay);
  }

  function resetDb() {
    serverDb = createDb();
    setDb(serverDb);
    setLastAdded(null);
    setReloadNote(null);
    setPageKey((k) => k + 1);
  }

  const checklist: { k: keyof DbProgress; label: string }[] = [
    { k: "queried", label: "Run a query with a filter or a sort" },
    { k: "lookedUp", label: "Look up an order" },
    { k: "added", label: "Add a row" },
    { k: "reloadedAfterAdd", label: "Reload the page and check your row survived" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-prose text-sm text-ink-2">
          Explore Mama Achen's shop database: three tables of rows and columns. Each action shows the SQL a backend would send to a real database.
        </p>
        <SimBadge label="Simulated database" />
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex items-center gap-2 rounded-xl border border-people/40 px-3 py-2 text-sm">
          <Laptop className="h-4 w-4 shrink-0 text-people" aria-hidden />
          <span><strong>The page</strong> <span className="text-ink-3">(in the browser): filters, forms. Forgotten on reload.</span></span>
        </div>
        <span className="text-center text-xs text-ink-3" aria-hidden>⇄ SQL</span>
        <div className="flex items-center gap-2 rounded-xl border border-data/50 px-3 py-2 text-sm">
          <Database className="h-4 w-4 shrink-0 text-data" aria-hidden />
          <span><strong>The database</strong> <span className="text-ink-3">(on a server): rows. Kept.</span></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={reload} disabled={reloading}>
          <RefreshCw className={cx("h-4 w-4", reloading && "animate-spin")} aria-hidden /> {reloading ? "Reloading…" : "Reload the page"}
        </Button>
        <Button size="sm" variant="ghost" onClick={resetDb}><RotateCcw className="h-4 w-4" aria-hidden /> Reset database</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_230px]">
        <div className={cx("min-w-0 transition-opacity", reloading && "opacity-30")} aria-busy={reloading}>
          <Page key={pageKey} db={db} onInsert={onInsert} mark={mark} lastAddedId={lastAdded} reloadNote={reloadNote} />
        </div>
        <aside className="h-fit rounded-xl border border-line p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Your challenge</div>
          <ul className="space-y-1.5 text-[13px]">
            {checklist.map((c) => (
              <li key={c.k} className="flex items-start gap-2">
                {progress[c.k] ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="done" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-label="not yet" />}
                <span className={progress[c.k] ? "text-ink" : "text-ink-2"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

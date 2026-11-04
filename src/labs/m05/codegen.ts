/**
 * Turn a RequestDraft into the URL, raw HTTP text, `fetch` code and `curl`
 * command that would send it. Pure functions, unit-tested.
 */

import { KEY_ENV_NAMES, type KV, type RequestDraft } from "./mockApi";

export function enabledPairs(list: KV[]): KV[] {
  return list.filter((x) => x.enabled && x.name.trim() !== "");
}

/** The query string, e.g. "?category=grains&limit=3" (or "" when empty). */
export function queryString(query: KV[]): string {
  const pairs = enabledPairs(query).map((q) => `${encodeURIComponent(q.name.trim())}=${encodeURIComponent(q.value)}`);
  return pairs.length ? `?${pairs.join("&")}` : "";
}

export function normalisePath(path: string): string {
  const p = path.trim();
  return p.startsWith("/") ? p : `/${p}`;
}

export function buildUrl(d: Pick<RequestDraft, "host" | "path" | "query">): string {
  return `https://${d.host.trim()}${normalisePath(d.path)}${queryString(d.query)}`;
}

export function hasBody(d: RequestDraft): boolean {
  return d.body.trim() !== "" && d.method !== "GET";
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** The request as it would be written on the wire (HTTP/1.1). HTTPS encrypts all of this in transit. */
export function rawHttp(d: RequestDraft): string {
  const lines = [`${d.method} ${normalisePath(d.path)}${queryString(d.query)} HTTP/1.1`, `Host: ${d.host.trim()}`];
  for (const h of enabledPairs(d.headers)) lines.push(`${h.name.trim()}: ${h.value}`);
  const body = d.body.trim() !== "" ? d.body : "";
  if (body) lines.push(`Content-Length: ${byteLength(body)}`);
  return lines.join("\n") + "\n\n" + body;
}

/** Find the environment variable name for a secret inside a header value, if any. */
export function secretIn(value: string): { value: string; env: string } | undefined {
  return KEY_ENV_NAMES.find((k) => value.includes(k.value));
}

function jsString(s: string): string {
  return JSON.stringify(s);
}

/** Indent every line after the first by `pad`. */
function indentRest(text: string, pad: string): string {
  return text.split("\n").map((l, i) => (i === 0 ? l : pad + l)).join("\n");
}

/**
 * Equivalent `fetch` code. Known keys are replaced by `process.env.NAME` so the
 * generated code never contains a secret, and a comment says it belongs on a server.
 */
export function fetchCode(d: RequestDraft): string {
  const url = buildUrl(d);
  const headers = enabledPairs(d.headers);
  const usesSecret = headers.some((h) => secretIn(h.value));
  const out: string[] = [];
  if (usesSecret) out.push("// Server-side code (e.g. a Next.js route handler). Never put API keys in browser code.");
  const opts: string[] = [];
  if (d.method !== "GET") opts.push(`  method: ${jsString(d.method)},`);
  if (headers.length) {
    opts.push("  headers: {");
    for (const h of headers) {
      const s = secretIn(h.value);
      const val = s ? "`" + h.value.replace(s.value, "${process.env." + s.env + "}").replace(/`/g, "\\`") + "`" : jsString(h.value);
      opts.push(`    ${jsString(h.name.trim())}: ${val},`);
    }
    opts.push("  },");
  }
  if (d.body.trim() !== "") {
    if (d.method === "GET") {
      out.push("// Note: fetch refuses to send a body with GET (it throws a TypeError), so the body is left out.");
    } else {
      let parsed: unknown;
      let valid = true;
      try { parsed = JSON.parse(d.body); } catch { valid = false; }
      if (valid) opts.push(`  body: JSON.stringify(${indentRest(JSON.stringify(parsed, null, 2), "  ")}),`);
      else {
        out.push("// Warning: the body below is NOT valid JSON, so the server will reject it with 400.");
        opts.push(`  body: ${jsString(d.body)},`);
      }
    }
  }
  if (opts.length) out.push(`const response = await fetch(${jsString(url)}, {`, ...opts, "});");
  else out.push(`const response = await fetch(${jsString(url)});`);
  out.push(
    "",
    "if (!response.ok) {",
    "  // 4xx/5xx: read the error body to learn what went wrong",
    "  console.error(response.status, await response.text());",
    "} else if (response.status !== 204) {",
    "  const data = await response.json();",
    "  console.log(data);",
    "}",
  );
  return out.join("\n");
}

/** Quote a value for a POSIX shell inside double quotes (keeps $VARIABLES working). */
function dq(s: string): string {
  return `"${s.replace(/(["\\`])/g, "\\$1")}"`;
}

/** Quote a value for a POSIX shell inside single quotes (nothing is expanded). */
function sq(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** Equivalent `curl` command. Known keys become $ENV_VARS so they never appear in your shell history. */
export function curlCommand(d: RequestDraft): string {
  const parts: string[] = [];
  const first = d.method === "GET" ? `curl ${dq(buildUrl(d))}` : `curl -X ${d.method} ${dq(buildUrl(d))}`;
  parts.push(first);
  for (const h of enabledPairs(d.headers)) {
    const s = secretIn(h.value);
    if (s) {
      // Escape everything except the variable we deliberately insert.
      const [before, after] = h.value.split(s.value);
      const header = `${h.name.trim()}: ${before}`.replace(/(["\\`$])/g, "\\$1") + `$${s.env}` + (after ?? "").replace(/(["\\`$])/g, "\\$1");
      parts.push(`-H "${header}"`);
    } else {
      parts.push(`-H ${dq(`${h.name.trim()}: ${h.value}`.replace(/\$/g, "\\$"))}`);
    }
  }
  if (hasBody(d)) {
    let body = d.body;
    try { body = JSON.stringify(JSON.parse(d.body)); } catch { /* keep the learner's text exactly */ }
    parts.push(`-d ${sq(body)}`);
  }
  return parts.join(" \\\n  ");
}

/** The URL split into its parts, for the "Parts" inspector. */
export function urlParts(d: RequestDraft): { label: string; value: string; note: string }[] {
  const q = queryString(d.query);
  return [
    { label: "Method", value: d.method, note: "What you want to do: GET reads, POST creates, PUT replaces, DELETE removes." },
    { label: "Scheme", value: "https://", note: "HTTPS: the conversation is encrypted in transit." },
    { label: "Host", value: d.host.trim(), note: "Which server to talk to." },
    { label: "Path", value: normalisePath(d.path), note: "Which endpoint on that server." },
    { label: "Query", value: q || "(none)", note: "Extra options after the ?, as name=value pairs joined by &." },
  ];
}

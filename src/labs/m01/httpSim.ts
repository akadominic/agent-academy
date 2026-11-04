/**
 * A tiny, deterministic mock of an online shop's HTTP server, for the
 * "http-request" lab. It builds real-format HTTP/1.1 request and response
 * text. No network is used: this is a SIMULATION.
 */

export type Method = "GET" | "POST" | "PUT" | "DELETE";
export const METHODS: Method[] = ["GET", "POST", "PUT", "DELETE"];

export const HOST = "shop.mamaachen.example";

export interface MockProduct {
  id: string;
  name: string;
  unit: string;
  priceUGX: number;
  stock: number;
}

/** Illustrative prices for a fictional shop. */
export const SHOP_PRODUCTS: MockProduct[] = [
  { id: "rice", name: "Rice", unit: "25 kg bag", priceUGX: 110000, stock: 14 },
  { id: "sugar", name: "Sugar", unit: "1 kg", priceUGX: 5500, stock: 60 },
  { id: "posho", name: "Maize flour (posho)", unit: "10 kg bag", priceUGX: 28000, stock: 22 },
  { id: "beans", name: "Beans", unit: "1 kg", priceUGX: 5000, stock: 35 },
  { id: "oil", name: "Cooking oil", unit: "1 litre", priceUGX: 8500, stock: 0 },
];

export const REASONS: Record<number, string> = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  404: "Not Found",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

export const STATUS_HELP: Record<number, string> = {
  200: "Success. The server understood the request and the body contains what you asked for.",
  201: "Success, and something new was created (here, an order). The Location header says where to find it.",
  400: "The request itself was faulty, for example the body was not valid JSON or a field was missing. Fix the request, then send it again.",
  404: "The server is working, but nothing exists at this path. Check the spelling of the path.",
  405: "The path exists, but it does not accept this method. The Allow header lists the methods it does accept.",
  500: "The server's own code failed. The request may have been fine; the fix is on the server side.",
};

export interface HttpRequestInput {
  method: Method;
  path: string;
  body?: string;
}

export interface HttpResponse {
  status: number;
  reason: string;
  headers: [string, string][];
  body: string;
}

export interface Exchange {
  requestText: string;
  response: HttpResponse;
  responseText: string;
  /** Short note on what the server did, for the learner. */
  note: string;
}

export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** HTTP dates use the IMF-fixdate format, e.g. "Wed, 04 Nov 2026 09:00:00 GMT". */
export function httpDate(d: Date): string {
  return d.toUTCString();
}

export function normalisePath(path: string): string {
  const p = path.trim().split("?")[0].split("#")[0];
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

export function buildRequestText(req: HttpRequestInput): string {
  const lines = [
    `${req.method} ${req.path.trim() || "/"} HTTP/1.1`,
    `Host: ${HOST}`,
    "User-Agent: AgentAcademyBrowser/1.0 (simulated)",
    "Accept: application/json, text/html",
  ];
  const hasBody = (req.method === "POST" || req.method === "PUT") && req.body !== undefined && req.body !== "";
  if (hasBody) {
    lines.push("Content-Type: application/json", `Content-Length: ${byteLength(req.body!)}`);
  }
  return lines.join("\n") + "\n\n" + (hasBody ? req.body : "");
}

function json(status: number, value: unknown, extra: [string, string][] = []): HttpResponse {
  return {
    status,
    reason: REASONS[status],
    headers: [["Content-Type", "application/json; charset=utf-8"], ...extra],
    body: JSON.stringify(value, null, 2),
  };
}

function notAllowed(allow: string, path: string, method: Method): HttpResponse {
  return json(405, { error: `${method} is not allowed on ${path}`, allowed: allow.split(", ") }, [["Allow", allow]]);
}

const HOME_HTML = `<!doctype html>
<html lang="en">
<head><title>Mama Achen's Shop</title></head>
<body>
  <h1>Mama Achen's Shop</h1>
  <a href="/products">See our products</a>
</body>
</html>`;

/** The mock server's routing logic. Pure: same input, same output. */
export function handle(req: HttpRequestInput): { response: HttpResponse; note: string } {
  const path = normalisePath(req.path);
  const m = req.method;

  if (path === "/") {
    if (m !== "GET") return { response: notAllowed("GET", path, m), note: "The home page can only be read (GET)." };
    return {
      response: { status: 200, reason: "OK", headers: [["Content-Type", "text/html; charset=utf-8"]], body: HOME_HTML },
      note: "The server sent back an HTML page. A browser would draw this as a web page.",
    };
  }

  if (path === "/products") {
    if (m !== "GET") return { response: notAllowed("GET", path, m), note: "Customers may read the product list, but not change or delete it. The server refuses with 405." };
    return { response: json(200, SHOP_PRODUCTS), note: "The backend read all products from its database and sent them as JSON data." };
  }

  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const id = decodeURIComponent(productMatch[1]);
    if (m !== "GET") return { response: notAllowed("GET", path, m), note: "A single product can only be read here (GET)." };
    const product = SHOP_PRODUCTS.find((p) => p.id === id);
    if (!product) {
      return {
        response: json(404, { error: `No product with id '${id}'`, hint: `Try one of: ${SHOP_PRODUCTS.map((p) => p.id).join(", ")}` }),
        note: "The route exists, but the database has no product with this id, so the server answers 404 Not Found.",
      };
    }
    return { response: json(200, product), note: "The backend looked up one product by its id." };
  }

  if (path === "/orders") {
    if (m !== "POST") return { response: notAllowed("POST", path, m), note: "In this shop you can only create orders here (POST). Listing everyone's orders is not allowed." };
    let data: unknown;
    try {
      data = JSON.parse(req.body ?? "");
    } catch {
      return { response: json(400, { error: "The request body is not valid JSON." }), note: "The server could not read the body, so it rejects the request with 400." };
    }
    const d = data as { product?: unknown; quantity?: unknown };
    const product = SHOP_PRODUCTS.find((p) => p.id === d?.product);
    if (!product || typeof d.quantity !== "number" || !Number.isInteger(d.quantity) || d.quantity < 1) {
      return {
        response: json(400, { error: "Send a known product id and a whole-number quantity of 1 or more.", example: { product: "rice", quantity: 2 } }),
        note: "The JSON was readable, but the fields were wrong, so the server rejects it with 400.",
      };
    }
    const order = { id: 1043, product: product.id, quantity: d.quantity, totalUGX: product.priceUGX * d.quantity, status: "pending" };
    return {
      response: json(201, order, [["Location", "/orders/1043"]]),
      note: "The backend checked the order and saved it in the database. 201 means “created”. (In this simulation every new order gets id 1043.)",
    };
  }

  if (path === "/specials") {
    return {
      response: json(500, { error: "Internal Server Error" }),
      note: "This route has a bug in the server's code (it crashes while reading today's specials). The server's log shows the details; the customer only sees 500.",
    };
  }

  if (!path.startsWith("/")) {
    return { response: json(400, { error: "A path must start with /" }), note: "Paths always start with a slash." };
  }

  return {
    response: json(404, { error: `Nothing found at ${path}` }),
    note: "No route matches this path, so the server answers 404 Not Found. Paths are case-sensitive, so /Products is not /products.",
  };
}

export function buildResponseText(res: HttpResponse, date: Date): string {
  const headers: [string, string][] = [
    ["Date", httpDate(date)],
    ...res.headers,
    ["Content-Length", String(byteLength(res.body))],
  ];
  return `HTTP/1.1 ${res.status} ${res.reason}\n` + headers.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n\n" + res.body;
}

export function exchange(req: HttpRequestInput, date: Date = new Date()): Exchange {
  const { response, note } = handle(req);
  return { requestText: buildRequestText(req), response, responseText: buildResponseText(response, date), note };
}

/** The status codes the lab asks the learner to collect. */
export const TARGET_CODES = [200, 404, 405, 500] as const;

export function missionDone(seen: Set<number>): boolean {
  return TARGET_CODES.every((c) => seen.has(c));
}

export const SUGGESTED_PATHS = ["/", "/products", "/products/rice", "/products/mango", "/orders", "/specials"];

export const DEFAULT_ORDER_BODY = `{
  "product": "rice",
  "quantity": 2
}`;

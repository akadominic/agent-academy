/**
 * Pure logic for the "website-assembler" lab: which component belongs in
 * which slot of a simple website architecture, and what happens to a
 * request when the assembly is wrong.
 */

export type PieceId = "browser" | "frontend" | "dns" | "backend" | "database" | "spreadsheet" | "calculator";
export type SlotId = "client" | "ui" | "lookup" | "server" | "store";

export interface Piece {
  id: PieceId;
  name: string;
  /** What it does, phrased to follow "which …". */
  does: string;
  kind: "people" | "tool" | "control" | "data";
}

export interface Slot {
  id: SlotId;
  title: string;
  where: string;
  /** What the slot needs, phrased to follow "This slot needs …". */
  need: string;
  /** What goes wrong for the request when the slot is wrong. */
  consequence: string;
  answer: PieceId;
}

export const PIECES: Piece[] = [
  { id: "browser", name: "Browser", does: "is a program on the phone that sends requests and shows web pages (Chrome, Safari, Firefox)", kind: "people" },
  { id: "frontend", name: "Frontend", does: "is the pages, buttons and screens (HTML, CSS and JavaScript) that run inside a browser", kind: "people" },
  { id: "dns", name: "DNS", does: "turns a domain name such as shop.mamaachen.example into an IP address", kind: "tool" },
  { id: "backend", name: "Backend", does: "is code on the server that receives requests, applies the shop's rules and talks to the database", kind: "control" },
  { id: "database", name: "Database", does: "stores products, customers and orders permanently and answers questions about them", kind: "data" },
  { id: "spreadsheet", name: "prices.xlsx on the owner's laptop", does: "is a file on one personal computer that is often switched off or away from the shop", kind: "data" },
  { id: "calculator", name: "Calculator app", does: "is a program that runs locally on one phone and cannot receive requests from anyone else", kind: "control" },
];

/** Slots in the order a request uses them. */
export const SLOTS: Slot[] = [
  {
    id: "client", title: "Slot 1", where: "On the customer's phone", answer: "browser",
    need: "a program that sends requests to servers and shows what comes back",
    consequence: "Nothing on the phone can send the request, so the trip never starts.",
  },
  {
    id: "lookup", title: "Slot 2", where: "Asked before connecting", answer: "dns",
    need: "something that turns the shop's name into an IP address",
    consequence: "Without an IP address the browser does not know which computer to contact, so the request never leaves the phone.",
  },
  {
    id: "server", title: "Slot 3", where: "Running on the server", answer: "backend",
    need: "code that receives the request, follows the shop's rules and fetches data",
    consequence: "The request reaches the server computer, but no code there can handle GET /products, so the customer gets an error.",
  },
  {
    id: "store", title: "Slot 4", where: "Behind the server", answer: "database",
    need: "a store that keeps the shop's records permanently and answers queries",
    consequence: "The backend asks for the product list, but there is nothing reliable to ask, so it has no data to send back.",
  },
  {
    id: "ui", title: "Slot 5", where: "Inside the browser", answer: "frontend",
    need: "the pages and buttons the customer sees and taps",
    consequence: "The data arrives on the phone, but there are no pages or buttons to show it, so the customer sees a blank screen.",
  },
];

export type Placement = Partial<Record<SlotId, PieceId>>;

export interface RunStep {
  slot: SlotId;
  ok: boolean;
  text: string;
}

export interface RunResult {
  ok: boolean;
  steps: RunStep[];
  failedSlot?: SlotId;
  explanation?: string;
}

const SPECIAL: Partial<Record<SlotId, Partial<Record<PieceId, string>>>> = {
  ui: {
    backend: "You put the backend inside the browser. That would mean sending the shop's server code, including the secret password for its database, to every customer's phone, where anyone could read it and change it. Backend code must stay on the server. What runs in the browser is the frontend.",
  },
  server: {
    frontend: "You put the frontend on the server as its only code. The server could hand out pages and buttons, but nothing on it can look up prices, check stock or save an order. When the request GET /products arrives, there is no code to answer it.",
  },
  client: {
    frontend: "The frontend is only pages and code. Something has to fetch it from the internet and run it: that program is the browser. Without one, the phone sends nothing.",
  },
  store: {
    spreadsheet: "A spreadsheet on the owner's laptop cannot be the shop's database. The server cannot reach a file on a personal laptop, the laptop is switched off at night, and if two customers order at the same moment the file can end up wrong. A database runs all the time, close to the server, and handles many reads and writes safely.",
  },
};

export function pieceById(id: PieceId): Piece {
  return PIECES.find((p) => p.id === id)!;
}

export function slotById(id: SlotId): Slot {
  return SLOTS.find((s) => s.id === id)!;
}

export function explain(slotId: SlotId, placed: PieceId | undefined): string {
  const slot = slotById(slotId);
  if (!placed) return `${slot.title} (${slot.where.toLowerCase()}) is empty. This slot needs ${slot.need}. ${slot.consequence}`;
  const special = SPECIAL[slotId]?.[placed];
  if (special) return special;
  const piece = pieceById(placed);
  return `${slot.title} (${slot.where.toLowerCase()}) needs ${slot.need}. You placed the ${piece.name}, which ${piece.does}. ${slot.consequence}`;
}

const SUCCESS_TEXT: Record<SlotId, string> = {
  client: "Browser: the customer taps “Products”, so the browser prepares GET https://shop.mamaachen.example/products",
  lookup: "DNS: shop.mamaachen.example → 203.0.113.10",
  server: "Backend: receives GET /products and asks the database for the product list",
  store: "Database: SELECT * FROM products → 6 rows, sent back to the backend",
  ui: "Frontend: the browser runs the frontend code and draws the product list with an Order button",
};

/** Simulate one request through the assembled architecture. */
export function runRequest(placement: Placement): RunResult {
  const steps: RunStep[] = [];
  const order: SlotId[] = ["client", "lookup", "server", "store", "ui"];
  for (const slotId of order) {
    const placed = placement[slotId];
    if (placed !== slotById(slotId).answer) {
      steps.push({ slot: slotId, ok: false, text: explain(slotId, placed) });
      return { ok: false, steps, failedSlot: slotId, explanation: explain(slotId, placed) };
    }
    steps.push({ slot: slotId, ok: true, text: SUCCESS_TEXT[slotId] });
    if (slotId === "store") {
      steps.push({ slot: "server", ok: true, text: "Backend: sends back HTTP/1.1 200 OK with the products as data" });
    }
  }
  return { ok: true, steps };
}

/** Place a piece in a slot. Each piece exists once, so it moves out of any other slot. */
export function place(placement: Placement, slot: SlotId, piece: PieceId): Placement {
  const next: Placement = {};
  for (const [s, p] of Object.entries(placement) as [SlotId, PieceId][]) {
    if (p !== piece) next[s] = p;
  }
  next[slot] = piece;
  return next;
}

export function removeFrom(placement: Placement, slot: SlotId): Placement {
  const next = { ...placement };
  delete next[slot];
  return next;
}

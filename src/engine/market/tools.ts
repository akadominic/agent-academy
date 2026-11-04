import type { ToolContext, ToolDefinition } from "../agent/types";
import {
  ALTERNATIVES,
  DELIVERY_FEE_UGX,
  INITIAL_STOCK,
  INJECTED_DESCRIPTION,
  PRODUCTS,
  productById,
} from "./catalog";

/* ------------------------------------------------------------------ */
/*  The shop's "database" (in memory for the labs)                     */
/* ------------------------------------------------------------------ */

export interface OrderRecord {
  orderId: string;
  customer: string;
  lines: { productId: string; quantity: number; lineTotalUGX: number }[];
  totalUGX: number;
  delivery: boolean;
  idempotencyKey?: string;
  createdAtStep: number;
}

export interface MarketDB {
  stock: Record<string, number>;
  orders: OrderRecord[];
  /** idempotency key -> orderId, so a retried request returns the SAME order */
  seenKeys: Record<string, string>;
  nextOrderNumber: number;
}

export function createMarketDB(): MarketDB {
  return { stock: { ...INITIAL_STOCK }, orders: [], seenKeys: {}, nextOrderNumber: 1041 };
}

function db(ctx: ToolContext): MarketDB {
  if (ctx.faults.dbDown) throw new ToolFailure("ECONNREFUSED: could not connect to database at db.internal:5432");
  return ctx.db as MarketDB;
}

/** Errors a tool raises on purpose. The loop turns them into observations. */
export class ToolFailure extends Error {
  constructor(message: string, public readonly retryable = false) {
    super(message);
    this.name = "ToolFailure";
  }
}

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/*  Each one = name + description + input schema + real function.      */
/* ------------------------------------------------------------------ */

// #region tool-search
export const searchProducts: ToolDefinition = {
  name: "search_products",
  description:
    "Search the shop catalogue by product name. Returns matching products with id, name, unit and price in UGX. Use this before quoting any price.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", minLength: 2, description: "Product name, e.g. 'rice'" },
    },
    required: ["query"],
    additionalProperties: false,
  },
  sideEffect: "none",
  async execute(args, ctx) {
    const q = String(args.query).toLowerCase();
    const matches = PRODUCTS.filter((p) => p.synonyms.some((s) => s.includes(q) || q.includes(s)));
    return matches.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      priceUGX: p.priceUGX,
      description: ctx.faults.injection && p.id === "rice-25" ? INJECTED_DESCRIPTION : p.description,
    }));
  },
};
// #endregion tool-search

// #region tool-inventory
export const checkInventory: ToolDefinition = {
  name: "check_inventory",
  description:
    "Check how many units of a product are in stock. If stock is too low, returns suggested alternative product ids.",
  inputSchema: {
    type: "object",
    properties: {
      productId: { type: "string", description: "Product id from search_products" },
      quantity: { type: "integer", minimum: 1, maximum: 500 },
    },
    required: ["productId", "quantity"],
    additionalProperties: false,
  },
  sideEffect: "none",
  async execute(args, ctx) {
    const store = db(ctx);
    const id = String(args.productId);
    if (!productById(id)) throw new ToolFailure(`Unknown productId "${id}"`);
    const inStock = store.stock[id] ?? 0;
    const quantity = Number(args.quantity);
    return {
      productId: id,
      requested: quantity,
      inStock,
      available: inStock >= quantity,
      alternatives:
        inStock >= quantity
          ? []
          : (ALTERNATIVES[id] ?? [])
              .filter((alt) => (store.stock[alt] ?? 0) > 0)
              .map((alt) => {
                const p = productById(alt)!;
                return { id: p.id, name: p.name, unit: p.unit, priceUGX: p.priceUGX, inStock: store.stock[alt] };
              }),
    };
  },
};
// #endregion tool-inventory

// #region tool-quote
export const calculateQuote: ToolDefinition = {
  name: "calculate_quote",
  description:
    "Calculate an exact price quotation in UGX. Arithmetic is done by code, never by the model. Adds the Kampala delivery fee when delivery is true.",
  inputSchema: {
    type: "object",
    properties: {
      lines: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            productId: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
          },
          required: ["productId", "quantity"],
          additionalProperties: false,
        },
      },
      delivery: { type: "boolean" },
    },
    required: ["lines", "delivery"],
    additionalProperties: false,
  },
  sideEffect: "none",
  async execute(args) {
    const lines = (args.lines as { productId: string; quantity: number }[]).map((l) => {
      const p = productById(l.productId);
      if (!p) throw new ToolFailure(`Unknown productId "${l.productId}"`);
      return { productId: p.id, name: `${p.name} (${p.unit})`, quantity: l.quantity, unitPriceUGX: p.priceUGX, lineTotalUGX: p.priceUGX * l.quantity };
    });
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotalUGX, 0);
    const deliveryFee = args.delivery ? DELIVERY_FEE_UGX : 0;
    return { lines, subtotalUGX: subtotal, deliveryFeeUGX: deliveryFee, totalUGX: subtotal + deliveryFee };
  },
};
// #endregion tool-quote

// #region tool-order
export const createOrder: ToolDefinition = {
  name: "create_order",
  description:
    "Record a confirmed order in the shop database and reserve the stock. This CHANGES data, so it must only run after a human approves the quotation.",
  inputSchema: {
    type: "object",
    properties: {
      customer: { type: "string", minLength: 2 },
      lines: calculateQuote.inputSchema.properties!.lines,
      delivery: { type: "boolean" },
      idempotencyKey: { type: "string", description: "Unique key so a retried request cannot create a second order" },
    },
    required: ["customer", "lines", "delivery"],
    additionalProperties: false,
  },
  sideEffect: "write",
  async execute(args, ctx) {
    const store = db(ctx);
    const key = args.idempotencyKey as string | undefined;
    // Same key seen before? Return the existing order instead of making a new one.
    if (key && store.seenKeys[key]) {
      return { orderId: store.seenKeys[key], duplicatePrevented: true };
    }
    const lines = (args.lines as { productId: string; quantity: number }[]).map((l) => {
      const p = productById(l.productId)!;
      return { productId: p.id, quantity: l.quantity, lineTotalUGX: p.priceUGX * l.quantity };
    });
    for (const l of lines) store.stock[l.productId] = (store.stock[l.productId] ?? 0) - l.quantity;
    const total = lines.reduce((s, l) => s + l.lineTotalUGX, 0) + (args.delivery ? DELIVERY_FEE_UGX : 0);
    const orderId = `ORD-${store.nextOrderNumber++}`;
    store.orders.push({
      orderId,
      customer: String(args.customer),
      lines,
      totalUGX: total,
      delivery: Boolean(args.delivery),
      idempotencyKey: key,
      createdAtStep: ctx.executions["create_order"] ?? 0,
    });
    if (key) store.seenKeys[key] = orderId;
    return { orderId, totalUGX: total, status: "recorded" };
  },
};
// #endregion tool-order

/** A plausible but wrong tool, used in the "wrong tool" failure demo. */
export const getWeather: ToolDefinition = {
  name: "get_weather",
  description: "Get today's weather forecast for a town in Uganda.",
  inputSchema: {
    type: "object",
    properties: { town: { type: "string" } },
    required: ["town"],
    additionalProperties: false,
  },
  sideEffect: "none",
  async execute(args) {
    return { town: args.town, forecast: "Afternoon showers, 26°C (mock data)" };
  },
};

export const MARKET_TOOLS: ToolDefinition[] = [searchProducts, checkInventory, calculateQuote, createOrder];
export const ALL_TOOLS: ToolDefinition[] = [...MARKET_TOOLS, getWeather];

export function toolByName(name: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}

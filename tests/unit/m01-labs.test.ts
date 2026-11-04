import { describe, expect, it } from "vitest";
import {
  buildTrace, byteLength, challengeMet, failIndex, failuresFor, pointAlong, runKey,
  DOMAIN, SERVER_IP, TYPO_DOMAIN,
} from "@/labs/m01/traceSim";
import { PIECES, SLOTS, explain, place, removeFrom, runRequest, type Placement } from "@/labs/m01/assembler";
import {
  buildRequestText, buildResponseText, exchange, handle, missionDone, normalisePath, SHOP_PRODUCTS,
} from "@/labs/m01/httpSim";

/* --------------------------- internet-trace --------------------------- */

describe("buildTrace (web)", () => {
  it("a normal trip goes DNS → request → SQL → rows → response → render", () => {
    const steps = buildTrace("web", "none");
    expect(steps.map((s) => s.id)).toEqual(["tap", "dns-q", "dns-a", "req", "sql", "rows", "res", "end"]);
    expect(failIndex(steps)).toBe(-1);
    expect(steps.at(-1)!.status).toBe("end-ok");
    const dnsAnswer = steps[2].panels[0].text;
    expect(dnsAnswer).toContain(`${DOMAIN}.  300  IN  A  ${SERVER_IP}`);
    const req = steps[3].panels[0].text;
    expect(req.startsWith("GET /products?search=rice HTTP/1.1\nHost: " + DOMAIN)).toBe(true);
    expect(steps[4].panels[0].text).toMatch(/^SELECT [^;]*FROM products/);
  });

  it("the 200 response states the true byte length of its body", () => {
    const res = buildTrace("web", "none").find((s) => s.id === "res")!.panels[0].text;
    expect(res.startsWith("HTTP/1.1 200 OK")).toBe(true);
    const [head, ...bodyParts] = res.split("\n\n");
    const body = bodyParts.join("\n\n");
    const declared = Number(head.match(/Content-Length: (\d+)/)![1]);
    expect(declared).toBe(byteLength(body));
  });

  it("a DNS failure stops before any request reaches the server", () => {
    const steps = buildTrace("web", "dns");
    const fi = failIndex(steps);
    expect(steps[fi].id).toBe("dns-a");
    expect(steps[fi].fault).toBe("dns");
    expect(steps[fi].panels[0].text).toContain("NXDOMAIN");
    expect(steps[0].panels[0].text).toContain(TYPO_DOMAIN);
    expect(steps.some((s) => s.to === "server")).toBe(false);
  });

  it("airplane mode fails at the very first hop", () => {
    const steps = buildTrace("web", "offline");
    expect(failIndex(steps)).toBe(1);
    expect(steps[1].fault).toBe("phone");
  });

  it("server down: the request is sent but nothing answers, so there is no HTTP response", () => {
    const steps = buildTrace("web", "serverDown");
    expect(steps[failIndex(steps)].id).toBe("req");
    expect(steps.some((s) => s.id === "res")).toBe(false);
  });

  it("a server bug returns 500 and never queries the database", () => {
    const steps = buildTrace("web", "server500");
    expect(steps[failIndex(steps)].fault).toBe("server");
    expect(steps.some((s) => s.to === "db")).toBe(false);
    expect(steps.find((s) => s.id === "res")!.panels[0].text).toContain("HTTP/1.1 500 Internal Server Error");
  });

  it("an unreachable database fails at the server → database hop and returns a 5xx", () => {
    const steps = buildTrace("web", "dbDown");
    const fail = steps[failIndex(steps)];
    expect(fail.from).toBe("server");
    expect(fail.to).toBe("db");
    expect(steps.find((s) => s.id === "res")!.panels[0].text).toMatch(/^HTTP\/1\.1 5\d\d /);
  });

  it("every trip ends with an outcome step", () => {
    for (const f of failuresFor("web")) {
      const steps = buildTrace("web", f);
      expect(steps.at(-1)!.id).toBe("end");
    }
  });
});

describe("buildTrace (local)", () => {
  it("never touches the network, even in airplane mode", () => {
    for (const f of failuresFor("local")) {
      const steps = buildTrace("local", f);
      expect(failIndex(steps)).toBe(-1);
      expect(steps.some((s) => ["phone", "dns", "internet", "server", "db"].includes(s.to))).toBe(false);
    }
  });
  it("only offers the airplane-mode failure", () => {
    expect(failuresFor("local")).toEqual(["none", "offline"]);
  });
});

describe("trace challenge", () => {
  it("full challenge needs a success and the three kinds of failure", () => {
    const s = new Set(["web:none", "web:dns", "web:server500"]);
    expect(challengeMet("full", s)).toBe(false);
    s.add("web:dbDown");
    expect(challengeMet("full", s)).toBe(true);
  });
  it("airplane challenge needs both scenarios in airplane mode", () => {
    expect(challengeMet("airplane", new Set([runKey("local", "offline")]))).toBe(false);
    expect(challengeMet("airplane", new Set([runKey("local", "offline"), runKey("web", "offline")]))).toBe(true);
  });
});

describe("pointAlong", () => {
  const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
  it("interpolates along a polyline by distance", () => {
    expect(pointAlong(pts, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAlong(pts, 0.25)).toEqual({ x: 5, y: 0 });
    expect(pointAlong(pts, 0.75)).toEqual({ x: 10, y: 5 });
    expect(pointAlong(pts, 1)).toEqual({ x: 10, y: 10 });
  });
});

/* ------------------------- website-assembler -------------------------- */

const CORRECT: Placement = Object.fromEntries(SLOTS.map((s) => [s.id, s.answer]));

describe("website assembler", () => {
  it("the correct assembly serves the page", () => {
    const r = runRequest(CORRECT);
    expect(r.ok).toBe(true);
    expect(r.steps.every((s) => s.ok)).toBe(true);
    expect(r.steps.at(-1)!.slot).toBe("ui");
  });

  it("an empty build fails at the browser slot", () => {
    const r = runRequest({});
    expect(r.ok).toBe(false);
    expect(r.failedSlot).toBe("client");
    expect(r.explanation).toMatch(/empty/);
  });

  it("swapping frontend and backend fails on the server with a specific explanation", () => {
    const r = runRequest({ ...CORRECT, server: "frontend", ui: "backend" });
    expect(r.failedSlot).toBe("server");
    expect(r.explanation).toMatch(/no code to answer/);
    expect(explain("ui", "backend")).toMatch(/password/);
  });

  it("a laptop spreadsheet is rejected as the database", () => {
    const r = runRequest({ ...CORRECT, store: "spreadsheet" });
    expect(r.failedSlot).toBe("store");
    expect(r.explanation).toMatch(/laptop/);
  });

  it("each piece can only be in one slot", () => {
    let p = place({}, "client", "browser");
    p = place(p, "lookup", "browser");
    expect(p).toEqual({ lookup: "browser" });
    expect(removeFrom(p, "lookup")).toEqual({});
  });

  it("has two distractor pieces that fit no slot", () => {
    const answers = new Set(SLOTS.map((s) => s.answer));
    expect(PIECES.filter((p) => !answers.has(p.id)).map((p) => p.id).sort()).toEqual(["calculator", "spreadsheet"]);
  });
});

/* ---------------------------- http-request ---------------------------- */

describe("mock shop server", () => {
  const date = new Date(Date.UTC(2026, 10, 4, 9, 0, 0));

  it("GET /products → 200 JSON list", () => {
    const { response } = handle({ method: "GET", path: "/products" });
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toHaveLength(SHOP_PRODUCTS.length);
  });

  it("unknown product → 404, wrong method → 405 with an Allow header", () => {
    expect(handle({ method: "GET", path: "/products/mango" }).response.status).toBe(404);
    const r = handle({ method: "DELETE", path: "/products" }).response;
    expect(r.status).toBe(405);
    expect(r.headers).toContainEqual(["Allow", "GET"]);
  });

  it("/specials has a bug → 500", () => {
    expect(handle({ method: "GET", path: "/specials" }).response.status).toBe(500);
  });

  it("POST /orders creates an order (201) or rejects a bad body (400)", () => {
    const ok = handle({ method: "POST", path: "/orders", body: '{"product":"rice","quantity":2}' }).response;
    expect(ok.status).toBe(201);
    expect(JSON.parse(ok.body).totalUGX).toBe(220000);
    expect(ok.headers).toContainEqual(["Location", "/orders/1043"]);
    expect(handle({ method: "POST", path: "/orders", body: "{oops" }).response.status).toBe(400);
    expect(handle({ method: "POST", path: "/orders", body: '{"product":"rice","quantity":0}' }).response.status).toBe(400);
    expect(handle({ method: "GET", path: "/orders" }).response.status).toBe(405);
  });

  it("paths are case-sensitive and ignore a trailing slash and query string", () => {
    expect(normalisePath("/products/?x=1")).toBe("/products");
    expect(handle({ method: "GET", path: "/Products" }).response.status).toBe(404);
  });

  it("builds real-format request text with a correct Content-Length", () => {
    const body = '{"product":"sugar","quantity":1}';
    const text = buildRequestText({ method: "POST", path: "/orders", body });
    expect(text.split("\n")[0]).toBe("POST /orders HTTP/1.1");
    expect(text).toContain("Host: shop.mamaachen.example");
    expect(text).toContain(`Content-Length: ${body.length}`);
    expect(text.endsWith("\n\n" + body)).toBe(true);
    expect(buildRequestText({ method: "GET", path: "/" })).not.toContain("Content-Length");
  });

  it("builds a response with status line, Date and byte-accurate Content-Length", () => {
    const ex = exchange({ method: "GET", path: "/products/rice" }, date);
    const lines = ex.responseText.split("\n");
    expect(lines[0]).toBe("HTTP/1.1 200 OK");
    expect(lines[1]).toBe("Date: Wed, 04 Nov 2026 09:00:00 GMT");
    const [, body] = ex.responseText.split("\n\n");
    expect(ex.responseText).toContain(`Content-Length: ${new TextEncoder().encode(body).length}`);
    expect(buildResponseText(ex.response, date)).toBe(ex.responseText);
  });

  it("the mission needs 200, 404, 405 and 500", () => {
    expect(missionDone(new Set([200, 404, 405]))).toBe(false);
    expect(missionDone(new Set([200, 404, 405, 500, 201]))).toBe(true);
  });
});

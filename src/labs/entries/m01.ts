import type { LabEntry } from "../types";

/** Labs for Module 1: How Computers and the Internet Work. */
export const m01Labs: LabEntry[] = [
  {
    id: "internet-trace", title: "Trace a request", moduleId: "m1", mode: "experiment", offline: true,
    short: "Follow a message from a phone through DNS, the internet, a server and a database, and back. Then break each part.",
    load: () => import("../m01/InternetTrace"),
  },
  {
    id: "website-assembler", title: "Assemble a website", moduleId: "m1", mode: "experiment", offline: true,
    short: "Put the browser, frontend, DNS, backend and database in the right places, then send a request through what you built.",
    load: () => import("../m01/WebsiteAssembler"),
  },
  {
    id: "http-request", title: "Send HTTP requests", moduleId: "m1", mode: "experiment", offline: true,
    short: "Be the browser: choose a method and path, send it to a mock shop server and read the raw request, response and status code.",
    load: () => import("../m01/HttpRequest"),
  },
  {
    id: "database-explorer", title: "Explore a shop database", moduleId: "m1", mode: "experiment", offline: true,
    short: "Filter, sort, look up and add rows in a shop's products, customers and orders tables, and see the SQL for each.",
    load: () => import("../m01/DatabaseExplorer"),
  },
];

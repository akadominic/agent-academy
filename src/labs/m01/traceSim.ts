/**
 * Pure logic for the "internet-trace" lab.
 *
 * Builds the list of steps a request takes, either across the internet
 * (phone → DNS → server → database and back) or entirely inside one phone
 * (a calculator app: local execution). Failure switches cut the trip at the
 * point where a real system would break.
 *
 * Everything here is a teaching SIMULATION. Domain names use the reserved
 * ".example" top-level domain, and IP addresses come from the ranges that
 * RFC 5737 reserves for documentation (198.51.100.0/24, 203.0.113.0/24),
 * so none of them point at a real machine.
 */

export type Scenario = "web" | "local";

export type Failure = "none" | "offline" | "dns" | "serverDown" | "server500" | "dbDown";

export type NodeId =
  | "phone" | "dns" | "internet" | "server" | "db"
  | "screen" | "os" | "storage" | "cpu" | "net-off";

export type NodeKind = "people" | "tool" | "cloud" | "control" | "data";

export interface TraceNode {
  id: NodeId;
  label: string;
  sub: string;
  kind: NodeKind;
  /** Drawn faded: present for comparison but not used in this scenario. */
  unused?: boolean;
}

export interface Panel {
  label: string;
  text: string;
}

export interface TraceStep {
  id: string;
  from: NodeId;
  to: NodeId;
  /** Optional waypoint the packet passes through (e.g. the internet). */
  via?: NodeId;
  title: string;
  /** Plain-language explanation of what is happening. */
  plain: string;
  /** One-line everyday comparison. */
  analogy?: string;
  /** The real data at this hop. */
  panels: Panel[];
  /** "fail" marks the hop where the trip breaks. "end" is the final outcome. */
  status: "ok" | "fail" | "end-ok" | "end-fail";
  /** Which node is at fault when status is "fail". */
  fault?: NodeId;
}

export const DOMAIN = "shop.mamaachen.example";
export const TYPO_DOMAIN = "shop.mamachen.example";
export const SERVER_IP = "203.0.113.10";
export const PHONE_IP = "198.51.100.24";
export const DB_ADDR = "10.0.0.5:5432";

export const WEB_NODES: TraceNode[] = [
  { id: "phone", label: "Phone", sub: "browser (client)", kind: "people" },
  { id: "dns", label: "DNS resolver", sub: "looks up names", kind: "tool" },
  { id: "internet", label: "Internet", sub: "routers & cables", kind: "cloud" },
  { id: "server", label: "Server", sub: "backend code", kind: "control" },
  { id: "db", label: "Database", sub: "products, orders", kind: "data" },
];

export const LOCAL_NODES: TraceNode[] = [
  { id: "screen", label: "Touchscreen", sub: "input & display", kind: "people" },
  { id: "os", label: "OS", sub: "operating system", kind: "control" },
  { id: "storage", label: "Storage", sub: "files & folders", kind: "data" },
  { id: "cpu", label: "CPU + RAM", sub: "runs the app", kind: "control" },
  { id: "net-off", label: "Internet", sub: "not needed", kind: "cloud", unused: true },
];

export const WEB_EDGES: [NodeId, NodeId][] = [
  ["phone", "dns"],
  ["phone", "internet"],
  ["internet", "server"],
  ["server", "db"],
];

export const LOCAL_EDGES: [NodeId, NodeId][] = [
  ["screen", "os"],
  ["os", "storage"],
  ["storage", "cpu"],
  ["cpu", "screen"],
];

/** Number of bytes a string takes when sent as UTF-8 (what Content-Length counts). */
export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

const OK_BODY = `<!doctype html>
<html lang="en">
<head><title>Rice - Mama Achen's Shop</title></head>
<body>
  <h1>Search results: rice</h1>
  <ul>
    <li>Rice, 25 kg bag: UGX 110,000 (14 in stock)</li>
    <li>Rice, 5 kg bag: UGX 23,500 (40 in stock)</li>
  </ul>
</body>
</html>
`;

const ERR500_BODY = `<!doctype html>
<h1>500 - Something went wrong on our side</h1>
`;

const ERR503_BODY = `<!doctype html>
<h1>503 - Shop temporarily unavailable. Please try again soon.</h1>
`;

function response(status: string, body: string, extra: string[] = []): string {
  return [
    `HTTP/1.1 ${status}`,
    "Content-Type: text/html; charset=utf-8",
    `Content-Length: ${byteLength(body)}`,
    ...extra,
    "",
    body,
  ].join("\n");
}

function request(host: string): string {
  return [
    "GET /products?search=rice HTTP/1.1",
    `Host: ${host}`,
    "User-Agent: Mozilla/5.0 (Linux; Android 14; Mobile)",
    "Accept: text/html",
    "Accept-Language: en-UG,en",
    "",
    "",
  ].join("\n");
}

const SQL = `SELECT name, unit, price_ugx, stock
FROM products
WHERE name LIKE '%rice%';`;

const ROWS = `name | unit      | price_ugx | stock
-----+-----------+-----------+------
Rice | 25 kg bag |    110000 |    14
Rice | 5 kg bag  |     23500 |    40
(2 rows)`;

/* ------------------------------------------------------------------ */

function webTrace(failure: Failure): TraceStep[] {
  const host = failure === "dns" ? TYPO_DOMAIN : DOMAIN;
  const url = `https://${host}/products?search=rice`;
  const steps: TraceStep[] = [];

  steps.push({
    id: "tap",
    from: "phone", to: "phone",
    title: "You tap a link in the browser",
    plain: failure === "dns"
      ? `You typed the shop's address by hand, but made a small typo: "mamachen" instead of "mamaachen". The browser cannot see the typo; it only knows it needs to fetch this URL.`
      : "You tap “Search: rice” on Mama Achen's shop website. The browser (a program on your phone) now needs to fetch a page from the shop's server. First it reads the URL to see where to go.",
    analogy: "Like deciding which restaurant you want to order from: you know its name, but not yet where it is.",
    panels: [
      { label: "URL the browser must fetch", text: url },
      {
        label: "The parts of that URL",
        text: [
          "https://                 → protocol: HTTP, encrypted (the S means secure)",
          `${host.padEnd(24)} → domain name: which computer to talk to`,
          "/products                → path: which page on that computer",
          "?search=rice             → query: extra details for the server",
        ].join("\n"),
      },
    ],
    status: "ok",
  });

  if (failure === "offline") {
    steps.push({
      id: "dns-q",
      from: "phone", to: "dns",
      title: "The DNS question cannot leave the phone",
      plain: "To find the server, the phone must first ask a DNS resolver for the shop's IP address. But airplane mode has switched off Wi-Fi and mobile data, so there is no network to carry the question. Nothing leaves the phone.",
      analogy: "You want to send a boda-boda rider, but your phone has no airtime: you cannot even call the dispatcher.",
      panels: [
        { label: "What the phone tried to send", text: `DNS query\n  Name: ${host}\n  Type: A (IPv4 address)` },
        { label: "What happened", text: "No network interface is connected.\nThe query was never sent." },
      ],
      status: "fail",
      fault: "phone",
    });
    steps.push({
      id: "end",
      from: "phone", to: "phone",
      title: "The browser shows an error",
      plain: "The browser gives up immediately and shows a “no internet” message. Notice that the shop's server was never contacted: the problem is on the phone's side.",
      panels: [{ label: "What Chrome shows (roughly)", text: "No internet\nTry checking the network cables, modem and router,\nor reconnecting to Wi-Fi.\n\nERR_INTERNET_DISCONNECTED" }],
      status: "end-fail",
    });
    return steps;
  }

  steps.push({
    id: "dns-q",
    from: "phone", to: "dns",
    title: "Ask DNS: what is this name's IP address?",
    plain: "Computers on the internet find each other by numbers called IP addresses, not by names. So the phone sends a small question to a DNS resolver (usually run by your mobile network): “What is the IP address of this name?”",
    analogy: "Like asking the stage chairman: “Where exactly is Mama Achen's shop?” before you send a rider.",
    panels: [{ label: "DNS query (the question)", text: `;; QUESTION SECTION\n${host}.    IN    A\n\nIN = internet class\nA  = “give me an IPv4 address”` }],
    status: "ok",
  });

  if (failure === "dns") {
    steps.push({
      id: "dns-a",
      from: "dns", to: "phone",
      title: "DNS answers: no such name",
      plain: `The resolver looked the name up and found that "${TYPO_DOMAIN}" is not registered. It replies with the code NXDOMAIN, which means “non-existent domain”. Without an IP address the phone has no idea where to send the request, so the trip stops here.`,
      analogy: "The chairman says: “There is no shop by that name around here.” The rider never sets off.",
      panels: [
        { label: "DNS answer", text: `;; status: NXDOMAIN\n;; QUESTION SECTION\n${host}.    IN    A\n\n;; ANSWER SECTION\n(empty: no address exists for this name)` },
      ],
      status: "fail",
      fault: "dns",
    });
    steps.push({
      id: "end",
      from: "phone", to: "phone",
      title: "The browser shows an error",
      plain: "The browser reports that the site cannot be reached. The server and database were never contacted. The fix is on the name side: correct the typo, or (if you own the site) make sure the domain is registered and its DNS records are set up.",
      panels: [{ label: "What Chrome shows (roughly)", text: `This site can't be reached\nCheck if there is a typo in ${host}.\n\nDNS_PROBE_FINISHED_NXDOMAIN` }],
      status: "end-fail",
    });
    return steps;
  }

  steps.push({
    id: "dns-a",
    from: "dns", to: "phone",
    title: "DNS answers with an IP address",
    plain: `The resolver replies: the name ${DOMAIN} belongs to the computer at ${SERVER_IP}. The 300 is a “time to live” in seconds: the phone may remember this answer for 5 minutes instead of asking again every time.`,
    analogy: "The chairman gives directions: “Plot 10, next to the church.” Now the rider knows exactly where to go.",
    panels: [{ label: "DNS answer", text: `;; status: NOERROR\n;; ANSWER SECTION\n${DOMAIN}.  300  IN  A  ${SERVER_IP}\n\n300 = seconds this answer may be remembered (TTL)` }],
    status: "ok",
  });

  const reqPanels: Panel[] = [
    { label: "HTTP request (what the server reads)", text: request(host) },
    {
      label: "Packet envelope (simplified)",
      text: `From: ${PHONE_IP}   (your phone, as the internet sees it)\nTo:   ${SERVER_IP}   port 443 (HTTPS)\nPath: hop by hop through many routers`,
    },
  ];

  if (failure === "serverDown") {
    steps.push({
      id: "req",
      from: "phone", to: "server", via: "internet",
      title: "The request travels… and nobody answers",
      plain: `The phone sends the request across the internet to ${SERVER_IP}. Routers pass it along correctly, but the server computer is switched off (or its program has stopped). There is nothing at that address to receive the request. The phone waits, tries again, and finally gives up.`,
      analogy: "The rider reaches the right address, but the shop is locked and nobody is inside. He waits, then rides back.",
      panels: [...reqPanels, { label: "What happened", text: `No reply from ${SERVER_IP}:443.\nThe phone waited about 30 seconds, then gave up.` }],
      status: "fail",
      fault: "server",
    });
    steps.push({
      id: "end",
      from: "phone", to: "phone",
      title: "The browser shows a timeout",
      plain: "DNS worked, so the name was fine. The internet worked. The failure is at the server. The person who runs the shop's server must restart it, and monitoring tools should have alerted them when it went down.",
      panels: [{ label: "What Chrome shows (roughly)", text: `This site can't be reached\n${host} took too long to respond.\n\nERR_CONNECTION_TIMED_OUT` }],
      status: "end-fail",
    });
    return steps;
  }

  steps.push({
    id: "req",
    from: "phone", to: "server", via: "internet",
    title: "Send the HTTP request across the internet",
    plain: `Now the phone sends an HTTP request to ${SERVER_IP}. It is cut into small packets, and routers pass each packet along, hop by hop, until it arrives. Because the URL starts with https, the text is encrypted on the way; only the server can read it. Below is what the server reads after decrypting it.`,
    analogy: "The waiter carries your written order from your table to the kitchen.",
    panels: reqPanels,
    status: "ok",
  });

  if (failure === "server500") {
    steps.push({
      id: "crash",
      from: "server", to: "server",
      title: "The server's code crashes",
      plain: "The request arrived, and the backend program started handling it, but a bug in its code made it crash before it could even ask the database. The server is still running, so it can answer: it sends back status code 500, which means “the problem is on my side”.",
      analogy: "The order reached the kitchen, but the cook dropped the pan. The waiter comes back and says: “Sorry, something went wrong in the kitchen.”",
      panels: [
        { label: "Server's error log (only the shop's developers see this)", text: "TypeError: Cannot read properties of undefined (reading 'search')\n    at listProducts (routes/products.js:18:31)" },
      ],
      status: "fail",
      fault: "server",
    });
    steps.push({
      id: "res",
      from: "server", to: "phone", via: "internet",
      title: "Response: 500 Internal Server Error",
      plain: "The server sends back an HTTP response with status 500. The customer only sees a short apology; the details stay in the server's log, which is where a developer would look to fix the bug.",
      analogy: "The waiter brings back an apology instead of food.",
      panels: [{ label: "HTTP response", text: response("500 Internal Server Error", ERR500_BODY) }],
      status: "ok",
    });
    steps.push({
      id: "end",
      from: "phone", to: "phone",
      title: "The browser shows the error page",
      plain: "DNS, the internet and the connection all worked. A 5xx status code tells you: the request was fine, the server failed. The fix is in the server's code.",
      panels: [{ label: "What you see", text: "500 - Something went wrong on our side" }],
      status: "end-fail",
    });
    return steps;
  }

  if (failure === "dbDown") {
    steps.push({
      id: "sql",
      from: "server", to: "db",
      title: "The database cannot be reached",
      plain: `The backend code runs and tries to ask the database for the rice prices. But the database is not answering: its computer is off, or the network between server and database is broken. The connection is refused.`,
      analogy: "The cook goes to the stockroom, but the door is locked and nobody has the key.",
      panels: [
        { label: "The query the server wanted to run", text: SQL },
        { label: "Server's error log", text: `Error: connect ECONNREFUSED ${DB_ADDR}\n    at TCPConnectWrap.afterConnect (node:net)` },
      ],
      status: "fail",
      fault: "db",
    });
    steps.push({
      id: "res",
      from: "server", to: "phone", via: "internet",
      title: "Response: 503 Service Unavailable",
      plain: "The server cannot do its job without the data, so it replies with 503 Service Unavailable (some servers send 500 instead; both are 5xx codes, meaning “the problem is on the server side”). The Retry-After header suggests trying again in 30 seconds.",
      analogy: "The waiter comes back: “Sorry, we can't serve that right now. Try again in a few minutes.”",
      panels: [{ label: "HTTP response", text: response("503 Service Unavailable", ERR503_BODY, ["Retry-After: 30"]) }],
      status: "ok",
    });
    steps.push({
      id: "end",
      from: "phone", to: "phone",
      title: "The browser shows the error page",
      plain: "From the phone, a database failure looks like a server failure: the customer cannot tell the difference. Only the server's log reveals the real cause (ECONNREFUSED to the database). This is why engineers read logs.",
      panels: [{ label: "What you see", text: "503 - Shop temporarily unavailable. Please try again soon." }],
      status: "end-fail",
    });
    return steps;
  }

  steps.push({
    id: "sql",
    from: "server", to: "db",
    title: "The backend asks the database",
    plain: "The backend code reads the request (“search for rice”) and asks the database for matching products. It uses a language called SQL. The database is a separate program, often on a separate computer, whose only job is to store and find data safely.",
    analogy: "The cook sends someone to the stockroom: “Bring me everything labelled rice.”",
    panels: [{ label: "SQL query (from server to database)", text: SQL }],
    status: "ok",
  });
  steps.push({
    id: "rows",
    from: "db", to: "server",
    title: "The database returns the matching rows",
    plain: "The database finds two rows in its products table and sends them back to the backend. The data was stored here long before you asked, and it stays here after you leave.",
    analogy: "The stockroom keeper hands over two sacks and notes how many are left.",
    panels: [{ label: "Result rows", text: ROWS }],
    status: "ok",
  });
  steps.push({
    id: "res",
    from: "server", to: "phone", via: "internet",
    title: "Response: 200 OK, with the page",
    plain: "The backend builds an HTML page from the rows and sends it back as an HTTP response. The first line holds the status code: 200 means success. The headers describe the body: what type it is (HTML) and how many bytes long.",
    analogy: "The waiter brings your food to the table.",
    panels: [{ label: "HTTP response", text: response("200 OK", OK_BODY, ["Cache-Control: no-store"]) }],
    status: "ok",
  });
  steps.push({
    id: "end",
    from: "phone", to: "phone",
    title: "The browser draws the page",
    plain: "The browser reads the HTML and draws the page on your screen. The whole trip, through DNS, the internet, the server and the database and back, usually takes well under a second.",
    panels: [{ label: "What you see", text: "Search results: rice\n • Rice, 25 kg bag: UGX 110,000 (14 in stock)\n • Rice, 5 kg bag: UGX 23,500 (40 in stock)" }],
    status: "end-ok",
  });
  return steps;
}

function localTrace(failure: Failure): TraceStep[] {
  const offline = failure === "offline";
  return [
    {
      id: "tap",
      from: "screen", to: "os",
      title: "You tap the Calculator icon",
      plain: "The touchscreen is hardware: a physical part you can touch. It senses where your finger is and reports the position to the operating system, the software that manages the whole phone.",
      analogy: "A customer walks into the shop and points at something. The shopkeeper (the OS) notices and decides who should handle it.",
      panels: [{ label: "Input event (simplified)", text: "touch down at x=212, y=840\n→ that is the “Calculator” icon\n→ the OS must start the Calculator app" }],
      status: "ok",
    },
    {
      id: "open",
      from: "os", to: "storage",
      title: "The OS finds the app's files in storage",
      plain: "An app is a program, and a program is stored as files in a folder on the phone's storage. Storage keeps files even when the phone is switched off. The OS opens the Calculator's folder to read its program file.",
      analogy: "The shopkeeper goes to the shelf where the calculator is kept.",
      panels: [{ label: "Files the OS reads (illustrative path)", text: "Apps/\n└── Calculator/\n    ├── calculator-program     (instructions, 4.2 MB)\n    └── history.txt            (your past sums)" }],
      status: "ok",
    },
    {
      id: "load",
      from: "storage", to: "cpu",
      title: "The program is loaded into memory",
      plain: "Storage is large but slow. To run the program, the OS copies it into memory (RAM), which is fast but empty when the power goes off. The CPU, the chip that actually carries out instructions, reads them from memory one after another, billions per second.",
      analogy: "The calculator is taken from the shelf and put on the counter, ready to use.",
      panels: [{ label: "What happens", text: "copy calculator-program: storage → memory (RAM)\nCPU starts executing its instructions\nthe app draws its buttons on the screen" }],
      status: "ok",
    },
    {
      id: "compute",
      from: "screen", to: "cpu",
      title: "You type 12,500 × 3 =",
      plain: "Each tap goes from the touchscreen to the app, and the CPU does the multiplication. Notice: no other computer is involved. This is local execution: the program runs on the device in your hand.",
      analogy: "You do the sum yourself on the counter. No need to phone anyone.",
      panels: [{ label: "Inside the CPU (simplified)", text: "load 12500\nmultiply by 3\nresult = 37500" }],
      status: "ok",
    },
    {
      id: "show",
      from: "cpu", to: "screen",
      title: "The result appears on the display",
      plain: "The app tells the OS what to draw, and the display (hardware again) lights up the pixels that show 37,500.",
      panels: [{ label: "On screen", text: "12,500 × 3 = 37,500" }],
      status: "ok",
    },
    {
      id: "save",
      from: "cpu", to: "storage",
      title: "The app saves your history to a file",
      plain: "Before you close it, the app writes your calculation into a file in its folder. Because it is in storage (not just memory), it will still be there tomorrow, even after the phone restarts.",
      analogy: "Writing the sale in the shop's exercise book, so it is not forgotten overnight.",
      panels: [{ label: "Written to Apps/Calculator/history.txt", text: "12500 × 3 = 37500" }],
      status: "ok",
    },
    {
      id: "end",
      from: "screen", to: "screen",
      title: offline ? "Done, even in airplane mode" : "Done, without leaving the phone",
      plain: offline
        ? "Airplane mode was ON, and everything still worked, because every step happened inside this one phone. Compare this with the shop website trip, which cannot even start without a network."
        : "Every step happened inside this one phone: touchscreen, operating system, storage, memory and CPU. Try switching on airplane mode and running it again, then try the shop website trip with airplane mode on.",
      panels: [{ label: "Network messages sent", text: "0" }],
      status: "end-ok",
    },
  ];
}

export function buildTrace(scenario: Scenario, failure: Failure): TraceStep[] {
  if (scenario === "local") return localTrace(failure === "offline" ? "offline" : "none");
  return webTrace(failure);
}

/** Index of the step where the trip breaks, or -1 if it succeeds. */
export function failIndex(steps: TraceStep[]): number {
  return steps.findIndex((s) => s.status === "fail");
}

/** Failures that make sense for each scenario. */
export function failuresFor(scenario: Scenario): Failure[] {
  return scenario === "local" ? ["none", "offline"] : ["none", "offline", "dns", "serverDown", "server500", "dbDown"];
}

export const FAILURE_LABELS: Record<Failure, { label: string; desc: string }> = {
  none: { label: "Everything works", desc: "The normal trip." },
  offline: { label: "Airplane mode", desc: "The phone has no network at all." },
  dns: { label: "DNS can't find the name", desc: "A typo in the domain name." },
  serverDown: { label: "Server down", desc: "The server computer is off." },
  server500: { label: "Server bug (500)", desc: "The backend code crashes." },
  dbDown: { label: "Database unreachable", desc: "The server can't reach its data." },
};

/** Key used to remember which runs a learner has finished. */
export function runKey(scenario: Scenario, failure: Failure): string {
  return `${scenario}:${failure}`;
}

export type TraceChallenge = "full" | "airplane";

/** Has the learner done enough runs to complete the challenge? */
export function challengeMet(challenge: TraceChallenge, finished: Set<string>): boolean {
  if (challenge === "airplane") return finished.has("local:offline") && finished.has("web:offline");
  return (
    finished.has("web:none") &&
    finished.has("web:dns") &&
    (finished.has("web:serverDown") || finished.has("web:server500")) &&
    finished.has("web:dbDown")
  );
}

export function challengeChecklist(challenge: TraceChallenge, finished: Set<string>): { label: string; done: boolean }[] {
  if (challenge === "airplane") {
    return [
      { label: "Run the calculator app with airplane mode ON", done: finished.has("local:offline") },
      { label: "Run the shop website with airplane mode ON", done: finished.has("web:offline") },
    ];
  }
  return [
    { label: "A full, successful trip", done: finished.has("web:none") },
    { label: "Break DNS", done: finished.has("web:dns") },
    { label: "Break the server (down or 500)", done: finished.has("web:serverDown") || finished.has("web:server500") },
    { label: "Break the database", done: finished.has("web:dbDown") },
  ];
}

/* ---------------------------- geometry ---------------------------- */

export interface Point { x: number; y: number }

/** Position along a polyline, t in [0, 1]. */
export function pointAlong(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    segs.push(d);
    total += d;
  }
  if (total === 0) return points[0];
  let target = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : Math.min(1, target / segs[i]);
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
    target -= segs[i];
  }
  return points[points.length - 1];
}

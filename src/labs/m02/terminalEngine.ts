/**
 * SIMULATED TERMINAL ENGINE (pure logic, no React)
 * ================================================
 * A small, deterministic imitation of a Linux/macOS terminal running bash,
 * with a pretend file system, a few npm commands and a few git commands.
 * It is a TEACHING SIMULATION: nothing here touches a real disk, network
 * or package registry. Output wording follows the real tools closely so the
 * learner recognises it later, but it is simplified.
 *
 * `execute(state, line)` returns a NEW state plus the lines to print.
 * Running `node file.js` returns an `effect` the UI performs (it runs the
 * file's code in the course's sandboxed Web Worker).
 */

export type Tone = "dir" | "err" | "ok" | "muted" | "warn" | "accent" | "file";
export interface Seg { text: string; tone?: Tone }
export type Line = Seg[];

export type FsNode = DirNode | FileNode;
export interface DirNode { type: "dir"; children: Record<string, FsNode> }
export interface FileNode { type: "file"; content: string }

export interface Commit { hash: string; message: string; date: string; files: Record<string, string> }
export interface Repo {
  branch: string;
  /** What the next commit will contain (path relative to repo root → content). */
  index: Record<string, string>;
  /** The last commit's snapshot, or null before the first commit. */
  head: Record<string, string> | null;
  commits: Commit[];
}

export interface TermState {
  fs: DirNode;
  cwd: string[];
  home: string[];
  user: string;
  host: string;
  repos: Record<string, Repo>;
  /** Every successful command, as "name sub" (e.g. "git status"), for mission checks. */
  log: { cmd: string; args: string[]; ok: boolean }[];
}

export interface ExecResult {
  state: TermState;
  out: Line[];
  ok: boolean;
  clear?: boolean;
  effect?: { kind: "run-js"; file: string; code: string };
}

/* ------------------------------------------------------------------ */
/*  Building the starting world                                         */
/* ------------------------------------------------------------------ */

export const HOME = ["home", "student"];

export function dir(children: Record<string, FsNode> = {}): DirNode {
  return { type: "dir", children };
}
export function file(content = ""): FileNode {
  return { type: "file", content };
}

export function initialState(preset: "basics" | "project" = "basics"): TermState {
  const homeChildren: Record<string, FsNode> = {
    Documents: dir({ "timetable.txt": file("Mon: Maths, English\nTue: Physics, Chemistry\n") }),
    "welcome.txt": file("Welcome to the simulated terminal!\nType  help  to see the commands you can practise.\n"),
  };
  if (preset === "project") {
    homeChildren.shop = dir({ "hello.js": file('console.log("Hello from Mama Achen\'s shop!");\n') });
  }
  const fs = dir({ home: dir({ student: dir(homeChildren) }) });
  return { fs, cwd: [...HOME], home: [...HOME], user: "student", host: "laptop", repos: {}, log: [] };
}

/* ------------------------------------------------------------------ */
/*  Paths                                                               */
/* ------------------------------------------------------------------ */

export function pathString(segs: string[]) {
  return "/" + segs.join("/");
}

export function displayPath(state: TermState, segs = state.cwd) {
  const h = state.home;
  if (segs.length >= h.length && h.every((s, i) => segs[i] === s)) {
    const rest = segs.slice(h.length);
    return rest.length ? "~/" + rest.join("/") : "~";
  }
  return pathString(segs);
}

export function prompt(state: TermState) {
  return `${state.user}@${state.host}:${displayPath(state)}$`;
}

/** Resolve a typed path against the current folder. Returns null for an impossible path (e.g. "../.." above root is clamped). */
export function resolve(state: TermState, p: string): string[] {
  let segs: string[];
  if (p === "~" || p.startsWith("~/")) {
    segs = [...state.home];
    p = p.slice(1);
  } else if (p.startsWith("/")) segs = [];
  else segs = [...state.cwd];
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") segs.pop();
    else segs.push(part);
  }
  return segs;
}

export function getNode(root: DirNode, segs: string[]): FsNode | undefined {
  let node: FsNode = root;
  for (const s of segs) {
    if (node.type !== "dir") return undefined;
    const next: FsNode | undefined = Object.prototype.hasOwnProperty.call(node.children, s) ? node.children[s] : undefined;
    if (!next) return undefined;
    node = next;
  }
  return node;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/* ------------------------------------------------------------------ */
/*  Tokenising: words, 'single' and "double" quotes, > and >>           */
/* ------------------------------------------------------------------ */

export function tokenize(line: string): { tokens: string[]; error?: string } {
  const tokens: string[] = [];
  let cur = "";
  let has = false;
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === "'" || c === '"') {
      const end = line.indexOf(c, i + 1);
      if (end === -1) return { tokens, error: `Unclosed ${c === "'" ? "single" : "double"} quote. Every opening ${c} needs a closing ${c}.` };
      cur += line.slice(i + 1, end);
      has = true;
      i = end + 1;
    } else if (c === " " || c === "\t") {
      if (has) tokens.push(cur);
      cur = "";
      has = false;
      i++;
    } else if (c === ">") {
      if (has) tokens.push(cur);
      cur = "";
      has = false;
      if (line[i + 1] === ">") { tokens.push(">>"); i += 2; } else { tokens.push(">"); i++; }
    } else {
      cur += c;
      has = true;
      i++;
    }
  }
  if (has) tokens.push(cur);
  return { tokens };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const L = (text: string, tone?: Tone): Line => [{ text, tone }];

export function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function closest(word: string, options: string[], max = 2): string | undefined {
  let best: string | undefined;
  let bestD = Infinity;
  for (const o of options) {
    const d = levenshtein(word.toLowerCase(), o);
    if (d < bestD) { bestD = d; best = o; }
  }
  return bestD <= max ? best : undefined;
}

export const COMMANDS = ["help", "clear", "pwd", "ls", "cd", "mkdir", "touch", "cat", "echo", "rm", "node", "npm", "git", "code"];
const GIT_SUBS = ["init", "status", "add", "commit", "log"];
const NPM_SUBS = ["init", "install"];

/** Packages this offline simulation "knows". Version numbers are examples. */
export const PACKAGES: Record<string, { version: string; about: string }> = {
  dayjs: { version: "1.11.13", about: "work with dates and times" },
  lodash: { version: "4.17.21", about: "handy helpers for arrays and objects" },
  chalk: { version: "5.4.1", about: "colour text in the terminal" },
  dotenv: { version: "16.4.7", about: "load secret settings from a .env file" },
  zod: { version: "3.24.1", about: "check that data has the right shape" },
};

function hash40(input: string) {
  let h1 = 0x811c9dc5;
  let out = "";
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < input.length; i++) {
      h1 ^= input.charCodeAt(i) + round * 31;
      h1 = Math.imul(h1, 16777619) >>> 0;
    }
    out += h1.toString(16).padStart(8, "0");
  }
  return out.slice(0, 40);
}

/** Find the git repo (if any) that contains the given folder. Returns its key (path string). */
export function findRepo(state: TermState, segs = state.cwd): string | undefined {
  for (let n = segs.length; n >= 0; n--) {
    const key = pathString(segs.slice(0, n));
    if (state.repos[key]) return key;
  }
  return undefined;
}

function repoSegs(key: string) {
  return key.split("/").filter(Boolean);
}

/** All files under a folder, as paths relative to it (skipping .git). */
export function walkFiles(node: DirNode, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, child] of Object.entries(node.children)) {
    if (name === ".git") continue;
    const rel = prefix ? `${prefix}/${name}` : name;
    if (child.type === "file") out[rel] = child.content;
    else Object.assign(out, walkFiles(child, rel));
  }
  return out;
}

function ignoredPatterns(files: Record<string, string>) {
  const gi = files[".gitignore"];
  if (gi === undefined) return [];
  return gi.split("\n").map((s) => s.trim().replace(/^\//, "").replace(/\/$/, "")).filter((s) => s && !s.startsWith("#"));
}

function isIgnored(rel: string, patterns: string[]) {
  return patterns.some((p) => rel === p || rel.startsWith(p + "/") || rel.split("/").includes(p));
}

/** Working-tree files that git would see (ignores .gitignore'd paths). */
export function workingFiles(state: TermState, key: string): Record<string, string> {
  const node = getNode(state.fs, repoSegs(key));
  if (!node || node.type !== "dir") return {};
  const all = walkFiles(node);
  const patterns = ignoredPatterns(all);
  return Object.fromEntries(Object.entries(all).filter(([rel]) => !isIgnored(rel, patterns)));
}

export interface GitStatus {
  staged: { path: string; kind: "new file" | "modified" | "deleted" }[];
  unstaged: { path: string; kind: "modified" | "deleted" }[];
  untracked: string[];
}

export function gitStatus(state: TermState, key: string): GitStatus {
  const repo = state.repos[key];
  const work = workingFiles(state, key);
  const head = repo.head ?? {};
  const staged: GitStatus["staged"] = [];
  const unstaged: GitStatus["unstaged"] = [];
  const untrackedFiles: string[] = [];
  for (const p of Object.keys(repo.index).sort()) {
    if (!(p in head)) staged.push({ path: p, kind: "new file" });
    else if (head[p] !== repo.index[p]) staged.push({ path: p, kind: "modified" });
  }
  for (const p of Object.keys(head).sort()) if (!(p in repo.index)) staged.push({ path: p, kind: "deleted" });
  for (const p of Object.keys(repo.index).sort()) {
    if (!(p in work)) unstaged.push({ path: p, kind: "deleted" });
    else if (work[p] !== repo.index[p]) unstaged.push({ path: p, kind: "modified" });
  }
  for (const p of Object.keys(work).sort()) if (!(p in repo.index)) untrackedFiles.push(p);
  // Like real git: a folder whose files are ALL untracked is shown once as "folder/".
  const untracked = new Set<string>();
  for (const p of untrackedFiles) {
    const parts = p.split("/");
    if (parts.length === 1) { untracked.add(p); continue; }
    const top = parts[0];
    const trackedInside = Object.keys(repo.index).some((q) => q.startsWith(top + "/"));
    untracked.add(trackedInside ? p : top + "/");
  }
  return { staged, unstaged, untracked: [...untracked].sort() };
}

/* ------------------------------------------------------------------ */
/*  The command interpreter                                             */
/* ------------------------------------------------------------------ */

export function execute(prev: TermState, rawLine: string, now: Date = new Date()): ExecResult {
  const line = rawLine.trim();
  const state = clone(prev);
  const out: Line[] = [];
  const done = (ok: boolean, cmd: string, args: string[], extra: Partial<ExecResult> = {}): ExecResult => {
    if (cmd) state.log.push({ cmd, args, ok });
    return { state, out, ok, ...extra };
  };
  if (!line) return { state, out, ok: true };

  const { tokens, error } = tokenize(line);
  if (error) {
    out.push(L(error, "err"));
    return done(false, "", []);
  }

  // Output redirection: echo "text" > file
  let redirect: { mode: ">" | ">>"; target: string } | undefined;
  const ri = tokens.findIndex((t) => t === ">" || t === ">>");
  let words = tokens;
  if (ri !== -1) {
    const target = tokens[ri + 1];
    if (!target) {
      out.push(L("bash: syntax error near unexpected token `newline'", "err"));
      out.push(L("Tip: after > you must give a file name, e.g.  echo hello > notes.txt", "muted"));
      return done(false, "", []);
    }
    redirect = { mode: tokens[ri] as ">" | ">>", target };
    words = tokens.slice(0, ri);
  }

  const [name, ...args] = words;
  if (!name) return done(false, "", []);

  // Real terminals are case-sensitive: "LS" is not "ls".
  if (!COMMANDS.includes(name)) {
    out.push(L(`bash: ${name}: command not found`, "err"));
    if (/^cd\.\.?$/.test(name)) out.push(L("Tip: put a space between the command and the folder:  cd ..", "muted"));
    else if (COMMANDS.includes(name.toLowerCase())) out.push(L(`Tip: commands are case-sensitive. Did you mean  ${name.toLowerCase()} ?`, "muted"));
    else {
      const guess = closest(name, COMMANDS);
      if (guess) out.push(L(`Did you mean  ${guess} ?`, "muted"));
      else out.push(L("Type  help  to see the commands this simulation understands.", "muted"));
    }
    return done(false, name, args);
  }

  const fsWrite = (segs: string[], content: string, append: boolean): string | null => {
    const parent = getNode(state.fs, segs.slice(0, -1));
    if (!parent || parent.type !== "dir") return "No such file or directory";
    const nm = segs[segs.length - 1];
    const existing = parent.children[nm];
    if (existing && existing.type === "dir") return "Is a directory";
    const before = existing && existing.type === "file" && append ? existing.content : "";
    parent.children[nm] = file(before + content);
    return null;
  };

  const emit = (text: string): boolean => {
    if (redirect) {
      const err = fsWrite(resolve(state, redirect.target), text, redirect.mode === ">>");
      if (err) { out.push(L(`bash: ${redirect.target}: ${err}`, "err")); return false; }
      return true;
    }
    for (const l of text.replace(/\n$/, "").split("\n")) out.push(L(l));
    return true;
  };

  switch (name) {
    case "help": {
      const rows: [string, string][] = [
        ["pwd", "print working directory: where am I?"],
        ["ls", "list what is in this folder (ls -a also shows hidden files)"],
        ["cd <folder>", "change directory: move into a folder (cd .. goes up, cd ~ goes home)"],
        ["mkdir <name>", "make a new folder"],
        ["touch <file>", "create an empty file"],
        ["cat <file>", "print a file's contents"],
        ["echo <text> > <file>", "write text into a file (>> adds to the end)"],
        ["rm <file>", "remove a file (rm -r <folder> removes a folder)"],
        ["node <file.js>", "run a JavaScript file"],
        ["npm init -y", "start a project (creates package.json)"],
        ["npm install <pkg>", "download a package your code can use"],
        ["git init | status | add | commit -m | log", "track versions of your project"],
        ["clear", "clear the screen"],
      ];
      out.push(L("Commands you can practise here:", "accent"));
      for (const [c, d] of rows) out.push([{ text: c.padEnd(42, " "), tone: "ok" }, { text: d }]);
      out.push(L("Keys: ↑ / ↓ repeat earlier commands · Tab completes names", "muted"));
      return done(true, "help", args);
    }
    case "clear":
      return done(true, "clear", args, { clear: true });
    case "pwd":
      emit(pathString(state.cwd) + "\n");
      return done(true, "pwd", args);
    case "ls": {
      const all = args.includes("-a") || args.includes("-la") || args.includes("-al");
      const targets = args.filter((a) => !a.startsWith("-"));
      const segs = targets.length ? resolve(state, targets[0]) : state.cwd;
      const node = getNode(state.fs, segs);
      if (!node) {
        out.push(L(`ls: cannot access '${targets[0]}': No such file or directory`, "err"));
        return done(false, "ls", args);
      }
      if (node.type === "file") { out.push(L(targets[0], "file")); return done(true, "ls", args); }
      const names = Object.keys(node.children).filter((n) => all || !n.startsWith(".")).sort((a, b) => a.localeCompare(b));
      const segsOut: Seg[] = [];
      if (all) segsOut.push({ text: ".", tone: "dir" }, { text: "  " }, { text: "..", tone: "dir" }, { text: "  " });
      names.forEach((n, i) => {
        const isDir = node.children[n].type === "dir";
        segsOut.push({ text: isDir ? n + "/" : n, tone: isDir ? "dir" : "file" });
        if (i < names.length - 1) segsOut.push({ text: "  " });
      });
      if (segsOut.length) out.push(segsOut);
      else out.push(L("(this folder is empty)", "muted"));
      return done(true, "ls", args);
    }
    case "cd": {
      const target = args[0] ?? "~";
      const segs = resolve(state, target);
      const node = getNode(state.fs, segs);
      if (!node) {
        out.push(L(`bash: cd: ${target}: No such file or directory`, "err"));
        const here = getNode(state.fs, state.cwd) as DirNode;
        const guess = closest(target, Object.keys(here.children).filter((n) => here.children[n].type === "dir").map((n) => n.toLowerCase()), 2);
        const real = guess && Object.keys(here.children).find((n) => n.toLowerCase() === guess);
        if (real) out.push(L(`Did you mean  cd ${real} ?  (names must match exactly, including capital letters)`, "muted"));
        else out.push(L("Tip: type  ls  to see which folders are here.", "muted"));
        return done(false, "cd", args);
      }
      if (node.type !== "dir") {
        out.push(L(`bash: cd: ${target}: Not a directory`, "err"));
        out.push(L("Tip: cd only moves into folders. To read a file, use  cat", "muted"));
        return done(false, "cd", args);
      }
      state.cwd = segs;
      return done(true, "cd", args);
    }
    case "mkdir": {
      const names = args.filter((a) => a !== "-p");
      if (!names.length) { out.push(L("mkdir: missing operand", "err")); out.push(L("Tip: give the new folder a name, e.g.  mkdir shop", "muted")); return done(false, "mkdir", args); }
      let ok = true;
      for (const n of names) {
        const segs = resolve(state, n);
        const parent = getNode(state.fs, segs.slice(0, -1));
        const nm = segs[segs.length - 1];
        if (!parent || parent.type !== "dir") { out.push(L(`mkdir: cannot create directory ‘${n}’: No such file or directory`, "err")); ok = false; continue; }
        if (parent.children[nm]) { out.push(L(`mkdir: cannot create directory ‘${n}’: File exists`, "err")); ok = false; continue; }
        parent.children[nm] = dir();
      }
      if (names.length > 1 && ok) out.push(L(`Note: that made ${names.length} separate folders. A space separates names. For one folder with a space, use quotes: mkdir "my shop" (or avoid spaces).`, "muted"));
      return done(ok, "mkdir", args);
    }
    case "touch": {
      if (!args.length) { out.push(L("touch: missing file operand", "err")); return done(false, "touch", args); }
      let ok = true;
      for (const n of args) {
        const segs = resolve(state, n);
        const parent = getNode(state.fs, segs.slice(0, -1));
        const nm = segs[segs.length - 1];
        if (!parent || parent.type !== "dir") { out.push(L(`touch: cannot touch '${n}': No such file or directory`, "err")); ok = false; continue; }
        if (!parent.children[nm]) parent.children[nm] = file("");
      }
      return done(ok, "touch", args);
    }
    case "cat": {
      if (!args.length) { out.push(L("cat: missing file name. Try  cat welcome.txt", "err")); return done(false, "cat", args); }
      let ok = true;
      for (const n of args) {
        const node = getNode(state.fs, resolve(state, n));
        if (!node) {
          out.push(L(`cat: ${n}: No such file or directory`, "err"));
          ok = false;
        } else if (node.type === "dir") {
          out.push(L(`cat: ${n}: Is a directory`, "err"));
          ok = false;
        } else if (node.content) {
          emit(node.content.endsWith("\n") ? node.content : node.content + "\n");
        }
      }
      return done(ok, "cat", args);
    }
    case "echo": {
      const ok = emit(args.join(" ") + "\n");
      return done(ok, "echo", redirect ? [...args, redirect.mode, redirect.target] : args);
    }
    case "rm": {
      const recursive = args.some((a) => /^-r|^-rf|^-fr/.test(a));
      const names = args.filter((a) => !a.startsWith("-"));
      if (!names.length) { out.push(L("rm: missing operand", "err")); return done(false, "rm", args); }
      let ok = true;
      for (const n of names) {
        const segs = resolve(state, n);
        const parent = getNode(state.fs, segs.slice(0, -1));
        const nm = segs[segs.length - 1];
        const node = parent && parent.type === "dir" ? parent.children[nm] : undefined;
        if (!node || !parent || parent.type !== "dir") { out.push(L(`rm: cannot remove '${n}': No such file or directory`, "err")); ok = false; continue; }
        if (node.type === "dir" && !recursive) { out.push(L(`rm: cannot remove '${n}': Is a directory`, "err")); out.push(L("Tip: rm -r removes a folder and everything inside it. There is no recycle bin — be careful.", "muted")); ok = false; continue; }
        if (segs.length <= state.home.length) { out.push(L("This simulation will not delete your home folder.", "err")); ok = false; continue; }
        delete parent.children[nm];
        const cwdStr = pathString(state.cwd);
        if (cwdStr === pathString(segs) || cwdStr.startsWith(pathString(segs) + "/")) state.cwd = segs.slice(0, -1);
      }
      return done(ok, "rm", args);
    }
    case "code": {
      out.push(L("On a real computer with VS Code installed, this opens the folder in the editor.", "muted"));
      out.push(L("In this simulation, click a file in the folder tree to open it in the mini editor.", "muted"));
      return done(true, "code", args);
    }
    case "node":
      return runNode(state, args, out, done);
    case "npm":
      return runNpm(state, args, out, done, emit);
    case "git":
      return runGit(state, args, out, done, emit, now);
  }
  return done(false, name, args);
}

type Done = (ok: boolean, cmd: string, args: string[], extra?: Partial<ExecResult>) => ExecResult;

function runNode(state: TermState, args: string[], out: Line[], done: Done): ExecResult {
  if (args[0] === "-v" || args[0] === "--version") {
    out.push(L("v24.11.0"));
    out.push(L("(simulated — your real version number will differ)", "muted"));
    return done(true, "node -v", args);
  }
  if (!args.length) {
    out.push(L("On a real computer, plain  node  opens an interactive prompt (the REPL).", "muted"));
    out.push(L("This simulation only runs files. Try  node hello.js", "muted"));
    return done(false, "node", args);
  }
  const target = args[0];
  const segs = resolve(state, target);
  const node = getNode(state.fs, segs);
  if (!node || node.type !== "file") {
    out.push(L(`node:internal/modules/cjs/loader`, "err"));
    out.push(L(`Error: Cannot find module '${pathString(segs)}'`, "err"));
    const here = getNode(state.fs, state.cwd) as DirNode;
    const jsFiles = Object.keys(here.children).filter((n) => n.endsWith(".js"));
    if (!target.endsWith(".js")) out.push(L(`Tip: include the file extension, e.g.  node ${target}.js`, "muted"));
    else if (jsFiles.length) out.push(L(`Tip: files here are: ${jsFiles.join(", ")}. Check the spelling, or  cd  into the right folder first.`, "muted"));
    else out.push(L("Tip: there is no .js file in this folder. Use  ls  and  pwd  to check where you are.", "muted"));
    return done(false, "node", args);
  }
  if (!node.content.trim()) {
    out.push(L("(the file is empty, so nothing happened — write some code in it first)", "muted"));
    return done(true, "node", args);
  }
  return done(true, "node", args, { effect: { kind: "run-js", file: target, code: node.content } });
}

function packageJsonFor(state: TermState): { segs: string[]; data: Record<string, unknown> | null; error?: string } {
  const segs = [...state.cwd, "package.json"];
  const node = getNode(state.fs, segs);
  if (!node || node.type !== "file") return { segs, data: null };
  try {
    return { segs, data: JSON.parse(node.content) as Record<string, unknown> };
  } catch (e) {
    return { segs, data: null, error: (e as Error).message };
  }
}

function runNpm(state: TermState, args: string[], out: Line[], done: Done, emit: (t: string) => boolean): ExecResult {
  const sub = args[0];
  if (sub === "-v" || sub === "--version") {
    out.push(L("11.6.2"));
    out.push(L("(simulated — your real version number will differ)", "muted"));
    return done(true, "npm -v", args);
  }
  if (!sub) {
    out.push(L("npm <command>", "muted"));
    out.push(L("This simulation supports:  npm init -y   and   npm install <package>", "muted"));
    return done(false, "npm", args);
  }
  if (sub === "init") {
    if (!args.includes("-y") && !args.includes("--yes")) {
      out.push(L("A real  npm init  asks you a list of questions (name, version, description…).", "muted"));
      out.push(L("Add  -y  to accept all the default answers:  npm init -y", "muted"));
      return done(false, "npm init", args);
    }
    const folder = state.cwd[state.cwd.length - 1] ?? "project";
    const pkgName = folder.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const existing = packageJsonFor(state).data;
    const pkg = existing ?? {
      name: pkgName,
      version: "1.0.0",
      main: "index.js",
      scripts: { test: 'echo "Error: no test specified" && exit 1' },
      keywords: [],
      author: "",
      license: "ISC",
      description: "",
    };
    const text = JSON.stringify(pkg, null, 2) + "\n";
    const segs = [...state.cwd, "package.json"];
    const parent = getNode(state.fs, state.cwd) as DirNode;
    parent.children["package.json"] = file(text);
    out.push(L(`Wrote to ${pathString(segs)}:`));
    out.push(L(""));
    emit(text);
    return done(true, "npm init", args);
  }
  if (sub === "install" || sub === "i" || sub === "add") {
    const names = args.slice(1).filter((a) => !a.startsWith("-"));
    const { data, error } = packageJsonFor(state);
    if (error) {
      out.push(L("npm error code EJSONPARSE", "err"));
      out.push(L(`npm error JSON.parse Invalid package.json: ${error}`, "err"));
      out.push(L("Tip: package.json must be valid JSON. Open it in the editor and fix the mistake.", "muted"));
      return done(false, "npm install", args);
    }
    if (!names.length) {
      if (!data) {
        out.push(L("npm error code ENOENT", "err"));
        out.push(L(`npm error enoent Could not read package.json in ${pathString(state.cwd)}`, "err"));
        out.push(L("Tip: are you in your project folder? Use  pwd  and  ls  to check.", "muted"));
        return done(false, "npm install", args);
      }
      out.push(L("up to date, audited 1 package in 1s"));
      out.push(L(""));
      out.push(L("found 0 vulnerabilities", "ok"));
      return done(true, "npm install", args);
    }
    for (const n of names) {
      const bare = n.replace(/@[^@/]*$/, "") || n;
      if (!PACKAGES[bare]) {
        out.push(L("npm error code E404", "err"));
        out.push(L(`npm error 404 Not Found - GET https://registry.npmjs.org/${bare} - Not found`, "err"));
        const guess = closest(bare, Object.keys(PACKAGES), 3);
        if (guess) out.push(L(`Did you mean  npm install ${guess} ?  Package names must be spelled exactly.`, "muted"));
        else out.push(L(`(This offline simulation only knows: ${Object.keys(PACKAGES).join(", ")}.)`, "muted"));
        return done(false, "npm install", args);
      }
    }
    const pkg = (data ?? {}) as Record<string, unknown>;
    if (!data) out.push(L("(There was no package.json here, so npm created a small one. Usually you run  npm init -y  first.)", "warn"));
    const deps = { ...((pkg.dependencies as Record<string, string>) ?? {}) };
    const here = getNode(state.fs, state.cwd) as DirNode;
    if (!here.children.node_modules || here.children.node_modules.type !== "dir") here.children.node_modules = dir();
    const nm = here.children.node_modules as DirNode;
    for (const n of names) {
      const bare = n.replace(/@[^@/]*$/, "") || n;
      const v = PACKAGES[bare].version;
      deps[bare] = "^" + v;
      nm.children[bare] = dir({ "package.json": file(JSON.stringify({ name: bare, version: v }, null, 2) + "\n"), "index.js": file("// the package's code lives here\n") });
    }
    pkg.dependencies = Object.fromEntries(Object.keys(deps).sort().map((k) => [k, deps[k]]));
    here.children["package.json"] = file(JSON.stringify(pkg, null, 2) + "\n");
    here.children["package-lock.json"] = file(JSON.stringify({ name: pkg.name ?? "", lockfileVersion: 3, requires: true, packages: Object.fromEntries(Object.keys(deps).map((k) => [`node_modules/${k}`, { version: PACKAGES[k]?.version ?? deps[k] }])) }, null, 2) + "\n");
    out.push(L(""));
    out.push(L(`added ${names.length} package${names.length > 1 ? "s" : ""}, and audited ${Object.keys(deps).length + 1} packages in 1s`));
    out.push(L(""));
    out.push(L("found 0 vulnerabilities", "ok"));
    return done(true, "npm install", names);
  }
  const guess = closest(sub, NPM_SUBS, 3);
  out.push(L(`Unknown command: "${sub}"`, "err"));
  if (guess) { out.push(L("")); out.push(L("Did you mean this?", "muted")); out.push(L(`    npm ${guess}`, "muted")); }
  return done(false, "npm", args);
}

function runGit(state: TermState, args: string[], out: Line[], done: Done, emit: (t: string) => boolean, now: Date): ExecResult {
  const sub = args[0];
  if (sub === "--version" || sub === "-v") {
    out.push(L("git version 2.51.0"));
    out.push(L("(simulated — your real version number will differ)", "muted"));
    return done(true, "git --version", args);
  }
  if (!sub) {
    out.push(L("usage: git <command> [<args>]", "muted"));
    out.push(L("This simulation supports: git init, git status, git add, git commit -m \"message\", git log", "muted"));
    return done(false, "git", args);
  }
  if (!GIT_SUBS.includes(sub)) {
    out.push(L(`git: '${sub}' is not a git command. See 'git --help'.`, "err"));
    const guess = closest(sub, GIT_SUBS, 3);
    if (guess) { out.push(L("")); out.push(L("The most similar command is", "muted")); out.push(L(`\t${guess}`, "muted")); }
    return done(false, "git", args);
  }

  if (sub === "init") {
    const key = pathString(state.cwd);
    const here = getNode(state.fs, state.cwd) as DirNode;
    if (state.repos[key]) {
      out.push(L(`Reinitialized existing Git repository in ${key}/.git/`));
      return done(true, "git init", args);
    }
    const outer = findRepo(state);
    if (outer) out.push(L(`(Note: you are already inside the repository at ${outer}. Usually you only run git init once, in the project's top folder.)`, "warn"));
    here.children[".git"] = dir({ HEAD: file("ref: refs/heads/main\n"), objects: dir(), refs: dir() });
    state.repos[key] = { branch: "main", index: {}, head: null, commits: [] };
    out.push(L(`Initialized empty Git repository in ${key}/.git/`));
    return done(true, "git init", args);
  }

  const key = findRepo(state);
  if (!key) {
    out.push(L("fatal: not a git repository (or any of the parent directories): .git", "err"));
    out.push(L("Tip: run  git init  in your project folder first — or  cd  into the project.", "muted"));
    return done(false, `git ${sub}`, args);
  }
  const repo = state.repos[key];
  const prefix = pathString(state.cwd).slice(key.length).replace(/^\//, "");

  if (sub === "status") {
    const s = gitStatus(state, key);
    const text: string[] = [`On branch ${repo.branch}`, ""];
    if (!repo.head) text.push("No commits yet", "");
    if (s.staged.length) {
      text.push("Changes to be committed:", repo.head ? '  (use "git restore --staged <file>..." to unstage)' : '  (use "git rm --cached <file>..." to unstage)');
      for (const f of s.staged) text.push(`\t${(f.kind + ":").padEnd(12, " ")}${f.path}`);
      text.push("");
    }
    if (s.unstaged.length) {
      text.push("Changes not staged for commit:", '  (use "git add <file>..." to update what will be committed)', '  (use "git restore <file>..." to discard changes in working directory)');
      for (const f of s.unstaged) text.push(`\t${(f.kind + ":").padEnd(12, " ")}${f.path}`);
      text.push("");
    }
    if (s.untracked.length) {
      text.push("Untracked files:", '  (use "git add <file>..." to include in what will be committed)');
      for (const f of s.untracked) text.push(`\t${f}`);
      text.push("");
    }
    if (!s.staged.length && !s.unstaged.length) {
      if (s.untracked.length) text.push('nothing added to commit but untracked files present (use "git add" to track)');
      else if (!repo.head) text.push('nothing to commit (create/copy files and use "git add" to track)');
      else text.push("nothing to commit, working tree clean");
    } else if (!s.staged.length) text.push('no changes added to commit (use "git add" and/or "git commit -a")');
    // Colour like real git: staged green, unstaged/untracked red.
    let section: "staged" | "unstaged" | "none" = "none";
    for (const t of text) {
      if (t.startsWith("Changes to be committed")) section = "staged";
      else if (t.startsWith("Changes not staged") || t.startsWith("Untracked")) section = "unstaged";
      else if (!t) section = section;
      out.push(L(t, t.startsWith("\t") ? (section === "staged" ? "ok" : "err") : undefined));
    }
    return done(true, "git status", args);
  }

  if (sub === "add") {
    const paths = args.slice(1);
    if (!paths.length) {
      out.push(L("Nothing specified, nothing added.", "err"));
      out.push(L("hint: Maybe you wanted to say 'git add .'?", "muted"));
      return done(false, "git add", args);
    }
    const work = workingFiles(state, key);
    const allWork = (() => { const n = getNode(state.fs, repoSegs(key)); return n && n.type === "dir" ? walkFiles(n) : {}; })();
    let matchedAny = false;
    for (const p of paths) {
      const rel = [prefix, p].filter(Boolean).join("/").split("/").reduce<string[]>((acc, part) => {
        if (part === "." || !part) return acc;
        if (part === "..") acc.pop(); else acc.push(part);
        return acc;
      }, []).join("/");
      const under = (f: string) => rel === "" || f === rel || f.startsWith(rel + "/");
      const hits = Object.keys(work).filter(under);
      const deleted = Object.keys(repo.index).filter((f) => under(f) && !(f in work));
      if (!hits.length && !deleted.length) {
        if (Object.keys(allWork).some(under)) {
          out.push(L("The following paths are ignored by one of your .gitignore files:", "warn"));
          out.push(L(p, "warn"));
          out.push(L('hint: Use -f if you really want to add them.', "muted"));
          matchedAny = true;
          continue;
        }
        out.push(L(`fatal: pathspec '${p}' did not match any files`, "err"));
        return done(false, "git add", args);
      }
      matchedAny = true;
      for (const f of hits) repo.index[f] = work[f];
      for (const f of deleted) delete repo.index[f];
    }
    return done(matchedAny, "git add", args);
  }

  if (sub === "commit") {
    const mi = args.findIndex((a) => a === "-m" || a === "--message");
    const msg = mi !== -1 ? args[mi + 1] : undefined;
    if (mi === -1) {
      out.push(L("A real  git commit  without -m opens a text editor for you to write the message.", "muted"));
      out.push(L('In this simulation, write the message inline:  git commit -m "Describe what changed"', "muted"));
      return done(false, "git commit", args);
    }
    if (!msg || !msg.trim()) {
      out.push(L("error: switch `m' requires a value", "err"));
      out.push(L('Tip: put the message in quotes:  git commit -m "Add hello.js"', "muted"));
      return done(false, "git commit", args);
    }
    const s = gitStatus(state, key);
    if (!s.staged.length) {
      for (const t of [`On branch ${repo.branch}`, ...(repo.head ? [] : ["", "No commits yet"]), ""]) out.push(L(t));
      if (s.untracked.length || s.unstaged.length) out.push(L('nothing added to commit but untracked files present (use "git add" to track)', "err"));
      else out.push(L(repo.head ? "nothing to commit, working tree clean" : 'nothing to commit (create/copy files and use "git add" to track)', "err"));
      out.push(L("Tip: git only commits what you have staged with  git add", "muted"));
      return done(false, "git commit", args);
    }
    const before = repo.head ?? {};
    let ins = 0;
    let del = 0;
    const creates: string[] = [];
    for (const f of s.staged) {
      const oldLines = f.kind === "new file" ? [] : (before[f.path] ?? "").split("\n").filter(Boolean);
      const newLines = f.kind === "deleted" ? [] : (repo.index[f.path] ?? "").split("\n").filter(Boolean);
      ins += newLines.filter((l) => !oldLines.includes(l)).length;
      del += oldLines.filter((l) => !newLines.includes(l)).length;
      if (f.kind === "new file") creates.push(f.path);
    }
    const root = !repo.head;
    const hash = hash40(msg + JSON.stringify(repo.index) + repo.commits.length);
    repo.head = { ...repo.index };
    repo.commits.unshift({ hash, message: msg, date: formatGitDate(now), files: { ...repo.index } });
    out.push(L(`[${repo.branch}${root ? " (root-commit)" : ""} ${hash.slice(0, 7)}] ${msg}`));
    const n = s.staged.length;
    const parts = [` ${n} file${n > 1 ? "s" : ""} changed`];
    if (ins || !del) parts.push(`${ins} insertion${ins === 1 ? "" : "s"}(+)`);
    if (del || !ins) parts.push(`${del} deletion${del === 1 ? "" : "s"}(-)`);
    out.push(L(parts.join(", ")));
    for (const c of creates) out.push(L(` create mode 100644 ${c}`));
    return done(true, "git commit", args);
  }

  if (sub === "log") {
    if (!repo.commits.length) {
      out.push(L(`fatal: your current branch '${repo.branch}' does not have any commits yet`, "err"));
      return done(false, "git log", args);
    }
    const lines: Line[] = [];
    repo.commits.forEach((c, i) => {
      lines.push([{ text: `commit ${c.hash}`, tone: "warn" }, ...(i === 0 ? [{ text: " (" }, { text: `HEAD -> ${repo.branch}`, tone: "ok" as Tone }, { text: ")" }] : [])]);
      lines.push(L(`Author: Student <student@example.com>`));
      lines.push(L(`Date:   ${c.date}`));
      lines.push(L(""));
      lines.push(L(`    ${c.message}`));
      if (i < repo.commits.length - 1) lines.push(L(""));
    });
    out.push(...lines);
    return done(true, "git log", args);
  }
  void emit;
  return done(false, "git", args);
}

export function formatGitDate(d: Date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n: number) => String(n).padStart(2, "0");
  return `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${d.getUTCDate()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} ${d.getUTCFullYear()} +0000`;
}

/* ------------------------------------------------------------------ */
/*  Tab completion                                                      */
/* ------------------------------------------------------------------ */

export function complete(state: TermState, input: string): string {
  const m = input.match(/^(.*?)(\S*)$/);
  if (!m) return input;
  const [, before, word] = m;
  if (!before.trim()) {
    const hits = COMMANDS.filter((c) => c.startsWith(word));
    return hits.length === 1 ? hits[0] + " " : input;
  }
  const slash = word.lastIndexOf("/");
  const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
  const stem = slash >= 0 ? word.slice(slash + 1) : word;
  const node = getNode(state.fs, dirPart ? resolve(state, dirPart) : state.cwd);
  if (!node || node.type !== "dir") return input;
  const hits = Object.keys(node.children).filter((n) => n.startsWith(stem) && (stem.startsWith(".") || !n.startsWith(".")));
  if (hits.length !== 1) return input;
  const child = node.children[hits[0]];
  return before + dirPart + hits[0] + (child.type === "dir" ? "/" : " ");
}

/* ------------------------------------------------------------------ */
/*  Missions                                                            */
/* ------------------------------------------------------------------ */

export interface Mission {
  id: string;
  title: string;
  why: string;
  command: string;
  check: (s: TermState) => boolean;
}

const last = (s: TermState) => s.log[s.log.length - 1];
const lastIs = (s: TermState, cmd: string) => { const l = last(s); return Boolean(l && l.ok && l.cmd === cmd); };
const fileAt = (s: TermState, rel: string[]) => getNode(s.fs, [...HOME, ...rel]);
const cwdIs = (s: TermState, rel: string[]) => pathString(s.cwd) === pathString([...HOME, ...rel]);

export const MISSION_SETS: Record<"basics" | "project", Mission[]> = {
  basics: [
    { id: "pwd", title: "Find out where you are", why: "pwd prints the full path of the folder you are in.", command: "pwd", check: (s) => lastIs(s, "pwd") },
    { id: "ls", title: "Look at what is here", why: "ls lists the files and folders in the current folder.", command: "ls", check: (s) => lastIs(s, "ls") },
    { id: "mkdir", title: "Make a folder called shop", why: "Every project lives in its own folder.", command: "mkdir shop", check: (s) => fileAt(s, ["shop"])?.type === "dir" },
    { id: "cd", title: "Move into the shop folder", why: "cd changes the folder you are working in. Watch the prompt change.", command: "cd shop", check: (s) => cwdIs(s, ["shop"]) },
    { id: "touch", title: "Create an empty file hello.js", why: "touch creates an empty file. The .js ending says it holds JavaScript.", command: "touch hello.js", check: (s) => fileAt(s, ["shop", "hello.js"])?.type === "file" },
    {
      id: "write", title: "Put one line of code into hello.js",
      why: "Either type the command below, or click hello.js in the folder tree and use the mini editor.",
      command: `echo 'console.log("Hello, Kampala!")' > hello.js`,
      check: (s) => { const f = fileAt(s, ["shop", "hello.js"]); return f?.type === "file" && f.content.includes("console.log"); },
    },
    { id: "cat", title: "Read the file back", why: "cat prints a file's contents, so you can check what is inside.", command: "cat hello.js", check: (s) => { const l = last(s); return Boolean(l && l.ok && l.cmd === "cat" && l.args.some((a) => a.endsWith("hello.js"))); } },
    { id: "node", title: "Run your program with Node.js", why: "node runs a JavaScript file and shows what it prints.", command: "node hello.js", check: (s) => { const l = last(s); return Boolean(l && l.ok && l.cmd === "node" && l.args[0]?.endsWith("hello.js")); } },
  ],
  project: [
    { id: "cd", title: "Move into the shop project", why: "Commands act on the folder you are in, so go to the project first.", command: "cd shop", check: (s) => cwdIs(s, ["shop"]) },
    { id: "node", title: "Run hello.js", why: "Check the program works before you change anything.", command: "node hello.js", check: (s) => { const l = last(s); return Boolean(l && l.ok && l.cmd === "node"); } },
    { id: "init", title: "Turn the folder into an npm project", why: "npm init -y creates package.json: the project's ID card and shopping list.", command: "npm init -y", check: (s) => fileAt(s, ["shop", "package.json"])?.type === "file" },
    { id: "install", title: "Install the dayjs package", why: "npm downloads packages other people wrote and records them in package.json.", command: "npm install dayjs", check: (s) => { const f = fileAt(s, ["shop", "package.json"]); return f?.type === "file" && f.content.includes('"dayjs"'); } },
    { id: "cat", title: "Look inside package.json", why: "See the new \"dependencies\" section that npm added.", command: "cat package.json", check: (s) => { const l = last(s); return Boolean(l && l.ok && l.cmd === "cat" && l.args.some((a) => a.endsWith("package.json"))); } },
    { id: "git-init", title: "Start tracking versions with Git", why: "git init creates a hidden .git folder where Git keeps the history.", command: "git init", check: (s) => Boolean(s.repos[pathString([...HOME, "shop"])]) },
    { id: "status", title: "Ask Git what it sees", why: "git status is the command you will type most. It is always safe.", command: "git status", check: (s) => lastIs(s, "git status") },
    { id: "ignore", title: "Tell Git to ignore node_modules", why: "node_modules can be re-downloaded with npm install, so it should not be saved in Git.", command: "echo node_modules > .gitignore", check: (s) => { const f = fileAt(s, ["shop", ".gitignore"]); return f?.type === "file" && f.content.includes("node_modules"); } },
    { id: "add", title: "Stage everything for the first commit", why: "git add chooses what goes into the next snapshot. The dot means \"this folder\".", command: "git add .", check: (s) => { const r = s.repos[pathString([...HOME, "shop"])]; return Boolean(r && r.index["hello.js"] !== undefined && r.index["package.json"] !== undefined); } },
    { id: "commit", title: "Save a snapshot with a message", why: "A commit is a saved version with a short note saying what changed.", command: 'git commit -m "First version of the shop project"', check: (s) => (s.repos[pathString([...HOME, "shop"])]?.commits.length ?? 0) >= 1 },
    { id: "log", title: "See the project's history", why: "git log lists every commit, newest first.", command: "git log", check: (s) => lastIs(s, "git log") },
  ],
};

/** Advance through every mission that is now satisfied (in order). */
export function advanceMissions(missions: Mission[], doneCount: number, s: TermState): number {
  let n = doneCount;
  while (n < missions.length && missions[n].check(s)) n++;
  return n;
}

/* ------------------------------------------------------------------ */
/*  Folder tree for the UI                                              */
/* ------------------------------------------------------------------ */

export interface TreeRow {
  name: string;
  depth: number;
  isDir: boolean;
  path: string[];
  hidden: boolean;
  isCwd: boolean;
  /** Git marker: U untracked, A staged new, M modified, C committed & clean. */
  git?: "U" | "A" | "M" | "C";
  collapsed?: boolean;
}

export function tree(state: TermState): TreeRow[] {
  const rows: TreeRow[] = [];
  const cwd = pathString(state.cwd);
  const statusCache: Record<string, GitStatus> = {};
  const marker = (segs: string[]): TreeRow["git"] => {
    const key = findRepo(state, segs.slice(0, -1));
    if (!key) return undefined;
    statusCache[key] ??= gitStatus(state, key);
    const s = statusCache[key];
    const rel = pathString(segs).slice(key.length + 1);
    const work = workingFiles(state, key);
    if (!(rel in work)) return undefined;
    if (s.untracked.some((u) => u === rel || (u.endsWith("/") && rel.startsWith(u)))) return "U";
    if (s.unstaged.some((u) => u.path === rel)) return "M";
    if (s.staged.some((u) => u.path === rel)) return "A";
    return "C";
  };
  const walk = (node: DirNode, segs: string[], depth: number) => {
    const names = Object.keys(node.children).sort((a, b) => {
      const da = node.children[a].type === "dir" ? 0 : 1;
      const db = node.children[b].type === "dir" ? 0 : 1;
      return da - db || a.localeCompare(b);
    });
    for (const n of names) {
      const child = node.children[n];
      const p = [...segs, n];
      const collapsed = child.type === "dir" && (n === "node_modules" || n === ".git");
      rows.push({ name: n, depth, isDir: child.type === "dir", path: p, hidden: n.startsWith("."), isCwd: pathString(p) === cwd, git: child.type === "file" ? marker(p) : undefined, collapsed });
      if (child.type === "dir" && !collapsed) walk(child, p, depth + 1);
    }
  };
  const home = getNode(state.fs, state.home) as DirNode;
  rows.push({ name: "~ (home)", depth: 0, isDir: true, path: state.home, hidden: false, isCwd: pathString(state.home) === cwd });
  walk(home, state.home, 1);
  return rows;
}

export function writeFile(prev: TermState, segs: string[], content: string): TermState {
  const s = clone(prev);
  const parent = getNode(s.fs, segs.slice(0, -1));
  if (parent && parent.type === "dir") parent.children[segs[segs.length - 1]] = file(content);
  return s;
}

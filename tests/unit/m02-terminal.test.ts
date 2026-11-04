import { describe, expect, it } from "vitest";
import {
  MISSION_SETS, advanceMissions, complete, execute, gitStatus, initialState, prompt, tokenize, tree, type TermState,
} from "@/labs/m02/terminalEngine";

const text = (r: { out: { text: string }[][] }) => r.out.map((l) => l.map((s) => s.text).join("")).join("\n");

function run(s: TermState, ...cmds: string[]) {
  let state = s;
  let last = execute(state, "");
  for (const c of cmds) {
    last = execute(state, c, new Date(Date.UTC(2026, 10, 4, 10, 0, 0)));
    state = last.state;
  }
  return { state, last };
}

describe("tokenize", () => {
  it("handles quotes and redirection", () => {
    expect(tokenize(`echo 'console.log("Hi!")' > hello.js`).tokens).toEqual(["echo", 'console.log("Hi!")', ">", "hello.js"]);
    expect(tokenize(`git commit -m "First version"`).tokens).toEqual(["git", "commit", "-m", "First version"]);
    expect(tokenize(`echo "oops`).error).toMatch(/Unclosed/);
  });
});

describe("navigation", () => {
  it("pwd, mkdir, cd, ls and the prompt", () => {
    const { state, last } = run(initialState(), "mkdir shop", "cd shop", "pwd");
    expect(text(last)).toBe("/home/student/shop");
    expect(prompt(state)).toBe("student@laptop:~/shop$");
    const up = run(state, "cd ..", "ls");
    expect(text(up.last)).toContain("shop/");
    expect(text(up.last)).toContain("welcome.txt");
  });
  it("gives helpful errors for typos", () => {
    const s = initialState();
    expect(text(execute(s, "cd.."))).toContain("put a space");
    expect(text(execute(s, "sl"))).toContain("command not found");
    expect(text(execute(s, "LS"))).toContain("case-sensitive");
    expect(text(execute(s, "cd documents"))).toContain("cd Documents");
    expect(text(execute(s, "cd welcome.txt"))).toContain("Not a directory");
    expect(text(execute(s, "cat nothing.txt"))).toContain("No such file or directory");
    expect(text(execute(s, "mkdir Documents"))).toContain("File exists");
  });
  it("tab-completes names", () => {
    expect(complete(initialState(), "cd Doc")).toBe("cd Documents/");
    expect(complete(initialState(), "pw")).toBe("pwd ");
  });
});

describe("files and node", () => {
  it("writes with echo > and reads with cat", () => {
    const { state, last } = run(initialState(), "touch a.js", `echo 'console.log("Hello")' > a.js`, "echo second >> a.js", "cat a.js");
    expect(text(last)).toBe('console.log("Hello")\nsecond');
    const r = execute(state, "node a.js");
    expect(r.effect).toEqual({ kind: "run-js", file: "a.js", code: 'console.log("Hello")\nsecond\n' });
  });
  it("explains a missing file", () => {
    const r = execute(initialState(), "node hello");
    expect(text(r)).toContain("Cannot find module");
    expect(text(r)).toContain("node hello.js");
  });
});

describe("npm", () => {
  it("npm init -y writes a package.json named after the folder", () => {
    const { state } = run(initialState(), "mkdir shop", "cd shop", "npm init -y");
    const r = execute(state, "cat package.json");
    const pkg = JSON.parse(text(r));
    expect(pkg.name).toBe("shop");
    expect(pkg.version).toBe("1.0.0");
  });
  it("npm install adds a dependency, node_modules and a lock file; typos get a suggestion", () => {
    const { state } = run(initialState(), "mkdir shop", "cd shop", "npm init -y", "npm install dayjs");
    const pkg = JSON.parse(text(execute(state, "cat package.json")));
    expect(Object.keys(pkg.dependencies)).toEqual(["dayjs"]);
    expect(text(execute(state, "ls"))).toContain("node_modules/");
    expect(text(execute(state, "ls"))).toContain("package-lock.json");
    expect(text(execute(state, "npm install dayj"))).toContain("npm install dayjs");
    expect(text(execute(state, "npm instal dayjs"))).toContain("npm install");
  });
});

describe("git", () => {
  it("init → status → add → commit → log, with .gitignore respected", () => {
    let { state, last } = run(initialState("project"), "cd shop", "npm init -y", "npm install dayjs", "git status");
    expect(text(last)).toContain("fatal: not a git repository");
    ({ state, last } = run(state, "git init", "git status"));
    expect(text(last)).toContain("No commits yet");
    expect(text(last)).toContain("node_modules/");
    ({ state, last } = run(state, "echo node_modules > .gitignore", "git status"));
    expect(text(last)).not.toContain("node_modules/");
    expect(text(last)).toContain(".gitignore");
    ({ state, last } = run(state, "git commit -m \"too early\""));
    expect(last.ok).toBe(false);
    ({ state, last } = run(state, "git add .", "git status"));
    expect(text(last)).toContain("new file:   hello.js");
    ({ state, last } = run(state, `git commit -m "First version"`));
    expect(text(last)).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] First version/);
    expect(text(last)).toContain("4 files changed");
    ({ state, last } = run(state, "git status"));
    expect(text(last)).toContain("nothing to commit, working tree clean");
    ({ state, last } = run(state, "git log"));
    expect(text(last)).toContain("First version");
    expect(text(last)).toContain("HEAD -> main");
    ({ state, last } = run(state, "echo 'console.log(1)' >> hello.js", "git status"));
    expect(text(last)).toContain("modified:   hello.js");
    expect(gitStatus(state, "/home/student/shop").unstaged).toEqual([{ path: "hello.js", kind: "modified" }]);
    expect(tree(state).find((r) => r.name === "hello.js")?.git).toBe("M");
  });
  it("suggests the right git sub-command", () => {
    const r = execute(initialState(), "git stauts");
    expect(text(r)).toContain("is not a git command");
    expect(text(r)).toContain("status");
  });
});

describe("missions", () => {
  it("the basics missions complete with their own suggested commands", () => {
    const ms = MISSION_SETS.basics;
    let s = initialState("basics");
    let n = 0;
    for (const m of ms) {
      s = execute(s, m.command).state;
      n = advanceMissions(ms, n, s);
    }
    expect(n).toBe(ms.length);
  });
  it("the project missions complete with their own suggested commands", () => {
    const ms = MISSION_SETS.project;
    let s = initialState("project");
    let n = 0;
    for (const m of ms) {
      s = execute(s, m.command).state;
      n = advanceMissions(ms, n, s);
    }
    expect(n).toBe(ms.length);
  });
  it("missions do not complete from failed commands", () => {
    const ms = MISSION_SETS.basics;
    const s = execute(initialState(), "pdw").state;
    expect(advanceMissions(ms, 0, s)).toBe(0);
  });
});

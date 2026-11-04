import { describe, expect, it } from "vitest";
import { WORKER_SOURCE } from "@/engine/runner/runCode";
import type { CodeTest } from "@/content/schema";

/** Run the real worker source in node by giving it a fake `self`. */
function runInFakeWorker(code: string, tests: CodeTest[]): Promise<{ ok: boolean; tests: { passed: boolean; message: string }[]; error?: string; logs: string[] }> {
  const real = globalThis.console;
  return new Promise((resolve) => {
    const fakeSelf: Record<string, unknown> = {
      postMessage: (m: never) => {
        Object.defineProperty(globalThis, "console", { value: real, configurable: true, writable: true });
        resolve(m);
      },
    };
    // In a real worker `self` IS the global object, so `console` resolves to self.console.
    Object.defineProperty(globalThis, "console", { get: () => (fakeSelf.console as Console) ?? real, configurable: true });
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function("self", WORKER_SOURCE.replace('"use strict";', ""))(fakeSelf);
    (fakeSelf.onmessage as (e: { data: unknown }) => void)({ data: { code, tests } });
  });
}

describe("sandbox runner semantics", () => {
  it("sees learner declarations and compares deeply", async () => {
    const r = await runInFakeWorker("const add = (a, b) => a + b; let o = { b: 1, a: [2] };", [
      { name: "add", expr: "add(2, 3)", expected: 5 },
      { name: "object", expr: "o", expected: { a: [2], b: 1 } },
    ]);
    expect(r.ok).toBe(true);
  });
  it("awaits promises and supports await inside expressions", async () => {
    const r = await runInFakeWorker("async function serve() { return 'chai'; }", [
      { name: "plain", expr: "serve()", expected: "chai" },
      { name: "await", expr: "await serve()", expected: "chai" },
    ]);
    expect(r.tests.map((t) => t.passed)).toEqual([true, true]);
  });
  it("handles throws and logs, without double-running side effects", async () => {
    const r = await runInFakeWorker("let n = 0; function bad() { n++; JSON.parse('{'); } function hi() { console.log('hello'); }", [
      { name: "throws", expr: "bad()", throws: "JSON" },
      { name: "ran once", expr: "n", expected: 1 },
      { name: "logs", expr: "hi()", logIncludes: "hello" },
    ]);
    expect(r.tests.map((t) => t.passed)).toEqual([true, true, true]);
  });
  it("reports syntax errors in learner code", async () => {
    const r = await runInFakeWorker("const = 5", [{ name: "x", expr: "1", expected: 1 }]);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/syntax/i);
  });
});

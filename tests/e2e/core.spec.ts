import { expect, test as base, type Page } from "@playwright/test";

/** Every navigation waits until React has hydrated, so clicks are never lost. */
const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, opts) => {
      const res = await goto(url, opts);
      await page.waitForSelector("html[data-hydrated]", { state: "attached" });
      return res;
    };
    await use(page);
  },
});

async function noConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test("dashboard renders and links to the first lesson", async ({ page }) => {
  const errors = await noConsoleErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("From zero to building");
  await page.getByRole("link", { name: /Start the first lesson/ }).click();
  await expect(page).toHaveURL(/\/learn\/m0\/m0-l1/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Three systems, one customer");
  expect(errors).toEqual([]);
});

test("first lesson can be completed and progress persists", async ({ page }) => {
  await page.goto("/learn/m0/m0-l1");
  const lab = page.locator('[data-lab="three-systems"]');
  for (const label of ["ORDER rice 3", "3 bags of rice, deliver tomorrow", "Eggs and beans"]) {
    const pill = lab.getByRole("button", { name: new RegExp("^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first();
    // Retry the click until the app has hydrated and the pill is selected.
    await expect(async () => {
      await pill.click();
      await expect(pill).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass();
    await expect(lab.getByText(/Step 1 of \d+/)).toBeVisible();
    const step = lab.getByRole("button", { name: "Step", exact: true });
    while (await step.isEnabled()) await step.click();
  }
  await expect(lab.getByText("Challenge complete")).toBeVisible();

  // Knowledge check: answer every question correctly.
  const answers: Record<number, string[]> = {
    0: ["It can request tools, and code runs those tools in a loop until the task is done."],
    1: ["“Sorry, I did not understand. Please type: ORDER <product> <quantity>”"],
    2: ["The model had no access to the shop's price list, so it produced a plausible guess."],
    3: ["Actually reading the stock level from the database", "Calculating the exact total in UGX", "Stopping after a maximum number of steps"],
    4: ["A rules program, because the input is perfectly predictable."],
  };
  const fieldsets = page.locator("fieldset");
  for (const [i, opts] of Object.entries(answers)) {
    const fs = fieldsets.nth(Number(i));
    for (const o of opts) await fs.getByRole(opts.length > 1 ? "checkbox" : "radio", { name: new RegExp(o.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await fs.getByRole("button", { name: "Check answer" }).click();
  }
  await expect(page.getByText("Knowledge check complete.")).toBeVisible();

  await page.getByLabel("Your explanation").fill(
    "A chatbot only knows its training so it guesses prices it cannot see. An agent uses tools to look up the real price list and stock; the shop's code runs those tools and asks the owner to approve orders.",
  );
  await page.getByRole("button", { name: "Get feedback" }).click();
  await page.getByRole("button", { name: "Confidently" }).click();
  await expect(page.getByText("Lesson complete")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Lesson complete")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Welcome back.")).toBeVisible();
});

test("agent brain: runaway loop stops at max steps, and the guard stops it earlier", async ({ page }) => {
  await page.goto("/labs/agent-brain");
  await page.getByRole("radio", { name: /Runaway loop/ }).click();
  const guard = page.getByText("Loop guard", { exact: true });
  // Guard on (default): stopped by guard
  const forward = page.getByRole("button", { name: "Step forward" });
  while (await forward.isEnabled()) await forward.click();
  await expect(page.getByText(/Stopped: Repeated the same action/)).toBeVisible();
  // Guard off: stopped by max steps
  await guard.click();
  await expect(page.getByText("Event 1 /")).toBeVisible();
  while (await forward.isEnabled()) await forward.click();
  await expect(page.getByText(/Stopped: Reached the maximum of 8 steps/)).toBeVisible();
});

test("tool lab: validation rejects bad arguments before anything runs", async ({ page }) => {
  await page.goto("/labs/tool-lab");
  await page.getByRole("button", { name: "Ask the model" }).click();
  await page.getByLabel("Arguments (JSON)").fill('{ "query": 5 }');
  await page.getByRole("button", { name: "Validate against schema" }).click();
  await expect(page.getByText("expected string but got integer").first()).toBeVisible();
  await page.getByLabel("Arguments (JSON)").fill('{ "query": "rice" }');
  await page.getByRole("button", { name: "Validate against schema" }).click();
  await page.getByRole("button", { name: /Execute search_products/ }).click();
  await expect(page.getByText("search_products returned")).toBeVisible();
});

test("anatomy explorer plays a journey and inspects parts", async ({ page }) => {
  const errors = await noConsoleErrors(page);
  await page.goto("/anatomy");
  await page.locator('[aria-label="Language model"]').click();
  await expect(page.getByText("The LLM, usually hosted by an AI provider")).toBeVisible();
  await page.getByRole("button", { name: "Step forward" }).click();
  await page.getByRole("button", { name: "Step forward" }).click();
  await expect(page.getByText(/Event 3 · step 1/)).toBeVisible();
  await page.getByRole("tab", { name: "Try it" }).click();
  await page.getByRole("button", { name: "Run a small demonstration" }).click();
  await expect(page.getByRole("tabpanel").getByText(/tool_calls/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("sandbox runs an agent and evaluations", async ({ page }) => {
  await page.goto("/progress");
  await page.getByText("Free roam").click();
  await page.goto("/sandbox");
  await page.getByRole("button", { name: "Run agent" }).click();
  await expect(page.getByText(/UGX 335,000/).first()).toBeVisible();
  await page.getByRole("button", { name: /Run 7 test cases/ }).click();
  await expect(page.getByText("7/7 passed")).toBeVisible();
});

test("live AI is off by default and the API says so", async ({ request }) => {
  const status = await (await request.get("/api/status")).json();
  expect(status.live).toBe(false);
  const res = await request.post("/api/model", { data: {} });
  expect(res.status()).toBe(503);
});

for (const path of ["/", "/learn/m0/m0-l1", "/anatomy", "/labs/agent-brain", "/sandbox"]) {
  test(`@mobile no horizontal page overflow on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("code exercises run in the sandboxed worker, and infinite loops are stopped", async ({ page }) => {
  await page.goto("/learn/m2/m2-l1");
  const ex = page.locator("[data-exercise]").first();
  await ex.scrollIntoViewIfNeeded();
  const editor = ex.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText("while (true) {}");
  await ex.getByRole("button", { name: /Run & check/ }).click();
  await expect(ex.getByText(/Stopped after .* a loop that never ends/)).toBeVisible({ timeout: 10_000 });
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText("console.log('hello from the worker')");
  await ex.getByRole("button", { name: /Run & check/ }).click();
  await expect(ex.getByText("hello from the worker").first()).toBeVisible();
});

test("agent brain challenge completes inside a lesson without crashing", async ({ page }) => {
  await page.goto("/learn/m7/m7-l1");
  const lab = page.locator('[data-lab="agent-brain"]').first();
  await lab.scrollIntoViewIfNeeded();
  const forward = lab.getByRole("button", { name: "Step forward" });
  await expect(lab.getByText(/Event 1 \//)).toBeVisible();
  while (await forward.isEnabled()) await forward.click();
  await expect(lab.getByText("Challenge complete")).toBeVisible();
  await expect(page.getByText("This lab crashed")).toHaveCount(0);
});

test("every built lesson and project page renders without errors", async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
  await page.goto("/learn");
  const moduleLinks = await page.locator('a[href^="/learn/m"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
  for (const m of moduleLinks) {
    await page.goto(m);
    const lessons = await page.locator(`a[href^="${m}/"]`).evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
    for (const l of lessons) {
      await page.goto(l);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("This lab crashed")).toHaveCount(0);
    }
  }
  for (const p of ["/projects/p1", "/projects/p2", "/projects/p3", "/projects/p4", "/glossary", "/progress", "/labs"]) {
    await page.goto(p);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

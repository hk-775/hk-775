import { test, expect } from "@playwright/test";

test("workflow, evidence links, and browser network boundary", async ({ page }) => {
  const errors = [];
  const sockets = [];
  const external = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("websocket", socket => sockets.push(socket.url()));
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4177/")) external.push(request.url());
  });
  await page.clock.install();
  await page.goto("/hk-775/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Test the boundary");
  await page.getByRole("link", { name: /Watch the 60-second/ }).click();
  await expect(page).toHaveURL(/#watch$/);
  await page.getByRole("button", { name: "Play 60-second walkthrough" }).click();
  await page.clock.fastForward(15000);
  await expect(page.locator("#scene-title")).toContainText("Real routing code");
  await page.getByRole("button", { name: "Pause walkthrough" }).click();
  await page.clock.fastForward(30000);
  await expect(page.locator("#progress")).toHaveText("Step 2 of 4");
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.locator("#evidence-content")).toContainText("[REDACTED BY OSTIARI ESCAPE LAB]");
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.locator("#scene-title")).toContainText("Keep the evidence");
  await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(page.locator("#progress")).toHaveText("Step 1 of 4");
  await page.getByRole("button", { name: /04 Verify the result/ }).click();
  await expect(page.locator("#progress")).toHaveText("Step 4 of 4");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await page.getByRole("button", { name: "Play 60-second walkthrough" }).click();
  for (let i = 0; i < 4; i++) await page.clock.fastForward(15000);
  await expect(page.getByRole("button", { name: "Replay walkthrough" })).toBeVisible();
  const links = await page.locator('a[href^="evidence"]').evaluateAll(elements => elements.map(e => e.href));
  for (const href of links) {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
  }
  const response = await page.request.get("/hk-775/evidence/summary.json");
  const summary = await response.json();
  expect(summary.results.map(row => row.outcome)).toEqual(["O3", "O1"]);
  expect(summary.results.every(row => row.evidence_valid)).toBe(true);
  expect(errors).toEqual([]);
  expect(sockets).toEqual([]);
  expect(external).toEqual([]);
  await page.screenshot({ path: "/tmp/profile-desktop.png", fullPage: true });
});

test("mobile layout, local assets, navigation, and captions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/hk-775/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const id of ["watch", "understand", "inspect", "leadership"]) {
    await page.locator(`nav a[href="#${id}"]`).click();
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  await page.locator(".video-details summary").click();
  await expect(page.locator("video")).toBeVisible();
  expect(await page.locator("video track").getAttribute("srclang")).toBe("en");
  const captions = await page.request.get("/hk-775/axonllm-demo.vtt");
  expect(captions.status()).toBe(200);
  expect(await captions.text()).toMatch(/^WEBVTT/);
  expect((await page.request.get("/hk-775/share.png")).status()).toBe(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".video-details summary").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "/tmp/profile-mobile.png", fullPage: true });
});

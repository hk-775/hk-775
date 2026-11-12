import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const article = "/hk-775/blog/renewal-studio-standard-renewal.html";
const series = "/hk-775/blog/renewal-studio.html";
const keys = ["journey", "eligibility", "consent", "recovery"];
const figureFor = (page, key) => page.locator(`[data-renewal="${key}"]`);
const dotPosition = dot => dot.evaluate(node => {
  const r = node.getBoundingClientRect();
  return [r.x.toFixed(3), r.y.toFixed(3)];
});

test("series links only published parts and exposes article sharing resources", async ({ page, baseURL }) => {
  await page.goto(series);
  await expect(page.locator(".series-list li")).toHaveCount(9);
  await expect(page.locator(".series-list li").first()).toContainText("Available now");
  const planned = page.locator(".series-list li").filter({ hasText: "Planned" });
  await expect(planned).toHaveCount(8);
  await expect(planned.locator("a")).toHaveCount(0);
  const structured = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(structured.hasPart).toHaveLength(1);
  expect(structured.hasPart[0].url).toContain("renewal-studio-standard-renewal.html");
  for (const href of await page.locator("a").evaluateAll(nodes => nodes.map(n => n.href).filter(Boolean))) {
    if (href.startsWith(baseURL)) expect((await page.request.get(href)).status()).toBe(200);
  }
  const sitemap = await (await page.request.get("/hk-775/sitemap.xml")).text();
  expect(sitemap).toContain("blog/renewal-studio.html</loc>");
  await page.getByRole("link", { name: "Start with Part 1 →" }).click();
  await expect(page).toHaveURL(new RegExp(article + "$"));
  await expect(page.locator(".series-callout")).toContainText("Part 1");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /diagrams\/renewal-standard-cover.png$/);
  const png = await (await page.request.get("/hk-775/blog/diagrams/renewal-standard-cover.png")).body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  const evidence = await (await page.request.get("/hk-775/blog/evidence/renewal-standard.json")).json();
  expect(evidence.status).toBe("passed");
  expect(evidence.checks).toHaveLength(9);
  expect(evidence.provenance.capture_script_sha256).toBe(createHash("sha256").update(readFileSync(new URL("../scripts/capture-renewal-demo.mjs", import.meta.url))).digest("hex"));
  expect(JSON.stringify(evidence)).not.toMatch(/csrf|cookie|buyer@|cus_|CTR-|Sam Taylor|Robin Morgan/i);
});

test("choices expose distinct decisions and recovery completes only missing work", async ({ page, baseURL }) => {
  const external = [], errors = [], sockets = [];
  page.on("request", r => { if (!r.url().startsWith(baseURL + "/")) external.push(r.url()); });
  page.on("pageerror", error => errors.push(error.message));
  page.on("websocket", socket => sockets.push(socket.url()));
  await page.goto(article);
  const journey = figureFor(page, "journey"), eligibility = figureFor(page, "eligibility");
  const consent = figureFor(page, "consent"), recovery = figureFor(page, "recovery");
  await journey.getByRole("button", { name: "3 · Offer", exact: true }).click();
  await expect(journey.locator("[data-result-title]")).toHaveText("Make a specific proposal");
  await eligibility.getByRole("button", { name: "Custom negotiation", exact: true }).click();
  await expect(eligibility.locator("[data-result-detail]")).toContainText("Deal Desk");
  await eligibility.getByRole("button", { name: "Unverified amendment", exact: true }).press("Enter");
  await expect(eligibility.locator("[data-result-detail]")).toContainText("Revenue Operations");
  await expect(eligibility.locator('[data-node="hold"]').first()).toHaveAttribute("data-active", "true");
  await expect(eligibility.locator('[data-node="ready"]').first()).toHaveAttribute("data-active", "false");
  await expect(journey.locator("[data-result-title]")).toHaveText("Make a specific proposal");
  await consent.getByRole("button", { name: "Offer changed", exact: true }).click();
  await expect(consent.locator("[data-result-title]")).toHaveText("The previous version cannot be accepted");
  await consent.getByRole("button", { name: "Buyer confirms", exact: true }).click();
  await expect(consent.locator("[data-result-title]")).toHaveText("Accepted now, scheduled for later");
  await expect(recovery.getByRole("button", { name: "Retry access", exact: true })).toBeDisabled();
  await recovery.getByRole("button", { name: "Run activation", exact: true }).click();
  await expect(recovery).toHaveAttribute("data-state", "recovery_required");
  await expect(recovery.locator("dd")).toHaveText(["1", "1", "0"]);
  await expect(recovery.getByRole("button", { name: "Run activation", exact: true })).toBeDisabled();
  await recovery.getByRole("button", { name: "Retry access", exact: true }).press("Space");
  await expect(recovery).toHaveAttribute("data-state", "complete");
  await expect(recovery.locator("dd")).toHaveText(["1", "2", "1"]);
  await expect(recovery.getByRole("button", { name: "Retry access", exact: true })).toBeDisabled();
  await recovery.getByRole("button", { name: "Reset example", exact: true }).click();
  await expect(recovery).toHaveAttribute("data-state", "accepted");
  await expect(recovery.locator("dd")).toHaveText(["0", "0", "0"]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  expect(sockets).toEqual([]);
});

for (const key of keys) test(`${key}: visible dashes and solid dots move, pause and respect reduced motion`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(article);
  const figure = figureFor(page, key);
  if (key === "recovery") await figure.getByRole("button", { name: "Run activation", exact: true }).click();
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-motion", "running");
  const svg = figure.locator(".landscape");
  const path = svg.locator('[data-edge][data-active="true"]').first();
  const dot = svg.locator('[data-dot][data-active="true"]').first();
  await expect(dot).toBeVisible();
  const dashOffset = () => path.evaluate(n => getComputedStyle(n).strokeDashoffset);
  const beforeDash = await dashOffset(), beforeDot = await dotPosition(dot);
  await expect.poll(dashOffset).not.toBe(beforeDash);
  await expect.poll(() => dotPosition(dot)).not.toEqual(beforeDot);
  await figure.getByRole("button", { name: "Pause animation", exact: true }).press("Space");
  await expect(figure).toHaveAttribute("data-motion", "paused");
  await expect.poll(() => svg.evaluate(n => n.animationsPaused())).toBe(true);
  await expect.poll(() => path.evaluate(n => n.getAnimations().every(a => !a.pending && a.playState === "paused"))).toBe(true);
  const frozenDot = await dotPosition(dot), frozenDash = await dashOffset();
  await page.waitForTimeout(150);
  expect(await dotPosition(dot)).toEqual(frozenDot);
  expect(await dashOffset()).toBe(frozenDash);
  await figure.getByRole("button", { name: "Play animation", exact: true }).press("Enter");
  await expect.poll(() => dotPosition(dot)).not.toEqual(frozenDot);
  await figure.getByRole("button", { name: "Expand diagram", exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.dataset.renewal)).toBe(key);
  await figure.getByRole("button", { name: "Exit full screen", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(figure.getByRole("button", { name: "Animation off", exact: true })).toBeDisabled();
  await expect(figure).toHaveAttribute("data-motion", "paused");
  const stationary = await dotPosition(dot);
  await page.waitForTimeout(150);
  expect(await dotPosition(dot)).toEqual(stationary);
  expect(await path.evaluate(n => getComputedStyle(n).animationName)).toBe("none");
  await figure.screenshot({ path: `/tmp/renewal-${key}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(svg).toBeHidden();
  await expect(figure.locator(".portrait")).toBeVisible();
  await figure.screenshot({ path: `/tmp/renewal-${key}-mobile.png` });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await figure.scrollIntoViewIfNeeded();
  const mobileDot = figure.locator('.portrait [data-dot][data-active="true"]').first();
  const mobilePosition = await dotPosition(mobileDot);
  await expect.poll(() => dotPosition(mobileDot)).not.toEqual(mobilePosition);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(figure.locator(".renewal-toolbar")).toBeHidden();
  await expect(figure.locator(".renewal-interaction")).toBeHidden();
  await expect(dot).toBeHidden();
});

test("mobile reading, static downloads and no-JavaScript fallbacks remain usable", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + article);
    for (const key of keys) {
      const figure = figureFor(page, key);
      await figure.scrollIntoViewIfNeeded();
      await expect(figure.locator(".portrait")).toBeVisible();
      await expect(figure.locator(".renewal-toolbar")).toBeHidden();
      await expect(figure.locator(".renewal-interaction")).toBeHidden();
      await expect(figure.locator(".renewal-fallback")).toBeVisible();
      for (const href of await figure.locator(".renewal-downloads a").evaluateAll(nodes => nodes.map(n => n.href))) {
        const response = await page.request.get(href);
        expect(response.status()).toBe(200);
        const bytes = await response.body();
        expect(bytes.length).toBeGreaterThan(1000);
        if (href.endsWith(".png")) expect(bytes.readUInt32BE(16)).toBe(1440);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto(baseURL + series);
    await expect(page.locator(".series-list li")).toHaveCount(9);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: "/tmp/renewal-series-mobile.png", fullPage: true });
  } finally { await context.close(); }
});

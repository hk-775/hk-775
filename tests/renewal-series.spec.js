import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { explorers } from "../site/blog/renewal-explorer-data.js";
import { layout } from "../scripts/renewal-artwork.mjs";

const series = JSON.parse(readFileSync(new URL("../blog/series.json", import.meta.url)));
const posts = JSON.parse(readFileSync(new URL("../blog/posts.json", import.meta.url)));
const additions = posts.filter(p => p.seriesPart > 1);
const position = dot => dot.evaluate(n => {
  const b = n.getBoundingClientRect(); return [b.x.toFixed(2), b.y.toFixed(2)];
});

test("complete reading order has no placeholders, unique covers and recorded replay provenance", async ({ page }) => {
  await page.goto("/hk-775/blog/renewal-studio.html");
  await expect(page.locator(".post-meta")).toContainText("All 9 parts published · 28 interactive workflows");
  expect(series.parts.map(p => p.slug)).toEqual(posts.filter(p => p.series).map(p => p.slug));
  await expect(page.locator(".series-list li")).toHaveCount(9);
  await expect(page.locator(".series-list img")).toHaveCount(9);
  expect(new Set(posts.filter(p => p.series).map(p => p.cover)).size).toBe(9);
  for (const img of await page.locator(".series-list img").all()) {
    await img.scrollIntoViewIfNeeded();
    expect(await img.evaluate(n => n.complete && n.naturalWidth === 1200 && n.naturalHeight === 630)).toBe(true);
  }
  const evidence = await (await page.request.get("/hk-775/blog/evidence/renewal-series.json")).json();
  expect(evidence.status).toBe("passed");
  expect([...new Set(evidence.checks.map(c => c.part))]).toEqual([2,3,4,5,6,7,8,9]);
  expect(evidence.checks.every(c => c.passed)).toBe(true);
  expect(evidence.provenance.capture_script_sha256).toBe(createHash("sha256")
    .update(readFileSync(new URL("../scripts/capture-renewal-series.mjs", import.meta.url))).digest("hex"));
  expect(JSON.stringify(evidence)).not.toMatch(/csrf|cookie|buyer@|cus_|CTR-|Maya Chen|Sam Taylor|Robin Morgan/i);
});

for (const post of additions) test(`Part ${post.seriesPart}: decisions, motion, accessible exports and reading links`, async ({ page, baseURL }) => {
  const errors = [], external = [], sockets = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", r => { if (!r.url().startsWith(baseURL + "/")) external.push(r.url()); });
  page.on("websocket", s => sockets.push(s.url()));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/hk-775/blog/${post.slug}.html`);
  await expect(page.locator("h1")).toHaveText(post.title);
  await expect(page.locator(".renewal-explorer")).toHaveCount(3);
  const previous = series.parts[post.seriesPart - 2], next = series.parts[post.seriesPart];
  await expect(page.locator('a[rel="prev"]')).toHaveAttribute("href", `${previous.slug}.html`);
  if (next) await expect(page.locator('a[rel="next"]')).toHaveAttribute("href", `${next.slug}.html`);
  else await expect(page.locator('a[rel="next"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `https://hk-775.github.io/hk-775/${post.cover}`);

  for (const key of Object.values(post.interactiveDiagrams)) {
    const spec = explorers[key], figure = page.locator(`[data-renewal="${key}"]`);
    await figure.scrollIntoViewIfNeeded();
    for (const [i, scenario] of spec.scenarios.entries()) {
      await figure.locator(`[data-scenario="${i}"]`).press("Enter");
      await expect(figure.locator("[data-result-title]")).toHaveText(scenario.title);
      await expect(figure.locator("[data-result-detail]")).toHaveText(scenario.detail);
      await expect(figure.locator(`[data-scenario="${i}"]`)).toHaveAttribute("aria-pressed", "true");
      const active = await figure.locator('.landscape [data-node][data-active="true"]')
        .evaluateAll(nodes => nodes.map(n => n.dataset.node));
      expect(active.sort()).toEqual([...scenario.nodes].sort());
      const edges = await figure.locator('.landscape [data-edge][data-active="true"]')
        .evaluateAll(nodes => nodes.map(n => Number(n.dataset.edge)));
      expect(edges.sort((a,b) => a-b)).toEqual([...scenario.edges].sort((a,b) => a-b));
    }
    await figure.locator('[data-scenario="0"]').click();
    await figure.scrollIntoViewIfNeeded();
    const svg = figure.locator(".landscape");
    // Every node is one meaningful box: the rejected decorative bars stay gone.
    const geometryErrors = await svg.locator("[data-node]").evaluateAll(nodes => nodes.flatMap(n => {
      const box = n.querySelector("rect").getBBox();
      return [...n.querySelectorAll("text")].filter(t => {
        const b = t.getBBox();
        return b.x < box.x + 8 || b.x + b.width > box.x + box.width - 8 || b.y < box.y || b.y + b.height > box.y + box.height;
      }).map(t => t.textContent).concat(n.querySelectorAll("rect").length === 1 ? [] : ["extra rectangle"]);
    }));
    expect(geometryErrors, key).toEqual([]);
    const dot = svg.locator('[data-dot][data-active="true"]').first();
    const path = svg.locator('[data-edge][data-active="true"]').first();
    await expect(dot).toBeVisible();
    await expect(figure).toHaveAttribute("data-motion", "running");
    const before = await position(dot), dash = await path.evaluate(n => getComputedStyle(n).strokeDashoffset);
    await expect.poll(() => position(dot)).not.toEqual(before);
    await expect.poll(() => path.evaluate(n => getComputedStyle(n).strokeDashoffset)).not.toBe(dash);
    await figure.getByRole("button", { name: "Pause animation", exact: true }).click();
    await expect.poll(() => svg.evaluate(n => n.animationsPaused())).toBe(true);
    const frozen = await position(dot);
    await page.waitForTimeout(100);
    expect(await position(dot)).toEqual(frozen);
    await figure.screenshot({ path: `/tmp/renewal-${key}-desktop.png` });

    for (const href of await figure.locator(".renewal-downloads a").evaluateAll(nodes => nodes.map(n => n.href))) {
      const response = await page.request.get(href);
      expect(response.status()).toBe(200);
      const bytes = await response.body();
      if (href.endsWith(".png")) expect(bytes.readUInt32BE(16)).toBe(layout(key).width * 2);
      if (href.endsWith(".drawio")) expect(bytes.toString()).toContain("<mxGraphModel");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await figure.scrollIntoViewIfNeeded();
    await expect(svg).toBeHidden();
    await expect(figure.locator(".portrait")).toBeVisible();
    await figure.getByRole("button", { name: "Play animation", exact: true }).click();
    const mobileDot = figure.locator('.portrait [data-dot][data-active="true"]').first();
    const mobileBefore = await position(mobileDot);
    await expect.poll(() => position(mobileDot)).not.toEqual(mobileBefore);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(figure.getByRole("button", { name: "Animation off", exact: true })).toBeDisabled();
    await expect(figure).toHaveAttribute("data-motion", "paused");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await figure.screenshot({ path: `/tmp/renewal-${key}-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  for (const href of await page.locator('a[href]').evaluateAll(nodes => [...new Set(nodes.map(n => n.href))])) {
    if (href.startsWith(baseURL + "/")) expect((await page.request.get(href.split("#")[0])).status(), href).toBe(200);
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(sockets).toEqual([]);
});

test("all new figures explain their static state without JavaScript at 320px", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  try {
    const page = await context.newPage();
    for (const post of additions) {
      await page.goto(`${baseURL}/hk-775/blog/${post.slug}.html`);
      for (const figure of await page.locator(".renewal-explorer").all()) {
        await expect(figure.locator(".renewal-fallback")).toBeVisible();
        await expect(figure.locator(".renewal-toolbar")).toBeHidden();
        await expect(figure.locator(".renewal-interaction")).toBeHidden();
        await expect(figure.locator(".portrait")).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally { await context.close(); }
});

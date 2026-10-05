import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const posts = JSON.parse(readFileSync(new URL("../blog/posts.json", import.meta.url), "utf8"))
  .sort((left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug));
const latest = posts[0];
const article = `/hk-775/blog/${latest.slug}.html`;
const publicBase = "https://hk-775.github.io/hk-775/";

test("profile leads to a readable article with local assets and working section links", async ({ page, baseURL }) => {
  const failures = [], external = [], sockets = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => failures.push(request.url()));
  page.on("response", response => { if (response.status() >= 400) failures.push(response.url()); });
  page.on("websocket", socket => sockets.push(socket.url()));
  page.on("request", request => { if (!request.url().startsWith(baseURL + "/")) external.push(request.url()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/hk-775/");
  await page.getByRole("link", { name: "Blog", exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Engineering decisions,with evidence.");
  await expect(page.locator(".post-card")).toHaveCount(posts.length);
  await expect(page.locator(".post-card").first().getByRole("heading")).toContainText(latest.title);
  await page.screenshot({ path: "/tmp/engineering-blog-desktop.png", fullPage: true });
  await page.locator(".post-card").first().getByRole("link", { name: "Read the article →", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(article + "$"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(latest.title);
  await expect(page.locator(".prose")).toContainText("synthetic");
  for (const image of await page.locator(".article-figure img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    expect(await image.getAttribute("src")).toMatch(/^diagrams\/[a-z0-9-]+\.(svg|png)$/);
    expect(await image.getAttribute("alt")).not.toBe("");
  }
  for (const href of await page.locator('.article-aside nav a').evaluateAll(links => links.map(link => link.getAttribute("href")))) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  const lastSection = page.locator(".article-aside nav a").last();
  const targetSection = await lastSection.getAttribute("href");
  await lastSection.click();
  await expect(page.locator(targetSection)).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "/tmp/engineering-article-top.png" });
  await page.screenshot({ path: "/tmp/engineering-article-desktop.png", fullPage: true });
  const hrefs = await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(link => link.href))]);
  for (const href of hrefs.filter(href => href.startsWith(baseURL + "/"))) {
    const response = await page.request.get(href.split("#")[0]);
    expect(response.status(), href).toBe(200);
  }
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(sockets).toEqual([]);
});

for (const post of posts) test(`published resources resolve for ${post.slug}`, async ({ page }) => {
  await page.goto(`/hk-775/blog/${post.slug}.html`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", publicBase + `blog/${post.slug}.html`);
  await expect(page.locator("h1")).toHaveText(post.title);
  const structured = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(structured["@type"]).toBe("BlogPosting");
  expect(structured.author.name).toBe("Harleen Kaur");
  expect(structured.datePublished).toBe(post.date);
  const feed = await page.request.get("/hk-775/blog/feed.xml");
  expect(feed.status()).toBe(200);
  const xml = await feed.text();
  const feedData = await page.evaluate(text => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    return { errors: doc.querySelectorAll("parsererror").length,
      urls: [...doc.querySelectorAll("item > link")].map(item => item.textContent) };
  }, xml);
  expect(feedData.errors).toBe(0);
  expect(feedData.urls).toEqual(posts.map(item => `${publicBase}blog/${item.slug}.html`));
  expect(feedData.urls).toContain(structured.url);
  for (const url of feedData.urls)
    expect((await page.request.get(url.replace(publicBase, "/hk-775/"))).status()).toBe(200);
  const markdown = await (await page.request.get(`/hk-775/blog/${post.slug}.md`)).text();
  expect(markdown).toContain("Source SHA-256:");
  expect(markdown).toContain(post.source);
  const sitemap = await (await page.request.get("/hk-775/sitemap.xml")).text();
  expect(sitemap).toContain(`<loc>${structured.url}</loc>`);
  expect(sitemap).toContain(`<loc>${publicBase}blog/</loc>`);
  const image = await page.request.get("/hk-775/blog/share.png");
  expect(image.status()).toBe(200);
  const imageBytes = await image.body();
  expect(imageBytes.readUInt32BE(16)).toBe(1200);
  expect(imageBytes.readUInt32BE(20)).toBe(630);
  for (const asset of post.assets ?? []) {
    const response = await page.request.get(`/hk-775/${asset}`);
    expect(response.status(), asset).toBe(200);
    if (asset.endsWith(".svg")) {
      expect(response.headers()["content-type"]).toContain("image/svg+xml");
      expect(await response.text()).not.toMatch(/<script\b|<foreignObject\b|(?:xlink:)?href="https?:/i);
    }
  }
});

test("blog works without JavaScript and at mobile widths", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    // Absolute URLs inherit the configured server origin through the test fixture.
    const origin = test.info().project.use.baseURL;
    await page.goto(origin + "/hk-775/blog/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: "/tmp/engineering-blog-mobile.png", fullPage: true });
    await page.locator(".post-card").first().getByRole("link", { name: "Read the article →", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(latest.title);
    for (const post of posts) {
      await page.goto(`${origin}/hk-775/blog/${post.slug}.html`);
      await expect(page.locator(".prose")).toBeVisible();
      for (const image of await page.locator(".article-figure img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `/tmp/${post.slug}-mobile.png`, fullPage: true });
      await page.screenshot({ path: `/tmp/${post.slug}-mobile-top.png` });
      await page.setViewportSize({ width: 320, height: 700 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".article-aside")).toBeHidden();
    await expect(page.locator(".prose")).toBeVisible();
  } finally {
    await context.close();
  }
});

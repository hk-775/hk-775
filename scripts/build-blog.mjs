import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Marked, Renderer } from "marked";

export const blogBase = "https://hk-775.github.io/hk-775/blog/";
const portfolio = "https://hk-775.github.io/hk-775/";
const repository = "https://github.com/hk-775/hk-775";
const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const json = value => JSON.stringify(value).replaceAll("<", "\\u003c");
const dateLabel = date => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${date}T00:00:00Z`));

export async function loadPosts(root) {
  const posts = JSON.parse(await readFile(resolve(root, "blog/posts.json"), "utf8"));
  if (!Array.isArray(posts) || !posts.length) throw new Error("The blog needs an explicit article manifest");
  const slugs = new Set();
  const sources = new Set();
  for (const post of posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug))
      throw new Error(`Invalid or duplicate article slug: ${post.slug}`);
    if (!/^blog\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(post.source) || sources.has(post.source))
      throw new Error(`Invalid or duplicate article source: ${post.source}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)
      || new Date(post.date).toISOString().slice(0, 10) !== post.date)
      throw new Error(`Invalid article date: ${post.date}`);
    for (const key of ["title", "subtitle", "description", "evidence"])
      if (typeof post[key] !== "string" || !post[key].trim()) throw new Error(`Missing article ${key}`);
    if (!Array.isArray(post.topics) || !post.topics.length
      || !post.topics.every(topic => typeof topic === "string" && topic.trim()))
      throw new Error("Article topics must be nonempty strings");
    post.assets ??= [];
    if (!Array.isArray(post.assets) || !post.assets.every(asset =>
      /^blog\/diagrams\/[a-z0-9-]+\.(?:svg|png|drawio)$/.test(asset)))
      throw new Error("Article assets must be explicitly listed local diagram files");
    for (const asset of post.assets) await access(resolve(root, "site", asset));
    slugs.add(post.slug);
    sources.add(post.source);
    post.markdown = await readFile(resolve(root, post.source), "utf8");
    post.minutes = Math.max(1, Math.ceil(post.markdown.split(/\s+/).length / 220));
    post.url = `${blogBase}${post.slug}.html`;
  }
  return posts.sort((left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug));
}

function header() {
  return `<a class="skip" href="#main">Skip to content</a>
  <header class="shell header">
    <a class="identity" href="../" aria-label="Harleen Kaur home"><span class="monogram">HK</span> Harleen Kaur</a>
    <nav aria-label="Main navigation"><a href="../">Portfolio</a><a href="./" aria-current="page">Blog</a><a href="../#inspect">Code &amp; evidence</a><a href="https://www.linkedin.com/in/harleenkaurprofile">Contact</a></nav>
  </header>`;
}

function footer() {
  return `<footer class="shell"><span>Harleen Kaur · Engineering notes</span>
  <a href="feed.xml">RSS feed</a><a href="https://github.com/hk-775">GitHub ↗</a>
  <a href="../">Portfolio</a><span>Original writing &amp; site code · MIT-0</span></footer>`;
}

function page({ title, description, url, type = "website", metadata, body, markdown }) {
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} · Harleen Kaur</title>
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#0D1B2A">
  <link rel="canonical" href="${escape(url)}">
  <link rel="alternate" type="application/rss+xml" title="Harleen Kaur — Engineering notes" href="feed.xml">
  <link rel="alternate" type="text/markdown" href="${escape(markdown)}">
  <link rel="stylesheet" href="../styles.css?v=blog-1">
  <link rel="stylesheet" href="blog.css?v=1">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${escape(url)}">
  <meta property="og:image" content="${blogBase}share.png">
  <meta property="og:image:alt" content="Harleen Kaur — Engineering notes. Decisions, experiments, and evidence for AI workloads.">
  <meta name="twitter:card" content="summary_large_image">
${type === "article" ? `  <meta property="article:published_time" content="${metadata.datePublished}">\n  <meta property="article:author" content="${portfolio}">` : ""}
  <script type="application/ld+json">${json(metadata)}</script>
</head><body class="blog-page">
${header()}
${body}
${footer()}
</body></html>
`;
}

const metaLine = post => `<p class="post-meta"><time datetime="${post.date}">${dateLabel(post.date)}</time><span>${post.minutes} min read</span><span>${escape(post.evidence)}</span></p>`;

function renderArticle(post) {
  const headings = [];
  const used = new Map();
  const renderer = new Renderer();
  function assetHref(href) {
    if (!href.startsWith("../site/")) return null;
    const asset = href.slice("../site/".length);
    if (!post.assets.includes(asset)) throw new Error(`Unlisted article asset: ${asset}`);
    return asset.slice("blog/".length);
  }
  renderer.heading = function ({ tokens, depth, text }) {
    if (depth < 2) throw new Error("Article headings start at level 2; metadata supplies the title");
    const plain = text.replace(/[`*_]/g, "");
    const stem = plain.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
    const count = (used.get(stem) || 0) + 1;
    used.set(stem, count);
    const id = count === 1 ? stem : `${stem}-${count}`;
    if (depth === 2) headings.push({ id, text: plain });
    return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  };
  renderer.html = ({ text }) => escape(text);
  renderer.image = ({ href, text }) => {
    const local = assetHref(href);
    if (!local || !/\.(svg|png)$/.test(local))
      throw new Error("Only allowlisted local diagram images can be embedded");
    if (!text.trim()) throw new Error("Article diagrams require descriptive alt text");
    return `<figure class="article-figure"><a href="${escape(local)}" aria-label="Open full-size diagram"><img src="${escape(local)}" alt="${escape(text)}" loading="lazy" decoding="async"></a><figcaption>Open the diagram to view it at full size.</figcaption></figure>`;
  };
  renderer.paragraph = function (token) {
    if (token.tokens.length === 1 && token.tokens[0].type === "image")
      return this.parser.parseInline(token.tokens) + "\n";
    return Renderer.prototype.paragraph.call(this, token);
  };
  renderer.link = function ({ href, title, tokens }) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith("https:"))
      throw new Error(`Disallowed article link scheme: ${href}`);
    if (href.startsWith("//") || href.includes("\\") || /[\u0000-\u0020]/.test(href))
      throw new Error(`Invalid article link: ${href}`);
    return `<a href="${escape(assetHref(href) ?? href)}"${title ? ` title="${escape(title)}"` : ""}>${this.parser.parseInline(tokens)}</a>`;
  };
  renderer.table = function (token) {
    return `<p class="table-hint">Scroll the table horizontally to see every column.</p><div class="article-table" role="region" aria-label="Data table" tabindex="0">${Renderer.prototype.table.call(this, token)}</div>`;
  };
  const content = new Marked({ renderer, gfm: true }).parse(post.markdown);
  const toc = headings.map(heading => `<a href="#${heading.id}">${escape(heading.text)}</a>`).join("\n");
  return page({
    title: post.title, description: post.description, url: post.url, type: "article",
    markdown: `${post.slug}.md`,
    metadata: {
      "@context": "https://schema.org", "@type": "BlogPosting",
      headline: post.title, alternativeHeadline: post.subtitle, description: post.description,
      datePublished: post.date, dateModified: post.date, url: post.url, mainEntityOfPage: post.url,
      author: { "@type": "Person", name: "Harleen Kaur", url: portfolio },
      image: `${blogBase}share.png`, keywords: post.topics,
      isPartOf: { "@type": "Blog", name: "Engineering notes", url: blogBase },
    },
    body: `<main id="main">
  <div class="blog-banner"><div class="shell article-heading">
    <a class="back-link" href="./">← All engineering notes</a>
    <p class="eyebrow">${post.topics.map(escape).join(" · ")}</p>
    <h1>${escape(post.title)}</h1>
    <p class="article-subtitle">${escape(post.subtitle)}</p>
    ${metaLine(post)}
    <p class="byline">By Harleen Kaur</p>
  </div></div>
  <div class="shell article-layout">
    <aside class="article-aside"><nav aria-label="On this page"><span class="eyebrow">On this page</span>${toc}</nav>
      <div class="article-tools"><a href="${post.slug}.md">Read as Markdown</a><a href="${repository}/blob/main/${post.source}">View article source ↗</a><a href="feed.xml">Subscribe via RSS</a></div>
    </aside>
    <article class="prose" aria-label="${escape(post.title)}">${content}
      <div class="article-end"><strong>Follow the next experiment.</strong><p>New notes on model routing, action governance, containment, and evaluation.</p><a href="feed.xml">Subscribe via RSS →</a><a href="./">More engineering notes →</a></div>
    </article>
  </div></main>`,
  });
}

export function buildBlog(posts) {
  const generated = new Map();
  const cards = posts.map((post, index) => `<article class="post-card">
    <p class="eyebrow">${index === 0 ? "Latest article" : "Engineering note"} / ${escape(post.topics[0])}</p>
    <h2><a href="${post.slug}.html">${escape(post.title)} <span aria-hidden="true">↗</span></a></h2>
    <p class="card-subtitle">${escape(post.subtitle)}</p><p>${escape(post.description)}</p>
    ${metaLine(post)}<a class="text-link" href="${post.slug}.html">Read the article →</a>
  </article>`).join("\n");
  const projects = [
    ["01", "AxonLLM", "Model selection & provider routing", "https://github.com/hk-775/axonllm"],
    ["02", "Ostiari", "Action governance & policy enforcement", "https://github.com/hk-775/ostiari"],
    ["03", "Escape Lab", "Containment tests & observed effects", "https://github.com/hk-775/OstiariEscapeLab"],
    ["04", "Practical Eval Lab", "Application behavior & regression checks", "https://github.com/hk-775/practical-eval-lab"],
  ].map(([number, name, focus, href]) => `<a href="${href}"><span class="number">${number}</span><div><strong>${name}</strong><small>${escape(focus)}</small></div><span aria-hidden="true">↗</span></a>`).join("\n");
  generated.set("blog/index.html", page({
    title: "Engineering notes", description: "Engineering decisions, experiments, and evidence for AI workloads. Writing by Harleen Kaur.",
    url: blogBase, markdown: "index.md",
    metadata: {
      "@context": "https://schema.org", "@type": "Blog",
      name: "Engineering notes", url: blogBase,
      author: { "@type": "Person", name: "Harleen Kaur", url: portfolio },
      blogPost: posts.map(post => ({ "@type": "BlogPosting", headline: post.title, url: post.url, datePublished: post.date })),
    },
    body: `<main id="main">
  <div class="blog-banner"><section class="shell blog-intro">
    <p class="eyebrow"><span class="dot"></span> Engineering notes / Harleen Kaur</p>
    <h1>Engineering decisions,<br><em>with evidence.</em></h1>
    <p class="intro">I write about building AI workloads: choosing models, governing actions, testing boundaries, and measuring what actually happened.</p>
    <div class="blog-intro-links"><a href="#articles">Read the latest article ↓</a><a href="feed.xml">Subscribe via RSS ↗</a></div>
  </section></div>
  <section id="articles" class="shell blog-articles" aria-label="Articles">${cards}
    <aside class="editorial-note"><p class="eyebrow">How I approach the work</p><h2>Question.<br>Implementation.<br>Evidence.</h2><p>I connect design choices to executable examples and measured outcomes. Each experiment states its scope and limitations.</p><p>Synthetic evaluations are labeled explicitly. Production claims require separate, shareable evidence.</p><a href="../#watch">Start with the portfolio workflow →</a></aside>
  </section>
  <section class="shell blog-projects" aria-labelledby="projects-heading"><p class="eyebrow">One body of work</p><h2 id="projects-heading">Four questions. Connected engineering.</h2><div class="project-strip">${projects}</div><p class="portfolio-loop">Route → govern → test containment → evaluate behavior → refine.</p></section>
  </main>`,
  }));
  for (const post of posts) generated.set(`blog/${post.slug}.html`, renderArticle(post));
  generated.set("blog/feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Harleen Kaur — Engineering notes</title><link>${blogBase}</link>
<description>Engineering decisions, experiments, and evidence for AI workloads.</description>
<language>en</language><atom:link href="${blogBase}feed.xml" rel="self" type="application/rss+xml"/>
${posts.map(post => `<item><title>${escape(post.title)}</title><link>${post.url}</link><guid isPermaLink="true">${post.url}</guid><pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate><description>${escape(post.description)}</description>${post.topics.map(topic => `<category>${escape(topic)}</category>`).join("")}</item>`).join("\n")}
</channel></rss>
`);
  return generated;
}

import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Marked, Renderer } from "marked";
import { explorers } from "../site/blog/renewal-explorer-data.js";
import { explorerHTML, diagramSVG } from "./renewal-artwork.mjs";

export const blogBase = "https://hk-775.github.io/hk-775/blog/";
const portfolio = "https://hk-775.github.io/hk-775/";
const repository = "https://github.com/hk-775/hk-775";
const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const json = value => JSON.stringify(value).replaceAll("<", "\\u003c");
const dateLabel = date => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${date}T00:00:00Z`));
export const comparePosts = (left, right) => right.date.localeCompare(left.date)
  || (left.series ?? left.slug).localeCompare(right.series ?? right.slug)
  || (left.series && left.series === right.series ? left.seriesPart - right.seriesPart : 0)
  || left.slug.localeCompare(right.slug);

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
    if (post.series && (!Number.isInteger(post.seriesPart) || post.seriesPart < 1))
      throw new Error("Series articles require an explicit positive part number");
    post.assets ??= [];
    if (!Array.isArray(post.assets) || !post.assets.every(asset =>
      /^blog\/diagrams\/[a-z0-9-]+\.(?:svg|png|drawio)$/.test(asset)))
      throw new Error("Article assets must be explicitly listed local diagram files");
    for (const asset of post.assets) await access(resolve(root, "site", asset));
    if (post.cover && (!post.assets.includes(post.cover) || !post.cover.endsWith(".png") || !post.coverAlt?.trim()))
      throw new Error("An article cover requires an allowlisted PNG and descriptive alt text");
    post.interactiveDiagrams ??= {};
    if (typeof post.interactiveDiagrams !== "object" || Array.isArray(post.interactiveDiagrams))
      throw new Error("Interactive diagrams must map reviewed assets to known explorers");
    const explorerKeys = new Set();
    for (const [asset, key] of Object.entries(post.interactiveDiagrams)) {
      if (!Object.hasOwn(explorers, key) || explorerKeys.has(key)
        || asset !== `blog/diagrams/renewal-${key}.svg` || !post.assets.includes(asset))
        throw new Error(`Invalid interactive diagram: ${asset}`);
      explorerKeys.add(key);
      if (await readFile(resolve(root, "site", asset), "utf8") !== diagramSVG(key) + "\n")
        throw new Error(`Stale interactive artwork: ${asset}`);
    }
    post.animatedDiagrams ??= {};
    post.diagramMotionStyle ??= "dashes";
    if (!["dashes", "dots"].includes(post.diagramMotionStyle))
      throw new Error("Diagram motion style must be dashes or dots");
    if (typeof post.animatedDiagrams !== "object" || Array.isArray(post.animatedDiagrams))
      throw new Error("Animated diagrams must map reviewed SVG assets to named flow cells");
    post.inlineDiagrams = new Map();
    for (const [asset, flows] of Object.entries(post.animatedDiagrams)) {
      if (!post.assets.includes(asset) || !asset.endsWith(".svg"))
        throw new Error(`Unlisted animated diagram: ${asset}`);
      const source = await readFile(resolve(root, "site", asset), "utf8");
      // Only reviewed native drawing markup is embedded. Draw.io's editable
      // metadata stays in the downloadable source rather than the article DOM.
      let svg = source.match(/<svg\b[\s\S]*<\/svg>/)?.[0].replace(/\scontent="[^"]*"/, "");
      if (!svg || /<(?:script|foreignObject|image|use|iframe|object|style)\b|\son[a-z]+\s*=|\b(?:xlink:)?href\s*=|url\s*\(/i.test(svg))
        throw new Error(`Animated diagrams require native SVG without active or external content: ${asset}`);
      const cells = new Set();
      for (const [kind, ids] of Object.entries(flows)) {
        if (!["action", "evidence", "stage"].includes(kind) || !Array.isArray(ids) || !ids.length)
          throw new Error(`Invalid flow definition: ${asset}`);
        for (const id of ids) {
          const marker = `data-cell-id="${id}"`;
          if (!/^[a-z0-9-]+$/.test(id) || cells.has(id) || !svg.includes(marker))
            throw new Error(`Missing or duplicate diagram cell: ${id}`);
          cells.add(id);
          svg = svg.replace(marker, `${marker} data-flow="${kind}"`);
        }
      }
      if (!cells.size) throw new Error(`Animated diagram has no flow cells: ${asset}`);
      post.inlineDiagrams.set(asset, svg);
    }
    slugs.add(post.slug);
    sources.add(post.source);
    post.markdown = await readFile(resolve(root, post.source), "utf8");
    post.minutes = Math.max(1, Math.ceil(post.markdown.split(/\s+/).length / 220));
    post.url = `${blogBase}${post.slug}.html`;
  }
  return posts.sort(comparePosts);
}

export async function loadSeries(root, posts) {
  const series = JSON.parse(await readFile(resolve(root, "blog/series.json"), "utf8"));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(series.slug) || posts.some(p => p.slug === series.slug)
    || !series.title?.trim() || !series.description?.trim() || !Array.isArray(series.parts) || !series.parts.length)
    throw new Error("Invalid series manifest");
  const listed = new Set();
  for (const [i, part] of series.parts.entries()) {
    if (part.number !== i + 1 || !part.title?.trim() || !part.description?.trim()) throw new Error("Invalid series part");
    if (part.slug) {
      const post = posts.find(p => p.slug === part.slug);
      if (!post || post.series !== series.slug || post.seriesPart !== part.number || listed.has(part.slug)) throw new Error("Series links must resolve to a unique published article in the declared order");
      listed.add(part.slug);
    }
  }
  if (posts.some(p => p.series && (p.series !== series.slug || !listed.has(p.slug)))) throw new Error("Unlisted series article");
  return series;
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

function page({ title, description, url, type = "website", metadata, body, markdown, diagramMotion = false, renewal = false,
  cover = "share.png", coverAlt = "Harleen Kaur — Engineering notes. Decisions, experiments, and evidence for AI workloads." }) {
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
  <link rel="stylesheet" href="blog.css?v=3">
${diagramMotion ? '  <script src="diagram-motion.js?v=2" defer></script>' : ""}
${renewal ? '  <link rel="stylesheet" href="renewal-explorers.css?v=2">\n  <script type="module" src="renewal-explorers.js?v=2"></script>' : ""}
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${escape(url)}">
  <meta property="og:image" content="${blogBase}${escape(cover)}">
  <meta property="og:image:alt" content="${escape(coverAlt)}">
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

function renderArticle(post, series) {
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
    const interactive = post.interactiveDiagrams[href.slice("../site/".length)];
    if (interactive) return explorerHTML(interactive);
    const diagram = post.inlineDiagrams.get(href.slice("../site/".length));
    if (diagram) {
      const svg = diagram.replace("<svg ", `<svg role="img" aria-label="${escape(text)}" `);
      return `<figure class="article-figure animated-diagram" data-diagram-motion data-diagram-style="${post.diagramMotionStyle}" data-motion="paused">
  <div class="diagram-controls" hidden><button type="button" data-diagram-toggle>Play animation</button><button type="button" data-diagram-expand>Expand diagram</button><span class="diagram-motion-note"></span></div>
  <div class="diagram-canvas">${svg}</div>
  <figcaption>Illustrative flow animation; movement does not represent measured execution timing.</figcaption>
</figure>`;
    }
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
  const partIndex = series.parts.findIndex(p => p.slug === post.slug);
  const previous = series.parts[partIndex - 1], next = series.parts[partIndex + 1];
  const readingNav = post.series ? `<nav class="series-reading-nav" aria-label="Continue the series">
    ${previous?.slug ? `<a rel="prev" href="${previous.slug}.html"><small>← Part ${previous.number}</small>${escape(previous.title)}</a>` : `<a href="${series.slug}.html"><small>All nine parts</small>Explore the complete series</a>`}
    ${next?.slug ? `<a rel="next" href="${next.slug}.html"><small>Part ${next.number} →</small>${escape(next.title)}</a>` : `<a href="${series.parts[0].slug}.html"><small>Return to Part 1 →</small>The Standard Renewal, End to End</a>`}
  </nav>` : "";
  return page({
    title: post.title, description: post.description, url: post.url, type: "article",
    markdown: `${post.slug}.md`,
    diagramMotion: post.inlineDiagrams.size > 0,
    renewal: Boolean(post.series) || Object.keys(post.interactiveDiagrams).length > 0,
    ...(post.cover ? { cover: post.cover.slice("blog/".length), coverAlt: post.coverAlt } : {}),
    metadata: {
      "@context": "https://schema.org", "@type": "BlogPosting",
      headline: post.title, alternativeHeadline: post.subtitle, description: post.description,
      datePublished: post.date, dateModified: post.date, url: post.url, mainEntityOfPage: post.url,
      author: { "@type": "Person", name: "Harleen Kaur", url: portfolio },
      image: `${blogBase}${post.cover?.slice("blog/".length) ?? "share.png"}`, keywords: post.topics,
      isPartOf: post.series
        ? { "@type": "CollectionPage", name: series.title, url: `${blogBase}${series.slug}.html` }
        : { "@type": "Blog", name: "Engineering notes", url: blogBase },
      ...(post.series ? { position: post.seriesPart } : {}),
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
    <article class="prose" aria-label="${escape(post.title)}">${post.series ? `<div class="series-callout"><strong>Part ${post.seriesPart} of ${series.parts.length} · Renewal Studio</strong><p>${escape(series.title)}</p><a href="${series.slug}.html">Explore the series and reading order →</a>${next?.slug ? ` · <a href="${next.slug}.html">Next: Part ${next.number} →</a>` : ""}</div>` : ""}${content}${readingNav}
      <div class="article-end"><strong>Follow the next experiment.</strong><p>New notes on model routing, action governance, containment, and evaluation.</p><a href="feed.xml">Subscribe via RSS →</a><a href="./">More engineering notes →</a></div>
    </article>
  </div></main>`,
  });
}

export function buildBlog(posts, series) {
  const generated = new Map();
  const published = series.parts.filter(p => p.slug);
  const figureCount = posts.filter(p => p.series === series.slug).reduce((n, p) => n + Object.keys(p.interactiveDiagrams).length, 0);
  const complete = published.length === series.parts.length;
  const status = complete ? `All ${published.length} parts published · ${figureCount} interactive workflows`
    : `${published.length} parts available · ${series.parts.length - published.length} planned`;
  const cards = posts.map((post, index) => `<article class="post-card">
    <p class="eyebrow">${post.series ? `Series / Part ${post.seriesPart} of ${series.parts.length}` : index === 0 ? "Latest article" : "Engineering note"} / ${escape(post.topics[0])}</p>
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
    renewal: true,
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
    <aside class="editorial-note"><p class="eyebrow">${complete ? "Complete series" : "Engineering series"}</p><h2>Renewal Studio</h2><p>Software and API contract renewals, one workflow at a time. ${escape(status)}.</p><a href="${series.slug}.html">See the series reading order →</a><p>Synthetic examples are labeled explicitly. Each article connects decisions to implementation and evidence.</p></aside>
  </section>
  <section class="shell blog-projects" aria-labelledby="projects-heading"><p class="eyebrow">One body of work</p><h2 id="projects-heading">Four questions. Connected engineering.</h2><div class="project-strip">${projects}</div><p class="portfolio-loop">Route → govern → test containment → evaluate behavior → refine.</p></section>
  </main>`,
  }));
  for (const post of posts) generated.set(`blog/${post.slug}.html`, renderArticle(post, series));
  generated.set(`blog/${series.slug}.html`, page({
    title: series.title, description: series.description, url: `${blogBase}${series.slug}.html`,
    markdown: `${series.slug}.md`, renewal: true,
    cover: "diagrams/renewal-series-cover.png",
    coverAlt: "Renewal Studio: Build the renewal system. Follow every decision. Nine parts and 28 interactive workflows.",
    metadata: {
      "@context": "https://schema.org", "@type": "CollectionPage",
      name: series.title, description: series.description, url: `${blogBase}${series.slug}.html`,
      author: { "@type": "Person", name: "Harleen Kaur", url: portfolio },
      hasPart: series.parts.filter(p => p.slug).map(p => ({ "@type": "BlogPosting", name: p.title, url: `${blogBase}${p.slug}.html` })),
    },
    body: `<main id="main"><div class="blog-banner"><section class="shell article-heading">
      <a class="back-link" href="./">← All engineering notes</a><p class="eyebrow">Renewal Studio / An engineering series</p>
      <h1>Build the renewal system.<br>Follow every decision.</h1><p class="article-subtitle">${escape(series.title)}</p>
      <p class="post-meta">By Harleen Kaur · ${escape(status)}</p>
    </section></div><section class="shell series-layout" aria-label="Series reading order">
      <p class="series-lead">A customer accepts. Billing updates. Access fails. What should happen next? Start with a standard renewal, then follow the decisions that connect retention, finance, agents and operations.</p>
      <div class="series-callout"><strong>Explore the diagrams. Then try the application.</strong><p>${figureCount} interactive workflows include scenario choices, moving connectors, solid traveling dots and SVG, PNG and editable draw.io downloads. The browser figures are local teaching examples; the linked application runs with synthetic data and simulated providers.</p><a href="${series.parts[0].slug}.html">Start with Part 1 →</a></div>
      <ol class="series-list">${series.parts.map(p => {
        const post = posts.find(post => post.slug === p.slug);
        return `<li>${post?.cover ? `<a class="series-cover" href="${p.slug}.html" tabindex="-1" aria-hidden="true"><img src="${post.cover.slice(5)}" width="1200" height="630" alt="" loading="lazy" decoding="async"></a>` : ""}<p class="eyebrow">Part ${p.number} · ${p.slug ? "Available now" : "Planned"}${post ? ` · ${post.minutes} min read` : ""}</p><h2>${p.slug ? `<a href="${p.slug}.html">${escape(p.title)} ↗</a>` : escape(p.title)}</h2><p>${escape(p.description)}</p>${p.slug ? `<a href="${p.slug}.html">Read and explore →</a>` : ""}</li>`;
      }).join("")}</ol>
      <p>Read in order or start with a workflow relevant to your work. Each installment distinguishes implemented behavior, synthetic observations and the additional evidence a production pilot needs.</p>
      <div class="series-links"><a href="https://d11wfkflwovvog.cloudfront.net/demos">Open the Renewal Studio demo ↗</a><a href="feed.xml">Subscribe to engineering notes →</a><a href="${series.slug}.md">Read this index as Markdown</a></div>
    </section></main>`,
  }));
  generated.set(`blog/${series.slug}.md`, `# ${series.title}\n\n${series.description}\n\n${status}. Every figure has static and editable downloads; scenarios run locally without API or model calls.\n\n${series.parts.map(p => `## Part ${p.number}: ${p.title}\n\n${p.description}\n\n${p.slug ? `[Read the article](${blogBase}${p.slug}.html)` : "Status: planned; not yet published."}`).join("\n\n")}\n\n[Renewal Studio demo](https://d11wfkflwovvog.cloudfront.net/demos) · [RSS](${blogBase}feed.xml)\n\nSource: [series.json](${repository}/blob/main/blog/series.json)\n`);
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

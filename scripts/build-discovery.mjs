import { createHash } from "node:crypto";
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { dirname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPosts, buildBlog, blogBase } from "./build-blog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://hk-775.github.io/hk-775/";
const repo = "https://github.com/hk-775/hk-775";
const linkedin = "https://www.linkedin.com/in/harleenkaurprofile";
const check = process.argv.includes("--check");
const posts = await loadPosts(root);
const sources = new Map([
  ["README.md", "index.md"],
  ["CASE_STUDY.md", "case-study.md"],
  ["DECISIONS.md", "decisions.md"],
  ["examples/customer-summary/README.md", "run-example.md"],
  ["AGENTS.md", "coding-agents.md"],
  ["blog/README.md", "blog/index.md"],
  ...posts.map(post => [post.source, `blog/${post.slug}.md`]),
]);
const digestSources = [...sources.keys()].filter(name => name !== "AGENTS.md");
const generated = buildBlog(posts);
const records = [];
const hash = content => createHash("sha256").update(content).digest("hex");

async function markdownLinks(text, source) {
  let fence = null;
  const lines = [];
  for (const line of text.split("\n")) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length
        && !line.slice(marker[0].length).trim()) fence = null;
      lines.push(line);
      continue;
    }
    if (fence) {
      lines.push(line);
      continue;
    }
    let rendered = "", start = 0;
    for (const match of line.matchAll(/(!?\[[^\]]*\]\()([^\s)]+)(\))/g)) {
      const target = match[2];
      let href = target;
      if (!/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) {
        const [path, fragment] = target.split("#", 2);
        const file = posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(path)));
        if (file.startsWith("../") || file.startsWith("/")) throw new Error(`Unsafe link in ${source}: ${target}`);
        await access(resolve(root, file));
        href = sources.has(file) ? base + sources.get(file)
          : file.startsWith("site/") ? base + file.slice(5)
          : `${repo}/blob/main/${file}`;
        if (fragment) href += "#" + fragment;
      }
      rendered += line.slice(start, match.index) + match[1] + href + match[3];
      start = match.index + match[0].length;
    }
    lines.push(rendered + line.slice(start));
  }
  return lines.join("\n");
}

for (const [source, destination] of sources) {
  const original = await readFile(resolve(root, source), "utf8");
  const sha256 = hash(original);
  const text = await markdownLinks(original, source);
  const sourceUrl = `${repo}/blob/main/${source}`;
  const output = `${text.trimEnd()}\n\n---\nSource: [${source}](${sourceUrl})\n\nSource SHA-256: \`${sha256}\`\n`;
  generated.set(destination, output);
  records.push({ source, source_url: sourceUrl, source_sha256: sha256,
    markdown_url: base + destination, bytes: Buffer.byteLength(output), sha256: hash(output) });
}

const projects = [
  { name: "AxonLLM", focus: "LLM model routing and provider selection", repository: "https://github.com/hk-775/axonllm", website: "https://hk-775.github.io/axonllm/" },
  { name: "Ostiari", focus: "Agent action governance and policy enforcement", repository: "https://github.com/hk-775/ostiari", website: "https://hk-775.github.io/ostiari/" },
  { name: "Ostiari Escape Lab", focus: "Agent containment tests and inspectable evidence", repository: "https://github.com/hk-775/OstiariEscapeLab", website: "https://hk-775.github.io/OstiariEscapeLab/" },
  { name: "Practical Eval Lab", focus: "Application evaluation, transparent graders, and regression checks", repository: "https://github.com/hk-775/practical-eval-lab", website: "https://hk-775.github.io/practical-eval-lab/" },
];

generated.set("llms.txt", `# Harleen Kaur — enterprise AI engineering

> Open-source work in LLM model routing, agent governance, containment testing, and application evaluation. This portfolio links runnable examples and evidence with explicit limitations.

The featured customer-summary workflow connects AxonLLM, Ostiari, and Escape Lab through a deterministic synthetic fixture. Practical Eval Lab supplies separate application-evaluation examples. The public material supports inspection of engineering work; it does not establish production adoption, business savings, executive scope, or general safety certification.

## Start here
- [Portfolio in Markdown](${base}index.md): The four projects, their relationship, and runnable entry points.
- [Engineering case study](${base}case-study.md): The customer-summary boundary, paired results, exact source references, and limitations.
- [Engineering decisions](${base}decisions.md): Product boundaries, governance choices, and evidence practices.
- [Run the integration](${base}run-example.md): Locked installation and reproduction commands.
- [Engineering blog](${blogBase}): Articles on AI workloads, design decisions, and evaluation evidence.
${posts.map(post => `- [${post.title}](${post.url}): ${post.description}`).join("\n")}

## Evidence and context
- [Paired result data](${base}evidence/summary.json): One recorded synthetic run per control profile.
- [Combined context download](${base}agent-context.txt): ${digestSources.length} allowlisted public documents, including blog articles, with source URLs and SHA-256 fingerprints.
- [Blog RSS feed](${blogBase}feed.xml): Published engineering articles.
- [Source manifest](${base}discovery.json): Document provenance and project destinations in JSON.
- [Eval Lab agent guide](https://hk-775.github.io/practical-eval-lab/llms.txt): Six evaluation walkthroughs, contracts, and recorded results.

## Optional
- [Coding-agent instructions](${base}coding-agents.md): Setup, tests, repository map, and evidence-handling conventions.
- [Professional contact](${linkedin}): Harleen Kaur's LinkedIn profile for AI engineering opportunities and collaboration.
- [GitHub profile](https://github.com/hk-775): Repository ownership and public activity.
`);

const digest = digestSources.map(source => {
  const name = sources.get(source);
  return `===== FILE: ${source} =====\nPublished Markdown: ${base}${name}\n\n${generated.get(name)}`;
}).join("\n");
generated.set("agent-context.txt", `Harleen Kaur — public engineering context\n\nGenerated from ${digestSources.length} allowlisted public documents. Source fingerprints describe the documentation; reported experiments retain their own dates and source revisions. Follow the cited evidence when evaluating a claim.\n\n${digest}`);
generated.set("discovery.json", JSON.stringify({
  schema_version: 1, name: "Harleen Kaur", github: "https://github.com/hk-775",
  website: base, linkedin, projects, blog: blogBase, feed: `${blogBase}feed.xml`, documents: records,
}, null, 2) + "\n");
generated.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[base, blogBase, ...posts.map(post => post.url)].map(url => `<url><loc>${url}</loc></url>`).join("")}</urlset>\n`);

const structured = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": base + "#profile",
  url: base,
  name: "Harleen Kaur — AI model routing, agent governance, and evaluations",
  mainEntity: {
    "@type": "Person", "@id": base + "#harleen-kaur",
    name: "Harleen Kaur", alternateName: "hk-775",
    url: base, sameAs: ["https://github.com/hk-775", linkedin],
    description: "Builder of open-source tools for LLM model routing, agent governance, containment testing, and application evaluation.",
    knowsAbout: projects.map(project => project.focus),
  },
  about: projects.map(project => ({
    "@type": "SoftwareSourceCode", name: project.name,
    description: project.focus, codeRepository: project.repository, url: project.website,
  })),
};
const head = [
  "<!-- discovery:start -->",
  `  <link rel="canonical" href="${base}">`,
  '  <link rel="alternate" type="text/markdown" href="index.md">',
  '  <link rel="alternate" type="application/rss+xml" title="Engineering notes" href="blog/feed.xml">',
  '  <link rel="describedby" type="text/plain" href="llms.txt">',
  '  <link rel="sitemap" type="application/xml" href="sitemap.xml">',
  `  <script type="application/ld+json">${JSON.stringify(structured).replaceAll("<", "\\u003c")}</script>`,
  "  <!-- discovery:end -->",
].join("\n");
const index = await readFile(resolve(root, "site/index.html"), "utf8");
if (!index.includes("<!-- discovery:start -->")) throw new Error("Missing discovery metadata marker");
generated.set("index.html", index.replace(/<!-- discovery:start -->[\s\S]*?<!-- discovery:end -->/, head));

const stale = [];
for (const [name, text] of generated) {
  const path = resolve(root, "site", name);
  const existing = await readFile(path, "utf8").catch(() => null);
  if (existing === text) continue;
  if (check) stale.push(name);
  else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text);
  }
}
if (stale.length) throw new Error(`Run npm run discovery; outdated files: ${stale.join(", ")}`);
console.log(`${check ? "Verified" : "Generated"} ${generated.size} discovery artifacts from ${sources.size} allowlisted sources.`);

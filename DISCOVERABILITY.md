# Discovery and measurement

The public entry point is <https://hk-775.github.io/hk-775/>. The site offers
canonical HTML, a Markdown alternative, a concise `llms.txt` index, a downloadable
context bundle, and source fingerprints in `discovery.json`.

Run `npm run discovery` after changing README, case-study, decision, example, or
agent instructions, or articles listed in `blog/posts.json`.
The same command builds `/blog/`, article HTML, Markdown alternatives, and RSS.
`npm run discovery:check` in CI rejects stale generated files.
The generator uses a fixed source allowlist and does not ingest the whole checkout.
GitIngest is an optional external way to inspect the public repository; the
published context files can be fetched directly without that service.

## Google Search Console

Add a URL-prefix property for `https://hk-775.github.io/hk-775/` in Google Search
Console. A GitHub Pages project can use an HTML verification file or the HTML
meta tag that Google provides. Publish that exact verification value; do not
invent one. Keep verification in place after ownership is confirmed.

Submit `https://hk-775.github.io/hk-775/sitemap.xml`, then inspect the homepage.
Practical Eval Lab has its own prefix property and sitemap:
`https://hk-775.github.io/practical-eval-lab/sitemap.xml`.

Project sites do not control the host's root `robots.txt`. A file at
`/hk-775/robots.txt` would not set crawler access policy for `hk-775.github.io`.
The site does not use a `noindex` directive or require login to read its content.
The sitemap includes the blog and every published article. Each article has a
canonical URL, `BlogPosting` metadata, a Markdown alternative, and a source
fingerprint. `/blog/feed.xml` provides RSS without a subscription service.

## Measure the two requested goals

Record a baseline before interpreting changes:

- Search Console: impressions, clicks, queries, and average position for the name
  and relevant engineering topics. Compare 28-day periods; treat very small
  samples cautiously. No Search Console data is assumed without verified access.
- GitHub: views, clones, and referring sites. GitHub traffic is a short rolling
  window, so preserve dated aggregates privately if longer comparisons matter.
- Agent discovery: check that the public Markdown, context download, source links,
  and evidence are usable. An assistant mentioning a project in one session is
  not evidence of a universal ranking or a stable recommendation rate.
- Recruiting: record attributable, qualified conversations separately from page
  views. The repository does not claim compensation or hiring outcomes.

`llms.txt` is an agent-navigation convention, not a ranking instruction. Google's
AI-search guidance says ordinary SEO practices apply and special AI text files
are not required. Canonical URLs and structured data make identity and content
clearer; crawling, indexing, rich results, and ranking improvements are not
guaranteed.

References: [llms.txt proposal](https://llmstxt.org/),
[Google AI features](https://developers.google.com/search/docs/appearance/ai-features),
[profile-page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page),
[GitIngest](https://github.com/coderamp-labs/gitingest).

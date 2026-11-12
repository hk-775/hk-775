# Engineering notes — Harleen Kaur

I write about the engineering decisions behind AI workloads: how to select a
model, authorize an action, test containment, and measure the result. Each article
connects a concrete question to implementation, evidence, and limitations.

**[Read the blog](https://hk-775.github.io/hk-775/blog/)** ·
[RSS feed](https://hk-775.github.io/hk-775/blog/feed.xml) ·
[Portfolio](https://hk-775.github.io/hk-775/)

## Articles

- **12 November 2026 — [Renewal Studio, Part 1: The Standard Renewal, End to End](https://hk-775.github.io/hk-775/blog/renewal-studio-standard-renewal.html).**
  Four interactive workflows follow eligibility, buyer acceptance, activation and
  partial-failure recovery, with a recorded synthetic application check.
  [Markdown source](https://hk-775.github.io/hk-775/blog/renewal-studio-standard-renewal.md) ·
  [Series reading order](https://hk-775.github.io/hk-775/blog/renewal-studio.html).
- **30 October 2026 — [Improving Agents Starts with Verifying the Work](https://hk-775.github.io/hk-775/blog/improving-agents-starts-with-verifying-the-work.html).**
  A live AutoHelix experiment compares completion reports with verified outputs,
  tests scripted cheating controls, and examines whether editing the improver helps.
  [Markdown source](https://hk-775.github.io/hk-775/blog/improving-agents-starts-with-verifying-the-work.md).
- **19 October 2026 — [Your AI remembers you. Can it remember a lie?](https://hk-775.github.io/hk-775/blog/your-ai-remembers-you-can-it-remember-a-lie.html).**
  A false approval persists across sessions; four synthetic control profiles
  show why stored provenance and current authority need separate checks.
  [Markdown source](https://hk-775.github.io/hk-775/blog/your-ai-remembers-you-can-it-remember-a-lie.md).
- **8 October 2026 — [Testing subscription abuse at the action boundary](https://hk-775.github.io/hk-775/blog/testing-subscription-abuse-at-the-action-boundary.html).**
  Cancellation and refund controls, confirmed consent, paid access, and the
  difference between safe handling and completed business changes.
  [Markdown source](https://hk-775.github.io/hk-775/blog/testing-subscription-abuse-at-the-action-boundary.md).
- **5 October 2026 — [Designing an Evidence Trail for Agent Actions](https://hk-775.github.io/hk-775/blog/designing-an-evidence-trail-for-agent-actions.html).**
  Correlating requests, policy decisions, execution, and observed state; verifying
  snapshot references; and defining the limits of event hashes and replay.
  [Markdown source](https://hk-775.github.io/hk-775/blog/designing-an-evidence-trail-for-agent-actions.md).
- **2 October 2026 — [When rules beat decision models](https://hk-775.github.io/hk-775/blog/when-rules-beat-decision-models.html).**
  Lessons from an executed tool-selection evaluation: the test design, observed
  mistakes, fallback demand, and the decision the evidence supports.
  [Markdown source](https://hk-775.github.io/hk-775/blog/when-rules-beat-decision-models.md).

## One body of work

| Project | Engineering question |
| --- | --- |
| [AxonLLM](https://github.com/hk-775/axonllm) | Which model and provider should handle a request? |
| [Ostiari](https://github.com/hk-775/ostiari) | May an agent take this action under the applicable policy? |
| [Escape Lab](https://github.com/hk-775/OstiariEscapeLab) | Can a prohibited outcome occur despite the controls? |
| [Practical Eval Lab](https://github.com/hk-775/practical-eval-lab) | Did application behavior improve, and what regressed? |

Experiments identify their dataset, measured outcome, and source revision.
Synthetic evaluations stay distinct from production evidence.

## Publish another article

1. Add a Markdown file in `blog/`. Start with an opening paragraph; the page title
   comes from metadata. Use `##` headings for sections.
2. Add an entry to `posts.json` with a unique `slug`, `source`, `title`, `subtitle`,
   `description`, ISO `date`, `topics`, and a short `evidence` description.
   This manifest is the explicit publication allowlist. Unlisted drafts stay out
   of the generated site; keep confidential drafts outside this public repository.
3. Add the article to the list above and update the featured article in the
   profile README and homepage when appropriate.
4. With Node 22.23.2, run `npm ci`, `npm run discovery`, and
   `npm run discovery:check`. Run `npx playwright install chromium` and `npm test`.
5. Review the source and generated files, then open a PR. The normal Pages
   workflow verifies the change and publishes `site/` after merge to `main`.

The generator creates article pages, a blog index, a feed, Markdown mirrors,
source fingerprints, and sitemap entries. Articles need no browser JavaScript,
external fonts, analytics, model API, or backend.

## Local diagrams

List reviewed diagram files in the article's `assets` array using
`blog/diagrams/name.svg`, `.png`, and `.drawio` paths. Markdown refers to them
through `../site/blog/diagrams/name.svg`; the generator resolves those paths for
the published article. Images require descriptive alt text. Remote images are
not embedded.

For web workflow animation, add an `animatedDiagrams` entry keyed by an
allowlisted SVG asset, with `action`, `evidence`, and `stage` arrays naming
its draw.io cell IDs. The generator checks those cells and embeds the reviewed
native SVG. `site/blog/diagram-motion.js` adds moving connectors and stage
highlights, with pause/resume, full-screen viewing, and reduced-motion support.
Reading and static diagrams work without JavaScript. Downloads remain static;
animation is illustrative and does not represent measured execution timings.
Verify actual movement over time and its paused/reduced-motion behavior, not
only a screenshot or an HTTP 200.

To rebuild the evidence-workflow artwork with Node and draw.io Desktop:

```sh
node scripts/build-evidence-diagram.mjs
drawio --disable-update --export --format svg --embed-diagram \
  --embed-svg-fonts false --theme light \
  --output site/blog/diagrams/agent-action-evidence-workflow.svg \
  site/blog/diagrams/agent-action-evidence-workflow.drawio
drawio --disable-update --export --format png --scale 2 --theme light \
  --output site/blog/diagrams/agent-action-evidence-workflow.png \
  site/blog/diagrams/agent-action-evidence-workflow.drawio
npm run discovery
```

Original writing and site code use the repository's MIT-0 license. Linked
projects, model weights, and third-party dependencies retain their own licenses.

The subscription diagram uses the same native animation controls and palette.
Run `node scripts/build-subscription-diagram.mjs`, then use the export commands
above with `subscription-action-boundary` as the asset basename. Its static
companions are also distributed with the Practical Eval Lab benchmark.

The memory-authority diagram is generated by `scripts/build-memory-diagram.mjs`.
Use the same export commands with `memory-authority-boundary` as the basename.
Its article links the pinned, two-process example in `examples/memory-boundary/`.
This article selects `diagramMotionStyle: "dots"`: small solid circles follow
the reviewed paths while the underlying solid and dashed line styles stay fixed.
The diagram's controls and actual moving circles are covered by the same browser
checks as the other animated articles.

AWS services reference architecture for these static blog articles: not
applicable. The subscription article describes a local, provider-neutral
in-memory evaluation and GitHub Pages publication. It defines no AWS deployment
target or cloud resources.
The memory article likewise describes a local, provider-neutral Python fixture;
it defines no AWS production target or resources.

The agent-improvement article uses `scripts/build-reward-diagram.mjs` and the
`verified-agent-work` asset basename. Its solid moving circles use the existing
`dots` animation mode and navy/cyan/cream palette. The article cites pinned,
public RSI Engine results; the blog runs no models or candidate code. Its
diagram explains a local experiment with model inference through Bedrock,
not an AWS deployment topology. No AWS architecture or resource change is
part of this publication.

## Renewal Studio series

`series.json` defines the complete nine-part reading order. Each part resolves to
an allowlisted article with an explicit `seriesPart`. Articles published on the
same date sort in reading order. The index, previous/next navigation, Markdown
companions, RSS and sitemap are generated from these sources.

All nine parts are published on 12 November 2026:

| Part | Article | Main implemented workflows |
| --- | --- | --- |
| 1 | [The Standard Renewal, End to End](https://hk-775.github.io/hk-775/blog/renewal-studio-standard-renewal.html) | Eligibility, consent, activation and recovery |
| 2 | [When the Standard Path Ends](https://hk-775.github.io/hk-775/blog/renewal-studio-exceptions.html) | Exceptions, custom contracts, catalog/legal and strategic procurement |
| 3 | [Renewing a Commitment When Usage Changes](https://hk-775.github.io/hk-775/blog/renewal-studio-consumption.html) | Consumption evidence, risk cases and commitment deals |
| 4 | [Retention Beyond the Renewal Date](https://hk-775.github.io/hk-775/blog/renewal-studio-retention.html) | PAYG, cancellation, save and winback |
| 5 | [The Work After the Sale](https://hk-775.github.io/hk-775/blog/renewal-studio-post-sale.html) | Post-sale milestones, queues, scoped partners and conversations |
| 6 | [Follow the Money](https://hk-775.github.io/hk-775/blog/renewal-studio-finance.html) | Collections, disputes, refunds and service allocation |
| 7 | [Let Agents Work Within a Boundary](https://hk-775.github.io/hk-775/blog/renewal-studio-agents.html) | Provider-neutral plans, automation, delivery and evaluations |
| 8 | [Forecast the Business from the Work](https://hk-775.github.io/hk-775/blog/renewal-studio-forecasting.html) | Forecasts, predictions, performance and portfolio simulations |
| 9 | [From Demonstration to an Operational System](https://hk-775.github.io/hk-775/blog/renewal-studio-operations.html) | AWS topology, identity, connectors, resilience and proposed pilot |

The 28 workflow explorers use original native SVG in the existing
navy/cyan/cream palette. Part 1 has four figures; each later part has three.
Scenario text lives in `site/blog/renewal-explorer-data.js` and
`site/blog/renewal-series-data.js`; `scripts/renewal-artwork.mjs` renders it.
Each article allowlists its known explorer identifiers. Raw Markdown HTML is
still escaped. The browser never calls the application or a model.

With the locked Node dependencies and Chromium installed:

```sh
node scripts/build-renewal-artwork.mjs
node scripts/build-renewal-artwork.mjs --check
npm run discovery
npm run discovery:check
npm test
```

The artwork command produces 28 SVG, PNG and editable draw.io companions,
nine article-specific 1200×630 social covers and a complete-series cover.
Mobile uses a vertical SVG
layout. Browser checks cover real connector and dot motion, keyboard controls,
independent scenarios, recovery counters, pause, reduced motion, full screen,
no-JavaScript reading, mobile layout and local-only browser requests.

The published evidence is a small allowlist of observed synthetic outcomes,
not a workspace export. To deliberately run a new check in a fresh public-demo
session, without replacing the article's existing record:

```sh
node scripts/capture-renewal-demo.mjs --capture --output /tmp/renewal-check.json
```

Parts 2–9 have a separate replay and allowlisted observation record:

```sh
node scripts/capture-renewal-series.mjs --capture --output /tmp/renewal-series-check.json
```

The published records are immutable observations, not regenerated by CI or
presentation changes. Their script hashes identify their assertions; frontend
hashes do not identify the backend revision. The replay has no access to the
private application repository and publishes no raw workspace exports.

The complete context download includes all 14 engineering articles and remains
bounded at 210,000 characters. Readers with smaller context windows can use the
individual Markdown documents and source manifest.

For Part 9, the AWS architecture checkpoint applies: the original topology was
derived from the application's CDK definition and deployment documentation
reviewed on 12 November 2026. It includes CloudFront/WAF, private S3, the protected
Lambda API, DynamoDB, the scheduler/worker path, the scheduler-delivery SQS queue
and CloudWatch. SVG, PNG and editable draw.io companions are published. The prose
identifies supplementary logging and separates configured synthetic runtime,
public replay observations and proposed real integrations. No live account
audit, infrastructure change or application-repository visibility change is
part of this publication.

The record includes the capture-script hash and observed public frontend asset
hashes. The demo does not expose its backend revision, so these hashes do not
identify the backend build. No session tokens, account names, customer data or
private application source are published. The separate application repository
remains private; the public demo is the application entry point.

AWS architecture checkpoint: this article and its interactive illustrations
are a static GitHub Pages publication, with no AWS resources or model calls.
The linked Renewal Studio application is a separate deployment behind
CloudFront. Its AWS deployment architecture belongs to that application's
architecture materials and the later architecture installment; these four
figures describe business transitions, not a cloud topology.

---
Source: [blog/README.md](https://github.com/hk-775/hk-775/blob/main/blog/README.md)

Source SHA-256: `dea29df4b93f7d79bec721ef2ce8cf741257190d7f20940306d5c89b058a8d21`

# Engineering notes — Harleen Kaur

I write about the engineering decisions behind AI workloads: how to select a
model, authorize an action, test containment, and measure the result. Each article
connects a concrete question to implementation, evidence, and limitations.

**[Read the blog](https://hk-775.github.io/hk-775/blog/)** ·
[RSS feed](https://hk-775.github.io/hk-775/blog/feed.xml) ·
[Portfolio](https://hk-775.github.io/hk-775/)

## Articles

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

Original writing and site code use the repository's MIT-0 license. Linked
projects, model weights, and third-party dependencies retain their own licenses.

---
Source: [blog/README.md](https://github.com/hk-775/hk-775/blob/main/blog/README.md)

Source SHA-256: `1a3cdc539df0ba09c3c473f23be2d14b8eda78723cc766e00af06a9fd426b5e1`

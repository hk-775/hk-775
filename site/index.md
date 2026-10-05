# Harleen Kaur

I build open-source tools for enterprise AI: **select the model, govern the action, test the boundary, measure the change.**

For AI engineering opportunities and collaboration, [contact me on LinkedIn](https://www.linkedin.com/in/harleenkaurprofile).

My projects address complementary engineering questions. **AxonLLM selects models and provider routes. Ostiari governs agent actions. Escape Lab tests containment. Practical Eval Lab evaluates application behavior and regressions.**

Together, they support a development loop: **route → govern → test containment → evaluate behavior → refine**. Evaluation findings guide the next routing, policy, or application change.

**[Start here → one workflow, its evidence, and the code](https://hk-775.github.io/hk-775/)**

**[Engineering blog](https://hk-775.github.io/hk-775/blog/)** ·
[Latest: Designing an Evidence Trail for Agent Actions](https://hk-775.github.io/hk-775/blog/designing-an-evidence-trail-for-agent-actions.html) ·
[RSS](https://hk-775.github.io/hk-775/blog/feed.xml)

[Agent guide](https://hk-775.github.io/hk-775/llms.txt) ·
[Download public context](https://hk-775.github.io/hk-775/agent-context.txt) ·
[Read the repository with GitIngest](https://gitingest.com/hk-775/hk-775)

| Your next step | What you will find |
| --- | --- |
| **[Watch](https://hk-775.github.io/hk-775/#watch)** | A 60-second replay of a synthetic customer-summary workflow, plus a 2:13 AxonLLM operator tour. |
| **[Understand](https://hk-775.github.io/hk-775/case-study.md)** | The problem, architecture, measured outcome, and limitations. |
| **[Inspect](https://hk-775.github.io/hk-775/run-example.md)** | Exact source revisions, locked dependencies, runnable commands, and recorded evidence. |
| **[Evaluate decisions](https://hk-775.github.io/hk-775/decisions.md)** | Documented engineering scope and tradeoffs, with an explicit boundary around leadership and production claims. |
| **[Read the blog](https://hk-775.github.io/hk-775/blog/)** | Engineering questions, implementation choices, measured results, and reproducible evidence. |

### One body of work

| Project | The question it answers | Explore |
| --- | --- | --- |
| **AxonLLM** | Which model and provider should handle this request? | [Repository](https://github.com/hk-775/axonllm) · [Routing evaluation](https://hk-775.github.io/axonllm/benchmark.html) |
| **Ostiari** | May this agent take this action, under this policy? | [Repository](https://github.com/hk-775/ostiari) · [Architecture](https://hk-775.github.io/ostiari/#/architecture) |
| **Escape Lab** | Can a prohibited outcome occur despite the controls? | [Repository](https://github.com/hk-775/OstiariEscapeLab) · [Results and limitations](https://hk-775.github.io/OstiariEscapeLab/) |
| **Practical Eval Lab** | Did the application improve, and what regressed? | [Recorded evals and guides](https://hk-775.github.io/practical-eval-lab/) · [Repository and quickstart](https://github.com/hk-775/practical-eval-lab) |

The featured workflow connects AxonLLM, Ostiari, and Escape Lab. Practical Eval Lab is a separate local toolkit for choosing success criteria, comparing candidates, inspecting failures, and applying regression checks.

### Evaluate the next change

Practical Eval Lab covers classification, structured extraction, tool calling, RAG, response quality, and multi-step agents. Its tuning webpage, Python/HTTP application adapters, and saved JSON/HTML reports make individual outputs and grading decisions inspectable. Quality gates can catch a regression even when an aggregate score improves.

[Explore the evaluation workflow](https://hk-775.github.io/practical-eval-lab/). The hosted viewer opens recorded results; tuning and execution run locally.

### Read the evidence in context

The featured example uses real routing and control code with a **deterministic provider fixture and synthetic customer data**. It is a reproducible integration check. It does not measure production adoption, business savings, live-model quality, or general containment safety.

AxonLLM's separate routing evaluation uses a generated, reviewed test corpus. Its benchmark scores are evaluation results; the operator tour's seeded dashboard values are demonstration data. Neither is presented as customer production evidence.

Practical Eval Lab's bundled candidates use local rules. Its teaching datasets combine synthetic cases with an attributed human-preference sample. The recorded offline results demonstrate evaluation methods; they do not establish live-model quality, production adoption, or safety certification.

---
Source: [README.md](https://github.com/hk-775/hk-775/blob/main/README.md)

Source SHA-256: `97762508e3970c5525e1148c28e46e4dac11624a4f35e9c541063eb1841a884a`

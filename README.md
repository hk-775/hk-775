# Harleen Kaur

I build open-source tools for enterprise AI: **select the model, govern the action, test the boundary.**

My projects address different parts of the same workflow. **AxonLLM selects models and provider routes. Ostiari governs agent actions. Escape Lab tests whether the controls hold.**

**[Start here → one workflow, its evidence, and the code](https://hk-775.github.io/hk-775/)**

| Your next step | What you will find |
| --- | --- |
| **[Watch](https://hk-775.github.io/hk-775/#watch)** | A 60-second replay of a synthetic customer-summary workflow, plus a 2:13 AxonLLM operator tour. |
| **[Understand](CASE_STUDY.md)** | The problem, architecture, measured outcome, and limitations. |
| **[Inspect](examples/customer-summary/README.md)** | Exact source revisions, locked dependencies, runnable commands, and recorded evidence. |
| **[Evaluate decisions](DECISIONS.md)** | Documented engineering scope and tradeoffs, with an explicit boundary around leadership and production claims. |

### One body of work

| Project | The question it answers | Explore |
| --- | --- | --- |
| **AxonLLM** | Which model and provider should handle this request? | [Repository](https://github.com/hk-775/axonllm) · [Routing evaluation](https://hk-775.github.io/axonllm/benchmark.html) |
| **Ostiari** | May this agent take this action, under this policy? | [Repository](https://github.com/hk-775/ostiari) · [Architecture](https://hk-775.github.io/ostiari/#/architecture) |
| **Escape Lab** | Can a prohibited outcome occur despite the controls? | [Repository](https://github.com/hk-775/OstiariEscapeLab) · [Results and limitations](https://hk-775.github.io/OstiariEscapeLab/) |

### Read the evidence in context

The featured example uses real routing and control code with a **deterministic provider fixture and synthetic customer data**. It is a reproducible integration check. It does not measure production adoption, business savings, live-model quality, or general containment safety.

AxonLLM's separate routing evaluation uses a generated, reviewed test corpus. Its benchmark scores are evaluation results; the operator tour's seeded dashboard values are demonstration data. Neither is presented as customer production evidence.

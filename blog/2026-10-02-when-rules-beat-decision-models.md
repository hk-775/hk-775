I wanted to answer a practical architecture question: **does a local decision
model improve tool selection enough to justify adding it to an agent workflow?**

My first experiment could not answer that question. It compared model choices
with handwritten labels, without executing the downstream task. I redesigned the
evaluation around a small support workflow and froze the implementation before
calibration and final testing.

On 144 synthetic test episodes, rules achieved **86.1% strict success**,
compared with **27.1% for Strands Decider v19** and **24.3% for Laya English**.
The tested configurations did not meet the criterion for adding a model stage.
The useful result was a concrete architecture decision and a record of where
each selector failed.

**Scope:** this is one authored, in-memory workflow, evaluated on 2 October 2026.
It uses pinned, zero-shot model configurations. These measurements are
synthetic evaluation evidence, not production results or a general model ranking.
[The full results and raw traces are public.](https://hk-775.github.io/practical-eval-lab/tool-workflow-results.html)

## Start with the decision the system must make

The selector receives a user request, two synthetic ticket records,
authorization state, and the last tool result. It must select an action and,
where necessary, the ticket and new priority.

There are four actions:

- `read_ticket`: return the requested ticket's current state.
- `set_priority`: change the requested ticket to the requested priority.
- `ask_user`: obtain information required to act correctly.
- `handoff`: record that the request needs another operator or capability.

Each choice runs against a fresh simulator. A clarification receives a scripted
reply and another decision. A blocked operation returns its reason. An episode
has a maximum of three decision-and-tool steps.

That makes the engineering question specific: **can the selector complete the
workflow, obtain missing information, and avoid an incorrect action along the way?**

The executor checks schemas, update permission, and ticket locks. It does not
read the private task reference to prevent a valid-looking but wrong update.
A permitted write to the wrong ticket can therefore execute and fail the
evaluation. This separation lets the test expose a semantic mistake that ordinary
permission checks cannot identify.

[Inspect the frozen workflow contract.](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/tool_workflow/PROTOCOL.md)

## Why I replaced the first test

The initial diagnostic mixed routing labels, tool choices, and policy questions.
It had too few underlying scenarios, incomplete calibration coverage, and a weak
baseline. Its Laya inputs also used generic boolean Choice keys that the pinned
upstream documentation warned about.

The arithmetic was reproducible. The experiment still could not establish a
deployment advantage. No downstream tool or routed model ran, so a correct label
did not show that a task succeeded.

I retained that run and attached a
[design review](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/decision_models/DESIGN_REVIEW.md).
The replacement uses semantic action names, executes the selected tools, and
compares against alternatives that could actually handle this bounded workload.

## Split families before expanding variants

I separated development, calibration, and final test data by wording family:

| Partition | Episodes | Wording families | Use |
| --- | ---: | ---: | --- |
| Development | 72 | 30 | Fit the lightweight baseline and check inputs |
| Calibration | 72 | 30 | Select the confidence gate |
| Final test | 144 | 60 | Measure the frozen configurations |

Related argument-order and permission variants remain in the same partition.
The final set has 12 episodes in each of 12 declared conditions, covering clear
reads and writes, missing information, negation, priority corrections, ambiguous
intent, permission denial, locked tickets, unsupported operations, and references
that contrast one ticket with another.

These are held-out wording families within the same designed workflow. They do
not represent 144 independent enterprise use cases. The bootstrap resamples
whole families to retain the dependence between related variants.

I committed the code, fixtures, and protocol at
[`2aa9e2a`](https://github.com/hk-775/practical-eval-lab/commit/2aa9e2a)
before calibration and final-test runs. The
[freeze record](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/tool_workflow/freeze.json)
records the configuration and content hashes.

## Score the executed trajectory

The primary metric is **strict episode success**: reach the required terminal
outcome, obtain required clarification, and make no incorrect intermediate action
or argument selection.

This is deliberately stricter than eventually reaching the goal. An unnecessary
question counts as a mistake. An appropriate handoff can satisfy the contract
without completing the underlying business request.

I compared rules, a fitted multinomial Naive Bayes classifier, Strands Decider
v19, Laya English, a development-majority action, and a seeded random policy.
The rules were authored against the workflow specification. Naive Bayes learned
only from development reference states. Neither receives the private test goal.

| Direct selector | Strict successes | Success rate | Correct initial clarification | Incorrect writes accepted |
| --- | ---: | ---: | ---: | ---: |
| Rules | 124 / 144 | 86.1% | 48 / 48 | 0 |
| Fitted Naive Bayes | 60 / 144 | 41.7% | 29 / 48 | 7 |
| Strands Decider v19 | 39 / 144 | 27.1% | 0 / 48 | 50 |
| Laya English | 35 / 144 | 24.3% | 0 / 48 | 23 |
| Development-majority action | 26 / 144 | 18.1% | 0 / 48 | 0 |
| Seeded random policy | 14 / 144 | 9.7% | 10 / 48 | 22 |

Strands eventually reached the reference goal in 59 episodes; 39 were
mistake-free. Rules' 124 successes comprised 88 completed reads or updates and
36 appropriate handoffs.

An incorrect accepted write means a `set_priority` call executed in violation of
the task contract. It includes a call that sets an existing value. Of Strands'
50 incorrect writes, 25 changed a value. Of Laya's 23, five changed a value.
All seven of Naive Bayes' incorrect writes changed a value.

The full report includes family intervals and per-condition results. For
example, rules' 95% family-bootstrap interval was 80.6–90.3%; Strands' was
21.5–32.6%. Those intervals describe variation within this fixture.

[Inspect the matched comparison and report hashes.](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/tool_workflow/recordings/2026-10-02/comparison.json)

## Missing information was the decisive failure

Both local models failed to ask the required initial clarification in all 48
episodes that required it. The rules baseline obtained that clarification in
all 48.

The permission guard blocked 79 Strands operations and 136 Laya operations.
It still allowed some authorized, well-formed writes that contradicted the
request. I therefore tracked proposals, tool attempts, blocked operations,
executed writes, and actual state changes separately.

Rules also had a clear weakness: all 12 contrastive-reference episodes failed.
Both models resolved some references and priority corrections that rules missed.
That is a useful direction for another experiment, provided the next design
preserves clarification and write correctness.

## A confidence gate has to earn its coverage

I predeclared a fixed threshold grid. To qualify, an operating point had to
achieve at most 5% empirical calibration plan error and cover at least 20 wording
families. Confidence was the minimum selected-option probability across the
action and its required arguments; it was not a calibrated joint correctness
probability.

No candidate met both requirements:

- Naive Bayes at 0.95 had two errors in 46 accepted states, covering 19 families.
- Strands at 0.60 covered 20 families but made five errors in 29 accepted states.
- Laya at 0.50 made 40 errors in 53 accepted states across 23 families.

The complete grids are published with the recordings. I kept the declared
criterion after seeing the results.

A failed gate bypassed the primary selector and executed rules on every
decision. All three gated policies achieved 124 of 144 strict successes, with
**100% fallback demand and zero primary calls**. Their success is attributable
to the rules fallback.

## Measure the whole path, then state what timing excludes

On an Apple M4 Pro with 48 GiB unified memory, the recorded simulator-episode
latencies were:

| Direct selector | Median | p95 |
| --- | ---: | ---: |
| Rules | 0.061 ms | 0.153 ms |
| Fitted Naive Bayes | 0.111 ms | 0.188 ms |
| Strands Decider v19 | 453.8 ms | 1,339.6 ms |
| Laya English | 125.0 ms | 412.5 ms |

These measurements include the actual decision trajectory, tool execution, and
scripted clarification turns. They exclude setup and three warmups. All tools
run in memory; user replies are instantaneous.

Candidates can fail after different numbers of steps. The table mixes successful
and failed episodes and does not compare inference at equal task quality.
Network services, queues, human response time, concurrency, and monetary cost
remain unmeasured.

Both models ran locally with pinned checkpoints and runtimes, using their
recorded native precision. Laya was the English base checkpoint; neither model
was fine-tuned for this workflow. The Laya input audit found no truncation across
1,152 reference questions. All scored model calls completed without inference
or response-validation errors.

[Inspect model revisions](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/decision_models/models.json)
and the
[input audit](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/tool_workflow/input-audit.json).

## The architecture decision

My acceptance criterion required a paired improvement over rules whose 95%
family-bootstrap interval stayed above zero, no incorrect executed writes, and
no inference failures. Neither model configuration qualified.

**I would keep rules as the reference selector for this bounded workflow.**
Their 20 failed episodes still require engineering work. An 86.1% synthetic
success rate does not establish production readiness.

A different model, task specialization, or a model used only for reference
resolution could change the result. Evaluating that change requires a new
protocol and fresh final-test families. The current test has already informed
the next hypothesis.

The broader lesson I take from this experiment is to make a proposed model
stage justify its place in the execution path. Define its contract, compare
against an implementable baseline, execute its mistakes, and measure how much
work the fallback actually performs.

## How this fits the other projects

I use four projects to investigate complementary parts of an AI system:

- **[AxonLLM](https://github.com/hk-775/axonllm)** selects models and provider routes.
- **[Ostiari](https://github.com/hk-775/ostiari)** governs proposed agent actions.
- **[Escape Lab](https://github.com/hk-775/OstiariEscapeLab)** tests containment
  through observed effects and retained evidence.
- **[Practical Eval Lab](https://github.com/hk-775/practical-eval-lab)** measures
  application behavior, compares candidates, and exposes regressions.

This experiment lives in Practical Eval Lab. It evaluates a local support
selector; it does not execute the other three projects. Its failure analysis
helps frame the next routing, control, or evaluation question.

## Inspect and reproduce

The published run includes the protocol, partition manifest, pinned model
identities, calibration grids, execution traces, and replay verifier.
Start with the recorded evidence; replaying a trace does not require model
weights or API keys.

```sh
git clone https://github.com/hk-775/practical-eval-lab.git
cd practical-eval-lab
git checkout 86da0fcea679c1ca1dd4cf2b5d81537e08361b62
uv sync --locked
uv run --locked python -m scripts.audit_workflow_recordings \
  benchmarks/tool_workflow/recordings/2026-10-02/strands-direct.json
```

Replay verifies the recorded trajectory against fresh simulator state and
recomputes its metrics. It does not rerun model inference. Model execution
requires the separately locked runtime and downloaded weights described in the
protocol.

- [Readable results and limitations](https://hk-775.github.io/practical-eval-lab/tool-workflow-results.html)
- [Recorded evidence at the cited revision](https://github.com/hk-775/practical-eval-lab/tree/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/tool_workflow/recordings)
- [Frozen methodology](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/tool_workflow/PROTOCOL.md)
- [Original diagnostic and its design review](https://github.com/hk-775/practical-eval-lab/blob/86da0fcea679c1ca1dd4cf2b5d81537e08361b62/benchmarks/decision_models/DESIGN_REVIEW.md)

All workflow records and tickets are synthetic. No customer data, production
traces, Jev calls, or paid model services are part of this experiment.
Content hashes detect changes; they are not signed execution attestations.

An agent reports that a batch is complete. The dashboard is green. Yet one
required output is missing, another is stale, and duplicate artifacts inflate
the count. Should that agent receive credit for finishing the job?

I built a synthetic version of this problem in **RSI Engine** and used
**AutoHelix** to coordinate code improvements. The engineering question was
straightforward: **does checking the actual work produce more reliable agents
than trusting their completion reports?** I also tested whether allowing the
improvement strategy itself to change helped.

Verified feedback produced consistent correct outcomes in this small
experiment. Deliberately programmed cheating
controls exposed the weak scoring rule. None of the selected live-model
policies made false completion claims.

## What the agent had to do

The workload models an AI batch-processing job. Each source document requires
one current, correct output. An agent can inspect existing outputs, request
processing, update status counters, declare completion, or hand off blocked work.

For reproducibility, a deterministic worker generates the artifacts. The live
language model writes agent code during improvement; it does not process each
document or make every tool decision. This keeps the experiment focused on
orchestration: checking state, retrying work, and deciding when to stop.

Cases include temporary failures, stale or incomplete outputs, uncertain
operation results, permanent outages, and revoked permission. A successful
agent must distinguish recoverable work from work that requires intervention.
Simply handing everything off does not earn a passing score.

## Two definitions of success

I compared two feedback conditions.

**Reported completion** gives credit when the agent declares completion and
the dashboard's completed count meets its expected count. The agent can edit
those counters. This is a deliberately weak experimental score.

**Verified outcomes** give credit only when an external checker finds exactly
one correct, current output for every required document, or confirms a justified
handoff after a genuine blocking condition. The checker recomputes expected
content from the fixed source requirements.

The distinction matters because a counter can change without the work changing.
An agent can report that every document is complete, or reduce the expected
count to zero. Neither action creates a valid output.

The source requirements, worker, and grading rules stay outside the editable
agent code. “External” here means outside candidate execution; I authored the
simulator and checker, so this is not independent third-party validation.

![AutoHelix coordinates code proposals, a candidate runs in Docker, and a fixed worker produces artifacts. Each experiment uses either editable completion counters or an external output verifier as its development score. A separate final audit runs after all selections are committed.](https://hk-775.github.io/hk-775/blog/diagrams/verified-agent-work.svg)

Use the diagram controls to pause the moving circles or expand the workflow.
Solid connectors show execution and revision flow; dashed connectors carry
state or scoring evidence. Motion illustrates direction, not elapsed time.
The two feedback paths represent separate experimental conditions.

[Static SVG](https://hk-775.github.io/hk-775/blog/diagrams/verified-agent-work.svg) ·
[Static PNG](https://hk-775.github.io/hk-775/blog/diagrams/verified-agent-work.png) ·
[Editable draw.io source](https://hk-775.github.io/hk-775/blog/diagrams/verified-agent-work.drawio)

## What “improvement” meant in this experiment

RSI Engine represents a candidate with two Python modules: a **task policy**
that chooses actions and an **improver** that proposes how to revise the code.
Candidate modules execute in Docker under resource limits. AutoHelix coordinates
the proposal and acceptance process.

Every run received the same four-call model budget. With a fixed improver, all
four calls could revise the task policy. With an editable improver, one call
could revise the improvement strategy, leaving three calls for the task policy.
Both configurations had access to development history.

I ran each combination of feedback and improver configuration three times,
using Sonnet 4.6 through Amazon Bedrock: **12 runs and 48 model calls** in total.
This changes code and improvement instructions; it does not update model weights.

Development and validation used separate fault combinations. All twelve selected
policies were committed before the final 120 cases were opened for evaluation.
Final results never fed back into the improvement loop. The
[registered protocol](https://github.com/hk-775/rsi-engine/blob/c19b029b9160baa680a972afc7b5cd66a3c4edc4/docs/REWARD_STUDY.md)
records the comparison and its limits.

## What happened

Every entry below uses the same final output checker, regardless of the feedback
used during improvement.

| Feedback during improvement | Improver | Run 1 | Run 2 | Run 3 |
| --- | --- | ---: | ---: | ---: |
| Reported completion | Fixed | 92/120 | 120/120 | 80/120 |
| Reported completion | Editable | 120/120 | 120/120 | 120/120 |
| Verified outcomes | Fixed | 120/120 | 120/120 | 120/120 |
| Verified outcomes | Editable | 120/120 | 120/120 | 120/120 |

**Correct outcomes include justified handoffs.** Every 120/120 run completed
86 workflows and correctly handed off 34 blocked workflows. It did not complete
120 batches.

The two weaker fixed-improver runs stopped too early. One allowed only two
attempts where the task contract allowed recovery on the third. The other kept
the original one-attempt policy. These policies mishandled recoverable failures
and handed off some outages before gathering enough evidence.

The weak score gave no completion credit for either a justified or a premature
handoff. When scores tied, selection favored fewer tool calls. Verified scoring
could distinguish those outcomes.

That is an important limit on the comparison: **the treatment changes both output
verification and credit for justified handoff.** This experiment does not isolate
their individual effects. The
[full results](https://github.com/hk-775/rsi-engine/blob/4d7f00daf22314f738f95d4673174a6c71378b26/docs/REWARD_RESULTS.md)
include the failure breakdown.

## Did an agent learn to cheat?

None of the twelve selected live-model policies made a false completion claim
or edited the dashboard during final evaluation.

To check whether the evaluator could detect manipulation, I also wrote two
explicit cheating controls. One reported every document as complete without
processing it. The other set the expected count to zero.

Both received completion credit from the weak score on all 120 cases. The
external checker rejected **94 false completion claims per control**. The
remaining 26 cases already contained valid cached outputs. Both controls used
the same cases, so these are not 188 independent failures.

This demonstrates a way to game the configured score. It does not demonstrate
that the live model discovered or chose that behavior, and it does not identify
a defect in AutoHelix. The weak reward was a deliberate part of my experiment.

## What I would carry into an engineering system

Three design choices follow from this work.

**Define completion through observable effects.** For this workload, that means
checking output identity, revision, content, and coverage. A useful extension to
another domain starts by specifying its equivalent evidence.

**Give justified handoff its own meaning.** Report completed work separately
from correctly escalated work. Preserve evidence of the block so an agent cannot
appear reliable by abandoning difficult requests.

**Keep the evaluator outside the code being improved.** Let the optimizer change
the task policy and, where useful, its revision strategy. Keep the contract,
grading rules, execution limits, and final evaluation under separate control.
Retain rejected proposals so the record explains how selection happened.

The editable improver helped in two reported-score comparisons and tied in the
third. Under verified feedback, both strategies reached the ceiling. Three
repeats on one synthetic corpus cannot establish a general advantage for
recursive improvement. A harder, independently authored evaluation would be
needed to test whether the benefit transfers.

## Inspect and reproduce the work

The public record includes the selected source code, protocol, per-case audits,
and model usage. The live experiment cost **about $1.53 in estimated inference
charges**, calculated from token usage and registered rates; local compute and
engineering time are excluded.

The implementation passed 91 tests. I also replayed two published policies
against a freshly generated corpus: all 240 case outcomes matched, with no new
model calls. Replaying a selected policy verifies its recorded behavior; it
does not reproduce the stochastic code-generation process.

- [RSI Engine repository](https://github.com/hk-775/rsi-engine)
- [Exact result record and evaluated policies](https://github.com/hk-775/rsi-engine/blob/4d7f00daf22314f738f95d4673174a6c71378b26/docs/results/autohelix-reward-study-2026-10-30.json)
- [Docker replay instructions](https://github.com/hk-775/rsi-engine/blob/4d7f00daf22314f738f95d4673174a6c71378b26/docs/REWARD_STUDY.md#replay-the-evaluated-policies-without-model-calls)

These are public synthetic cases, with 120 final examples drawn from 60 fault
families. They share a simulator and related mechanisms; they are not 120
independent model runs or production evidence. Every condition also retained
instructions requiring valid outputs, so the reward was not the model's only
guidance.

My next engineering question is whether the same separation—editable agent,
fixed contract, verified effects—holds up across independently built workloads.
This experiment provides a reproducible starting point.

---
Source: [blog/2026-10-30-improving-agents-starts-with-verifying-the-work.md](https://github.com/hk-775/hk-775/blob/main/blog/2026-10-30-improving-agents-starts-with-verifying-the-work.md)

Source SHA-256: `7c97104ea9b700750fe8945aa23a9e24f7ce87e9d6b8ddd94f988b1dbe4f9ad0`

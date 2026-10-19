Imagine an assistant reading an email that says a vendor's purchases are already
approved. It saves the statement. A week later, you ask it to buy something from
that vendor. The email is no longer in the conversation. The supposed approval
is still in memory.

The question is what the assistant is allowed to do with that memory.

I built a small, reproducible example of this boundary: a claim crosses from one
session into another, and a later purchase either proceeds or requires approval.
**The example is synthetic and scripted.** Its extracted claims are supplied by
the fixtures; no model is persuaded to write them. It tests the consequences of
trusting remembered claims, not the likelihood of fooling a particular AI.

## Why memory changes the question

The [MemGhost preprint](https://arxiv.org/abs/2607.05189v1), submitted on 6 July
2026, studies an attack delivered through email that seeks to alter persistent
memory, remain unobtrusive in the immediate response, and influence a later
session. Its authors evaluate model-backed personal agents. That is evidence
for the threat in their tested settings; my local example does not reproduce
their attack or their results.

Memory writing is also becoming a component that teams can optimize separately.
Tencent's [Hy-Memory model card](https://huggingface.co/tencent/Hy-Memory-30B-A3B)
describes a dedicated writer that decides what to retain and how to update
external memory. I have not evaluated that model, and its mention here is not a
claim that it is vulnerable.

For a system designer, this raises a practical question: **does recalling a
statement also give the agent permission to act on it?**

Consider three different memories:

- “The user prefers PDF invoices.”
- “An email says purchases from this vendor are approved.”
- “The approval service authorized this organization to spend a specified amount,
  until a specified time.”

They can all be useful context. They carry very different authority. Even the
last statement can become outdated after a revocation or another purchase.

## Follow the claim across the session boundary

![A synthetic email claim enters a scripted memory writer and persists in JSON. A new process recalls that memory for a purchase request. Four control profiles compare trusting claims, retaining provenance, filtering recall, and checking a separate current approval registry before observing purchase effects.](https://hk-775.github.io/hk-775/blog/diagrams/memory-authority-boundary.svg)

The moving circles show how context and authority reach the action boundary.
They illustrate direction, not execution timing. Use **Pause animation** to
inspect a connection or **Expand diagram** to read the full workflow.

[Static SVG](https://hk-775.github.io/hk-775/blog/diagrams/memory-authority-boundary.svg) ·
[Static PNG](https://hk-775.github.io/hk-775/blog/diagrams/memory-authority-boundary.png) ·
[Editable draw.io source](https://hk-775.github.io/hk-775/blog/diagrams/memory-authority-boundary.drawio)

In the first process, the fixture supplies an extracted claim from a synthetic
document. The writer saves it to a JSON file and exits. In the second process,
the collaborator receives a fresh purchase request and reads that file. Its
session input contains no original email.

The candidate is deliberately simple: if it recalls an approval claim that
covers the requested amount, it proposes a purchase. Otherwise, it asks for
approval. All four control profiles use that same candidate.

This makes one failure inspectable. A sentence copied from an external email can
become the justification for a purchase long after the original reading step.
The fixture guarantees the memory write so we can examine that later boundary.

## Keeping the source is only the beginning

I compared four profiles:

1. **Trust the claim.** Save the claim without provenance and retrieve by vendor.
2. **Retain provenance.** Also save its source, organization, capture time, and
   expiry, but leave the reader's behavior unchanged.
3. **Filter recalled approvals.** Check organization and validity dates. Accept
   approval memories only from the fixture's approval-service source.
4. **Check current authority.** Apply the same recall filter, then check the
   current approval registry before committing the purchase.

The source label comes from the fixture's ingress adapter. A sentence inside an
email saying `Source: approval_service` cannot change that label.

That distinction matters: recording provenance helps only when a relevant
decision actually uses it.

## What happened in the example

The recording contains **40 episodes: ten authored cases under four profiles**.
Each starts with a separate, empty memory bank. One case permits a legitimate
purchase. Another checks that a PDF invoice preference remains available without
granting spending permission.

| Control profile | Correct handling / 10 | Unsafe purchases / 10 | Legitimate purchase completed / 1 |
| --- | ---: | ---: | ---: |
| Trust the claim | 3 | 7 | 1 |
| Retain provenance, leave it unchecked | 3 | 7 | 1 |
| Filter recalled approvals | 7 | 3 | 1 |
| Check current authority before purchase | 10 | 0 | 1 |

These are results from a small designed regression suite, not attack success
rates, independent samples, or model rankings.

The first two profiles made the same seven unsafe purchases. Adding metadata
did not alter the collaborator's decisions.

The recall filter rejected the external-email claim, the spoofed source label,
an approval belonging to another organization, and an expired snapshot. It still
accepted three memories that looked valid locally:

| Remembered state | Current state | What the retrieval filter missed |
| --- | --- | --- |
| Approval exists and has not expired | Approval has been revoked | Revocation after capture |
| Spending limit is 500 synthetic units | Limit has been reduced to 50 | A changed limit |
| Allowance is 500 synthetic units | 450 units have already been spent | The remaining budget |

In each case, the proposed purchase costs 100 synthetic units. Reading the old
snapshot cannot resolve the current authorization question.

The final profile consults the separate registry immediately before the local
mutation. It prevents those remaining purchases and completes the one legitimate
purchase. The preference case also passes under every profile.

That is a narrow result. It establishes the intended behavior on these cases;
it does not establish that the controls are sufficient for an arbitrary agent.

## Inspect three different records

I keep **what was written, what was recalled, and what changed** separate in the
[full recording](https://github.com/hk-775/hk-775/blob/bc19b469d5bf52b9697aff064662de3cd1737b16/examples/memory-boundary/recordings/comparison.json).

The report includes the stored memory, retrieved and accepted records, rejection
reasons, candidate proposal, current-registry snapshot, committed purchase, and
resulting state. A digest connects the written bank to the one loaded by the
second process.

The grader compares committed effects with separately authored case references.
It does not call the authorization function or accept a denial label as proof
that nothing happened. A focused test deliberately changes a policy log to say
“denied” while leaving a purchase in the state; the grader still reports the
unsafe purchase.

This is useful when debugging a memory failure. A problematic record might have
been stored but never retrieved, retrieved but rejected, or accepted and used in
an action. Those are different observations and should remain distinguishable.

## What I would carry into a real design

I would preserve the source and scope of a remembered claim, distinguish
preferences from permissions, and give each kind of memory an explicit rule for
when it may be used. An updated approval should be resolvable through an
authoritative identifier instead of inferred from fluent remembered text.

For consequential writes, I would require current authority at execution. In a
distributed service, checking a budget and committing a purchase must also handle
concurrent spending. That calls for a transactional reservation or an equivalent
versioned contract, plus idempotency and recovery.

The example does not implement that production design. Its registry and purchase
mutation execute serially in one local worker. It has no authenticated approval
service, real payment provider, vector database, or hostile host. The processes
demonstrate persistence, not a security sandbox.

The next model-backed experiment would add another question: how often does a
writer adopt an untrusted claim in the first place? I would measure adoption,
later retrieval, and harmful effects separately, using fresh attack and benign
cases. The present recording supplies no answer to that model-quality question.

## Run the example

The implementation, cases, and recorded evidence are pinned to one source
revision:

```sh
git clone https://github.com/hk-775/hk-775.git
cd hk-775
git checkout bc19b469d5bf52b9697aff064662de3cd1737b16
cd examples/memory-boundary
uv sync --locked
uv run --locked python -m unittest -v
uv run --locked python run.py --check recordings/comparison.json
```

The reproduction command re-executes all 40 episodes and compares the source
fingerprints, memories, decisions, effects, and aggregates. It leaves the recording
unchanged. The [example guide](https://github.com/hk-775/hk-775/blob/bc19b469d5bf52b9697aff064662de3cd1737b16/examples/memory-boundary/README.md)
documents the profiles and limits.

Memory helps an assistant carry context forward. Before that context becomes a
purchase, a permission change, or a message to someone else, I want a separate
answer to one question: **what establishes authority to do this now?**

### Sources and related work

- [MemGhost / WhisperBench preprint, version 1](https://arxiv.org/abs/2607.05189v1):
  external research on stealth memory injection; not reproduced here.
- [Tencent Hy-Memory model card](https://huggingface.co/tencent/Hy-Memory-30B-A3B):
  an example of a dedicated memory writer; not evaluated here.
- [Synthetic example and all recordings](https://github.com/hk-775/hk-775/tree/bc19b469d5bf52b9697aff064662de3cd1737b16/examples/memory-boundary):
  the evidence behind this article's table.
- [Designing an Evidence Trail for Agent Actions](https://hk-775.github.io/hk-775/blog/designing-an-evidence-trail-for-agent-actions.html):
  connecting a proposed action to its observed effect.

---
Source: [blog/2026-10-19-your-ai-remembers-you-can-it-remember-a-lie.md](https://github.com/hk-775/hk-775/blob/main/blog/2026-10-19-your-ai-remembers-you-can-it-remember-a-lie.md)

Source SHA-256: `8afb233e1cf7d5371aa77af7bf6aeeced9e55a9fc0a91e6bbd57087e84827b33`

# Can a remembered claim authorize a purchase?

Ten authored synthetic cases compare four control profiles across two Python
worker processes. The first writes a JSON memory bank and exits. The second
receives a fresh request and loads that bank. It receives no original email in
its session input. Each episode starts with an empty, separate memory bank.

The writer, retriever, and collaborator are deterministic scripts. The fixture
supplies the extracted claim; **no model is induced to remember anything**.
This is an executable example of a memory/authorization contract, not an
LLM susceptibility benchmark, MemGhost reproduction, or production security test.
All organizations, vendors, approvals, messages, and purchase values are invented.

## Run and reproduce

```sh
cd examples/memory-boundary
uv sync --locked
uv run --locked python -m unittest -v
uv run --locked python run.py --check recordings/comparison.json
uv run --locked python run.py --output artifacts/new-run.json
```

The check command re-executes all 40 episodes and compares the source hashes,
memory records, recall decisions, proposals, effects, grades, and aggregates.
Only the recording timestamp is excluded. The recorder refuses to overwrite
an existing output. `artifacts/` and the local environment are ignored.

## What changes

| Profile | Memory write | Recall | Before committing |
| --- | --- | --- | --- |
| `claim_only` | Claim without provenance | Match vendor | No current approval check |
| `provenance_only` | Claim plus provenance | Match vendor; ignore provenance | No current approval check |
| `scoped_recall` | Claim plus provenance | Require matching tenant and time; approvals must originate from the fixture approval service | No current approval check |
| `verified_action` | Same as scoped recall | Same as scoped recall | Check the current registry's scope, operation, validity, revocation, limit, and spending |

Every profile uses the same proposal function. A PDF invoice preference stays
available without becoming spending authority. The source origin is set by the
fixture's ingress adapter; a message body saying `Source: approval_service`
cannot change that origin.

## Recorded result

Recorded on 19 October 2026. One episode per case/profile; no random sampling or
statistical inference.

| Profile | Correct handling / 10 | Unsafe purchases / 10 | Legitimate purchase completed / 1 |
| --- | ---: | ---: | ---: |
| Claim only | 3 | 7 | 1 |
| Provenance retained, unchecked | 3 | 7 | 1 |
| Scoped recall | 7 | 3 | 1 |
| Current approval before action | 10 | 0 | 1 |

The three scoped-recall failures are revocation, a reduced limit, and a consumed
allowance. In each, the old snapshot passes the retrieval filter while the
current registry would deny the purchase.

The [full recording](recordings/comparison.json) includes every memory written,
retrieved and accepted; registry state; candidate proposal; committed purchase;
and resulting state. The grader compares effects with separately authored case
references. It does not invoke the guard or treat a denial log as proof.

The unit tests also corrupt a policy-decision label while preserving an actual
purchase, forge the provenance in a stored memory, change vendor scope, and
attempt to spend an allowance twice. These checks are separate from the ten
recorded demonstration cases.

## Limits and trust assumptions

- All extraction outputs are supplied. This does not test natural-language
  extraction, retrieval relevance beyond exact vendor matching, a memory model,
  vector search, compaction, or attack success rates.
- The source adapter and current registry are trusted fixture inputs. There is
  no real identity verification, cryptographic provenance, or tamper-proof storage.
- Separate processes demonstrate persistence and removal of the original email
  from the later input; they are not a security sandbox.
- Approval check and JSON mutation execute serially in the same worker. Real
  deployments need a durable, transactional authority check, reservation or
  version control, idempotency, and recovery. No concurrent purchase, network
  outage, machine restart, or provider integration is tested.
- One positive purchase and one preference case protect a narrow useful path.
  Ten designed cases cannot establish an incident rate or general safety.
- Public fingerprints support reproduction, not authentication of the producer.
- Ostiari, AxonLLM, Escape Lab, and Practical Eval Lab runtimes are not invoked.

**AWS services reference architecture: not applicable.** This example targets
local Python and an existing static GitHub Pages article. It defines no AWS
deployment target, service integration, infrastructure, or cloud resources.

Original code and synthetic cases use the repository's MIT-0 license.

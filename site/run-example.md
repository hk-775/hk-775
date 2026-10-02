# Reproduce the customer-summary boundary

**Synthetic integration example.** Python 3.11+ and [uv](https://docs.astral.sh/uv/) are required. Installation downloads public source and packages. Execution uses a local HTTP provider fixture and an in-process synthetic range; it needs loopback sockets but no model credentials, paid API calls, Docker, or AWS resources.

```bash
git clone https://github.com/hk-775/hk-775.git
cd hk-775/examples/customer-summary
uv sync --locked
uv run --locked python run.py
```

The script runs the same scenario under C1 and C4, verifies the evidence, and checks the final destination state. Expected output:

```text
C1: O3; protected field present; evidence verified
C4: O1; protected field absent; evidence verified
PASS: the fixture reproduced the expected boundary difference.
```

Every run writes its own directory below `artifacts/runs/`. Timing, run IDs, generated identifiers, and event hashes vary. The outcome, payload treatment, evidence validity, and protected-field assertions are the reproducibility contract.

## Exact source

| Component | Commit |
| --- | --- |
| [AxonLLM](https://github.com/hk-775/axonllm/tree/dbfbc70a56c0be5e8f2c4217c179f28f375f87d8) | `dbfbc70a56c0be5e8f2c4217c179f28f375f87d8` |
| [Ostiari](https://github.com/hk-775/ostiari/tree/d9abfcf576535327a4aee93d93cc690e85f88a53) | `d9abfcf576535327a4aee93d93cc690e85f88a53` |
| [Escape Lab](https://github.com/hk-775/OstiariEscapeLab/tree/f8d0dc023700ff2c38e8e353b6f95b27aa6eadaa) | `f8d0dc023700ff2c38e8e353b6f95b27aa6eadaa` |

`pyproject.toml` pins these revisions; `uv.lock` locks their dependency resolution. Each upstream project retains its MIT-0 license.

## Run one profile directly

```bash
uv run --locked escape-lab \
  --artifacts-root artifacts \
  --backend ostiari \
  --agent axonllm \
  --axonllm-mode fixture \
  run S06 --profile C4 --seed 1

# Substitute the run directory printed by the preceding command.
uv run --locked escape-lab verify artifacts/runs/<run-id>
```

The Ostiari bridge participates in evaluation. The decisive redaction in this C4 scenario is implemented by Escape Lab's source-to-destination rule. The fixture routes to a fixed model; it does not compare model quality or automatic model selection.

[Problem, measured result, and limitations](https://hk-775.github.io/hk-775/case-study.md)

---
Source: [examples/customer-summary/README.md](https://github.com/hk-775/hk-775/blob/main/examples/customer-summary/README.md)

Source SHA-256: `909ed686429695503cca0282a7ae009ca3beb61660d88477a1f83b8e667f3a33`

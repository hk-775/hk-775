# Engineering decisions you can inspect

This page records decisions supported by the public repositories. It is an engineering case study; team size, executive sponsorship, customer adoption, and business outcomes need their own verified evidence.

## Scope the product around a shared core

AxonLLM's accepted product-boundary decision defines one router core across embedded Python, standalone gateway, and AgentCore delivery. Configuration and governance belong to a mandatory control plane. The release boundary explicitly defers capabilities that would expand certification scope.

The tradeoff is visible: three delivery modes share routing behavior, while the project avoids claiming fleet-wide adaptive balancing from process-local behavior.

[Read the accepted product-boundary decision](https://github.com/hk-775/axonllm/blob/dbfbc70a56c0be5e8f2c4217c179f28f375f87d8/docs/adr/0001-v0.3-product-boundary.md).

## Give action governance its own enforcement boundary

Ostiari puts authorization, quotas, risk decisions, optional approval, execution, and traces in the tool-call path. Model routing is embedded as a component. This creates a place to enforce policy even when an agent's proposed action looks plausible.

The tradeoff is operational responsibility: deployment mode, identity, configuration, and approval behavior must be explicit. A browser demo or an embedded library check does not qualify a production gateway.

[Read the implemented architecture and its demo boundaries](https://github.com/hk-775/ostiari/blob/d9abfcf576535327a4aee93d93cc690e85f88a53/docs/architecture.md).

## Make failure observable and reproducible

Escape Lab compares control profiles against prohibited state changes, records evidence outside the modeled agent boundary, and exposes both results and limitations. The customer-summary example makes the weak-control failure visible alongside the stronger-control result.

The tradeoff is claim discipline: deterministic authored scenarios are useful regression checks, while live-model qualification and independent isolation review require separate work.

[Read the results and limitations](https://github.com/hk-775/OstiariEscapeLab/blob/f8d0dc023700ff2c38e8e353b6f95b27aa6eadaa/docs/results.md).

## Evaluate behavior before accepting a change

Practical Eval Lab makes candidate outputs, grader checks, case failures, and slice results inspectable across six evaluation examples. It preserves reports for comparison and provides quality and regression gates. An improved average can still fail when a critical case or required slice regresses.

The tradeoff is measurement scope: each grader checks a stated property on a small teaching dataset. Local rule-based candidates, synthetic examples, and an attributed human-preference sample demonstrate the method. They do not qualify a model or deployed system for production.

[Inspect the regression example](https://github.com/hk-775/practical-eval-lab/blob/e016fe066342d32f800f5bc25282dd38e97afcdb/examples/tool-calling.md) · [Read the evaluation contracts](https://github.com/hk-775/practical-eval-lab/blob/e016fe066342d32f800f5bc25282dd38e97afcdb/docs/contracts.md).

## Use findings to guide the next version

Together, the projects support a development loop: AxonLLM selects models, Ostiari governs actions, Escape Lab tests containment, and Practical Eval Lab evaluates behavior and regressions. Findings can inform the next routing, policy, or application change.

This is the portfolio's conceptual relationship. The featured customer-summary example executes the first three projects; Practical Eval Lab supplies separate runnable evaluation examples.

## What this establishes about leadership

The public record supports review of engineering decisions and maintainer contributions. It does **not** by itself verify direct reports, cross-functional team size, executive decision authority, production adoption, revenue, or cost savings attributable to an individual.

No such figures are claimed here. A separate enterprise leadership case should identify the accountable role, distinguish direct reports from collaborators, cite an executive decision and adoption evidence, and give a dated business baseline and outcome with a shareable source.

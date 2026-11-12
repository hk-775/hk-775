The customer accepts a $12,000 agreement. The dashboard now has at least four questions to answer: what was agreed, what has been invoiced, what has been collected, and what service the amount covers.

Using one “revenue” number for all four hides the operational work.

This installment follows invoices, payment reservations, disputes, refunds and service allocations. Renewal Studio implements these as a synthetic operational ledger. It does not process real payments or provide statutory accounting.

## An invoice needs an identifiable source

A subscription or commitment invoice comes from an accepted agreement. A PAYG invoice comes from observed usage. PAYG does not need a fabricated annual renewal to enter the collection workflow.

Capturing invoices is repeatable. Repeated capture preserves the original document rather than generating a new invoice each time a worker runs. Archived accepted terms remain discoverable after another renewal cycle opens.

![Explore payment reconciliation, a future installment and a dispute against a collected amount.](https://hk-775.github.io/hk-775/blog/diagrams/renewal-invoices.svg)

A future agreement can produce scheduled invoices, but payment is blocked until the issue date. The schedule, invoice and collection are separate states.

For custom contracts, the signed amount is divided into the agreed installments. Remainder cents go to earlier installments. A fictional 10,001-cent amount across three installments becomes 3,334, 3,334 and 3,333 cents.

Dates derive from the original day of month, clamped when necessary. This preserves a schedule such as January 31, February 29 and March 31 in a leap year, rather than letting February permanently shift later dates.

These are explicit demo conventions. A production integration would need the billing provider's actual rules and the organization's approved commercial policy.

## Reserve before making a payment attempt

Assume an invoice has 10,000 cents outstanding. A payment attempt for 6,000 cents begins, but its final result is not yet known.

If a second request can collect the full 10,000 cents, the system can overcollect. The first amount therefore remains reserved while the attempt is unresolved.

The synthetic provider can record a payment and lose its acknowledgement. The application then has uncertainty about a result, not evidence that nothing happened.

On retry, reconciliation reads the independently recorded receipt and confirms the existing payment. It does not issue another charge just because the original response was missing.

The model also exercises declines and outages. After bounded outage attempts, a payment enters a dead letter. Explicit recovery resolves the outage and replays the stable action.

| State | What remains to establish |
| --- | --- |
| Invoice captured | Whether and when collection is due |
| Payment reserved | Whether the provider recorded the attempt |
| Receipt reconciled | The collected amount and remaining balance |
| Payment declined | A new collection decision, with the failure visible |
| Dead letter | An owned recovery decision after exhausted attempts |

An idempotency key is useful only if its scope and effect are understood. The demonstration exercises its simulated receipts and reservations. It does not prove the semantics of a real payment provider.

## Disputes change the collection workflow

After a payment is reconciled, a dispute can cover part of it. While that dispute is open, new collections and reminders for the invoice pause.

Upholding the dispute reverses the reviewed amount and reopens the balance. Dismissing it preserves the payment. Both decisions need an explicit review.

Continuing the example, a 6,000-cent reconciled payment against a 10,000-cent invoice leaves 4,000 cents outstanding. Upholding a 1,000-cent dispute brings net collected value to 5,000 cents and outstanding value to 5,000 cents.

The operational totals reconcile per currency. Negative adjustments remain separate credit documents; this version does not automatically net them across unrelated invoices.

Reminders are also stateful. The fixture records overdue stages, including later 14-day and 30-day stages, without delivering the same stage repeatedly. Cancellation and unresolved disputes affect whether a new reminder is appropriate.

## A goodwill refund has a different authority

A goodwill refund is not the same operation as a dispute reversal or an unused-service credit.

Renewal Studio gives refund requests an amount, reason and event ID. Pending and approved requests reserve a finite allowance. Finance reviews the current request with a rationale. Rejected or cancelled requests release their reservations.

![Follow a refund reservation to a reconciled credit, or release it after rejection.](https://hk-775.github.io/hk-775/blog/diagrams/renewal-refund.svg)

The credit fixture deliberately loses its acknowledgement after recording the credit. Reconciliation confirms the same receipt without issuing a second credit.

A later policy change can block new submissions while still allowing reconciliation of an already written credit. That is an important distinction: the system must be able to learn what happened even when it is no longer allowed to initiate that action again.

Identical request events are harmless replays. Reusing an event ID for conflicting content is rejected. Otherwise, deduplication itself could conceal a changed financial instruction.

Refund caps and fictional tax rates are demonstration policy. They are not representations of legal entitlements or jurisdiction-specific tax treatment.

## Allocate service without losing cents

The service allocator takes accepted subscription or custom service charges and spreads them across inclusive service days. It calculates cumulative monthly amounts, rounds those cumulative totals and uses the differences as monthly allocations.

That keeps the monthly sum equal to the signed source amount.

![Explore cumulative service allocation, a separate unused-service credit and excluded financial sources.](https://hk-775.github.io/hk-775/blog/diagrams/renewal-allocation.svg)

Unused-service credits produce separate negative schedules. Taxes, goodwill refunds, PAYG usage and consumption commitments are excluded from this allocator.

The limited scope is deliberate. A monthly allocation table can look like revenue recognition while omitting the policies and judgments that an accounting system requires. This feature is operational service allocation; it is not a GAAP or IFRS revenue-recognition engine or a general accounting subledger.

Keeping accepted terms, invoice sources, payment receipts and allocation schedules connected still has practical value. An operator can explain which agreement produced an amount and where a discrepancy entered the workflow.

## Try losing the acknowledgement

In [Invoices & collections](https://d11wfkflwovvog.cloudfront.net/collections), capture observed PAYG invoices and submit a partial payment using the lost-acknowledgement scenario. Inspect the reserved amount, then reconcile the receipt. The balance should reflect one payment.

In [Finance controls](https://d11wfkflwovvog.cloudfront.net/finance), follow a reviewed refund through the same uncertainty pattern and inspect the accepted service schedules.

The figures are local explanations. Application payments, credits, taxes and receipts are synthetic; no money moves. Implementation was reviewed on 12 November 2026. The [series replay record](https://hk-775.github.io/hk-775/blog/evidence/renewal-series.json) identifies the executed public checks and their limits.

These financial boundaries make the next design question concrete: [which actions should an agent be allowed to run?](https://hk-775.github.io/hk-775/blog/renewal-studio-agents.html)

---
Source: [blog/2026-11-12-renewal-studio-finance.md](https://github.com/hk-775/hk-775/blob/main/blog/2026-11-12-renewal-studio-finance.md)

Source SHA-256: `c9b26e5a83d392f72119da349bc987438c0311e4d8a3e420d226442ffa7f1337`

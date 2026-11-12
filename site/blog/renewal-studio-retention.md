A customer's bill falls by 25%. Their successful jobs stay almost unchanged.

Is that a retention problem? Perhaps the customer optimized its workload and now gets the same value for less money. A system that treats every spending decline as a failure can recommend exactly the wrong intervention.

PAYG accounts make this especially visible. They may have ongoing consumption without an annual commitment or a renewal date. Their retention workflow must follow useful activity and customer decisions rather than an invented contract anniversary.

## Compare outcomes before reacting to spend

Renewal Studio's synthetic PAYG analysis keeps a fixed reference from the first four observed weeks. It compares that reference with the latest two complete, contiguous weeks.

The fixture distinguishes several patterns. Successful jobs below 70% of reference trigger a decline investigation. At least 90% of reference jobs with spend below 80% is treated as efficiency. A separate decline in other units can prompt workload review.

Those percentages are teaching policies, not validated predictors of churn.

![Compare a decline in successful jobs with improved efficiency, a workload shift and insufficient data.](https://hk-775.github.io/hk-775/blog/diagrams/renewal-payg.svg)

Consider a fictional reference of 1,000 successful jobs and $1,000 spend per week. A current window averaging 950 jobs and $750 is consistent with the fixture's efficiency condition. Averaging 600 jobs points toward a different investigation.

The owner should ask what changed in the customer's work. A useful response might involve resolving errors, validating a migration or confirming that an optimization was intentional. Increasing spend is not automatically the desired outcome.

Keeping the reference fixed also prevents a declining baseline from drifting downward until weak activity appears normal. The reference and recent window should be visible alongside the result.

## Unknown health is different from poor health

Incomplete periods, duplicated observations, future-dated weeks, stale coverage and a nonpositive reference prevent a trustworthy comparison. The application withholds a health judgment and exposes a data hold.

That state needs an owner and a next action. It should not disappear from the portfolio simply because it lacks a score.

The recovery workflow then separates intervention from observation. A PAYG recovery needs an owner, approved actions, two new observed weeks after activation, at least 14 days, a healthy or efficient result and a review note.

The synthetic “outcomes recover, spend stays lower” scenario exercises an important result: a case can recover without returning to the old spend level. The system preserves evidence of customer value instead of using the invoice as its only measure.

This remains a simulation. It does not establish that the intervention caused recovery or quantify real retained revenue.

## Cancellation is an explicit customer workflow

A cancellation request is a stronger signal than a consumption pattern. It represents a customer decision that changes what the system is allowed to do next.

The buyer records the request and reason. Renewal outreach and new cycles are suppressed. The account owner can propose a noncommercial save plan on existing terms or confirm termination at the current term's end.

![Follow an explicit save decision, an end-of-term exit or a cancellation blocked by an accepted future agreement.](https://hk-775.github.io/hk-775/blog/diagrams/renewal-cancellation.svg)

The buyer must explicitly accept the save plan or withdraw the cancellation. A specialist marking a task complete cannot manufacture that decision.

There is also a difficult ordering case: the customer may already have accepted a future renewal. The cancellation workflow cannot silently undo that agreement. Its obligations must be resolved separately before the exit proceeds.

The application therefore distinguishes several events that a dashboard might otherwise compress into one “lost” state:

| Event | What it establishes |
| --- | --- |
| Customer requests cancellation | Intent to leave and a reason to respond |
| Owner proposes a save plan | A recommendation, awaiting customer choice |
| Buyer accepts the save | An explicit decision on the existing terms |
| Termination is confirmed | A scheduled exit |
| Effective termination is reconciled | Billing and access are inactive; a churn outcome exists |
| Quote expires or customer stays silent | No new agreement; not proof of effective churn |

That final distinction matters for forecasting and performance. A missing response cannot safely become a confirmed churn label just because a report needs a complete row.

## Suppression must survive a queued message

Suppose a renewal reminder was approved yesterday and the buyer requests cancellation today. The queued reminder should not be delivered simply because an approval exists.

The communication boundary checks current approval and suppression state at delivery. This connects retention to the operation that actually contacts the customer.

The same principle applies to new renewal work. Once cancellation is active, a scheduled worker should not create a contradictory offer merely because it reached the usual date.

An automated system needs to carry customer decisions across its workflows. A cancellation that only changes one screen leaves other parts of the operation acting on obsolete assumptions.

## A return has its own consent and fulfillment

After effective termination, the account owner can propose a return on the existing products and annual price. Deal Desk reviews the terms; the buyer accepts the displayed products and dates.

Only then does the system reconcile billing and access, record the return and open a fresh post-sale plan.

![Explore a contract return, a PAYG return and incomplete reactivation.](https://hk-775.github.io/hk-775/blog/diagrams/renewal-winback.svg)

A PAYG return resumes ongoing consumption. It does not acquire a fictional annual commitment or contract expiry just to fit the subscription model.

For either arrangement, a positive customer conversation is not verified reactivation. If one target is still inactive, the return remains operationally incomplete. The accepted decision should remain intact while the missing effect is reconciled.

The new post-sale plan is also purposeful. A returning customer may need help resolving the same friction that contributed to departure. The system should carry that context into owned work while keeping proposed goals distinct from contractual promises.

## Try a different definition of success

In [PAYG retention](https://d11wfkflwovvog.cloudfront.net/retention), compare the decline and efficiency scenarios. Inspect which observations support the case and what evidence closure needs. In [Cancellation & winback](https://d11wfkflwovvog.cloudfront.net/cancellations), follow the buyer's request through a save decision or effective exit and return.

All examples use fictional observations and simulated providers. The blog diagrams are local explanations; the linked application changes an isolated synthetic workspace. Implementation was reviewed on 12 November 2026. The [series replay record](https://hk-775.github.io/hk-775/blog/evidence/renewal-series.json) lists the narrower public checks executed for publication.

The next installment follows the work created by an agreement or return: [handoffs, partner evidence and customer follow-up](https://hk-775.github.io/hk-775/blog/renewal-studio-post-sale.html).

---
Source: [blog/2026-11-12-renewal-studio-retention.md](https://github.com/hk-775/hk-775/blob/main/blog/2026-11-12-renewal-studio-retention.md)

Source SHA-256: `073ce9fcdab194251b6b47ad825866ccf783c7ff206ee699c21fe2cd0cb81442`

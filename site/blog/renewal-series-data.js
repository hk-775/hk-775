// Original teaching scenarios for Parts 2–9. No requests, model calls or writes.
// Paths name their nodes; edges are derived so a highlighted path cannot jump
// between disconnected steps. The first choice shows a useful complete path.
function flow(number, title, prompt, nodes, cases) {
  const edges = [];
  const scenarios = cases.map(([label, path, heading, detail]) => {
    const selected = [];
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1], to = path[i];
      if (!nodes.some(n => n[0] === from) || !nodes.some(n => n[0] === to))
        throw new Error(`Unknown node in ${title}`);
      let index = edges.findIndex(e => e[0] === from && e[1] === to);
      if (index < 0) { index = edges.length; edges.push([from, to]); }
      selected.push(index);
    }
    return { label, nodes: path, edges: selected, title: heading, detail };
  });
  return { number, title, prompt, nodes, edges, scenarios };
}

export const seriesExplorers = {
  exception: flow("05", "Give the exception an owner", "Choose the failed check", [
    ["record", "Renewal packet", "Terms + usage + open issues"],
    ["check", "Classify the exception", "Explain the failed checks"],
    ["deal", "Deal Desk review", "Price, scope or negotiation"],
    ["ready", "Current approved quote", "Eligible for publication"],
    ["data", "Source reconciliation", "Evidence owner resolves it"],
    ["legal", "Legal text review", "Exact clause version"],
  ], [
    ["Commercial change", ["record", "check", "deal", "ready"], "A commercial owner receives a decision packet", "Send proposed terms, the failed policy checks, source versions and the reason for the change to Deal Desk. Publication still requires a current approval."],
    ["Untrusted source", ["record", "check", "data"], "Repair the source before making an offer", "A reviewer cannot approve a billing identity mismatch into correctness. Reconcile the record, then prepare a new proposal against the verified evidence."],
    ["Clause change", ["record", "check", "legal"], "Legal review is a separate authority", "Changing a clause changes the proposal version. Legal approval must cover that text, and commercial approval must be refreshed before publication."],
  ]),
  terms: flow("06", "An approval belongs to one version", "Choose what changes after review", [
    ["catalog", "Catalog + contracts", "Currency, quantities, dates"],
    ["quote", "Proposal version", "Price + clauses + schedule"],
    ["review", "Required approvals", "Commercial + legal"],
    ["publish", "Publish exact terms", "Current evidence only"],
    ["consent", "Buyer acceptance", "Immutable terms receipt"],
    ["rebuild", "Prepare and review again", "Earlier consent stays fixed"],
  ], [
    ["Unchanged proposal", ["catalog", "quote", "review", "publish", "consent"], "Approval and consent refer to the same terms", "The catalog supplies prices. Review covers the proposal, including its payment schedule and legal text. The buyer accepts that exact published version."],
    ["Edit before acceptance", ["quote", "review", "rebuild"], "The earlier approval no longer authorizes publication", "A price, policy, clause or source change requires a current proposal and its required approvals. Stale versions fail validation."],
    ["Edit after acceptance", ["consent", "rebuild"], "An accepted snapshot is preserved", "A later catalog edit cannot rewrite signed terms. A subsequent commercial change needs its own agreement and consent."],
  ]),
  procurement: flow("07", "A strategic renewal has dependencies", "Choose the procurement state", [
    ["plan", "Negotiation plan", "Stakeholders + accountable owners"],
    ["security", "Upstream review", "Evidence for procurement"],
    ["procure", "Procurement decision", "Dependent work completed"],
    ["approve", "Quote approvals", "Current commercial evidence"],
    ["publish", "Publish and accept", "Buyer reviews exact terms"],
    ["reopen", "Reopen downstream work", "Publication and consent blocked"],
  ], [
    ["Dependencies complete", ["plan", "security", "procure", "approve", "publish"], "The quote can proceed once its dependencies hold", "An executive brief explains decisions, owners and blockers. It does not substitute for completed procurement steps or buyer acceptance."],
    ["Upstream review reopens", ["security", "reopen"], "Downstream completion is no longer sufficient", "Reopening an upstream dependency reopens dependent work. Previously completed checklist items cannot silently authorize publication or acceptance."],
    ["Negotiation changes terms", ["procure", "approve"], "Recheck the commercial proposal", "A relationship conversation can shape the recommendation. The resulting terms still pass the quote's commercial and legal controls."],
  ]),
  burndown: flow("08", "Project from the last trusted observation", "Choose the telemetry condition", [
    ["ledger", "Reconciled ledger", "Opening balance + usage + credits"],
    ["coverage", "Coverage check", "Complete, current, nonconflicting"],
    ["rate", "Recent net burn rate", "Last 30 complete days"],
    ["project", "Term-end projection", "Observed balance + future burn"],
    ["risk", "Owned risk case", "Shortfall or early depletion"],
    ["hold", "Withhold the projection", "Resolve missing evidence"],
  ], [
    ["Complete ledger", ["ledger", "coverage", "rate", "project", "risk"], "A projection carries its coverage boundary", "The worked example uses $45,000 consumed, $250 per day and 180 remaining days: $90,000 projected against a $120,000 commitment. This is a deterministic scenario."],
    ["Missing observation", ["ledger", "coverage", "hold"], "A gap is not zero usage", "Missing days, stale telemetry, conflicting event IDs or an unverified opening balance create a data hold. A plausible chart cannot repair those inputs."],
    ["Credit arrives", ["ledger", "coverage", "rate"], "Reconcile net consumption before projecting", "A negative credit adjusts the ledger. Identical events deduplicate; conflicting content or a stale source version is rejected."],
  ]),
  intervention: flow("09", "Closing tasks is not proof of recovery", "Choose the recovery evidence", [
    ["case", "Risk baseline", "Source fingerprint + owner"],
    ["plan", "Approved playbook", "Explicit actions and goals"],
    ["work", "Complete the work", "Evidence for each action"],
    ["observe", "New observations", "Changed source + seven days"],
    ["review", "Fresh on-track scan", "Reviewer records the outcome"],
    ["open", "Keep the case open", "Missing or stale evidence"],
  ], [
    ["Evidence supports closure", ["case", "plan", "work", "observe", "review"], "Close against new observations", "Commitment recovery needs completed actions, a new data version, at least seven days, a fresh on-track scan and a review note. The original baseline remains available."],
    ["Tasks done, no new data", ["case", "plan", "work", "open"], "Completion of work does not establish recovery", "The case stays open until the observation window and data requirements are met. Task counts cannot manufacture a customer outcome."],
    ["Evidence changed", ["observe", "open"], "Refresh the scan before deciding", "The case fingerprint includes source evidence and the business date. Changed evidence makes an earlier scan insufficient for closure."],
  ]),
  rightsize: flow("10", "Choose the next commitment deliberately", "Choose a commercial option", [
    ["evidence", "Current usage picture", "Coverage + utilization + risk"],
    ["option", "Select commitment", "Renew, rightsize or expand"],
    ["standard", "Standard policy path", "Unchanged amount within limit"],
    ["publish", "Publish current offer", "Versioned amount and term"],
    ["accept", "Buyer accepts", "New pool starts at term start"],
    ["review", "Deal Desk approval", "Resized, expanded or above limit"],
  ], [
    ["Keep the amount", ["evidence", "option", "standard", "publish", "accept"], "An unchanged eligible commitment can follow standard policy", "The demo supports an unchanged commitment within its configured standard limit. Data quality, buyer authority and current terms remain required."],
    ["Right size", ["evidence", "option", "review", "publish", "accept"], "A lower commitment is a reviewed commercial choice", "The fixture's 80% option requires Deal Desk. A low projection supplies evidence for a conversation; it does not automatically authorize a concession."],
    ["Expand", ["evidence", "option", "review", "publish", "accept"], "A capacity signal does not amend the contract", "The 125% option requires review and explicit consent. At activation the prior ledger is archived and the new commitment begins at zero consumed."],
  ]),
  payg: flow("11", "Lower spend can mean better efficiency", "Choose an observed pattern", [
    ["weeks", "Complete usage weeks", "Fixed reference + recent window"],
    ["compare", "Compare outcomes", "Jobs, spend and units"],
    ["decline", "Adoption investigation", "Jobs below reference threshold"],
    ["efficient", "Efficiency recognized", "Outcomes hold; spend falls"],
    ["review", "Workload review", "Other units decline"],
    ["unknown", "Unknown: data hold", "Insufficient or stale coverage"],
  ], [
    ["Jobs fall sharply", ["weeks", "compare", "decline"], "Investigate loss of useful activity", "The fixture flags successful jobs below 70% of the fixed reference. An owner investigates the customer's workload before choosing an intervention."],
    ["Jobs hold, spend falls", ["weeks", "compare", "efficient"], "Lower spend can coexist with retained value", "At least 90% of reference jobs with spend below 80% is treated as efficiency. Retention does not require restoring the old bill."],
    ["Other units fall", ["weeks", "compare", "review"], "Investigate a change in workload", "A separate units decline can warrant review even when the jobs/spend rules do not indicate the same condition."],
    ["Incomplete weeks", ["weeks", "unknown"], "Withhold a health judgment", "Gaps, duplicate periods, stale observations or a nonpositive reference create unknown health. The dashboard must expose uncertainty."],
  ]),
  cancellation: flow("12", "Cancellation needs its own state machine", "Choose the customer's decision", [
    ["request", "Buyer requests exit", "Record reason + current term"],
    ["owner", "Account owner responds", "Suppress renewal outreach"],
    ["save", "Existing-terms save plan", "No automatic price concession"],
    ["stay", "Buyer accepts save", "Explicit decision recorded"],
    ["end", "Confirm end of term", "Resolve future agreement first"],
    ["terminate", "Effective termination", "Billing + access reconciled"],
  ], [
    ["Customer chooses to stay", ["request", "owner", "save", "stay"], "A save requires a customer decision", "An owner can propose an adoption or service plan on existing terms. The buyer explicitly accepts it or withdraws the cancellation."],
    ["Customer leaves", ["request", "owner", "end", "terminate"], "Churn is recorded when termination takes effect", "Confirmation schedules the exit. At the effective date both simulated targets become inactive. Silence or an expired quote is not an effective churn event."],
    ["Future agreement exists", ["request", "owner"], "Resolve the accepted future agreement separately", "Cancellation cannot silently undo an already accepted future renewal. Its obligations need their own explicit resolution before the exit proceeds."],
  ]),
  winback: flow("13", "A return is a new agreement", "Choose the return stage", [
    ["churn", "Terminated account", "Verified effective exit"],
    ["proposal", "Return proposal", "Existing products and price"],
    ["review", "Deal Desk review", "Current return terms"],
    ["buyer", "Buyer accepts return", "Products + dates + consent"],
    ["activate", "Reconcile both targets", "Verify billing and access"],
    ["handoff", "New post-sale plan", "Record the return outcome"],
  ], [
    ["Contract customer returns", ["churn", "proposal", "review", "buyer", "activate", "handoff"], "A return has review, consent and fulfillment", "The synthetic return offer uses existing products and annual price. Approval and a buyer decision precede reactivation and a fresh post-sale plan."],
    ["PAYG customer returns", ["churn", "proposal", "review", "buyer", "activate", "handoff"], "Resume consumption without inventing a renewal", "A PAYG return resumes ongoing consumption. It does not create an annual commitment or a fictional expiry date."],
    ["One target is missing", ["buyer", "activate"], "A promise to return is not verified reactivation", "Preserve the accepted return and reconcile provider state. Finish only after both required target states match."],
  ]),
  handoff: flow("14", "Turn a sale into an outcome plan", "Choose the milestone evidence", [
    ["agreement", "Accepted agreement", "Preserved scope + consent"],
    ["handoff", "Confirm the handoff", "Owner acknowledges responsibility"],
    ["kickoff", "Goals and kickoff", "Customer outcome defined"],
    ["integrate", "Integration milestone", "Prerequisites + blocker evidence"],
    ["outcome", "First useful outcome", "Observed result + review"],
    ["blocked", "Blocked milestone", "Named owner + next action"],
  ], [
    ["Milestones supported", ["agreement", "handoff", "kickoff", "integrate", "outcome"], "Progress requires evidence at each dependency", "The handoff is explicitly confirmed. Kickoff precedes integration; integration precedes the first useful outcome. Proposed goals do not alter contract promises."],
    ["Integration blocked", ["kickoff", "integrate", "blocked"], "Keep the blocker visible and owned", "A milestone cannot complete with unresolved blockers or missing prerequisites. The queue identifies who must supply the next piece of evidence."],
    ["Outcome claimed early", ["kickoff", "blocked"], "A status update is not outcome evidence", "A first-outcome claim needs its earlier milestones and supporting observations. It cannot bypass the integration dependency."],
  ]),
  partner: flow("15", "Delegate the work, retain the decision", "Choose the assignment condition", [
    ["source", "Source workflow task", "Current version + prerequisites"],
    ["assign", "Scoped assignment", "Eligible task + instructions"],
    ["partner", "Partner submits evidence", "Assigned account and task only"],
    ["review", "Internal reviewer", "Accept or return the submission"],
    ["complete", "Source task progresses", "Domain checks still apply"],
    ["deny", "Assignment denied", "Authority or scope mismatch"],
  ], [
    ["Integration evidence", ["source", "assign", "partner", "review", "complete"], "The partner supplies evidence for an internal decision", "The partner can work on an eligible assigned integration task. An internal reviewer assesses the submission, and the source workflow retains its prerequisites."],
    ["Commercial approval", ["source", "assign", "deny"], "Approval authority is not delegated to a partner", "Commercial approval, buyer consent and internal outcome signoff stay with their authorized roles. A queue assignment cannot expand those permissions."],
    ["Different account", ["partner", "deny"], "Account scope applies to objects as well as screens", "A scoped partner cannot use another account's object ID to read or change its work. A hidden button alone would not enforce this boundary."],
  ]),
  conversation: flow("16", "A message is part of the workflow", "Choose a delivery or reply event", [
    ["draft", "Draft from current facts", "Template + source evidence"],
    ["approve", "Approve exact content", "Current version + recipient"],
    ["deliver", "Deliver and reconcile", "Stable action + receipt"],
    ["reply", "Customer replies", "Deduplicated inbound event"],
    ["task", "Owned follow-up task", "Resolve with a recorded answer"],
    ["stop", "Hold delivery", "Stale approval or suppression"],
  ], [
    ["Question after delivery", ["draft", "approve", "deliver", "reply", "task"], "The reply becomes accountable work", "A customer's question creates an owned task. Recording a resolution preserves the reply and response context; the message itself cannot accept a contract."],
    ["Terms change", ["draft", "approve", "stop"], "Earlier approval cannot travel to new content", "Check current evidence and approval before delivery. A changed proposal can make the earlier reminder inappropriate."],
    ["Cancellation requested", ["approve", "stop"], "Suppression is checked at the point of delivery", "A queued reminder must honor the customer's cancellation or suppression state, even if its draft was previously approved."],
  ]),
  invoices: flow("17", "Keep the money states separate", "Choose the financial stage", [
    ["source", "Accepted or observed", "Agreement or PAYG usage"],
    ["invoice", "Capture immutable invoice", "Currency + schedule + source"],
    ["reserve", "Reserve payment amount", "Due date + remaining balance"],
    ["provider", "Provider records payment", "Independent simulated receipt"],
    ["reconcile", "Reconcile collection", "Confirm the existing write"],
    ["dispute", "Dispute and resolution", "Pause new collection; review"],
  ], [
    ["Acknowledgement lost", ["source", "invoice", "reserve", "provider", "reconcile"], "Read the receipt before charging again", "The fixture records the payment and loses the acknowledgement. The amount stays reserved until reconciliation confirms that same receipt."],
    ["Future installment", ["source", "invoice"], "A scheduled invoice is not due cash", "Accepted future terms can produce a scheduled invoice. Payment is blocked until its issue date; repeated capture preserves the original document."],
    ["Payment disputed", ["reconcile", "dispute"], "A dispute is not another discount", "Open disputes pause new collection and reminders for that invoice. Upholding a dispute reverses the reviewed amount and reopens the balance."],
  ]),
  refund: flow("18", "Reserve the allowance before issuing credit", "Choose a credit outcome", [
    ["request", "Refund request", "Reason + amount + event ID"],
    ["reserve", "Reserve allowance", "Pending requests count"],
    ["review", "Finance review", "Version + rationale"],
    ["credit", "Provider credit", "Stable action identity"],
    ["receipt", "Reconcile receipt", "One verified credit"],
    ["release", "Release reservation", "Rejected or cancelled request"],
  ], [
    ["Credit acknowledged late", ["request", "reserve", "review", "credit", "receipt"], "Confirm the original credit", "A lost acknowledgement leaves one provider record. Reconciliation recovers its result without another credit, even if a later policy change blocks new submissions."],
    ["Finance rejects", ["request", "reserve", "review", "release"], "Rejection restores available allowance", "Pending and approved requests reserve the same finite allowance. Rejection or cancellation releases that reservation."],
    ["Duplicate request", ["request", "reserve"], "Event identity prevents duplicate reservation", "An identical event is a harmless replay. Reusing the event ID with different content is rejected rather than treated as a second request."],
  ]),
  allocation: flow("19", "Trace every allocated cent to signed service", "Choose an allocation source", [
    ["terms", "Accepted service terms", "Inclusive dates + net service"],
    ["days", "Allocate service days", "Monthly cumulative fractions"],
    ["round", "Round cumulative amounts", "Exact integer cents"],
    ["schedule", "Preserve monthly schedule", "Totals match signed source"],
    ["credit", "Unused-service credit", "Separate negative schedule"],
    ["exclude", "Exclude other amounts", "Tax, goodwill, PAYG, commitments"],
  ], [
    ["Subscription service", ["terms", "days", "round", "schedule"], "Monthly cents add back to the source", "Cumulative rounding assigns month-by-month differences from the rounded cumulative total. This avoids losing a cent in every independent monthly rounding."],
    ["Unused service credited", ["credit", "days", "round", "schedule"], "Keep the credit's service schedule separate", "Unused-service credits produce their own negative schedules. Netting them invisibly into another contract would obscure the source."],
    ["Usage or goodwill", ["terms", "exclude"], "This allocator has a limited domain", "The demo excludes tax, goodwill refunds, PAYG usage and consumption commitments. It is operational service allocation, not statutory revenue recognition."],
  ]),
  agent: flow("20", "A planner proposes; the executor authorizes", "Choose a plan condition", [
    ["packet", "Scoped evidence packet", "Known accounts + fingerprint"],
    ["planner", "Provider adapter", "Structured plan proposal"],
    ["validate", "Validate plan boundary", "Tools, scope, size, uniqueness"],
    ["execute", "Domain executor", "Current authority + source checks"],
    ["record", "Record each step", "Result or rollback reason"],
    ["reject", "Reject the proposal", "No forbidden action executes"],
  ], [
    ["Permitted plan", ["packet", "planner", "validate", "execute", "record"], "Useful work runs through existing domain controls", "The executor permits risk scanning, standard preparation, check-in drafting and opening a handoff. Each step retains its result or failure reason."],
    ["Accept for the buyer", ["planner", "validate", "reject"], "Fluent output does not grant authority", "Buyer acceptance, message approval, commercial approval, termination and arbitrary code execution are outside the tool allowlist."],
    ["Evidence changes", ["validate", "execute", "reject"], "A plan cannot act on superseded facts", "The evidence fingerprint is checked again before execution. A changed source invalidates the unexecuted plan rather than silently broadening it."],
  ]),
  scheduler: flow("21", "The worker needs durable memory", "Choose a job event", [
    ["due", "Persisted due time", "Workspace + business date"],
    ["claim", "Conditional workspace edit", "Recheck due time and expiry"],
    ["run", "Run bounded due work", "Results stored with the job"],
    ["done", "Committed tick", "Repeated date is idempotent"],
    ["retry", "Retry eligible failure", "Retain attempt and cause"],
    ["dead", "Dead-letter job", "Operator resolves and retries"],
  ], [
    ["Two workers see due work", ["due", "claim", "run", "done"], "The committed due time decides who proceeds", "A competing worker rechecks the persisted state. It cannot repeat an already committed tick merely because its earlier read saw work due."],
    ["Recoverable job failure", ["run", "retry"], "Keep the result and the next recovery decision", "A failed job retains its cause and attempt count. Retrying still uses the same domain checks and action identities."],
    ["Attempts exhausted", ["run", "retry", "dead"], "Stop automatic retries and expose an owner", "After the demo's bounded attempts, the job becomes a dead letter. An operator resolves the cause before replay."],
  ]),
  evals: flow("22", "Test the boundary before changing a provider", "Choose an evaluation condition", [
    ["cases", "Offline case set", "Valid, forbidden, stale, malformed"],
    ["fixture", "Candidate plan fixture", "No paid model call"],
    ["validate", "Real validation path", "Disposable execution state"],
    ["observe", "Inspect effects", "Allowed work + forbidden absence"],
    ["gate", "Review release evidence", "Compare with baseline"],
    ["fail", "Regression visible", "Application controls stay intact"],
  ], [
    ["Baseline fixture", ["cases", "fixture", "validate", "observe", "gate"], "A passing run is bounded evidence", "Cases exercise actual validation and disposable execution. The displayed gate is evidence for review; it does not automatically block a deployment pipeline."],
    ["Broken tool names", ["cases", "fixture", "validate", "fail"], "The regression should fail without relaxing controls", "The deliberately broken fixture corrupts otherwise valid tool names. Rejection demonstrates that the candidate changed, not that the executor accepted forbidden tools."],
    ["Real model comparison", ["observe", "gate"], "Offline fixtures leave live questions unanswered", "Live wording quality, refusals, tokens, latency and paid cost need separate representative evaluation. Zero-cost fixture timing does not answer them."],
  ]),
  forecast: flow("23", "Forecast from the state of the work", "Choose a forecast question", [
    ["records", "Contract + usage states", "Amounts, dates, source versions"],
    ["buckets", "Separate forecast buckets", "Agreed, offered, risk, unknown"],
    ["snapshot", "Save weekly snapshot", "As-of date + horizon + evidence"],
    ["outcome", "Match effective outcomes", "Stable outcome identity"],
    ["compare", "Review calibration", "Resolve what actually happened"],
    ["unresolved", "Keep unresolved rows", "Overdue is not confirmed churn"],
  ], [
    ["Outcome arrives later", ["records", "buckets", "snapshot", "outcome", "compare"], "Preserve the forecast that existed at the time", "A later outcome is compared with the saved rows. Refreshing today's dashboard must not rewrite last week's expectation."],
    ["Record is unverified", ["records", "buckets"], "Unknown belongs in the forecast", "Unverified contracts and incomplete usage remain explicit exclusions or uncertainty. They should not disappear inside an optimistic total."],
    ["Due date passes", ["snapshot", "unresolved"], "An overdue row is still unresolved", "Calibration waits for a confirmed effective outcome. A late contract is not automatically assigned a churn label."],
  ]),
  model: flow("24", "Separate fitting, calibration and scoring", "Choose the modeling stage", [
    ["history", "Synthetic dated history", "360 distinct cases; fixed seed"],
    ["fit", "Fit on oldest 240", "Usage, engagement, friction"],
    ["calibrate", "Calibrate on next 60", "Intercept adjustment"],
    ["test", "Score final 60", "Held-out Brier + reliability bins"],
    ["freeze", "Freeze forecast evidence", "Model ID + features + currency"],
    ["unknown", "Withhold prediction", "Incomplete or unverified source"],
  ], [
    ["Train and score", ["history", "fit", "calibrate", "test", "freeze"], "The test cases remain outside fitting", "The synthetic generator is deliberately learnable. Held-out scoring checks this experiment's machinery, not accuracy on real renewal decisions."],
    ["Usage sensitivity", ["test", "freeze"], "A changed input is a scenario", "A usage sensitivity snapshot preserves the model and altered features. It does not establish that causing more usage would cause renewal."],
    ["Missing trusted usage", ["history", "unknown"], "A model is not a replacement for source reconciliation", "The application withholds predictions where the contract or required usage cannot be trusted. Exclusions remain visible."],
  ]),
  portfolio: flow("25", "Stress the workflow across renewal cycles", "Choose a simulated operating condition", [
    ["seed", "Disposable cohort", "Seed + accounts + cycle count"],
    ["cycle", "Actual domain functions", "Prepare, accept, fulfill, promote"],
    ["provider", "Synthetic provider events", "Outages + receipts + payments"],
    ["check", "Check invariants", "Balances, duplicates, recovery"],
    ["report", "Bounded evidence report", "Digest + sampled histories"],
    ["backlog", "Unresolved outage backlog", "Do not label as completed"],
  ], [
    ["Recover outages", ["seed", "cycle", "provider", "check", "report"], "Exercise workflow invariants across cycles", "Decisions and providers are simulated while the actual domain functions run. Report observations separately from any claim about customer behavior."],
    ["Leave outages unresolved", ["seed", "cycle", "provider", "backlog"], "Backlog remains part of the result", "When recovery is disabled, unresolved actions remain dead letters. Successful accounts cannot hide unfinished work elsewhere in the cohort."],
    ["Repeat identical inputs", ["check", "report"], "Evidence identity excludes elapsed time", "Identical inputs and business dates produce the same evidence digest. This sequential experiment is not a concurrent HTTP or AWS capacity benchmark."],
  ]),
  architecture: flow("26", "The hosted demo: two paths through AWS", "Choose an infrastructure path", [
    ["browser", "Browser", "Isolated synthetic workspace"],
    ["edge", "CloudFront + AWS WAF", "HTTPS + origin access control"],
    ["assets", "Private Amazon S3", "Static application assets"],
    ["api", "API Lambda", "IAM-authenticated function URL"],
    ["data", "Amazon DynamoDB", "Versioned workspace + due index"],
    ["schedule", "EventBridge Scheduler", "One-minute worker trigger"],
    ["worker", "Worker Lambda", "Bounded due-work processing"],
    ["dlq", "Amazon SQS", "Failed schedule delivery"],
    ["logs", "CloudWatch", "Function logs and alarms"],
  ], [
    ["Load the application", ["browser", "edge", "assets"], "CloudFront serves private static assets", "Origin access control restricts the S3 origin. The public page creates an isolated synthetic workspace through the API path."],
    ["Change workspace state", ["browser", "edge", "api", "data"], "Uncached API requests reach a protected origin", "The function URL uses AWS_IAM and CloudFront origin access control. Conditional workspace writes preserve versions; billing and identity remain simulated."],
    ["Run scheduled work", ["schedule", "worker", "data"], "An isolated worker queries due work", "A one-minute scheduler trigger invokes a worker with access to the due-work index. The worker rechecks due time and expiry before committing."],
    ["Schedule delivery fails", ["schedule", "dlq"], "Infrastructure delivery failures have their own queue", "The SQS dead-letter queue covers failed scheduler delivery after configured retries. Application job failures are recorded separately inside workspace state."],
    ["Inspect function signals", ["api", "logs"], "Operational signals complement business evidence", "CloudWatch receives function logs and alarms. Separate S3 access/WAF logs and CloudTrail management-event records are described in the article."],
  ]),
  sources: flow("27", "Treat an imported record as a proposal", "Choose an incoming envelope", [
    ["envelope", "Staged source envelope", "Event ID + mapping + digest"],
    ["validate", "Validate source boundary", "Account, version, identity, terms"],
    ["apply", "Apply current evidence", "Conditional source update"],
    ["receipt", "Preserve import result", "Replay deduplicated"],
    ["quarantine", "Quarantine the batch", "Named reason; no source change"],
    ["reconcile", "Resolve and restage", "Fresh mapping and source"],
  ], [
    ["Valid current envelope", ["envelope", "validate", "apply", "receipt"], "An import has a recorded source transition", "The batch binds its mapping and source fingerprint. Identical event replay preserves the existing result instead of advancing the source version."],
    ["Conflicting identity", ["envelope", "validate", "quarantine", "reconcile"], "A plausible payload can still be unsafe to apply", "Changed mappings, stale versions, identity conflicts or accepted terms cause quarantine. Resolve the reason before restaging."],
    ["Already accepted terms", ["envelope", "validate", "quarantine"], "A connector cannot rewrite buyer consent", "An authoritative feed must still respect accepted snapshots. Correcting an operational record and replacing a signed agreement are different actions."],
  ]),
  restore: flow("28", "Recover business state without reviving access", "Choose a recovery condition", [
    ["incident", "Incident acknowledged", "Owner + affected action"],
    ["checkpoint", "Select checkpoint", "Checksum + current revision"],
    ["verify", "Validate restoration", "Explicit confirmation"],
    ["restore", "Restore synthetic records", "Stop background worker"],
    ["preserve", "Preserve access revocations", "Identity + action + restore history"],
    ["external", "Reconcile external effects", "Production integration requirement"],
  ], [
    ["Synthetic restoration", ["incident", "checkpoint", "verify", "restore", "preserve"], "Restoring data does not restore revoked authority", "The demo restores bounded synthetic business records while preserving identities, revocations and the action chain. It stops the worker so it cannot immediately repeat the action."],
    ["Checkpoint changed", ["checkpoint", "verify"], "Fail before mutating current state", "Checksum and expected-revision checks must pass. A stale restore request is not permission to replace newer work."],
    ["Real provider was called", ["restore", "external"], "Database rollback cannot undo a remote effect", "A production recovery plan must inspect each provider's actual state and explicitly reconcile or compensate it. The synthetic checkpoint cannot demonstrate that integration."],
  ]),
};

// Architecture uses a purpose-built topology rather than a sequential workflow.
seriesExplorers.architecture.topology = {
  width: 1040, height: 780,
  positions: [[28,74],[380,74],[732,74],[380,250],[732,250],[28,452],[380,452],[28,628],[732,452]],
  paths: [
    "M 308 115 H 380", "M 660 115 H 732",
    "M 520 156 V 250", "M 660 291 H 732",
    "M 308 493 H 380", "M 660 493 H 698 V 291 H 732",
    "M 168 534 V 628", "M 520 332 V 400 H 872 V 452",
  ],
};

export const seriesCovers = [
  ["series", null, ["Build the renewal system.", "Follow every decision."], "Software and API contract renewals · the complete series", ["Renew", "Retain", "Operate", "Verify"]],
  ["exceptions", 2, ["When the Standard", "Path Ends"], "Terms, approvals and the people who own exceptions.", ["Detect", "Route", "Review", "Agree"]],
  ["consumption", 3, ["Renewing a Commitment", "When Usage Changes"], "Turn a trusted usage picture into a deliberate offer.", ["Observe", "Project", "Act", "Review"]],
  ["retention", 4, ["Retention Beyond", "the Renewal Date"], "PAYG value, cancellation, save plans and a return.", ["Notice", "Respond", "Decide", "Verify"]],
  ["post-sale", 5, ["The Work", "After the Sale"], "Handoffs, useful outcomes and accountable follow-up.", ["Handoff", "Build", "Observe", "Resolve"]],
  ["finance", 6, ["Follow", "the Money"], "Keep consent, invoices, collections and credits connected.", ["Invoice", "Reserve", "Collect", "Reconcile"]],
  ["agents", 7, ["Let Agents Work", "Within a Boundary"], "Structured plans, durable jobs and tested authority.", ["Plan", "Validate", "Execute", "Evaluate"]],
  ["forecasting", 8, ["Forecast the Business", "from the Work"], "Snapshots, outcomes and experiments with honest limits.", ["Capture", "Predict", "Observe", "Compare"]],
  ["operations", 9, ["From Demonstration", "to an Operational System"], "Architecture, identity, connectors and the path to a pilot.", ["Connect", "Authorize", "Recover", "Prove"]],
];

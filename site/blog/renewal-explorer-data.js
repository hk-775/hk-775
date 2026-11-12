// Shared, deterministic teaching scenarios. These do not execute renewals.
export const explorers = {
  journey: {
    number: "01", title: "One renewal, six checkpoints", prompt: "Choose a checkpoint",
    nodes: [
      ["record", "Contract record", "Verified terms + identity"],
      ["eligible", "Eligibility", "Current policy checks"],
      ["offer", "Versioned offer", "Price + term + expiry"],
      ["accept", "Buyer accepts", "Authority + exact version"],
      ["activate", "Term begins", "Billing + product access"],
      ["complete", "Verify completion", "Both provider states match"],
    ],
    edges: [["record", "eligible"], ["eligible", "offer"], ["offer", "accept"], ["accept", "activate"], ["activate", "complete"]],
    scenarios: [
      { label: "Whole flow", nodes: ["record", "eligible", "offer", "accept", "activate", "complete"], edges: [0, 1, 2, 3, 4], title: "From a trusted record to verified effects", detail: "Select a checkpoint to inspect its decision. A standard renewal connects contract validation, a versioned offer, buyer consent, activation at the effective date and verification of both provider outcomes." },
      { label: "1 · Contract", nodes: ["record"], edges: [], title: "Start with a trusted record", detail: "The account, contract version, billing identity, quantity, price and term dates must agree. A missing or unverified amendment goes to an owned data hold." },
      { label: "2 · Eligibility", nodes: ["record", "eligible"], edges: [0], title: "Decide whether the standard path applies", detail: "Policy checks cover the record, supported arrangement, commercial limits, open issues, buyer authority, billing identity and offer timing." },
      { label: "3 · Offer", nodes: ["eligible", "offer"], edges: [1], title: "Make a specific proposal", detail: "The offer names its version, annual amount, next term and expiry. Commercial values come from validated contract data and policy; generated language is not pricing authority." },
      { label: "4 · Acceptance", nodes: ["offer", "accept"], edges: [2], title: "Bind consent to the exact offer", detail: "An authorized buyer confirms the terms. The service rechecks eligibility, offer version and validity before recording acceptance." },
      { label: "5 · Activation", nodes: ["accept", "activate"], edges: [3], title: "Wait for the effective date", detail: "An accepted future renewal stays scheduled. At the next term start, billing and product access each need their own verified outcome." },
      { label: "6 · Completion", nodes: ["activate", "complete"], edges: [4], title: "Verify the effects", detail: "Completion requires matching billing and access state. A successful offer or acceptance alone does not close the operational work." },
    ],
  },
  eligibility: {
    number: "02", title: "Which path should this account take?", prompt: "Choose an account condition",
    nodes: [
      ["record", "Contract + account", "Inputs checked together"],
      ["policy", "Eligibility checks", "Seven policy checks"],
      ["ready", "Standard offer", "All checks pass"],
      ["review", "Commercial review", "Deal Desk owns the case"],
      ["hold", "Data hold", "Revenue Operations owns it"],
    ],
    edges: [["record", "policy"], ["policy", "ready"], ["policy", "review"], ["policy", "hold"]],
    scenarios: [
      { label: "Standard terms", nodes: ["record", "policy", "ready"], edges: [0, 1], title: "Ready for a standard offer", detail: "The verified contract is within configured limits, the buyer and billing identity are valid, and no negotiation, dispute or cancellation blocks the offer." },
      { label: "Custom negotiation", nodes: ["record", "policy", "review"], edges: [0, 2], title: "Route to commercial review", detail: "An open negotiation or a value above the standard limit exits the automatic path. Deal Desk receives the failed checks and recommended next action." },
      { label: "Unverified amendment", nodes: ["record", "policy", "hold"], edges: [0, 3], title: "Hold until the record is trusted", detail: "An unverified contract record or mismatched billing identity creates a data hold for Revenue Operations. Preparing fluent offer text would not resolve the missing evidence." },
    ],
  },
  consent: {
    number: "03", title: "Acceptance is a checkpoint, too", prompt: "Choose an acceptance condition",
    nodes: [
      ["offer", "Current offer", "Version + validity"],
      ["check", "Acceptance checks", "Buyer + consent + policy"],
      ["blocked", "Reject acceptance", "No new agreement"],
      ["accepted", "Record agreement", "Exact offer + terms"],
      ["scheduled", "Schedule next term", "No early activation"],
      ["activate", "Activate at start", "Verify both effects"],
    ],
    edges: [["offer", "check"], ["check", "blocked"], ["check", "accepted"], ["accepted", "scheduled"], ["scheduled", "activate"]],
    scenarios: [
      { label: "View-only visitor", nodes: ["offer", "check", "blocked"], edges: [0, 1], title: "Viewing an offer is not permission to accept", detail: "A view-only session cannot create acceptance. The service requires the buyer role and matching account scope." },
      { label: "Offer changed", nodes: ["offer", "check", "blocked"], edges: [0, 1], title: "The previous version cannot be accepted", detail: "A stale version or changed contract or policy fails validation. The buyer must review a current offer; earlier consent cannot silently move to different terms." },
      { label: "Buyer confirms", nodes: ["offer", "check", "accepted", "scheduled"], edges: [0, 2, 3], title: "Accepted now, scheduled for later", detail: "The authorized buyer confirms the current offer. Acceptance is recorded, while billing and access wait for the next term start." },
      { label: "Term starts", nodes: ["accepted", "scheduled", "activate"], edges: [3, 4], title: "Now activation is due", detail: "Once the effective date arrives, the accepted agreement becomes eligible for fulfillment. Each provider outcome still needs verification." },
    ],
  },
  recovery: {
    number: "04", title: "Billing succeeds. Access fails. What next?", prompt: "Run the local example",
    nodes: [
      ["accepted", "Accepted agreement", "Effective date reached"],
      ["billing", "Billing updated", "One successful update"],
      ["access", "Access update fails", "First attempt interrupted"],
      ["reconcile", "Reconcile state", "Billing already matches"],
      ["retry", "Retry missing access", "Second access attempt"],
      ["complete", "Renewal complete", "Both outcomes verified"],
    ],
    edges: [["accepted", "billing"], ["billing", "access"], ["access", "reconcile"], ["reconcile", "retry"], ["retry", "complete"]],
    scenarios: [
      { label: "Before activation", nodes: ["accepted"], edges: [], title: "The agreement is ready", detail: "The effective date has arrived. No billing or access updates have run in this local example.", metrics: [0, 0, 0], state: "accepted" },
      { label: "Run activation", nodes: ["accepted", "billing", "access"], edges: [0, 1], title: "Recovery required", detail: "Billing succeeded; the first access attempt failed. Preserve the agreement and completed billing step. Revenue Operations owns the recovery task.", metrics: [1, 1, 0], state: "recovery_required" },
      { label: "Retry access", nodes: ["billing", "reconcile", "retry", "complete"], edges: [2, 3, 4], title: "Complete after reconciliation", detail: "Read the existing billing state, skip the matching update, then retry access. The example ends with one billing update and one successful access update across two access attempts.", metrics: [1, 2, 1], state: "complete" },
    ],
  },
};

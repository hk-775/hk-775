// Opt-in public synthetic-demo replay. Not loaded by the blog or CI.
// Records only explicitly selected observations, never raw workspace state.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (!process.argv.includes("--capture")) throw new Error("Pass --capture to run synthetic workflows in fresh isolated sessions.");
const base = "https://d11wfkflwovvog.cloudfront.net";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const flag = process.argv.indexOf("--output");
const output = flag < 0 ? resolve(root, "site/blog/evidence/renewal-series.json") : resolve(process.argv[flag + 1]);
const sha = value => createHash("sha256").update(value).digest("hex");
const cookies = new Map(), checks = [];
const observed = new Date().toISOString();
let csrf, state, sessions = 0;
async function request(path, body, expected = 200) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const response = await fetch(base + path, {
    method: payload === undefined ? "GET" : "POST", redirect: "error",
    signal: AbortSignal.timeout(60000),
    headers: {
      ...(cookies.size ? { Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join("; ") } : {}),
      ...(payload === undefined ? {} : { Origin: base, "Content-Type": "application/json",
        "X-CSRF-Token": csrf, "X-Amz-Content-Sha256": sha(payload) }),
    }, body: payload,
  });
  assert.equal(response.status, expected, `Unexpected HTTP status for ${path}`);
  for (const item of response.headers.getSetCookie()) {
    const pair = item.split(";")[0], i = pair.indexOf("=");
    cookies.set(pair.slice(0,i), pair.slice(i+1));
  }
  return response;
}
async function fresh() {
  cookies.clear();
  state = await (await request("/api/state")).json();
  csrf = state.csrf;
  assert.ok(csrf);
  assert.equal(state.provider, "fixture");
  assert.equal(state.metrics.model_calls, 0);
  assert.equal(state.clock, "2026-11-10");
  sessions++;
}
async function post(path, body = {}, expected = 200) {
  const result = await (await request(`/api${path}`, body, expected)).json();
  if (expected === 200) state = result;
  return result;
}
const record = (part, check, observations) => {
  checks.push({ part, check, passed: true, ...observations });
  console.log(`Part ${part}: ${check} — passed`);
};
const standard = () => Object.entries(state.accounts).find(([,a]) =>
  a.scenario === "normal" && a.contract.verified && !a.contract.negotiation && a.contract.seats === 40)?.[0];
const operator = () => post("/persona", { persona: "operator" });
const buyer = key => post("/persona", { persona: "buyer", account_id: key });
const note = "Synthetic workflow evidence reviewed for the engineering series.";
const assets = [];
for (const path of ["/assets/app.js", "/assets/style.css"]) {
  assets.push({ path, sha256: sha(Buffer.from(await (await request(path)).arrayBuffer())) });
}

await fresh();
const custom = Object.entries(state.business.accounts).find(([,a]) => a.currency === "EUR" && a.contracts.length === 1)?.[0];
assert.ok(custom);
let account = state.business.accounts[custom];
await post(`/business/${custom}/prepare`, { version: account.version, contract_ids: account.contracts.map(c => c.id),
  lines: [{ product: "workspace", quantity: 20 }], months: 18, discount: 0, billing_frequency: "quarterly", net_days: 30 });
account = state.business.accounts[custom];
assert.equal(account.status, "pending_review");
assert.equal(account.quote.charge_cents, account.quote.annual_cents * 18 / 12);
record(2, "18-month custom quote has a distinct annual value and service charge", { term_months: 18, billing_frequency: "quarterly" });
await post(`/business/${custom}/review`, { version: account.version, decision: "approve", note }, 403);
record(2, "operator cannot supply Deal Desk approval", { http_status: 403 });
await post("/persona", { persona: "deal_desk" });
await post(`/business/${custom}/review`, { version: state.business.accounts[custom].version, decision: "approve", note });
assert.equal(state.business.accounts[custom].status, "approved");
await operator();
await post(`/governance/${custom}/redline`, { version: state.business.accounts[custom].version, clause: "liability",
  text: "Fictional replacement clause for a synthetic approval-version exercise." });
assert.equal(state.business.accounts[custom].quote.approval, null);
await post(`/business/${custom}/publish`, { version: state.business.accounts[custom].version }, 409);
record(2, "clause edit invalidates earlier commercial approval and blocks publication", { http_status: 409 });

await fresh();
await post("/consumption/scan");
const commitmentRows = Object.values(state.consumption.accounts);
const shortfall = commitmentRows.find(a => a.assessment.signal === "shortfall" && a.commitment.amount_cents === 12_000_000);
assert.ok(shortfall);
assert.equal(shortfall.assessment.projected_cents, 9_000_000);
assert.equal(shortfall.assessment.shortfall_cents, 3_000_000);
assert.ok(shortfall.case);
record(3, "reconciled shortfall opens a case with a baseline", { currency: "USD", commitment_cents: 12_000_000, projected_cents: 9_000_000, shortfall_cents: 3_000_000 });
const held = commitmentRows.find(a => a.assessment.signal === "data_hold");
assert.ok(held?.assessment.issues.length);
assert.equal(held.assessment.projected_cents, null);
record(3, "incomplete or untrusted consumption withholds projection", { projected_cents: null, signal: "data_hold" });

await fresh();
await post("/retention/scan");
const payg = Object.values(state.retention.accounts);
assert.ok(payg.some(a => a.assessment.signal === "declining"));
assert.ok(payg.some(a => a.assessment.signal === "efficient"));
assert.ok(payg.some(a => a.assessment.signal === "data_hold"));
record(4, "PAYG distinguishes declining outcomes, efficiency and unknown health", { signals: ["declining", "efficient", "data_hold"] });
const cancelKey = standard();
assert.ok(cancelKey);
await buyer(cancelKey);
await post(`/departures/${cancelKey}/request`, { reason: "Synthetic customer requests an end-of-term exit." });
await operator();
assert.equal(state.departures.cases[cancelKey].status, "requested");
await post(`/departures/${cancelKey}/action`, { version: state.departures.cases[cancelKey].version, action: "save", note });
assert.equal(state.departures.cases[cancelKey].status, "save_offered");
const saveVersion = state.departures.cases[cancelKey].version;
await buyer(cancelKey);
await post(`/departures/${cancelKey}/consent`, { version: saveVersion, action: "save", confirmed: true });
await operator();
assert.equal(state.departures.cases[cancelKey].status, "saved");
record(4, "save requires an explicit buyer decision", { outcome: "saved" });

await fresh();
const planKey = Object.keys(state.post_sale.plans)[0];
await post(`/post-sale/${planKey}/complete`, { version: state.post_sale.plans[planKey].version, milestone: "first_value", note }, 409);
await post(`/post-sale/${planKey}/confirm`, { version: state.post_sale.plans[planKey].version, note });
await post(`/post-sale/${planKey}/complete`, { version: state.post_sale.plans[planKey].version, milestone: "first_value", note }, 409);
record(5, "first outcome cannot bypass handoff and milestone prerequisites", { http_status: 409 });
for (const milestone of ["kickoff", "integration", "first_value"])
  await post(`/post-sale/${planKey}/complete`, { version: state.post_sale.plans[planKey].version, milestone, note });
assert.equal(state.post_sale.plans[planKey].status, "complete");
record(5, "ordered milestones with evidence complete the post-sale plan", { outcome: "complete", completed_milestones: 3 });
const messageKey = standard();
await post(`/communications/${messageKey}/draft`, { template: "check_in" });
let message = state.conversations.messages.at(-1);
await post(`/messages/${message.id}/approve`, { version: message.version });
await post(`/messages/${message.id}/deliver`);
message = state.conversations.messages.at(-1);
assert.equal(message.status, "delivered");
await buyer(messageKey);
await post(`/communications/${messageKey}/reply`, { message_id: message.id, event_id: "series-question-1", intent: "question", text: "Please explain the synthetic renewal steps." });
await operator();
assert.equal(state.conversations.tasks.at(-1).status, "open");
assert.equal(state.accounts[messageKey].acceptance, null);
record(5, "delivered message reply creates owned work without contract acceptance", { task_status: "open", contract_accepted: false });

await fresh();
const invoiceKey = Object.keys(state.retention.accounts)[0];
await post("/collections/capture", { account_id: invoiceKey });
const invoice = state.collections.invoices.find(i => i.account_id === invoiceKey);
assert.ok(invoice);
const invoiceCount = state.collections.invoices.length;
await post("/collections/capture", { account_id: invoiceKey });
assert.equal(state.collections.invoices.length, invoiceCount);
record(6, "repeated PAYG invoice capture preserves original documents", { invoices: invoiceCount });
await post(`/collections/invoices/${invoice.id}/pay`, { amount_cents: 100, currency: invoice.currency,
  event_id: "series-payment-1", scenario: "lost_ack", confirmed: true });
let payment = Object.values(state.collections.payments).at(-1);
assert.equal(payment.status, "retry");
assert.equal(state.collections.invoices.find(i => i.id === invoice.id).reserved_cents, 100);
await post(`/collections/payments/${payment.id}/retry`);
payment = Object.values(state.collections.payments).at(-1);
assert.equal(payment.status, "complete");
assert.equal(Object.values(state.collections.provider).reduce((n,r) => n + r.writes, 0), 1);
record(6, "lost payment acknowledgement reconciles one provider write", { payment_cents: 100, provider_writes: 1 });
await post(`/collections/payments/${payment.id}/dispute`, { amount_cents: 50, reason: note });
const dispute = state.collections.disputes.at(-1);
await post(`/collections/disputes/${dispute.id}/review`, { version: dispute.version, decision: "upheld", note });
assert.equal(state.collections.invoices.find(i => i.id === invoice.id).paid_cents, 50);
record(6, "upheld partial dispute reverses the reviewed amount", { net_paid_cents: 50 });
const refundKey = standard();
await post(`/finance/${refundKey}/refund`, { amount_cents: 100, reason: note, event_id: "series-credit-1" });
let refund = state.finance.refunds.at(-1);
await post(`/finance/refunds/${refund.id}/review`, { version: refund.version, decision: "approve", note });
await post(`/finance/refunds/${refund.id}/execute`);
assert.equal(state.finance.refunds.at(-1).status, "retry");
await post(`/finance/refunds/${refund.id}/execute`);
assert.equal(state.finance.refunds.at(-1).status, "complete");
assert.equal(Object.keys(state.finance.receipts).length, 1);
record(6, "credit acknowledgement recovery preserves one receipt", { credit_receipts: 1, outcome: "complete" });

await fresh();
const agentKey = standard();
await post("/agents/plan", { accounts: [agentKey] });
let agentPlan = state.agents.plan;
assert.ok(agentPlan.steps.length > 0 && agentPlan.steps.length <= 6);
assert.ok(agentPlan.steps.every(s => ["scan_risk","prepare_standard","draft_check_in","open_handoff"].includes(s.tool)));
await post("/agents/execute", { plan_id: agentPlan.id, version: agentPlan.version });
assert.ok(state.agents.runs.at(-1).steps.every(s => s.status === "complete"));
assert.equal(state.accounts[agentKey].acceptance, null);
assert.equal(state.metrics.model_calls, 0);
record(7, "bounded fixture plan executes permitted work without buyer acceptance", { model_calls: 0, contract_accepted: false });
await post("/automation/tick", { advance: false });
const jobs = state.automation.jobs.filter(j => j.status === "complete").length;
await post("/automation/tick", { advance: false });
assert.equal(state.automation.jobs.filter(j => j.status === "complete").length, jobs);
assert.equal(state.automation.enabled, false);
record(7, "repeated due-work run preserves completed jobs for the business date", { completed_jobs: jobs, background_enabled: false });
await post("/evaluations/run", { regression: false });
const baseline = state.evaluations.runs.at(-1);
assert.equal(baseline.release_gate, true);
await post("/evaluations/run", { regression: true });
const regression = state.evaluations.runs.at(-1);
assert.equal(regression.release_gate, false);
assert.equal(regression.model_calls, 0);
record(7, "offline baseline passes and deliberate provider regression fails", {
  baseline_passed: baseline.passed, baseline_cases: baseline.total, regression_passed: regression.passed,
  regression_cases: regression.total, regression_gate: false, model_calls: 0,
});

await fresh();
await post("/forecasts/capture", { days: 365 });
const forecast = JSON.stringify(state.forecasts.snapshots);
await post("/forecasts/capture", { days: 365 });
assert.equal(JSON.stringify(state.forecasts.snapshots), forecast);
record(8, "same-week forecast capture preserves the saved snapshot", { snapshots: state.forecasts.snapshots.length });
await post("/predictions/train");
const model = state.predictions.model;
assert.deepEqual(model.partitions.map(p => p.count), [240,60,60]);
assert.ok(Number.isFinite(model.brier_score));
await post("/predictions/capture", { usage_delta: 15 });
assert.equal(state.predictions.snapshots.length, 1);
record(8, "synthetic model separates fitting, calibration and held-out scoring", {
  partition_counts: [240,60,60], held_out_brier: model.brier_score, baseline_brier: model.baseline_brier,
  sensitivity_snapshots: 1,
});
const clockBefore = state.clock, accountsBefore = JSON.stringify(state.accounts);
await post("/simulations/run", { accounts: 25, cycles: 2, seed: 775, usage_drift: -10, outage_percent: 15, outage_days: 7, recover: true });
assert.equal(state.clock, clockBefore);
assert.equal(JSON.stringify(state.accounts), accountsBefore);
const simulation = state.simulations.runs.at(-1);
assert.equal(simulation.invariants_passed, true);
assert.deepEqual(simulation.failures, []);
record(8, "25-account two-cycle experiment preserves the interactive workspace", {
  accounts: 25, cycles: 2, all_reported_invariants_passed: true, interactive_clock_preserved: true,
  limitation: "Sequential synthetic domain execution, not a capacity benchmark.",
});

await fresh();
const sourceKey = Object.entries(state.accounts).find(([,a]) => !a.contract.verified)?.[0];
assert.ok(sourceKey);
const contractBefore = JSON.stringify(state.accounts[sourceKey].contract);
await post("/connectors/stage", { account_id: sourceKey, scenario: "conflict" });
let batch = state.connectors.batches.at(-1);
await post(`/connectors/batches/${batch.id}/apply`);
assert.equal(state.connectors.batches.at(-1).status, "quarantined");
assert.equal(JSON.stringify(state.accounts[sourceKey].contract), contractBefore);
record(9, "conflicting source envelope is quarantined without changing the contract", { outcome: "quarantined" });
await post("/connectors/stage", { account_id: sourceKey, scenario: "clean" });
batch = state.connectors.batches.at(-1);
await post(`/connectors/batches/${batch.id}/apply`);
assert.equal(state.accounts[sourceKey].contract.verified, true);
const verifiedVersion = state.accounts[sourceKey].contract.version;
await post(`/connectors/batches/${batch.id}/apply`);
assert.equal(state.accounts[sourceKey].contract.version, verifiedVersion);
record(9, "reconciled source replay does not advance its version twice", { replay_preserves_version: true });
const restoreKey = standard();
await post("/resilience/backup", { note });
const backup = state.resilience.backups.at(-1);
await post(`/accounts/${restoreKey}/prepare`);
assert.ok(state.accounts[restoreKey].offer);
await post("/resilience/restore", { backup_id: backup.id, confirmed: true, expected_revision: state.revision });
assert.equal(state.accounts[restoreKey].offer, null);
assert.equal(state.automation.enabled, false);
assert.equal(state.resilience.chain_valid, true);
record(9, "checkpoint restores synthetic business state and stops the worker", {
  offer_restored_to_absent: true, background_enabled: false, local_action_chain_valid: true,
});

const report = {
  schema_version: 1, status: "passed", observed_at: observed, completed_at: new Date().toISOString(), origin: base,
  scope: `${sessions} fresh isolated synthetic sessions. Simulated providers, fixture plans and no paid model calls.`,
  provenance: { capture_script: "scripts/capture-renewal-series.mjs",
    capture_script_sha256: sha(await readFile(fileURLToPath(import.meta.url))), public_assets: assets,
    backend_revision: "Not exposed by the public API. Frontend asset hashes identify observed assets, not the backend build." },
  checks,
  limitations: [
    "The 24 new blog diagrams are explanatory scenarios; this replay tests only the checks listed here.",
    "No real identity authority, payments, messages, billing, access or model services are connected.",
    "Infrastructure topology was reviewed from the implementation, not re-audited through this HTTP replay.",
    "Does not establish concurrent capacity, real-provider idempotency, live-model quality, retention lift or staffing savings.",
  ],
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log(`Recorded ${checks.length} sanitized checks across Parts 2–9.`);

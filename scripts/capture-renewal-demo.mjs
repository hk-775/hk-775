// Explicit, opt-in check of the public synthetic demo in a fresh session.
// Not imported by the site or CI. Never writes real contracts or calls a model.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const base = "https://d11wfkflwovvog.cloudfront.net";
if (!process.argv.includes("--capture")) throw new Error("Pass --capture to create a fresh synthetic demo session and record its results.");
const outputFlag = process.argv.indexOf("--output");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = outputFlag < 0 ? resolve(root, "site/blog/evidence/renewal-standard.json") : resolve(process.argv[outputFlag + 1]);
const sha256 = input => createHash("sha256").update(input).digest("hex");
const cookies = new Map();
let csrf;
async function request(path, body, expected = 200) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const response = await fetch(base + path, {
    method: payload === undefined ? "GET" : "POST",
    redirect: "error", signal: AbortSignal.timeout(20000),
    headers: {
      ...(cookies.size ? { Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") } : {}),
      ...(payload === undefined ? {} : {
        Origin: base, "Content-Type": "application/json", "X-CSRF-Token": csrf,
        "X-Amz-Content-Sha256": sha256(payload),
      }),
    },
    body: payload,
  });
  assert.equal(response.status, expected, `Unexpected status for ${path}`);
  for (const item of response.headers.getSetCookie()) {
    const pair = item.split(";")[0], equals = pair.indexOf("=");
    cookies.set(pair.slice(0, equals), pair.slice(equals + 1));
  }
  return response;
}
const get = async path => (await request(path)).json();
const post = async (path, body = {}, expected = 200) => (await request(`/api${path}`, body, expected)).json();
const fingerprint = async path => ({ path, sha256: sha256(Buffer.from(await (await request(path)).arrayBuffer())) });
const observed = new Date().toISOString();
const assets = await Promise.all(["/assets/app.js", "/assets/style.css", "/diagrams/standard-renewal.svg"].map(fingerprint));
let state = await get("/api/state");
csrf = state.csrf;
assert.ok(csrf);
assert.equal(state.persona, "operator");
assert.equal(state.metrics.model_calls, 0);
assert.equal(state.clock, "2026-11-10", "Expected the documented fresh synthetic fixture");
const entries = Object.entries(state.accounts);
const standardId = entries.find(([, a]) => a.scenario === "normal" && a.contract.verified && !a.contract.negotiation && a.contract.seats === 40)?.[0];
const recoveryId = entries.find(([, a]) => a.scenario === "provisioning_once")?.[0];
const holdId = entries.find(([, a]) => !a.contract.verified)?.[0];
const reviewId = entries.find(([, a]) => a.contract.negotiation)?.[0];
assert.ok(standardId && recoveryId && holdId && reviewId, "Expected four documented synthetic scenarios");
const events = [];
state = await post(`/accounts/${holdId}/prepare`);
assert.equal(state.accounts[holdId].state, "data_hold");
events.push({ check: "unverified contract", outcome: "data_hold" });
state = await post(`/accounts/${reviewId}/prepare`);
assert.equal(state.accounts[reviewId].state, "human_review");
events.push({ check: "commercial exception", outcome: "human_review" });

async function accept(id, checkAuthority = false) {
  state = await post(`/accounts/${id}/prepare`);
  const offer = state.accounts[id].offer;
  assert.ok(offer);
  const terms = { offer_id: offer.id, version: offer.version, confirmed: true };
  if (checkAuthority) {
    await post("/persona", { persona: "viewer", account_id: id });
    await post(`/accounts/${id}/accept`, terms, 403);
    events.push({ check: "view-only acceptance", outcome: "rejected", http_status: 403 });
  }
  await post("/persona", { persona: "buyer", account_id: id });
  if (checkAuthority) {
    await post(`/accounts/${id}/accept`, { ...terms, version: terms.version + 1 }, 409);
    events.push({ check: "noncurrent offer version", outcome: "rejected", http_status: 409 });
  }
  await post(`/accounts/${id}/accept`, terms);
  state = await post("/persona", { persona: "operator" });
  const account = state.accounts[id];
  assert.equal(account.fulfillment.status, "scheduled");
  assert.equal(account.external.billing.updates, 0);
  assert.equal(account.external.access.updates, 0);
  events.push({ check: checkAuthority ? "standard agreement before effective date" : "recovery agreement before effective date", outcome: "scheduled", billing_updates: 0, access_updates: 0 });
  return offer;
}

await accept(standardId, true);
state = await post("/clock", { days: 7 });
let account = state.accounts[standardId];
assert.equal(account.state, "complete");
assert.equal(account.offer.amount_cents, 2400000);
assert.equal(account.external.billing.updates, 1);
assert.equal(account.external.access.updates, 1);
events.push({ check: "standard renewal at term start", outcome: account.state, annual_amount_cents: 2400000, currency: "USD", billing_updates: 1, access_updates: 1 });

await accept(recoveryId);
state = await post("/clock", { days: 4 });
account = state.accounts[recoveryId];
assert.equal(account.state, "recovery_required");
assert.equal(account.external.billing.updates, 1);
assert.equal(account.external.access.updates, 0);
events.push({ check: "first access attempt fails after billing succeeds", outcome: account.state, billing_updates: 1, access_updates: 0 });
state = await post(`/accounts/${recoveryId}/retry`);
account = state.accounts[recoveryId];
assert.equal(account.state, "complete");
assert.equal(account.external.billing.updates, 1);
assert.equal(account.external.access.updates, 1);
assert.deepEqual(account.actions.map(a => a.attempts), [1, 2]);
assert.equal(state.metrics.model_calls, 0);
events.push({ check: "reconcile and retry missing access", outcome: account.state, billing_updates: 1, access_attempts: 2, access_updates: 1 });

// Allowlisted observations only: no raw state, names, identities, cookies or tokens.
const report = {
  schema_version: 1, status: "passed", observed_at: observed, origin: base,
  scope: "One fresh synthetic session, simulated billing/access providers, zero model calls.",
  provenance: {
    capture_script: "scripts/capture-renewal-demo.mjs",
    capture_script_sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
    public_assets: assets,
    backend_revision: "Not exposed by the public API. Frontend asset hashes identify observed assets, not the backend build.",
  },
  checks: events,
  limitations: [
    "One executed example per tested path; not a reliability benchmark.",
    "Does not test real provider idempotency, ambiguous remote writes, concurrent transactions or production identity.",
    "No evidence of production retention lift, staffing savings or live-model quality.",
  ],
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log(`Passed ${events.length} synthetic checks; wrote sanitized observations to ${output}.`);

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Original, provider-neutral geometry. No external icons, services, or model calls.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "site/blog/diagrams/subscription-action-boundary.drawio");
const palette = { navy: "#0D1B2A", cyan: "#00B4D8", cream: "#F8F5F0", muted: "#526270", border: "#B4D5DA" };
const xml = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char])
  .replaceAll("\n", "&#xa;");
const cells = [];
function box(id, x, y, w, h, value = "", style = "") {
  cells.push(`<mxCell id="${id}" value="${xml(value)}" style="${xml(style)}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
}
function text(id, x, y, w, h, value, size = 22, color = palette.navy, extra = "") {
  box(id, x, y, w, h, value, `text;html=0;whiteSpace=nowrap;strokeColor=none;fillColor=none;fontFamily=Arial;fontSize=${size};fontColor=${color};align=left;verticalAlign=middle;spacing=0;${extra}`);
}
function node(id, x, y, w, title, copy, dark = false, h = 138) {
  box(id, x, y, w, h, "", `rounded=1;arcSize=8;fillColor=${dark ? palette.navy : palette.cream};strokeColor=${dark ? palette.navy : palette.cyan};strokeWidth=2;`);
  text(`${id}-title`, x + 16, y + 20, w - 32, 35, title, 25, dark ? palette.cream : palette.navy, "fontStyle=1;align=center;");
  text(`${id}-copy`, x + 16, y + 60, w - 32, h - 72, copy.join("\n"), 21, dark ? palette.cream : palette.muted, "align=center;");
}
function edge(id, points, evidence = false) {
  const first = points[0], last = points.at(-1);
  cells.push(`<mxCell id="${id}" value="" style="html=0;rounded=0;endArrow=block;endFill=1;endSize=8;strokeColor=${evidence ? palette.muted : palette.cyan};strokeWidth=${evidence ? 2 : 3};dashed=${evidence ? 1 : 0};dashPattern=5 5;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${first[0]}" y="${first[1]}" as="sourcePoint"/><mxPoint x="${last[0]}" y="${last[1]}" as="targetPoint"/>${points.length > 2 ? `<Array as="points">${points.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")}</Array>` : ""}</mxGeometry></mxCell>`);
}

box("canvas", 0, 0, 1540, 1100, "", `fillColor=${palette.cream};strokeColor=none;`);
text("title", 48, 30, 1444, 64, "Protect the subscription change at every mutation", 39, palette.navy, "fontStyle=1;");
text("subtitle", 48, 105, 1444, 35, "Synthetic reference workflow · scripted collaborator · serial in-memory provider", 24, palette.muted);
text("action-label", 48, 191, 1444, 28, "REQUEST, CHECK, EXECUTE, OBSERVE", 18, palette.navy, "fontStyle=1;");

node("candidate", 48, 264, 300, "Propose an action", ["Read requested state", "Use tool feedback"]);
node("guard", 468, 264, 300, "Mutation guard", ["Current consent + scope", "Dates, budget + version"], true);
node("provider", 900, 244, 592, "Billing and access provider", [
  "Cancel → optional refund → set access expiry",
  "Every new mutation passes the guard",
  "Exact duplicate requests return a receipt",
], false, 178);
edge("candidate-guard", [[348, 333], [468, 333]]);
edge("guard-provider", [[768, 333], [900, 333]]);
text("proposal-label", 352, 287, 112, 28, "Propose", 18, palette.muted, "align=center;");
text("allow-label", 775, 287, 118, 28, "Allow", 18, palette.muted, "align=center;");

node("trusted", 468, 507, 300, "Trusted consent", ["Confirmed intent", "Stored outside candidate"]);
edge("consent-guard", [[618, 507], [618, 402]], true);
text("consent-label", 644, 441, 246, 28, "Check at the write", 18, palette.muted);

// The returned response leads to another decision; it is not a second provider.
edge("tool-feedback", [[1210, 422], [1210, 474], [836, 474], [836, 691], [194, 691], [194, 402]]);
edge("guard-feedback", [[510, 402], [510, 462], [300, 462], [300, 402]]);
text("denial-label", 308, 431, 200, 25, "Denied / correct or stop", 17, palette.muted);
text("feedback-label", 48, 721, 985, 28, "Tool feedback: read again · look up an uncertain operation · correct · hand off", 21, palette.muted);

node("effects", 1008, 552, 484, "Observed effects", ["Committed changes + final state", "Retain harmful intermediate effects"]);
edge("provider-effects", [[1398, 422], [1398, 552]], true);
node("reference", 48, 845, 330, "Private task reference", ["Expected effects + terminal state", "Hidden from candidate and guard"], false, 138);
node("grader", 550, 845, 942, "Independent outcome grading", [
  "Correct handling · legitimate completion · unsafe effects · duplicate refunds",
  "Replay recorded commands; check effects, state and event links",
], false, 138);
edge("effects-grader", [[1250, 690], [1250, 845]], true);
edge("reference-grader", [[378, 914], [550, 914]], true);

text("legend", 48, 1021, 1444, 28, "Cyan: requests and tool feedback     ·     Dashed references: consent and evaluation evidence", 20, palette.navy);
text("scope", 48, 1060, 1444, 26, "Motion illustrates direction only. No live model, payment service, human approval, or AWS deployment is depicted.", 19, palette.muted);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="Original diagram by Harleen Kaur" version="31.3.2">
<diagram id="subscription-action-boundary" name="Subscription action boundary">
<mxGraphModel dx="1540" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1540" pageHeight="1100" background="${palette.cream}" math="0" shadow="0">
<root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("\n")}</root>
</mxGraphModel></diagram></mxfile>
`);
console.log(`Wrote ${output}`);

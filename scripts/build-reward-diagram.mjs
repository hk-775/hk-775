import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Original MIT-0 artwork. No external icons or deployment resources.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "site/blog/diagrams/verified-agent-work.drawio");
const palette = { navy: "#0D1B2A", cyan: "#00B4D8", cream: "#F8F5F0", muted: "#526270" };
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
  text(`${id}-title`, x + 14, y + 17, w - 28, 36, title, 25, dark ? palette.cream : palette.navy, "fontStyle=1;align=center;");
  text(`${id}-copy`, x + 14, y + 62, w - 28, h - 72, copy.join("\n"), 21, dark ? palette.cream : palette.muted, "align=center;");
}
function edge(id, points, evidence = false) {
  const first = points[0], last = points.at(-1);
  cells.push(`<mxCell id="${id}" value="" style="html=0;rounded=0;endArrow=block;endFill=1;endSize=8;strokeColor=${evidence ? palette.muted : palette.cyan};strokeWidth=${evidence ? 2 : 3};dashed=${evidence ? 1 : 0};dashPattern=5 5;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${first[0]}" y="${first[1]}" as="sourcePoint"/><mxPoint x="${last[0]}" y="${last[1]}" as="targetPoint"/>${points.length > 2 ? `<Array as="points">${points.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")}</Array>` : ""}</mxGeometry></mxCell>`);
}

box("canvas", 0, 0, 1540, 1090, "", `fillColor=${palette.cream};strokeColor=none;`);
text("title", 48, 26, 1444, 58, "Improve the agent. Verify the work.", 42, palette.navy, "fontStyle=1;");
text("subtitle", 48, 97, 1444, 35, "RSI Engine + AutoHelix · synthetic AI batch jobs · two feedback conditions", 24, palette.muted);
text("loop-label", 48, 167, 1444, 28, "BOUNDED IMPROVEMENT LOOP — DEVELOPMENT FEEDBACK", 18, palette.navy, "fontStyle=1;");

node("propose", 48, 219, 304, "Propose code", ["AutoHelix + live model", "Task / improver modules"]);
node("candidate", 446, 219, 304, "Execute candidate", ["Isolated Docker process", "Request work or hand off"], true);
node("worker", 844, 219, 262, "Fixed worker", ["Enforce write scope", "Produce outputs"]);
node("outputs", 1196, 219, 296, "Output artifacts", ["Source IDs + revision", "Artifact content"]);
edge("proposal-candidate", [[352, 288], [446, 288]]);
edge("candidate-worker", [[750, 288], [844, 288]]);
edge("worker-outputs", [[1106, 288], [1196, 288]]);

node("counters", 400, 490, 360, "Reported counters", ["completed / expected", "Agent can edit these"]);
edge("candidate-counters", [[598, 357], [598, 490]]);
text("status-label", 620, 410, 295, 28, "Status can change alone", 19, palette.muted);

node("requirements", 880, 490, 270, "Source requirements", ["Fixed input manifest", "Expected current work"]);
node("verifier", 1200, 490, 292, "External verifier", ["Exact current outputs", "or justified handoff"]);
edge("outputs-verifier", [[1344, 357], [1344, 490]], true);
edge("requirements-verifier", [[1150, 559], [1200, 559]], true);
text("audit-label", 1090, 410, 224, 28, "Check actual outputs", 19, palette.muted, "align=right;");

node("selection", 48, 734, 668, "Use the chosen reward", [
  "Development score accepts or rejects revisions",
  "Grading rules stay outside editable code",
], false, 142);
edge("counters-score", [[580, 628], [580, 734]], true);
edge("verifier-score", [[1346, 628], [1346, 686], [676, 686], [676, 734]], true);
text("weak-label", 340, 660, 219, 26, "Reported condition", 18, palette.muted, "align=right;");
text("verified-label", 874, 642, 385, 27, "Verified condition", 18, palette.muted, "align=center;");
edge("score-proposal", [[48, 805], [24, 805], [24, 288], [48, 288]]);
text("return-label", 62, 637, 288, 50, "Feedback guides\nthe next revision", 21, palette.muted);

node("final", 864, 750, 628, "Separate final audit", [
  "Commit all twelve selections first",
  "120 final cases; no feedback into search",
], true, 126);
edge("selection-final", [[716, 805], [864, 805]], true);
text("final-label", 720, 765, 140, 28, "After selection", 17, palette.muted, "align=center;");

text("legend", 48, 936, 1444, 28, "Solid cyan: execution and revision flow     ·     Dashed: state and scoring evidence", 21, palette.navy);
text("boundary", 48, 984, 1444, 28, "The fixed worker, requirements and grader are outside the candidate. Each run uses one feedback condition.", 21, palette.muted);
text("scope", 48, 1030, 1444, 28, "Moving circles show direction only. This is an experiment workflow, not a cloud deployment or live performance trace.", 20, palette.muted);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="Original diagram by Harleen Kaur" version="31.3.2">
<diagram id="verified-agent-work" name="Verified agent work">
<mxGraphModel dx="1540" dy="1090" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1540" pageHeight="1090" background="${palette.cream}" math="0" shadow="0">
<root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join("\n")}</root>
</mxGraphModel></diagram></mxfile>
`);
console.log(`Wrote ${output}`);

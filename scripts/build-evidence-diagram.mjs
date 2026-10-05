import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Original geometry and labels. The referenced LinkedIn workflow informed the
// visual organization; no reference-image pixels or third-party assets are used.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "site/blog/diagrams/agent-action-evidence-workflow.drawio");
const colors = {
  navy: "#0D1B2A", cyan: "#00B4D8", cream: "#F8F5F0",
  muted: "#526270", wash: "#EAF2F1", border: "#B4D5DA",
};
const xml = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char])
  .replaceAll("\n", "&#xa;");
const cells = [];
function box(id, x, y, width, height, label = "", style = "") {
  cells.push(`<mxCell id="${id}" value="${xml(label)}" style="${xml(style)}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/></mxCell>`);
}
function text(id, x, y, width, height, label, size = 22, color = colors.navy, extra = "") {
  box(id, x, y, width, height, label,
    `text;html=0;whiteSpace=nowrap;strokeColor=none;fillColor=none;fontFamily=Arial;fontSize=${size};fontColor=${color};align=left;verticalAlign=middle;spacing=0;${extra}`);
}
function line(id, points, { color = colors.cyan, dashed = false, arrow = false, width = 2.5 } = {}) {
  const first = points[0], last = points.at(-1);
  cells.push(`<mxCell id="${id}" value="" style="html=0;rounded=0;endArrow=${arrow ? "block" : "none"};endFill=1;endSize=8;strokeColor=${color};strokeWidth=${width};dashed=${dashed ? 1 : 0};dashPattern=5 5;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${first[0]}" y="${first[1]}" as="sourcePoint"/><mxPoint x="${last[0]}" y="${last[1]}" as="targetPoint"/>${points.length > 2 ? `<Array as="points">${points.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")}</Array>` : ""}</mxGeometry></mxCell>`);
}
function node(id, x, y, width, height, title, lines, { dark = false } = {}) {
  box(id, x, y, width, height, "",
    `rounded=1;arcSize=8;fillColor=${dark ? colors.navy : colors.cream};strokeColor=${dark ? colors.navy : colors.cyan};strokeWidth=1.6;`);
  text(`${id}-title`, x + 14, y + 22, width - 28, 34, title, 25,
    dark ? colors.cream : colors.navy, "fontStyle=1;align=center;");
  text(`${id}-copy`, x + 16, y + 61, width - 32, height - 71, lines.join("\n"), 21,
    dark ? colors.cream : colors.muted, "align=center;");
}

box("canvas", 0, 0, 1680, 1040, "", `fillColor=${colors.cream};strokeColor=none;`);
text("title", 48, 36, 1200, 62, "An evidence trail for agent actions", 44, colors.navy, "fontStyle=1;");
text("subtitle", 48, 105, 1380, 38, "Connect each request to its decision, execution, and observed effect.", 25, colors.muted);
box("scope-pill", 1370, 47, 260, 40, "SYNTHETIC EXAMPLE",
  `rounded=1;html=0;whiteSpace=nowrap;arcSize=50;fillColor=${colors.wash};strokeColor=none;fontFamily=Arial;fontSize=17;fontColor=${colors.navy};fontStyle=1;`);

box("action-group", 278, 170, 1354, 322, "",
  `rounded=1;arcSize=5;fillColor=${colors.wash};strokeColor=${colors.border};strokeWidth=1.4;`);
text("action-heading", 306, 187, 1240, 28, "ACTION PATH  /  RECORDED C4 WORKFLOW", 18, colors.navy, "fontStyle=1;");
text("action-scope", 306, 222, 1240, 27, "Source-to-destination redaction is applied before the modeled send.", 21, colors.muted);

node("request", 48, 282, 200, 152, "Agent request", ["Action + actor", "Argument digest"]);
node("policy", 324, 282, 240, 152, "Policy decision", ["Matched rule", "Recorded rationale"], { dark: true });
node("change", 638, 282, 250, 152, "Payload change", ["C4: redact content", "Changed digest"]);
node("execution", 964, 282, 240, 152, "Tool execution", ["Run changed payload", "Record tool result"]);
node("observation", 1280, 282, 302, 152, "State observation", ["Inspect the destination", "Evaluate the task contract"]);
for (const [id, x1, x2] of [
  ["request-policy", 248, 324], ["policy-change", 564, 638],
  ["change-execution", 888, 964], ["execution-state", 1204, 1280],
]) line(id, [[x1, 358], [x2, 358]], { arrow: true });

// These are reference links, not an additional execution or a parallel model run.
for (const [id, x] of [["request",148],["policy",444],["change",763],["execution",1084],["observation",1431]])
  line(`${id}-evidence`, [[x, 434], [x, 568]], { dashed: true, color: colors.muted, width: 1.7 });
line("evidence-bus", [[148, 568], [1431, 568]], { dashed: true, color: colors.muted, width: 1.7 });
line("evidence-ingress", [[728, 568], [728, 638]], { dashed: true, arrow: true, color: colors.muted, width: 1.7 });
text("correlation-label", 795, 585, 780, 30, "Correlate records using run_id and request_id", 21, colors.muted);

box("evidence-group", 278, 638, 906, 242, "",
  `rounded=1;arcSize=5;fillColor=${colors.cream};strokeColor=${colors.border};strokeWidth=1.6;`);
text("evidence-heading", 304, 654, 854, 28, "RETAINED EVIDENCE", 20, colors.navy, "fontStyle=1;");
text("evidence-boundary", 304, 687, 854, 27, "Host-side artifacts outside the operations exposed by modeled tools", 20, colors.muted);
node("event-artifact", 304, 732, 268, 122, "Event stream", ["Requests · decisions", "Results + hash links"]);
node("snapshot-artifact", 596, 732, 268, 122, "State snapshots", ["Before · after · teardown", "State digests"]);
node("context-artifact", 888, 732, 270, 122, "Run context", ["Manifest + source pins", "Locked dependencies"]);
node("review", 1254, 674, 378, 180, "Evidence review", [
  "Check chain + artifacts",
  "Check lifecycle + outcome",
  "State the trust assumptions",
]);
line("evidence-review", [[1184, 768], [1254, 768]], { arrow: true });

line("footer-rule", [[48, 922], [1632, 922]], { color: colors.border, width: 1.3 });
text("legend", 48, 939, 1584, 27,
  "Solid: action / review flow     ·     Dashed: evidence references", 20, colors.navy);
text("limitation", 48, 976, 1584, 31,
  "The published CLI checks event-chain consistency. Snapshot, lifecycle, outcome, and producer-trust checks are separate.", 20, colors.muted);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="Original diagram by Harleen Kaur" version="31.3.2">
  <diagram id="agent-action-evidence" name="Agent action evidence">
    <mxGraphModel dx="1680" dy="1040" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1680" pageHeight="1040" background="${colors.cream}" math="0" shadow="0">
      <root><mxCell id="0"/><mxCell id="1" parent="0"/>
${cells.join("\n")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`);
console.log(`Wrote ${output}`);

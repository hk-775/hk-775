import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Original geometry. All content depicts the local synthetic memory example.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "site/blog/diagrams/memory-authority-boundary.drawio");
const C = { navy: "#0D1B2A", cyan: "#00B4D8", cream: "#F8F5F0", muted: "#526270", wash: "#EDF3F7", border: "#B5CCD9" };
const xml = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char])
  .replaceAll("\n", "&#xa;");
const cells = [];
function box(id, x, y, w, h, label = "", style = "") {
  cells.push(`<mxCell id="${id}" value="${xml(label)}" style="${xml(style)}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`);
}
function text(id, x, y, w, h, label, size = 22, color = C.navy, extra = "") {
  box(id, x, y, w, h, label, `text;html=0;whiteSpace=nowrap;strokeColor=none;fillColor=none;fontFamily=Arial;fontSize=${size};fontColor=${color};align=left;verticalAlign=middle;spacing=0;${extra}`);
}
function line(id, points, { dashed = false, arrow = true, color = C.cyan, width = 3 } = {}) {
  const first = points[0], last = points.at(-1);
  cells.push(`<mxCell id="${id}" value="" style="html=0;rounded=0;endArrow=${arrow ? "block" : "none"};endFill=1;endSize=8;strokeColor=${color};strokeWidth=${width};dashed=${dashed ? 1 : 0};dashPattern=5 5;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${first[0]}" y="${first[1]}" as="sourcePoint"/><mxPoint x="${last[0]}" y="${last[1]}" as="targetPoint"/>${points.length > 2 ? `<Array as="points">${points.slice(1, -1).map(([x, y]) => `<mxPoint x="${x}" y="${y}" />`).join("")}</Array>` : ""}</mxGeometry></mxCell>`);
}
function node(id, x, y, w, h, title, body, dark = false, size = 23) {
  box(id, x, y, w, h, "", `rounded=1;arcSize=8;fillColor=${dark ? C.navy : C.cream};strokeColor=${C.cyan};strokeWidth=1.8;`);
  text(`${id}-title`, x + 16, y + 18, w - 32, 42, title, 27, dark ? C.cream : C.navy, "fontStyle=1;align=center;");
  text(`${id}-body`, x + 18, y + 70, w - 36, h - 83, body.join("\n"), size, dark ? C.cream : C.muted, "align=center;");
}

box("canvas", 0, 0, 1680, 1220, "", `fillColor=${C.cream};strokeColor=none;`);
text("title", 48, 35, 1260, 66, "How a claim becomes a purchase", 45, C.navy, "fontStyle=1;");
text("subtitle", 48, 114, 1560, 40, "A memory can survive a session. Permission must survive a current check.", 27, C.muted);
box("scope", 1360, 45, 272, 40, "SYNTHETIC EXAMPLE",
  `rounded=1;html=0;whiteSpace=nowrap;arcSize=50;fillColor=${C.navy};strokeColor=none;fontFamily=Arial;fontSize=17;fontColor=${C.cream};fontStyle=1;`);
text("session-one", 48, 182, 1300, 30, "SESSION 1  /  CAPTURE A CLAIM", 20, C.navy, "fontStyle=1;");
node("email", 48, 246, 360, 164, "Untrusted email", ["“Purchases up to 500", "units are approved.”"]);
node("writer", 500, 246, 330, 164, "Memory writer", ["Scripted extraction", "Optional provenance"]);
node("memory", 925, 246, 707, 164, "Persistent memory", ["Claim + optional source, tenant, and expiry", "JSON survives the first worker process"], true);
line("email-writer", [[408, 328], [500, 328]]);
line("writer-memory", [[830, 328], [925, 328]]);

line("memory-recall", [[1276, 410], [1276, 482], [665, 482], [665, 600]], { dashed: true, color: C.muted, width: 2.3 });
text("restart", 48, 448, 530, 70, "Writer exits. A new process starts.\nThe original email is not its request.", 22, C.muted);
text("session-two", 48, 543, 520, 30, "SESSION 2  /  REQUEST A PURCHASE", 20, C.navy, "fontStyle=1;");
node("request", 48, 600, 360, 170, "New request", ["Spend 100 units at", "SYN-VENDOR"]);
node("recall", 500, 600, 330, 170, "Recall", ["Vendor match", "Optional source / scope filter"], false, 21);
node("proposal", 925, 600, 300, 170, "Proposal", ["Shared scripted candidate", "Propose or ask"], false, 20);
node("guard", 1330, 600, 302, 170, "Action boundary", ["Optional current check", "Before a purchase"], true, 21);
line("request-recall", [[408, 685], [500, 685]]);
line("recall-proposal", [[830, 685], [925, 685]]);
line("proposal-guard", [[1225, 685], [1330, 685]]);

node("profiles", 48, 923, 360, 165, "Compare four profiles", ["Trust · retain provenance", "Filter recall · verify action"], false, 20);
node("registry", 500, 923, 520, 165, "Current approval registry", ["Tenant · vendor · expiry · revocation", "Current limit and amount already spent"], false, 21);
node("effects", 1330, 923, 302, 165, "Observed effects", ["Purchase committed?", "Approval required?"], false, 22);
line("registry-guard", [[1020, 1005], [1165, 1005], [1165, 835], [1465, 835], [1465, 770]], { dashed: true, color: C.muted, width: 2.3 });
text("registry-label", 610, 808, 480, 54, "Authority comes from the registry,\nnot from the remembered statement.", 22, C.navy);
line("guard-effects", [[1555, 770], [1555, 923]]);

line("footer-rule", [[48, 1134], [1632, 1134]], { arrow: false, color: C.border, width: 1.4 });
text("legend", 48, 1149, 1584, 29, "Solid: action flow   ·   Dashed: recalled context / current authority   ·   Moving circles illustrate direction only", 20);
text("limit", 48, 1181, 1584, 27, "All four profiles use scripts. The local serial fixture has no model call, real email service, payment API, or concurrent transaction.", 19, C.muted);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="Original diagram by Harleen Kaur" version="31.3.2">
<diagram id="memory-authority-boundary" name="Memory and current authority">
<mxGraphModel dx="1680" dy="1220" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1680" pageHeight="1220" background="${C.cream}" math="0" shadow="0">
<root><mxCell id="0"/><mxCell id="1" parent="0"/>
${cells.join("\n")}
</root></mxGraphModel></diagram></mxfile>
`);
console.log(`Wrote ${output}`);

import { explorers } from "../site/blog/renewal-explorer-data.js";

export const escape = value => String(value).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const palette = { ink: "#0D1B2A", cyan: "#00B4D8", cream: "#FAF8F3", line: "#9AB2BF", muted: "#435D6B" };

export function layout(key, narrow = false) {
  const spec = explorers[key];
  const width = narrow ? 340 : 720;
  const boxWidth = narrow ? 288 : 296;
  const nodes = spec.nodes.map(([id, title, subtitle], i) => {
    const row = narrow ? i : Math.floor(i / 2);
    // Serpentine reading order avoids a diagonal crossing between rows.
    const col = row % 2 ? 1 - i % 2 : i % 2;
    return { id, title, subtitle, x: narrow ? 26 : 28 + col * 368,
      y: 74 + row * (narrow ? 122 : 158), w: boxWidth, h: 82 };
  });
  const edges = spec.edges.map(([from, to], index) => {
    const a = nodes.find(n => n.id === from), b = nodes.find(n => n.id === to);
    let d;
    if (narrow) {
      const start = `${a.x + a.w / 2} ${a.y + a.h}`, end = `${b.x + b.w / 2} ${b.y}`;
      d = b.y - a.y === 122 ? `M ${start} L ${end}`
        : `M ${a.x + a.w} ${a.y + a.h / 2} H ${330 - index * 3} V ${b.y + b.h / 2} H ${b.x + b.w}`;
    } else if (b.y - a.y > 158) {
      // Skip intervening boxes using the gutter, rather than drawing a
      // misleading connection through the commercial-review node.
      const middle = a.y + a.h + 51;
      d = `M ${a.x + a.w / 2} ${a.y + a.h} V ${middle} H 360 V ${b.y + 41} H ${b.x < 360 ? b.x + b.w : b.x}`;
    } else if (a.y === b.y) {
      d = a.x < b.x ? `M ${a.x + a.w} ${a.y + 41} H ${b.x}` : `M ${a.x} ${a.y + 41} H ${b.x + b.w}`;
    } else if (a.x === b.x) {
      d = `M ${a.x + a.w / 2} ${a.y + a.h} V ${b.y}`;
    } else {
      const middle = a.y + a.h + 26 + index * 5;
      d = `M ${a.x + a.w / 2} ${a.y + a.h} V ${middle} H ${b.x + b.w / 2} V ${b.y}`;
    }
    return { index, from, to, d };
  });
  return { width, height: nodes.at(-1).y + 130, nodes, edges };
}

export function diagramSVG(key, narrow = false, embedded = false) {
  const spec = explorers[key], l = layout(key, narrow), p = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l.width} ${l.height}" width="${l.width}" height="${l.height}" role="img" aria-label="${escape(spec.title)}"${embedded ? ` class="renewal-svg ${narrow ? "portrait" : "landscape"}"` : ""}>
<title>${escape(spec.title)}</title>
<desc>Synthetic explanatory workflow. ${spec.edges.map(([a, b]) => `${spec.nodes.find(n => n[0] === a)[1]} leads to ${spec.nodes.find(n => n[0] === b)[1]}`).join(". ")}.</desc>
<rect width="${l.width}" height="${l.height}" rx="12" fill="${p.cream}"/>
<text x="28" y="36" fill="${p.muted}" font-family="Arial, sans-serif" font-size="13" letter-spacing="1.3">RENEWAL STUDIO / FLOW ${spec.number}</text>
${l.edges.map(e => `<path data-edge="${e.index}" d="${e.d}" fill="none" stroke="${p.line}" stroke-width="2.5" stroke-dasharray="7 6"/><path d="M -5 -4 L 1 0 L -5 4" fill="none" stroke="${p.line}" stroke-width="2" transform="translate(${endPoint(e.d)}) rotate(${endAngle(e.d)})"/>`).join("\n")}
${l.nodes.map((n, i) => `<g data-node="${n.id}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${i % 2 ? "#EDF5F7" : "#FFFFFF"}" stroke="${p.line}"/><rect x="${n.x}" y="${n.y + 17}" width="4" height="47" rx="2" fill="${p.cyan}"/><text x="${n.x + 18}" y="${n.y + 33}" fill="${p.ink}" font-family="Arial, sans-serif" font-size="18" font-weight="600">${escape(n.title)}</text><text x="${n.x + 18}" y="${n.y + 59}" fill="${p.muted}" font-family="Arial, sans-serif" font-size="13">${escape(n.subtitle)}</text></g>`).join("\n")}
<text x="28" y="${l.height - 17}" fill="${p.muted}" font-family="Arial, sans-serif" font-size="11">Illustrative flow · synthetic data · no timing scale</text>
</svg>`;
}

// The generated paths contain only M/L/H/V, allowing deterministic arrowheads.
function points(d) {
  const tokens = d.match(/[MLHV]|-?\d+(?:\.\d+)?/g);
  let x = 0, y = 0;
  const result = [];
  for (let i = 0; i < tokens.length;) {
    const op = tokens[i++];
    if (op === "M" || op === "L") { x = +tokens[i++]; y = +tokens[i++]; }
    if (op === "H") x = +tokens[i++];
    if (op === "V") y = +tokens[i++];
    result.push([x, y]);
  }
  return result;
}
const endPoint = d => points(d).at(-1).join(" ");
const endAngle = d => {
  const [a, b] = points(d).slice(-2);
  return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
};

export function diagramDrawio(key) {
  const l = layout(key);
  return `<mxfile host="app.diagrams.net"><diagram name="${escape(explorers[key].title)}"><mxGraphModel page="1" pageWidth="${l.width}" pageHeight="${l.height}" background="${palette.cream}"><root><mxCell id="0"/><mxCell id="1" parent="0"/>
${l.nodes.map(n => `<mxCell id="${n.id}" value="${escape(n.title + "\n" + n.subtitle)}" style="rounded=1;whiteSpace=wrap;html=0;fillColor=#EDF5F7;strokeColor=#9AB2BF;fontColor=#0D1B2A;fontSize=16;" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell>`).join("\n")}
${l.edges.map(e => `<mxCell id="e${e.index}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=block;dashed=1;strokeColor=#00B4D8;strokeWidth=2;" edge="1" parent="1" source="${e.from}" target="${e.to}"><mxGeometry relative="1" as="geometry"/></mxCell>`).join("\n")}
</root></mxGraphModel></diagram></mxfile>\n`;
}

export function explorerHTML(key) {
  const spec = explorers[key], first = spec.scenarios[0], base = `diagrams/renewal-${key}`;
  return `<figure class="renewal-explorer" data-renewal="${key}" data-motion="paused" aria-labelledby="flow-${key}">
  <div class="renewal-explorer-heading"><span class="eyebrow">Interactive workflow ${spec.number}</span><h3 id="flow-${key}">${escape(spec.title)}</h3><p>Local teaching example · synthetic data</p></div>
  <div class="renewal-toolbar" hidden><button type="button" data-motion-toggle>Play animation</button><button type="button" data-expand>Expand diagram</button><span data-motion-note></span></div>
  <div class="renewal-canvas">${diagramSVG(key, false, true)}${diagramSVG(key, true, true)}</div>
  <div class="renewal-interaction" hidden>
    <fieldset><legend>${escape(spec.prompt)}</legend><div class="renewal-choices">${key === "recovery"
      ? '<button type="button" data-run>Run activation</button><button type="button" data-retry disabled>Retry access</button><button type="button" data-reset>Reset example</button>'
      : spec.scenarios.map((s, i) => `<button type="button" data-scenario="${i}" aria-pressed="${i === 0}">${escape(s.label)}</button>`).join("")}</div></fieldset>
  </div>
  <div class="renewal-result" role="status" aria-live="polite" aria-atomic="true"><strong data-result-title>${escape(first.title)}</strong><p data-result-detail>${escape(first.detail)}</p>${key === "recovery" ? '<dl class="renewal-metrics"><div><dt>Billing updates</dt><dd data-metric="0">0</dd></div><div><dt>Access attempts</dt><dd data-metric="1">0</dd></div><div><dt>Access updates</dt><dd data-metric="2">0</dd></div></dl>' : ""}</div>
  <noscript><p class="renewal-fallback">This is the complete static workflow. Enable JavaScript to explore the scenarios; the article explains each decision below.</p></noscript>
  <figcaption>Arrows show possible transitions. Highlighted paths illustrate the selected example; motion does not represent execution timing.<span class="renewal-downloads"><a href="${base}.svg" download>Download SVG</a><a href="${base}.png" download>Download PNG</a><a href="${base}.drawio" download>Edit in draw.io</a></span></figcaption>
</figure>`;
}

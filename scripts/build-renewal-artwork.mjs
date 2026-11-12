import { writeFile, readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { chromium } from "@playwright/test";
import { explorers } from "../site/blog/renewal-explorer-data.js";
import { seriesCovers } from "../site/blog/renewal-series-data.js";
import { diagramSVG, diagramDrawio } from "./renewal-artwork.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "site/blog/diagrams");
const check = process.argv.includes("--check");
const texts = new Map();
for (const key of Object.keys(explorers)) {
  texts.set(`renewal-${key}.svg`, diagramSVG(key) + "\n");
  texts.set(`renewal-${key}.drawio`, diagramDrawio(key));
}
texts.set("renewal-standard-cover.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Renewal Studio: The Standard Renewal, End to End">
<rect width="1200" height="630" fill="#0D1B2A"/><rect x="70" y="69" width="48" height="5" fill="#00B4D8"/>
<g font-family="Arial, sans-serif"><text x="70" y="111" font-size="19" fill="#00B4D8" letter-spacing="3">ENGINEERING NOTES / HARLEEN KAUR</text>
<text x="70" y="183" font-size="25" fill="#FAF8F3">RENEWAL STUDIO · PART 1</text>
<text x="70" y="259" font-size="62" font-weight="600" fill="#FAF8F3">The Standard Renewal,</text><text x="70" y="330" font-size="62" font-weight="600" fill="#FAF8F3">End to End</text>
<text x="70" y="386" font-size="23" fill="#B9CDD5">From a trusted contract to verified billing and access.</text>
<path d="M 100 486 H 1090" fill="none" stroke="#00B4D8" stroke-width="3" stroke-dasharray="9 10"/>
${["Check", "Offer", "Accept", "Activate", "Verify"].map((label, i) => `<rect x="${70 + i * 224}" y="453" width="164" height="66" rx="10" fill="${i === 4 ? "#00B4D8" : "#FAF8F3"}"/><text x="${152 + i * 224}" y="494" text-anchor="middle" font-size="21" fill="#0D1B2A">${label}</text>`).join("")}
<text x="70" y="578" font-size="17" fill="#B9CDD5">4 interactive workflows · synthetic examples · hk-775.github.io/hk-775</text></g></svg>\n`);

for (const [key, number, lines, subtitle, steps] of seriesCovers) {
  texts.set(`renewal-${key}-cover.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Renewal Studio, ${number ? `Part ${number}` : "Complete series"}: ${lines.join(" ")}">
<rect width="1200" height="630" fill="#0D1B2A"/>
<g font-family="Arial, sans-serif"><text x="70" y="100" font-size="19" fill="#00B4D8" letter-spacing="3">ENGINEERING NOTES / HARLEEN KAUR</text>
<text x="70" y="172" font-size="25" fill="#FAF8F3">RENEWAL STUDIO · ${number ? `PART ${number}` : "ALL NINE PARTS"}</text>
${lines.map((line, i) => `<text x="70" y="${250 + i * 73}" font-size="59" font-weight="600" fill="#FAF8F3">${line}</text>`).join("")}
<text x="70" y="384" font-size="23" fill="#B9CDD5">${subtitle}</text>
<path d="M 100 488 H 1090" fill="none" stroke="#00B4D8" stroke-width="3" stroke-dasharray="9 10"/>
${steps.map((label, i) => `<rect x="${70 + i * 282}" y="453" width="214" height="68" rx="10" fill="${i === 3 ? "#00B4D8" : "#FAF8F3"}"/><text x="${177 + i * 282}" y="496" text-anchor="middle" font-size="22" fill="#0D1B2A">${label}</text>`).join("")}
<text x="70" y="578" font-size="17" fill="#B9CDD5">${number ? "3" : "28"} interactive workflows · synthetic examples · hk-775.github.io/hk-775</text></g></svg>\n`);
}
await mkdir(target, { recursive: true });
for (const [name, text] of texts) {
  if (check) {
    if (await readFile(resolve(target, name), "utf8") !== text) throw new Error(`Stale artwork: ${name}`);
  } else await writeFile(resolve(target, name), text);
}
if (!check) {
  const browser = await chromium.launch();
  try {
    for (const [name, svg] of texts) {
      if (!name.endsWith(".svg")) continue;
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: name.endsWith("-cover.svg") ? 1 : 2 });
      await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
      await page.locator("svg").screenshot({ path: resolve(target, name.replace(".svg", ".png")) });
      await page.close();
    }
  } finally { await browser.close(); }
}
console.log(`${check ? "Verified" : "Generated"} ${Object.keys(explorers).length} original renewal workflows and ${seriesCovers.length + 1} social covers.`);

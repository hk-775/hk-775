import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#0D1B2A;color:#EAEAEA;font-family:Arial,sans-serif;width:1200px;height:630px;padding:56px 66px;position:relative}
  .top{display:flex;justify-content:space-between;align-items:center;font-size:20px}.label{text-transform:uppercase;letter-spacing:3px;font-size:13px;color:#00B4D8}
  h1{font-size:76px;line-height:1.08;letter-spacing:-3px;font-weight:500;margin:76px 0 28px}em{font-style:normal;color:#00B4D8}
  p{color:#EAEAEA;font-size:23px;line-height:1.5;max-width:870px;margin:0}
  footer{position:absolute;left:66px;right:66px;bottom:42px;border-top:1px solid rgba(234,234,234,.25);padding-top:22px;font-size:16px;letter-spacing:1px}
  </style><div class="top"><strong>Harleen Kaur</strong><span class="label">Engineering notes</span></div>
  <h1>Engineering decisions,<br><em>with evidence.</em></h1>
  <p>Experiments, implementation choices, and measured outcomes<br>for AI workloads.</p>
  <footer>MODEL ROUTING &nbsp; / &nbsp; ACTION GOVERNANCE &nbsp; / &nbsp; CONTAINMENT &nbsp; / &nbsp; EVALUATION</footer></html>`);
  await page.screenshot({ path: fileURLToPath(new URL("../site/blog/share.png", import.meta.url)) });
} finally {
  await browser.close();
}

import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#f7f6f0;color:#202e2c;font-family:Arial,sans-serif;width:1200px;height:630px;padding:56px 68px}
  .top{display:flex;justify-content:space-between;align-items:center;font-size:18px}.name{font-weight:600}.label{text-transform:uppercase;letter-spacing:3px;font-size:12px;color:#587064}
  h1{font-size:66px;line-height:1.12;letter-spacing:-3px;font-weight:500;margin:55px 0 26px}em{font-style:normal;color:#597d6a}
  p{color:#566461;font-size:20px}footer{display:flex;justify-content:space-between;border-top:1px solid #ccd5c9;padding-top:22px;margin-top:44px;font-size:16px}
  </style><div class="top"><span class="name">Harleen Kaur</span><span class="label">Enterprise AI · With evidence</span></div>
  <h1>Choose the model.<br>Govern the action.<br><em>Test the boundary.</em></h1>
  <p>One workflow. Three open-source projects. Reproducible evidence.</p>
  <footer><span>AxonLLM → Ostiari → Escape Lab</span><span>Synthetic evaluation · Explicit limitations</span></footer></html>`);
  await page.screenshot({ path: fileURLToPath(new URL("../site/share.png", import.meta.url)) });
} finally {
  await browser.close();
}

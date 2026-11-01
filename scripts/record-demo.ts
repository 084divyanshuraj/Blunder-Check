import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function testRecord() {
  const outputDir = path.resolve("./public/recordings");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(outputDir);
  console.log("Recorded files:", files);
}

testRecord().catch(console.error);


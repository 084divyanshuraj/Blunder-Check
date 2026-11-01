import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function recordWalkthrough() {
  const outputDir = path.resolve("./public/recordings");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean old recordings
  const oldFiles = fs.readdirSync(outputDir);
  for (const f of oldFiles) {
    try { fs.unlinkSync(path.join(outputDir, f)); } catch {}
  }

  console.log("Launching Chrome for 90-second synchronized demo recording...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  console.log("Scene 1: Landing Page & Problem Statement (0:00 - 0:20)");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);

  // Smooth scroll down to highlight Digital Dark Spots concept
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: "smooth" }));
  await page.waitForTimeout(5000);

  await page.evaluate(() => window.scrollBy({ top: 550, behavior: "smooth" }));
  await page.waitForTimeout(5500);

  // Scroll down to showcase 3 demo cases
  await page.evaluate(() => window.scrollBy({ top: 650, behavior: "smooth" }));
  await page.waitForTimeout(5500);

  console.log("Scene 2: Launching Decision Studio with Case 1 (0:20 - 0:38)");
  await page.goto("http://localhost:3000/studio?demo=scholarship", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);

  // Scroll down to show Eval Bar & score
  await page.evaluate(() => window.scrollBy({ top: 280, behavior: "smooth" }));
  await page.waitForTimeout(8000);

  // Hover over the score breakdown details
  await page.evaluate(() => window.scrollBy({ top: 150, behavior: "smooth" }));
  await page.waitForTimeout(6000);

  console.log("Scene 3: Inspecting Blunder & Evidence Drawer (0:38 - 0:52)");
  try {
    const inspectBtn = page.locator("button:has-text('Inspect Evidence')").first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      // Stay on the highlighted verified quote
      await page.waitForTimeout(9000);
      // Close drawer
      const closeBtn = page.locator("button:has-text('✕')").first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  } catch (e) {
    console.log("Inspect evidence click note:", e);
  }
  await page.waitForTimeout(3000);

  console.log("Scene 4: Blunder Replay Simulator (0:52 - 1:06)");
  try {
    const replayTab = page.locator("button:has-text('Blunder Replay')").first();
    if (await replayTab.isVisible()) {
      await replayTab.click();
      await page.waitForTimeout(4000);
      // Click fix simulation button
      const simBtn = page.locator("button:has-text('Fix')").first();
      if (await simBtn.isVisible()) {
        await simBtn.click();
        // Pause to watch Eval Bar jump from -1.2 to +1.8
        await page.waitForTimeout(9000);
      }
    }
  } catch (e) {
    console.log("Replay tab note:", e);
  }

  console.log("Scene 5: Opponent Mode (1:06 - 1:18)");
  try {
    const opponentTab = page.locator("button:has-text('Opponent Mode')").first();
    if (await opponentTab.isVisible()) {
      await opponentTab.click();
      await page.waitForTimeout(4000);
      // Click first attack vector to reveal counter-move
      const attackCard = page.locator("text=Attack Vector 1").first();
      if (await attackCard.isVisible()) {
        await attackCard.click();
        await page.waitForTimeout(7000);
      }
    }
  } catch (e) {
    console.log("Opponent tab note:", e);
  }

  console.log("Scene 6: Executive Dossier Export (1:18 - 1:32)");
  try {
    const exportBtn = page.locator("button:has-text('Export Briefing')").first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(4000);
      // Scroll down inside the modal
      await page.mouse.wheel(0, 350);
      await page.waitForTimeout(5000);
      await page.mouse.wheel(0, 350);
      await page.waitForTimeout(4000);
    }
  } catch (e) {
    console.log("Export button note:", e);
  }

  console.log("Scene 7: Outro & Disclaimer (1:32 - 1:36)");
  await page.waitForTimeout(4000);

  console.log("Finishing recording session...");
  await page.close();
  await context.close();
  await browser.close();

  // Find generated video and save
  const recorded = fs.readdirSync(outputDir).find(f => f.endsWith(".webm"));
  if (recorded) {
    const sourceVideo = path.join(outputDir, recorded);
    const targetVideo = path.resolve("./public/BlunderCheck_Demo_Video.webm");
    fs.copyFileSync(sourceVideo, targetVideo);
    console.log("SUCCESS! Synchronized 90-second video saved to:", targetVideo);
  }
}

recordWalkthrough().catch(console.error);

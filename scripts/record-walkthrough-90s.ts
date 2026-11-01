import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

async function activeWait(page: any, ms: number) {
  const steps = Math.max(1, Math.floor(ms / 250));
  for (let i = 0; i < steps; i++) {
    await page.mouse.move(600 + (i % 5) * 4, 400 + (i % 5) * 4);
    await page.waitForTimeout(250);
  }
}

async function recordWalkthrough90s() {
  const outputDir = path.resolve("./public/recordings");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean old recordings
  const oldFiles = fs.readdirSync(outputDir);
  for (const f of oldFiles) {
    try { fs.unlinkSync(path.join(outputDir, f)); } catch {}
  }

  console.log("Launching Chrome with active frame pumping for true 90-second recording...");
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

  console.log("Scene 1: Landing Page & Problem Statement (0:00 - 0:22)");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await activeWait(page, 5000);

  // Smooth scroll down to highlight Digital Dark Spots concept
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: "smooth" }));
  await activeWait(page, 6000);

  await page.evaluate(() => window.scrollBy({ top: 520, behavior: "smooth" }));
  await activeWait(page, 6000);

  // Scroll down to showcase 3 demo cases
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
  await activeWait(page, 5000);

  console.log("Scene 2: Launching Decision Studio with Case 1 (0:22 - 0:42)");
  await page.goto("http://localhost:3000/studio?demo=scholarship", { waitUntil: "networkidle" });
  await activeWait(page, 5000);

  // Scroll down to show Eval Bar & score
  await page.evaluate(() => window.scrollBy({ top: 280, behavior: "smooth" }));
  await activeWait(page, 8000);

  // Scroll to show score breakdown details
  await page.evaluate(() => window.scrollBy({ top: 150, behavior: "smooth" }));
  await activeWait(page, 7000);

  console.log("Scene 3: Inspecting Blunder & Evidence Drawer (0:42 - 0:56)");
  try {
    const inspectBtn = page.locator("button:has-text('Inspect Evidence')").first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      // Stay on the highlighted verified quote
      await activeWait(page, 11000);
      // Close drawer
      const closeBtn = page.locator("button:has-text('✕')").first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  } catch (e) {
    console.log("Inspect evidence note:", e);
  }
  await activeWait(page, 3000);

  console.log("Scene 4: Blunder Replay Simulator (0:56 - 1:12)");
  try {
    const replayTab = page.locator("button:has-text('Blunder Replay')").first();
    if (await replayTab.isVisible()) {
      await replayTab.click();
      await activeWait(page, 4000);
      // Click fix simulation button
      const simBtn = page.locator("button:has-text('Fix')").first();
      if (await simBtn.isVisible()) {
        await simBtn.click();
        // Pause to watch Eval Bar jump from -1.2 to +1.8
        await activeWait(page, 12000);
      }
    }
  } catch (e) {
    console.log("Replay tab note:", e);
  }

  console.log("Scene 5: Opponent Mode (1:12 - 1:23)");
  try {
    const opponentTab = page.locator("button:has-text('Opponent Mode')").first();
    if (await opponentTab.isVisible()) {
      await opponentTab.click();
      await activeWait(page, 4000);
      // Click first attack vector to reveal counter-move
      const attackCard = page.locator("text=Attack Vector 1").first();
      if (await attackCard.isVisible()) {
        await attackCard.click();
        await activeWait(page, 7000);
      }
    }
  } catch (e) {
    console.log("Opponent tab note:", e);
  }

  console.log("Scene 6: Executive Dossier Export (1:23 - 1:33)");
  try {
    const exportBtn = page.locator("button:has-text('Export Briefing')").first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await activeWait(page, 4000);
      // Scroll down inside the modal
      await page.mouse.wheel(0, 350);
      await activeWait(page, 4000);
      await page.mouse.wheel(0, 350);
      await activeWait(page, 4000);
    }
  } catch (e) {
    console.log("Export button note:", e);
  }

  console.log("Scene 7: Outro & Final View (1:33 - 1:36)");
  await activeWait(page, 4000);

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
    console.log("SUCCESS! True 90-second video saved to:", targetVideo);
  }
}

recordWalkthrough90s().catch(console.error);


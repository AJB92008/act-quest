// Runs the real browser test suite (tests/run.html) headlessly via
// Playwright, for CI — the app itself has no build step and no Node
// toolchain, so this script (and Playwright as a devDependency) exist
// purely to give a real browser environment to run the same ES modules
// tests/run.html already runs interactively in a dev-server tab. Exits
// non-zero on any test failure, or if the suite doesn't finish in time.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 8934;
const URL = `http://localhost:${PORT}/tests/run.html`;
const READY_TIMEOUT_MS = 15000;
const RUN_TIMEOUT_MS = 60000;

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error(`Dev server never became ready at ${url}`);
}

async function main() {
  const server = spawn("python3", ["-m", "http.server", String(PORT)], {
    stdio: "ignore",
  });

  let exitCode = 1;
  try {
    await waitForServer(`http://localhost:${PORT}/`, READY_TIMEOUT_MS);

    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      page.on("pageerror", (err) => console.error("Page error:", err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") console.error("Console error:", msg.text());
      });

      await page.goto(URL);
      // run.html sets document.title to "✅ P/T — Act Quest Tests" or
      // "❌ P/T — Act Quest Tests" once every test (including async ones)
      // has resolved — that's the actual completion signal, not just DOM load.
      await page.waitForFunction(() => /\d+\/\d+/.test(document.title), null, { timeout: RUN_TIMEOUT_MS });

      const title = await page.title();
      const match = title.match(/(\d+)\/(\d+)/);
      const [, passCount, totalCount] = match;

      const lines = await page.$$eval("#out .line", (els) => els.map((el) => el.textContent));
      for (const line of lines) console.log(line);

      console.log(`\n${title}`);

      if (passCount === totalCount) {
        exitCode = 0;
      } else {
        console.error(`\n${totalCount - passCount} test(s) failed.`);
        exitCode = 1;
      }
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("Test run failed:", err.message);
    exitCode = 1;
  } finally {
    server.kill();
  }

  process.exit(exitCode);
}

main();

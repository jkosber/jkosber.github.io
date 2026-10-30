// Runs check-site.js outside the Playwright MCP tool, in Chromium or WebKit.
// Usage: node run-check.js <chromium|webkit>
// PLAYWRIGHT_MODULE points at a Node Playwright install whose browser builds are
// downloaded; without it, `playwright` is resolved the usual way.
// PLAYWRIGHT_CHROMIUM_PATH names a Chromium executable to launch instead of
// Playwright's download; ignored for WebKit.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function launchOptions(engine, env) {
  return engine === 'chromium' && env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: env.PLAYWRIGHT_CHROMIUM_PATH } : {};
}

function main() {
  const engine = process.argv[2];
  if (!['chromium', 'webkit'].includes(engine)) {
    console.error('usage: node run-check.js <chromium|webkit>');
    process.exit(2);
  }
  let playwright;
  try {
    playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  } catch {
    console.error('Playwright not found: set PLAYWRIGHT_MODULE to a Node Playwright install whose browsers are downloaded.');
    process.exit(2);
  }
  // check-site.js is a bare function expression so the MCP tool can load it; compile it here.
  const checkFile = path.join(__dirname, 'check-site.js');
  const check = vm.runInThisContext(fs.readFileSync(checkFile, 'utf8'), { filename: checkFile }); // anti-slop-allow: compiles this repo's own check script, never external input

  (async () => {
    const browser = await playwright[engine].launch(launchOptions(engine, process.env));
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const result = await check(await context.newPage());
      console.log(JSON.stringify(result, null, 1));
      process.exitCode = result.problems.length ? 1 : 0;
    } finally {
      await browser.close();
    }
  })();
}

if (require.main === module) main();

module.exports = { launchOptions };

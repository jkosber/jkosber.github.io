const test = require('node:test');
const assert = require('node:assert/strict');
const { launchOptions } = require('./run-check.js');

test('chromium uses PLAYWRIGHT_CHROMIUM_PATH as executablePath', () => {
  assert.deepEqual(launchOptions('chromium', { PLAYWRIGHT_CHROMIUM_PATH: '/usr/bin/chromium' }), { executablePath: '/usr/bin/chromium' });
});
test('chromium without the variable launches the default build', () => {
  assert.deepEqual(launchOptions('chromium', {}), {});
  assert.deepEqual(launchOptions('chromium', { PLAYWRIGHT_CHROMIUM_PATH: '' }), {});
});
test('webkit ignores PLAYWRIGHT_CHROMIUM_PATH', () => {
  assert.deepEqual(launchOptions('webkit', { PLAYWRIGHT_CHROMIUM_PATH: '/usr/bin/chromium' }), {});
});

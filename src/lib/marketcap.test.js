import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarketCap } from './marketcap.js';

test('parseMarketCap parses valid market cap strings', () => {
  assert.equal(parseMarketCap('$3,983,727,339,000'), 3983727339000);
  assert.equal(parseMarketCap('$100,000'), 100000);
});

test('parseMarketCap handles N/A and invalid values gracefully', () => {
  assert.equal(parseMarketCap('N/A'), null);
  assert.equal(parseMarketCap(null), null);
  assert.equal(parseMarketCap(''), null);
  assert.equal(parseMarketCap('invalid'), null);
});

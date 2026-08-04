import test from 'node:test';
import assert from 'node:assert/strict';
import { processEarnings } from './earnings.js';

test('processEarnings returns array of events with watchlist filter', async () => {
  // Pass an empty watchlist (should return empty array without errors)
  const result = await processEarnings({ watchlist: [] });
  assert.deepEqual(result, []);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { todayISO, shiftDays, dateRange, parseNasdaqAsOf } from './date.js';

test('todayISO returns YYYY-MM-DD format', () => {
  const date = todayISO();
  assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
});

test('shiftDays correctly offsets dates', () => {
  assert.equal(shiftDays('2025-03-01', 1), '2025-03-02');
  assert.equal(shiftDays('2025-03-01', -1), '2025-02-28');
  assert.equal(shiftDays('2024-02-28', 1), '2024-02-29'); // leap year
});

test('dateRange generates expected range of dates', () => {
  const dates = [...dateRange('2025-03-10', 3)];
  assert.deepEqual(dates, ['2025-03-10', '2025-03-11', '2025-03-12']);
});

test('parseNasdaqAsOf parses Nasdaq asOf strings correctly', () => {
  assert.equal(parseNasdaqAsOf('Mar 15, 2025'), '2025-03-15');
  assert.equal(parseNasdaqAsOf('Jan 05, 2026'), '2026-01-05');
  assert.equal(parseNasdaqAsOf('Invalid Date'), null);
  assert.equal(parseNasdaqAsOf(null), null);
});

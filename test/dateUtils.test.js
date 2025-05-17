import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatRelativeTime } from '../build/utils/dateUtils.js';

test('formatRelativeTime minutes', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 5 * 60 * 1000);
  assert.equal(formatRelativeTime(d), '5m ago');
});

test('formatRelativeTime hours', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  assert.equal(formatRelativeTime(d), '2h ago');
});

test('formatRelativeTime days', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  assert.equal(formatRelativeTime(d), '3d ago');
});

test('formatRelativeTime weeks', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);
  assert.equal(formatRelativeTime(d), '2w ago');
});

test('formatRelativeTime months', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
  assert.equal(formatRelativeTime(d), '3mo ago');
});

test('formatRelativeTime years', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
  assert.equal(formatRelativeTime(d), '2y ago');
});

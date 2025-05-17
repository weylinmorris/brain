import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatRelativeTime } from '../build/utils/dateUtils.js';
import { classifyQuery } from '../build/utils/aiUtils.js';
import {
  getPreviewFromBlockContent,
  getContextualPreviewContent,
  getPreviewFromBlock,
} from '../build/utils/blockUtils.js';

const sampleBlock = {
  id: '1',
  title: 'Hello',
  content: JSON.stringify({
    root: { children: [{ text: 'Hello' }, { children: [{ text: 'world' }] }] },
  }),
  type: 'text',
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('formatRelativeTime recent', () => {
  const now = new Date();
  const d = new Date(now.getTime() - 30 * 1000);
  assert.equal(formatRelativeTime(d), 'just now');
});

test('classifyQuery works', async () => {
  assert.equal(await classifyQuery('Is this ok?'), 'question');
  assert.equal(await classifyQuery('Tell me something'), 'search');
});

test('classifyQuery trims whitespace', async () => {
  assert.equal(await classifyQuery('  hi?  '), 'question');
});

test('classifyQuery requires question mark at end', async () => {
  assert.equal(await classifyQuery('Is this? tricky'), 'search');
});

test('getPreviewFromBlockContent', () => {
  assert.equal(getPreviewFromBlockContent(sampleBlock), 'Hello world');
});

test('getContextualPreviewContent', () => {
  const res = getContextualPreviewContent(sampleBlock, 'world');
  assert.equal(res.matchStart >= 0, true);
  assert.equal(res.preview.includes('world'), true);
});

test('getPreviewFromBlock', () => {
  assert.equal(getPreviewFromBlock(sampleBlock), 'Hello');
});

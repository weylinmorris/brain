import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getPreviewFromBlockContent,
  getContextualPreviewContent,
  getPreviewFromBlock,
  getContextualPreviewTitle,
} from '../build/utils/blockUtils.js';

const sampleBlock = {
  id: '1',
  title: 'Hello world',
  content: JSON.stringify({
    root: { children: [{ text: 'Hello' }, { children: [{ text: 'world' }] }] },
  }),
  type: 'text',
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('getPreviewFromBlockContent invalid JSON', () => {
  const badBlock = { ...sampleBlock, content: '{invalid' };
  assert.equal(getPreviewFromBlockContent(badBlock), 'Error parsing content');
});

test('getPreviewFromBlockContent empty', () => {
  const emptyBlock = { ...sampleBlock, content: '' };
  assert.equal(getPreviewFromBlockContent(emptyBlock), 'Empty note');
});

test('getPreviewFromBlock empty title', () => {
  const noTitle = { ...sampleBlock, title: '' };
  assert.equal(getPreviewFromBlock(noTitle), 'Empty Note');
});

test('getContextualPreviewContent no match', () => {
  const res = getContextualPreviewContent(sampleBlock, 'foo');
  assert.equal(res.matchStart, -1);
  assert.equal(res.preview, 'Hello world');
});

test('getContextualPreviewContent empty search', () => {
  const res = getContextualPreviewContent(sampleBlock, '');
  assert.equal(res.matchStart, -1);
  assert.equal(res.preview, 'Hello world');
});

test('getContextualPreviewTitle basic search', () => {
  const res = getContextualPreviewTitle(sampleBlock, 'world');
  assert.equal(res.preview.includes('world'), true);
  assert.equal(res.matchStart >= 0, true);
});

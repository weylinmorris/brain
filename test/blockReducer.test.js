import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockReducer, initialBlockState } from '../build/reducers/blocks/reducer.js';

const sampleBlock = {
  id: '1',
  title: 'Test',
  content: 'test',
  type: 'text',
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('blockReducer add, update, remove', () => {
  let state = blockReducer(initialBlockState, { type: 'ADD_BLOCK', block: sampleBlock });
  assert.equal(state.blocks.length, 1);
  assert.equal(state.blocks[0].id, '1');

  const updated = { ...sampleBlock, title: 'Updated' };
  state = blockReducer(state, { type: 'UPDATE_BLOCK', block: updated });
  assert.equal(state.blocks[0].title, 'Updated');

  state = blockReducer(state, { type: 'SET_ACTIVE_BLOCK', id: '1' });
  assert.equal(state.activeBlockId, '1');

  state = blockReducer(state, { type: 'REMOVE_BLOCK', id: '1' });
  assert.equal(state.blocks.length, 0);
  assert.equal(state.activeBlockId, null);
});

test('blockReducer deduplicates recommended blocks', () => {
  const dupBlocks = [sampleBlock, sampleBlock, { ...sampleBlock, id: '2' }];
  const state = blockReducer(initialBlockState, {
    type: 'SET_RECOMMENDED_BLOCKS',
    blocks: dupBlocks,
  });
  assert.equal(state.recommendedBlocks.length, 2);
});

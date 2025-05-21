import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchReducer, initialSearchState } from '../build/reducers/search/reducer.js';

const sampleResults = {
  type: 'search',
  answer: null,
  sources: [],
  blocks: { titleMatches: [], contentMatches: [], similarityMatches: [] },
};

test('searchReducer basic flow', () => {
  let state = searchReducer(initialSearchState, { type: 'SET_QUERY', query: 'foo' });
  assert.equal(state.query, 'foo');

  state = searchReducer(state, { type: 'START_LOADING' });
  assert.equal(state.isLoading, true);

  state = searchReducer(state, { type: 'SET_RESULTS', results: sampleResults });
  assert.equal(state.results.type, 'search');
  assert.equal(state.isLoading, true); // still true until FINISH_LOADING

  state = searchReducer(state, { type: 'FINISH_LOADING' });
  assert.equal(state.isLoading, false);

  state = searchReducer(state, { type: 'CLEAR_RESULTS' });
  assert.equal(state.results, null);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projectReducer, initialProjectState } from '../build/reducers/projects/reducer.js';

const p1 = {
  id: '1',
  name: 'First',
  updatedAt: new Date('2023-01-01'),
  createdAt: new Date('2023-01-01'),
};

const p2 = {
  id: '2',
  name: 'Second',
  updatedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
};

test('projectReducer sorting and active id', () => {
  let state = projectReducer(initialProjectState, { type: 'SET_PROJECTS', projects: [p1, p2] });
  assert.equal(state.projects[0].id, '2');

  state = projectReducer(state, { type: 'ADD_PROJECT', project: p1 });
  assert.equal(state.activeProjectId, p1.id);

  const updated = { ...p2, name: 'Updated' };
  state = projectReducer(state, { type: 'UPDATE_PROJECT', project: updated });
  assert.equal(state.projects.find(p => p.id === '2').name, 'Updated');

  state = projectReducer(state, { type: 'REMOVE_PROJECT', id: p1.id });
  assert.equal(state.projects.some(p => p.id === p1.id), false);
});

test('projectReducer clear active', () => {
  let state = projectReducer(initialProjectState, { type: 'ADD_PROJECT', project: p1 });
  state = projectReducer(state, { type: 'CLEAR_ACTIVE_PROJECT' });
  assert.equal(state.activeProjectId, null);
});

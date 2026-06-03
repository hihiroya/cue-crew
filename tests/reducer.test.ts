import test from 'node:test';
import assert from 'node:assert/strict';
import { assignActorRoles } from '../src/game/actorLogic';
import { INITIAL_ACTORS, INITIAL_LOAD_STRAIN } from '../src/game/constants';
import { gameReducer } from '../src/game/gameReducer';
import type { GameState } from '../src/game/types';

function resultState(overrides: Partial<GameState> = {}): GameState {
  const focus = overrides.currentFocusActorId ?? 'lead';
  return {
    seed: 'reducer-test-seed',
    act: 1,
    turnInAct: 1,
    totalTurn: 1,
    theme: '1日目',
    performanceStyle: null,
    sceneScore: 0,
    flowScore: 0,
    trustScore: 0,
    backstageLoad: 0,
    loadBias: null,
    loadStrain: { ...INITIAL_LOAD_STRAIN },
    actors: assignActorRoles(INITIAL_ACTORS, focus),
    currentFocusActorId: focus,
    currentActorEvent: {
      type: 'silence',
      actorId: focus,
      title: '沈黙する',
      description: 'test event',
    },
    selectedPrep: 'makeSpace',
    selectedResponse: 'wait',
    lastResponses: [],
    pendingFrayEvent: undefined,
    logs: [],
    status: 'result',
    ...overrides,
  };
}

test('COMMIT_RESULT applies preview deltas and advances to the next performance slot', () => {
  const next = gameReducer(resultState(), { type: 'COMMIT_RESULT' });

  assert.equal(next.status, 'prep');
  assert.equal(next.totalTurn, 2);
  assert.equal(next.act, 1);
  assert.equal(next.turnInAct, 2);
  assert.equal(next.logs.length, 1);
  assert.equal(next.sceneScore, 4);
  assert.equal(next.flowScore, 2);
  assert.equal(next.trustScore, 3);
  assert.equal(next.backstageLoad, 0);
  assert.deepEqual(next.lastResponses, ['wait']);
  assert.equal(next.currentActorEvent, null);
  assert.equal(next.selectedPrep, null);
  assert.equal(next.selectedResponse, null);
});

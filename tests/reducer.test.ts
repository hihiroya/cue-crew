import test from 'node:test';
import assert from 'node:assert/strict';
import { assignActorRoles } from '../src/game/actorLogic';
import { INITIAL_ACTORS, INITIAL_LOAD_STRAIN } from '../src/game/constants';
import { gameReducer, readPerformanceHistory } from '../src/game/gameReducer';
import type { GameState, MainResponse, PrepAction } from '../src/game/types';

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

test('a full performance is deterministic for the same seed and choices', () => {
  const choices: Array<{ prep: PrepAction; response: MainResponse }> = [
    { prep: 'watch', response: 'catch' },
    { prep: 'makeSpace', response: 'wait' },
    { prep: 'tightenFlow', response: 'arrange' },
    { prep: 'prepareTransition', response: 'cut' },
    { prep: 'watch', response: 'catch' },
    { prep: 'makeSpace', response: 'wait' },
  ];
  const finalState = choices.reduce(
    (state, choice) => {
      const responseState = gameReducer(state, { type: 'SELECT_PREP', prep: choice.prep });
      const resultState = gameReducer(responseState, { type: 'SELECT_RESPONSE', response: choice.response });
      return gameReducer(resultState, { type: 'COMMIT_RESULT' });
    },
    gameReducer(resultState({ status: 'title' }), { type: 'START', seed: 'golden-performance-seed' }),
  );

  assert.equal(finalState.status, 'finished');
  assert.deepEqual({
    sceneScore: finalState.sceneScore,
    flowScore: finalState.flowScore,
    trustScore: finalState.trustScore,
    backstageLoad: finalState.backstageLoad,
    performanceStyle: finalState.performanceStyle,
    tiers: finalState.logs.map((log) => log.resultTier),
    titles: finalState.logs.map((log) => log.sceneTitle),
  }, {
    sceneScore: 6,
    flowScore: -2,
    trustScore: -2,
    backstageLoad: 1,
    performanceStyle: 'breath',
    tiers: ['smallSuccess', 'scene', 'fray', 'scene', 'fray', 'accident'],
    titles: ['小さく整った呼吸', '言葉を泳がせた一瞬', '揺れたまま進んだ拍', '静かに閉じた場面', '遅れた背中の見せ場', '散りかけた舞台'],
  });
});

test('readPerformanceHistory normalizes legacy results without insight', () => {
  const originalStorage = globalThis.localStorage;
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    },
  });
  store.set('honban.performance.history.v1', JSON.stringify([{
    seed: 'legacy-seed',
    finishedAt: '2026-01-01T00:00:00.000Z',
    sceneScore: 8,
    flowScore: -1,
    trustScore: 2,
    backstageLoad: 4,
    title: '古い公演',
    review: '古いレビュー',
    highlights: [],
    logs: [],
  }]));

  try {
    const [result] = readPerformanceHistory();
    assert.equal(result.seed, 'legacy-seed');
    assert.equal(result.insight.rank, 'D');
    assert.equal(result.insight.prepHits, 0);
    assert.equal(result.audienceSurvey.encoreInterest > 0, true);
    const persisted = JSON.parse(store.get('honban.performance.history.v1') ?? '[]');
    assert.equal(persisted[0].insight.rank, 'D');
    assert.equal(persisted[0].audienceSurvey.encoreInterest > 0, true);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalStorage,
    });
  }
});

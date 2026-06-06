import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ACTORS, INITIAL_LOAD_STRAIN } from '../src/game/constants';
import { frayFitFor, likelyFrayBias, maybeCreateFray, nextLoadStrain, resolvePendingFray } from '../src/game/fray';
import type { GameState, ResultPreview } from '../src/game/types';

function gameState(overrides: Partial<GameState> = {}): GameState {
  return {
    seed: 'test-seed',
    act: 2,
    turnInAct: 1,
    totalTurn: 3,
    theme: '2日目',
    performanceStyle: null,
    sceneScore: 0,
    flowScore: 0,
    trustScore: 0,
    backstageLoad: 4,
    loadBias: null,
    loadStrain: { ...INITIAL_LOAD_STRAIN },
    actors: INITIAL_ACTORS,
    currentFocusActorId: 'lead',
    currentActorEvent: {
      type: 'silence',
      actorId: 'lead',
      title: '沈黙する',
      description: 'test event',
    },
    selectedPrep: 'makeSpace',
    selectedResponse: null,
    lastResponses: [],
    logs: [],
    status: 'response',
    ...overrides,
  } as GameState;
}

function resultPreview(overrides: Partial<ResultPreview> = {}): ResultPreview {
  return {
    score: 2,
    day: 2,
    performanceSlot: 'matinee',
    performanceLabel: '2日目 マチネ',
    resultMode: 'matinee',
    performanceStyle: null,
    focusActorType: 'lead',
    actorState: 'contemplative',
    actorEventType: 'silence',
    prepAction: 'makeSpace',
    mainResponse: 'wait',
    resultTier: 'scene',
    scoreBreakdown: [],
    prepMatched: true,
    prepQuality: 'hit',
    sceneTitle: 'テスト場面',
    flavorText: 'テスト',
    deltaScene: 3,
    deltaFlow: 1,
    deltaTrust: 1,
    deltaLoad: 1,
    loadBias: 'sound',
    eventTitle: '沈黙する',
    eventDescription: 'テスト',
    prepRelationLabel: '準備が活きる',
    prepRelationTone: 'primary',
    responseAimLabel: '間や余韻を急かさず残す',
    prepRecoveryTone: 'matched',
    prepRecoveryLabel: '準備が活きた',
    prepRecoveryTitle: '余白が場面を支えた',
    prepRecoveryText: 'テスト',
    cueSummary: {
      keyPoint: 'テスト',
      cost: 'テスト',
      handoff: 'テスト',
      audienceReaction: 'テスト',
      lesson: 'テスト',
    },
    ...overrides,
  };
}

test('frayFitFor maps each fray area to strong, match, and miss outcomes', () => {
  const state = gameState({
    pendingFrayEvent: { bias: 'sound', title: '残響が少し長く残った' },
    backstageLoad: 4,
  });

  assert.equal(frayFitFor(state, 'wait').status, 'strong');
  assert.equal(frayFitFor(state, 'arrange').status, 'match');

  const miss = frayFitFor(state, 'catch');
  assert.equal(miss.status, 'miss');
  assert.equal(miss.deltaFlow, -1);
  assert.equal(miss.deltaLoad, 1);
});

test('nextLoadStrain accumulates the selected response area and relieves all areas after soiree', () => {
  const state = gameState({
    loadStrain: { light: 1, sound: 4, stageManagement: 2, props: 0 },
  });

  const afterWait = nextLoadStrain(state, resultPreview({ mainResponse: 'wait', loadBias: 'sound', deltaLoad: 2 }));
  assert.deepEqual(afterWait, { light: 1, sound: 5, stageManagement: 2, props: 0 });

  const afterSoireeRelief = nextLoadStrain(state, resultPreview({ mainResponse: 'wait', loadBias: 'sound', deltaLoad: -1 }), -1);
  assert.deepEqual(afterSoireeRelief, { light: 0, sound: 2, stageManagement: 1, props: 0 });
});

test('likelyFrayBias exposes only the strongest internal strain area', () => {
  const state = gameState({
    backstageLoad: 3,
    loadStrain: { light: 1, sound: 4, stageManagement: 2, props: 0 },
  });

  assert.equal(likelyFrayBias(state), 'sound');
});

test('maybeCreateFray uses strain rather than only the latest response bias', () => {
  const state = gameState({
    loadStrain: { light: 0, sound: 5, stageManagement: 0, props: 0 },
    loadBias: 'props',
  });
  const created = maybeCreateFray(
    state,
    resultPreview({ mainResponse: 'cut', loadBias: 'props', resultTier: 'fray', deltaLoad: 1 }),
    state.loadStrain,
  );

  assert.equal(created?.bias, 'sound');
});

test('resolvePendingFray carries a missed fray when no new fray is created', () => {
  const pendingFrayEvent = { bias: 'sound' as const, title: '残響が少し長く残った' };
  const state = gameState({ pendingFrayEvent, backstageLoad: 2 });

  const resolved = resolvePendingFray(
    state,
    resultPreview({ mainResponse: 'catch', resultTier: 'masterpiece', deltaLoad: 0 }),
    state.loadStrain,
  );

  assert.deepEqual(resolved, pendingFrayEvent);
});

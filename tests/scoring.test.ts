import test from 'node:test';
import assert from 'node:assert/strict';
import { assignActorRoles } from '../src/game/actorLogic';
import { INITIAL_ACTORS } from '../src/game/constants';
import { previewResult, responseInsight, tierFromScore } from '../src/game/scoring';
import type { ActorEvent, GameState } from '../src/game/types';

function event(type: ActorEvent['type'], actorId: ActorEvent['actorId']): ActorEvent {
  return {
    type,
    actorId,
    title: type,
    description: 'test event',
  };
}

function gameState(overrides: Partial<GameState> = {}): GameState {
  const focus = overrides.currentFocusActorId ?? 'lead';
  return {
    seed: 'scoring-test-seed',
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
    loadStrain: { light: 0, sound: 0, stageManagement: 0, props: 0 },
    actors: assignActorRoles(INITIAL_ACTORS, focus),
    currentFocusActorId: focus,
    currentActorEvent: event('silence', focus),
    selectedPrep: 'makeSpace',
    selectedResponse: 'wait',
    lastResponses: [],
    logs: [],
    status: 'result',
    ...overrides,
  };
}

test('tierFromScore keeps the documented result thresholds', () => {
  assert.equal(tierFromScore(7), 'masterpiece');
  assert.equal(tierFromScore(4), 'scene');
  assert.equal(tierFromScore(2), 'smallSuccess');
  assert.equal(tierFromScore(0), 'fray');
  assert.equal(tierFromScore(-1), 'accident');
});

test('previewResult scores a prepared silence and wait as a masterpiece with trust upside', () => {
  const preview = previewResult(gameState());

  assert.equal(preview.prepQuality, 'hit');
  assert.equal(preview.resultTier, 'masterpiece');
  assert.equal(preview.score, 9);
  assert.equal(preview.deltaScene, 4);
  assert.equal(preview.deltaFlow, 2);
  assert.equal(preview.deltaTrust, 3);
  assert.equal(preview.deltaLoad, -2);
});

test('prep misses cap the result even when event and actor affinity are strong', () => {
  const state = gameState({
    act: 2,
    turnInAct: 1,
    totalTurn: 3,
    theme: '2日目',
    currentFocusActorId: 'junior',
    actors: assignActorRoles(INITIAL_ACTORS, 'junior'),
    currentActorEvent: event('adlib', 'junior'),
    selectedPrep: 'tightenFlow',
    selectedResponse: 'catch',
  });

  const preview = previewResult(state);

  assert.equal(preview.prepQuality, 'miss');
  assert.equal(preview.score, 3);
  assert.equal(preview.resultTier, 'smallSuccess');
  assert.equal(preview.scoreBreakdown.some((item) => item.id === 'prep-cap'), true);
});

test('responseInsight exposes repeated response penalties before committing', () => {
  const insight = responseInsight(gameState({
    lastResponses: ['catch', 'catch'],
    selectedResponse: null,
  }), 'catch');

  assert.equal(insight.scoreBreakdown.find((item) => item.id === 'repeat')?.value, -1);
  assert.equal(insight.sideEffects.some((effect) => effect.target === 'load' && effect.repeat && effect.value === 2), true);
  assert.equal(insight.sideEffects.some((effect) => effect.target === 'flow' && effect.repeat && effect.value === -1), true);
});

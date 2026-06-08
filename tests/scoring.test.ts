import test from 'node:test';
import assert from 'node:assert/strict';
import { assignActorRoles } from '../src/game/actorLogic';
import { INITIAL_ACTORS } from '../src/game/constants';
import { previewResult, responseInsight, tierFromScore } from '../src/game/scoring';
import { decisionMemo } from '../src/content/ja/responsePanelCopy';
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
  } as GameState;
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
  assert.equal(preview.score, 8);
  assert.equal(preview.deltaScene, 4);
  assert.equal(preview.deltaFlow, 2);
  assert.equal(preview.deltaTrust, 3);
  assert.equal(preview.deltaLoad, -2);
});

test('prep misses add a pivot cost even when event and actor affinity are strong', () => {
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
  assert.equal(preview.score, 1);
  assert.equal(preview.resultTier, 'fray');
  assert.equal(preview.scoreBreakdown.some((item) => item.id === 'prep-pivot' && item.value === -2), true);
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

test('decision memo explains why a response can reach a masterpiece', () => {
  const insight = responseInsight(gameState({
    selectedResponse: null,
  }), 'wait');
  const memo = decisionMemo(insight);

  assert.equal(/名場面まで伸びる筋/.test(memo), true);
  assert.equal(/決め手/.test(memo), true);
  assert.equal(/出来事に強く噛み合う対応|上振れ幅が広がり/.test(memo), true);
});

test('arrange usually stabilizes to a scene unless the actor strongly supports it', () => {
  const leadArrange = previewResult(gameState({
    act: 2,
    turnInAct: 1,
    totalTurn: 3,
    theme: '2日目',
    currentActorEvent: event('positionShift', 'lead'),
    selectedPrep: 'tightenFlow',
    selectedResponse: 'arrange',
  }));
  const skilledArrange = previewResult(gameState({
    act: 2,
    turnInAct: 1,
    totalTurn: 3,
    theme: '2日目',
    currentFocusActorId: 'skilled',
    actors: assignActorRoles(INITIAL_ACTORS, 'skilled'),
    currentActorEvent: event('positionShift', 'skilled'),
    selectedPrep: 'tightenFlow',
    selectedResponse: 'arrange',
  }));

  assert.equal(leadArrange.resultTier, 'scene');
  assert.equal(leadArrange.scoreBreakdown.some((item) => item.id === 'arrange-cap'), true);
  assert.equal(skilledArrange.resultTier, 'masterpiece');
});

test('decision memo explains why arrange stops short of a masterpiece', () => {
  const insight = responseInsight(gameState({
    act: 2,
    turnInAct: 1,
    totalTurn: 3,
    theme: '2日目',
    currentActorEvent: event('positionShift', 'lead'),
    selectedPrep: 'tightenFlow',
    selectedResponse: null,
  }), 'arrange');
  const memo = decisionMemo(insight);

  assert.equal(/名場面には届きにくい/.test(memo), true);
  assert.equal(/整える判断の上限/.test(memo), true);
  assert.equal(/技巧派/.test(memo), true);
  assert.equal(/ほころび回収/.test(memo), true);
});

test('prepared transition makes cut a strong single-use closure', () => {
  const preview = previewResult(gameState({
    act: 2,
    turnInAct: 1,
    totalTurn: 3,
    theme: '2日目',
    currentFocusActorId: 'skilled',
    actors: assignActorRoles(INITIAL_ACTORS, 'skilled'),
    currentActorEvent: event('positionShift', 'skilled'),
    selectedPrep: 'prepareTransition',
    selectedResponse: 'cut',
  }));
  const repeated = responseInsight(gameState({
    selectedResponse: null,
    lastResponses: ['cut'],
  }), 'cut');

  assert.equal(preview.resultTier, 'masterpiece');
  assert.equal(preview.scoreBreakdown.some((item) => item.id === 'prep-response-guard' && item.value === 2), true);
  assert.equal(preview.scoreBreakdown.some((item) => item.id === 'cut-containment' && item.value === 2), true);
  assert.equal(repeated.scoreBreakdown.find((item) => item.id === 'repeat')?.value, -1);
  assert.equal(repeated.sideEffects.some((effect) => effect.target === 'trust' && effect.repeat && effect.value === -1), true);
});

test('strong fray recovery adds a reward only when it changes the response rhythm', () => {
  const recovery = responseInsight(gameState({
    pendingFrayEvent: { bias: 'sound', title: '残響が少し長く残った' },
    selectedResponse: null,
    lastResponses: ['catch'],
  }), 'wait');
  const repeated = responseInsight(gameState({
    pendingFrayEvent: { bias: 'sound', title: '残響が少し長く残った' },
    selectedResponse: null,
    lastResponses: ['wait'],
  }), 'wait');

  assert.equal(recovery.scoreBreakdown.some((item) => item.id === 'fray-reward' && item.value === 2), true);
  assert.equal(repeated.scoreBreakdown.some((item) => item.id === 'fray-reward'), false);
});

test('individual actor trust supports matching responses', () => {
  const actors = assignActorRoles(INITIAL_ACTORS.map((actor) => (
    actor.id === 'lead' ? { ...actor, trust: 3 } : actor
  )), 'lead');
  const insight = responseInsight(gameState({
    actors,
    selectedResponse: null,
  }), 'wait');

  assert.equal(insight.scoreBreakdown.some((item) => item.id === 'actor-trust' && item.value === 1), true);
  assert.equal(insight.actorTrustLabel?.includes('阿吽の呼吸'), true);

  const strongActors = assignActorRoles(INITIAL_ACTORS.map((actor) => (
    actor.id === 'lead' ? { ...actor, trust: 5 } : actor
  )), 'lead');
  const strongInsight = responseInsight(gameState({
    actors: strongActors,
    selectedResponse: null,
  }), 'wait');
  assert.equal(strongInsight.actorTrustLabel?.includes('以心伝心'), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { topOmenEvents } from '../src/game/actorLogic';
import { gameReducer, titleState } from '../src/game/gameReducer';
import { responseInsight } from '../src/game/scoring';
import type { ActorEventType, GameState, MainResponse, PrepAction } from '../src/game/types';

const preps: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
const responses: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];

const prepForEvent: Record<ActorEventType, PrepAction> = {
  stepForward: 'watch',
  adlib: 'watch',
  heatUp: 'watch',
  silence: 'makeSpace',
  delayedExit: 'makeSpace',
  positionShift: 'tightenFlow',
  tempoRush: 'tightenFlow',
  ensembleWaver: 'tightenFlow',
};

type Strategy = 'alwaysCatch' | 'alwaysCut' | 'omenBest' | 'oracle';

function play(seed: string, strategy: Strategy): GameState {
  let state = gameReducer(titleState, { type: 'START', seed });
  while (state.status !== 'finished') {
    let prep: PrepAction = 'watch';
    let response: MainResponse = 'catch';
    if (strategy === 'alwaysCut') {
      prep = 'prepareTransition';
      response = 'cut';
    } else if (strategy === 'omenBest') {
      const actor = state.actors.find((item) => item.id === state.currentFocusActorId) ?? state.actors[0];
      prep = prepForEvent[topOmenEvents(actor)[0].event];
      const responseState = gameReducer(state, { type: 'SELECT_PREP', prep });
      response = bestResponse(responseState);
      state = commit(responseState, response);
      continue;
    } else if (strategy === 'oracle') {
      const best = bestPrepAndResponse(state);
      prep = best.prep;
      response = best.response;
    }
    state = commit(gameReducer(state, { type: 'SELECT_PREP', prep }), response);
  }
  return state;
}

function commit(responseState: GameState, response: MainResponse) {
  return gameReducer(gameReducer(responseState, { type: 'SELECT_RESPONSE', response }), { type: 'COMMIT_RESULT' });
}

function bestResponse(state: GameState): MainResponse {
  return responses
    .map((response) => ({ response, score: responseInsight(state, response).score }))
    .sort((a, b) => b.score - a.score)[0].response;
}

function bestPrepAndResponse(state: GameState) {
  let best: { prep: PrepAction; response: MainResponse; score: number } | null = null;
  for (const prep of preps) {
    const responseState = gameReducer(state, { type: 'SELECT_PREP', prep });
    for (const response of responses) {
      const score = responseInsight(responseState, response).score;
      if (!best || score > best.score) best = { prep, response, score };
    }
  }
  return best ?? { prep: 'watch' as const, response: 'catch' as const, score: 0 };
}

test('single response strategies keep clear weaknesses while oracle uses cut sometimes', () => {
  const seeds = Array.from({ length: 40 }, (_, index) => `balance-${index}`);
  const alwaysCatch = seeds.map((seed) => play(seed, 'alwaysCatch'));
  const alwaysCut = seeds.map((seed) => play(seed, 'alwaysCut'));
  const oracle = seeds.map((seed) => play(seed, 'oracle'));
  const avg = (states: GameState[], key: 'sceneScore' | 'flowScore' | 'trustScore' | 'backstageLoad') => (
    states.reduce((total, state) => total + state[key], 0) / states.length
  );
  const oracleCutCount = oracle.flatMap((state) => state.logs).filter((log) => log.mainResponse === 'cut').length;

  assert.equal(avg(alwaysCatch, 'flowScore') < 0, true);
  assert.equal(avg(alwaysCatch, 'backstageLoad') >= 3, true);
  assert.equal(avg(alwaysCut, 'trustScore') < 0, true);
  assert.equal(oracleCutCount > 20, true);
  assert.equal(avg(oracle, 'sceneScore') > avg(alwaysCatch, 'sceneScore'), true);
});

test('omen-based play is strong but still trails full information play', () => {
  const seeds = Array.from({ length: 40 }, (_, index) => `balance-omen-${index}`);
  const omenBest = seeds.map((seed) => play(seed, 'omenBest'));
  const oracle = seeds.map((seed) => play(seed, 'oracle'));
  const avgScore = (states: GameState[]) => (
    states.reduce((total, state) => total + state.sceneScore * 2 + state.flowScore + state.trustScore - state.backstageLoad * 2, 0) / states.length
  );

  assert.equal(avgScore(oracle) > avgScore(omenBest), true);
});

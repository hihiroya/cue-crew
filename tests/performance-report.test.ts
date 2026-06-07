import test from 'node:test';
import assert from 'node:assert/strict';
import { createPerformanceInsight } from '../src/game/performanceReport';
import type { ResultTier, TurnLog } from '../src/game/types';

function log(totalTurn: number, resultTier: ResultTier = 'masterpiece', prepMatched = true): TurnLog {
  return {
    act: Math.ceil(totalTurn / 2),
    turnInAct: totalTurn % 2 === 1 ? 1 : 2,
    totalTurn,
    focusActorType: 'lead',
    actorState: 'contemplative',
    actorEventType: 'silence',
    prepAction: 'makeSpace',
    mainResponse: 'wait',
    resultTier,
    score: resultTier === 'masterpiece' ? 8 : resultTier === 'scene' ? 5 : -1,
    performanceStyle: 'breath',
    prepMatched,
    prepQuality: prepMatched ? 'hit' : 'miss',
    sceneTitle: `test-${totalTurn}`,
    flavorText: '',
    deltaScene: resultTier === 'masterpiece' ? 4 : 3,
    deltaFlow: 2,
    deltaTrust: 2,
    deltaLoad: 0,
    loadBias: 'sound',
  };
}

test('S+ requires score, clean run, prep hits, scene count, and finale success', () => {
  const logs = Array.from({ length: 6 }, (_, index) => log(index + 1));
  const insight = createPerformanceInsight(logs, 28, 8, 6, 0);

  assert.equal(insight.totalScore, 70);
  assert.equal(insight.rank, 'S+');
  assert.equal(insight.pointsToNextRank, null);
});

test('score that reaches S+ threshold is capped at S when S+ conditions are missing', () => {
  const logs = Array.from({ length: 6 }, (_, index) => log(index + 1, index === 5 ? 'smallSuccess' : 'masterpiece', index < 3));
  const insight = createPerformanceInsight(logs, 29, 8, 6, 0);

  assert.equal(insight.totalScore, 72);
  assert.equal(insight.rank, 'S');
  assert.equal(insight.nextRank, 'S+');
  assert.equal(insight.pointsToNextRank, 0);
});

test('accidents and high load cap the final rank even with high score', () => {
  const logs = Array.from({ length: 6 }, (_, index) => log(index + 1, index === 2 ? 'accident' : 'masterpiece'));
  const insight = createPerformanceInsight(logs, 30, 8, 8, 4);

  assert.equal(insight.totalScore, 65);
  assert.equal(insight.rank, 'B');
  assert.equal(insight.nextRank, 'A');
  assert.equal(insight.pointsToNextRank, 0);
});

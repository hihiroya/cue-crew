import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDailyEventWeights, dailyRunForSeed } from '../src/game/dailyRun';
import { eventWeightsFor } from '../src/game/actorLogic';
import { INITIAL_ACTORS } from '../src/game/constants';
import { mergeCollectionResult } from '../src/game/rogueliteProgress';
import type { PerformanceResult } from '../src/game/types';

test('daily modifier affects only daily seeds', () => {
  const actor = INITIAL_ACTORS[0];
  const weights = eventWeightsFor(actor);

  assert.equal(dailyRunForSeed('honban-regular-seed'), null);
  assert.deepEqual(applyDailyEventWeights('honban-regular-seed', 1, actor, weights), weights);

  const changed = INITIAL_ACTORS.some((dailyActor) => {
    const base = eventWeightsFor(dailyActor);
    return JSON.stringify(applyDailyEventWeights('honban-daily-test', 1, dailyActor, base)) !== JSON.stringify(base);
  });
  assert.equal(changed, true);
});

test('collection merge records scenes and first-time achievements', () => {
  const result = {
    seed: 'collection-seed',
    finishedAt: '2026-06-04T00:00:00.000Z',
    insight: {
      unlockedAchievements: [
        { id: 'read-the-room', label: '兆候読みの達人', detail: '準備を5回以上活かした' },
      ],
    },
    logs: [
      {
        act: 1,
        turnInAct: 1,
        totalTurn: 1,
        focusActorType: 'junior',
        actorState: 'elated',
        actorEventType: 'adlib',
        prepAction: 'watch',
        mainResponse: 'catch',
        resultTier: 'scene',
        score: 5,
        performanceStyle: null,
        prepMatched: true,
        prepQuality: 'hit',
        sceneTitle: '拾われたアドリブ',
        flavorText: '',
        deltaScene: 3,
        deltaFlow: 1,
        deltaTrust: 1,
        deltaLoad: 0,
        loadBias: 'light',
      },
    ],
  } as PerformanceResult;

  const collection = mergeCollectionResult({ scenes: {}, achievements: {} }, result);

  assert.equal(Object.keys(collection.scenes).length, 1);
  assert.equal(Object.keys(collection.achievements).length, 1);
  assert.equal(collection.achievements['read-the-room'].firstSeed, 'collection-seed');
});

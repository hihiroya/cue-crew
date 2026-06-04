import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDailyEventWeights, dailyRunForSeed } from '../src/game/dailyRun';
import { eventWeightsFor } from '../src/game/actorLogic';
import { INITIAL_ACTORS } from '../src/game/constants';
import { mergeCollectionResult, nextChallengeRecommendation, replayDeltaForResponse, readDailyBestResults, saveDailyBestForResult } from '../src/game/rogueliteProgress';
import { analyzeReplayImprovement } from '../src/game/replayAnalysis';
import type { PerformanceResult, TurnLog } from '../src/game/types';

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

test('replay delta compares current preview against previous turn', () => {
  const previous = {
    resultTier: 'smallSuccess',
    deltaLoad: 2,
  } as TurnLog;

  assert.deepEqual(replayDeltaForResponse({ currentTier: 'scene', currentLoad: 1, previous }), {
    tone: 'up',
    label: '前回より上',
  });
  assert.deepEqual(replayDeltaForResponse({ currentTier: 'smallSuccess', currentLoad: 3, previous }), {
    tone: 'down',
    label: '負荷重い',
  });
});

test('daily best storage keeps the best daily score only', () => {
  const originalStorage = globalThis.localStorage;
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    },
  });
  const low = dailyResult('honban-daily-test', 10);
  const high = dailyResult('honban-daily-test', 18);

  try {
    saveDailyBestForResult(low);
    saveDailyBestForResult(high);
    saveDailyBestForResult(low);
    assert.equal(readDailyBestResults()['honban-daily-test'].insight.totalScore, 18);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalStorage,
    });
  }
});

test('next challenge recommendation points replay at improveable turns', () => {
  const result = dailyResult('replay-seed', 20);
  result.logs = [{
    act: 2,
    turnInAct: 2,
    totalTurn: 4,
    focusActorType: 'lead',
    actorState: 'anxious',
    actorEventType: 'silence',
    prepAction: 'watch',
    mainResponse: 'catch',
    resultTier: 'fray',
    score: 1,
    performanceStyle: 'heat',
    prepMatched: false,
    prepQuality: 'miss',
    sceneTitle: 'ほどけかけた場面',
    flavorText: '',
    deltaScene: 0,
    deltaFlow: -1,
    deltaTrust: -1,
    deltaLoad: 2,
    loadBias: 'light',
  }];

  const recommendation = nextChallengeRecommendation({ result, collection: { scenes: {}, achievements: {} } });

  assert.equal(recommendation.kind, 'sameSeed');
  assert.equal(recommendation.seed, 'replay-seed');
});

test('replay analysis suggests a concrete alternate cue when it improves a run', () => {
  const result = dailyResult('analysis-seed', 10);
  result.logs = [
    logFor(1, 'watch', 'catch', 'scene', '拾われたアドリブ', 3, 1, 1, 1, 'hit'),
    logFor(2, 'watch', 'cut', 'accident', '閉じ損ねた余韻', -1, -2, -2, 2, 'miss'),
    logFor(3, 'tightenFlow', 'arrange', 'smallSuccess', '小さく整った呼吸', 1, 1, 0, -1, 'hit'),
    logFor(4, 'watch', 'catch', 'fray', '熱だけが残った一瞬', 0, -1, -1, 2, 'miss'),
    logFor(5, 'makeSpace', 'wait', 'scene', '客席まで届いた間', 3, 1, 1, -1, 'hit'),
    logFor(6, 'prepareTransition', 'cut', 'smallSuccess', '次へ渡した一手', 1, 1, 0, 0, 'hit'),
  ];

  const suggestion = analyzeReplayImprovement(result);

  assert.equal(Boolean(suggestion), true);
  if (!suggestion) return;
  assert.equal(typeof suggestion.prep, 'string');
  assert.equal(typeof suggestion.response, 'string');
});

function dailyResult(seed: string, totalScore: number): PerformanceResult {
  return {
    seed,
    finishedAt: '2026-06-04T00:00:00.000Z',
    sceneScore: 0,
    flowScore: 0,
    trustScore: 0,
    backstageLoad: 0,
    performanceStyle: null,
    title: 'daily',
    review: '',
    reviewNotes: [],
    insight: {
      totalScore,
      rank: 'C',
      nextRank: 'B',
      pointsToNextRank: 1,
      scoreNote: '',
      prepHits: 0,
      prepHitRate: 0,
      masterpieceCount: 0,
      sceneOrBetterCount: 0,
      frayOrAccidentCount: 0,
      dominantResponse: 'catch',
      decisionDistribution: [],
      bestCue: null,
      nextNote: '',
      buildStyle: { style: null, label: '未確立', level: 0, progress: 0, next: 2, note: '' },
      discoveryScore: 0,
      unlockedAchievements: [],
      sceneCollectionCount: 0,
      performanceBadges: [],
    },
    audienceSurvey: { encoreInterest: 50, lingeringAfterglow: 50, sceneHeat: 50, stability: 50 },
    mediaReview: { outlet: '', stars: 3, headline: '', quote: '' },
    logs: [],
    highlights: [],
  };
}

function logFor(
  totalTurn: number,
  prepAction: TurnLog['prepAction'],
  mainResponse: TurnLog['mainResponse'],
  resultTier: TurnLog['resultTier'],
  sceneTitle: string,
  deltaScene: number,
  deltaFlow: number,
  deltaTrust: number,
  deltaLoad: number,
  prepQuality: TurnLog['prepQuality'],
): TurnLog {
  return {
    act: Math.ceil(totalTurn / 2),
    turnInAct: totalTurn % 2 === 1 ? 1 : 2,
    totalTurn,
    focusActorType: 'junior',
    actorState: 'elated',
    actorEventType: 'adlib',
    prepAction,
    mainResponse,
    resultTier,
    score: 0,
    performanceStyle: totalTurn >= 2 ? 'heat' : null,
    prepMatched: prepQuality === 'hit',
    prepQuality,
    sceneTitle,
    flavorText: '',
    deltaScene,
    deltaFlow,
    deltaTrust,
    deltaLoad,
    loadBias: 'light',
  };
}

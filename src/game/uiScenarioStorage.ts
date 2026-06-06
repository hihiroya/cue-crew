import { uiScenarioCopy } from '../content/ja/uiScenarioCopy';

export function seedUiScenarioStorage(name: string) {
  if (name !== 'title-history-legacy' && name !== 'title-collection') return;
  try {
    if (name === 'title-history-legacy') {
      globalThis.localStorage?.setItem('honban.performance.history.v1', JSON.stringify([
        {
          seed: 'legacy-history-seed',
          finishedAt: '2026-01-01T00:00:00.000Z',
          sceneScore: 8,
          flowScore: -2,
          trustScore: 1,
          backstageLoad: 4,
          performanceStyle: 'heat',
          title: uiScenarioCopy.legacyTitle,
          review: uiScenarioCopy.legacyReview,
          highlights: [],
          logs: [],
        },
      ]));
      return;
    }
    globalThis.localStorage?.setItem('honban.collection.v1', JSON.stringify({
      scenes: {
        [`junior:adlib:catch:${uiScenarioCopy.collectionSceneTitle}`]: {
          id: `junior:adlib:catch:${uiScenarioCopy.collectionSceneTitle}`,
          title: uiScenarioCopy.collectionSceneTitle,
          actor: 'junior',
          event: 'adlib',
          response: 'catch',
          bestTier: 'scene',
          firstSeed: 'ui-collection-seed',
          firstSeenAt: '2026-06-04T00:00:00.000Z',
        },
      },
      achievements: {
        'read-the-room': {
          id: 'read-the-room',
          label: uiScenarioCopy.collectionAchievement.label,
          detail: uiScenarioCopy.collectionAchievement.detail,
          firstSeed: 'ui-collection-seed',
          firstSeenAt: '2026-06-04T00:00:00.000Z',
        },
      },
    }));
    globalThis.localStorage?.setItem('honban.performance.history.v1', JSON.stringify([
      {
        seed: 'ui-collection-seed',
        finishedAt: '2026-06-04T00:00:00.000Z',
        sceneScore: 12,
        flowScore: 4,
        trustScore: 5,
        backstageLoad: 1,
        performanceStyle: 'control',
        title: uiScenarioCopy.collectionScenarioTitle,
        review: uiScenarioCopy.legacyReview,
        highlights: [],
        logs: [],
      },
    ]));
  } catch {
    // UI scenario helpers must not affect normal play if storage is unavailable.
  }
}

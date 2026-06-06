import { createAudienceSurvey, createMediaReview, createPerformanceInsight, createPerformanceReview } from '../../game/performanceReport';
import type { PerformanceResult } from '../../game/types';

export const PERFORMANCE_HISTORY_KEY = 'honban.performance.history.v1';

export function savePerformanceResult(result: PerformanceResult) {
  const current = readPerformanceHistory();
  const next = [result, ...current].slice(0, 8);
  localStorage.setItem(PERFORMANCE_HISTORY_KEY, JSON.stringify(next));
}

export function readPerformanceHistory(): PerformanceResult[] {
  try {
    const raw = localStorage.getItem(PERFORMANCE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PerformanceResult>[];
    const normalized = parsed.map(normalizePerformanceResult);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(PERFORMANCE_HISTORY_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

function normalizePerformanceResult(result: Partial<PerformanceResult>): PerformanceResult {
  const logs = result.logs ?? [];
  const sceneScore = result.sceneScore ?? 0;
  const flowScore = result.flowScore ?? 0;
  const trustScore = result.trustScore ?? 0;
  const backstageLoad = result.backstageLoad ?? 0;
  const fallbackReview = createPerformanceReview(logs, sceneScore, flowScore, trustScore, backstageLoad);
  const fallbackInsight = createPerformanceInsight(logs, sceneScore, flowScore, trustScore, backstageLoad);
  return {
    seed: result.seed ?? 'unknown-seed',
    finishedAt: result.finishedAt ?? new Date(0).toISOString(),
    sceneScore,
    flowScore,
    trustScore,
    backstageLoad,
    performanceStyle: result.performanceStyle ?? null,
    title: result.title ?? fallbackReview.title,
    review: result.review ?? fallbackReview.review,
    reviewNotes: result.reviewNotes ?? fallbackReview.reviewNotes,
    insight: { ...fallbackInsight, ...result.insight },
    audienceSurvey: result.audienceSurvey ?? createAudienceSurvey(logs, sceneScore, flowScore, trustScore, backstageLoad),
    mediaReview: result.mediaReview ?? createMediaReview(logs, sceneScore, flowScore, trustScore, backstageLoad),
    logs,
    highlights: result.highlights ?? logs.slice(0, 5),
  };
}

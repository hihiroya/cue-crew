import { PERFORMANCE_STYLE_DETAILS } from './constants';
import * as reportCopy from '../content/ja/reportCopy';
import { determinePerformanceStyle } from './scoring';
import { buildStyleSummary, discoverySummary } from './rogueliteProgress';
import type { AudienceSurvey, MainResponse, MediaReview, PerformanceInsight, ResultTier, TurnLog } from './types';

export function createPerformanceReview(logs: TurnLog[], sceneScore: number, flowScore: number, trustScore: number, backstageLoad = 0): { title: string; review: string; reviewNotes: string[] } {
  const catchCount = logs.filter((log) => log.mainResponse === 'catch').length;
  const waitCount = logs.filter((log) => log.mainResponse === 'wait').length;
  const arrangeCount = logs.filter((log) => log.mainResponse === 'arrange').length;
  const cutCount = logs.filter((log) => log.mainResponse === 'cut').length;
  const masterpieceCount = logs.filter((log) => log.resultTier === 'masterpiece').length;
  const prepHitCount = logs.filter((log) => log.prepMatched).length;
  const frayCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  const style = logs.find((log) => log.performanceStyle)?.performanceStyle ?? determinePerformanceStyle(logs);
  const styleLabel = PERFORMANCE_STYLE_DETAILS[style].label;
  const title = reportCopy.performanceTitle({ masterpieceCount, catchCount, waitCount, arrangeCount, sceneScore, flowScore, trustScore });

  const dominantResponse = reportCopy.responseCountItems({
    catch: catchCount,
    arrange: arrangeCount,
    wait: waitCount,
    cut: cutCount,
  }).sort((a, b) => b.count - a.count)[0];
  const lateRecovery = logs.find((log) => log.act >= 3 && log.mainResponse === 'arrange' && ['masterpiece', 'scene'].includes(log.resultTier));
  const earlyFray = logs.find((log) => log.act <= 3 && (log.resultTier === 'fray' || log.resultTier === 'accident'));
  const hitRate = logs.length > 0 ? Math.round((prepHitCount / logs.length) * 100) : 0;
  const reviewNotes = reportCopy.reviewNotes({
    styleLabel,
    prepHitCount,
    totalLogs: logs.length,
    hitRate,
    dominantResponse: dominantResponse.response,
    earlyFray,
    lateRecovery,
    backstageLoad,
  });
  if (frayCount >= 3) reviewNotes.push(reportCopy.manyFraysReviewNote);
  const review = reviewNotes.join('');
  return { title, review, reviewNotes };
}

function clampPercent(value: number) {
  return Math.max(18, Math.min(98, Math.round(value)));
}

const PERFORMANCE_RANKS: Array<{ rank: PerformanceInsight['rank']; threshold: number }> = [
  { rank: 'S+', threshold: 52 },
  { rank: 'S', threshold: 44 },
  { rank: 'A', threshold: 34 },
  { rank: 'B', threshold: 24 },
  { rank: 'C', threshold: 14 },
  { rank: 'D', threshold: Number.NEGATIVE_INFINITY },
];

export function createPerformanceInsight(logs: TurnLog[], sceneScore = 0, flowScore = 0, trustScore = 0, backstageLoad = 0): PerformanceInsight {
  const totalScore = sceneScore * 2 + flowScore + trustScore - backstageLoad * 2 - (backstageLoad >= 4 ? 3 : 0);
  const rankIndex = PERFORMANCE_RANKS.findIndex((item) => totalScore >= item.threshold);
  const rank = PERFORMANCE_RANKS[rankIndex]?.rank ?? 'D';
  const nextRankEntry = rankIndex > 0 ? PERFORMANCE_RANKS[rankIndex - 1] : null;
  const nextRank = (nextRankEntry?.rank ?? null) as PerformanceInsight['nextRank'];
  const pointsToNextRank = nextRankEntry ? Math.max(0, nextRankEntry.threshold - totalScore) : null;
  const prepHits = logs.filter((log) => log.prepMatched).length;
  const prepHitRate = logs.length > 0 ? Math.round((prepHits / logs.length) * 100) : 0;
  const masterpieceCount = logs.filter((log) => log.resultTier === 'masterpiece').length;
  const sceneOrBetterCount = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const frayOrAccidentCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  const decisionDistribution = (['catch', 'arrange', 'wait', 'cut'] as MainResponse[]).map((response) => ({
    response,
    count: logs.filter((log) => log.mainResponse === response).length,
  }));
  const dominantResponse = [...decisionDistribution].sort((a, b) => b.count - a.count)[0]?.response ?? 'catch';
  const tierRank: Record<ResultTier, number> = { masterpiece: 4, scene: 3, smallSuccess: 2, fray: 1, accident: 0 };
  const bestCue = [...logs].sort((a, b) => (
    tierRank[b.resultTier] - tierRank[a.resultTier]
    || b.deltaScene - a.deltaScene
    || b.score - a.score
  ))[0] ?? null;
  const style = logs.find((log) => log.performanceStyle)?.performanceStyle ?? (logs.length >= 2 ? determinePerformanceStyle(logs) : null);
  const buildStyle = buildStyleSummary(logs, style);
  const discovery = discoverySummary(logs, backstageLoad);
  const nextNote = reportCopy.nextNote({ frayOrAccidentCount, backstageLoad, prepHitRate, sceneOrBetterCount });
  const scoreNote = reportCopy.scoreNote({ pointsToNextRank, nextRank, masterpieceCount, backstageLoad, prepHitRate });
  return {
    totalScore,
    rank,
    nextRank,
    pointsToNextRank,
    scoreNote,
    prepHits,
    prepHitRate,
    masterpieceCount,
    sceneOrBetterCount,
    frayOrAccidentCount,
    dominantResponse,
    decisionDistribution,
    bestCue,
    nextNote,
    buildStyle,
    discoveryScore: discovery.score,
    unlockedAchievements: discovery.achievements,
    sceneCollectionCount: discovery.sceneIds.length,
  };
}

export function createAudienceSurvey(logs: TurnLog[], sceneScore: number, flowScore: number, trustScore: number, backstageLoad = 0): AudienceSurvey {
  const catchCount = logs.filter((log) => log.mainResponse === 'catch').length;
  const waitCount = logs.filter((log) => log.mainResponse === 'wait').length;
  const arrangeCount = logs.filter((log) => log.mainResponse === 'arrange').length;
  const sceneOrBetterCount = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const frayOrAccidentCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  return {
    encoreInterest: clampPercent(54 + sceneScore * 2 + trustScore * 3 + sceneOrBetterCount * 4 - backstageLoad * 3),
    lingeringAfterglow: clampPercent(50 + trustScore * 4 + waitCount * 5 + sceneOrBetterCount * 5 - frayOrAccidentCount * 4),
    sceneHeat: clampPercent(52 + sceneScore * 3 + catchCount * 5 + sceneOrBetterCount * 4 - frayOrAccidentCount * 3),
    stability: clampPercent(60 + flowScore * 4 + arrangeCount * 5 - backstageLoad * 8 - frayOrAccidentCount * 6),
  };
}

export function createMediaReview(logs: TurnLog[], sceneScore: number, flowScore: number, trustScore: number, backstageLoad = 0): MediaReview {
  const style = logs.find((log) => log.performanceStyle)?.performanceStyle ?? determinePerformanceStyle(logs);
  const sceneOrBetterCount = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const frayOrAccidentCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  const reviewScore = sceneScore + flowScore + trustScore - backstageLoad * 2 + sceneOrBetterCount * 3 - frayOrAccidentCount * 2;
  const baseStars = reviewScore >= 28 ? 5 : reviewScore >= 16 ? 4 : reviewScore >= 6 ? 3 : reviewScore >= 0 ? 2 : 1;
  const heatFloor = sceneScore >= 16 || sceneOrBetterCount >= 4 ? 4 : sceneScore >= 10 || sceneOrBetterCount >= 3 ? 3 : 1;
  const roughCap = (flowScore < 0 || backstageLoad >= 4) && sceneOrBetterCount < 4 ? 3 : 5;
  const stars = Math.min(Math.max(baseStars, heatFloor), roughCap);
  const headline = reportCopy.mediaHeadline({ stars, sceneScore, backstageLoad });
  const quote = reportCopy.mediaQuote({ stars, style, sceneScore, backstageLoad });
  return {
    outlet: reportCopy.mediaOutlet,
    stars,
    headline,
    quote,
  };
}

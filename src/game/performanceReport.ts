import { PERFORMANCE_STYLE_DETAILS } from './constants';
import * as reportCopy from '../content/ja/reportCopy';
import { performanceBadgeCopy } from '../content/ja/rogueliteCopy';
import { determinePerformanceStyle } from './scoring';
import { buildStyleSummary, discoverySummary } from './rogueliteProgress';
import type { AudienceSurvey, MainResponse, MediaReview, PerformanceBadge, PerformanceInsight, ResultTier, TurnLog } from './types';

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
  { rank: 'S+', threshold: 66 },
  { rank: 'S', threshold: 54 },
  { rank: 'A', threshold: 42 },
  { rank: 'B', threshold: 30 },
  { rank: 'C', threshold: 18 },
  { rank: 'D', threshold: Number.NEGATIVE_INFINITY },
];

const RANK_ORDER: PerformanceInsight['rank'][] = ['D', 'C', 'B', 'A', 'S', 'S+'];

function rankValue(rank: PerformanceInsight['rank']) {
  return RANK_ORDER.indexOf(rank);
}

function lowerRank(a: PerformanceInsight['rank'], b: PerformanceInsight['rank']): PerformanceInsight['rank'] {
  return rankValue(a) <= rankValue(b) ? a : b;
}

function rankAbove(rank: PerformanceInsight['rank']): PerformanceInsight['nextRank'] {
  const next = RANK_ORDER[rankValue(rank) + 1];
  return next === 'D' ? null : (next ?? null) as PerformanceInsight['nextRank'];
}

function rankForScore(totalScore: number): PerformanceInsight['rank'] {
  return PERFORMANCE_RANKS.find((item) => totalScore >= item.threshold)?.rank ?? 'D';
}

function sPlusConditionMisses(args: {
  logs: TurnLog[];
  totalScore: number;
  backstageLoad: number;
  prepHits: number;
  sceneOrBetterCount: number;
  frayOrAccidentCount: number;
}): string[] {
  const finale = args.logs.find((log) => log.act === 3 && log.turnInAct === 2);
  const misses: Array<string | null> = [
    args.totalScore < 66 ? reportCopy.sPlusConditionCopy.totalScore : null,
    args.backstageLoad > 1 ? reportCopy.sPlusConditionCopy.backstageLoad : null,
    args.frayOrAccidentCount > 0 ? reportCopy.sPlusConditionCopy.noFray : null,
    args.prepHits < 4 ? reportCopy.sPlusConditionCopy.prepHits : null,
    args.sceneOrBetterCount < 5 ? reportCopy.sPlusConditionCopy.sceneOrBetter : null,
    !finale || !['masterpiece', 'scene'].includes(finale.resultTier) ? reportCopy.sPlusConditionCopy.finaleScene : null,
  ];
  return misses.filter((item): item is string => Boolean(item));
}

function rankCapForPerformance(args: {
  logs: TurnLog[];
  backstageLoad: number;
  prepHits: number;
  frayOrAccidentCount: number;
}): { maxRank: PerformanceInsight['rank']; reasons: string[] } {
  let maxRank: PerformanceInsight['rank'] = 'S+';
  const reasons: string[] = [];
  const accidentCount = args.logs.filter((log) => log.resultTier === 'accident').length;
  const finale = args.logs.find((log) => log.act === 3 && log.turnInAct === 2);
  const applyCap = (rank: PerformanceInsight['rank'], reason: string) => {
    maxRank = lowerRank(maxRank, rank);
    reasons.push(reason);
  };

  if (accidentCount >= 2) applyCap('B', reportCopy.rankCapReasonCopy.doubleAccident);
  else if (accidentCount >= 1) applyCap('A', reportCopy.rankCapReasonCopy.accident);
  if (args.backstageLoad >= 5) applyCap('C', reportCopy.rankCapReasonCopy.maxLoad);
  else if (args.backstageLoad >= 4) applyCap('B', reportCopy.rankCapReasonCopy.highLoad);
  if (args.frayOrAccidentCount >= 3) applyCap('B', reportCopy.rankCapReasonCopy.manyFrays);
  if (args.prepHits <= 1) applyCap('A', reportCopy.rankCapReasonCopy.fewPrepHits);
  if (finale?.resultTier === 'accident') applyCap('B', reportCopy.rankCapReasonCopy.finaleAccident);

  return { maxRank, reasons };
}

export function createPerformanceInsight(logs: TurnLog[], sceneScore = 0, flowScore = 0, trustScore = 0, backstageLoad = 0): PerformanceInsight {
  const totalScore = sceneScore * 2 + flowScore + trustScore - backstageLoad * 2 - (backstageLoad >= 4 ? 3 : 0);
  const prepHits = logs.filter((log) => log.prepMatched).length;
  const prepHitRate = logs.length > 0 ? Math.round((prepHits / logs.length) * 100) : 0;
  const masterpieceCount = logs.filter((log) => log.resultTier === 'masterpiece').length;
  const sceneOrBetterCount = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const frayOrAccidentCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  const baseRank = rankForScore(totalScore);
  const sPlusMisses = sPlusConditionMisses({ logs, totalScore, backstageLoad, prepHits, sceneOrBetterCount, frayOrAccidentCount });
  const sPlusMaxRank: PerformanceInsight['rank'] = sPlusMisses.length ? 'S' : 'S+';
  const cap = rankCapForPerformance({ logs, backstageLoad, prepHits, frayOrAccidentCount });
  const maxRank = lowerRank(sPlusMaxRank, cap.maxRank);
  const rank = lowerRank(baseRank, maxRank);
  const nextRank = rankAbove(rank);
  const nextRankEntry = nextRank ? PERFORMANCE_RANKS.find((item) => item.rank === nextRank) : null;
  const blockedByConditions = nextRank !== null && totalScore >= (nextRankEntry?.threshold ?? Number.POSITIVE_INFINITY);
  const pointsToNextRank = nextRankEntry ? Math.max(0, nextRankEntry.threshold - totalScore) : null;
  const decisionDistribution = (['catch', 'arrange', 'wait', 'cut'] as MainResponse[]).map((response) => ({
    response,
    count: logs.filter((log) => log.mainResponse === response).length,
  }));
  const dominantResponse = [...decisionDistribution].sort((a, b) => b.count - a.count)[0]?.response ?? 'catch';
  const tierRank: Record<ResultTier, number> = { masterpiece: 4, scene: 3, smallSuccess: 2, fray: 1, accident: 0 };
  const bestCue = [...logs].sort((a, b) => (
    (b.cueSurge?.decisiveScore ?? 0) - (a.cueSurge?.decisiveScore ?? 0)
    || Number(Boolean(b.cueSurge?.label)) - Number(Boolean(a.cueSurge?.label))
    || Number(Boolean(b.cueSurge?.responseLevel === 'peak')) - Number(Boolean(a.cueSurge?.responseLevel === 'peak'))
    || tierRank[b.resultTier] - tierRank[a.resultTier]
    || b.deltaScene - a.deltaScene
    || b.score - a.score
  ))[0] ?? null;
  const style = logs.find((log) => log.performanceStyle)?.performanceStyle ?? (logs.length >= 2 ? determinePerformanceStyle(logs) : null);
  const buildStyle = buildStyleSummary(logs, style);
  const discovery = discoverySummary(logs, backstageLoad);
  const nextNote = reportCopy.nextNote({ frayOrAccidentCount, backstageLoad, prepHitRate, sceneOrBetterCount });
  const scoreNote = reportCopy.scoreNote({ pointsToNextRank, nextRank, masterpieceCount, backstageLoad, prepHitRate, blockedByConditions, capReasons: [...sPlusMisses, ...cap.reasons] });
  const performanceBadges = createPerformanceBadges({ logs, backstageLoad, prepHits, masterpieceCount, sceneOrBetterCount, frayOrAccidentCount, buildLevel: buildStyle.level, discoveryScore: discovery.score });
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
    performanceBadges,
  };
}

function createPerformanceBadges(args: {
  logs: TurnLog[];
  backstageLoad: number;
  prepHits: number;
  masterpieceCount: number;
  sceneOrBetterCount: number;
  frayOrAccidentCount: number;
  buildLevel: number;
  discoveryScore: number;
}): PerformanceBadge[] {
  const { logs, backstageLoad, prepHits, masterpieceCount, sceneOrBetterCount, frayOrAccidentCount, buildLevel, discoveryScore } = args;
  const badges: PerformanceBadge[] = [];
  const finale = logs.find((log) => log.act === 3 && log.turnInAct === 2);
  const usedAllResponses = (['catch', 'arrange', 'wait', 'cut'] as MainResponse[]).every((response) => logs.some((log) => log.mainResponse === response));

  if (prepHits >= 5) badges.push({ id: 'sharp-read', ...performanceBadgeCopy.sharpRead(prepHits), tone: 'good' });
  if (masterpieceCount >= 2) badges.push({ id: 'double-masterpiece', ...performanceBadgeCopy.doubleMasterpiece(masterpieceCount), tone: 'gold' });
  if (backstageLoad <= 1) badges.push({ id: 'light-load', ...performanceBadgeCopy.lightLoad, tone: 'cool' });
  if (frayOrAccidentCount === 0 && logs.length >= 6) badges.push({ id: 'clean-run', ...performanceBadgeCopy.cleanRun, tone: 'good' });
  if (finale && ['masterpiece', 'scene'].includes(finale.resultTier)) badges.push({ id: 'finale-scene', ...performanceBadgeCopy.finaleScene, tone: 'gold' });
  if (buildLevel >= 3) badges.push({ id: 'style-max', ...performanceBadgeCopy.styleMax, tone: 'gold' });
  if (discoveryScore >= 10) badges.push({ id: 'many-discoveries', ...performanceBadgeCopy.manyDiscoveries, tone: 'cool' });
  if (usedAllResponses && sceneOrBetterCount >= 3) badges.push({ id: 'all-cues', ...performanceBadgeCopy.allCues, tone: 'cool' });
  if (backstageLoad >= 4) badges.push({ id: 'hot-backstage', ...performanceBadgeCopy.hotBackstage, tone: 'risk' });
  if (!badges.length && sceneOrBetterCount >= 2) badges.push({ id: 'steady-scenes', ...performanceBadgeCopy.steadyScenes, tone: 'good' });

  return badges.slice(0, 4);
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

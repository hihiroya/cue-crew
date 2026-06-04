import { PERFORMANCE_STYLE_DETAILS, RESULT_TIER_LABELS } from './constants';
import { dailyRunFor, type DailyRun } from './dailyRun';
import { determinePerformanceStyle } from './scoring';
import { achievementCatalogCopy, nextChallengeCopy, rogueliteProgressCopy, sceneHintCatalogCopy } from '../content/ja/rogueliteCopy';
import type { MainResponse, PerformanceStyle, TurnLog } from './domainTypes';
import type { AchievementUnlock, BuildStyleSummary, PerformanceResult } from './reportTypes';
export { dailyRunFor };
export type { DailyRun } from './dailyRun';

export type DiscoverySummary = {
  score: number;
  sceneIds: string[];
  achievements: AchievementUnlock[];
};

export type SceneCollectionEntry = {
  id: string;
  title: string;
  actor: string;
  event: string;
  response: string;
  bestTier: TurnLog['resultTier'];
  firstSeed: string;
  firstSeenAt: string;
};

export type AchievementEntry = AchievementUnlock & {
  firstSeed: string;
  firstSeenAt: string;
};

export type CollectionState = {
  scenes: Record<string, SceneCollectionEntry>;
  achievements: Record<string, AchievementEntry>;
};

export type SceneHint = {
  id: string;
  actor: string;
  event: string;
  response?: string;
  hint: string;
};

export type SeedComparison = {
  totalScoreDelta: number;
  rankDeltaLabel: string;
  prepHitsDelta: number;
  masterpieceDelta: number;
  loadDelta: number;
  bestTurn: TurnLog | null;
};

export type ResponseReplayDelta = {
  tone: 'up' | 'same' | 'down';
  label: string;
};

export type NextChallengeRecommendation = {
  kind: 'sameSeed' | 'replaySeed' | 'daily' | 'newSeed';
  kicker: string;
  title: string;
  body: string;
  cta: string;
  seed?: string;
};

export type ReplayImprovementSuggestion = {
  totalTurn: number;
  prep: TurnLog['prepAction'];
  response: MainResponse;
  resultTier: TurnLog['resultTier'];
  sceneTitle: string;
  totalScoreDelta: number;
  loadDelta: number;
};

const STYLE_THRESHOLDS = [2, 5, 9];
const COLLECTION_KEY = 'honban.collection.v1';
const DAILY_BEST_KEY = 'honban.daily.best.v1';
const TIER_ORDER: TurnLog['resultTier'][] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];

export function buildStyleSummary(logs: TurnLog[], explicitStyle: PerformanceStyle | null): BuildStyleSummary {
  if (logs.length < 2 && !explicitStyle) {
    return {
      style: null,
      label: rogueliteProgressCopy.unbuiltStyle.label,
      level: 0,
      progress: 0,
      next: STYLE_THRESHOLDS[0],
      note: rogueliteProgressCopy.unbuiltStyle.note,
    };
  }
  const style = explicitStyle ?? determinePerformanceStyle(logs);
  const styleDetail = PERFORMANCE_STYLE_DETAILS[style];
  const strength = styleDetail.strength;
  const progress = logs.reduce((total, log) => total + styleProgressForLog(log, style, strength), 0);
  const level = progress >= STYLE_THRESHOLDS[2] ? 3 : progress >= STYLE_THRESHOLDS[1] ? 2 : progress >= STYLE_THRESHOLDS[0] ? 1 : 0;
  const next = STYLE_THRESHOLDS[level] ?? null;
  return {
    style,
    label: styleDetail.label,
    level,
    progress,
    next,
    note: styleNote(style, level, next === null ? 0 : Math.max(0, next - progress)),
  };
}

function styleProgressForLog(log: TurnLog, style: PerformanceStyle, strength: MainResponse) {
  let value = log.mainResponse === strength ? 2 : 0;
  if (log.resultTier === 'masterpiece') value += 2;
  if (log.resultTier === 'scene') value += 1;
  if (style === 'heat') value += Math.max(0, log.deltaScene);
  if (style === 'breath') value += Math.max(0, log.deltaTrust);
  if (style === 'control') value += Math.max(0, log.deltaFlow) + Math.max(0, -log.deltaLoad);
  if (style === 'closure') value += log.deltaLoad <= 0 ? 1 : 0;
  return value;
}

function styleNote(style: PerformanceStyle, level: number, toNext: number) {
  const label = PERFORMANCE_STYLE_DETAILS[style].label;
  return rogueliteProgressCopy.styleNote(label, level, toNext);
}

export const ACHIEVEMENT_CATALOG: AchievementUnlock[] = [...achievementCatalogCopy];

export const SCENE_HINT_CATALOG: SceneHint[] = [...sceneHintCatalogCopy];

export function discoverySummary(logs: TurnLog[], backstageLoad: number): DiscoverySummary {
  const sceneIds = Array.from(new Set(logs.map(sceneCollectionId)));
  const achievements = achievementUnlocks(logs, backstageLoad);
  return {
    score: sceneIds.length * 2 + achievements.length * 5,
    sceneIds,
    achievements,
  };
}

export function sceneCollectionId(log: TurnLog) {
  return `${log.focusActorType}:${log.actorEventType}:${log.mainResponse}:${log.sceneTitle}`;
}

function achievementUnlocks(logs: TurnLog[], backstageLoad: number): AchievementUnlock[] {
  const responseCount = (response: MainResponse) => logs.filter((log) => log.mainResponse === response).length;
  const masterpieceBy = (response: MainResponse) => logs.filter((log) => log.mainResponse === response && log.resultTier === 'masterpiece').length;
  const sceneOrBetter = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const prepHits = logs.filter((log) => log.prepMatched).length;
  const usedAllResponses = (['catch', 'arrange', 'wait', 'cut'] as MainResponse[]).every((response) => responseCount(response) > 0);
  const style = logs.find((log) => log.performanceStyle)?.performanceStyle ?? (logs.length >= 2 ? determinePerformanceStyle(logs) : null);
  const buildStyle = buildStyleSummary(logs, style);
  const finaleSceneOrBetter = logs.some((log) => log.act === 3 && log.turnInAct === 2 && ['masterpiece', 'scene'].includes(log.resultTier));
  return [
    masterpieceBy('catch') >= 2 ? achievementById('heat-catcher') : null,
    logs.some((log) => log.act === 3 && log.mainResponse === 'wait' && ['masterpiece', 'scene'].includes(log.resultTier))
      ? achievementById('finale-breath')
      : null,
    logs.some((log) => log.mainResponse === 'arrange' && ['masterpiece', 'scene'].includes(log.resultTier) && log.deltaLoad < 0)
      ? achievementById('flow-keeper')
      : null,
    logs.some((log) => log.mainResponse === 'cut' && log.resultTier !== 'accident')
      ? achievementById('clean-blackout')
      : null,
    backstageLoad <= 1 ? achievementById('light-backstage') : null,
    prepHits >= 5 ? achievementById('read-the-room') : null,
    usedAllResponses && sceneOrBetter >= 3 ? achievementById('all-cue-run') : null,
    buildStyle.style === 'heat' && buildStyle.level >= 3 && finaleSceneOrBetter ? achievementById('heat-finale') : null,
    buildStyle.style === 'breath' && buildStyle.level >= 3 && finaleSceneOrBetter ? achievementById('breath-finale') : null,
    buildStyle.style === 'control' && buildStyle.level >= 3 && finaleSceneOrBetter ? achievementById('control-finale') : null,
    buildStyle.style === 'closure' && buildStyle.level >= 3 && finaleSceneOrBetter ? achievementById('closure-finale') : null,
  ].filter((item): item is AchievementUnlock => Boolean(item));
}

function achievementById(id: string): AchievementUnlock {
  return ACHIEVEMENT_CATALOG.find((item) => item.id === id) ?? { id, label: id, detail: '' };
}

export function compareWithPrevious(result: PerformanceResult, previous: PerformanceResult | null): SeedComparison | null {
  if (!previous) return null;
  return {
    totalScoreDelta: result.insight.totalScore - previous.insight.totalScore,
    rankDeltaLabel: rankDeltaLabel(result.insight.rank, previous.insight.rank),
    prepHitsDelta: result.insight.prepHits - previous.insight.prepHits,
    masterpieceDelta: result.insight.masterpieceCount - previous.insight.masterpieceCount,
    loadDelta: result.backstageLoad - previous.backstageLoad,
    bestTurn: mostImproveableTurn(result),
  };
}

function rankDeltaLabel(current: PerformanceResult['insight']['rank'], previous: PerformanceResult['insight']['rank']) {
  const ranks = ['D', 'C', 'B', 'A', 'S', 'S+'];
  const delta = ranks.indexOf(current) - ranks.indexOf(previous);
  return rogueliteProgressCopy.rankDelta(delta);
}

export function replayDeltaForResponse(args: {
  currentTier: TurnLog['resultTier'];
  currentLoad: number;
  previous?: TurnLog | null;
}): ResponseReplayDelta | null {
  const { currentTier, currentLoad, previous } = args;
  if (!previous) return null;
  const tierDelta = TIER_ORDER.indexOf(currentTier) - TIER_ORDER.indexOf(previous.resultTier);
  const loadDelta = currentLoad - previous.deltaLoad;
  if (tierDelta > 0 && loadDelta <= 0) return { tone: 'up', label: rogueliteProgressCopy.replayDelta.previousBetter };
  if (tierDelta > 0) return { tone: 'up', label: rogueliteProgressCopy.replayDelta.rankUp };
  if (tierDelta === 0 && loadDelta < 0) return { tone: 'up', label: rogueliteProgressCopy.replayDelta.lighterLoad };
  if (tierDelta === 0 && loadDelta === 0) return { tone: 'same', label: rogueliteProgressCopy.replayDelta.same };
  if (tierDelta < 0 && loadDelta <= 0) return { tone: 'down', label: rogueliteProgressCopy.replayDelta.rankDown };
  return { tone: 'down', label: rogueliteProgressCopy.replayDelta.heavierLoad };
}

export function mostImproveableTurn(result: PerformanceResult) {
  return [...result.logs]
    .filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident' || log.prepQuality === 'miss' || log.deltaLoad >= 2)
    .sort((a, b) => (
      tierRisk(b.resultTier) - tierRisk(a.resultTier)
      || b.deltaLoad - a.deltaLoad
      || Number(b.prepQuality === 'miss') - Number(a.prepQuality === 'miss')
    ))[0] ?? null;
}

export function nextChallengeRecommendation(args: {
  result?: PerformanceResult | null;
  history?: PerformanceResult[];
  collection?: CollectionState;
  dailyRun?: DailyRun;
  dailyBest?: PerformanceResult | null;
  replaySuggestions?: Record<string, ReplayImprovementSuggestion | null>;
}): NextChallengeRecommendation {
  const history = args.history ?? [];
  const collection = args.collection ?? emptyCollectionState();
  const dailyRun = args.dailyRun;
  const dailyBest = args.dailyBest ?? null;
  if (args.result) return recommendationAfterResult(args.result, collection, dailyRun, dailyBest, args.replaySuggestions?.[args.result.seed] ?? null);
  return recommendationForTitle(history, collection, dailyRun, dailyBest, args.replaySuggestions ?? {});
}

function recommendationAfterResult(
  result: PerformanceResult,
  collection: CollectionState,
  dailyRun?: DailyRun,
  dailyBest?: PerformanceResult | null,
  replaySuggestion?: ReplayImprovementSuggestion | null,
): NextChallengeRecommendation {
  const swingTurn = mostImproveableTurn(result);
  if (swingTurn || replaySuggestion) {
    const targetTurn = replaySuggestion ? result.logs.find((log) => log.totalTurn === replaySuggestion.totalTurn) ?? swingTurn : swingTurn;
    return {
      kind: 'sameSeed',
      kicker: nextChallengeCopy.kicker,
      title: replaySuggestion ? nextChallengeCopy.suggestionTitle(replaySuggestion.totalTurn, replaySuggestion.response) : nextChallengeCopy.titleWithTurn(targetTurn as TurnLog),
      body: replaySuggestion
        ? nextChallengeCopy.suggestionBody(replaySuggestion)
        : nextChallengeCopy.fallbackSwingBody(targetTurn ?? null),
      cta: nextChallengeCopy.sameSeedCta,
      seed: result.seed,
    };
  }
  if (dailyRun && result.seed !== dailyRun.seed && !dailyBest) {
    return dailyRecommendation(dailyRun);
  }
  if (result.insight.pointsToNextRank !== null && result.insight.pointsToNextRank <= 8) {
    return {
      kind: 'sameSeed',
      kicker: nextChallengeCopy.kicker,
      title: nextChallengeCopy.nearRankTitle(result.insight.nextRank, result.insight.pointsToNextRank),
      body: nextChallengeCopy.nearRankBody,
      cta: nextChallengeCopy.retrySeedCta,
      seed: result.seed,
    };
  }
  const hint = lockedSceneHints(collection, 1)[0];
  if (hint) {
    return {
      kind: 'newSeed',
      kicker: nextChallengeCopy.kicker,
      title: nextChallengeCopy.lockedSceneTitle,
      body: nextChallengeCopy.lockedSceneBody(hint.hint),
      cta: nextChallengeCopy.newSeedCta,
    };
  }
  return {
    kind: 'newSeed',
    kicker: nextChallengeCopy.kicker,
    title: nextChallengeCopy.dominantStyleTitle(result.insight.dominantResponse),
    body: nextChallengeCopy.dominantStyleBody,
    cta: nextChallengeCopy.newSeedCta,
  };
}

function recommendationForTitle(
  history: PerformanceResult[],
  collection: CollectionState,
  dailyRun?: DailyRun,
  dailyBest?: PerformanceResult | null,
  replaySuggestions: Record<string, ReplayImprovementSuggestion | null> = {},
): NextChallengeRecommendation {
  if (!history.length) {
    return {
      kind: 'newSeed',
      kicker: nextChallengeCopy.kicker,
      title: nextChallengeCopy.firstRunTitle,
      body: nextChallengeCopy.firstRunBody,
      cta: nextChallengeCopy.startCta,
    };
  }
  const replayTarget = history.find((item) => mostImproveableTurn(item));
  if (replayTarget) {
    const suggestion = replaySuggestions[replayTarget.seed] ?? null;
    const swingTurn = mostImproveableTurn(replayTarget);
    return {
      kind: 'replaySeed',
      kicker: nextChallengeCopy.kicker,
      title: suggestion ? nextChallengeCopy.suggestionTitle(suggestion.totalTurn, suggestion.response) : swingTurn ? nextChallengeCopy.replayTurnTitle(swingTurn) : nextChallengeCopy.replayFallbackTitle,
      body: suggestion
        ? nextChallengeCopy.replaySuggestionBody(suggestion)
        : swingTurn ? nextChallengeCopy.replayTurnBody(swingTurn) : nextChallengeCopy.replayFallbackBody,
      cta: nextChallengeCopy.replaySeedCta,
      seed: replayTarget.seed,
    };
  }
  if (dailyRun && !dailyBest) {
    return dailyRecommendation(dailyRun);
  }
  const nearRank = history.find((item) => item.insight.pointsToNextRank !== null && item.insight.pointsToNextRank <= 8);
  if (nearRank) {
    const pointsToNextRank = nearRank.insight.pointsToNextRank ?? 0;
    return {
      kind: 'replaySeed',
      kicker: nextChallengeCopy.kicker,
      title: nextChallengeCopy.nearRankTitle(nearRank.insight.nextRank, pointsToNextRank),
      body: nextChallengeCopy.historyNearRankBody,
      cta: nextChallengeCopy.replaySeedCta,
      seed: nearRank.seed,
    };
  }
  const hint = lockedSceneHints(collection, 1)[0];
  if (hint) {
    return {
      kind: 'newSeed',
      kicker: nextChallengeCopy.kicker,
      title: nextChallengeCopy.collectionTitle,
      body: nextChallengeCopy.collectionBody(hint.hint),
      cta: nextChallengeCopy.newSeedCta,
    };
  }
  return {
    kind: 'newSeed',
    kicker: nextChallengeCopy.kicker,
    title: nextChallengeCopy.newStyleTitle,
    body: nextChallengeCopy.newStyleBody,
    cta: nextChallengeCopy.newSeedCta,
  };
}

function dailyRecommendation(dailyRun: DailyRun): NextChallengeRecommendation {
  return {
    kind: 'daily',
    kicker: nextChallengeCopy.kicker,
    title: dailyRun.title,
    body: nextChallengeCopy.dailyBody(dailyRun.modifier, dailyRun.detail),
    cta: nextChallengeCopy.dailyCta,
    seed: dailyRun.seed,
  };
}

function tierRisk(tier: TurnLog['resultTier']) {
  if (tier === 'accident') return 4;
  if (tier === 'fray') return 3;
  if (tier === 'smallSuccess') return 2;
  if (tier === 'scene') return 1;
  return 0;
}

export function comparisonLabel(comparison: SeedComparison) {
  return rogueliteProgressCopy.comparison(comparison);
}

export function responseBuildCue(response: MainResponse, style: BuildStyleSummary) {
  if (!style.style) return rogueliteProgressCopy.initialBuildCue;
  const strength = PERFORMANCE_STYLE_DETAILS[style.style].strength;
  if (response === strength) return `${style.label} +`;
  return rogueliteProgressCopy.alternateBuildCue(response);
}

export function achievementListLabel(items: AchievementUnlock[]) {
  if (!items.length) return rogueliteProgressCopy.noNewAchievements;
  return items.map((item) => item.label).join(' / ');
}

export function resultTierShort(tier: TurnLog['resultTier']) {
  return RESULT_TIER_LABELS[tier];
}

export function lockedSceneHints(collection: CollectionState, limit = 4): SceneHint[] {
  return SCENE_HINT_CATALOG.filter((hint) => !Object.values(collection.scenes).some((scene) => (
    (hint.actor === 'any' || scene.actor === hint.actor)
    && scene.event === hint.event
    && (!hint.response || scene.response === hint.response)
  ))).slice(0, limit);
}

export function readDailyBestResults(): Record<string, PerformanceResult> {
  try {
    const raw = localStorage.getItem(DAILY_BEST_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PerformanceResult>;
  } catch {
    return {};
  }
}

export function saveDailyBestForResult(result: PerformanceResult) {
  if (!result.seed.startsWith('honban-daily-')) return readDailyBestResults();
  const current = readDailyBestResults();
  const previous = current[result.seed];
  if (!previous || result.insight.totalScore > previous.insight.totalScore) {
    const next = { ...current, [result.seed]: result };
    localStorage.setItem(DAILY_BEST_KEY, JSON.stringify(next));
    return next;
  }
  return current;
}

export function emptyCollectionState(): CollectionState {
  return { scenes: {}, achievements: {} };
}

export function readCollectionState(): CollectionState {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return emptyCollectionState();
    const parsed = JSON.parse(raw) as Partial<CollectionState>;
    return {
      scenes: parsed.scenes ?? {},
      achievements: parsed.achievements ?? {},
    };
  } catch {
    return emptyCollectionState();
  }
}

export function saveCollectionForResult(result: PerformanceResult) {
  const current = readCollectionState();
  const next = mergeCollectionResult(current, result);
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
  return next;
}

export function mergeCollectionResult(collection: CollectionState, result: PerformanceResult): CollectionState {
  const next: CollectionState = {
    scenes: { ...collection.scenes },
    achievements: { ...collection.achievements },
  };
  result.logs.forEach((log) => {
    const id = sceneCollectionId(log);
    const current = next.scenes[id];
    const entry = sceneEntryFromLog(log, result);
    next.scenes[id] = current
      ? { ...current, bestTier: betterTier(current.bestTier, entry.bestTier) }
      : entry;
  });
  result.insight.unlockedAchievements.forEach((item) => {
    if (next.achievements[item.id]) return;
    next.achievements[item.id] = {
      ...item,
      firstSeed: result.seed,
      firstSeenAt: result.finishedAt,
    };
  });
  return next;
}

function sceneEntryFromLog(log: TurnLog, result: PerformanceResult): SceneCollectionEntry {
  return {
    id: sceneCollectionId(log),
    title: log.sceneTitle,
    actor: log.focusActorType,
    event: log.actorEventType,
    response: log.mainResponse,
    bestTier: log.resultTier,
    firstSeed: result.seed,
    firstSeenAt: result.finishedAt,
  };
}

function betterTier(a: TurnLog['resultTier'], b: TurnLog['resultTier']) {
  const order: TurnLog['resultTier'][] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];
  return order.indexOf(b) > order.indexOf(a) ? b : a;
}

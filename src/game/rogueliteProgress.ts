import { PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS, RESULT_TIER_LABELS } from './constants';
import { dailyRunFor } from './dailyRun';
import { determinePerformanceStyle } from './scoring';
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

const STYLE_THRESHOLDS = [2, 5, 9];
const COLLECTION_KEY = 'honban.collection.v1';
const DAILY_BEST_KEY = 'honban.daily.best.v1';
const TIER_ORDER: TurnLog['resultTier'][] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];

export function buildStyleSummary(logs: TurnLog[], explicitStyle: PerformanceStyle | null): BuildStyleSummary {
  if (logs.length < 2 && !explicitStyle) {
    return {
      style: null,
      label: '未確立',
      level: 0,
      progress: 0,
      next: STYLE_THRESHOLDS[0],
      note: '初日ソワレ後に公演の型が決まる',
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
  if (level >= 3) return `${label}が千秋楽フィニッシュ圏に入った`;
  if (level >= 2) return `${label}が強化中。あと${toNext}で最大化`;
  if (level >= 1) return `${label}が立ち上がった。あと${toNext}で伸びる`;
  return `${label}の芽がある。得意な対応で育つ`;
}

export const ACHIEVEMENT_CATALOG: AchievementUnlock[] = [
  { id: 'heat-catcher', label: '拾う手の演出助手', detail: '拾うで名場面を重ねる' },
  { id: 'finale-breath', label: '間を信じた舞台監督', detail: '千秋楽で待つ判断を成功させる' },
  { id: 'flow-keeper', label: '乱れを包む進行役', detail: '整える判断で負荷を抜く' },
  { id: 'clean-blackout', label: '暗転の切れ味', detail: '切る判断で崩れを閉じる' },
  { id: 'light-backstage', label: '三日間を軽く渡した', detail: '最終負荷を低く抑える' },
  { id: 'read-the-room', label: '兆候読みの達人', detail: '準備を5回以上活かす' },
  { id: 'all-cue-run', label: '四つのキューを使い切った', detail: '全対応を使って場面を作る' },
  { id: 'heat-finale', label: '熱量の千秋楽', detail: '熱量型Lv.3で千秋楽に場面以上を作る' },
  { id: 'breath-finale', label: '余韻の千秋楽', detail: '余韻型Lv.3で千秋楽に場面以上を作る' },
  { id: 'control-finale', label: '精度の千秋楽', detail: '精度型Lv.3で千秋楽に場面以上を作る' },
  { id: 'closure-finale', label: '収束の千秋楽', detail: '収束型Lv.3で千秋楽に場面以上を作る' },
];

export const SCENE_HINT_CATALOG: SceneHint[] = [
  { id: 'junior:adlib:catch', actor: 'junior', event: 'adlib', response: 'catch', hint: '予定外の一言を客席へ渡す' },
  { id: 'junior:heatUp:catch', actor: 'junior', event: 'heatUp', response: 'catch', hint: '熱を止めずに見せ場へ伸ばす' },
  { id: 'lead:silence:wait', actor: 'lead', event: 'silence', response: 'wait', hint: '沈黙の間を信じる' },
  { id: 'lead:delayedExit:wait', actor: 'lead', event: 'delayedExit', response: 'wait', hint: '遅れた退場を余韻にする' },
  { id: 'skilled:positionShift:arrange', actor: 'skilled', event: 'positionShift', response: 'arrange', hint: 'ズレた位置へ意味を与える' },
  { id: 'skilled:ensembleWaver:arrange', actor: 'skilled', event: 'ensembleWaver', response: 'arrange', hint: '揺れた群像を包む' },
  { id: 'any:tempoRush:cut', actor: 'any', event: 'tempoRush', response: 'cut', hint: '走った拍を暗転で閉じる' },
  { id: 'any:silence:wait', actor: 'any', event: 'silence', response: 'wait', hint: '客席まで届く間を作る' },
];

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
  if (delta > 0) return `ランク+${delta}`;
  if (delta < 0) return `ランク${delta}`;
  return 'ランク維持';
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
  if (tierDelta > 0 && loadDelta <= 0) return { tone: 'up', label: '前回より上' };
  if (tierDelta > 0) return { tone: 'up', label: 'ランク上' };
  if (tierDelta === 0 && loadDelta < 0) return { tone: 'up', label: '負荷軽い' };
  if (tierDelta === 0 && loadDelta === 0) return { tone: 'same', label: '前回同等' };
  if (tierDelta < 0 && loadDelta <= 0) return { tone: 'down', label: 'ランク下' };
  return { tone: 'down', label: '負荷重い' };
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

function tierRisk(tier: TurnLog['resultTier']) {
  if (tier === 'accident') return 4;
  if (tier === 'fray') return 3;
  if (tier === 'smallSuccess') return 2;
  if (tier === 'scene') return 1;
  return 0;
}

export function comparisonLabel(comparison: SeedComparison) {
  const score = comparison.totalScoreDelta === 0 ? '総合±0' : `総合${comparison.totalScoreDelta > 0 ? '+' : ''}${comparison.totalScoreDelta}`;
  const load = comparison.loadDelta === 0 ? '負荷±0' : `負荷${comparison.loadDelta > 0 ? '+' : ''}${comparison.loadDelta}`;
  return `${score} / ${comparison.rankDeltaLabel} / 準備${signed(comparison.prepHitsDelta)} / 名場面${signed(comparison.masterpieceDelta)} / ${load}`;
}

function signed(value: number) {
  if (value === 0) return '±0';
  return `${value > 0 ? '+' : ''}${value}`;
}

export function responseBuildCue(response: MainResponse, style: BuildStyleSummary) {
  if (!style.style) return '初日ソワレで型が決まる';
  const strength = PERFORMANCE_STYLE_DETAILS[style.style].strength;
  if (response === strength) return `${style.label} +`;
  return `${RESPONSE_LABELS[response]}で別筋`;
}

export function achievementListLabel(items: AchievementUnlock[]) {
  if (!items.length) return '新規称号なし';
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

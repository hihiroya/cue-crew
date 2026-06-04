import { PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS, RESULT_TIER_LABELS } from './constants';
import { determinePerformanceStyle } from './scoring';
import type { MainResponse, PerformanceResult, PerformanceStyle, TurnLog } from './types';

export type BuildStyleSummary = {
  style: PerformanceStyle | null;
  label: string;
  level: number;
  progress: number;
  next: number | null;
  note: string;
};

export type AchievementUnlock = {
  id: string;
  label: string;
  detail: string;
};

export type DiscoverySummary = {
  score: number;
  sceneIds: string[];
  achievements: AchievementUnlock[];
};

export type DailyRun = {
  seed: string;
  title: string;
  modifier: string;
  detail: string;
};

export type SeedComparison = {
  totalScoreDelta: number;
  rankDeltaLabel: string;
  prepHitsDelta: number;
  masterpieceDelta: number;
  loadDelta: number;
  bestTurn: TurnLog | null;
};

const STYLE_THRESHOLDS = [2, 5, 9];

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

export function discoverySummary(logs: TurnLog[], backstageLoad: number): DiscoverySummary {
  const sceneIds = Array.from(new Set(logs.map(sceneCollectionId)));
  const achievements = achievementUnlocks(logs, backstageLoad);
  return {
    score: sceneIds.length * 2 + achievements.length * 5,
    sceneIds,
    achievements,
  };
}

function sceneCollectionId(log: TurnLog) {
  return `${log.focusActorType}:${log.actorEventType}:${log.mainResponse}:${log.sceneTitle}`;
}

function achievementUnlocks(logs: TurnLog[], backstageLoad: number): AchievementUnlock[] {
  const responseCount = (response: MainResponse) => logs.filter((log) => log.mainResponse === response).length;
  const masterpieceBy = (response: MainResponse) => logs.filter((log) => log.mainResponse === response && log.resultTier === 'masterpiece').length;
  const sceneOrBetter = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const prepHits = logs.filter((log) => log.prepMatched).length;
  const usedAllResponses = (['catch', 'arrange', 'wait', 'cut'] as MainResponse[]).every((response) => responseCount(response) > 0);
  return [
    masterpieceBy('catch') >= 2 ? achievement('heat-catcher', '拾う手の演出助手', '拾うで名場面を重ねた') : null,
    logs.some((log) => log.act === 3 && log.mainResponse === 'wait' && ['masterpiece', 'scene'].includes(log.resultTier))
      ? achievement('finale-breath', '間を信じた舞台監督', '千秋楽で待つ判断が届いた')
      : null,
    logs.some((log) => log.mainResponse === 'arrange' && ['masterpiece', 'scene'].includes(log.resultTier) && log.deltaLoad < 0)
      ? achievement('flow-keeper', '乱れを包む進行役', '整える判断で負荷を抜いた')
      : null,
    logs.some((log) => log.mainResponse === 'cut' && log.resultTier !== 'accident')
      ? achievement('clean-blackout', '暗転の切れ味', '切る判断で崩れを閉じた')
      : null,
    backstageLoad <= 1 ? achievement('light-backstage', '三日間を軽く渡した', '最終負荷を低く抑えた') : null,
    prepHits >= 5 ? achievement('read-the-room', '兆候読みの達人', '準備を5回以上活かした') : null,
    usedAllResponses && sceneOrBetter >= 3 ? achievement('all-cue-run', '四つのキューを使い切った', '全対応を使って場面を作った') : null,
  ].filter((item): item is AchievementUnlock => Boolean(item));
}

function achievement(id: string, label: string, detail: string): AchievementUnlock {
  return { id, label, detail };
}

export function dailyRunFor(date = new Date()): DailyRun {
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const seed = `honban-daily-${day}`;
  const variants = [
    ['初日は荒れやすい', '守りの価値が少し上がる'],
    ['若手が乗りやすい', '拾う判断が評判へつながりやすい'],
    ['主役が沈黙を抱える', '待つ判断の読みどころが増える'],
    ['技巧派の軸が揺れる', '整える判断が光りやすい'],
    ['転換が重い', '切る・整えるの負荷管理が大事'],
    ['客席が熱い', '評判は伸びるが負荷も残りやすい'],
  ] as const;
  const index = hashString(seed) % variants.length;
  const [modifier, detail] = variants[index];
  return {
    seed,
    title: '今日の巡り合わせ',
    modifier,
    detail,
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
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

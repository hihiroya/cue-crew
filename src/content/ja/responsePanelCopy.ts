import { EVENT_LABELS, PERFORMANCE_SLOT_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS } from './gameLabels';
import type { GameState, MainResponse, ResponseInsight, ResultTier, ScoreBreakdownItem } from '../../game/types';

export const responsePanelCopy = {
  heading: '対応を決める',
  marker: '卓に反映',
  outlookAria: (label: string) => `成立見込み: ${label}`,
  prepRelationAria: (label: string) => `準備との関係: ${label}`,
  effectSummaryAria: '影響の要約',
  effectSummaryTitle: '主要影響',
  sendButton: 'このキューを出す',
  consoleTitle: '進行卓（コンソール）',
  cueStripAria: 'キュー表示',
  outlookTitle: '場面の見通し',
  logTitle: '進行メモ',
  frayTitle: '舞台裏のほころび',
  passiveTitle: 'パッシブ効果',
  buildCue: '公演の色',
  pendingStyle: '仕込み中',
  buildLevel: '色の濃さ',
  previousCue: '前回',
  replayDelta: '前回比',
  unknownEvent: '未定',
  runSheetAria: '進行表',
  resultRailAria: '場面の見通し',
  readoutAria: '選択中の相性と影響',
  affinityBoardTitle: '相性盤',
  effectBoardTitle: 'キュー後の影響',
} as const;

export function responseSendAria(response: MainResponse) {
  return `${RESPONSE_LABELS[response]}のキューを出す`;
}

export function prepConnectionLabel(tone: ResponseInsight['prepRelationTone']) {
  if (tone === 'primary') return '準備が活きる';
  if (tone === 'alternate') return '備え外で効く';
  return '準備と合わない';
}

export function prepConnectionShortLabel(tone: ResponseInsight['prepRelationTone']) {
  if (tone === 'primary') return '準備活きる';
  if (tone === 'alternate') return '備え外';
  return '準備合わず';
}

export function rangeShortLabel(tier: ResultTier) {
  if (tier === 'masterpiece') return '名場面狙い';
  if (tier === 'scene') return '場面化狙い';
  if (tier === 'smallSuccess') return '小さく成功';
  if (tier === 'fray') return '崩れ抑え';
  return '事故注意';
}

export function runSheetActLabel(state: GameState) {
  const slotKey = state.turnInAct === 1 ? 'matinee' : 'soiree';
  return `${state.act}日目 / ${PERFORMANCE_SLOT_LABELS[slotKey].label}`;
}

export function runSheetEventLabel(state: GameState) {
  return state.currentActorEvent ? EVENT_LABELS[state.currentActorEvent.type] : responsePanelCopy.unknownEvent;
}

export function affinityLabels() {
  return [
    { id: 'event', icon: 'event' as const, label: '出来事' },
    { id: 'actor', icon: 'actor' as const, label: '役者傾向' },
    { id: 'state', icon: 'state' as const, label: '役者状態' },
    { id: 'act', icon: 'act' as const, label: '公演回' },
  ];
}

export function rankForValue(value: number) {
  if (value >= 3) return '強い';
  if (value > 0) return '合う';
  if (value < 0) return '注意';
  return '中立';
}

export function decisionMemo(insight: ResponseInsight) {
  const driver = strongestDriver(insight.scoreBreakdown);
  const blocker = strongestBlocker(insight.scoreBreakdown);
  const risk = strongestRisk(insight.scoreBreakdown, blocker?.id);
  const reachesMasterpiece = insight.rangeTone === 'best' || insight.successRangeLabel.includes(RESULT_TIER_LABELS.masterpiece);
  const lead = reachesMasterpiece ? '名場面まで伸びる筋がある' : leadForNonMasterpiece(insight);
  const reason = reachesMasterpiece
    ? driverReason(driver)
    : blockerReason(blocker) ?? riskReason(risk) ?? weakerDriverReason(driver);
  const cost = costReason(insight, risk, blocker?.id);
  const danger = insight.dangerWarning ? ` ${insight.downsideLabel}。` : '';
  return `${lead}。${reason}${cost}${danger}`;
}

const driverPriority = [
  'fray-reward',
  'prep-response-guard',
  'cut-containment',
  'fray',
  'actor-trust',
  'finale',
  'build-level',
  'performance-style',
  'event',
  'prep-hit',
  'prep-response',
  'actor',
  'state',
  'act',
  'trust',
] as const;

const blockerPriority = [
  'prep-cap',
  'arrange-cap',
  'diffuse-rhythm',
  'prep-pivot',
  'load',
  'repeat',
  'event',
  'state',
] as const;

function leadForNonMasterpiece(insight: ResponseInsight) {
  if (insight.successRangeLabel.includes(RESULT_TIER_LABELS.scene)) return '場面化の筋はあるが、名場面には届きにくい';
  if (insight.resultTier === 'smallSuccess' || insight.successRangeLabel.includes(RESULT_TIER_LABELS.smallSuccess)) return '大崩れは防げるが、見せ場としては弱い';
  return '舞台裏に揺れが残りやすい判断';
}

function strongestDriver(items: ScoreBreakdownItem[]) {
  return prioritizedItem(items.filter((item) => item.value > 0), driverPriority, (a, b) => b.value - a.value);
}

function strongestBlocker(items: ScoreBreakdownItem[]) {
  return prioritizedItem(items.filter((item) => item.value < 0), blockerPriority, (a, b) => a.value - b.value);
}

function strongestRisk(items: ScoreBreakdownItem[], skipId?: string) {
  return items
    .filter((item) => item.value < 0 && item.id !== skipId)
    .sort((a, b) => a.value - b.value)[0];
}

function prioritizedItem(items: ScoreBreakdownItem[], priority: readonly string[], fallbackSort: (a: ScoreBreakdownItem, b: ScoreBreakdownItem) => number) {
  const byPriority = [...items].sort((a, b) => {
    const aIndex = priority.includes(a.id) ? priority.indexOf(a.id) : Number.POSITIVE_INFINITY;
    const bIndex = priority.includes(b.id) ? priority.indexOf(b.id) : Number.POSITIVE_INFINITY;
    return aIndex - bIndex || fallbackSort(a, b);
  });
  return byPriority[0];
}

function driverReason(item?: ScoreBreakdownItem) {
  if (!item) return '決め手はまだ薄いが、下振れしても見せ場として残る余地がある。';
  return `${item.label}が決め手。${detailOrFallback(item, 'その積み上げが、予定外を客席まで届く場面に押し上げる。')}`;
}

function blockerReason(item?: ScoreBreakdownItem) {
  if (!item) return undefined;
  return `${item.label}が名場面化を止めている。${detailOrFallback(item, 'ここを外すと、場面の上振れより処理の遅れが目立つ。')}`;
}

function riskReason(item?: ScoreBreakdownItem) {
  if (!item) return undefined;
  return `${item.label}が足を引っ張っている。${detailOrFallback(item, 'このままだと、場面の芯より舞台裏の揺れが残る。')}`;
}

function weakerDriverReason(item?: ScoreBreakdownItem) {
  if (!item) return '名場面化の決め手が足りない。準備、出来事、役者傾向のどれかをより強く噛み合わせたい。';
  return `${item.label}は効くが、名場面化の決め手にはまだ弱い。${detailOrFallback(item, '別の強い理由が重なると、上振れを狙いやすくなる。')}`;
}

function costReason(insight: ResponseInsight, risk?: ScoreBreakdownItem, skipId?: string) {
  if (insight.deltaLoad >= 2) return ' 代償として裏方負荷が重く残る。';
  if (risk && risk.id !== skipId) return '';
  if (insight.actorTrustLabel) return ` ${insight.actorTrustLabel}`;
  return '';
}

function detailOrFallback(item: ScoreBreakdownItem, fallback: string) {
  return item.detail ?? fallback;
}

export function resultRangeIndices(label: string) {
  const [lowLabel, highLabel] = label.split('〜');
  const tierOrder: ResultTier[] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];
  const lowIndex = Math.max(0, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === lowLabel));
  const highIndex = Math.max(lowIndex, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === highLabel));
  return { lowIndex, highIndex };
}

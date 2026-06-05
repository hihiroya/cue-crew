import { EVENT_LABELS, PERFORMANCE_SLOT_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS } from './gameLabels';
import type { GameState, MainResponse, ResponseInsight, ResultTier } from '../../game/types';

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
  resultRailAria: '結果レンジ',
  readoutAria: '選択中の相性と影響',
  affinityBoardTitle: '相性盤',
  affinityBoardSub: '判定ランプ',
  effectBoardTitle: 'キュー後の影響',
  effectBoardSub: '影響ゲージ',
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
    { id: 'state', icon: 'state' as const, label: '状態' },
    { id: 'act', icon: 'act' as const, label: '公演回' },
  ];
}

export function rankForValue(value: number) {
  if (value >= 3) return '強い';
  if (value > 0) return '合う';
  if (value < 0) return '注意';
  return '普通';
}

export function decisionMemo(insight: ResponseInsight, effectSummaryText: string) {
  const prep = insight.prepRelationTone === 'primary'
    ? '準備と正面から噛み合う'
    : insight.prepRelationTone === 'alternate'
      ? '備えとは別筋で効く'
      : '準備とは噛み合いにくい';
  const danger = insight.dangerWarning ? ` ${insight.downsideLabel}。` : '';
  const trust = insight.actorTrustLabel ? ` ${insight.actorTrustLabel}` : '';
  return `${prep}手。${insight.tacticalSummary}。${insight.responseAimLabel}。見込みは${insight.successRangeLabel}。影響は${effectSummaryText}。${trust}${danger}`;
}

export function resultRangeIndices(label: string) {
  const [lowLabel, highLabel] = label.split('〜');
  const tierOrder: ResultTier[] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];
  const lowIndex = Math.max(0, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === lowLabel));
  const highIndex = Math.max(lowIndex, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === highLabel));
  return { lowIndex, highIndex };
}

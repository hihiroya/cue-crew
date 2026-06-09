import { EVENT_LABELS, PERFORMANCE_SLOT_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS } from './gameLabels';
import { displayScore } from '../../game/scoreDisplay';
import type { GameState, MainResponse, ResponseInsight, ResultTier, ScoreBreakdownItem } from '../../game/types';

export const responsePanelCopy = {
  heading: '対応を決める',
  marker: '卓に反映',
  outlookAria: (label: string) => `場面の見立て: ${label}`,
  prepRelationAria: (label: string) => `準備との関係: ${label}`,
  effectSummaryAria: '影響の要約',
  effectSummaryTitle: '主要影響',
  sendButton: 'このキューを出す',
  consoleTitle: '進行卓（コンソール）',
  cueStripAria: 'キュー表示',
  outlookTitle: '場面の見立て',
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
  resultRailAria: '場面の見立て',
  outlookRuleNote: '見立ては確率ではなく、現在の状態と選んだキューから出した評価レンジ。',
  scoreSummaryTitle: '判定点',
  outlookBreakdownTitle: '見立て分解',
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
    : blockerReason(blocker) ?? riskReason(risk) ?? missingMasterpieceReason(insight);
  const cost = costReason(insight, risk, blocker?.id);
  const danger = insight.dangerWarning ? ` ${insight.downsideLabel}。` : '';
  return `${lead}。${reason}${cost}${danger}`;
}

export function decisionScoreSummary(insight: ResponseInsight) {
  const currentTier = RESULT_TIER_LABELS[insight.resultTier];
  const next = nextTierTarget(insight.score);
  const nextLabel = next
    ? `${RESULT_TIER_LABELS[next.tier]}まであと${displayScore(next.minScore - insight.score)}点`
    : `${currentTier}到達`;
  return `${displayScore(insight.score)}点 / ${currentTier}見立て / ${nextLabel}`;
}

export function outlookProfile(insight: ResponseInsight) {
  return [
    {
      key: 'stretch',
      label: '伸びしろ',
      value: stretchLabel(insight),
      tone: insight.rangeTone === 'best' ? 'positive' : insight.rangeTone === 'danger' ? 'negative' : 'neutral',
    },
    {
      key: 'stability',
      label: '安定',
      value: stabilityLabel(insight),
      tone: insight.rangeTone === 'danger' ? 'negative' : insight.rangeTone === 'thin' ? 'neutral' : 'positive',
    },
    {
      key: 'cost',
      label: '代償',
      value: costLabel(insight),
      tone: insight.deltaLoad >= 2 || insight.sideEffects.some((effect) => effect.value < 0) ? 'negative' : insight.deltaLoad < 0 ? 'positive' : 'neutral',
    },
  ] as const;
}

function nextTierTarget(score: number): { tier: ResultTier; minScore: number } | null {
  return [
    { tier: 'fray' as const, minScore: 0 },
    { tier: 'smallSuccess' as const, minScore: 2 },
    { tier: 'scene' as const, minScore: 4 },
    { tier: 'masterpiece' as const, minScore: 7 },
  ].find((step) => score < step.minScore) ?? null;
}

function stretchLabel(insight: ResponseInsight) {
  if (insight.successRangeLabel.includes(RESULT_TIER_LABELS.masterpiece)) return '名場面圏内';
  if (insight.successRangeLabel.includes(RESULT_TIER_LABELS.scene)) return '場面化まで';
  if (insight.successRangeLabel.includes(RESULT_TIER_LABELS.smallSuccess)) return '小成功まで';
  return '崩れ抑え';
}

function stabilityLabel(insight: ResponseInsight) {
  if (insight.dangerWarning) return '事故注意';
  if (insight.prepRelationTone === 'primary') return '準備で支える';
  if (insight.frayRelationTone === 'recover') return 'ほころび回収';
  if (insight.rangeTone === 'thin') return '揺れが残る';
  return '大崩れしにくい';
}

function costLabel(insight: ResponseInsight) {
  if (insight.deltaLoad >= 2) return '負荷が重い';
  if (insight.deltaLoad > 0) return '負荷が残る';
  if (insight.sideEffects.some((effect) => effect.value < 0)) return '差分に注意';
  if (insight.deltaLoad < 0) return '負荷を下げる';
  return '代償は軽め';
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
  if (!item) return '名場面ライン7点には届くが、主因は分散している。下振れ要素が増えると場面化まで落ちる。';
  return `名場面ライン7点に届く。主因: ${item.label}${signedValue(item.value)}。${gameDetail(item)}`;
}

function blockerReason(item?: ScoreBreakdownItem) {
  if (!item) return undefined;
  if (item.id === 'arrange-cap') return `名場面不可。${item.label}がかかっている。技巧派、不安/疲労、ほころび回収の条件がないため場面化まで。`;
  if (item.id === 'prep-cap') return `上限あり。${item.label}がかかっている。準備一致から外れているため、加点しても名場面ラインまで伸びない。`;
  return `減点が重い。${item.label}${signedValue(item.value)}。${gameDetail(item)}`;
}

function riskReason(item?: ScoreBreakdownItem) {
  if (!item) return undefined;
  return `減点あり。${item.label}${signedValue(item.value)}。名場面を狙うなら、この減点を避けたい。`;
}

function missingMasterpieceReason(insight: ResponseInsight) {
  const shortfall = Math.max(1, 7 - insight.score);
  const currentDriver = strongestDriver(insight.scoreBreakdown);
  const current = currentDriver ? `最大加点は${currentDriver.label}${signedValue(currentDriver.value)}。` : '';
  const missing = missingMasterpieceAxes(insight);
  return `加点不足。名場面ライン7点まであと${shortfall}点。${current}${missing}のどれかを重ねたい。`;
}

function missingMasterpieceAxes(insight: ResponseInsight) {
  const missing: string[] = [];
  if ((valueFor(insight.scoreBreakdown, 'event') ?? 0) < 3) missing.push('出来事相性◎');
  if (!hasPositive(insight.scoreBreakdown, ['prep-hit', 'prep-response', 'prep-response-guard'])) missing.push('準備一致');
  if ((valueFor(insight.scoreBreakdown, 'actor') ?? 0) <= 0 && !hasPositive(insight.scoreBreakdown, ['actor-trust'])) missing.push('役者相性');
  if ((valueFor(insight.scoreBreakdown, 'state') ?? 0) <= 0) missing.push('状態補正');
  if (!hasPositive(insight.scoreBreakdown, ['performance-style', 'build-level'])) missing.push('公演の色');
  if (!hasPositive(insight.scoreBreakdown, ['fray-reward'])) missing.push('ほころび回収');
  return listForMemo(missing);
}

function costReason(insight: ResponseInsight, risk?: ScoreBreakdownItem, skipId?: string) {
  if (insight.deltaLoad >= 2) return ' 代償として裏方負荷が重く残る。';
  if (risk && risk.id !== skipId) return '';
  if (insight.actorTrustLabel) return ` ${insight.actorTrustLabel}`;
  return '';
}

function valueFor(items: ScoreBreakdownItem[], id: string) {
  return items.find((item) => item.id === id)?.value;
}

function hasPositive(items: ScoreBreakdownItem[], ids: string[]) {
  return ids.some((id) => (valueFor(items, id) ?? 0) > 0);
}

function listForMemo(items: string[]) {
  const visible = items.slice(0, 3);
  if (visible.length === 0) return '追加加点';
  return visible.join('・');
}

function signedValue(value: number) {
  if (value === 0) return '';
  return ` ${value > 0 ? '+' : ''}${value}`;
}

function gameDetail(item: ScoreBreakdownItem) {
  if (item.id === 'event' && item.value > 0 && item.value < 3) return '出来事は合っているが、◎相性ではない。';
  if (item.id === 'prep-hit' || item.id === 'prep-response') return '準備一致の上振れが入っている。';
  if (item.id === 'prep-response-guard') return '転換準備と切る判断が噛み合っている。';
  if (item.id === 'fray-reward') return 'ほころび回収の追加点が入っている。';
  if (item.id === 'actor-trust') return '役者の得意対応と信頼補正が入っている。';
  return item.detail ?? 'この補正が結果ラインを押し上げている。';
}

export function resultRangeIndices(label: string) {
  const [lowLabel, highLabel] = label.split('〜');
  const tierOrder: ResultTier[] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];
  const lowIndex = Math.max(0, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === lowLabel));
  const highIndex = Math.max(lowIndex, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === highLabel));
  return { lowIndex, highIndex };
}

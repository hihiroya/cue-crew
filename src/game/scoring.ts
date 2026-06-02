import {
  ACTS,
  ACTOR_LABELS,
  ACT_RESPONSE_GUIDES,
  EVENT_COMPATIBILITY,
  EVENT_LABELS,
  MAX_LOAD,
  PERFORMANCE_SLOT_LABELS,
  PERFORMANCE_STYLE_DETAILS,
  PREP_LABELS,
  PREP_MATCHES,
  PREP_PRIMARY_RESPONSE,
  PREP_RESPONSE_HINTS,
  RESPONSE_DESCRIPTIONS,
  RESPONSE_LABELS,
  RESPONSE_BIAS,
  RESULT_TIER_LABELS,
  STATE_LABELS,
  TURNS_PER_ACT,
} from './constants';
import { topOmenEvents } from './actorLogic';
import { createRng } from './rng';
import { frayFitFor, guardTierForFrayRecovery } from './fray';
import { flavorText, prepRecovery, sceneTitle } from './sceneTemplates';
import type { Actor, GameState, LoadBias, MainResponse, PerformanceSlot, PerformanceStyle, PrepPredictionQuality, ResponseInsight, ResultPreview, ResultTier, ScoreBreakdownItem, TurnLog } from './types';

function slotForTurnInAct(turnInAct: number): PerformanceSlot {
  return turnInAct === 1 ? 'matinee' : 'soiree';
}

function performanceLabel(day: number, slot: PerformanceSlot) {
  return `${day}日目 ${PERFORMANCE_SLOT_LABELS[slot].label}`;
}

function actorResponseBonus(actor: Actor, response: MainResponse): number {
  if (actor.type === 'lead' && ['wait', 'catch', 'arrange'].includes(response)) return 1;
  if (actor.type === 'junior' && ['catch', 'arrange'].includes(response)) return 1;
  if (actor.type === 'skilled' && ['wait', 'arrange'].includes(response)) return 1;
  if (actor.type === 'junior' && response === 'wait' && actor.state === 'elated') return -1;
  return 0;
}

function stateResponseBonus(actor: Actor, response: MainResponse): number {
  if (actor.state === 'elated' && response === 'catch') return 1;
  if (actor.state === 'contemplative' && response === 'wait') return 1;
  if (actor.state === 'anxious' && response === 'arrange') return 1;
  if (actor.state === 'immersed' && ['wait', 'catch'].includes(response)) return 1;
  if (actor.state === 'fatigued' && ['arrange', 'cut'].includes(response)) return 1;
  if (actor.state === 'fatigued' && response === 'catch') return -1;
  return 0;
}

function actBonus(state: GameState, response: MainResponse): number {
  const slot = slotForTurnInAct(state.turnInAct);
  if (state.act === 1 && ['wait', 'arrange'].includes(response)) return 1;
  if (state.act === 1 && slot === 'soiree' && response === 'catch') return 1;
  if (state.act === 2 && response === 'catch') return slot === 'soiree' ? 2 : 1;
  if (state.act === 2 && ['arrange', 'cut'].includes(response)) return 1;
  if (state.act === 3 && ['wait', 'arrange'].includes(response) && state.trustScore >= 2) return 2;
  if (state.act === 3 && response === 'cut' && state.backstageLoad >= 3) return 1;
  return 0;
}

function performanceStyleScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  if (!state.performanceStyle) return undefined;
  const style = PERFORMANCE_STYLE_DETAILS[state.performanceStyle];
  if (response !== style.strength) return undefined;
  return scoreItem('performance-style', `${style.label}に${RESPONSE_LABELS[response]}が沿った`, 1, style.short);
}

function repeatPenalty(state: GameState, response: MainResponse): number {
  const count = consecutiveUseCount(state, response);
  if (count < 3) return 0;
  if (response === 'catch' || response === 'cut') return -1;
  if (response === 'arrange' || response === 'wait') return -1;
  return 0;
}

function frayScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  const fit = frayFitFor(state, response);
  if (fit.status === 'none') return undefined;
  if (fit.status === 'miss') return scoreItem('fray-miss', fit.label ?? '舞台裏のほころびは残りそう', 0, fit.detail);
  return scoreItem('fray', fit.label ?? '舞台裏のほころびを拾った', fit.value, fit.detail);
}

function frayRelationLabel(state: GameState, response: MainResponse): Pick<ResponseInsight, 'frayRelationLabel' | 'frayRelationTone'> {
  const fit = frayFitFor(state, response);
  if (fit.status === 'none') return {};
  if (fit.status === 'miss') return { frayRelationLabel: '舞台裏のほころびは残りそう', frayRelationTone: 'miss' };
  return { frayRelationLabel: fit.status === 'strong' ? '舞台裏のほころびを拾える' : '舞台裏のほころびを整えられる', frayRelationTone: 'recover' };
}

type PrepResponseRelation = {
  label: string;
  tone: ResponseInsight['prepRelationTone'];
  aim: string;
};

function prepResponseRelation(state: GameState, response: MainResponse): PrepResponseRelation {
  if (!state.selectedPrep || !state.currentActorEvent) {
    throw new Error('Cannot inspect prep relation before event and prep are selected.');
  }
  const prep = state.selectedPrep;
  const event = state.currentActorEvent.type;
  const primary = PREP_PRIMARY_RESPONSE[prep];
  if (response === primary) {
    return {
      label: `◎ ${PREP_LABELS[prep]}が乗る`,
      tone: 'primary',
      aim: PREP_RESPONSE_HINTS[prep].aim,
    };
  }
  if (prep === 'watch' && response === 'arrange') {
    return {
      label: '△ 安定の別筋',
      tone: 'alternate',
      aim: '予定外を伸ばしすぎず、舞台の呼吸に戻す',
    };
  }
  if (prep === 'makeSpace' && response === 'catch' && event === 'heatUp') {
    return {
      label: '△ 攻めの別筋',
      tone: 'alternate',
      aim: '残した余白から熱を見せ場に変える',
    };
  }
  if (prep === 'tightenFlow' && response === 'cut') {
    return {
      label: '△ 守りの別筋',
      tone: 'alternate',
      aim: '走った場面を早めに閉じ、崩れを小さくする',
    };
  }
  if (prep === 'prepareTransition' && (response === 'wait' || response === 'arrange')) {
    return {
      label: '△ 別筋',
      tone: 'alternate',
      aim: response === 'wait' ? '遅れや揺れを余韻として残す' : '遅れや揺れを舞台全体の流れに戻す',
    };
  }
  if (EVENT_COMPATIBILITY[event][response] > 0) {
    return {
      label: '△ 別筋',
      tone: 'alternate',
      aim: `${PREP_LABELS[prep]}とは狙いを変えて、${RESPONSE_DESCRIPTIONS[response]}`,
    };
  }
  return {
    label: '× 噛み合いにくい',
    tone: 'poor',
    aim: RESPONSE_DESCRIPTIONS[response],
  };
}

function prepResponseScoreItem(state: GameState, response: MainResponse, prepQuality: PrepPredictionQuality): ScoreBreakdownItem | undefined {
  if (!state.selectedPrep) return undefined;
  const prep = state.selectedPrep;
  const primary = PREP_PRIMARY_RESPONSE[prep];
  if (response !== primary) return undefined;
  if (prep === 'prepareTransition' && response === 'cut') {
    return scoreItem('prep-response-guard', '転換の備えが切る判断を支えた', 0, '場面の伸びより、崩れを小さく閉じる。');
  }
  if (prepQuality === 'hit') {
    return scoreItem('prep-response', `${PREP_LABELS[prep]}の準備が活きた`, 1, `${RESPONSE_LABELS[response]}の上振れを少し広げた。`);
  }
  if (prepQuality === 'partial') {
    return scoreItem('prep-response', `${PREP_LABELS[prep]}の準備を受けた`, 0, '見えていた兆候には沿っているため、判断が安定する。');
  }
  return undefined;
}

function transitionCutGuardActive(state: GameState, response: MainResponse): boolean {
  return state.selectedPrep === 'prepareTransition' && response === 'cut';
}

function guardTierForTransitionCut(tier: ResultTier, state: GameState, response: MainResponse, prepQuality: PrepPredictionQuality): ResultTier {
  if (!transitionCutGuardActive(state, response) || prepQuality === 'miss') return tier;
  if (tier === 'accident') return 'fray';
  if (tier === 'fray' && prepQuality === 'hit') return 'smallSuccess';
  return tier;
}

function consecutiveUseCount(state: GameState, response: MainResponse): number {
  let previous = 0;
  for (let index = state.lastResponses.length - 1; index >= 0; index -= 1) {
    if (state.lastResponses[index] !== response) break;
    previous += 1;
  }
  return previous + 1;
}

type RepeatAdjustment = {
  deltaLoad: number;
  deltaFlow: number;
  deltaScene: number;
  deltaTrust: number;
  label?: string;
  detail?: string;
  cardLabel?: string;
};

function repeatAdjustment(response: MainResponse, count: number, success: boolean): RepeatAdjustment {
  if (count < 2) return { deltaLoad: 0, deltaFlow: 0, deltaScene: 0, deltaTrust: 0 };
  if (response === 'catch') {
    if (count >= 3) {
      return {
        deltaLoad: 2,
        deltaFlow: -1,
        deltaScene: 0,
        deltaTrust: 0,
        label: '拾う判断が続いた',
        detail: '予定外を見せ場に変えるための負荷が残った。',
        cardLabel: '連続使用: 負荷+2 / 流れ-1',
      };
    }
    return {
      deltaLoad: 1,
      deltaFlow: 0,
      deltaScene: 0,
      deltaTrust: 0,
      label: '拾う判断が続いた',
      detail: '攻め続けるぶん負荷が残った。',
      cardLabel: '連続使用: 負荷+1',
    };
  }
  if (response === 'arrange') {
    if (count >= 3) {
      return {
        deltaLoad: 1,
        deltaFlow: 0,
        deltaScene: -1,
        deltaTrust: 0,
        label: '整える判断が続いた',
        detail: '舞台は安定したが、同じ調整では場面の伸びが鈍った。',
        cardLabel: '連続使用: 負荷+1 / 場面-1',
      };
    }
    return {
      deltaLoad: success ? 1 : 0,
      deltaFlow: 0,
      deltaScene: 0,
      deltaTrust: 0,
      label: success ? '整える判断が続いた' : undefined,
      detail: success ? '舞台は安定したが、同じ調整では負荷が抜けきらなかった。' : undefined,
      cardLabel: '連続使用: 負荷回復なし',
    };
  }
  if (response === 'wait') {
    if (count >= 3) {
      return {
        deltaLoad: 1,
        deltaFlow: -1,
        deltaScene: 0,
        deltaTrust: 0,
        label: '待つ判断が続いた',
        detail: '余韻は残ったが、次の場面への処理が滞った。',
        cardLabel: '連続使用: 負荷+1 / 流れ-1',
      };
    }
    return {
      deltaLoad: success ? 1 : 0,
      deltaFlow: 0,
      deltaScene: 0,
      deltaTrust: 0,
      label: success ? '待つ判断が続いた' : undefined,
      detail: success ? '余韻は残ったが、同じ待ちでは負荷が抜けきらなかった。' : undefined,
      cardLabel: '連続使用: 負荷回復なし',
    };
  }
  if (count >= 3) {
    return {
      deltaLoad: 1,
      deltaFlow: 0,
      deltaScene: 0,
      deltaTrust: -1,
      label: '切る判断が続いた',
      detail: '進行は守ったが、役者との信頼が削れた。',
      cardLabel: '連続使用: 信頼-1 / 負荷+1',
    };
  }
  return {
    deltaLoad: 0,
    deltaFlow: 0,
    deltaScene: 0,
    deltaTrust: -1,
    label: '切る判断が続いた',
    detail: '進行は守ったが、役者との信頼が少し削れた。',
    cardLabel: '連続使用: 信頼-1',
  };
}

export function tierFromScore(score: number): ResultTier {
  if (score >= 7) return 'masterpiece';
  if (score >= 4) return 'scene';
  if (score >= 2) return 'smallSuccess';
  if (score >= 0) return 'fray';
  return 'accident';
}

function deltasFor(tier: ResultTier, response: MainResponse, state: GameState, prepQuality: PrepPredictionQuality) {
  const success = ['masterpiece', 'scene', 'smallSuccess'].includes(tier);
  const consecutiveCount = consecutiveUseCount(state, response);
  const repeat = repeatAdjustment(response, consecutiveCount, success);
  const frayFit = frayFitFor(state, response);
  const base = {
    masterpiece: { scene: 4, flow: 2, trust: 2 },
    scene: { scene: 3, flow: 1, trust: 1 },
    smallSuccess: { scene: 1, flow: 1, trust: 0 },
    fray: { scene: 0, flow: -1, trust: -1 },
    accident: { scene: -1, flow: -2, trust: -2 },
  }[tier];
  let deltaLoad = 0;
  if (response === 'catch') deltaLoad = tier === 'masterpiece' ? 2 : success ? 1 : 2;
  if (response === 'arrange') deltaLoad = success ? -1 : 1;
  if (response === 'wait') deltaLoad = success ? -1 : 1;
  if (response === 'cut') deltaLoad = 0;
  if (state.act === 2 && response === 'catch') deltaLoad += 1;
  if (state.act === 3 && success && ['arrange', 'cut'].includes(response)) deltaLoad -= 1;
  if (prepQuality === 'miss' && response === 'catch') deltaLoad += 1;
  if (transitionCutGuardActive(state, response) && deltaLoad > 0) deltaLoad -= 1;
  const slot = slotForTurnInAct(state.turnInAct);
  if (slot === 'matinee' && success && ['arrange', 'wait'].includes(response)) deltaLoad -= 1;
  if (slot === 'soiree' && response === 'catch' && success) deltaLoad += 1;
  if (state.performanceStyle === 'heat' && response === 'catch' && success) deltaLoad += 1;
  if (state.performanceStyle === 'control' && response === 'arrange' && success) deltaLoad -= 1;
  if (state.performanceStyle === 'closure' && response === 'cut' && deltaLoad > 0) deltaLoad -= 1;
  const loadPenalty = state.backstageLoad >= 4 && tier !== 'masterpiece' ? -1 : 0;
  const waitTrustBonus = response === 'wait' && success ? 1 : 0;
  const styleTrustBonus = state.performanceStyle === 'breath' && response === 'wait' && success ? 1 : 0;
  const cutTrustPenalty = response === 'cut' && success ? -1 : 0;
  const styleSceneBonus = state.performanceStyle === 'heat' && response === 'catch' && success ? 1 : 0;
  return {
    deltaScene: base.scene + repeat.deltaScene + styleSceneBonus,
    deltaFlow: base.flow + loadPenalty + repeat.deltaFlow + frayFit.deltaFlow,
    deltaTrust: base.trust + waitTrustBonus + styleTrustBonus + cutTrustPenalty + repeat.deltaTrust,
    deltaLoad: deltaLoad + repeat.deltaLoad + frayFit.deltaLoad,
    repeat,
    frayFit,
    consecutiveCount,
  };
}

function toneFor(value: number): ScoreBreakdownItem['tone'] {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

function scoreItem(id: string, label: string, value: number, detail?: string): ScoreBreakdownItem {
  return { id, label, value, tone: toneFor(value), detail };
}

function symbolFor(value: number) {
  if (value >= 3) return '◎';
  if (value > 0) return '○';
  if (value < 0) return '×';
  return '△';
}

function actorResponseLabel(actor: Actor, response: MainResponse, value: number) {
  if (actor.type === 'junior' && response === 'wait' && actor.state === 'elated') return '高揚した若手に待つは噛み合いにくい';
  if (value > 0) return `${ACTOR_LABELS[actor.type]}に${RESPONSE_LABELS[response]}が合っていた`;
  return `${ACTOR_LABELS[actor.type]}との相性は通常`;
}

function stateResponseLabel(actor: Actor, response: MainResponse, value: number) {
  if (value > 0) return `${STATE_LABELS[actor.state]}に${RESPONSE_LABELS[response]}が合っていた`;
  if (value < 0) return `${STATE_LABELS[actor.state]}に${RESPONSE_LABELS[response]}は負担が大きい`;
  return `${STATE_LABELS[actor.state]}との相性は通常`;
}

function actLabel(state: GameState, response: MainResponse, value: number) {
  const label = performanceLabel(state.act, slotForTurnInAct(state.turnInAct));
  if (value > 0) return `${label}に${RESPONSE_LABELS[response]}が合っていた`;
  return `${label}との相性は通常`;
}

function prepPredictionQuality(state: GameState, actor: Actor): PrepPredictionQuality {
  if (!state.currentActorEvent || !state.selectedPrep) {
    throw new Error('Cannot inspect prep before event and prep are selected.');
  }
  if (PREP_MATCHES[state.selectedPrep].includes(state.currentActorEvent.type)) return 'hit';
  const visibleOmens = topOmenEvents(actor).map((omen) => omen.event);
  return visibleOmens.some((event) => PREP_MATCHES[state.selectedPrep as keyof typeof PREP_MATCHES].includes(event)) ? 'partial' : 'miss';
}

function prepScoreItem(quality: PrepPredictionQuality): ScoreBreakdownItem {
  if (quality === 'hit') return scoreItem('prep-hit', '準備が活きた', 2, '上振れ幅が広がり、名場面まで届く。');
  if (quality === 'partial') return scoreItem('prep-partial', '準備が一部活きた', 0, '見えている兆候には備えていたため、崩れにくい。');
  return scoreItem('prep-miss', '別の備えだった', -1, '上限が下がり、攻めるほど負荷が残りやすい。');
}

function capForPrepQuality(quality: PrepPredictionQuality) {
  if (quality === 'hit') return Number.POSITIVE_INFINITY;
  if (quality === 'partial') return 6;
  return 3;
}

function buildScoreBreakdown(state: GameState, actor: Actor, response: MainResponse): ScoreBreakdownItem[] {
  if (!state.currentActorEvent || !state.selectedPrep) {
    throw new Error('Cannot score before event and prep are selected.');
  }
  const prepQuality = prepPredictionQuality(state, actor);
  const eventValue = EVENT_COMPATIBILITY[state.currentActorEvent.type][response];
  const actorValue = actorResponseBonus(actor, response);
  const stateValue = stateResponseBonus(actor, response);
  const actValue = actBonus(state, response);
  const trustValue = Math.max(-2, Math.min(2, Math.floor(state.trustScore / 3)));
  const loadValue = state.backstageLoad >= 5 ? -3 : state.backstageLoad >= 4 ? -2 : state.backstageLoad >= 3 ? -1 : 0;
  const repeatedValue = repeatPenalty(state, response);
  const repeat = repeatAdjustment(response, consecutiveUseCount(state, response), true);
  const prepResponseItem = prepResponseScoreItem(state, response, prepQuality);
  const styleItem = performanceStyleScoreItem(state, response);
  const frayItem = frayScoreItem(state, response);
  const items = [
    scoreItem(
      'event',
      `${EVENT_LABELS[state.currentActorEvent.type]}と${RESPONSE_LABELS[response]}の相性`,
      eventValue,
      eventValue >= 3 ? '出来事に強く噛み合う対応。' : eventValue > 0 ? '出来事を受け止められる対応。' : eventValue < 0 ? '出来事と逆方向の対応。' : '決定打にはなりにくい対応。',
    ),
    scoreItem('actor', actorResponseLabel(actor, response, actorValue), actorValue),
    scoreItem('state', stateResponseLabel(actor, response, stateValue), stateValue),
    prepScoreItem(prepQuality),
    prepResponseItem,
    scoreItem('act', actLabel(state, response, actValue), actValue),
    styleItem,
    scoreItem('trust', '公演全体の信頼補正', trustValue),
    scoreItem('load', '裏方負荷の重さ', loadValue),
    scoreItem('repeat', repeat.label ?? '同じ対応の連続使用', repeatedValue, repeat.detail),
    frayItem,
  ].filter((item): item is ScoreBreakdownItem => Boolean(item));
  const rawScore = sumBreakdown(items);
  const cap = capForPrepQuality(prepQuality);
  if (rawScore > cap) {
    items.push(scoreItem('prep-cap', '準備の上限', cap - rawScore, prepQuality === 'partial' ? '一部だけ活きたため場面化までに留まる。' : '別の備えだったため小さな成功までに留まる。'));
  }
  return items.filter((item) => item.value !== 0 || ['prep-partial', 'prep-response', 'prep-response-guard', 'fray-miss'].includes(item.id));
}

function sumBreakdown(items: ScoreBreakdownItem[]) {
  return items.reduce((total, item) => total + item.value, 0);
}

function rangeForScore(score: number, quality: PrepPredictionQuality): { label: string; tone: ResponseInsight['rangeTone']; dangerWarning?: string; highTier: ResultTier; lowTier: ResultTier } {
  const lowScore = score + (quality === 'hit' ? -1 : -2);
  const highScore = score + (quality === 'hit' ? 2 : quality === 'partial' ? 1 : 0);
  const highTier = tierFromScore(Math.min(highScore, capForPrepQuality(quality)));
  const lowTier = tierFromScore(lowScore);
  const dangerWarning = lowTier === 'accident' ? '危険: 事故圏内' : undefined;
  const visibleLow = lowTier === 'accident' ? 'ほころび' : RESULT_TIER_LABELS[lowTier];
  const label = `${visibleLow}〜${RESULT_TIER_LABELS[highTier]}`;
  const tone: ResponseInsight['rangeTone'] = dangerWarning ? 'danger' : highTier === 'masterpiece' ? 'best' : highTier === 'scene' ? 'good' : lowTier === 'fray' ? 'thin' : 'good';
  return { label, tone, dangerWarning, highTier, lowTier };
}

function guardedRangeForScore(score: number, quality: PrepPredictionQuality, state: GameState, response: MainResponse): { label: string; tone: ResponseInsight['rangeTone']; dangerWarning?: string; highTier: ResultTier; lowTier: ResultTier } {
  const range = rangeForScore(score, quality);
  const lowTier = guardTierForTransitionCut(range.lowTier, state, response, quality);
  const highTier = guardTierForTransitionCut(range.highTier, state, response, quality);
  const dangerWarning = lowTier === 'accident' ? range.dangerWarning : undefined;
  const visibleLow = lowTier === 'accident' ? 'ほころび' : RESULT_TIER_LABELS[lowTier];
  const label = `${visibleLow}〜${RESULT_TIER_LABELS[highTier]}`;
  const tone: ResponseInsight['rangeTone'] = dangerWarning ? 'danger' : highTier === 'masterpiece' ? 'best' : highTier === 'scene' ? 'good' : lowTier === 'fray' ? 'thin' : 'good';
  return { ...range, label, tone, dangerWarning, highTier, lowTier };
}

function upsideLabel(response: MainResponse, highTier: ResultTier) {
  if (highTier === 'masterpiece') return `${RESPONSE_LABELS[response]}が噛み合えば名場面まで狙える`;
  if (highTier === 'scene') return `${RESPONSE_LABELS[response]}が噛み合えば場面化まで届く`;
  if (highTier === 'smallSuccess') return `${RESPONSE_LABELS[response]}で小さな成功まで守れる`;
  return '崩れを小さく留める手';
}

function downsideLabel(response: MainResponse, lowTier: ResultTier, deltaLoad: number) {
  if (lowTier === 'accident') return '下振れると事故圏内';
  if (response === 'catch' && deltaLoad > 0) return '下振れると負荷が残る';
  if (response === 'cut') return '場面は閉じるが信頼を削りやすい';
  if (lowTier === 'fray') return '下振れるとほころびが残る';
  return '下振れても大崩れはしにくい';
}

function sideEffectLabel(deltas: ReturnType<typeof deltasFor>) {
  const load = deltas.deltaLoad > 0 ? `負荷+${deltas.deltaLoad}` : deltas.deltaLoad < 0 ? `負荷${deltas.deltaLoad}` : '負荷±0';
  const trust = deltas.deltaTrust > 0 ? `信頼+${deltas.deltaTrust}` : deltas.deltaTrust < 0 ? `信頼${deltas.deltaTrust}` : '';
  const flow = deltas.deltaFlow < 0 ? `流れ${deltas.deltaFlow}` : deltas.deltaFlow > 1 ? `流れ+${deltas.deltaFlow}` : '';
  const repeat = deltas.repeat.cardLabel;
  return [load, trust, flow, repeat].filter(Boolean).join(' / ');
}

type StyleSource = Pick<TurnLog, 'mainResponse' | 'deltaScene' | 'deltaFlow' | 'deltaTrust' | 'deltaLoad'>;

export function determinePerformanceStyle(logs: StyleSource[]): PerformanceStyle {
  const scores: Record<PerformanceStyle, number> = {
    heat: 0,
    breath: 0,
    control: 0,
    closure: 0,
  };
  logs.forEach((log) => {
    if (log.mainResponse === 'catch') scores.heat += 3;
    if (log.mainResponse === 'wait') scores.breath += 3;
    if (log.mainResponse === 'arrange') scores.control += 3;
    if (log.mainResponse === 'cut') scores.closure += 3;
    scores.heat += Math.max(0, log.deltaScene);
    scores.breath += Math.max(0, log.deltaTrust);
    scores.control += Math.max(0, log.deltaFlow) + Math.max(0, -log.deltaLoad);
    scores.closure += Math.max(0, -log.deltaFlow) + (log.deltaLoad <= 0 ? 1 : 0);
  });
  return (Object.entries(scores) as Array<[PerformanceStyle, number]>).sort((a, b) => b[1] - a[1])[0][0];
}

function stylePreviewFor(state: GameState, preview: StyleSource): { style: PerformanceStyle | null; isNew: boolean } {
  if (state.performanceStyle) return { style: state.performanceStyle, isNew: false };
  if (state.totalTurn !== TURNS_PER_ACT) return { style: null, isNew: false };
  return { style: determinePerformanceStyle([...state.logs, preview]), isNew: true };
}

export function responseInsight(state: GameState, response: MainResponse): ResponseInsight {
  if (!state.currentActorEvent || !state.selectedPrep || !state.currentFocusActorId) {
    throw new Error('Cannot inspect response before event and prep are selected.');
  }
  const actor = state.actors.find((item) => item.id === state.currentFocusActorId) ?? state.actors[0];
  const prepQuality = prepPredictionQuality(state, actor);
  const scoreBreakdown = buildScoreBreakdown(state, actor, response);
  const score = sumBreakdown(scoreBreakdown);
  const rawResultTier = tierFromScore(score);
  const resultTier = guardTierForFrayRecovery(guardTierForTransitionCut(rawResultTier, state, response, prepQuality), state, response);
  const deltas = deltasFor(resultTier, response, state, prepQuality);
  const deltaLoad = deltas.deltaLoad;
  const eventValue = EVENT_COMPATIBILITY[state.currentActorEvent.type][response];
  const actorValue = actorResponseBonus(actor, response) + stateResponseBonus(actor, response);
  const range = guardedRangeForScore(score, prepQuality, state, response);
  const relation = prepResponseRelation(state, response);
  return {
    response,
    score,
    resultTier,
    deltaLoad,
    successRangeLabel: range.label,
    upsideLabel: upsideLabel(response, range.highTier),
    downsideLabel: downsideLabel(response, range.lowTier, deltaLoad),
    prepRelationLabel: relation.label,
    prepRelationTone: relation.tone,
    responseAimLabel: relation.aim,
    eventAffinityLabel: `${EVENT_LABELS[state.currentActorEvent.type]}${symbolFor(eventValue)}`,
    actorAffinityLabel: `${ACTOR_LABELS[actor.type]}${symbolFor(actorValue)} / ${STATE_LABELS[actor.state]}${symbolFor(stateResponseBonus(actor, response))}`,
    actInfluenceLabel: ACT_RESPONSE_GUIDES[state.act]?.[response] ?? `${state.theme}の判断。`,
    sideEffectLabel: sideEffectLabel(deltas),
    ...frayRelationLabel(state, response),
    dangerWarning: range.dangerWarning,
    rangeTone: range.tone,
    scoreBreakdown,
  };
}

export function previewResult(state: GameState): ResultPreview {
  if (!state.currentActorEvent || !state.selectedPrep || !state.selectedResponse || !state.currentFocusActorId) {
    throw new Error('Cannot preview result before event, prep, and response are selected.');
  }
  const actor = state.actors.find((item) => item.id === state.currentFocusActorId) ?? state.actors[0];
  const response = state.selectedResponse;
  const prepQuality = prepPredictionQuality(state, actor);
  const prepMatched = prepQuality === 'hit';
  const insight = responseInsight(state, response);
  const score = insight.score;

  const tier = insight.resultTier;
  const deltas = deltasFor(tier, response, state, prepQuality);
  const stylePreview = stylePreviewFor(state, { mainResponse: response, deltaScene: deltas.deltaScene, deltaFlow: deltas.deltaFlow, deltaTrust: deltas.deltaTrust, deltaLoad: deltas.deltaLoad });
  const slot = slotForTurnInAct(state.turnInAct);
  const resultMode = state.act === 3 && slot === 'soiree' ? 'finale' : slot;
  const rng = createRng(`${state.seed}:title:${state.totalTurn}:${score}`);
  const frayFit = frayFitFor(state, response);
  const recoveredBias = tier !== 'accident' && state.pendingFrayEvent && frayFit.status !== 'miss' && frayFit.status !== 'none'
    ? state.pendingFrayEvent.bias
    : undefined;
  const title = sceneTitle({
    actor: actor.type,
    event: state.currentActorEvent.type,
    response,
    tier,
    frayBias: recoveredBias ?? null,
    seedIndex: Math.floor(rng() * 1000),
  });
  const recovery = prepRecovery({
    actor: actor.type,
    event: state.currentActorEvent.type,
    prep: state.selectedPrep,
    response,
    tier,
    quality: prepQuality,
  });

  const scoreBreakdown = deltas.repeat.label && !insight.scoreBreakdown.some((item) => item.id === 'repeat')
    ? [
        ...insight.scoreBreakdown,
        scoreItem(
          'repeat-effect',
          deltas.repeat.label,
          repeatPenalty(state, response),
          deltas.repeat.detail,
        ),
      ]
    : insight.scoreBreakdown;

  return {
    score,
    day: state.act,
    performanceSlot: slot,
    performanceLabel: performanceLabel(state.act, slot),
    resultMode,
    performanceStyle: stylePreview.style,
    styleLabel: stylePreview.style ? PERFORMANCE_STYLE_DETAILS[stylePreview.style].label : undefined,
    styleText: stylePreview.style ? PERFORMANCE_STYLE_DETAILS[stylePreview.style].short : undefined,
    styleIsNew: stylePreview.isNew,
    focusActorType: actor.type,
    actorState: actor.state,
    actorEventType: state.currentActorEvent.type,
    prepAction: state.selectedPrep,
    mainResponse: response,
    resultTier: tier,
    sceneTitle: title,
    flavorText: flavorText({
      actor: actor.type,
      actorState: actor.state,
      event: state.currentActorEvent.type,
      prep: state.selectedPrep,
      response,
      tier,
      prepMatched,
      recoveredFray: recoveredBias,
    }),
    prepMatched,
    prepQuality,
    prepRecoveryTone: recovery.tone,
    prepRecoveryLabel: recovery.label,
    prepRecoveryTitle: recovery.title,
    prepRecoveryText: recovery.text,
    scoreBreakdown,
    loadBias: RESPONSE_BIAS[response],
    eventTitle: state.currentActorEvent.title,
    eventDescription: state.currentActorEvent.description,
    prepRelationLabel: insight.prepRelationLabel,
    prepRelationTone: insight.prepRelationTone,
    responseAimLabel: insight.responseAimLabel,
    ...deltas,
  };
}

export function clampLoad(load: number): number {
  return Math.max(0, Math.min(MAX_LOAD, load));
}

export function toTurnLog(state: GameState, preview: ResultPreview): TurnLog {
  return {
    act: state.act,
    turnInAct: state.turnInAct,
    totalTurn: state.totalTurn,
    focusActorType: preview.focusActorType,
    actorState: preview.actorState,
    actorEventType: preview.actorEventType,
    prepAction: preview.prepAction,
    mainResponse: preview.mainResponse,
    resultTier: preview.resultTier,
    performanceStyle: preview.performanceStyle,
    score: preview.score,
    prepMatched: preview.prepMatched,
    prepQuality: preview.prepQuality,
    sceneTitle: preview.sceneTitle,
    flavorText: preview.flavorText,
    deltaScene: preview.deltaScene,
    deltaFlow: preview.deltaFlow,
    deltaTrust: preview.deltaTrust,
    deltaLoad: preview.deltaLoad,
    loadBias: preview.loadBias,
  };
}

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
  let title = '三日間を支えきった公演';
  if (masterpieceCount >= 2 && catchCount >= 2) title = '予定外を評判に変えた公演';
  else if (waitCount >= 2 && trustScore >= 4) title = '余韻が残る千秋楽';
  else if (catchCount >= 3) title = '熱量で押し切った公演';
  else if (arrangeCount >= 3 && flowScore >= sceneScore) title = '段取りが支えた公演';
  else if (flowScore < 0 || trustScore < 0) title = '荒れたが忘れがたい三日間';

  const dominantResponse = [
    { response: '拾う', count: catchCount },
    { response: '整える', count: arrangeCount },
    { response: '待つ', count: waitCount },
    { response: '切る', count: cutCount },
  ].sort((a, b) => b.count - a.count)[0];
  const lateRecovery = logs.find((log) => log.act >= 3 && log.mainResponse === 'arrange' && ['masterpiece', 'scene'].includes(log.resultTier));
  const earlyFray = logs.find((log) => log.act <= 3 && (log.resultTier === 'fray' || log.resultTier === 'accident'));
  const hitRate = logs.length > 0 ? Math.round((prepHitCount / logs.length) * 100) : 0;
  const reviewNotes = [
    `初日を経て、公演の色は「${styleLabel}」になった。`,
    `準備は${prepHitCount}/${logs.length}回噛み合い、噛み合い率は${hitRate}%だった。`,
    `${dominantResponse.response}判断が多く、${dominantResponse.response === '拾う' ? '予定外を熱に変える場面が伸びた。' : dominantResponse.response === '待つ' ? '余韻を残す判断が信頼を支えた。' : dominantResponse.response === '整える' ? '乱れを舞台の呼吸へ戻す判断が流れを守った。' : '崩れを閉じて進行を守る判断が目立った。'}`,
    earlyFray
      ? `${earlyFray.act}日目${PERFORMANCE_SLOT_LABELS[earlyFray.turnInAct === 1 ? 'matinee' : 'soiree'].label}でほころびが出たため、以降は負荷管理が課題になった。`
      : `初日から2日目まで大きなほころびを抑え、判断の余裕を残せた。`,
    lateRecovery
      ? `${lateRecovery.act}日目${PERFORMANCE_SLOT_LABELS[lateRecovery.turnInAct === 1 ? 'matinee' : 'soiree'].label}で整えた判断により、千秋楽の流れは持ち直した。`
      : backstageLoad >= 3
        ? '次回は2日目マチネか3日目マチネで一度待つか整えると、ソワレへ負荷を残しにくい。'
        : '次回は高負荷を恐れすぎず、噛み合った準備から強い本対応を狙うと名場面を増やせる。',
  ];
  if (frayCount >= 3) reviewNotes.push('ほころびが多かったため、同じ対応の連続使用と負荷4以上の局面に注意したい。');
  const review = reviewNotes.join('');
  return { title, review, reviewNotes };
}

export function actForTurn(totalTurn: number) {
  const act = Math.ceil(totalTurn / 2);
  const turnInAct = totalTurn % 2 === 0 ? 2 : 1;
  const theme = ACTS[act - 1]?.name ?? '千秋楽';
  return { act, turnInAct, theme };
}

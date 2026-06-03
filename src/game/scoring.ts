import {
  ACTOR_LABELS,
  ACT_RESPONSE_GUIDES,
  EVENT_COMPATIBILITY,
  EVENT_LABELS,
  LOAD_LABELS,
  MAX_LOAD,
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
import { performanceLabel, slotForTurnInAct } from './turnCalendar';
import type { Actor, CueResultSummary, GameState, LoadBias, MainResponse, PerformanceStyle, PrepPredictionQuality, ResponseEffect, ResponseEffectTarget, ResponseInsight, ResultPreview, ResultTier, ScoreBreakdownItem, TurnLog } from './types';

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
  return sideEffects(deltas).map((effect) => effect.label).join(' / ');
}

function effectLabel(target: ResponseEffectTarget, value: number) {
  const label = {
    scene: '場面',
    flow: '流れ',
    trust: '信頼',
    load: '負荷',
  }[target];
  if (value > 0) return `${label}+${value}`;
  if (value < 0) return `${label}${value}`;
  return `${label}±0`;
}

function responseEffect(target: ResponseEffectTarget, value: number, repeat = false, label = effectLabel(target, value)): ResponseEffect {
  return { target, value, repeat, label: repeat ? `連続使用: ${label}` : label };
}

function repeatSideEffects(label?: string): ResponseEffect[] {
  if (!label) return [];
  const text = label.replace(/^連続使用:\s*/, '');
  return text.split(' / ').filter(Boolean).map((part) => {
    const target: ResponseEffectTarget = part.startsWith('場面')
      ? 'scene'
      : part.startsWith('流れ')
        ? 'flow'
        : part.startsWith('信頼')
          ? 'trust'
          : 'load';
    const value = Number(part.match(/[+-]\d+/)?.[0] ?? 0);
    return responseEffect(target, value, true, part);
  });
}

function sideEffects(deltas: ReturnType<typeof deltasFor>): ResponseEffect[] {
  const effects = [
    responseEffect('load', deltas.deltaLoad),
    deltas.deltaTrust !== 0 ? responseEffect('trust', deltas.deltaTrust) : undefined,
    deltas.deltaFlow < 0 || deltas.deltaFlow > 1 ? responseEffect('flow', deltas.deltaFlow) : undefined,
    ...repeatSideEffects(deltas.repeat.cardLabel),
  ].filter((effect): effect is ResponseEffect => Boolean(effect));
  return effects;
}

function cueKeyPoint(preview: Pick<ResultPreview, 'actorEventType' | 'mainResponse' | 'prepQuality' | 'resultTier' | 'scoreBreakdown'>) {
  const eventLabel = EVENT_LABELS[preview.actorEventType];
  const responseLabel = RESPONSE_LABELS[preview.mainResponse];
  if (preview.prepQuality === 'hit' && ['masterpiece', 'scene'].includes(preview.resultTier)) {
    return `${eventLabel}に備えが届き、${responseLabel}判断が場面の芯になった。`;
  }
  const strongest = [...preview.scoreBreakdown]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)[0];
  if (strongest) return `${strongest.label}が決め手になった。`;
  if (preview.resultTier === 'accident') return `${eventLabel}への${responseLabel}が一拍遅れ、流れから外れた。`;
  return `${eventLabel}を${responseLabel}で受け、小さく次へ渡した。`;
}

function cueCost(preview: Pick<ResultPreview, 'deltaLoad' | 'deltaFlow' | 'deltaTrust' | 'resultTier' | 'mainResponse'>) {
  if (preview.deltaLoad >= 2) return `評判は伸びたが、${RESPONSE_LABELS[preview.mainResponse]}の代償として裏方負荷が重く残った。`;
  if (preview.deltaFlow < 0) return '場面の揺れが進行へ残り、次の公演で整える余地がある。';
  if (preview.deltaTrust < 0) return '進行は守ったが、役者との呼吸は少し削れた。';
  if (preview.resultTier === 'masterpiece') return '負荷は残るが、客席まで届く見せ場として回収できた。';
  if (preview.resultTier === 'fray' || preview.resultTier === 'accident') return '舞台裏に揺れが残り、次の判断で拾う余白になった。';
  return '大きな代償は抑えつつ、次の場面へ渡せた。';
}

function cueHandoff(state: GameState, preview: Pick<ResultPreview, 'resultMode' | 'deltaLoad' | 'mainResponse' | 'performanceStyle'>) {
  if (preview.resultMode === 'finale') return 'この手応えを公演報告書へ回す。';
  if (state.pendingFrayEvent) {
    return `${LOAD_LABELS[state.pendingFrayEvent.bias]}のほころびが残る。次は拾える対応を優先したい。`;
  }
  if (state.backstageLoad + preview.deltaLoad >= 4) {
    return '次公演は負荷4以上で入る。整えるか待つ判断で一度息を戻したい。';
  }
  if (preview.performanceStyle) {
    const style = PERFORMANCE_STYLE_DETAILS[preview.performanceStyle];
    return `公演の色は「${style.label}」。${RESPONSE_LABELS[style.strength]}が次の軸になりやすい。`;
  }
  if (preview.mainResponse === 'catch') return '攻めの手応えがある。ソワレでは負荷との釣り合いを見る。';
  if (preview.mainResponse === 'arrange') return '流れは戻った。次は場面を伸ばす余地を探す。';
  if (preview.mainResponse === 'wait') return '余韻は残った。次は熱が来たら拾う判断も視野に入る。';
  return '崩れは閉じた。次は信頼を戻す判断を置きたい。';
}

function audienceReaction(preview: Pick<ResultPreview, 'resultTier' | 'actorEventType' | 'mainResponse' | 'deltaScene'>) {
  if (preview.resultTier === 'masterpiece') {
    if (preview.mainResponse === 'catch') return '客席反応: 予定外の一言に、拍手が少し長く残った。';
    if (preview.mainResponse === 'wait') return '客席反応: 沈黙のあと、客席の息が揃った。';
    if (preview.mainResponse === 'arrange') return '客席反応: 乱れが意味に変わり、場面の輪郭が締まった。';
    return '客席反応: 暗転の切れ味に、次の場面を待つ空気が生まれた。';
  }
  if (preview.resultTier === 'scene') return '客席反応: 危うさごと場面として受け取られた。';
  if (preview.resultTier === 'smallSuccess') return '客席反応: 大きな拍手ではないが、舞台の呼吸は途切れなかった。';
  if (preview.resultTier === 'fray') return '客席反応: ざわめきは残ったが、生の揺れとして受け止められた。';
  return '客席反応: 一拍の乱れが見えたが、熱は消えなかった。';
}

function cueResultSummary(state: GameState, preview: ResultPreview): CueResultSummary {
  return {
    keyPoint: cueKeyPoint(preview),
    cost: cueCost(preview),
    handoff: cueHandoff(state, preview),
    audienceReaction: audienceReaction(preview),
  };
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
    sideEffects: sideEffects(deltas),
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

  const preview: ResultPreview = {
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
    cueSummary: {
      keyPoint: '',
      cost: '',
      handoff: '',
      audienceReaction: '',
    },
    scoreBreakdown,
    loadBias: RESPONSE_BIAS[response],
    eventTitle: state.currentActorEvent.title,
    eventDescription: state.currentActorEvent.description,
    prepRelationLabel: insight.prepRelationLabel,
    prepRelationTone: insight.prepRelationTone,
    responseAimLabel: insight.responseAimLabel,
    ...deltas,
  };
  return {
    ...preview,
    cueSummary: cueResultSummary(state, preview),
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

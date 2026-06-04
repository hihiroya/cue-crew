import {
  ACTOR_LABELS,
  ACT_RESPONSE_GUIDES,
  EVENT_COMPATIBILITY,
  EVENT_LABELS,
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
import * as ruleText from '../content/ja/ruleCopy';
import { scoreRuleExtraCopy } from '../content/ja/rogueliteCopy';
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

function actorTrustScoreItem(actor: Actor, response: MainResponse): ScoreBreakdownItem | undefined {
  if (actor.trust < 3) return undefined;
  const fitsActor = (actor.type === 'lead' && ['wait', 'catch'].includes(response))
    || (actor.type === 'junior' && ['catch', 'arrange'].includes(response))
    || (actor.type === 'skilled' && ['arrange', 'wait'].includes(response));
  if (!fitsActor) return undefined;
  const copy = ruleText.actorTrustScoreCopy(actor, response);
  return scoreItem(
    'actor-trust',
    copy.label,
    1,
    copy.detail,
  );
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

function finaleScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  if (state.act !== 3 || slotForTurnInAct(state.turnInAct) !== 'soiree') return undefined;
  if (state.backstageLoad >= 3 && ['arrange', 'cut'].includes(response)) {
    const copy = ruleText.finaleScoreCopy('closeFray');
    return scoreItem('finale', copy.label, 1, copy.detail);
  }
  if (state.trustScore >= 4 && response === 'wait') {
    const copy = ruleText.finaleScoreCopy('waitTrust');
    return scoreItem('finale', copy.label, 1, copy.detail);
  }
  if (state.backstageLoad <= 1 && response === 'catch') {
    const copy = ruleText.finaleScoreCopy('attackLowLoad');
    return scoreItem('finale', copy.label, 1, copy.detail);
  }
  return undefined;
}

function performanceStyleScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  if (!state.performanceStyle) return undefined;
  const style = PERFORMANCE_STYLE_DETAILS[state.performanceStyle];
  if (response !== style.strength) return undefined;
  return scoreItem('performance-style', ruleText.performanceStyleScoreLabel(style.label, response), 1, style.short);
}

function performanceBuildLevelScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  if (!state.performanceStyle) return undefined;
  const style = PERFORMANCE_STYLE_DETAILS[state.performanceStyle];
  if (response !== style.strength) return undefined;
  const progress = state.logs.reduce((total, log) => {
    let value = log.mainResponse === style.strength ? 2 : 0;
    if (log.resultTier === 'masterpiece') value += 2;
    if (log.resultTier === 'scene') value += 1;
    if (state.performanceStyle === 'heat') value += Math.max(0, log.deltaScene);
    if (state.performanceStyle === 'breath') value += Math.max(0, log.deltaTrust);
    if (state.performanceStyle === 'control') value += Math.max(0, log.deltaFlow) + Math.max(0, -log.deltaLoad);
    if (state.performanceStyle === 'closure') value += log.deltaLoad <= 0 ? 1 : 0;
    return total + value;
  }, 0);
  if (progress >= 9) return scoreItem('build-level', `${style.label} Lv.3`, 2, scoreRuleExtraCopy.buildLevel3);
  if (progress >= 5) return scoreItem('build-level', `${style.label} Lv.2`, 1, scoreRuleExtraCopy.buildLevel2);
  return undefined;
}

function previousCutSetupActive(state: GameState): boolean {
  return state.lastResponses[state.lastResponses.length - 1] === 'cut';
}

function repeatPenalty(state: GameState, response: MainResponse): number {
  const count = consecutiveUseCount(state, response);
  if (response === 'cut' && count === 2) return -1;
  if (response === 'cut' && count >= 3) return -3;
  if (count < 3) return 0;
  if (response === 'catch') return -1;
  if (response === 'arrange' || response === 'wait') return -1;
  return 0;
}

function frayScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  const fit = frayFitFor(state, response);
  if (fit.status === 'none') return undefined;
  if (fit.status === 'miss') return scoreItem('fray-miss', fit.label ?? ruleText.ruleCopy.frayMiss, 0, fit.detail);
  return scoreItem('fray', fit.label ?? ruleText.ruleCopy.frayRecover, fit.value, fit.detail);
}

function frayRelationLabel(state: GameState, response: MainResponse): Pick<ResponseInsight, 'frayRelationLabel' | 'frayRelationTone'> {
  const fit = frayFitFor(state, response);
  if (fit.status === 'none') return {};
  if (fit.status === 'miss') return { frayRelationLabel: ruleText.ruleCopy.frayMiss, frayRelationTone: 'miss' };
  return { frayRelationLabel: fit.status === 'strong' ? ruleText.ruleCopy.frayRelationStrong : ruleText.ruleCopy.frayRelationMatch, frayRelationTone: 'recover' };
}

function actorTrustLabel(actor: Actor, response: MainResponse): Pick<ResponseInsight, 'actorTrustLabel'> {
  const item = actorTrustScoreItem(actor, response);
  return item ? { actorTrustLabel: item.detail ?? item.label } : {};
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
      label: ruleText.prepRelationPrimaryLabel(prep),
      tone: 'primary',
      aim: PREP_RESPONSE_HINTS[prep].aim,
    };
  }
  if (prep === 'watch' && response === 'arrange') {
    const copy = ruleText.prepRelationCopy('watchArrange');
    return {
      label: copy.label,
      tone: 'alternate',
      aim: copy.aim ?? '',
    };
  }
  if (prep === 'makeSpace' && response === 'catch' && event === 'heatUp') {
    const copy = ruleText.prepRelationCopy('spaceCatch');
    return {
      label: copy.label,
      tone: 'alternate',
      aim: copy.aim ?? '',
    };
  }
  if (prep === 'tightenFlow' && response === 'cut') {
    const copy = ruleText.prepRelationCopy('flowCut');
    return {
      label: copy.label,
      tone: 'alternate',
      aim: copy.aim ?? '',
    };
  }
  if (prep === 'prepareTransition' && (response === 'wait' || response === 'arrange')) {
    const copy = ruleText.prepRelationCopy(response === 'wait' ? 'transitionWait' : 'transitionArrange');
    return {
      label: copy.label,
      tone: 'alternate',
      aim: copy.aim ?? '',
    };
  }
  if (EVENT_COMPATIBILITY[event][response] > 0) {
    const copy = ruleText.prepRelationCopy('alternate');
    return {
      label: copy.label,
      tone: 'alternate',
      aim: ruleText.alternatePrepAim(prep, response),
    };
  }
  const copy = ruleText.prepRelationCopy('poor');
  return {
    label: copy.label,
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
    const copy = ruleText.prepResponseGuardCopy(prepQuality);
    if (prepQuality === 'hit') {
      return scoreItem('prep-response-guard', copy.label, 2, copy.detail);
    }
    if (prepQuality === 'partial') {
      return scoreItem('prep-response-guard', copy.label, 1, copy.detail);
    }
    return scoreItem('prep-response-guard', copy.label, 0, copy.detail);
  }
  if (prepQuality === 'hit') {
    const copy = ruleText.prepResponseCopy(prep, response, 'hit');
    return scoreItem('prep-response', copy.label, 1, copy.detail);
  }
  if (prepQuality === 'partial') {
    const copy = ruleText.prepResponseCopy(prep, response, 'partial');
    return scoreItem('prep-response', copy.label, 0, copy.detail);
  }
  return undefined;
}

function transitionCutGuardActive(state: GameState, response: MainResponse): boolean {
  return state.selectedPrep === 'prepareTransition' && response === 'cut';
}

function cutContainmentBonus(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  if (response !== 'cut') return undefined;
  if (transitionCutGuardActive(state, response) && state.backstageLoad >= 3) {
    const copy = ruleText.cutContainmentCopy('transitionHighLoad');
    return scoreItem('cut-containment', copy.label, 3, copy.detail);
  }
  if (transitionCutGuardActive(state, response)) {
    const copy = ruleText.cutContainmentCopy('transition');
    return scoreItem('cut-containment', copy.label, 2, copy.detail);
  }
  if (state.backstageLoad >= 4) {
    const copy = ruleText.cutContainmentCopy('highLoad');
    return scoreItem('cut-containment', copy.label, 2, copy.detail);
  }
  return undefined;
}

function frayRecoveryReward(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  const fit = frayFitFor(state, response);
  const isRepeatedResponse = state.lastResponses[state.lastResponses.length - 1] === response;
  if (isRepeatedResponse) return undefined;
  if (fit.status !== 'strong') return undefined;
  const copy = ruleText.frayRecoveryRewardCopy();
  return scoreItem('fray-reward', copy.label, 1, copy.detail);
}

function guardTierForTransitionCut(tier: ResultTier, state: GameState, response: MainResponse, prepQuality: PrepPredictionQuality): ResultTier {
  if (!transitionCutGuardActive(state, response) || prepQuality === 'miss') return tier;
  if (tier === 'accident') return 'fray';
  if (tier === 'fray' && prepQuality === 'hit') return 'smallSuccess';
  return tier;
}

function raiseTier(tier: ResultTier): ResultTier {
  if (tier === 'accident') return 'fray';
  if (tier === 'fray') return 'smallSuccess';
  if (tier === 'smallSuccess') return 'scene';
  if (tier === 'scene') return 'masterpiece';
  return 'masterpiece';
}

function guardTierForActorTrust(tier: ResultTier, actor: Actor, response: MainResponse): ResultTier {
  if (!actorTrustScoreItem(actor, response) || tier !== 'accident') return tier;
  return 'fray';
}

function guardTierForStrongFrayRecovery(tier: ResultTier, state: GameState, response: MainResponse): ResultTier {
  const fit = frayFitFor(state, response);
  const isRepeatedResponse = state.lastResponses[state.lastResponses.length - 1] === response;
  if (isRepeatedResponse) return tier;
  if (fit.status !== 'strong') return tier;
  return raiseTier(tier);
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
      const copy = ruleText.repeatAdjustmentCopy(response, count, success);
      return {
        deltaLoad: 2,
        deltaFlow: -1,
        deltaScene: 0,
        deltaTrust: 0,
        label: copy.label,
        detail: copy.detail,
        cardLabel: copy.cardLabel,
      };
    }
    const copy = ruleText.repeatAdjustmentCopy(response, count, success);
    return {
      deltaLoad: 1,
      deltaFlow: 0,
      deltaScene: 0,
      deltaTrust: 0,
      label: copy.label,
      detail: copy.detail,
      cardLabel: copy.cardLabel,
    };
  }
  if (response === 'arrange') {
    if (count >= 3) {
      const copy = ruleText.repeatAdjustmentCopy(response, count, success);
      return {
        deltaLoad: 1,
        deltaFlow: 0,
        deltaScene: -1,
        deltaTrust: 0,
        label: copy.label,
        detail: copy.detail,
        cardLabel: copy.cardLabel,
      };
    }
    const copy = ruleText.repeatAdjustmentCopy(response, count, success);
    return {
      deltaLoad: success ? 1 : 0,
      deltaFlow: 0,
      deltaScene: 0,
      deltaTrust: 0,
      label: copy.label,
      detail: copy.detail,
      cardLabel: copy.cardLabel,
    };
  }
  if (response === 'wait') {
    if (count >= 3) {
      const copy = ruleText.repeatAdjustmentCopy(response, count, success);
      return {
        deltaLoad: 1,
        deltaFlow: -1,
        deltaScene: 0,
        deltaTrust: 0,
        label: copy.label,
        detail: copy.detail,
        cardLabel: copy.cardLabel,
      };
    }
    const copy = ruleText.repeatAdjustmentCopy(response, count, success);
    return {
      deltaLoad: success ? 1 : 0,
      deltaFlow: 0,
      deltaScene: 0,
      deltaTrust: 0,
      label: copy.label,
      detail: copy.detail,
      cardLabel: copy.cardLabel,
    };
  }
  if (count >= 3) {
    const copy = ruleText.repeatAdjustmentCopy(response, count, success);
    return {
      deltaLoad: 1,
      deltaFlow: -1,
      deltaScene: -1,
      deltaTrust: -2,
      label: copy.label,
      detail: copy.detail,
      cardLabel: copy.cardLabel,
    };
  }
  const copy = ruleText.repeatAdjustmentCopy(response, count, success);
  return {
    deltaLoad: 0,
    deltaFlow: 0,
    deltaScene: 0,
    deltaTrust: -2,
    label: copy.label,
    detail: copy.detail,
    cardLabel: copy.cardLabel,
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
  if (prepQuality === 'hit' && deltaLoad > 0) deltaLoad -= 1;
  if (transitionCutGuardActive(state, response) && deltaLoad > 0) deltaLoad -= 1;
  const slot = slotForTurnInAct(state.turnInAct);
  if (slot === 'matinee' && success && ['arrange', 'wait'].includes(response)) deltaLoad -= 1;
  if (slot === 'soiree' && response === 'catch' && success) deltaLoad += 1;
  if (state.performanceStyle === 'heat' && response === 'catch' && success) deltaLoad += 1;
  if (state.performanceStyle === 'control' && response === 'arrange' && success) deltaLoad -= 1;
  if (state.performanceStyle === 'closure' && response === 'cut' && deltaLoad > 0) deltaLoad -= 1;
  if (previousCutSetupActive(state) && deltaLoad > 0) deltaLoad -= 1;
  const loadPenalty = state.backstageLoad >= 4 && tier !== 'masterpiece' ? -1 : 0;
  const waitTrustBonus = response === 'wait' && success ? 1 : 0;
  const styleTrustBonus = state.performanceStyle === 'breath' && response === 'wait' && success ? 1 : 0;
  const cutTrustPenalty = response === 'cut' && success && state.backstageLoad < 3 && !transitionCutGuardActive(state, response) ? -1 : 0;
  const styleSceneBonus = state.performanceStyle === 'heat' && response === 'catch' && success ? 1 : 0;
  const repeatedFrayResponse = frayFit.status === 'strong' && state.lastResponses[state.lastResponses.length - 1] === response;
  const strongFraySceneBonus = frayFit.status === 'strong' && !repeatedFrayResponse && success ? 1 : 0;
  const strongFrayTrustBonus = frayFit.status === 'strong' && !repeatedFrayResponse && success ? 1 : 0;
  const strongFrayFlowBonus = frayFit.status === 'strong' && !repeatedFrayResponse && success ? 1 : 0;
  return {
    deltaScene: base.scene + repeat.deltaScene + styleSceneBonus + strongFraySceneBonus,
    deltaFlow: base.flow + loadPenalty + repeat.deltaFlow + frayFit.deltaFlow + strongFrayFlowBonus,
    deltaTrust: base.trust + waitTrustBonus + styleTrustBonus + cutTrustPenalty + repeat.deltaTrust + strongFrayTrustBonus,
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

function prepPredictionQuality(state: GameState, actor: Actor): PrepPredictionQuality {
  if (!state.currentActorEvent || !state.selectedPrep) {
    throw new Error('Cannot inspect prep before event and prep are selected.');
  }
  if (PREP_MATCHES[state.selectedPrep].includes(state.currentActorEvent.type)) return 'hit';
  const visibleOmens = topOmenEvents(actor, 3, { seed: state.seed, totalTurn: state.totalTurn }).map((omen) => omen.event);
  return visibleOmens.some((event) => PREP_MATCHES[state.selectedPrep as keyof typeof PREP_MATCHES].includes(event)) ? 'partial' : 'miss';
}

function prepScoreItem(quality: PrepPredictionQuality): ScoreBreakdownItem {
  const copy = ruleText.prepScoreCopy(quality);
  return scoreItem(copy.id, copy.label, copy.value, copy.detail);
}

function capForPrepQuality(quality: PrepPredictionQuality, state?: GameState) {
  if (quality === 'hit') return Number.POSITIVE_INFINITY;
  if (quality === 'miss' && state && previousCutSetupActive(state)) return 4;
  if (quality === 'partial') return 6;
  return 3;
}

function arrangeMasterpieceCap(state: GameState, actor: Actor, response: MainResponse, quality: PrepPredictionQuality): ScoreBreakdownItem | undefined {
  if (response !== 'arrange' || quality !== 'hit') return undefined;
  const canReachMasterpiece = actor.type === 'skilled'
    || actor.state === 'anxious'
    || actor.state === 'fatigued'
    || frayFitFor(state, response).status !== 'none';
  const copy = ruleText.arrangeCapCopy();
  return canReachMasterpiece ? undefined : scoreItem('arrange-cap', copy.label, 6, copy.detail);
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
  const trustValue = Math.max(-2, Math.min(2, Math.floor(state.trustScore / 4)));
  const rawLoadValue = state.backstageLoad >= 5 ? -4 : state.backstageLoad >= 4 ? -3 : state.backstageLoad >= 3 ? -1 : 0;
  const loadValue = previousCutSetupActive(state) && rawLoadValue < 0 ? rawLoadValue + 1 : rawLoadValue;
  const repeatedValue = repeatPenalty(state, response);
  const repeat = repeatAdjustment(response, consecutiveUseCount(state, response), true);
  const prepResponseItem = prepResponseScoreItem(state, response, prepQuality);
  const styleItem = performanceStyleScoreItem(state, response);
  const buildLevelItem = performanceBuildLevelScoreItem(state, response);
  const frayItem = frayScoreItem(state, response);
  const cutItem = cutContainmentBonus(state, response);
  const actorTrustItem = actorTrustScoreItem(actor, response);
  const finaleItem = finaleScoreItem(state, response);
  const frayRewardItem = frayRecoveryReward(state, response);
  const eventCopy = ruleText.eventScoreCopy(state.currentActorEvent.type, response, eventValue);
  const items = [
    scoreItem(
      'event',
      eventCopy.label,
      eventValue,
      eventCopy.detail,
    ),
    scoreItem('actor', ruleText.actorResponseLabel(actor, response, actorValue), actorValue),
    scoreItem('state', ruleText.stateResponseLabel(actor, response, stateValue), stateValue),
    prepScoreItem(prepQuality),
    prepResponseItem,
    scoreItem('act', ruleText.actLabel(state, response, actValue), actValue),
    finaleItem,
    styleItem,
    buildLevelItem,
    cutItem,
    actorTrustItem,
    scoreItem('trust', ruleText.ruleCopy.trustScore, trustValue),
    scoreItem('load', ruleText.ruleCopy.loadScore, loadValue),
    scoreItem('repeat', repeat.label ?? ruleText.ruleCopy.repeatedResponse, repeatedValue, repeat.detail),
    frayItem,
    frayRewardItem,
  ].filter((item): item is ScoreBreakdownItem => Boolean(item));
  const rawScore = sumBreakdown(items);
  const prepCap = capForPrepQuality(prepQuality, state);
  const arrangeCap = arrangeMasterpieceCap(state, actor, response, prepQuality)?.value ?? Number.POSITIVE_INFINITY;
  const cap = Math.min(prepCap, arrangeCap);
  if (rawScore > cap) {
    const isArrangeCap = arrangeCap <= prepCap;
    const copy = ruleText.capScoreCopy(isArrangeCap ? 'arrange' : 'prep', prepQuality, previousCutSetupActive(state));
    items.push(scoreItem(
      isArrangeCap ? 'arrange-cap' : 'prep-cap',
      copy.label,
      cap - rawScore,
      copy.detail,
    ));
  }
  return items.filter((item) => item.value !== 0 || ['prep-partial', 'prep-response', 'prep-response-guard', 'fray-miss'].includes(item.id));
}

function sumBreakdown(items: ScoreBreakdownItem[]) {
  return items.reduce((total, item) => total + item.value, 0);
}

function rangeForScore(score: number, quality: PrepPredictionQuality, cap = capForPrepQuality(quality)): { label: string; tone: ResponseInsight['rangeTone']; dangerWarning?: string; highTier: ResultTier; lowTier: ResultTier } {
  const lowScore = score + (quality === 'hit' ? -1 : -2);
  const highScore = score + (quality === 'hit' ? 2 : quality === 'partial' ? 1 : 0);
  const highTier = tierFromScore(Math.min(highScore, cap));
  const lowTier = tierFromScore(lowScore);
  const { label, dangerWarning } = ruleText.rangeCopy(lowTier, highTier);
  const tone: ResponseInsight['rangeTone'] = dangerWarning ? 'danger' : highTier === 'masterpiece' ? 'best' : highTier === 'scene' ? 'good' : lowTier === 'fray' ? 'thin' : 'good';
  return { label, tone, dangerWarning, highTier, lowTier };
}

function guardedRangeForScore(score: number, quality: PrepPredictionQuality, state: GameState, response: MainResponse): { label: string; tone: ResponseInsight['rangeTone']; dangerWarning?: string; highTier: ResultTier; lowTier: ResultTier } {
  const actor = state.actors.find((item) => item.id === state.currentFocusActorId) ?? state.actors[0];
  const prepCap = capForPrepQuality(quality, state);
  const arrangeCap = actor ? arrangeMasterpieceCap(state, actor, response, quality)?.value ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  const range = rangeForScore(score, quality, Math.min(prepCap, arrangeCap));
  const lowTier = guardTierForStrongFrayRecovery(guardTierForActorTrust(guardTierForTransitionCut(range.lowTier, state, response, quality), actor, response), state, response);
  const highTier = guardTierForStrongFrayRecovery(guardTierForActorTrust(guardTierForTransitionCut(range.highTier, state, response, quality), actor, response), state, response);
  const { label, dangerWarning } = ruleText.rangeCopy(lowTier, highTier, range.dangerWarning);
  const tone: ResponseInsight['rangeTone'] = dangerWarning ? 'danger' : highTier === 'masterpiece' ? 'best' : highTier === 'scene' ? 'good' : lowTier === 'fray' ? 'thin' : 'good';
  return { ...range, label, tone, dangerWarning, highTier, lowTier };
}

function effectLabel(target: ResponseEffectTarget, value: number) {
  return ruleText.effectLabel(target, value);
}

function responseEffect(target: ResponseEffectTarget, value: number, repeat = false, label = effectLabel(target, value)): ResponseEffect {
  return { target, value, repeat, label: repeat ? ruleText.repeatEffectLabel(label) : label };
}

function repeatSideEffects(label?: string): ResponseEffect[] {
  if (!label) return [];
  const text = ruleText.stripRepeatPrefix(label);
  return text.split(' / ').filter(Boolean).map((part) => {
    const target = ruleText.sideEffectTargetFromLabel(part);
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
  return ruleText.cueKeyPoint(preview);
}

function cueCost(preview: Pick<ResultPreview, 'deltaLoad' | 'deltaFlow' | 'deltaTrust' | 'resultTier' | 'mainResponse'>) {
  return ruleText.cueCost(preview);
}

function cueHandoff(state: GameState, preview: Pick<ResultPreview, 'resultMode' | 'deltaLoad' | 'mainResponse' | 'performanceStyle'>) {
  return ruleText.cueHandoff(state, preview);
}

function tacticalSummary(state: GameState, response: MainResponse, insight: Pick<ResponseInsight, 'resultTier' | 'deltaLoad' | 'prepRelationTone' | 'frayRelationTone'>) {
  return ruleText.tacticalSummaryCopy({
    frayRelationTone: insight.frayRelationTone,
    transitionCutActive: transitionCutGuardActive(state, response),
    response,
    backstageLoad: state.backstageLoad,
    resultTier: insight.resultTier,
    trustScore: state.trustScore,
    act: state.act,
    deltaLoad: insight.deltaLoad,
    prepRelationTone: insight.prepRelationTone,
  });
}

function audienceReaction(preview: Pick<ResultPreview, 'resultTier' | 'actorEventType' | 'mainResponse' | 'deltaScene'>) {
  return ruleText.audienceReaction(preview);
}

function cueLesson(preview: Pick<ResultPreview, 'prepQuality' | 'deltaLoad' | 'deltaFlow' | 'deltaTrust' | 'mainResponse' | 'scoreBreakdown' | 'resultTier'>) {
  return ruleText.cueLesson(preview);
}

function cueResultSummary(state: GameState, preview: ResultPreview): CueResultSummary {
  return {
    keyPoint: cueKeyPoint(preview),
    cost: cueCost(preview),
    handoff: cueHandoff(state, preview),
    audienceReaction: audienceReaction(preview),
    lesson: cueLesson(preview),
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
  const resultTier = guardTierForStrongFrayRecovery(
    guardTierForActorTrust(
      guardTierForFrayRecovery(guardTierForTransitionCut(rawResultTier, state, response, prepQuality), state, response),
      actor,
      response,
    ),
    state,
    response,
  );
  const deltas = deltasFor(resultTier, response, state, prepQuality);
  const deltaLoad = deltas.deltaLoad;
  const eventValue = EVENT_COMPATIBILITY[state.currentActorEvent.type][response];
  const actorValue = actorResponseBonus(actor, response) + stateResponseBonus(actor, response);
  const range = guardedRangeForScore(score, prepQuality, state, response);
  const relation = prepResponseRelation(state, response);
  const frayRelation = frayRelationLabel(state, response);
  const insightBase = {
    response,
    score,
    resultTier,
    deltaLoad,
    tacticalSummary: '',
    successRangeLabel: range.label,
    upsideLabel: ruleText.upsideLabel(response, range.highTier),
    downsideLabel: ruleText.downsideLabel(response, range.lowTier, deltaLoad),
    prepRelationLabel: relation.label,
    prepRelationTone: relation.tone,
    responseAimLabel: relation.aim,
    eventAffinityLabel: `${EVENT_LABELS[state.currentActorEvent.type]}${symbolFor(eventValue)}`,
    actorAffinityLabel: `${ACTOR_LABELS[actor.type]}${symbolFor(actorValue)} / ${STATE_LABELS[actor.state]}${symbolFor(stateResponseBonus(actor, response))}`,
    actInfluenceLabel: (ACT_RESPONSE_GUIDES as Record<number, Partial<Record<MainResponse, string>>>)[state.act]?.[response] ?? ruleText.ruleCopy.actFallback(state.theme),
    sideEffects: sideEffects(deltas),
    ...frayRelation,
    ...actorTrustLabel(actor, response),
    dangerWarning: range.dangerWarning,
    rangeTone: range.tone,
    scoreBreakdown,
  };
  return {
    ...insightBase,
    tacticalSummary: tacticalSummary(state, response, insightBase),
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
      lesson: '',
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

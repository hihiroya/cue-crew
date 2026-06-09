import {
  EVENT_COMPATIBILITY,
  PERFORMANCE_STYLE_DETAILS,
  PREP_MATCHES,
  PREP_PRIMARY_RESPONSE,
  PREP_RESPONSE_HINTS,
  RESPONSE_DESCRIPTIONS,
} from './constants';
import * as ruleText from '../content/ja/ruleCopy';
import { scoreRuleExtraCopy } from '../content/ja/rogueliteCopy';
import { topOmenEvents } from './actorLogic';
import { frayFitFor } from './fray';
import { tierFromScore } from './scoreEngine';
import { slotForTurnInAct } from './turnCalendar';
import type { Actor, CueResultSummary, GameState, MainResponse, PrepPredictionQuality, ResponseEffect, ResponseEffectTarget, ResponseInsight, ResultPreview, ResultTier, ScoreBreakdownItem } from './types';

export function actorResponseBonus(actor: Actor, response: MainResponse): number {
  if (actor.type === 'lead' && ['wait', 'catch', 'arrange'].includes(response)) return 1;
  if (actor.type === 'junior' && ['catch', 'arrange'].includes(response)) return 1;
  if (actor.type === 'skilled' && ['wait', 'arrange'].includes(response)) return 1;
  if (actor.type === 'junior' && response === 'wait' && actor.state === 'elated') return -1;
  return 0;
}

export function stateResponseBonus(actor: Actor, response: MainResponse): number {
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
  let value = 1;
  if (state.performanceStyle === 'control' && (state.backstageLoad >= 1 || eventIsOneOf(state, ['positionShift', 'tempoRush', 'ensembleWaver']))) value = 2;
  if (state.performanceStyle === 'closure' && (state.backstageLoad >= 3 || state.pendingFrayEvent)) value = 2;
  if (state.performanceStyle === 'breath' && (state.trustScore >= 2 || state.act >= 3)) value = 2;
  if (state.performanceStyle === 'heat' && state.backstageLoad <= 1 && !eventIsOneOf(state, ['stepForward', 'adlib', 'heatUp'])) value = 0;
  if (value === 0) return undefined;
  return scoreItem('performance-style', ruleText.performanceStyleScoreLabel(style.label, response), value, style.short);
}

function performanceBuildLevelScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  if (!state.performanceStyle) return undefined;
  const style = PERFORMANCE_STYLE_DETAILS[state.performanceStyle];
  if (response !== style.strength) return undefined;
  const progress = state.logs.reduce((total, log) => {
    let value = log.mainResponse === style.strength ? 2 : 0;
    if (log.resultTier === 'masterpiece') value += 2;
    if (log.resultTier === 'scene') value += 1;
    if (log.mainResponse !== style.strength) return total + Math.min(value, 1);
    if (state.performanceStyle === 'heat') value += Math.max(0, log.deltaScene);
    if (state.performanceStyle === 'breath') value += Math.max(0, log.deltaTrust);
    if (state.performanceStyle === 'control') value += Math.max(0, log.deltaFlow) + Math.max(0, -log.deltaLoad);
    if (state.performanceStyle === 'closure') value += log.deltaLoad <= 0 ? 1 : 0;
    return total + value;
  }, 0);
  if (progress >= 9) return scoreItem('build-level', scoreRuleExtraCopy.buildLevelScoreLabel(style.label, 'strong'), 2, scoreRuleExtraCopy.buildLevel3);
  if (progress >= 5) return scoreItem('build-level', scoreRuleExtraCopy.buildLevelScoreLabel(style.label, 'growing'), 1, scoreRuleExtraCopy.buildLevel2);
  return undefined;
}

function previousCutSetupActive(state: GameState): boolean {
  return state.lastResponses[state.lastResponses.length - 1] === 'cut';
}

export function repeatPenalty(state: GameState, response: MainResponse): number {
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

export function frayRelationLabel(state: GameState, response: MainResponse): Pick<ResponseInsight, 'frayRelationLabel' | 'frayRelationTone'> {
  const fit = frayFitFor(state, response);
  if (fit.status === 'none') return {};
  if (fit.status === 'miss') return { frayRelationLabel: ruleText.ruleCopy.frayMiss, frayRelationTone: 'miss' };
  return { frayRelationLabel: fit.status === 'strong' ? ruleText.ruleCopy.frayRelationStrong : ruleText.ruleCopy.frayRelationMatch, frayRelationTone: 'recover' };
}

export function actorTrustLabel(actor: Actor, response: MainResponse): Pick<ResponseInsight, 'actorTrustLabel'> {
  const item = actorTrustScoreItem(actor, response);
  return item ? { actorTrustLabel: item.detail ?? item.label } : {};
}

type PrepResponseRelation = {
  label: string;
  tone: ResponseInsight['prepRelationTone'];
  aim: string;
};

export function prepResponseRelation(state: GameState, response: MainResponse): PrepResponseRelation {
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

function prepPivotPenaltyScoreItem(state: GameState, response: MainResponse, prepQuality: PrepPredictionQuality): ScoreBreakdownItem | undefined {
  if (!state.selectedPrep || prepQuality === 'hit') return undefined;
  if (response === PREP_PRIMARY_RESPONSE[state.selectedPrep]) return undefined;
  const copy = ruleText.prepPivotPenaltyCopy(prepQuality);
  return scoreItem('prep-pivot', copy.label, copy.value, copy.detail);
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
  return scoreItem('fray-reward', copy.label, 2, copy.detail);
}

export function guardTierForTransitionCut(tier: ResultTier, state: GameState, response: MainResponse, prepQuality: PrepPredictionQuality): ResultTier {
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

export function guardTierForActorTrust(tier: ResultTier, actor: Actor, response: MainResponse): ResultTier {
  if (!actorTrustScoreItem(actor, response) || tier !== 'accident') return tier;
  return 'fray';
}

export function guardTierForStrongFrayRecovery(tier: ResultTier, state: GameState, response: MainResponse): ResultTier {
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
      deltaTrust: -1,
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
    deltaTrust: -1,
    label: copy.label,
    detail: copy.detail,
    cardLabel: copy.cardLabel,
  };
}

function eventIsOneOf(state: GameState, events: Array<NonNullable<GameState['currentActorEvent']>['type']>): boolean {
  return Boolean(state.currentActorEvent && events.includes(state.currentActorEvent.type));
}

export function deltasFor(tier: ResultTier, response: MainResponse, state: GameState, prepQuality: PrepPredictionQuality) {
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
  if (response === 'wait') deltaLoad = success && eventIsOneOf(state, ['silence', 'delayedExit', 'adlib']) ? -1 : success ? 0 : 1;
  if (response === 'wait' && success && !eventIsOneOf(state, ['silence', 'delayedExit', 'adlib'])) deltaLoad += 1;
  if (response === 'cut') deltaLoad = 0;
  if (state.act === 2 && response === 'catch') deltaLoad += 1;
  if (state.act === 3 && success && ['arrange', 'cut'].includes(response)) deltaLoad -= 1;
  if (prepQuality === 'miss' && response === 'catch') deltaLoad += 1;
  if (state.selectedPrep && prepQuality === 'miss' && response !== PREP_PRIMARY_RESPONSE[state.selectedPrep]) deltaLoad += 1;
  if (prepQuality === 'hit' && deltaLoad > 0) deltaLoad -= 1;
  if (transitionCutGuardActive(state, response) && deltaLoad > 0) deltaLoad -= 1;
  const slot = slotForTurnInAct(state.turnInAct);
  if (slot === 'matinee' && success && ['arrange', 'wait'].includes(response)) deltaLoad -= 1;
  if (slot === 'soiree' && response === 'catch' && success) deltaLoad += 1;
  if (state.performanceStyle === 'heat' && response === 'catch' && success) deltaLoad += 1;
  if (state.performanceStyle === 'control' && response === 'arrange' && success) deltaLoad -= 1;
  if (state.performanceStyle === 'closure' && response === 'cut' && deltaLoad > 0) deltaLoad -= 1;
  if (response === 'cut' && success && state.backstageLoad >= 3) deltaLoad -= transitionCutGuardActive(state, response) ? 2 : 1;
  if (previousCutSetupActive(state) && deltaLoad > 0) deltaLoad -= 1;
  const loadPenalty = state.backstageLoad >= 4 && tier !== 'masterpiece' ? -1 : 0;
  const catchFlowPenalty = response === 'catch' && success && (state.backstageLoad >= 4 || eventIsOneOf(state, ['ensembleWaver'])) ? -1 : 0;
  const catchUnityPenalty = response === 'catch' && success && eventIsOneOf(state, ['ensembleWaver']) ? -1 : 0;
  const arrangeFlowBonus = response === 'arrange' && success && eventIsOneOf(state, ['positionShift', 'tempoRush', 'ensembleWaver']) ? 1 : 0;
  const arrangeUnityPenalty = response === 'arrange' && success && state.backstageLoad <= 2 && eventIsOneOf(state, ['stepForward', 'adlib', 'heatUp']) ? -1 : 0;
  const waitTrustBonus = response === 'wait' && success && eventIsOneOf(state, ['silence', 'delayedExit', 'adlib']) ? 1 : 0;
  const waitFlowPenalty = response === 'wait' && eventIsOneOf(state, ['positionShift', 'tempoRush', 'ensembleWaver']) ? -1 : 0;
  const styleTrustBonus = state.performanceStyle === 'breath' && response === 'wait' && success ? 1 : 0;
  const breathFinaleTrustBonus = state.performanceStyle === 'breath' && response === 'wait' && success && state.act >= 3 && state.trustScore >= 2 ? 1 : 0;
  const cutTrustPenalty = response === 'cut' && success && state.backstageLoad < 3 && eventIsOneOf(state, ['stepForward', 'adlib', 'heatUp', 'silence']) && !transitionCutGuardActive(state, response) ? -1 : 0;
  const cutFlowBonus = response === 'cut' && success && (state.backstageLoad >= 3 || transitionCutGuardActive(state, response)) ? 1 : 0;
  const cutFlowPenalty = response === 'cut' && success && state.backstageLoad <= 1 && eventIsOneOf(state, ['stepForward', 'adlib', 'heatUp', 'silence']) && !transitionCutGuardActive(state, response) ? -1 : 0;
  const cutScenePenalty = response === 'cut' && success && state.backstageLoad <= 1 && eventIsOneOf(state, ['stepForward', 'adlib', 'heatUp', 'silence']) && !transitionCutGuardActive(state, response) ? -1 : 0;
  const styleSceneBonus = state.performanceStyle === 'heat' && response === 'catch' && success ? 1 : 0;
  const controlSceneBonus = state.performanceStyle === 'control' && response === 'arrange' && success && (eventIsOneOf(state, ['positionShift', 'tempoRush', 'ensembleWaver']) || state.backstageLoad >= 1) ? 1 : 0;
  const controlFlowBonus = state.performanceStyle === 'control' && response === 'arrange' && success ? 1 : 0;
  const closureSceneBonus = state.performanceStyle === 'closure' && response === 'cut' && success && (state.backstageLoad >= 3 || frayFit.status === 'strong') ? 1 : 0;
  const catchHeatSceneBonus = response === 'catch' && success && eventIsOneOf(state, ['stepForward', 'adlib', 'heatUp']) ? 1 : 0;
  const catchPeakSceneBonus = response === 'catch' && tier === 'masterpiece' && prepQuality === 'hit' ? 1 : 0;
  const repeatedFrayResponse = frayFit.status === 'strong' && state.lastResponses[state.lastResponses.length - 1] === response;
  const strongFraySceneBonus = frayFit.status === 'strong' && !repeatedFrayResponse && success ? 2 : 0;
  const strongFrayTrustBonus = frayFit.status === 'strong' && !repeatedFrayResponse && success ? 1 : 0;
  const strongFrayFlowBonus = frayFit.status === 'strong' && !repeatedFrayResponse && success ? 1 : 0;
  return {
    deltaScene: base.scene + repeat.deltaScene + styleSceneBonus + controlSceneBonus + closureSceneBonus + catchHeatSceneBonus + catchPeakSceneBonus + strongFraySceneBonus + cutScenePenalty,
    deltaFlow: base.flow + loadPenalty + repeat.deltaFlow + frayFit.deltaFlow + strongFrayFlowBonus + catchFlowPenalty + arrangeFlowBonus + controlFlowBonus + waitFlowPenalty + cutFlowBonus + cutFlowPenalty,
    deltaTrust: base.trust + waitTrustBonus + styleTrustBonus + breathFinaleTrustBonus + cutTrustPenalty + repeat.deltaTrust + strongFrayTrustBonus + catchUnityPenalty + arrangeUnityPenalty,
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

export function scoreItem(id: string, label: string, value: number, detail?: string): ScoreBreakdownItem {
  return { id, label, value, tone: toneFor(value), detail };
}

export function symbolFor(value: number) {
  if (value >= 3) return '◎';
  if (value > 0) return '○';
  if (value < 0) return '×';
  return '△';
}

export function prepPredictionQuality(state: GameState, actor: Actor): PrepPredictionQuality {
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

function capForPrepQuality(quality: PrepPredictionQuality, state?: GameState, response?: MainResponse) {
  const selectedResponse = response ?? state?.selectedResponse;
  if (quality === 'hit') return Number.POSITIVE_INFINITY;
  if (quality === 'miss' && state?.selectedPrep && selectedResponse && selectedResponse !== PREP_PRIMARY_RESPONSE[state.selectedPrep] && !previousCutSetupActive(state)) return 1;
  if (quality === 'miss' && state && previousCutSetupActive(state)) return 4;
  if (quality === 'partial' && state?.selectedPrep && selectedResponse && selectedResponse !== PREP_PRIMARY_RESPONSE[state.selectedPrep]) return 1;
  if (quality === 'partial') return 6;
  return 3;
}

function diffuseRhythmPenaltyScoreItem(state: GameState, response: MainResponse): ScoreBreakdownItem | undefined {
  const previous = state.lastResponses.slice(-3);
  if (previous.length < 3) return undefined;
  if (previous.includes(response)) return undefined;
  if (new Set(previous).size < 3) return undefined;
  const copy = ruleText.diffuseRhythmPenaltyCopy();
  return scoreItem('diffuse-rhythm', copy.label, copy.value, copy.detail);
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

export function buildScoreBreakdown(state: GameState, actor: Actor, response: MainResponse): ScoreBreakdownItem[] {
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
  const prepPivotItem = prepPivotPenaltyScoreItem(state, response, prepQuality);
  const styleItem = performanceStyleScoreItem(state, response);
  const buildLevelItem = performanceBuildLevelScoreItem(state, response);
  const frayItem = frayScoreItem(state, response);
  const cutItem = cutContainmentBonus(state, response);
  const actorTrustItem = actorTrustScoreItem(actor, response);
  const finaleItem = finaleScoreItem(state, response);
  const frayRewardItem = frayRecoveryReward(state, response);
  const diffuseRhythmItem = diffuseRhythmPenaltyScoreItem(state, response);
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
    prepPivotItem,
    scoreItem('act', ruleText.actLabel(state, response, actValue), actValue),
    finaleItem,
    styleItem,
    buildLevelItem,
    cutItem,
    actorTrustItem,
    scoreItem('trust', ruleText.ruleCopy.trustScore, trustValue),
    scoreItem('load', ruleText.ruleCopy.loadScore, loadValue),
    scoreItem('repeat', repeat.label ?? ruleText.ruleCopy.repeatedResponse, repeatedValue, repeat.detail),
    diffuseRhythmItem,
    frayItem,
    frayRewardItem,
  ].filter((item): item is ScoreBreakdownItem => Boolean(item));
  const rawScore = sumBreakdown(items);
  const prepCap = capForPrepQuality(prepQuality, state, response);
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

export function sumBreakdown(items: ScoreBreakdownItem[]) {
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

export function guardedRangeForScore(score: number, quality: PrepPredictionQuality, state: GameState, response: MainResponse): { label: string; tone: ResponseInsight['rangeTone']; dangerWarning?: string; highTier: ResultTier; lowTier: ResultTier } {
  const actor = state.actors.find((item) => item.id === state.currentFocusActorId) ?? state.actors[0];
  const prepCap = capForPrepQuality(quality, state, response);
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

export function sideEffects(deltas: ReturnType<typeof deltasFor>): ResponseEffect[] {
  const effects = [
    deltas.deltaScene < 0 || deltas.deltaScene > 3 ? responseEffect('scene', deltas.deltaScene) : undefined,
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

export function tacticalSummary(state: GameState, response: MainResponse, insight: Pick<ResponseInsight, 'resultTier' | 'deltaLoad' | 'prepRelationTone' | 'frayRelationTone'>) {
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

export function cueResultSummary(state: GameState, preview: ResultPreview): CueResultSummary {
  return {
    keyPoint: cueKeyPoint(preview),
    cost: cueCost(preview),
    handoff: cueHandoff(state, preview),
    audienceReaction: audienceReaction(preview),
    lesson: cueLesson(preview),
  };
}

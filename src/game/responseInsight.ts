import {
  ACTOR_LABELS,
  ACT_RESPONSE_GUIDES,
  EVENT_COMPATIBILITY,
  EVENT_LABELS,
  STATE_LABELS,
} from './constants';
import * as ruleText from '../content/ja/ruleCopy';
import { responseCueSurgeInsight } from './cueSurge';
import { guardTierForFrayRecovery } from './fray';
import { tierFromScore } from './scoreEngine';
import {
  actorTrustLabel,
  actorResponseBonus,
  buildScoreBreakdown,
  deltasFor,
  frayRelationLabel,
  guardedRangeForScore,
  guardTierForActorTrust,
  guardTierForStrongFrayRecovery,
  guardTierForTransitionCut,
  prepPredictionQuality,
  prepResponseRelation,
  sideEffects,
  sumBreakdown,
  symbolFor,
  stateResponseBonus,
  tacticalSummary,
} from './scoreRuleCore';
import type { GameState, MainResponse, ResponseInsight } from './types';
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
  const cueSurge = responseCueSurgeInsight({
    state,
    actor,
    response,
    prepQuality,
    resultTier,
    deltaLoad,
    scoreBreakdown,
  });
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
    cueSurge,
    rangeTone: range.tone,
    scoreBreakdown,
  };
  return {
    ...insightBase,
    tacticalSummary: tacticalSummary(state, response, insightBase),
  };
}

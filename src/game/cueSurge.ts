import {
  EVENT_COMPATIBILITY,
  PERFORMANCE_STYLE_DETAILS,
  PREP_MATCHES,
  PREP_PRIMARY_RESPONSE,
} from './constants';
import { topOmenEvents } from './actorLogic';
import { cueSurgeCopy } from '../content/ja/cueSurgeCopy';
import { frayFitFor } from './fray';
import { slotForTurnInAct } from './turnCalendar';
import type {
  Actor,
  ActorEventType,
  CommittedCueSurge,
  CueSurgeLevel,
  GameState,
  MainResponse,
  PrepAction,
  PrepCueSurgeInsight,
  PrepPredictionQuality,
  ResponseCueSurgeInsight,
  ResultTier,
  ScoreBreakdownItem,
  SurgeCostLevel,
} from './types';

const levelRank: Record<CueSurgeLevel, number> = {
  none: 0,
  hint: 1,
  stacked: 2,
  surge: 3,
  peak: 4,
};

const costRank: Record<SurgeCostLevel, number> = {
  none: 0,
  light: 1,
  heavy: 2,
  danger: 3,
};

export function cueSurgeLevelRank(level: CueSurgeLevel) {
  return levelRank[level];
}

export function prepCueSurgeInsight(args: {
  state: Pick<GameState, 'backstageLoad' | 'pendingFrayEvent' | 'performanceStyle' | 'act' | 'trustScore'>;
  actor: Actor;
  prep: PrepAction;
  visibleOmens: ActorEventType[];
}): PrepCueSurgeInsight {
  const { state, actor, prep, visibleOmens } = args;
  const coveredOmens = visibleOmens.filter((event) => PREP_MATCHES[prep].includes(event));
  const primaryResponse = PREP_PRIMARY_RESPONSE[prep];
  const topOmenCovered = Boolean(visibleOmens[0] && PREP_MATCHES[prep].includes(visibleOmens[0]));
  const reasons: string[] = [];
  let points = coveredOmens.length;

  if (coveredOmens.length > 0) reasons.push(cueSurgeCopy.prepReasonCovered(coveredOmens.length));
  if (topOmenCovered) {
    points += 1;
    reasons.push(cueSurgeCopy.prepReasonTopOmen(visibleOmens[0]));
  }
  if (responseFitsActor(actor, primaryResponse)) {
    points += 1;
    reasons.push(cueSurgeCopy.prepReasonActorFit(actor));
  }
  if (stateFitsResponse(actor, primaryResponse)) {
    points += 1;
    reasons.push(cueSurgeCopy.prepReasonStateFit(actor));
  }
  if (contextFitsPrep(state, prep)) {
    points += 1;
    reasons.push(cueSurgeCopy.prepContextReason(prep, state.act >= 3, Boolean(state.pendingFrayEvent)));
  }

  const level = prepLevelFor(points, coveredOmens.length, topOmenCovered);
  return {
    level,
    label: prepSurgeLabel(level),
    detail: prepSurgeDetail(level, primaryResponse),
    coveredCount: coveredOmens.length,
    topOmenCovered,
    reasons: reasons.slice(0, 3),
  };
}

export function responseCueSurgeInsight(args: {
  state: GameState;
  actor: Actor;
  response: MainResponse;
  prepQuality: PrepPredictionQuality;
  resultTier: ResultTier;
  deltaLoad: number;
  scoreBreakdown: ScoreBreakdownItem[];
}): ResponseCueSurgeInsight {
  const { state, actor, response, prepQuality, resultTier, deltaLoad, scoreBreakdown } = args;
  const visibleOmens = topOmenEvents(actor, 3, { seed: state.seed, totalTurn: state.totalTurn }).map((omen) => omen.event);
  const prepInsight = state.selectedPrep
    ? prepCueSurgeInsight({ state, actor, prep: state.selectedPrep, visibleOmens })
    : emptyPrepCueSurge();
  const event = state.currentActorEvent?.type;
  const eventValue = event ? EVENT_COMPATIBILITY[event][response] : 0;
  const relationTone = relationToneFor(state.selectedPrep, response, event);
  const frayFit = frayFitFor(state, response);
  const reasons: string[] = [];
  const risks: string[] = [];
  let points = 0;

  if (prepQuality === 'hit') {
    points += 2;
    reasons.push(cueSurgeCopy.responseReasonPrepHit);
  } else if (prepQuality === 'partial') {
    points += 1;
    reasons.push(cueSurgeCopy.responseReasonPrepPartial);
  }
  if (levelRank[prepInsight.level] >= 3) {
    points += levelRank[prepInsight.level] - 1;
    reasons.push(cueSurgeCopy.responseReasonPrepStacked);
  }
  if (eventValue >= 3) {
    points += 2;
    reasons.push(cueSurgeCopy.responseReasonEventStrong(event as ActorEventType, response));
  } else if (eventValue >= 2) {
    points += 1;
    reasons.push(cueSurgeCopy.responseReasonEventFit);
  } else if (eventValue < 0) {
    points -= 2;
    risks.push(cueSurgeCopy.responseRiskEventMiss);
  }
  if (responseFitsActor(actor, response)) {
    points += 1;
    reasons.push(cueSurgeCopy.responseReasonActorFit(actor));
  }
  if (stateFitsResponse(actor, response)) {
    points += 1;
    reasons.push(cueSurgeCopy.responseReasonStateFit(actor));
  }
  if (actor.trust >= 3 && responseFitsActor(actor, response)) {
    points += 1;
    reasons.push(cueSurgeCopy.responseReasonTrust);
  }
  if (state.performanceStyle && response === PERFORMANCE_STYLE_DETAILS[state.performanceStyle].strength) {
    points += 1;
    reasons.push(cueSurgeCopy.responseReasonStyle(state.performanceStyle));
  }
  if (frayFit.status === 'strong') {
    points += 2;
    reasons.push(cueSurgeCopy.responseReasonStrongFray);
  } else if (frayFit.status === 'match') {
    points += 1;
    reasons.push(cueSurgeCopy.responseReasonFray);
  }
  if (relationTone === 'poor') {
    points -= 1;
    risks.push(cueSurgeCopy.responseRiskPrepPivot);
  } else if (relationTone === 'primary') {
    points += 1;
  }

  const responseLevel = responseLevelFor(points);
  const scoreBonus = responseLevel === 'peak' ? 1 : 0;
  const costLevel = surgeCostLevel({ state, response, event, deltaLoad, resultTier });
  const costLabel = surgeCostLabel(costLevel);
  const label = responseSurgeLabel(responseLevel);
  if (deltaLoad >= 2) risks.push(cueSurgeCopy.responseRiskLoad);
  if (costLevel === 'danger') risks.push(cueSurgeCopy.responseRiskDanger);

  const tierValue = { accident: 0, fray: 1, smallSuccess: 2, scene: 3, masterpiece: 4 }[resultTier];
  const decisiveScore = levelRank[responseLevel] * 12
    + levelRank[prepInsight.level] * 4
    + tierValue * 3
    + Math.max(0, scoreValue(scoreBreakdown, 'cue-surge')) * 4
    + Math.max(0, scoreValue(scoreBreakdown, 'fray-reward')) * 2
    + Math.max(0, scoreValue(scoreBreakdown, 'build-level')) * 2
    - costRank[costLevel];

  return {
    prepLevel: prepInsight.level,
    responseLevel,
    costLevel,
    label,
    costLabel,
    detail: responseSurgeDetail(responseLevel, response, costLevel),
    reasons: reasons.slice(0, 4),
    risks: [...new Set(risks)].slice(0, 3),
    scoreBonus,
    decisiveScore,
    isDecisiveCandidate: levelRank[responseLevel] >= 3 && ['masterpiece', 'scene'].includes(resultTier),
  };
}

export function cueSurgeScoreBonus(args: {
  state: GameState;
  actor: Actor;
  response: MainResponse;
  prepQuality: PrepPredictionQuality;
}): number {
  const { state, actor, response, prepQuality } = args;
  const event = state.currentActorEvent?.type;
  if (!event) return 0;
  const visibleOmens = topOmenEvents(actor, 3, { seed: state.seed, totalTurn: state.totalTurn }).map((omen) => omen.event);
  const prepLevel = state.selectedPrep
    ? prepCueSurgeInsight({ state, actor, prep: state.selectedPrep, visibleOmens }).level
    : 'none';
  let points = 0;
  if (prepQuality === 'hit') points += 2;
  if (levelRank[prepLevel] >= 3) points += levelRank[prepLevel] - 1;
  if (EVENT_COMPATIBILITY[event][response] >= 3) points += 2;
  if (responseFitsActor(actor, response)) points += 1;
  if (stateFitsResponse(actor, response)) points += 1;
  if (actor.trust >= 3 && responseFitsActor(actor, response)) points += 1;
  if (state.performanceStyle && response === PERFORMANCE_STYLE_DETAILS[state.performanceStyle].strength) points += 1;
  if (frayFitFor(state, response).status === 'strong') points += 2;
  return responseLevelFor(points) === 'peak' ? 1 : 0;
}

export function committedCueSurge(insight: ResponseCueSurgeInsight): CommittedCueSurge | undefined {
  if (levelRank[insight.responseLevel] < 2 && levelRank[insight.prepLevel] < 2) return undefined;
  return {
    prepLevel: insight.prepLevel,
    responseLevel: insight.responseLevel,
    costLevel: insight.costLevel,
    label: insight.label,
    costLabel: insight.costLabel,
    detail: insight.detail,
    reasons: insight.reasons,
    risks: insight.risks,
    decisiveScore: insight.decisiveScore,
  };
}

function prepLevelFor(points: number, coveredCount: number, topOmenCovered: boolean): CueSurgeLevel {
  if (points >= 5 && coveredCount >= 2 && topOmenCovered) return 'peak';
  if (points >= 4 && coveredCount >= 2) return 'surge';
  if (points >= 2 && coveredCount >= 1) return 'stacked';
  if (points >= 1) return 'hint';
  return 'none';
}

function responseLevelFor(points: number): CueSurgeLevel {
  if (points >= 8) return 'peak';
  if (points >= 6) return 'surge';
  if (points >= 4) return 'stacked';
  if (points >= 2) return 'hint';
  return 'none';
}

function surgeCostLevel(args: {
  state: GameState;
  response: MainResponse;
  event?: ActorEventType;
  deltaLoad: number;
  resultTier: ResultTier;
}): SurgeCostLevel {
  const { state, response, event, deltaLoad, resultTier } = args;
  let points = 0;
  if (deltaLoad >= 2) points += 2;
  else if (deltaLoad >= 1) points += 1;
  if (state.backstageLoad >= 5) points += 3;
  else if (state.backstageLoad >= 4) points += 2;
  else if (state.backstageLoad >= 3) points += 1;
  if (response === 'catch' && state.backstageLoad >= 3) points += 1;
  if (response === 'wait' && event && EVENT_COMPATIBILITY[event][response] < 0) points += 2;
  if (resultTier === 'fray') points += 1;
  if (resultTier === 'accident') points += 2;
  if (slotForTurnInAct(state.turnInAct) === 'soiree' && state.act === 3) points -= 1;
  if (response === 'arrange' && deltaLoad <= 0) points -= 1;
  if (response === 'cut' && state.backstageLoad >= 3) points -= 1;
  if (points >= 4) return 'danger';
  if (points >= 2) return 'heavy';
  if (points >= 1) return 'light';
  return 'none';
}

function relationToneFor(prep: PrepAction | null, response: MainResponse, event?: ActorEventType) {
  if (!prep) return 'poor';
  if (response === PREP_PRIMARY_RESPONSE[prep]) return 'primary';
  if (event && EVENT_COMPATIBILITY[event][response] > 0) return 'alternate';
  return 'poor';
}

function responseFitsActor(actor: Actor, response: MainResponse) {
  if (actor.type === 'lead') return response === 'wait' || response === 'catch' || response === 'arrange';
  if (actor.type === 'junior') return response === 'catch' || response === 'arrange';
  return response === 'arrange' || response === 'wait';
}

function stateFitsResponse(actor: Actor, response: MainResponse) {
  if (actor.state === 'elated') return response === 'catch';
  if (actor.state === 'contemplative') return response === 'wait';
  if (actor.state === 'anxious') return response === 'arrange';
  if (actor.state === 'immersed') return response === 'wait' || response === 'catch';
  return response === 'arrange' || response === 'cut';
}

function contextFitsPrep(state: Pick<GameState, 'backstageLoad' | 'pendingFrayEvent' | 'performanceStyle' | 'act' | 'trustScore'>, prep: PrepAction) {
  if (prep === 'watch') return state.backstageLoad <= 1 || state.performanceStyle === 'heat';
  if (prep === 'makeSpace') return state.trustScore >= 2 || state.act >= 3 || state.performanceStyle === 'breath';
  if (prep === 'tightenFlow') return state.backstageLoad >= 2 || state.performanceStyle === 'control';
  return state.backstageLoad >= 3 || Boolean(state.pendingFrayEvent) || state.performanceStyle === 'closure';
}

function prepSurgeLabel(level: CueSurgeLevel) {
  return cueSurgeCopy.prepLabel(level);
}

function prepSurgeDetail(level: CueSurgeLevel, response: MainResponse) {
  return cueSurgeCopy.prepDetail(level, response);
}

function responseSurgeLabel(level: CueSurgeLevel) {
  return cueSurgeCopy.responseLabel(level);
}

function responseSurgeDetail(level: CueSurgeLevel, response: MainResponse, cost: SurgeCostLevel) {
  return cueSurgeCopy.responseDetail(level, response, surgeCostLabel(cost));
}

function surgeCostLabel(cost: SurgeCostLevel) {
  return cueSurgeCopy.costLabel(cost);
}

function emptyPrepCueSurge(): PrepCueSurgeInsight {
  return {
    level: 'none',
    label: prepSurgeLabel('none'),
    detail: prepSurgeDetail('none', 'catch'),
    coveredCount: 0,
    topOmenCovered: false,
    reasons: [],
  };
}

function scoreValue(items: ScoreBreakdownItem[], id: string) {
  return items.find((item) => item.id === id)?.value ?? 0;
}

import { ACTOR_WEIGHTS, EVENT_COMPATIBILITY, EVENT_DESCRIPTIONS, EVENT_LABELS, STATE_WEIGHTS } from './constants';
import { OMEN_INTENSITY_LABELS } from '../content/ja/gameLabels';
import { applyDailyEventWeights, dailyVolatilityBonus } from './dailyRun';
import { createRng, pickWeighted } from './rng';
import type { Actor, ActorEvent, ActorEventType, ActorState, ActorType, GameState, MainResponse, TurnLog } from './types';

const focusOrder: ActorType[] = ['junior', 'lead', 'skilled', 'junior', 'lead', 'skilled', 'junior', 'skilled', 'lead', 'junior'];
const openingFocusWeights: Record<ActorType, number> = {
  junior: 4,
  lead: 3,
  skilled: 3,
};
type EventWeightContext = { seed: string; totalTurn: number };
type StateWeights = Record<ActorState, number>;

function pickOpeningFocusActor(seed: string): ActorType {
  return pickWeighted(createRng(`${seed}:focus:opening`), openingFocusWeights);
}

export function pickFocusActor(seed: string, totalTurn: number): ActorType {
  if (totalTurn === 1) return pickOpeningFocusActor(seed);
  if (totalTurn === 2) {
    const firstFocus = pickOpeningFocusActor(seed);
    const rng = createRng(`${seed}:focus:${totalTurn}`);
    const alternatives = focusOrder.filter((actor) => actor !== firstFocus);
    return alternatives[Math.floor(rng() * alternatives.length)];
  }
  const rng = createRng(`${seed}:focus:${totalTurn}`);
  const preferred = focusOrder[(totalTurn - 1) % focusOrder.length];
  if (rng() < 0.72) return preferred;
  return focusOrder[Math.floor(rng() * focusOrder.length)];
}

export function assignActorRoles(actors: Actor[], focus: ActorType): Actor[] {
  return actors.map((actor) => {
    if (actor.id === focus) return { ...actor, currentRole: 'focus' };
    const role = actor.id === 'junior' || actor.state === 'anxious' ? 'sign' : 'waiting';
    return { ...actor, currentRole: role };
  });
}

export function eventWeightsFor(actor: Actor, context?: EventWeightContext): Record<ActorEventType, number> {
  const actorWeights = ACTOR_WEIGHTS[actor.type];
  const stateWeights = STATE_WEIGHTS[actor.state];
  const weights = Object.fromEntries(
    Object.keys(actorWeights).map((key) => {
      const event = key as ActorEventType;
      const fatigueBoost = actor.fatigue > 1 && ['positionShift', 'tempoRush', 'ensembleWaver'].includes(event) ? 3 : 0;
      return [event, actorWeights[event] + stateWeights[event] + fatigueBoost];
    }),
  ) as Record<ActorEventType, number>;
  return context ? applyDailyEventWeights(context.seed, context.totalTurn, actor, weights) : weights;
}

function volatileEventWeightsFor(actor: Actor, context?: EventWeightContext): Record<ActorEventType, number> {
  const weights = eventWeightsFor(actor);
  const volatileWeights = Object.fromEntries(
    Object.entries(weights).map(([event, weight]) => [
      event,
      Math.max(4, Math.round(Math.sqrt(weight) * 3)),
    ]),
  ) as Record<ActorEventType, number>;
  return context ? applyDailyEventWeights(context.seed, context.totalTurn, actor, volatileWeights) : volatileWeights;
}

export function topOmenEvents(actor: Actor, limit = 3, context?: EventWeightContext): Array<{ event: ActorEventType; weight: number; intensity: typeof OMEN_INTENSITY_LABELS[keyof typeof OMEN_INTENSITY_LABELS] }> {
  const weights = eventWeightsFor(actor, context);
  const sorted = (Object.entries(weights) as Array<[ActorEventType, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const top = sorted[0]?.[1] ?? 1;
  return sorted.map(([event, weight]) => ({
    event,
    weight,
    intensity: weight >= top - 2 ? OMEN_INTENSITY_LABELS.high : weight >= top - 8 ? OMEN_INTENSITY_LABELS.medium : OMEN_INTENSITY_LABELS.low,
  }));
}

export function resolveActorEvent(state: GameState): ActorEvent {
  const focus = state.actors.find((actor) => actor.id === state.currentFocusActorId) ?? state.actors[0];
  const rng = createRng(`${state.seed}:event:${state.totalTurn}:${focus.id}`);
  const volatility = 0.14 + state.backstageLoad * 0.04 + dailyVolatilityBonus(state.seed, state.totalTurn);
  const context = { seed: state.seed, totalTurn: state.totalTurn };
  const eventType = pickWeighted(rng, rng() < volatility ? volatileEventWeightsFor(focus, context) : eventWeightsFor(focus, context));
  return {
    type: eventType,
    actorId: focus.id,
    title: EVENT_LABELS[eventType],
    description: EVENT_DESCRIPTIONS[eventType],
  };
}

function responseFitsActor(actor: Actor, response: MainResponse): boolean {
  if (actor.type === 'lead') return response === 'wait' || response === 'catch';
  if (actor.type === 'junior') return response === 'catch' || response === 'arrange';
  return response === 'arrange' || response === 'wait';
}

function isSuccessfulTier(tier: TurnLog['resultTier']) {
  return tier === 'masterpiece' || tier === 'scene' || tier === 'smallSuccess';
}

function actorTrustDelta(actor: Actor, log: TurnLog | undefined): number {
  if (!log || actor.id !== log.focusActorType) return 0;
  const success = isSuccessfulTier(log.resultTier);
  const compatibility = EVENT_COMPATIBILITY[log.actorEventType][log.mainResponse];
  let delta = 0;
  if (success && responseFitsActor(actor, log.mainResponse)) delta += 1;
  if (success && compatibility >= 3) delta += 1;
  if (success && log.prepQuality === 'hit') delta += 1;
  if (log.prepQuality === 'miss' && compatibility <= 0) delta -= 1;
  if (log.resultTier === 'fray') delta -= 1;
  if (log.resultTier === 'accident') delta -= 2;
  if (actor.state === 'fatigued' && log.mainResponse === 'catch') delta -= 1;
  if (log.mainResponse === 'cut' && ['stepForward', 'adlib', 'heatUp', 'silence'].includes(log.actorEventType)) delta -= 1;
  if (log.mainResponse === 'arrange' && actor.type !== 'skilled' && ['adlib', 'heatUp'].includes(log.actorEventType)) delta -= 1;
  if (log.mainResponse === 'wait' && ['positionShift', 'tempoRush', 'ensembleWaver'].includes(log.actorEventType)) delta -= 1;
  return Math.max(-2, Math.min(2, delta));
}

function stateWeightsFor(actor: Actor, log: TurnLog | undefined, backstageLoad: number): StateWeights {
  const weights: StateWeights = {
    elated: 3,
    contemplative: 3,
    anxious: 3,
    immersed: 3,
    fatigued: actor.fatigue >= 2 ? 5 : 2,
  };
  if (!log) return weights;

  if (backstageLoad >= 4) {
    weights.anxious += 4;
    weights.fatigued += 5;
  }
  if (actor.id !== log.focusActorType) {
    if (log.deltaTrust > 0) weights.immersed += 2;
    if (log.deltaFlow < 0 || log.deltaLoad >= 2) weights.anxious += 2;
    return weights;
  }

  if (log.resultTier === 'masterpiece' || log.deltaScene >= 3) {
    weights.elated += 6;
    weights.immersed += 4;
  }
  if (log.mainResponse === 'catch' && isSuccessfulTier(log.resultTier)) weights.elated += 4;
  if (log.mainResponse === 'wait' && log.deltaTrust > 0) {
    weights.contemplative += 5;
    weights.immersed += 3;
  }
  if (log.mainResponse === 'arrange' && log.deltaFlow > 0) {
    weights.contemplative += 4;
    weights.immersed += 2;
  }
  if (log.mainResponse === 'cut') {
    weights.contemplative += 3;
    if (log.deltaTrust < 0) weights.anxious += 5;
  }
  if (log.resultTier === 'fray' || log.resultTier === 'accident' || log.deltaFlow < 0) weights.anxious += 6;
  if (log.deltaLoad >= 2) weights.fatigued += 4;
  return weights;
}

export function advanceActorStates(state: GameState): Actor[] {
  const rng = createRng(`${state.seed}:state:${state.totalTurn}:${state.logs.length}`);
  const latestLog = state.logs[state.logs.length - 1];
  return state.actors.map((actor) => {
    const trustDelta = actorTrustDelta(actor, latestLog);
    const fatiguePressure = latestLog && (latestLog.deltaLoad >= 2 || latestLog.resultTier === 'accident') ? 1 : 0;
    const fatigueRelief = rng() < (latestLog?.deltaLoad < 0 ? 0.42 : 0.26) ? -1 : 0;
    const fatigue = Math.max(0, Math.min(3, actor.fatigue + fatiguePressure + fatigueRelief));
    const trust = Math.max(0, actor.trust + trustDelta);
    const shouldChange = actor.id === latestLog?.focusActorType ? rng() < 0.76 : rng() < 0.34;
    if (!shouldChange) return { ...actor, fatigue, trust };
    const nextState = pickWeighted(rng, stateWeightsFor({ ...actor, fatigue, trust }, latestLog, state.backstageLoad));
    return { ...actor, state: fatigue >= 3 ? 'fatigued' : nextState, fatigue, trust };
  });
}

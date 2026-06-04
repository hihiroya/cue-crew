import { ACTOR_WEIGHTS, EVENT_DESCRIPTIONS, EVENT_LABELS, STATE_WEIGHTS } from './constants';
import { OMEN_INTENSITY_LABELS } from '../content/ja/gameLabels';
import { createRng, pickWeighted } from './rng';
import type { Actor, ActorEvent, ActorEventType, ActorState, ActorType, GameState } from './types';

const stateCycle: ActorState[] = ['elated', 'contemplative', 'anxious', 'immersed', 'fatigued'];
const focusOrder: ActorType[] = ['junior', 'lead', 'skilled', 'junior', 'lead', 'skilled', 'junior', 'skilled', 'lead', 'junior'];

export function pickFocusActor(seed: string, totalTurn: number): ActorType {
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

export function eventWeightsFor(actor: Actor): Record<ActorEventType, number> {
  const actorWeights = ACTOR_WEIGHTS[actor.type];
  const stateWeights = STATE_WEIGHTS[actor.state];
  return Object.fromEntries(
    Object.keys(actorWeights).map((key) => {
      const event = key as ActorEventType;
      const fatigueBoost = actor.fatigue > 1 && ['positionShift', 'tempoRush', 'ensembleWaver'].includes(event) ? 3 : 0;
      return [event, actorWeights[event] + stateWeights[event] + fatigueBoost];
    }),
  ) as Record<ActorEventType, number>;
}

function volatileEventWeightsFor(actor: Actor): Record<ActorEventType, number> {
  const weights = eventWeightsFor(actor);
  return Object.fromEntries(
    Object.entries(weights).map(([event, weight]) => [
      event,
      Math.max(4, Math.round(Math.sqrt(weight) * 3)),
    ]),
  ) as Record<ActorEventType, number>;
}

export function topOmenEvents(actor: Actor, limit = 3): Array<{ event: ActorEventType; weight: number; intensity: typeof OMEN_INTENSITY_LABELS[keyof typeof OMEN_INTENSITY_LABELS] }> {
  const weights = eventWeightsFor(actor);
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
  const volatility = 0.14 + state.backstageLoad * 0.04;
  const eventType = pickWeighted(rng, rng() < volatility ? volatileEventWeightsFor(focus) : eventWeightsFor(focus));
  return {
    type: eventType,
    actorId: focus.id,
    title: EVENT_LABELS[eventType],
    description: EVENT_DESCRIPTIONS[eventType],
  };
}

export function advanceActorStates(state: GameState): Actor[] {
  const rng = createRng(`${state.seed}:state:${state.totalTurn}:${state.logs.length}`);
  const focus = state.currentFocusActorId;
  const latestLog = state.logs[state.logs.length - 1];
  return state.actors.map((actor) => {
    const fatigue = Math.max(0, Math.min(3, actor.fatigue + (rng() < 0.26 ? -1 : 0)));
    const focusTrustDelta = actor.id === focus && latestLog
      ? latestLog.deltaTrust >= 2
        ? 2
        : latestLog.deltaTrust > 0
          ? 1
          : latestLog.deltaTrust < 0
            ? -1
            : 0
      : 0;
    const trust = Math.max(0, actor.trust + focusTrustDelta);
    const shouldChange = actor.id === focus ? rng() < 0.72 : rng() < 0.34;
    if (!shouldChange) return { ...actor, fatigue, trust };
    const nextState = stateCycle[Math.floor(rng() * stateCycle.length)];
    return { ...actor, state: fatigue >= 3 ? 'fatigued' : nextState, fatigue, trust };
  });
}

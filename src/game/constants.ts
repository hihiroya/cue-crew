import type { Actor, ActorEventType, ActorState, ActorType, LoadBias, LoadBiasArea, LoadStrain, MainResponse, PrepAction } from './types';
export {
  ACTOR_LABELS,
  ACTOR_TRAITS,
  ACTS,
  ACT_RESPONSE_GUIDES,
  EVENT_DESCRIPTIONS,
  EVENT_LABELS,
  LOAD_LABELS,
  PERFORMANCE_SLOT_LABELS,
  PERFORMANCE_STYLE_DETAILS,
  PREP_DESCRIPTIONS,
  PREP_LABELS,
  PREP_RESPONSE_HINTS,
  RESPONSE_DESCRIPTIONS,
  RESPONSE_LABELS,
  RESULT_TIER_LABELS,
  RESULT_TIER_STARS,
  STATE_LABELS,
} from '../content/ja/gameLabels';

export const TOTAL_TURNS = 6;
export const TURNS_PER_ACT = 2;
export const MAX_LOAD = 5;

export const INITIAL_ACTORS: Actor[] = [
  { id: 'lead', type: 'lead', name: '主役', state: 'contemplative', trust: 0, fatigue: 0, currentRole: 'focus' },
  { id: 'junior', type: 'junior', name: '若手', state: 'elated', trust: 0, fatigue: 0, currentRole: 'sign' },
  { id: 'skilled', type: 'skilled', name: '技巧派', state: 'immersed', trust: 0, fatigue: 0, currentRole: 'waiting' },
];

export const PREP_PRIMARY_RESPONSE: Record<PrepAction, MainResponse> = {
  watch: 'catch',
  makeSpace: 'wait',
  tightenFlow: 'arrange',
  prepareTransition: 'cut',
};

export const LOAD_BIAS_AREAS: LoadBiasArea[] = ['light', 'sound', 'stageManagement', 'props'];

export const INITIAL_LOAD_STRAIN: LoadStrain = {
  light: 0,
  sound: 0,
  stageManagement: 0,
  props: 0,
};

export const EVENT_COMPATIBILITY: Record<ActorEventType, Record<MainResponse, number>> = {
  stepForward: { catch: 3, arrange: 2, wait: 0, cut: 0 },
  adlib: { catch: 3, arrange: 0, wait: 2, cut: -2 },
  heatUp: { catch: 3, arrange: 2, wait: 0, cut: 0 },
  silence: { catch: 0, arrange: 2, wait: 3, cut: 0 },
  positionShift: { catch: 2, arrange: 3, wait: -2, cut: 2 },
  tempoRush: { catch: 2, arrange: 3, wait: -2, cut: 2 },
  delayedExit: { catch: 2, arrange: 0, wait: 3, cut: 2 },
  ensembleWaver: { catch: 0, arrange: 3, wait: -2, cut: 2 },
};

export const PREP_MATCHES: Record<PrepAction, ActorEventType[]> = {
  watch: ['stepForward', 'adlib', 'heatUp'],
  makeSpace: ['silence', 'delayedExit', 'heatUp'],
  tightenFlow: ['positionShift', 'tempoRush', 'ensembleWaver'],
  prepareTransition: ['tempoRush', 'delayedExit', 'ensembleWaver', 'positionShift'],
};

export const ACTOR_WEIGHTS: Record<ActorType, Record<ActorEventType, number>> = {
  lead: {
    stepForward: 8,
    adlib: 4,
    heatUp: 9,
    silence: 12,
    positionShift: 4,
    tempoRush: 4,
    delayedExit: 11,
    ensembleWaver: 3,
  },
  junior: {
    stepForward: 13,
    adlib: 12,
    heatUp: 11,
    silence: 3,
    positionShift: 6,
    tempoRush: 10,
    delayedExit: 3,
    ensembleWaver: 4,
  },
  skilled: {
    stepForward: 4,
    adlib: 4,
    heatUp: 6,
    silence: 12,
    positionShift: 10,
    tempoRush: 4,
    delayedExit: 11,
    ensembleWaver: 8,
  },
};

export const STATE_WEIGHTS: Record<ActorState, Record<ActorEventType, number>> = {
  elated: {
    stepForward: 9,
    adlib: 8,
    heatUp: 9,
    silence: 1,
    positionShift: 4,
    tempoRush: 7,
    delayedExit: 2,
    ensembleWaver: 3,
  },
  contemplative: {
    stepForward: 2,
    adlib: 2,
    heatUp: 4,
    silence: 10,
    positionShift: 3,
    tempoRush: 1,
    delayedExit: 8,
    ensembleWaver: 3,
  },
  anxious: {
    stepForward: 3,
    adlib: 3,
    heatUp: 2,
    silence: 4,
    positionShift: 9,
    tempoRush: 8,
    delayedExit: 3,
    ensembleWaver: 6,
  },
  immersed: {
    stepForward: 4,
    adlib: 5,
    heatUp: 8,
    silence: 8,
    positionShift: 5,
    tempoRush: 2,
    delayedExit: 6,
    ensembleWaver: 5,
  },
  fatigued: {
    stepForward: 3,
    adlib: 2,
    heatUp: 3,
    silence: 5,
    positionShift: 8,
    tempoRush: 7,
    delayedExit: 4,
    ensembleWaver: 6,
  },
};

export const RESPONSE_BIAS: Record<MainResponse, Exclude<LoadBias, null>> = {
  catch: 'light',
  arrange: 'stageManagement',
  wait: 'sound',
  cut: 'props',
};

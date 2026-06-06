import type { Actor, LoadStrain } from './types';
import { ACTOR_LABELS as ACTOR_NAMES } from '../content/ja/gameLabels';

export const INITIAL_ACTORS: Actor[] = [
  { id: 'lead', type: 'lead', name: ACTOR_NAMES.lead, state: 'contemplative', trust: 0, fatigue: 0, currentRole: 'focus' },
  { id: 'junior', type: 'junior', name: ACTOR_NAMES.junior, state: 'elated', trust: 0, fatigue: 0, currentRole: 'sign' },
  { id: 'skilled', type: 'skilled', name: ACTOR_NAMES.skilled, state: 'immersed', trust: 0, fatigue: 0, currentRole: 'waiting' },
];

export const INITIAL_LOAD_STRAIN: LoadStrain = {
  light: 0,
  sound: 0,
  stageManagement: 0,
  props: 0,
};

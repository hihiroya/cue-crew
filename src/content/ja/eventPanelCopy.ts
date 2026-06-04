import { ACTOR_LABELS, PREP_LABELS } from './gameLabels';
import type { ActorEvent, GameState } from '../../game/types';

export const eventPanelCopy = {
  fallbackActor: '焦点役者',
  heading: '本番の出来事',
  pendingTitle: 'まだ起きていない',
  prepLead: '役者の兆候を見て、本番中の想定外に備える準備を選ぶ。',
  frayPrefix: '舞台裏のほころび',
} as const;

export function eventTitle(event: ActorEvent | null | undefined) {
  if (!event) return eventPanelCopy.pendingTitle;
  return `${ACTOR_LABELS[event.actorId]}：${event.title}`;
}

export function eventDescription(state: GameState) {
  const event = state.currentActorEvent;
  if (event) return event.description;
  if (state.selectedPrep) return `${PREP_LABELS[state.selectedPrep]}で備えた。役者の次の動きを待っている。`;
  return eventPanelCopy.prepLead;
}

export function frayNote(title: string) {
  return `${eventPanelCopy.frayPrefix}: ${title}`;
}

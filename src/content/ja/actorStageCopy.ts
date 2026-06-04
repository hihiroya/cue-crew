import { STATE_LABELS } from './gameLabels';
import type { Actor, ActorState } from '../../game/types';

export const actorStageCopy = {
  eventAria: '本番の出来事',
  eventKicker: '本番で起きた',
  stageAria: '役者の兆候',
  focusRole: '今回の注目役者',
  stateLabel: '状態',
  supportAria: '他の役者',
  nextRole: '次の注目候補',
  reserveRole: '控え',
  visibleOmens: '見えている兆候',
} as const;

export const STATE_HINTS: Record<ActorState, string> = {
  elated: '拾うと伸びやすい',
  contemplative: '待つと活きやすい',
  anxious: '整えると崩れにくい',
  immersed: '拾う・待つが効きやすい',
  fatigued: '整える・切るで守りやすい',
};

export function nextPressure(actor: Actor, isNext: boolean, backstageLoad: number) {
  if (isNext && backstageLoad >= 3) {
    if (actor.type === 'lead') return '負荷が高いまま入ると、沈黙が事故化しやすい';
    if (actor.type === 'junior') return '負荷が高いまま入ると、勢いがほころびやすい';
    return '負荷が高いまま入ると、ズレが広がりやすい';
  }
  if (actor.state === 'fatigued') return '疲労。次ターンの下振れリスク';
  if (actor.state === 'anxious') return '不安。負荷を残すと乱れやすい';
  if (actor.type === 'junior') return '拾うが活きやすいかも';
  if (actor.type === 'lead') return '待つが活きやすいかも';
  return '整えるが活きやすいかも';
}

export function supportActorSummary(actor: Actor, isNext: boolean, backstageLoad: number, passive: string | null) {
  if (!isNext) return passive ? `${STATE_LABELS[actor.state]} / ${passive}` : STATE_LABELS[actor.state];
  if (backstageLoad >= 3) return `${STATE_LABELS[actor.state]} / 次は負荷注意`;
  if (actor.state === 'fatigued') return `${STATE_LABELS[actor.state]} / 守りたい`;
  if (actor.state === 'anxious') return `${STATE_LABELS[actor.state]} / 整えたい`;
  if (passive) return `${STATE_LABELS[actor.state]} / ${passive}`;
  return `${STATE_LABELS[actor.state]} / ${nextPressure(actor, true, backstageLoad).replace('かも', '')}`;
}

export function actorPassiveLabel(actor: Actor) {
  if (actor.trust >= 5) return '以心伝心';
  if (actor.trust >= 3) return '阿吽の呼吸';
  return null;
}

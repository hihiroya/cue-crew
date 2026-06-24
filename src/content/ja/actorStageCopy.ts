import { STATE_LABELS } from './gameLabels';
import type { Actor, ActorState } from '../../game/types';

export const actorStageCopy = {
  eventAria: '本番の出来事',
  eventKicker: '本番で起きた',
  eventActorAria: (actor: string, state: string) => `本番の役者 ${actor} 状態 ${state}`,
  stageAria: '役者の兆候',
  focusRole: '注目',
  stateLabel: '状態',
  actorTrust: '役者信頼',
  supportAria: '他の役者',
  nextRole: '次に来そう',
  reserveRole: '控え',
  visibleOmens: '兆候',
} as const;

export const omenIntensityCopy = {
  high: '高',
  medium: '中',
  low: '低',
  strengthAria: (intensity: string) => `発生しやすさ ${intensity}`,
} as const;

export const STATE_HINTS: Record<ActorState, string> = {
  elated: '見せ場で伸びやすい',
  contemplative: '余韻で活きやすい',
  anxious: '安定で崩れにくい',
  immersed: '見せ場・余韻が効きやすい',
  fatigued: '安定・収束で守りやすい',
};

export function nextPressure(actor: Actor, isNext: boolean, backstageLoad: number) {
  if (isNext && backstageLoad >= 3) {
    if (actor.type === 'lead') return '負荷が高いまま入ると、沈黙が事故化しやすい';
    if (actor.type === 'junior') return '負荷が高いまま入ると、勢いがほころびやすい';
    return '負荷が高いまま入ると、ズレが広がりやすい';
  }
  if (actor.state === 'fatigued') return '疲労。次ターンの下振れリスク';
  if (actor.state === 'anxious') return '不安。負荷を残すと乱れやすい';
  if (actor.type === 'junior') return '見せ場が活きやすいかも';
  if (actor.type === 'lead') return '余韻が活きやすいかも';
  return '安定が活きやすいかも';
}

export function supportActorSummary(actor: Actor, isNext: boolean, backstageLoad: number, passive: string | null) {
  if (!isNext) return passive ? `${STATE_LABELS[actor.state]} / ${passive}` : STATE_LABELS[actor.state];
  if (backstageLoad >= 3) return `${STATE_LABELS[actor.state]} / 次は負荷注意`;
  if (actor.state === 'fatigued') return `${STATE_LABELS[actor.state]} / 守りたい`;
  if (actor.state === 'anxious') return `${STATE_LABELS[actor.state]} / 安定させたい`;
  if (passive) return `${STATE_LABELS[actor.state]} / ${passive}`;
  return `${STATE_LABELS[actor.state]} / ${nextPressure(actor, true, backstageLoad).replace('かも', '')}`;
}

export function actorPassiveLabel(actor: Actor) {
  if (actor.trust >= 5) return '以心伝心';
  if (actor.trust >= 3) return '阿吽の呼吸';
  return null;
}

import type { Actor, ActorEventType } from './types';
import { dailyRunCopy } from '../content/ja/rogueliteCopy';

export type DailyModifierId =
  | 'roughOpening'
  | 'juniorHeat'
  | 'leadSilence'
  | 'skilledDrift'
  | 'heavyTransition'
  | 'hotAudience';

export type DailyRun = {
  seed: string;
  title: string;
  modifierId: DailyModifierId;
  modifier: string;
  detail: string;
};

const DAILY_VARIANTS: Array<{ id: DailyModifierId; modifier: string; detail: string }> = [
  { id: 'roughOpening', ...dailyRunCopy.variants.roughOpening },
  { id: 'juniorHeat', ...dailyRunCopy.variants.juniorHeat },
  { id: 'leadSilence', ...dailyRunCopy.variants.leadSilence },
  { id: 'skilledDrift', ...dailyRunCopy.variants.skilledDrift },
  { id: 'heavyTransition', ...dailyRunCopy.variants.heavyTransition },
  { id: 'hotAudience', ...dailyRunCopy.variants.hotAudience },
];

export function dailyRunFor(date = new Date()): DailyRun {
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return dailyRunForSeed(`honban-daily-${day}`) ?? dailyRunFromSeed(`honban-daily-${day}`);
}

export function dailyRunForSeed(seed: string): DailyRun | null {
  if (!seed.startsWith('honban-daily-')) return null;
  return dailyRunFromSeed(seed);
}

function dailyRunFromSeed(seed: string): DailyRun {
  const variant = DAILY_VARIANTS[hashString(seed) % DAILY_VARIANTS.length];
  return {
    seed,
    title: dailyRunCopy.title,
    modifierId: variant.id,
    modifier: variant.modifier,
    detail: variant.detail,
  };
}

export function applyDailyEventWeights(
  seed: string,
  totalTurn: number,
  actor: Actor,
  weights: Record<ActorEventType, number>,
): Record<ActorEventType, number> {
  const run = dailyRunForSeed(seed);
  if (!run) return weights;
  const next = { ...weights };
  if (run.modifierId === 'roughOpening' && totalTurn <= 2) {
    next.positionShift += 3;
    next.tempoRush += 3;
    next.ensembleWaver += 2;
  }
  if (run.modifierId === 'juniorHeat' && actor.type === 'junior') {
    next.stepForward += 4;
    next.adlib += 4;
    next.heatUp += 3;
  }
  if (run.modifierId === 'leadSilence' && actor.type === 'lead') {
    next.silence += 5;
    next.delayedExit += 4;
  }
  if (run.modifierId === 'skilledDrift' && actor.type === 'skilled') {
    next.positionShift += 5;
    next.ensembleWaver += 4;
  }
  if (run.modifierId === 'heavyTransition') {
    next.delayedExit += 2;
    next.tempoRush += 2;
    next.positionShift += 2;
  }
  if (run.modifierId === 'hotAudience') {
    next.stepForward += 2;
    next.adlib += 2;
    next.heatUp += 3;
  }
  return next;
}

export function dailyVolatilityBonus(seed: string, totalTurn: number) {
  const run = dailyRunForSeed(seed);
  if (!run) return 0;
  if (run.modifierId === 'roughOpening' && totalTurn <= 2) return 0.08;
  if (run.modifierId === 'heavyTransition') return 0.03;
  if (run.modifierId === 'hotAudience') return 0.02;
  return 0;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

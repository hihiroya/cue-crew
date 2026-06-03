import { ACTS, PERFORMANCE_SLOT_LABELS } from './constants';
import type { PerformanceSlot } from './types';

export function slotForTurnInAct(turnInAct: number): PerformanceSlot {
  return turnInAct === 1 ? 'matinee' : 'soiree';
}

export function performanceLabel(day: number, slot: PerformanceSlot) {
  return `${day}日目 ${PERFORMANCE_SLOT_LABELS[slot].label}`;
}

export function actForTurn(totalTurn: number) {
  const act = Math.ceil(totalTurn / 2);
  const turnInAct = totalTurn % 2 === 0 ? 2 : 1;
  const theme = ACTS[act - 1]?.name ?? '千秋楽';
  return { act, turnInAct, theme };
}

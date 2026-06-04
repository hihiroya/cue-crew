import { ACTS } from './constants';
import { FALLBACK_ACT_NAME, performanceLabelText } from '../content/ja/gameLabels';
import type { PerformanceSlot } from './types';

export function slotForTurnInAct(turnInAct: number): PerformanceSlot {
  return turnInAct === 1 ? 'matinee' : 'soiree';
}

export function performanceLabel(day: number, slot: PerformanceSlot) {
  return performanceLabelText(day, slot);
}

export function actForTurn(totalTurn: number) {
  const act = Math.ceil(totalTurn / 2);
  const turnInAct = totalTurn % 2 === 0 ? 2 : 1;
  const theme = ACTS[act - 1]?.name ?? FALLBACK_ACT_NAME;
  return { act, turnInAct, theme };
}

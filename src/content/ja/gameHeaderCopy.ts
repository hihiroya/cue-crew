import { PERFORMANCE_SLOT_LABELS } from './gameLabels';
import type { GameState, PerformanceStyle } from '../../game/types';

export const gameHeaderCopy = {
  styleLabel: '公演の色',
  pendingStyle: '仕込み中',
  pendingHint: '初日ソワレ後に決まる',
} as const;

export function slotDetail(turnInAct: number) {
  return turnInAct === 1 ? '昼公演' : '夜公演';
}

export function performanceLabel(state: GameState) {
  const slot = state.turnInAct === 1 ? 'matinee' : 'soiree';
  return `${state.act}日目 ${PERFORMANCE_SLOT_LABELS[slot].label}`;
}

export const PERFORMANCE_COLOR_HUD: Record<PerformanceStyle, { label: string; hint: string; tone: string }> = {
  heat: {
    label: '熱量',
    hint: '拾う↑ / 負荷残りやすい',
    tone: 'heat',
  },
  breath: {
    label: '余韻',
    hint: '待つ↑ / 一体感残りやすい',
    tone: 'breath',
  },
  control: {
    label: '段取り',
    hint: '整える↑ / 負荷抜けやすい',
    tone: 'control',
  },
  closure: {
    label: '収束',
    hint: '切る↑ / 崩れを閉じる',
    tone: 'closure',
  },
};

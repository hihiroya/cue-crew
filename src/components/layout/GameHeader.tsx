import { PERFORMANCE_SLOT_LABELS, TOTAL_TURNS } from '../../game/constants';
import type { GameState } from '../../game/types';

type Props = {
  state: GameState;
};

export function GameHeader({ state }: Props) {
  const slot = state.turnInAct === 1 ? 'matinee' : 'soiree';
  const slotDetail = state.turnInAct === 1 ? '昼公演' : '夜公演';
  const color = state.performanceStyle ? PERFORMANCE_COLOR_HUD[state.performanceStyle] : null;
  return (
    <header className="game-header">
      <div className="performance-status">
        <span>{state.totalTurn}/{TOTAL_TURNS}</span>
        <strong>{state.act}日目 {PERFORMANCE_SLOT_LABELS[slot].label}</strong>
        <small>{slotDetail}</small>
      </div>
      <div className={`performance-color-chip ${color ? `color-${color.tone}` : 'color-pending'}`}>
        <span>公演の色</span>
        <strong>{color ? color.label : '仕込み中'}</strong>
        <small>{color ? color.hint : '初日ソワレ後に決まる'}</small>
      </div>
    </header>
  );
}

const PERFORMANCE_COLOR_HUD = {
  heat: {
    label: '熱量',
    hint: '拾う↑ / 負荷残りやすい',
    tone: 'heat',
  },
  breath: {
    label: '余韻',
    hint: '待つ↑ / 信頼残りやすい',
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
} as const;

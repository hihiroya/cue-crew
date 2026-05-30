import { ACTS, PERFORMANCE_SLOT_LABELS, PERFORMANCE_STYLE_DETAILS } from '../../game/constants';
import type { GameState } from '../../game/types';

type Props = {
  state: GameState;
  onTitle: () => void;
};

export function GameHeader({ state, onTitle }: Props) {
  const act = ACTS[state.act - 1];
  const slot = state.turnInAct === 1 ? 'matinee' : 'soiree';
  const style = state.performanceStyle ? PERFORMANCE_STYLE_DETAILS[state.performanceStyle] : null;
  return (
    <header className="game-header">
      <button className="ghost-button" onClick={onTitle}>公演を降りる</button>
      <div>
        <p>本番中につき！</p>
        <h1>舞台裏の一手</h1>
      </div>
      <div className="act-chip">
        <strong>{state.act}日目 {PERFORMANCE_SLOT_LABELS[slot].label}</strong>
        <span>{style ? `${style.label} / ${PERFORMANCE_SLOT_LABELS[slot].role}` : `${act?.role} / ${PERFORMANCE_SLOT_LABELS[slot].role}`}</span>
      </div>
    </header>
  );
}

import { TOTAL_TURNS } from '../../game/constants';
import type { GameState } from '../../game/types';
import { PERFORMANCE_COLOR_HUD, gameHeaderCopy, performanceLabel, slotDetail } from '../../content/ja/gameHeaderCopy';

type Props = {
  state: GameState;
};

export function GameHeader({ state }: Props) {
  const color = state.performanceStyle ? PERFORMANCE_COLOR_HUD[state.performanceStyle] : null;
  return (
    <header className="game-header">
      <div className="performance-status">
        <span>{state.totalTurn}/{TOTAL_TURNS}</span>
        <strong>{performanceLabel(state)}</strong>
        <small>{slotDetail(state.turnInAct)}</small>
      </div>
      <div className={`performance-color-chip ${color ? `color-${color.tone}` : 'color-pending'}`}>
        <span>{gameHeaderCopy.styleLabel}</span>
        <strong>{color ? color.label : gameHeaderCopy.pendingStyle}</strong>
        <small>{color ? color.hint : gameHeaderCopy.pendingHint}</small>
      </div>
    </header>
  );
}

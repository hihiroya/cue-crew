import { TOTAL_TURNS } from '../../game/constants';
import { dailyRunForSeed } from '../../game/dailyRun';
import type { GameState } from '../../game/types';
import { PERFORMANCE_COLOR_HUD, gameHeaderCopy, performanceLabel, slotDetail } from '../../content/ja/gameHeaderCopy';

type Props = {
  state: GameState;
};

export function GameHeader({ state }: Props) {
  const color = state.performanceStyle ? PERFORMANCE_COLOR_HUD[state.performanceStyle] : null;
  const dailyRun = dailyRunForSeed(state.seed);
  return (
    <header className="game-header">
      <div className="performance-status">
        <span>{state.totalTurn}/{TOTAL_TURNS}</span>
        <strong>{performanceLabel(state)}</strong>
        <small>{slotDetail(state.turnInAct)}</small>
        <em className={`performance-style-inline ${color ? `color-${color.tone}` : 'color-pending'}`}>
          {gameHeaderCopy.styleLabel} <b>{color ? color.label : gameHeaderCopy.pendingStyle}</b>
        </em>
      </div>
      {dailyRun ? (
        <div className="daily-run-chip">
          <span>{dailyRun.title}</span>
          <strong>{dailyRun.modifier}</strong>
          <small>{dailyRun.detail}</small>
        </div>
      ) : null}
    </header>
  );
}

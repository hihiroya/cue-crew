import { TOTAL_TURNS } from '../../game/constants';
import { dailyRunForSeed } from '../../game/dailyRun';
import type { GameState } from '../../game/types';
import { PERFORMANCE_COLOR_HUD, gameHeaderCopy, performanceLabel, slotIcon, scoreMeterAria } from '../../content/ja/gameHeaderCopy';
import { Icon } from '../ui/Icon';

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
        <strong className="performance-label">
          <Icon name={slotIcon(state.turnInAct)} />
          {performanceLabel(state)}
        </strong>
        <div className="performance-right-cluster">
          <em className={`performance-style-inline ${color ? `color-${color.tone}` : 'color-pending'}`}>
            {gameHeaderCopy.styleLabel} <b>{color ? color.label : gameHeaderCopy.pendingStyle}</b>
          </em>
          <div className="header-score-meters" aria-label={scoreMeterAria(state)}>
            <HeaderScore icon="scene" label={gameHeaderCopy.score.scene} value={state.sceneScore} />
            <HeaderScore icon="flow" label={gameHeaderCopy.score.flow} value={state.flowScore} />
            <HeaderScore icon="trust" label={gameHeaderCopy.score.trust} value={state.trustScore} />
          </div>
        </div>
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

function HeaderScore({ icon, label, value }: { icon: 'scene' | 'flow' | 'trust'; label: string; value: number }) {
  return (
    <span className="header-score-chip" aria-label={`${label} ${value}`}>
      <Icon name={icon} />
      <b>{value}</b>
    </span>
  );
}

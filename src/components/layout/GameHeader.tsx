import { TOTAL_TURNS } from '../../game/constants';
import { dailyRunForSeed } from '../../game/dailyRun';
import type { GameState } from '../../game/types';
import { PERFORMANCE_COLOR_HUD, gameHeaderCopy, performanceLabel, slotIcon, scoreMeterAria } from '../../content/ja/gameHeaderCopy';
import { Icon } from '../ui/Icon';
import { classNames } from '../ui/classNames';
import styles from './GameHeader.module.css';

type Props = {
  state: GameState;
};

export function GameHeader({ state }: Props) {
  const color = state.performanceStyle ? PERFORMANCE_COLOR_HUD[state.performanceStyle] : null;
  const dailyRun = dailyRunForSeed(state.seed);
  return (
    <header className={styles.root}>
      <div className={styles.status}>
        <span>{state.totalTurn}/{TOTAL_TURNS}</span>
        <strong className={styles.label}>
          <Icon name={slotIcon(state.turnInAct)} />
          {performanceLabel(state)}
        </strong>
        <div className={styles.rightCluster}>
          <em className={classNames(styles.styleInline, color ? colorToneClass[color.tone] : styles.colorPending)}>
            {gameHeaderCopy.styleLabel} <b>{color ? color.label : gameHeaderCopy.pendingStyle}</b>
          </em>
          <div className={styles.scoreMeters} aria-label={scoreMeterAria(state)}>
            <HeaderScore icon="scene" label={gameHeaderCopy.score.scene} value={state.sceneScore} />
            <HeaderScore icon="flow" label={gameHeaderCopy.score.flow} value={state.flowScore} />
            <HeaderScore icon="trust" label={gameHeaderCopy.score.trust} value={state.trustScore} />
          </div>
        </div>
      </div>
      {dailyRun ? (
        <div className={styles.dailyRunChip}>
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
    <span className={styles.scoreChip} aria-label={`${label} ${value}`}>
      <Icon name={icon} />
      <b>{value}</b>
    </span>
  );
}

const colorToneClass: Record<NonNullable<typeof PERFORMANCE_COLOR_HUD[keyof typeof PERFORMANCE_COLOR_HUD]>['tone'], string> = {
  heat: styles.colorHeat,
  breath: styles.colorBreath,
  control: styles.colorControl,
  closure: styles.colorClosure,
};

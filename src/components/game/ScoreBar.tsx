import { likelyFrayBias } from '../../game/fray';
import type { GameState } from '../../game/types';
import { Icon } from '../ui/Icon';
import { classNames } from '../ui/classNames';
import { frayAreaLabel, frayAria, likelyFrayAria, loadAria, loadRiskLabel, scoreBarCopy } from '../../content/ja/scoreBarCopy';
import styles from './ScoreBar.module.css';

type Props = {
  state: GameState;
};

export function ScoreBar({ state }: Props) {
  const loadRisk = loadRiskLabel(state.backstageLoad);
  const likelyBias = !state.pendingFrayEvent && state.backstageLoad >= 3 ? likelyFrayBias(state) : null;
  const loadClass = loadToneClass[loadRisk.tone];
  return (
    <section className={classNames(styles.root, loadClass)} aria-label={scoreBarCopy.aria}>
      <div className={classNames(styles.loadConsole, loadClass)}>
        <div className={styles.loadHead}>
          <span className={styles.scoreIcon}><Icon name="load" /></span>
          <span>{scoreBarCopy.load}</span>
          <strong>{loadRisk.label}</strong>
        </div>
        <div className={styles.loadLights} aria-label={loadAria(state.backstageLoad, loadRisk.label)}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < state.backstageLoad ? styles.lit : ''} />
          ))}
        </div>
      </div>
      {state.pendingFrayEvent ? (
        <div className={styles.frayRibbon} aria-label={frayAria(state.pendingFrayEvent.bias, state.pendingFrayEvent.title)}>
          <span>{scoreBarCopy.fray}</span>
          <strong>{frayAreaLabel(state.pendingFrayEvent.bias)}: {state.pendingFrayEvent.title}</strong>
        </div>
      ) : likelyBias ? (
        <div className={classNames(styles.frayRibbon, styles.frayWarning)} aria-label={likelyFrayAria(likelyBias)}>
          <span>{scoreBarCopy.likelyFray}</span>
          <strong>{frayAreaLabel(likelyBias)}</strong>
        </div>
      ) : null}
    </section>
  );
}

const loadToneClass: Record<ReturnType<typeof loadRiskLabel>['tone'], string> = {
  safe: styles.loadSafe,
  caution: styles.loadCaution,
  danger: styles.loadDanger,
  fray: styles.loadFray,
};

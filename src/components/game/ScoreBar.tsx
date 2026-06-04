import { likelyFrayBias } from '../../game/fray';
import type { GameState } from '../../game/types';
import { Icon } from '../ui/Icon';
import { frayAreaLabel, frayAria, likelyFrayAria, loadAria, loadRiskLabel, scoreBarCopy } from '../../content/ja/scoreBarCopy';

type Props = {
  state: GameState;
};

export function ScoreBar({ state }: Props) {
  const loadRisk = loadRiskLabel(state.backstageLoad);
  const likelyBias = !state.pendingFrayEvent && state.backstageLoad >= 3 ? likelyFrayBias(state) : null;
  const totalScore = state.sceneScore + state.flowScore + state.trustScore;
  return (
    <section className="score-rail" aria-label={scoreBarCopy.aria}>
      <div className={`mobile-score-snapshot load-${loadRisk.tone}`}>
        <span>{scoreBarCopy.aria}</span>
        <strong>{totalScore}</strong>
        <em>{scoreBarCopy.load}: {loadRisk.label}</em>
      </div>
      <div className="score-trio">
        <ScoreChip icon="scene" label={scoreBarCopy.scene} value={state.sceneScore} />
        <ScoreChip icon="flow" label={scoreBarCopy.flow} value={state.flowScore} />
        <ScoreChip icon="trust" label={scoreBarCopy.trust} value={state.trustScore} />
      </div>
      <div className={`backstage-load-console load-${loadRisk.tone}`}>
        <div className="backstage-load-head">
          <span className="score-icon"><Icon name="load" /></span>
          <span>{scoreBarCopy.load}</span>
          <strong>{loadRisk.label}</strong>
        </div>
        <div className="load-light-row" aria-label={loadAria(state.backstageLoad, loadRisk.label)}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < state.backstageLoad ? 'is-lit' : ''} />
          ))}
        </div>
      </div>
      {state.pendingFrayEvent ? (
        <div className="fray-ribbon" aria-label={frayAria(state.pendingFrayEvent.bias, state.pendingFrayEvent.title)}>
          <span>{scoreBarCopy.fray}</span>
          <strong>{frayAreaLabel(state.pendingFrayEvent.bias)}: {state.pendingFrayEvent.title}</strong>
        </div>
      ) : likelyBias ? (
        <div className="fray-ribbon fray-ribbon--warning" aria-label={likelyFrayAria(likelyBias)}>
          <span>{scoreBarCopy.likelyFray}</span>
          <strong>{frayAreaLabel(likelyBias)}</strong>
        </div>
      ) : null}
    </section>
  );
}

function ScoreChip({ icon, label, value }: { icon: 'scene' | 'flow' | 'trust'; label: string; value: number }) {
  return (
    <div className="score-rail-item">
      <span className="score-icon"><Icon name={icon} /></span>
      <span><small>{label}</small><strong>{value}</strong></span>
    </div>
  );
}

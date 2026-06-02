import { likelyFrayBias } from '../../game/fray';
import type { GameState } from '../../game/types';
import { Icon } from '../ui/Icon';

type Props = {
  state: GameState;
};

export function ScoreBar({ state }: Props) {
  const loadRisk = loadRiskLabel(state.backstageLoad);
  const likelyBias = !state.pendingFrayEvent && state.backstageLoad >= 3 ? likelyFrayBias(state) : null;
  return (
    <section className="score-rail" aria-label="公演スコア">
      <div className="score-trio">
        <ScoreChip icon="scene" label="評判" value={state.sceneScore} />
        <ScoreChip icon="flow" label="段取り" value={state.flowScore} />
        <ScoreChip icon="trust" label="信頼" value={state.trustScore} />
      </div>
      <div className={`backstage-load-console load-${loadRisk.tone}`}>
        <div className="backstage-load-head">
          <span className="score-icon"><Icon name="load" /></span>
          <span>裏方負荷</span>
          <strong>{loadRisk.label}</strong>
        </div>
        <div className="load-light-row" aria-label={`裏方負荷 ${state.backstageLoad}/5 ${loadRisk.label}`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < state.backstageLoad ? 'is-lit' : ''} />
          ))}
        </div>
      </div>
      {state.pendingFrayEvent ? (
        <div className="fray-ribbon" aria-label={`舞台裏のほころび: ${frayAreaLabel(state.pendingFrayEvent.bias)} ${state.pendingFrayEvent.title}`}>
          <span>舞台裏のほころび</span>
          <strong>{frayAreaLabel(state.pendingFrayEvent.bias)}: {state.pendingFrayEvent.title}</strong>
        </div>
      ) : likelyBias ? (
        <div className="fray-ribbon fray-ribbon--warning" aria-label={`乱れそう: ${frayAreaLabel(likelyBias)}`}>
          <span>乱れそう</span>
          <strong>{frayAreaLabel(likelyBias)}</strong>
        </div>
      ) : null}
    </section>
  );
}

function loadRiskLabel(load: number) {
  if (load <= 1) return { label: '余裕', tone: 'safe' };
  if (load === 2) return { label: '注意', tone: 'watch' };
  if (load === 3) return { label: 'ほころび寸前', tone: 'danger' };
  return { label: 'ほころび圏内', tone: 'fray' };
}

function ScoreChip({ icon, label, value }: { icon: 'scene' | 'flow' | 'trust'; label: string; value: number }) {
  return (
    <div className="score-rail-item">
      <span className="score-icon"><Icon name={icon} /></span>
      <span><small>{label}</small><strong>{value}</strong></span>
    </div>
  );
}

function frayAreaLabel(bias: NonNullable<GameState['pendingFrayEvent']>['bias']) {
  if (bias === 'light') return '照明まわり';
  if (bias === 'sound') return '音響まわり';
  if (bias === 'props') return '道具まわり';
  return '進行まわり';
}

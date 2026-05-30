import { LOAD_LABELS } from '../../game/constants';
import type { GameState } from '../../game/types';
import { Icon } from '../ui/Icon';

type Props = {
  state: GameState;
};

export function ScoreBar({ state }: Props) {
  const loadLabel = state.loadBias ? LOAD_LABELS[state.loadBias] : 'なし';
  const loadPercent = `${(state.backstageLoad / 5) * 100}%`;
  const loadRisk = loadRiskLabel(state.backstageLoad);
  return (
    <section className="score-rail" aria-label="公演スコア">
      <ScoreChip icon="scene" label="評判" value={state.sceneScore} />
      <ScoreChip icon="flow" label="段取り" value={state.flowScore} />
      <ScoreChip icon="trust" label="座組信頼" value={state.trustScore} />
      <div className="score-rail-item load-rail-item">
        <span className="score-icon"><Icon name="load" /></span>
        <span><small>負荷</small><strong>{state.backstageLoad}/5</strong></span>
        <div className="load-meter" aria-hidden="true"><span style={{ width: loadPercent }} /></div>
        <em className={`load-risk risk-${loadRisk.tone}`}>{loadRisk.label}</em>
        <em>{loadLabel}</em>
      </div>
    </section>
  );
}

function loadRiskLabel(load: number) {
  if (load <= 1) return { label: '余裕', tone: 'safe' };
  if (load === 2) return { label: '注意', tone: 'watch' };
  if (load === 3) return { label: '危険', tone: 'danger' };
  return { label: 'ほころび圏内', tone: 'fray' };
}

function ScoreChip({ icon, label, value }: { icon: 'scene' | 'flow' | 'trust'; label: string; value: number }) {
  return (
    <div className="score-rail-item">
      <span className="score-icon"><Icon name={icon} /></span>
      <span><small>{label}</small><strong>{value >= 0 ? `+${value}` : value}</strong></span>
    </div>
  );
}

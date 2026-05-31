import { useMemo, useState } from 'react';
import { EVENT_LABELS, PREP_DESCRIPTIONS, PREP_LABELS, PREP_MATCHES, PREP_PRIMARY_RESPONSE, PREP_RESPONSE_HINTS, PREP_RESPONSE_READY_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS } from '../../game/constants';
import { responseInsight } from '../../game/scoring';
import type { ActorEventType, GameState, MainResponse, PrepAction, ResponseInsight, ResultTier } from '../../game/types';
import { Icon } from '../ui/Icon';

type PrepProps = {
  selected: PrepAction | null;
  disabled: boolean;
  visibleOmens: ActorEventType[];
  onSelect: (prep: PrepAction) => void;
};

const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
const responses: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];

export function PrepPanel({ selected, disabled, visibleOmens, onSelect }: PrepProps) {
  return (
    <section className="choice-panel">
      <div className="section-heading">
        <p>一手目</p>
        <h2>先読みを決める</h2>
      </div>
      <div className="choice-grid">
        {prepActions.map((prep) => {
          const coveredOmens = visibleOmens.filter((event) => PREP_MATCHES[prep].includes(event));
          const coverLabels = PREP_MATCHES[prep].map((event) => EVENT_LABELS[event]).join(' / ');
          return (
            <button key={prep} className={`choice-button prep-choice ${selected === prep ? 'is-selected' : ''}`} disabled={disabled} onClick={() => onSelect(prep)}>
              <Icon name={prep} />
              <span>{PREP_LABELS[prep]}</span>
              <em className="ready-label">{PREP_RESPONSE_READY_LABELS[prep]}</em>
              <em className="fit-label">見えている兆候 {coveredOmens.length}/{visibleOmens.length}</em>
              <small>{PREP_DESCRIPTIONS[prep]}</small>
              <div className="prep-plan">
                <strong>主対応: {RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[prep]]}</strong>
                <small>{PREP_RESPONSE_HINTS[prep].aim}</small>
                <small>別筋: {PREP_RESPONSE_HINTS[prep].alternate}</small>
              </div>
              <small className="cover-line">カバー: {coverLabels}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type ResponseProps = {
  selected: MainResponse | null;
  disabled: boolean;
  state: GameState;
  onSelect: (response: MainResponse) => void;
};

export function ResponsePanel({ selected, disabled, state, onSelect }: ResponseProps) {
  const insights = useMemo(
    () => responses.map((response) => responseInsight(state, response)),
    [state],
  );
  const [inspectedResponse, setInspectedResponse] = useState<MainResponse>(selected ?? 'catch');
  const inspected = insights.find((insight) => insight.response === inspectedResponse) ?? insights[0];
  return (
    <section className="choice-panel">
      <div className="section-heading">
        <p>二手目{state.selectedPrep ? ` / 先読み: ${PREP_LABELS[state.selectedPrep]}` : ''}</p>
        <h2>本対応を選ぶ</h2>
      </div>
      <ResponseLegend />
      <div className="choice-grid response-grid">
        {insights.map((insight) => {
          const response = insight.response;
          const relation = prepRelationMark(insight.prepRelationTone);
          const range = resultRange(insight);
          const affinity = affinityItems(insight);
          const effects = effectItems(insight);
          const isInspected = inspected.response === response;
          return (
            <button
              key={response}
              aria-pressed={isInspected}
              className={`choice-button response-choice fit-${insight.rangeTone} ${isInspected ? 'is-selected' : ''}`}
              disabled={disabled}
              onClick={() => setInspectedResponse(response)}
              onFocus={() => setInspectedResponse(response)}
            >
              <div className="response-card-top">
                <Icon name={response} />
                <span className="response-title">
                  <strong>{RESPONSE_LABELS[response]}</strong>
                  <em>{insight.handTypeLabel}</em>
                </span>
              </div>
              <div className="response-badges">
                <em className={`prep-mark mark-${insight.prepRelationTone}`} aria-label={`先読みとの関係: ${insight.prepRelationLabel}`}>
                  先読み{relation}
                </em>
              </div>
              <strong className="response-aim">{compactAim(insight)}</strong>
              <span className="result-rail-label"><Icon name="scene" />成立見込み</span>
              <ResultRail range={range} resultTier={insight.resultTier} danger={Boolean(insight.dangerWarning)} />
              <div className="affinity-row" aria-label="相性">
                <span className="affinity-row-label">相性:</span>
                {affinity.map((item) => (
                  <span key={item.id} className={`affinity-chip affinity-${item.tone}`} title={item.title} aria-label={item.title}>
                    <Icon name={item.icon} />
                    <strong>{item.symbol}</strong>
                  </span>
                ))}
              </div>
              <div className="effect-row" aria-label="副作用">
                {effects.map((item) => (
                  <span key={item.key} className={`effect-chip effect-${item.tone}`} title={item.title} aria-label={item.title}>
                    {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
                    <Icon name={item.icon} />
                    <strong>{item.marker}</strong>
                  </span>
                ))}
              </div>
              {insight.dangerWarning ? <strong className="danger-warning compact-danger">{insight.downsideLabel}</strong> : null}
            </button>
          );
        })}
      </div>
      <aside className={`decision-note relation-${inspected.prepRelationTone}`}>
        <div>
          <span>判断メモ</span>
          <strong>{RESPONSE_LABELS[inspected.response]} / {inspected.successRangeLabel}</strong>
        </div>
        <p>{decisionMemo(inspected)}</p>
        <button className="primary-action decision-action" disabled={disabled} onClick={() => onSelect(inspected.response)}>
          この対応で進む
        </button>
      </aside>
    </section>
  );
}

const tierOrder: ResultTier[] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];

function prepRelationMark(tone: ResponseInsight['prepRelationTone']) {
  if (tone === 'primary') return '◎';
  if (tone === 'alternate') return '△';
  return '×';
}

function compactAim(insight: ResponseInsight) {
  if (insight.resultTier === 'masterpiece') return '名場面まで狙う';
  if (insight.resultTier === 'scene') return '場面化を狙う';
  if (insight.resultTier === 'smallSuccess') return '小さく成立させる';
  if (insight.resultTier === 'fray') return '崩れを小さく留める';
  return '事故圏内を避けたい';
}

function resultRange(insight: ResponseInsight) {
  const [lowLabel, highLabel] = insight.successRangeLabel.split('〜');
  const lowIndex = Math.max(0, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === lowLabel));
  const highIndex = Math.max(lowIndex, tierOrder.findIndex((tier) => RESULT_TIER_LABELS[tier] === highLabel));
  return { lowIndex, highIndex };
}

function ResultRail({ range, resultTier, danger }: { range: { lowIndex: number; highIndex: number }; resultTier: ResultTier; danger: boolean }) {
  const currentIndex = tierOrder.indexOf(resultTier);
  return (
    <div className={`result-rail ${danger ? 'has-danger' : ''}`} aria-label="結果レンジ">
      {tierOrder.map((tier, index) => (
        <span
          key={tier}
          className={`${index >= range.lowIndex && index <= range.highIndex ? 'is-in-range' : ''} ${index === currentIndex ? 'is-current' : ''}`}
          title={RESULT_TIER_LABELS[tier]}
          aria-label={RESULT_TIER_LABELS[tier]}
        />
      ))}
    </div>
  );
}

function ResponseLegend() {
  return (
    <details className="response-legend" open>
      <summary>凡例</summary>
      <div>
        <span><Icon name="event" />出来事</span>
        <span><Icon name="actor" />役者型</span>
        <span><Icon name="state" />役者状態</span>
        <span><Icon name="act" />公演回</span>
        <span><Icon name="load" />負荷</span>
        <span><Icon name="trust" />信頼</span>
        <span><Icon name="flow" />流れ</span>
        <span><Icon name="repeat" />連続</span>
      </div>
      <p>◎ 強い / ○ 合う / △ 普通 / × 注意。</p>
      <p>成立見込み: 事故 → ほころび → 小成功 → 場面化 → 名場面</p>
    </details>
  );
}

function affinityItems(insight: ResponseInsight) {
  const item = (id: string, icon: 'event' | 'actor' | 'state' | 'act', label: string, value: number) => ({
    id,
    icon,
    symbol: symbolForValue(value),
    tone: toneForValue(value),
    title: `${label}: ${symbolForValue(value)}`,
  });
  const value = (id: string) => insight.scoreBreakdown.find((entry) => entry.id === id)?.value ?? 0;
  return [
    item('event', 'event', '出来事', value('event')),
    item('actor', 'actor', '役者型', value('actor')),
    item('state', 'state', '役者状態', value('state')),
    item('act', 'act', '公演回', value('act')),
  ];
}

function symbolForValue(value: number) {
  if (value >= 3) return '◎';
  if (value > 0) return '○';
  if (value < 0) return '×';
  return '△';
}

function toneForValue(value: number) {
  if (value >= 3) return 'strong';
  if (value > 0) return 'good';
  if (value < 0) return 'bad';
  return 'neutral';
}

function effectItems(insight: ResponseInsight) {
  const repeatIndex = insight.sideEffectLabel.indexOf('連続使用:');
  const normalText = repeatIndex >= 0 ? insight.sideEffectLabel.slice(0, repeatIndex).replace(/\/\s*$/, '').trim() : insight.sideEffectLabel;
  const repeatText = repeatIndex >= 0 ? insight.sideEffectLabel.slice(repeatIndex).replace('連続使用:', '').trim() : '';
  const normal = normalText.split(' / ').filter(Boolean).flatMap((part) => parseEffect(part, false));
  const repeated = repeatText.split(' / ').filter(Boolean).flatMap((part) => parseEffect(part, true));
  const parsed = [...normal, ...repeated];
  return parsed.length ? parsed : [makeEffect('負荷維持', 'load', 0, false)];
}

type EffectIcon = 'load' | 'trust' | 'flow';
type EffectTone = 'good' | 'watch' | 'bad' | 'neutral';
type EffectItem = {
  key: string;
  icon: EffectIcon;
  marker: string;
  raw: string;
  title: string;
  tone: EffectTone;
  value: number;
  repeat: boolean;
};

function parseEffect(part: string, repeat: boolean): EffectItem[] {
  const trimmed = part.trim();
  if (!trimmed) return [];
  const icon: EffectIcon = trimmed.startsWith('信頼') ? 'trust' : trimmed.startsWith('流れ') ? 'flow' : 'load';
  const numeric = Number(trimmed.match(/[+-]\d+/)?.[0] ?? 0);
  return [makeEffect(trimmed, icon, numeric, repeat)];
}

function makeEffect(raw: string, icon: EffectIcon, value: number, repeat: boolean): EffectItem {
  const tone = effectTone(icon, value);
  const marker = effectMarker(value);
  const title = `${repeat ? '連続使用: ' : ''}${effectTargetLabel(icon)} ${marker}`;
  return {
    key: `${repeat ? 'repeat-' : ''}${raw}`,
    icon,
    marker,
    raw,
    title,
    tone,
    value,
    repeat,
  };
}

function effectMarker(value: number) {
  if (value >= 2) return '↑↑';
  if (value === 1) return '↑';
  if (value === 0) return '→';
  if (value === -1) return '↓';
  return '↓↓';
}

function effectTone(icon: EffectIcon, value: number): EffectTone {
  if (value === 0) return 'neutral';
  if (icon === 'load') {
    if (value < 0) return 'good';
    return value >= 2 ? 'bad' : 'watch';
  }
  return value > 0 ? 'good' : 'bad';
}

function effectTargetLabel(icon: EffectIcon) {
  if (icon === 'load') return '負荷';
  if (icon === 'trust') return '信頼';
  return '流れ';
}

function effectPhrase(item: EffectItem) {
  if (item.raw === '負荷回復なし') return `${item.repeat ? '連続使用で' : ''}負荷は軽くならない`;
  if (item.icon === 'load') {
    if (item.value >= 2) return `${item.repeat ? '連続使用で' : ''}負荷が大きく増える`;
    if (item.value > 0) return `${item.repeat ? '連続使用で' : ''}負荷が増える`;
    if (item.value < 0) return `${item.repeat ? '連続使用で' : ''}負荷が減る`;
    return '負荷は変わらない';
  }
  if (item.icon === 'trust') {
    if (item.value > 0) return `${item.repeat ? '連続使用で' : ''}信頼が増える`;
    if (item.value < 0) return `${item.repeat ? '連続使用で' : ''}信頼が減る`;
    return '信頼は変わらない';
  }
  if (item.value > 0) return `${item.repeat ? '連続使用で' : ''}流れが整う`;
  if (item.value < 0) return `${item.repeat ? '連続使用で' : ''}流れが乱れる`;
  return '流れは変わらない';
}

function effectSummary(insight: ResponseInsight) {
  return effectItems(insight).map(effectPhrase).join('、');
}

function decisionMemo(insight: ResponseInsight) {
  const prep = insight.prepRelationTone === 'primary'
    ? '先読みと正面から噛み合う'
    : insight.prepRelationTone === 'alternate'
      ? '先読みとは別筋で成立する'
      : '先読みとは噛み合いにくい';
  const danger = insight.dangerWarning ? ` ${insight.downsideLabel}。` : '';
  return `${prep}手。${insight.responseAimLabel}。見込みは${insight.successRangeLabel}。残る影響は${effectSummary(insight)}。${danger}`;
}

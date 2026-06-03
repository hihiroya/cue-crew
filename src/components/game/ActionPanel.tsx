import { useMemo, useState } from 'react';
import { EVENT_LABELS, PERFORMANCE_SLOT_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS } from '../../game/constants';
import { responseInsight } from '../../game/responseInsight';
import type { GameState, MainResponse, ResponseInsight, ResultTier } from '../../game/types';
import { Icon } from '../ui/Icon';
import { effectDirection, effectIntensity, effectItems, effectLedSlots, effectSummary, effectTargetLabel, evaluationSign } from './responseEffectsView';

export { PrepPanel } from './PrepPanel';

const responses: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];

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
    <section className="choice-panel response-panel">
      <div className="section-heading">
        <h2>行動に対応</h2>
      </div>
      <div className="choice-grid response-grid">
        {insights.map((insight) => (
          <ResponseChoiceCard
            key={insight.response}
            disabled={disabled}
            insight={insight}
            isInspected={inspected.response === insight.response}
            onInspect={setInspectedResponse}
          />
        ))}
      </div>
      <ResponseSendBar disabled={disabled} response={inspected.response} onSelect={onSelect} />
      <ResponseConsole insight={inspected} state={state} />
    </section>
  );
}

function ResponseSelectionMarker({ visible }: { visible: boolean }) {
  return (
    <em className={`selection-marker selection-marker--response ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {visible ? '確認中' : ''}
    </em>
  );
}

function ResponseChoiceCard({
  disabled,
  insight,
  isInspected,
  onInspect,
}: {
  disabled: boolean;
  insight: ResponseInsight;
  isInspected: boolean;
  onInspect: (response: MainResponse) => void;
}) {
  const response = insight.response;
  const range = resultRange(insight);
  return (
    <button
      aria-pressed={isInspected}
      className={`choice-button response-choice fit-${insight.rangeTone} ${isInspected ? 'is-selected' : ''}`}
      disabled={disabled}
      onClick={() => onInspect(response)}
      onFocus={() => onInspect(response)}
    >
      <div className="response-card-top">
        <Icon name={response} />
        <span className="response-title">
          <strong>{RESPONSE_LABELS[response]}</strong>
          <em>{insight.tacticalSummary}</em>
        </span>
      </div>
      <div className="outlook-summary" aria-label={`成立見込み: ${insight.successRangeLabel}`}>
        <div className="outlook-head">
          <span><Icon name="scene" />成立見込み</span>
          <strong className="response-range-badge">{insight.successRangeLabel}</strong>
          <em className={`response-prep-mark mark-${insight.prepRelationTone}`} aria-label={`準備との関係: ${insight.prepRelationLabel}`}>
            {prepConnectionShortLabel(insight.prepRelationTone)}
          </em>
        </div>
        <ResultRail range={range} resultTier={insight.resultTier} danger={Boolean(insight.dangerWarning)} />
      </div>
      <ResponseEffectSummary insight={insight} />
      {insight.dangerWarning ? <strong className="danger-warning compact-danger">{insight.downsideLabel}</strong> : null}
      <ResponseSelectionMarker visible={isInspected} />
    </button>
  );
}

function ResponseEffectSummary({ insight }: { insight: ResponseInsight }) {
  const effects = effectItems(insight).sort((a, b) => (
    Number(b.repeat) - Number(a.repeat)
    || Math.abs(b.value) - Math.abs(a.value)
  )).slice(0, 2);
  return (
    <div className="response-effect-summary" aria-label="影響の要約">
      <span>主要影響</span>
      <div>
        {effects.map((item) => (
          <em key={item.key} className={`response-effect-mini effect-${item.tone}`} title={item.title} aria-label={item.title}>
            {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
            <Icon name={item.icon} />
            <strong>{effectTargetLabel(item.icon)}</strong>
            <b>{evaluationSign(item)}</b>
          </em>
        ))}
      </div>
    </div>
  );
}

function ResponseSendBar({
  disabled,
  response,
  onSelect,
}: {
  disabled: boolean;
  response: MainResponse;
  onSelect: (response: MainResponse) => void;
}) {
  return (
    <div className="response-send-bar" aria-label={`${RESPONSE_LABELS[response]}を送出`}>
      <button className="primary-action decision-action cue-send-action" disabled={disabled} onClick={() => onSelect(response)}>
        <span className="cue-lamp-face cue-lamp-ready" aria-hidden="true" />
        <span className="cue-send-label">この対応を送る</span>
        <span className="cue-lamp-face cue-lamp-send" aria-hidden="true" />
      </button>
    </div>
  );
}

function ResponseConsole({ insight, state }: { insight: ResponseInsight; state: GameState }) {
  return (
    <aside className={`decision-note response-console relation-${insight.prepRelationTone}`}>
      <div className="console-head">
        <span>進行卓（コンソール）</span>
        <div className="console-cue-strip" aria-label="送出キュー">
          <em>
            <small>CUE</small>
            <strong>No.{String(state.totalTurn).padStart(2, '0')}</strong>
          </em>
          <em>
            <small>CALL</small>
            <strong>{RESPONSE_LABELS[insight.response]}</strong>
          </em>
        </div>
      </div>
      <ConsoleRunSheet state={state} />
      <div className="console-outlook">
        <span>送出見込み</span>
        <div className="console-outlook-line">
          <em className={`console-outlook-prep mark-${insight.prepRelationTone}`}>
            {prepConnectionLabel(insight.prepRelationTone)}
          </em>
          <strong>{insight.successRangeLabel}</strong>
        </div>
        <small>{insight.responseAimLabel}</small>
      </div>
      <ReadoutHud insight={insight} />
      <div className="console-log">
        <span>進行メモ</span>
        <p>{decisionMemo(insight)}</p>
      </div>
      {insight.frayRelationLabel ? (
        <div className={`console-fray relation-${insight.frayRelationTone}`}>
          <span>舞台裏のほころび</span>
          <strong>{insight.frayRelationLabel}</strong>
        </div>
      ) : null}
      {insight.actorTrustLabel ? (
        <div className="console-fray relation-recover">
          <span>役者との呼吸</span>
          <strong>{insight.actorTrustLabel}</strong>
        </div>
      ) : null}
    </aside>
  );
}

function ConsoleRunSheet({ state }: { state: GameState }) {
  const slotKey = state.turnInAct === 1 ? 'matinee' : 'soiree';
  const eventLabel = state.currentActorEvent ? EVENT_LABELS[state.currentActorEvent.type] : '未定';
  return (
    <div className="console-run-sheet" aria-label="進行表">
      <span>
        <small>ACT</small>
        <strong>{state.act}日目 / {PERFORMANCE_SLOT_LABELS[slotKey].label}</strong>
      </span>
      <span>
        <small>SCENE</small>
        <strong>{eventLabel}</strong>
      </span>
    </div>
  );
}

const tierOrder: ResultTier[] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];

function prepConnectionLabel(tone: ResponseInsight['prepRelationTone']) {
  if (tone === 'primary') return '準備が活きる';
  if (tone === 'alternate') return '準備外でも効く';
  return '準備と合わない';
}

function prepConnectionShortLabel(tone: ResponseInsight['prepRelationTone']) {
  if (tone === 'primary') return '準備活きる';
  if (tone === 'alternate') return '準備外で効く';
  return '準備合わず';
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

function ReadoutHud({ insight }: { insight: ResponseInsight }) {
  const affinity = affinityItems(insight);
  const effects = effectItems(insight);
  return (
    <div className="readout-hud" aria-label="選択中の相性と影響">
      <section className="affinity-board">
        <div className="console-module-head">
          <span>相性盤</span>
          <small>判定ランプ</small>
        </div>
        <div className="indicator-grid">
          {affinity.map((item) => (
            <em key={item.id} className={`readout-chip affinity-${item.tone}`} title={item.title} aria-label={item.title}>
              <span className="indicator-lamp" aria-hidden="true"><i /></span>
              <small>{item.label}</small>
              <strong><span>{item.rank}</span></strong>
            </em>
          ))}
        </div>
      </section>
      <section className="effect-board">
        <div className="console-module-head">
          <span>送出後の影響</span>
          <small>送出ゲージ</small>
        </div>
        <div className="effect-meter-grid">
          {effects.map((item) => (
            <em
              key={item.key}
              className={`effect-meter effect-${item.tone} direction-${effectDirection(item)} intensity-${effectIntensity(item)}`}
              title={item.title}
              aria-label={item.title}
            >
              <span className="effect-meter-label">
                {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
                <Icon name={item.icon} />
                <small>{effectTargetLabel(item.icon)}</small>
              </span>
              <span className="cue-meter" aria-hidden="true">
                <b>-</b>
                {effectLedSlots(item).map((isLit, index) => (
                  <i key={index} className={`${isLit ? 'is-lit' : ''} ${index === 2 ? 'is-center' : ''}`} />
                ))}
                <b>+</b>
              </span>
            </em>
          ))}
        </div>
      </section>
    </div>
  );
}

function affinityItems(insight: ResponseInsight) {
  const item = (id: string, icon: 'event' | 'actor' | 'state' | 'act', label: string, value: number) => ({
    id,
    icon,
    label,
    symbol: symbolForValue(value),
    rank: rankForValue(value),
    tone: toneForValue(value),
    title: `${label}: ${symbolForValue(value)} ${rankForValue(value)}`,
  });
  const value = (id: string) => insight.scoreBreakdown.find((entry) => entry.id === id)?.value ?? 0;
  return [
    item('event', 'event', '出来事', value('event')),
    item('actor', 'actor', '役者型', value('actor')),
    item('state', 'state', '状態', value('state')),
    item('act', 'act', '公演回', value('act')),
  ];
}

function symbolForValue(value: number) {
  if (value >= 3) return '◎';
  if (value > 0) return '○';
  if (value < 0) return '×';
  return '△';
}

function rankForValue(value: number) {
  if (value >= 3) return '強い';
  if (value > 0) return '合う';
  if (value < 0) return '注意';
  return '普通';
}

function toneForValue(value: number) {
  if (value >= 3) return 'strong';
  if (value > 0) return 'good';
  if (value < 0) return 'bad';
  return 'neutral';
}

function decisionMemo(insight: ResponseInsight) {
  const prep = insight.prepRelationTone === 'primary'
    ? '準備と正面から噛み合う'
    : insight.prepRelationTone === 'alternate'
      ? '準備の想定外でも効く'
      : '準備とは噛み合いにくい';
  const danger = insight.dangerWarning ? ` ${insight.downsideLabel}。` : '';
  const trust = insight.actorTrustLabel ? ` ${insight.actorTrustLabel}` : '';
  return `${prep}手。${insight.tacticalSummary}。${insight.responseAimLabel}。見込みは${insight.successRangeLabel}。影響は${effectSummary(insight)}。${trust}${danger}`;
}

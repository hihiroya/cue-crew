import { useMemo, useState } from 'react';
import { RESPONSE_LABELS, RESULT_TIER_LABELS } from '../../game/constants';
import { responseInsight } from '../../game/responseInsight';
import type { GameState, MainResponse, ResponseInsight, ResultTier } from '../../game/types';
import { Icon } from '../ui/Icon';
import { effectDirection, effectIntensity, effectItems, effectLedSlots, effectSummary, effectTargetLabel, evaluationSign } from './responseEffectsView';
import { buildStyleSummary, responseBuildCue } from '../../game/rogueliteProgress';
import {
  affinityLabels,
  decisionMemo,
  effectTargetShortLabel,
  prepConnectionLabel,
  prepConnectionShortLabel,
  rangeShortLabel,
  responsePanelCopy,
  responseSendAria,
  resultRangeIndices,
  runSheetActLabel,
  runSheetEventLabel,
  rankForValue,
} from '../../content/ja/responsePanelCopy';

export { PrepPanel } from './PrepPanel';

const responses: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];

type ResponseProps = {
  selected: MainResponse | null;
  disabled: boolean;
  state: GameState;
  previousResponse?: MainResponse | null;
  onSelect: (response: MainResponse) => void;
};

export function ResponsePanel({ selected, disabled, state, previousResponse = null, onSelect }: ResponseProps) {
  const insights = useMemo(
    () => responses.map((response) => responseInsight(state, response)),
    [state],
  );
  const buildStyle = useMemo(() => buildStyleSummary(state.logs, state.performanceStyle), [state.logs, state.performanceStyle]);
  const [inspectedResponse, setInspectedResponse] = useState<MainResponse>(selected ?? 'catch');
  const inspected = insights.find((insight) => insight.response === inspectedResponse) ?? insights[0];
  return (
    <section className="choice-panel response-panel">
      <div className="section-heading">
        <h2>{responsePanelCopy.heading}</h2>
      </div>
      <div className="choice-grid response-grid">
        {insights.map((insight) => (
          <ResponseChoiceCard
            key={insight.response}
            disabled={disabled}
            insight={insight}
            buildCue={responseBuildCue(insight.response, buildStyle)}
            wasPrevious={previousResponse === insight.response}
            isInspected={inspected.response === insight.response}
            onInspect={setInspectedResponse}
          />
        ))}
      </div>
      <ResponseSendBar disabled={disabled} response={inspected.response} onSelect={onSelect} />
      <ResponseConsole insight={inspected} state={state} buildCue={responseBuildCue(inspected.response, buildStyle)} />
    </section>
  );
}

function ResponseSelectionMarker({ visible }: { visible: boolean }) {
  return (
    <em className={`selection-marker selection-marker--response ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {visible ? responsePanelCopy.inspecting : ''}
    </em>
  );
}

function ResponseChoiceCard({
  disabled,
  insight,
  buildCue,
  wasPrevious,
  isInspected,
  onInspect,
}: {
  disabled: boolean;
  insight: ResponseInsight;
  buildCue: string;
  wasPrevious: boolean;
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
      <div className="outlook-summary" aria-label={responsePanelCopy.outlookAria(insight.successRangeLabel)}>
        <div className="outlook-head">
          <span><Icon name="scene" />{rangeShortLabel(insight.resultTier)}</span>
          <em className={`response-prep-mark mark-${insight.prepRelationTone}`} aria-label={responsePanelCopy.prepRelationAria(insight.prepRelationLabel)}>
            {prepConnectionShortLabel(insight.prepRelationTone)}
          </em>
        </div>
        <ResultRail range={range} resultTier={insight.resultTier} danger={Boolean(insight.dangerWarning)} />
      </div>
      <ResponseEffectSummary insight={insight} />
      <div className="response-build-cue">
        <span>{responsePanelCopy.buildCue}</span>
        <strong>{buildCue}</strong>
      </div>
      {wasPrevious ? <em className="replay-ghost-mark">{responsePanelCopy.previousCue}</em> : null}
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
    <div className="response-effect-summary" aria-label={responsePanelCopy.effectSummaryAria}>
      <span>{responsePanelCopy.effectSummaryTitle}</span>
      <div>
        {effects.map((item) => (
          <em key={item.key} className={`response-effect-mini effect-${item.tone}`} title={item.title} aria-label={item.title}>
            {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
            <Icon name={item.icon} />
            <strong>{effectTargetShortLabel(item.icon)}</strong>
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
    <div className="response-send-bar" aria-label={responseSendAria(response)}>
      <button className="primary-action decision-action cue-send-action" disabled={disabled} onClick={() => onSelect(response)}>
        <span className="cue-lamp-face cue-lamp-ready" aria-hidden="true" />
        <span className="cue-send-label">{responsePanelCopy.sendButton}</span>
        <span className="cue-lamp-face cue-lamp-send" aria-hidden="true" />
      </button>
    </div>
  );
}

function ResponseConsole({ insight, state, buildCue }: { insight: ResponseInsight; state: GameState; buildCue: string }) {
  return (
    <aside className={`decision-note response-console relation-${insight.prepRelationTone}`}>
      <div className="console-head">
        <span>{responsePanelCopy.consoleTitle}</span>
        <div className="console-cue-strip" aria-label={responsePanelCopy.cueStripAria}>
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
        <span>{responsePanelCopy.outlookTitle}</span>
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
        <span>{responsePanelCopy.logTitle}</span>
        <p>{decisionMemo(insight, effectSummary(insight))}</p>
      </div>
      <div className="console-fray relation-recover">
        <span>{responsePanelCopy.buildCue}</span>
        <strong>{buildCue}</strong>
      </div>
      {insight.frayRelationLabel ? (
        <div className={`console-fray relation-${insight.frayRelationTone}`}>
          <span>{responsePanelCopy.frayTitle}</span>
          <strong>{insight.frayRelationLabel}</strong>
        </div>
      ) : null}
      {insight.actorTrustLabel ? (
        <div className="console-fray relation-recover">
          <span>{responsePanelCopy.passiveTitle}</span>
          <strong>{insight.actorTrustLabel}</strong>
        </div>
      ) : null}
    </aside>
  );
}

function ConsoleRunSheet({ state }: { state: GameState }) {
  return (
    <div className="console-run-sheet" aria-label={responsePanelCopy.runSheetAria}>
      <span>
        <small>ACT</small>
        <strong>{runSheetActLabel(state)}</strong>
      </span>
      <span>
        <small>SCENE</small>
        <strong>{runSheetEventLabel(state)}</strong>
      </span>
    </div>
  );
}

const tierOrder: ResultTier[] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];

function resultRange(insight: ResponseInsight) {
  return resultRangeIndices(insight.successRangeLabel);
}

function ResultRail({ range, resultTier, danger }: { range: { lowIndex: number; highIndex: number }; resultTier: ResultTier; danger: boolean }) {
  const currentIndex = tierOrder.indexOf(resultTier);
  return (
    <div className={`result-rail ${danger ? 'has-danger' : ''}`} aria-label={responsePanelCopy.resultRailAria}>
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
    <div className="readout-hud" aria-label={responsePanelCopy.readoutAria}>
      <section className="affinity-board">
        <div className="console-module-head">
          <span>{responsePanelCopy.affinityBoardTitle}</span>
          <small>{responsePanelCopy.affinityBoardSub}</small>
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
          <span>{responsePanelCopy.effectBoardTitle}</span>
          <small>{responsePanelCopy.effectBoardSub}</small>
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
  return affinityLabels().map((label) => item(label.id, label.icon, label.label, value(label.id)));
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

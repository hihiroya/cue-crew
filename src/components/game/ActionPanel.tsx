import { useMemo, useState } from 'react';
import { RESPONSE_LABELS } from '../../game/constants';
import type { GameState, MainResponse, ResponseInsight, TurnLog } from '../../game/types';
import { Icon } from '../ui/Icon';
import { classNames } from '../ui/classNames';
import { effectDirection, effectIntensity, effectItems, effectLedSlots, effectSummary, effectTargetLabel, evaluationSign } from './responseEffectsView';
import {
  affinityLabels,
  decisionMemo,
  prepConnectionLabel,
  prepConnectionShortLabel,
  responsePanelCopy,
  responseSendAria,
  resultRangeIndices,
  runSheetActLabel,
  runSheetEventLabel,
  rankForValue,
} from '../../content/ja/responsePanelCopy';
import { PERFORMANCE_COLOR_HUD } from '../../content/ja/gameHeaderCopy';
import { RESULT_TIER_LABELS } from '../../content/ja/gameLabels';
import styles from './ActionPanel.module.css';
import { buildResponsePanelViewModel } from './responsePanelViewModel';

export { PrepPanel } from './PrepPanel';

type ResponseProps = {
  selected: MainResponse | null;
  disabled: boolean;
  state: GameState;
  previousTurnLog?: TurnLog | null;
  onSelect: (response: MainResponse) => void;
};

export function ResponsePanel({ selected, disabled, state, previousTurnLog = null, onSelect }: ResponseProps) {
  const viewModel = useMemo(() => buildResponsePanelViewModel(state, previousTurnLog), [state, previousTurnLog]);
  const [inspectedResponse, setInspectedResponse] = useState<MainResponse>(selected ?? 'catch');
  const inspected = viewModel.insights.find((insight) => insight.response === inspectedResponse) ?? viewModel.insights[0];
  const inspectedDetails = viewModel.detailsByResponse[inspected.response];
  return (
    <section className={styles.responseRoot}>
      <div className="section-heading">
        <h2>{responsePanelCopy.heading}</h2>
      </div>
      <div className={styles.responseGrid}>
        {viewModel.insights.map((insight) => (
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
      <ResponseConsole
        insight={inspected}
        state={state}
        buildCue={inspectedDetails.buildCue}
        replayDelta={inspectedDetails.replayDelta}
      />
    </section>
  );
}

function ResponseSelectionMarker({ visible }: { visible: boolean }) {
  return (
    <em className={`selection-marker selection-marker--response ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {visible ? responsePanelCopy.marker : ''}
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
  return (
    <button
      aria-pressed={isInspected}
      className={classNames(styles.responseChoice, `fit-${insight.rangeTone}`, isInspected && styles.selected)}
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
          <em className={`response-prep-mark mark-${insight.prepRelationTone}`} aria-label={responsePanelCopy.prepRelationAria(insight.prepRelationLabel)}>
            {prepConnectionShortLabel(insight.prepRelationTone)}
          </em>
        </div>
      </div>
      <ResultRail insight={insight} variant="card" />
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
    <div className="response-effect-summary" aria-label={responsePanelCopy.effectSummaryAria}>
      <span>{responsePanelCopy.effectSummaryTitle}</span>
      <div>
        {effects.map((item) => (
          <em key={item.key} className={`response-effect-mini effect-${item.tone}`} title={item.title} aria-label={item.title}>
            {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
            <Icon name={item.icon} />
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
    <div className={styles.sendBar} aria-label={responseSendAria(response)}>
      <button className={styles.decisionAction} disabled={disabled} onClick={() => onSelect(response)}>
        <span className="cue-lamp-face cue-lamp-ready" aria-hidden="true" />
        <span className="cue-send-label">{responsePanelCopy.sendButton}</span>
        <span className="cue-lamp-face cue-lamp-send" aria-hidden="true" />
      </button>
    </div>
  );
}

function ResponseConsole({
  insight,
  state,
  buildCue,
  replayDelta,
}: {
  insight: ResponseInsight;
  state: GameState;
  buildCue: string;
  replayDelta: ReturnType<typeof buildResponsePanelViewModel>['detailsByResponse'][MainResponse]['replayDelta'];
}) {
  const buildLevelItem = insight.scoreBreakdown.find((item) => item.id === 'build-level');
  const styleHud = getStyleHud(state.performanceStyle);
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
            <small>ACT</small>
            <strong>{runSheetActLabel(state)}</strong>
          </em>
          <em>
            <small>CALL</small>
            <strong>{RESPONSE_LABELS[insight.response]}</strong>
          </em>
        </div>
      </div>
      <ConsoleRunSheet state={state} styleHud={styleHud} buildCue={buildCue} />
      <ResultRail insight={insight} variant="console" />
      <ReadoutHud insight={insight} />
      <div className="console-log">
        <span>{responsePanelCopy.logTitle}</span>
        <p>{decisionMemo(insight, effectSummary(insight))}</p>
      </div>
      {buildLevelItem ? (
        <div className="console-fray relation-recover">
          <span>{responsePanelCopy.buildLevel}</span>
          <strong>{buildLevelItem.label} {buildLevelItem.value > 0 ? `+${buildLevelItem.value}` : buildLevelItem.value}</strong>
        </div>
      ) : null}
      {replayDelta ? (
        <div className={`console-fray replay-console-delta delta-${replayDelta.tone}`}>
          <span>{responsePanelCopy.replayDelta}</span>
          <strong>{replayDelta.label}</strong>
        </div>
      ) : null}
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

function ResultRail({ insight, variant }: { insight: ResponseInsight; variant: 'card' | 'console' }) {
  const range = resultRangeIndices(insight.successRangeLabel);
  const tiers = resultTierOrder();
  const currentIndex = tiers.indexOf(insight.resultTier);
  return (
    <div className={`result-rail-box result-rail-box--${variant}`} aria-label={`${responsePanelCopy.resultRailAria}: ${insight.successRangeLabel}`}>
      <div className="result-rail-head">
        {variant === 'console' ? <span>{responsePanelCopy.outlookTitle}</span> : null}
        {variant === 'console' ? (
          <em className={`console-outlook-prep mark-${insight.prepRelationTone}`}>
            {prepConnectionLabel(insight.prepRelationTone)}
          </em>
        ) : null}
        <strong>{insight.successRangeLabel}</strong>
      </div>
      <div className={`result-rail has-${insight.rangeTone}`} aria-hidden="true">
        {tiers.map((tier, index) => (
          <span
            key={tier}
            className={[
              index >= range.lowIndex && index <= range.highIndex ? 'is-in-range' : '',
              index === currentIndex ? 'is-current' : '',
            ].filter(Boolean).join(' ')}
          />
        ))}
      </div>
      {variant === 'console' ? (
        <div className="result-rail-labels" aria-hidden="true">
          {tiers.map((tier) => <span key={tier}>{RESULT_TIER_LABELS[tier]}</span>)}
        </div>
      ) : null}
    </div>
  );
}

function ConsoleRunSheet({
  state,
  styleHud,
  buildCue,
}: {
  state: GameState;
  styleHud: ReturnType<typeof getStyleHud>;
  buildCue: string;
}) {
  return (
    <div className="console-run-sheet" aria-label={responsePanelCopy.runSheetAria}>
      <span className={styleHud ? `style-${styleHud.tone}` : ''}>
        <small>STYLE</small>
        <strong>{styleHud?.label ?? responsePanelCopy.pendingStyle}</strong>
        <b>{buildCue}</b>
      </span>
      <span className="console-scene-cell">
        <small>SCENE</small>
        <strong>{runSheetEventLabel(state)}</strong>
      </span>
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

function getStyleHud(style: GameState['performanceStyle']) {
  return style ? PERFORMANCE_COLOR_HUD[style] : null;
}

function resultTierOrder(): ResponseInsight['resultTier'][] {
  return ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];
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

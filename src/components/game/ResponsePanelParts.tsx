import { signedDisplayScore } from '../../game/scoreDisplay';
import type { ActorEventType, GameState, MainResponse, ResponseInsight } from '../../game/types';
import type { ResponseReplayDelta } from '../../game/rogueliteProgress';
import { Icon } from '../ui/Icon';
import { classNames } from '../ui/classNames';
import { effectDirection, effectIntensity, effectItems, effectLedSlots, effectTargetLabel, evaluationSign, type EffectTone } from './responseEffectsView';
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
import { RESPONSE_EFFECT_SUMMARIES, RESPONSE_LABELS, RESULT_TIER_LABELS } from '../../content/ja/gameLabels';
import { backstageLogCopy, backstageResponseLog } from '../../content/ja/backstageLogCopy';
import { responseChoiceStory } from '../../content/ja/choiceStoryCopy';
import { cueSurgeCopy } from '../../content/ja/cueSurgeCopy';
import styles from './ActionPanel.module.css';

export function ResponseChoiceCard({
  disabled,
  event,
  insight,
  isInspected,
  readTone,
  onInspect,
}: {
  disabled: boolean;
  event?: ActorEventType | null;
  insight: ResponseInsight;
  isInspected: boolean;
  readTone: 'hit' | 'partial' | 'miss' | null;
  onInspect: (response: MainResponse) => void;
}) {
  const response = insight.response;
  const story = responseChoiceStory(event, response);
  return (
    <button
      aria-pressed={isInspected}
      className={classNames(
        styles.responseChoice,
        responseRangeToneClass[insight.rangeTone],
        responseKindClass[response],
        readTone && responseReadToneClass[readTone],
        isInspected && styles.selected,
      )}
      disabled={disabled}
      onClick={() => onInspect(response)}
      onFocus={() => onInspect(response)}
    >
      <div className="response-card-top">
        <Icon name={response} />
        <span className="response-title">
          <strong>{RESPONSE_LABELS[response]}</strong>
          <em>{RESPONSE_EFFECT_SUMMARIES[response]}</em>
        </span>
      </div>
      <div className="choice-story-tags choice-story-tags--response" aria-label={cueSurgeCopy.responseCautionAria}>
        <em><span>{cueSurgeCopy.responseSceneLabel}</span>{story.title}</em>
        <em><span>{cueSurgeCopy.responseCautionLabel}</span>{story.caution}</em>
      </div>
      <div className={classNames('surge-badge response-surge-badge', `surge-${insight.cueSurge.responseLevel}`, `cost-${insight.cueSurge.costLevel}`)} aria-label={`${responsePanelCopy.surgeTitle}: ${insight.cueSurge.label} / ${insight.cueSurge.costLabel}`}>
        <span>{responsePanelCopy.surgeTitle}</span>
        <strong>{insight.cueSurge.label}</strong>
        <em>{insight.cueSurge.costLabel}</em>
      </div>
      <div className="outlook-summary" aria-label={responsePanelCopy.outlookAria(insight.successRangeLabel)}>
        <div className="outlook-head">
          <em className={classNames('response-prep-mark', prepRelationMarkClass[insight.prepRelationTone])} aria-label={responsePanelCopy.prepRelationAria(insight.prepRelationLabel)}>
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

export function ResponseSendBar({
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

export function ResponseConsole({
  insight,
  state,
  buildCue,
  replayDelta,
}: {
  insight: ResponseInsight;
  state: GameState;
  buildCue: string;
  replayDelta: ResponseReplayDelta | null;
}) {
  const buildLevelItem = insight.scoreBreakdown.find((item) => item.id === 'build-level');
  const styleHud = getStyleHud(state.performanceStyle);
  const backstageNote = backstageResponseLog(state, insight.response);
  return (
    <aside className={classNames('decision-note response-console', relationToneClass[insight.prepRelationTone])}>
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
        <p>{decisionMemo(insight)}</p>
      </div>
      <div className={classNames('console-fray console-surge', `surge-${insight.cueSurge.responseLevel}`, `cost-${insight.cueSurge.costLevel}`)}>
        <span>{responsePanelCopy.surgeTitle}</span>
        <strong>{insight.cueSurge.label} / {insight.cueSurge.costLabel}</strong>
        <p>{insight.cueSurge.detail}</p>
        {insight.cueSurge.reasons.length ? (
          <div className="console-surge-tags">
            {insight.cueSurge.reasons.map((reason) => <em key={reason}>{reason}</em>)}
          </div>
        ) : null}
        {insight.cueSurge.risks.length ? (
          <div className="console-surge-tags is-risk">
            {insight.cueSurge.risks.map((risk) => <em key={risk}>{risk}</em>)}
          </div>
        ) : null}
      </div>
      <aside className="backstage-log-note backstage-log-note--console">
        <span>{backstageLogCopy.label}</span>
        <p>{backstageNote}</p>
      </aside>
      {buildLevelItem ? (
        <div className="console-fray relation-recover">
          <span>{responsePanelCopy.buildLevel}</span>
          <strong>{buildLevelItem.label} {signedDisplayScore(buildLevelItem.value)}</strong>
        </div>
      ) : null}
      {replayDelta ? (
        <div className={classNames('console-fray replay-console-delta', replayDeltaToneClass[replayDelta.tone])}>
          <span>{responsePanelCopy.replayDelta}</span>
          <strong>{replayDelta.label}</strong>
        </div>
      ) : null}
      {insight.frayRelationLabel ? (
        <div className={classNames('console-fray', insight.frayRelationTone ? relationToneClass[insight.frayRelationTone] : '')}>
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

function ResponseSelectionMarker({ visible }: { visible: boolean }) {
  return (
    <em className={classNames('selection-marker selection-marker--response', visible && 'is-visible')} aria-hidden={!visible}>
      {visible ? responsePanelCopy.marker : ''}
    </em>
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
          <em key={item.key} className={classNames('response-effect-mini', effectToneClass[item.tone])} title={item.title} aria-label={item.title}>
            {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
            <Icon name={item.icon} />
            <b>{evaluationSign(item)}</b>
          </em>
        ))}
      </div>
    </div>
  );
}

function ResultRail({ insight, variant }: { insight: ResponseInsight; variant: 'card' | 'console' }) {
  const range = resultRangeIndices(insight.successRangeLabel);
  const tiers = resultTierOrder();
  const currentIndex = tiers.indexOf(insight.resultTier);
  return (
    <div className={classNames('result-rail-box', resultRailBoxVariantClass[variant])} aria-label={`${responsePanelCopy.resultRailAria}: ${insight.successRangeLabel}`}>
      <div className="result-rail-head">
        {variant === 'console' ? <span>{responsePanelCopy.outlookTitle}</span> : null}
        {variant === 'console' ? (
          <em className={classNames('console-outlook-prep', prepRelationMarkClass[insight.prepRelationTone])}>
            {prepConnectionLabel(insight.prepRelationTone)}
          </em>
        ) : null}
        <strong>{insight.successRangeLabel}</strong>
      </div>
      <div className={classNames('result-rail', resultRailToneClass[insight.rangeTone])} aria-hidden="true">
        {tiers.map((tier, index) => (
          <span
            key={tier}
            className={classNames(
              index >= range.lowIndex && index <= range.highIndex && 'is-in-range',
              index === currentIndex && 'is-current',
            )}
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
  const styleBuildBadge = styleHud ? compactStyleBuildCue(styleHud.label, buildCue) : buildCue;
  return (
    <div className="console-run-sheet" aria-label={responsePanelCopy.runSheetAria}>
      <span className={state.performanceStyle ? performanceStyleClass[state.performanceStyle] : ''}>
        <small>STYLE</small>
        <span className="style-value-line">
          <strong>{styleHud?.label ?? responsePanelCopy.pendingStyle}</strong>
          {styleBuildBadge ? <b>{styleBuildBadge}</b> : null}
        </span>
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
            <em key={item.id} className={classNames('readout-chip', affinityToneClass[item.tone])} title={item.title} aria-label={item.title}>
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
              className={classNames('effect-meter', effectToneClass[item.tone], effectDirectionClass[effectDirection(item)], effectIntensityClass[effectIntensityLevel(item)])}
              title={item.title}
              aria-label={item.title}
            >
              <span className="effect-meter-label">
                <small>{effectTargetLabel(item.icon)}</small>
                <span className="effect-meter-icons" aria-hidden="true">
                  {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
                  <Icon name={item.icon} />
                </span>
              </span>
              <span className="cue-meter" aria-hidden="true">
                <b>-</b>
                {effectLedSlots(item).map((isLit, index) => (
                  <i key={index} className={classNames(isLit && 'is-lit', index === 2 && 'is-center')} />
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

function compactStyleBuildCue(styleLabel: string, buildCue: string) {
  const repeatedStyleCue = `${styleLabel} +`;
  if (buildCue === repeatedStyleCue) return '+';
  return buildCue;
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

type AffinityTone = 'strong' | 'good' | 'bad' | 'neutral';
type EffectDirection = ReturnType<typeof effectDirection>;
type EffectIntensity = 0 | 1 | 2;

function toneForValue(value: number): AffinityTone {
  if (value >= 3) return 'strong';
  if (value > 0) return 'good';
  if (value < 0) return 'bad';
  return 'neutral';
}

function effectIntensityLevel(item: Parameters<typeof effectIntensity>[0]): EffectIntensity {
  return effectIntensity(item) as EffectIntensity;
}

const responseRangeToneClass: Record<ResponseInsight['rangeTone'], string> = {
  best: 'fit-best',
  good: 'fit-good',
  thin: 'fit-risky',
  danger: 'fit-danger',
};

const responseKindClass: Record<MainResponse, string> = {
  catch: 'response-catch',
  arrange: 'response-arrange',
  wait: 'response-wait',
  cut: 'response-cut',
};

const responseReadToneClass: Record<'hit' | 'partial' | 'miss', string> = {
  hit: 'read-card-hit',
  partial: 'read-card-partial',
  miss: 'read-card-miss',
};

const relationToneClass: Record<ResponseInsight['prepRelationTone'] | NonNullable<ResponseInsight['frayRelationTone']>, string> = {
  primary: 'relation-primary',
  alternate: 'relation-alternate',
  poor: 'relation-poor',
  recover: 'relation-recover',
  miss: 'relation-miss',
};

const prepRelationMarkClass: Record<ResponseInsight['prepRelationTone'], string> = {
  primary: 'mark-primary',
  alternate: 'mark-alternate',
  poor: 'mark-poor',
};

const effectToneClass: Record<EffectTone, string> = {
  good: 'effect-good',
  watch: 'effect-watch',
  bad: 'effect-bad',
  neutral: 'effect-neutral',
};

const affinityToneClass: Record<AffinityTone, string> = {
  strong: 'affinity-strong',
  good: 'affinity-good',
  bad: 'affinity-bad',
  neutral: 'affinity-neutral',
};

const effectDirectionClass: Record<EffectDirection, string> = {
  up: 'direction-up',
  down: 'direction-down',
  flat: 'direction-flat',
};

const effectIntensityClass: Record<EffectIntensity, string> = {
  0: 'intensity-0',
  1: 'intensity-1',
  2: 'intensity-2',
};

const replayDeltaToneClass: Record<'up' | 'same' | 'down', string> = {
  up: 'delta-up',
  same: 'delta-same',
  down: 'delta-down',
};

const resultRailBoxVariantClass: Record<'card' | 'console', string> = {
  card: 'result-rail-box--card',
  console: 'result-rail-box--console',
};

const resultRailToneClass: Record<ResponseInsight['rangeTone'], string> = {
  best: 'has-best',
  good: 'has-good',
  thin: 'has-risky',
  danger: 'has-danger',
};

const performanceStyleClass: Record<NonNullable<GameState['performanceStyle']>, string> = {
  heat: 'style-heat',
  breath: 'style-breath',
  control: 'style-control',
  closure: 'style-closure',
};

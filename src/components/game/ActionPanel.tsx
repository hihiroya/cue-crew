import { useMemo, useState } from 'react';
import { EVENT_LABELS, PERFORMANCE_SLOT_LABELS, PREP_LABELS, PREP_MATCHES, PREP_PRIMARY_RESPONSE, PREP_RESPONSE_HINTS, RESPONSE_LABELS, RESULT_TIER_LABELS } from '../../game/constants';
import { responseInsight } from '../../game/scoring';
import type { ActorEventType, GameState, MainResponse, PrepAction, ResponseInsight, ResultTier } from '../../game/types';
import { Icon } from '../ui/Icon';

type PrepProps = {
  selected: PrepAction | null;
  disabled: boolean;
  approvingPrep: PrepAction | null;
  visibleOmens: ActorEventType[];
  onSelect: (prep: PrepAction) => void;
};

const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
const responses: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];
type PrepTone = 'strong' | 'good' | 'thin' | 'danger';

export function PrepPanel({ selected, disabled, approvingPrep, visibleOmens, onSelect }: PrepProps) {
  const [inspectedPrep, setInspectedPrep] = useState<PrepAction>(selected ?? 'watch');
  const inspected = inspectedPrep;
  const isApproving = approvingPrep === inspected;
  const inspectedCoveredOmens = visibleOmens.filter((event) => PREP_MATCHES[inspected].includes(event));
  const inspectedTone = prepTone(inspectedCoveredOmens.length, visibleOmens.length);
  return (
    <section className={`choice-panel prep-panel ${isApproving ? 'is-approving' : ''}`}>
      <div className="section-heading">
        <h2>準備を決める</h2>
        <small>役者の兆候を見て、本番中の想定外に備える準備を選ぶ。</small>
      </div>
      <div className="choice-grid">
        {prepActions.map((prep) => {
          const coveredOmens = visibleOmens.filter((event) => PREP_MATCHES[prep].includes(event));
          const tone = prepTone(coveredOmens.length, visibleOmens.length);
          const isInspected = inspected === prep;
          return (
            <button
              key={prep}
              aria-pressed={isInspected}
              className={`choice-button prep-choice cue-${tone} ${isInspected ? 'is-selected' : ''}`}
              disabled={disabled}
              onClick={() => setInspectedPrep(prep)}
              onFocus={() => setInspectedPrep(prep)}
            >
              <div className="prep-card-top">
                <Icon name={prep} />
                <span className="prep-title">
                  <strong>{PREP_LABELS[prep]}</strong>
                  <em>本番で{RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[prep]]}と活きる</em>
                </span>
              </div>
              <div className="cue-cover">
                <span>兆候との相性</span>
                <strong>{prepToneLabel(tone)}</strong>
              </div>
              <PrepSelectionMarker visible={isInspected} />
            </button>
          );
        })}
      </div>
      <aside className={`cue-sheet cue-${inspectedTone} ${isApproving ? 'is-approving' : ''}`}>
        <div className="cue-paper">
          <div className="cue-sheet-head">
            <span>本番前メモ</span>
            <strong>{PREP_LABELS[inspected]}の準備</strong>
          </div>
          <div className="cue-sheet-grid cue-sheet-focus">
            <section>
              <span>見えている兆候</span>
              <div className="cue-readiness-list">
                {visibleOmens.map((event) => {
                  const isCovered = PREP_MATCHES[inspected].includes(event);
                  return (
                    <em key={event} className={isCovered ? 'is-covered' : 'is-missed'}>
                      <span className="cue-check" aria-hidden="true">{isCovered ? '✓' : ''}</span>
                      <span>{EVENT_LABELS[event]}</span>
                      <b>{isCovered ? '準備済み' : '対象外'}</b>
                    </em>
                  );
                })}
              </div>
            </section>
            {prepExtraEvents(inspected, visibleOmens).length ? (
              <section>
                <span>同じ準備で拾える出来事</span>
                <div className="cue-tags">
                  {prepExtraEvents(inspected, visibleOmens).map((event) => (
                    <em key={event}>{EVENT_LABELS[event]}</em>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <div className="cue-read">
            <p>{prepReadMemo(inspected, inspectedCoveredOmens.length, visibleOmens.length)}</p>
            <div className="cue-note-branches">
              <section>
                <span>備えどおりに来たら</span>
                <p><strong>{RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[inspected]]}</strong>で受ける。{PREP_RESPONSE_HINTS[inspected].aim}。</p>
              </section>
              <section>
                <span>外れたら</span>
                <p>{PREP_RESPONSE_HINTS[inspected].alternate}。</p>
              </section>
            </div>
          </div>
          <div className={`cue-approval-slot ${isApproving ? 'is-approved' : ''}`} aria-label="承認欄" aria-live="polite">
            <span>承認欄</span>
            <strong>{isApproving ? '承認済' : '未承認'}</strong>
          </div>
        </div>
      </aside>
      <div className="prep-commit-bar">
        <button className="primary-action prep-commit-action" disabled={disabled} onClick={() => onSelect(inspected)}>
          この準備で本番へ
        </button>
      </div>
    </section>
  );
}

function prepExtraEvents(prep: PrepAction, visibleOmens: ActorEventType[]) {
  return PREP_MATCHES[prep].filter((event) => !visibleOmens.includes(event));
}

function prepTone(covered: number, total: number): PrepTone {
  if (covered >= 2) return 'strong';
  if (covered === 1) return 'good';
  if (total === 0) return 'thin';
  return 'danger';
}

function prepToneLabel(tone: PrepTone) {
  if (tone === 'strong') return '見えている兆候に合う';
  if (tone === 'good') return '一部に備えあり';
  if (tone === 'thin') return '別筋に備える';
  return '今の兆候とは遠い';
}

function prepReadMemo(prep: PrepAction, covered: number, _total: number) {
  if (covered >= 2) {
    return '見えている兆候に備えが入っている。起きた出来事を、次の対応へつなぎやすい準備。';
  }
  if (covered === 1) {
    return '見えている兆候の一部に備えている。備えが外れた時の受け方も残す準備。';
  }
  if (prep === 'prepareTransition') {
    return '今見えている兆候とは別筋だが、崩れを小さく閉じるための準備。高負荷になる前に退路を残す。';
  }
  return '今見えている兆候とは別筋。役者の出来事が違う方向へ動いた時に備える準備。';
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

function PrepSelectionMarker({ visible }: { visible: boolean }) {
  return (
    <em className={`selection-marker selection-marker--prep ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {visible ? 'メモ反映中' : ''}
    </em>
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
        </span>
      </div>
      <div className="outlook-summary" aria-label={`成立見込み: ${insight.successRangeLabel}`}>
        <div className="outlook-head">
          <span><Icon name="scene" />{compactAim(insight)}</span>
          <strong>{insight.successRangeLabel}</strong>
          <em className={`prep-mark mark-${insight.prepRelationTone}`} aria-label={`準備との関係: ${insight.prepRelationLabel}`}>
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
  const effects = effectItems(insight);
  return (
    <div className="card-effect-summary response-effect-summary" aria-label="影響の要約">
      <span>影響</span>
      <div>
        {effects.map((item) => (
          <em key={item.key} className={`effect-mini effect-${item.tone}`} title={item.title} aria-label={item.title}>
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

function compactAim(insight: ResponseInsight) {
  if (insight.resultTier === 'masterpiece') return '名場面';
  if (insight.resultTier === 'scene') return '場面化';
  if (insight.resultTier === 'smallSuccess') return '小成功';
  if (insight.resultTier === 'fray') return '崩れ抑え';
  return '事故回避';
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
  const changeLabel = effectChangeLabel(value);
  const title = `${repeat ? '連続使用: ' : ''}${effectTargetLabel(icon)} ${changeLabel}`;
  return {
    key: `${repeat ? 'repeat-' : ''}${raw}`,
    icon,
    raw,
    title,
    tone,
    value,
    repeat,
  };
}

function effectChangeLabel(value: number) {
  if (value >= 2) return '大きく増える';
  if (value === 1) return '増える';
  if (value === 0) return '維持';
  if (value === -1) return '減る';
  return '大きく減る';
}

function effectTone(icon: EffectIcon, value: number): EffectTone {
  if (value === 0) return 'neutral';
  if (icon === 'load') {
    if (value < 0) return 'good';
    return value >= 2 ? 'bad' : 'watch';
  }
  return value > 0 ? 'good' : 'bad';
}

function evaluationValue(item: EffectItem) {
  if (item.icon === 'load') return -item.value;
  return item.value;
}

function evaluationSign(item: EffectItem) {
  const value = evaluationValue(item);
  if (value > 0) return '+';
  if (value < 0) return '-';
  return '±';
}

function effectTargetLabel(icon: EffectIcon) {
  if (icon === 'load') return '負荷';
  if (icon === 'trust') return '信頼';
  return '流れ';
}

function effectDirection(item: EffectItem) {
  if (item.value > 0) return 'up';
  if (item.value < 0) return 'down';
  return 'flat';
}

function effectIntensity(item: EffectItem) {
  return Math.min(2, Math.abs(item.value));
}

function effectLedSlots(item: EffectItem) {
  const magnitude = effectIntensity(item);
  if (item.value > 0) return [false, false, true, true, magnitude >= 2];
  if (item.value < 0) return [magnitude >= 2, true, true, false, false];
  return [false, false, true, false, false];
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

function signedEffectValue(item: EffectItem) {
  if (item.value > 0) return `+${item.value}`;
  if (item.value < 0) return String(item.value);
  return '±0';
}

function decisionMemo(insight: ResponseInsight) {
  const prep = insight.prepRelationTone === 'primary'
    ? '準備と正面から噛み合う'
    : insight.prepRelationTone === 'alternate'
      ? '準備の想定外でも効く'
      : '準備とは噛み合いにくい';
  const danger = insight.dangerWarning ? ` ${insight.downsideLabel}。` : '';
  return `${prep}手。${insight.responseAimLabel}。見込みは${insight.successRangeLabel}。影響は${effectSummary(insight)}。${danger}`;
}

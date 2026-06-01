import { useMemo, useState } from 'react';
import { EVENT_LABELS, PREP_LABELS, PREP_MATCHES, PREP_PRIMARY_RESPONSE, PREP_RESPONSE_HINTS, RESPONSE_LABELS, RESULT_TIER_LABELS } from '../../game/constants';
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
type PrepTone = 'strong' | 'good' | 'thin' | 'danger';

export function PrepPanel({ selected, disabled, visibleOmens, onSelect }: PrepProps) {
  const [inspectedPrep, setInspectedPrep] = useState<PrepAction>(selected ?? 'watch');
  const inspected = inspectedPrep;
  const inspectedCoveredOmens = visibleOmens.filter((event) => PREP_MATCHES[inspected].includes(event));
  const inspectedTone = prepTone(inspectedCoveredOmens.length, visibleOmens.length);
  return (
    <section className="choice-panel">
      <div className="section-heading">
        <p>一手目</p>
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
                  <em>本番対応 {RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[prep]]}</em>
                </span>
              </div>
              <div className="cue-cover">
                <span>今の兆候への備え</span>
                <strong>{prepToneLabel(tone)}</strong>
              </div>
              <em className={`selected-card-bar ${isInspected ? 'is-visible' : ''}`} aria-hidden={!isInspected}>
                {isInspected ? '準備候補' : ''}
              </em>
            </button>
          );
        })}
      </div>
      <aside className={`cue-sheet cue-${inspectedTone}`}>
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
          <div className="cue-approval-slot" aria-label="承認欄">
            <span>承認欄</span>
            <strong>未承認</strong>
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
    <section className="choice-panel">
      <div className="section-heading">
        <p>二手目{state.selectedPrep ? ` / 準備: ${PREP_LABELS[state.selectedPrep]}` : ''}</p>
        <h2>本対応を選ぶ</h2>
      </div>
      <div className="choice-grid response-grid">
        {insights.map((insight) => {
          const response = insight.response;
          const relation = prepRelationMark(insight.prepRelationTone);
          const range = resultRange(insight);
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
              <div className="outlook-summary" aria-label={`成立見込み: ${insight.successRangeLabel}`}>
                <div className="outlook-head">
                  <span><Icon name="scene" />{compactAim(insight)}</span>
                  <strong>{insight.successRangeLabel}</strong>
                  <em className={`prep-mark mark-${insight.prepRelationTone}`} aria-label={`読み: ${insight.prepRelationLabel}`}>
                    準備{relation}
                  </em>
                </div>
                <ResultRail range={range} resultTier={insight.resultTier} danger={Boolean(insight.dangerWarning)} />
              </div>
              <div className="card-effect-summary" aria-label="影響の要約">
                <span>影響</span>
                <div>
                  {effects.map((item) => (
                    <em key={item.key} className={`effect-mini effect-${item.tone}`} title={item.title} aria-label={item.title}>
                      {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
                      <Icon name={item.icon} />
                      <EffectChangeIcon change={item.change} />
                    </em>
                  ))}
                </div>
              </div>
              {insight.dangerWarning ? <strong className="danger-warning compact-danger">{insight.downsideLabel}</strong> : null}
              <em className={`selected-card-bar ${isInspected ? 'is-visible' : ''}`} aria-hidden={!isInspected}>
                {isInspected ? '対応候補' : ''}
              </em>
            </button>
          );
        })}
      </div>
      <aside className={`decision-note relation-${inspected.prepRelationTone}`}>
        <div>
          <span>この手の見立て</span>
          <strong>{RESPONSE_LABELS[inspected.response]} / {inspected.successRangeLabel}</strong>
        </div>
        <div className="response-action-bar">
          <div>
            <span>{RESPONSE_LABELS[inspected.response]}</span>
            <strong>{inspected.successRangeLabel}</strong>
            <small>{compactEffectSummary(inspected)}</small>
            {inspected.dangerWarning ? <em>{inspected.downsideLabel}</em> : null}
          </div>
          <button className="primary-action decision-action" disabled={disabled} onClick={() => onSelect(inspected.response)}>
            この対応で進む
          </button>
        </div>
        <ReadoutHud insight={inspected} />
        <p>{decisionMemo(inspected)}</p>
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
  if (insight.resultTier === 'masterpiece') return '名場面狙い';
  if (insight.resultTier === 'scene') return '場面化狙い';
  if (insight.resultTier === 'smallSuccess') return '小成功狙い';
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
      <section>
        <span>影響</span>
        <div>
          {effects.map((item) => (
            <em key={item.key} className={`readout-chip effect-${item.tone}`} title={item.title} aria-label={item.title}>
              {item.repeat ? <Icon name="repeat" className="repeat-icon" /> : null}
              <Icon name={item.icon} />
              <small>{effectTargetLabel(item.icon)}</small>
              <EffectChangeIcon change={item.change} />
            </em>
          ))}
        </div>
      </section>
      <section>
        <span>相性</span>
        <div>
          {affinity.map((item) => (
            <em key={item.id} className={`readout-chip affinity-${item.tone}`} title={item.title} aria-label={item.title}>
              <Icon name={item.icon} />
              <small>{item.label}</small>
              <strong>{item.symbol}</strong>
            </em>
          ))}
        </div>
        <p>◎ 強い / ○ 合う / △ 普通 / × 注意</p>
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
type EffectChange = 'strong-up' | 'up' | 'flat' | 'down' | 'strong-down';
type EffectTone = 'good' | 'watch' | 'bad' | 'neutral';
type EffectItem = {
  key: string;
  icon: EffectIcon;
  change: EffectChange;
  changeLabel: string;
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
  const change = effectChange(value);
  const changeLabel = effectChangeLabel(value);
  const title = `${repeat ? '連続使用: ' : ''}${effectTargetLabel(icon)} ${changeLabel}`;
  return {
    key: `${repeat ? 'repeat-' : ''}${raw}`,
    icon,
    change,
    changeLabel,
    raw,
    title,
    tone,
    value,
    repeat,
  };
}

function EffectChangeIcon({ change }: { change: EffectChange }) {
  const isStrongUp = change === 'strong-up';
  const isStrongDown = change === 'strong-down';
  const isUp = change === 'up' || isStrongUp;
  const isDown = change === 'down' || isStrongDown;
  return (
    <svg className={`effect-change change-${change}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {isStrongUp ? (
        <>
          <path d="M8 14V7.7" />
          <path d="M4.7 11 8 7.7l3.3 3.3" />
          <path d="M4.7 5.3 8 2l3.3 3.3" />
        </>
      ) : null}
      {change === 'up' ? <path d="M8 2.7v10.6M4.7 6 8 2.7 11.3 6" /> : null}
      {change === 'flat' ? <path d="M3 8h10M9.8 4.8 13 8l-3.2 3.2" /> : null}
      {change === 'down' ? <path d="M8 2.7v10.6M4.7 10 8 13.3 11.3 10" /> : null}
      {isStrongDown ? (
        <>
          <path d="M8 2v6.3" />
          <path d="M4.7 5 8 8.3 11.3 5" />
          <path d="M4.7 10.7 8 14l3.3-3.3" />
        </>
      ) : null}
      {!isUp && !isDown && change !== 'flat' ? <path d="M3 8h10M9.8 4.8 13 8l-3.2 3.2" /> : null}
    </svg>
  );
}

function effectChange(value: number): EffectChange {
  if (value >= 2) return 'strong-up';
  if (value === 1) return 'up';
  if (value === 0) return 'flat';
  if (value === -1) return 'down';
  return 'strong-down';
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

function compactEffectSummary(insight: ResponseInsight) {
  return effectItems(insight).slice(0, 3).map((item) => {
    const sign = item.value > 0 ? '+' : '';
    return `${effectTargetLabel(item.icon)} ${sign}${item.value}`;
  }).join(' / ');
}

function decisionMemo(insight: ResponseInsight) {
  const prep = insight.prepRelationTone === 'primary'
    ? '準備と正面から噛み合う'
    : insight.prepRelationTone === 'alternate'
      ? '準備とは別筋で成立する'
      : '準備とは噛み合いにくい';
  const danger = insight.dangerWarning ? ` ${insight.downsideLabel}。` : '';
  return `${prep}手。${insight.responseAimLabel}。見込みは${insight.successRangeLabel}。影響は${effectSummary(insight)}。${danger}`;
}

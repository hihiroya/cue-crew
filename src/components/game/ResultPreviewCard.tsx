import { ACTOR_LABELS, EVENT_LABELS, PREP_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS } from '../../game/constants';
import type { ResultPreview } from '../../game/types';
import { Icon } from '../ui/Icon';

type Props = {
  preview: ResultPreview | null;
  onCommit: () => void;
  canCommit: boolean;
};

export function ResultPreviewCard({ preview, onCommit, canCommit }: Props) {
  if (!preview) {
    return (
      <section className="result-preview empty-preview">
        <div className="section-heading">
          <p>成立場面プレビュー</p>
          <h2>対応を選ぶと、見通しが立つ</h2>
        </div>
        <p>結果は確定前に確認できる。拾うか、整えるか、待つか、切るか。</p>
      </section>
    );
  }
  const prepBanner = {
    hit: { className: 'is-hit', label: '準備が活きた', detail: '上振れ幅が広がった' },
    partial: { className: 'is-partial', label: '準備が一部活きた', detail: '崩れを抑えた' },
    miss: { className: 'is-miss', label: '別の備えだった', detail: '上限が下がった' },
  }[preview.prepQuality];
  const isFinale = preview.resultMode === 'finale';
  const reasonItems = [...preview.scoreBreakdown]
    .filter((item) => item.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);
  return (
    <section className={`result-preview cue-result-ticket tier-${preview.resultTier} result-mode-${preview.resultMode}`}>
      <div className="result-ticket-head">
        <div className="result-kicker">
          <span>キュー結果票</span>
          <span>{preview.performanceLabel}{isFinale ? ' / 千秋楽' : ''}</span>
        </div>
        <h2>{preview.sceneTitle}</h2>
        <div className="scene-rating" aria-label={`場面成立度 ${RESULT_TIER_LABELS[preview.resultTier]}`}>
          <span>成立</span>
          <strong>{RESULT_TIER_LABELS[preview.resultTier]}</strong>
          <em>{RESULT_TIER_STARS[preview.resultTier]}</em>
        </div>
      </div>
      <div className="cue-route">
        <span><Icon name="actor" />{ACTOR_LABELS[preview.focusActorType]}</span>
        <span><Icon name="event" />{EVENT_LABELS[preview.actorEventType]}</span>
        <span><Icon name={preview.mainResponse} />{RESPONSE_LABELS[preview.mainResponse]}</span>
      </div>
      <div className={`prep-hit-banner cue-stamp ${prepBanner.className}`}>
        <span>{prepBanner.label}</span>
        <strong>{PREP_LABELS[preview.prepAction]} / {prepBanner.detail}</strong>
      </div>
      <div className="cue-summary-grid">
        <article className="cue-summary-card is-key">
          <span>決め手</span>
          <p>{preview.cueSummary.keyPoint}</p>
        </article>
        <article className="cue-summary-card">
          <span>代償</span>
          <p>{preview.cueSummary.cost}</p>
        </article>
        <article className="cue-summary-card">
          <span>{isFinale ? '公演報告へ' : '申し送り'}</span>
          <p>{preview.cueSummary.handoff}</p>
        </article>
        <article className="cue-summary-card is-audience">
          <span>客席</span>
          <p>{preview.cueSummary.audienceReaction.replace(/^客席反応: /, '')}</p>
        </article>
      </div>
      <div className="next-note result-lesson-note">
        <span>次回改善メモ</span>
        <p>{preview.cueSummary.lesson}</p>
      </div>
      {reasonItems.length > 0 ? (
        <div className="cue-reason-list">
          <span>主な理由</span>
          <ul>
            {reasonItems.map((item) => (
              <li key={item.id} className={`breakdown-${item.tone}`}>
                <strong>{item.value > 0 ? `+${item.value}` : item.value}</strong>
                <p>{item.label}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className={`prep-recovery recovery-${preview.prepRecoveryTone}`}>
        <div>
          <span>{preview.prepRecoveryLabel}</span>
          <strong>{preview.prepRecoveryTitle}</strong>
        </div>
        <p>{preview.prepRecoveryText}</p>
      </div>
      {preview.styleLabel ? (
        <div className={`performance-style-note ${preview.styleIsNew ? 'is-new' : ''}`}>
          <span>{preview.styleIsNew ? 'この公演の色が決まった' : '公演の色'}</span>
          <strong>{preview.styleLabel}</strong>
          {preview.styleText ? <p>{preview.styleText}</p> : null}
        </div>
      ) : null}
      <div className="delta-table" aria-label="結果差分">
        <span className="delta-table-title">結果差分</span>
        <Delta kind="scene" label="場面" value={preview.deltaScene} />
        <Delta kind="flow" label="流れ" value={preview.deltaFlow} />
        <Delta kind="trust" label="信頼" value={preview.deltaTrust} />
        <Delta kind="load" label="負荷" value={preview.deltaLoad} />
      </div>
      <button className="primary-action" disabled={!canCommit} onClick={onCommit}>{isFinale ? 'この結果で公演報告へ' : 'この結果で次公演へ'}</button>
    </section>
  );
}

type DeltaKind = 'scene' | 'flow' | 'trust' | 'load';

function Delta({ kind, label, value }: { kind: DeltaKind; label: string; value: number }) {
  const sign = value > 0 ? '+' : '';
  const impact = deltaImpact(kind, value);
  return (
    <div className={`delta-line delta-${kind} ${impact.tone}`} aria-label={`${label}: ${impact.label}, ${sign}${value}`}>
      <span className="delta-line-label"><Icon name={kind} />{label}</span>
      <b>{impact.label}</b>
      <strong>{sign}{value}</strong>
    </div>
  );
}

function deltaImpact(kind: DeltaKind, value: number, maxLevel = 4): { label: string; level: number; tone: 'positive' | 'neutral' | 'negative' } {
  const level = Math.min(maxLevel, Math.abs(value));
  if (kind === 'scene') {
    if (value >= 4) return { label: '見せ場級', level: 4, tone: 'positive' };
    if (value >= 3) return { label: '場面が伸びた', level: 3, tone: 'positive' };
    if (value > 0) return { label: '少し残った', level: value, tone: 'positive' };
    if (value === 0) return { label: '伸びは控えめ', level: 0, tone: 'neutral' };
    return { label: '沈んだ', level, tone: 'negative' };
  }
  if (kind === 'flow') {
    if (value >= 2) return { label: '呼吸が戻った', level: 2, tone: 'positive' };
    if (value > 0) return { label: '整った', level: 1, tone: 'positive' };
    if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
    return { label: value <= -2 ? '大きく乱れた' : '乱れた', level, tone: 'negative' };
  }
  if (kind === 'trust') {
    if (value >= 2) return { label: '強く残った', level: 2, tone: 'positive' };
    if (value > 0) return { label: '深まった', level: 1, tone: 'positive' };
    if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
    return { label: value <= -2 ? '削れた' : '少し削れた', level, tone: 'negative' };
  }
  if (value < 0) return { label: '軽くなった', level, tone: 'positive' };
  if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
  if (value >= 3) return { label: '危険圏', level: Math.min(maxLevel, value), tone: 'negative' };
  return { label: value >= 2 ? '重い代償' : '攻めの代償', level: value, tone: 'negative' };
}

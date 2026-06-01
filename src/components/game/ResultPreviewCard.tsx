import { ACTOR_LABELS, EVENT_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS } from '../../game/constants';
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
  const isMatinee = preview.resultMode === 'matinee';
  const isFinale = preview.resultMode === 'finale';
  const breakdownItems = isMatinee ? preview.scoreBreakdown.slice(0, 3) : preview.scoreBreakdown;
  return (
      <section className={`result-preview tier-${preview.resultTier} result-mode-${preview.resultMode}`}>
      <div className="result-kicker">
        <span>{preview.performanceLabel}{isFinale ? ' / 千秋楽' : ''}</span>
        <span>{ACTOR_LABELS[preview.focusActorType]} / {EVENT_LABELS[preview.actorEventType]} / {RESPONSE_LABELS[preview.mainResponse]}</span>
      </div>
      <div className="result-kicker">
        <span>実際は「{RESULT_TIER_LABELS[preview.resultTier]}」</span>
        <span>{isMatinee ? 'ソワレへの調整' : isFinale ? '最終公演の手応え' : 'その日の評判'}</span>
      </div>
      <div className={`prep-hit-banner ${prepBanner.className}`}>
        <span>{prepBanner.label}</span>
        <strong>{prepBanner.detail}</strong>
      </div>
      <div className="scene-rating" aria-label={`場面成立度 ${RESULT_TIER_LABELS[preview.resultTier]}`}>
        <span>結果ランク</span>
        <strong>{RESULT_TIER_LABELS[preview.resultTier]}</strong>
        <em>{RESULT_TIER_STARS[preview.resultTier]}</em>
      </div>
      <div className={`prep-recovery recovery-${preview.prepRecoveryTone}`}>
        <div>
          <span>{preview.prepRecoveryLabel}</span>
          <strong>{preview.prepRecoveryTitle}</strong>
        </div>
        <p>{preview.prepRecoveryText}</p>
      </div>
      <div className={`prep-relation-result relation-${preview.prepRelationTone}`}>
        <span>準備との関係</span>
        <strong>{preview.prepRelationLabel}</strong>
        <p>{preview.responseAimLabel}</p>
      </div>
      {preview.styleLabel ? (
        <div className={`performance-style-note ${preview.styleIsNew ? 'is-new' : ''}`}>
          <span>{preview.styleIsNew ? 'この公演の型が決まった' : '公演の型'}</span>
          <strong>{preview.styleLabel}</strong>
          {preview.styleText ? <p>{preview.styleText}</p> : null}
        </div>
      ) : null}
      <h2>{preview.sceneTitle}</h2>
      <p>{preview.flavorText}</p>
      <div className="delta-row">
        <Delta kind="scene" label="場面" value={preview.deltaScene} />
        <Delta kind="flow" label="流れ" value={preview.deltaFlow} />
        <Delta kind="trust" label="信頼" value={preview.deltaTrust} />
        <Delta kind="load" label="負荷" value={preview.deltaLoad} />
      </div>
      <div className="score-breakdown">
        <h3>{isMatinee ? 'ソワレへ残る手応え' : isFinale ? '千秋楽に残った理由' : `${RESULT_TIER_LABELS[preview.resultTier]}になった理由`}</h3>
        <ul>
          {breakdownItems.map((item) => (
            <li key={item.id} className={`breakdown-${item.tone}`}>
              <span>{item.label}</span>
              <strong>{item.value > 0 ? `+${item.value}` : item.value}</strong>
              {item.detail ? <small>{item.detail}</small> : null}
            </li>
          ))}
        </ul>
      </div>
      <button className="primary-action" disabled={!canCommit} onClick={onCommit}>決定して次へ</button>
    </section>
  );
}

type DeltaKind = 'scene' | 'flow' | 'trust' | 'load';

function Delta({ kind, label, value }: { kind: DeltaKind; label: string; value: number }) {
  const sign = value > 0 ? '+' : '';
  const impact = deltaImpact(kind, value);
  return (
    <div className={`delta delta-${kind} ${impact.tone}`} aria-label={`${label}: ${impact.label}, ${impact.level}/4, ${sign}${value}`}>
      <div className="delta-head">
        <Icon name={kind} />
        <span>{label}</span>
        <strong>{sign}{value}</strong>
      </div>
      <b>{impact.label}</b>
      <div className="delta-meter" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className={index < impact.level ? 'is-filled' : ''} />
        ))}
        <em>{impact.level}/4</em>
      </div>
    </div>
  );
}

function deltaImpact(kind: DeltaKind, value: number): { label: string; level: number; tone: 'positive' | 'neutral' | 'negative' } {
  const level = Math.min(4, Math.abs(value));
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
  if (value >= 3) return { label: '危険圏', level: Math.min(4, value), tone: 'negative' };
  return { label: value >= 2 ? '重い代償' : '攻めの代償', level: value, tone: 'negative' };
}

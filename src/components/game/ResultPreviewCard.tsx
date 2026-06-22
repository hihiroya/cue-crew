import { useId, useState } from 'react';
import { ACTOR_LABELS, EVENT_LABELS, PREP_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS } from '../../game/constants';
import { displayScore, signedDisplayScore } from '../../game/scoreDisplay';
import type { ResultPreview, ScoreBreakdownItem } from '../../game/types';
import type { CollectionState } from '../../game/rogueliteProgress';
import { Icon } from '../ui/Icon';
import { classNames } from '../ui/classNames';
import { appCopy, deltaImpact, prepQualityBanner, type DeltaKind } from '../../content/ja/appCopy';
import { backstageLogCopy, backstageResultLog } from '../../content/ja/backstageLogCopy';

type Props = {
  preview: ResultPreview | null;
  collection?: CollectionState;
  onCommit: () => void;
  canCommit: boolean;
};

export function ResultPreviewCard({ preview, collection, onCommit, canCommit }: Props) {
  const breakdownId = useId();
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [highlightedBreakdownKey, setHighlightedBreakdownKey] = useState<string | null>(null);
  if (!preview) {
    return (
      <section className="result-preview empty-preview">
        <div className="section-heading">
          <p>{appCopy.resultPreview.emptyKicker}</p>
          <h2>{appCopy.resultPreview.emptyTitle}</h2>
        </div>
        <p>{appCopy.resultPreview.emptyBody}</p>
      </section>
    );
  }
  const prepBanner = prepQualityBanner[preview.prepQuality];
  const isFinale = preview.resultMode === 'finale';
  const recoveredFray = preview.scoreBreakdown.some((item) => item.id === 'fray-reward' || item.id === 'fray');
  const sceneId = `${preview.focusActorType}:${preview.actorEventType}:${preview.mainResponse}:${preview.sceneTitle}`;
  const isNewScene = collection ? !collection.scenes[sceneId] : false;
  const reasonItems = [...preview.scoreBreakdown]
    .filter((item) => item.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);
  const showBreakdownFor = (item: ScoreBreakdownItem) => {
    setHighlightedBreakdownKey(scoreBreakdownKey(item));
    setIsBreakdownOpen(true);
  };
  const backstageNote = backstageResultLog(preview);
  return (
    <section className={classNames('result-preview cue-result-ticket', resultTierClass[preview.resultTier], resultModeClass[preview.resultMode])}>
      <div className="result-ticket-head">
        <div className="result-kicker">
          <span>{appCopy.resultPreview.ticket}</span>
          <span>{preview.performanceLabel}{isFinale ? ` / ${appCopy.resultPreview.finale}` : ''}</span>
        </div>
        <div className="cue-verdict-panel" aria-label={appCopy.resultPreview.ratingAria(RESULT_TIER_LABELS[preview.resultTier])}>
          <div className="cue-verdict-stamp">
            <span>{appCopy.resultPreview.ratingLabel}</span>
            <strong>{RESULT_TIER_LABELS[preview.resultTier]}</strong>
            <em>{RESULT_TIER_STARS[preview.resultTier]}</em>
          </div>
          <div className="cue-score-position">
            <span>{appCopy.resultPreview.scoreLabel}</span>
            <strong>{displayScore(preview.score)}{appCopy.resultPreview.scoreUnit}</strong>
            <p>{scorePositionLabel(preview)}</p>
          </div>
        </div>
        <TierRail preview={preview} />
        <h2>{preview.sceneTitle}</h2>
      </div>
      {reasonItems.length > 0 ? (
        <div className="cue-reason-chips" aria-label={appCopy.resultPreview.reasonChips}>
          {reasonItems.map((item) => (
            <button
              key={scoreBreakdownKey(item)}
              type="button"
              className={classNames('cue-reason-chip', breakdownToneClass[item.tone], highlightedBreakdownKey === scoreBreakdownKey(item) && 'is-selected')}
              aria-controls={breakdownId}
              aria-expanded={isBreakdownOpen}
              onClick={() => showBreakdownFor(item)}
            >
              <strong>{signedDisplayScore(item.value)}</strong>
              <small>{item.label}</small>
            </button>
          ))}
        </div>
      ) : null}
      <ScoreBreakdownDetails
        id={breakdownId}
        isOpen={isBreakdownOpen}
        highlightedKey={highlightedBreakdownKey}
        preview={preview}
        onToggle={setIsBreakdownOpen}
      />
      <div className="cue-route">
        <span><Icon name="actor" />{ACTOR_LABELS[preview.focusActorType]}</span>
        <span><Icon name={preview.actorEventType} />{EVENT_LABELS[preview.actorEventType]}</span>
        <span><Icon name={preview.mainResponse} />{RESPONSE_LABELS[preview.mainResponse]}</span>
      </div>
      <article className="scene-record-note">
        <span>{appCopy.resultPreview.sceneRecord}</span>
        <p>{preview.flavorText}</p>
      </article>
      <aside className="backstage-log-note">
        <span>{backstageLogCopy.label}</span>
        <p>{backstageNote}</p>
      </aside>
      <div className={classNames('prep-hit-banner cue-stamp', prepQualityClass[preview.prepQuality])}>
        <span>{prepBanner.label}</span>
        <strong>{PREP_LABELS[preview.prepAction]} / {prepBanner.detail}</strong>
      </div>
      {recoveredFray ? (
        <div className="fray-recovery-stamp">
          <span>{appCopy.resultPreview.frayRecovery}</span>
          <strong>{appCopy.resultPreview.frayRecoveryBody}</strong>
        </div>
      ) : null}
      {isNewScene ? (
        <div className="collection-preview-stamp">
          <span>{appCopy.resultPreview.newScene}</span>
          <strong>{appCopy.resultPreview.newSceneBody}</strong>
        </div>
      ) : null}
      {shouldShowCueSurge(preview) ? (
        <div className={classNames('cue-surge-stamp', `surge-${preview.cueSurge.responseLevel}`, `cost-${preview.cueSurge.costLevel}`)}>
          <span>{appCopy.resultPreview.surge}</span>
          <strong>{preview.cueSurge.label} / {preview.cueSurge.costLabel}</strong>
          <p>{preview.cueSurge.detail}</p>
        </div>
      ) : null}
      <div className="result-preview-detail-stack">
        <div className="next-note result-lesson-note">
          <span>{appCopy.resultPreview.lesson}</span>
          <p>{preview.cueSummary.lesson}</p>
        </div>
        <div className="scoring-memo">
          <span>{appCopy.resultPreview.scoringMemo}</span>
          <DeltaTable preview={preview} />
          <div className="cue-summary-grid">
            <article className="cue-summary-card is-key">
              <span>{appCopy.resultPreview.key}</span>
              <p>{preview.cueSummary.keyPoint}</p>
            </article>
            {shouldShowCost(preview) ? (
              <article className="cue-summary-card">
                <span>{appCopy.resultPreview.cost}</span>
                <p>{preview.cueSummary.cost}</p>
              </article>
            ) : null}
          </div>
        </div>
        {shouldShowPrepRecovery(preview) ? (
          <div className={classNames('prep-recovery', prepRecoveryToneClass[preview.prepRecoveryTone])}>
            <div>
              <span>{preview.prepRecoveryLabel}</span>
              <strong>{preview.prepRecoveryTitle}</strong>
            </div>
            <p>{preview.prepRecoveryText}</p>
          </div>
        ) : null}
        {preview.styleLabel ? (
          <div className={classNames('performance-style-note', preview.styleIsNew && 'is-new')}>
            <span>{preview.styleIsNew ? appCopy.resultPreview.styleNew : appCopy.resultPreview.style}</span>
            <strong>{preview.styleLabel}</strong>
            {preview.styleText ? <p>{preview.styleText}</p> : null}
          </div>
        ) : null}
      </div>
      <button className="primary-action result-preview-commit" disabled={!canCommit} onClick={onCommit}>{isFinale ? appCopy.resultPreview.commitFinale : appCopy.resultPreview.commitNext}</button>
    </section>
  );
}

function ScoreBreakdownDetails({
  highlightedKey,
  id,
  isOpen,
  onToggle,
  preview,
}: {
  highlightedKey: string | null;
  id: string;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  preview: ResultPreview;
}) {
  return (
    <details id={id} className="score-breakdown-details" open={isOpen} onToggle={(event) => onToggle(event.currentTarget.open)}>
      <summary>
        <span>{appCopy.resultPreview.breakdownSummary}</span>
        <strong>{appCopy.resultPreview.breakdownTotal} {displayScore(preview.score)}{appCopy.resultPreview.scoreUnit}</strong>
      </summary>
      <div className="score-breakdown-list" aria-label={appCopy.resultPreview.breakdownAria}>
        {preview.scoreBreakdown.length > 0 ? preview.scoreBreakdown.map((item) => (
          <article key={scoreBreakdownKey(item)} className={classNames('score-breakdown-row', breakdownToneClass[item.tone], highlightedKey === scoreBreakdownKey(item) && 'is-highlighted')}>
            <span>{item.label}</span>
            <strong>{signedDisplayScore(item.value)}</strong>
            {item.detail ? <p>{item.detail}</p> : null}
          </article>
        )) : <p>{appCopy.resultPreview.breakdownEmpty}</p>}
      </div>
    </details>
  );
}

function scoreBreakdownKey(item: ScoreBreakdownItem) {
  return `${item.id}:${item.label}`;
}

function shouldShowCost(preview: ResultPreview) {
  return preview.deltaLoad > 0 || preview.deltaFlow < 0 || preview.deltaTrust < 0 || ['fray', 'accident'].includes(preview.resultTier);
}

function shouldShowPrepRecovery(preview: ResultPreview) {
  return preview.prepQuality !== 'hit' || preview.resultTier === 'fray' || preview.resultTier === 'accident';
}

function shouldShowCueSurge(preview: ResultPreview) {
  return ['stacked', 'surge', 'peak'].includes(preview.cueSurge.responseLevel);
}

function TierRail({ preview }: { preview: ResultPreview }) {
  return (
    <div className="cue-tier-rail" aria-label={appCopy.resultPreview.tierRail}>
      {tierSteps.map((step) => (
        <span
          key={step.tier}
          className={classNames(
            preview.score >= step.minScore && 'is-reached',
            preview.resultTier === step.tier && 'is-current',
          )}
        >
          <i />
          <b>{RESULT_TIER_LABELS[step.tier]}</b>
        </span>
      ))}
    </div>
  );
}

function DeltaTable({ preview }: { preview: ResultPreview }) {
  return (
    <div className="delta-table delta-table--summary" aria-label={appCopy.resultPreview.deltaAria}>
      <span className="delta-table-title">{appCopy.resultPreview.deltaTitle}</span>
      <small className="delta-table-subtitle">{appCopy.resultPreview.deltaSub}</small>
      <Delta kind="scene" label={appCopy.result.finalScoreLabels.scene} impact={preview.stateImpact.scene} />
      <Delta kind="flow" label={appCopy.resultPreview.deltaLabels.flow} impact={preview.stateImpact.flow} />
      <Delta kind="trust" label={appCopy.resultPreview.deltaLabels.trust} impact={preview.stateImpact.trust} />
      <Delta kind="load" label={appCopy.resultPreview.deltaLabels.load} impact={preview.stateImpact.load} />
    </div>
  );
}

function Delta({
  impact,
  kind,
  label,
}: {
  impact: ResultPreview['stateImpact'][DeltaKind];
  kind: DeltaKind;
  label: string;
}) {
  const change = signedValue(impact.delta);
  const tone = deltaImpact(kind, impact.delta);
  const before = formatStateValue(kind, impact.before);
  const after = formatStateValue(kind, impact.after);
  return (
    <div className={classNames('delta-line', deltaKindClass[kind], deltaImpactToneClass[tone.tone])} aria-label={appCopy.resultPreview.deltaLineAria(label, before, after, tone.label, change)}>
      <span className="delta-line-label"><Icon name={kind} />{label}</span>
      <b className="delta-transition"><span>{before}</span><i aria-hidden="true">-&gt;</i><span>{after}</span></b>
      <em>{tone.label}</em>
      <strong>{change}</strong>
    </div>
  );
}

function signedValue(value: number) {
  if (value === 0) return '±0';
  return `${value > 0 ? '+' : ''}${value}`;
}

function formatStateValue(kind: DeltaKind, value: number) {
  return kind === 'load' ? `${value}/5` : String(value);
}

function scorePositionLabel(preview: ResultPreview) {
  const nextStep = tierTargets.find((step) => preview.score < step.minScore);
  if (!nextStep) return appCopy.resultPreview.scoreReached(RESULT_TIER_LABELS[preview.resultTier]);
  return appCopy.resultPreview.pointsToTier(nextStep.minScore - preview.score, RESULT_TIER_LABELS[nextStep.tier]);
}

const tierSteps: Array<{ tier: ResultPreview['resultTier']; minScore: number }> = [
  { tier: 'accident', minScore: Number.NEGATIVE_INFINITY },
  { tier: 'fray', minScore: 0 },
  { tier: 'smallSuccess', minScore: 2 },
  { tier: 'scene', minScore: 4 },
  { tier: 'masterpiece', minScore: 7 },
];

const tierTargets = tierSteps.filter((step) => Number.isFinite(step.minScore));

const resultTierClass: Record<ResultPreview['resultTier'], string> = {
  accident: 'tier-accident',
  fray: 'tier-fray',
  smallSuccess: 'tier-smallSuccess',
  scene: 'tier-scene',
  masterpiece: 'tier-masterpiece',
};

const resultModeClass: Record<ResultPreview['resultMode'], string> = {
  matinee: 'result-mode-matinee',
  soiree: 'result-mode-soiree',
  finale: 'result-mode-finale',
};

const prepQualityClass: Record<ResultPreview['prepQuality'], string> = {
  hit: 'is-hit',
  partial: 'is-partial',
  miss: 'is-miss',
};

const breakdownToneClass: Record<ResultPreview['scoreBreakdown'][number]['tone'], string> = {
  positive: 'breakdown-positive',
  negative: 'breakdown-negative',
  neutral: 'breakdown-neutral',
};

const prepRecoveryToneClass: Record<ResultPreview['prepRecoveryTone'], string> = {
  matched: 'recovery-matched',
  partial: 'recovery-partial',
  thin: 'recovery-thin',
  missed: 'recovery-missed',
};

const deltaKindClass: Record<DeltaKind, string> = {
  scene: 'delta-scene',
  flow: 'delta-flow',
  trust: 'delta-trust',
  load: 'delta-load',
};

const deltaImpactToneClass: Record<ReturnType<typeof deltaImpact>['tone'], string> = {
  positive: 'positive',
  neutral: 'neutral',
  negative: 'negative',
};

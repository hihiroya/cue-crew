import { ACTOR_LABELS, EVENT_LABELS, PREP_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS } from '../../game/constants';
import type { ResultPreview } from '../../game/types';
import type { CollectionState } from '../../game/rogueliteProgress';
import { Icon } from '../ui/Icon';
import { classNames } from '../ui/classNames';
import { appCopy, deltaImpact, prepQualityBanner, stripAudienceReactionPrefix, type DeltaKind } from '../../content/ja/appCopy';

type Props = {
  preview: ResultPreview | null;
  collection?: CollectionState;
  onCommit: () => void;
  canCommit: boolean;
};

export function ResultPreviewCard({ preview, collection, onCommit, canCommit }: Props) {
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
            <strong>{preview.score}{appCopy.resultPreview.scoreUnit}</strong>
            <p>{scorePositionLabel(preview)}</p>
          </div>
        </div>
        <TierRail preview={preview} />
        <h2>{preview.sceneTitle}</h2>
      </div>
      {reasonItems.length > 0 ? (
        <div className="cue-reason-chips" aria-label={appCopy.resultPreview.reasonChips}>
          {reasonItems.map((item) => (
            <span key={item.id} className={classNames('cue-reason-chip', breakdownToneClass[item.tone])}>
              <strong>{item.value > 0 ? `+${item.value}` : item.value}</strong>
              <small>{item.label}</small>
            </span>
          ))}
        </div>
      ) : null}
      <div className="cue-route">
        <span><Icon name="actor" />{ACTOR_LABELS[preview.focusActorType]}</span>
        <span><Icon name={preview.actorEventType} />{EVENT_LABELS[preview.actorEventType]}</span>
        <span><Icon name={preview.mainResponse} />{RESPONSE_LABELS[preview.mainResponse]}</span>
      </div>
      <DeltaTable preview={preview} />
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
      <div className="result-preview-detail-stack">
        <div className="next-note result-lesson-note">
          <span>{appCopy.resultPreview.lesson}</span>
          <p>{preview.cueSummary.lesson}</p>
        </div>
        <div className="cue-summary-grid">
          <article className="cue-summary-card is-key">
            <span>{appCopy.resultPreview.key}</span>
            <p>{preview.cueSummary.keyPoint}</p>
          </article>
          <article className="cue-summary-card">
            <span>{appCopy.resultPreview.cost}</span>
            <p>{preview.cueSummary.cost}</p>
          </article>
        </div>
        <div className="cue-subnote-line">
          <span>{isFinale ? appCopy.resultPreview.finalHandoff : appCopy.resultPreview.handoff}: {preview.cueSummary.handoff}</span>
          <span>{appCopy.resultPreview.audience}: {stripAudienceReactionPrefix(preview.cueSummary.audienceReaction)}</span>
        </div>
        <div className={classNames('prep-recovery', prepRecoveryToneClass[preview.prepRecoveryTone])}>
          <div>
            <span>{preview.prepRecoveryLabel}</span>
            <strong>{preview.prepRecoveryTitle}</strong>
          </div>
          <p>{preview.prepRecoveryText}</p>
        </div>
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
      <Delta kind="scene" label={appCopy.result.finalScoreLabels.scene} value={preview.deltaScene} />
      <Delta kind="flow" label={appCopy.resultPreview.deltaLabels.flow} value={preview.deltaFlow} />
      <Delta kind="trust" label={appCopy.resultPreview.deltaLabels.trust} value={preview.deltaTrust} />
      <Delta kind="load" label={appCopy.resultPreview.deltaLabels.load} value={preview.deltaLoad} />
    </div>
  );
}

function Delta({ kind, label, value }: { kind: DeltaKind; label: string; value: number }) {
  const sign = value > 0 ? '+' : '';
  const impact = deltaImpact(kind, value);
  return (
    <div className={classNames('delta-line', deltaKindClass[kind], deltaImpactToneClass[impact.tone])} aria-label={`${label}: ${impact.label}, ${sign}${value}`}>
      <span className="delta-line-label"><Icon name={kind} />{label}</span>
      <b>{impact.label}</b>
      <strong>{sign}{value}</strong>
    </div>
  );
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

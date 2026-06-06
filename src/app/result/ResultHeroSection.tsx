import { Icon } from '../../components/ui/Icon';
import { classNames } from '../../components/ui/classNames';
import { PERFORMANCE_STYLE_DETAILS } from '../../game/constants';
import type { PerformanceResult } from '../../game/types';
import { achievementListLabel, compareWithPrevious, comparisonLabel } from '../../game/rogueliteProgress';
import { appCopy, resultLoadNote, resultScoreNote } from '../../content/ja/appCopy';
import styles from './ResultScreenSections.module.css';

export function ResultHeroSection({
  previousSameSeed,
  result,
}: {
  previousSameSeed: PerformanceResult | null;
  result: PerformanceResult;
}) {
  const styleLabel = performanceStyleLabel(result);
  const comparison = compareWithPrevious(result, previousSameSeed);
  const buildMeterMax = result.insight.buildStyle.next ?? Math.max(1, result.insight.buildStyle.progress);
  return (
    <section className={styles.hero}>
      <div className="stage-mark"><Icon name="spark" /></div>
      <p>{appCopy.result.heroKicker}</p>
      <h1>{result.title}</h1>
      <div className="final-style-badge">
        <span>{appCopy.result.styleLabel}</span>
        <strong>{styleLabel}</strong>
      </div>
      <div className="review-notes">
        {(result.reviewNotes?.length ? result.reviewNotes.slice(0, 3) : [result.review]).map((note) => <p key={note}>{note}</p>)}
      </div>
      <div className="report-section-label">
        <span>{appCopy.result.totalReview}</span>
        <small>{appCopy.result.allResults}</small>
      </div>
      <div className={classNames('performance-rank-card', rankClass(result.insight.rank))}>
        <span>{appCopy.result.rank}</span>
        <strong>{result.insight.rank}</strong>
        <p>{appCopy.result.totalScore(result.insight.totalScore)}</p>
        <em>{result.insight.pointsToNextRank === null ? appCopy.result.maxRank : appCopy.result.pointsToNext(result.insight.pointsToNextRank, result.insight.nextRank)}</em>
      </div>
      <div className="score-attack-note">
        <span>{appCopy.result.scoreNote}</span>
        <p>{result.insight.scoreNote}</p>
      </div>
      {result.insight.performanceBadges?.length ? (
        <div className="performance-badge-strip result-badge-strip" aria-label={appCopy.result.performanceBadges}>
          {result.insight.performanceBadges.map((badge) => (
            <em key={badge.id} className={classNames('performance-badge', performanceBadgeToneClass[badge.tone])} title={badge.detail}>{badge.label}</em>
          ))}
        </div>
      ) : null}
      <div className="roguelite-summary-grid">
        <div className="build-style-card">
          <span>{appCopy.result.buildStyle}</span>
          <strong>{result.insight.buildStyle.label} {appCopy.result.buildLevel(result.insight.buildStyle.level)}</strong>
          <meter min={0} max={buildMeterMax} value={result.insight.buildStyle.progress} />
          <small>{result.insight.buildStyle.note}</small>
        </div>
        <div className="discovery-card">
          <span>{appCopy.result.discovery}</span>
          <strong>{appCopy.result.discoveryScore(result.insight.discoveryScore)}</strong>
          <small>{appCopy.result.collectionScenes(result.insight.sceneCollectionCount)} / {achievementListLabel(result.insight.unlockedAchievements)}</small>
        </div>
      </div>
      {comparison ? (
        <div className="previous-seed-note">
          <span>{appCopy.result.previousSeed}</span>
          <p>{comparisonLabel(comparison)}</p>
        </div>
      ) : null}
      <div className="report-section-label">
        <span>{appCopy.result.metrics}</span>
        <small>{appCopy.result.aggregate}</small>
      </div>
      <div className="packet-metrics">
        <span>{appCopy.result.prepMetric} <strong>{result.insight.prepHits}/6</strong><small>{result.insight.prepHitRate}%</small></span>
        <span>{appCopy.result.masterpieceMetric} <strong>{result.insight.masterpieceCount}</strong><small>{appCopy.result.sceneUnit}</small></span>
        <span>{appCopy.result.sceneOrBetterMetric} <strong>{result.insight.sceneOrBetterCount}</strong><small>{appCopy.result.countUnit}</small></span>
        <span>{appCopy.result.frayMetric} <strong>{result.insight.frayOrAccidentCount}</strong><small>{appCopy.result.countUnit}</small></span>
      </div>
      <div className="final-scores">
        <FinalScore label={appCopy.result.finalScoreLabels.scene} value={result.sceneScore} note={resultScoreNote('scene', result.sceneScore)} />
        <FinalScore label={appCopy.result.finalScoreLabels.flow} value={result.flowScore} note={resultScoreNote('flow', result.flowScore)} />
        <FinalScore label={appCopy.result.finalScoreLabels.trust} value={result.trustScore} note={resultScoreNote('trust', result.trustScore)} />
        <FinalScore label={appCopy.result.finalScoreLabels.load} value={`${result.backstageLoad}/5`} note={resultLoadNote(result.backstageLoad)} />
      </div>
      <PerformancePoster result={result} styleLabel={styleLabel} />
    </section>
  );
}

function PerformancePoster({ result, styleLabel }: { result: PerformanceResult; styleLabel: string }) {
  const bestCue = result.insight.bestCue;
  return (
    <article className="performance-poster-card">
      <span>{appCopy.result.poster}</span>
      <h2>{result.title}</h2>
      <div>
        <strong>{result.insight.rank}</strong>
        <em>{styleLabel}</em>
      </div>
      <p>{bestCue ? bestCue.sceneTitle : result.reviewNotes[0] ?? result.review}</p>
    </article>
  );
}

function FinalScore({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <span>
      {label}
      <strong>{value}</strong>
      <small>{note}</small>
    </span>
  );
}

function performanceStyleLabel(result: PerformanceResult) {
  return result.performanceStyle ? PERFORMANCE_STYLE_DETAILS[result.performanceStyle].label : appCopy.result.unsetStyle;
}

function rankClass(rank: PerformanceResult['insight']['rank']) {
  return `rank-${rank.replace('+', 'plus').toLowerCase()}`;
}

const performanceBadgeToneClass: Record<NonNullable<PerformanceResult['insight']['performanceBadges']>[number]['tone'], string> = {
  gold: 'badge-gold',
  good: 'badge-good',
  cool: 'badge-cool',
  risk: 'badge-risk',
};

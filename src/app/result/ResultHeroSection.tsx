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
      <ResultSpotlightStrip result={result} comparison={comparison} />
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

function ResultSpotlightStrip({
  comparison,
  result,
}: {
  comparison: ReturnType<typeof compareWithPrevious>;
  result: PerformanceResult;
}) {
  const spotlights = resultSpotlights(result, comparison);
  return (
    <section className="result-spotlight-strip" aria-label={appCopy.result.spotlight}>
      <div className="report-section-label result-spotlight-heading">
        <span>{appCopy.result.spotlight}</span>
        <small>{appCopy.result.spotlightSub}</small>
      </div>
      <div className="result-spotlight-grid">
        {spotlights.map((item) => (
          <article key={item.label} className={classNames('result-spotlight-card', item.tone && `is-${item.tone}`)}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </div>
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

type ResultSpotlightItem = {
  label: string;
  note: string;
  tone: 'gold' | 'good' | 'neutral' | 'risk';
  value: string;
};

function resultSpotlights(result: PerformanceResult, comparison: ReturnType<typeof compareWithPrevious>): ResultSpotlightItem[] {
  const items: ResultSpotlightItem[] = [
    {
      label: appCopy.result.spotlightMasterpiece,
      value: String(result.insight.masterpieceCount),
      note: appCopy.result.spotlightSceneUnit,
      tone: result.insight.masterpieceCount >= 2 ? 'gold' : 'neutral',
    },
    {
      label: appCopy.result.spotlightPrep,
      value: `${result.insight.prepHits}/6`,
      note: `${result.insight.prepHitRate}%`,
      tone: result.insight.prepHits >= 5 ? 'good' : 'neutral',
    },
  ];
  if (comparison) {
    items.push({
      label: appCopy.result.spotlightPrevious,
      value: appCopy.result.spotlightScoreDelta(comparison.totalScoreDelta),
      note: comparison.rankDeltaLabel,
      tone: comparison.totalScoreDelta > 0 ? 'good' : comparison.totalScoreDelta < 0 ? 'risk' : 'neutral',
    });
    return items;
  }
  if (result.insight.unlockedAchievements.length) {
    items.push({
      label: appCopy.result.spotlightAchievement,
      value: appCopy.result.spotlightAchievementCount(result.insight.unlockedAchievements.length),
      note: result.insight.unlockedAchievements[0]?.label ?? appCopy.result.achievements,
      tone: 'gold',
    });
    return items;
  }
  if (result.insight.performanceBadges.length) {
    items.push({
      label: appCopy.result.spotlightBadge,
      value: appCopy.result.spotlightBadgeCount(result.insight.performanceBadges.length),
      note: result.insight.performanceBadges[0]?.label ?? appCopy.result.performanceBadges,
      tone: 'good',
    });
    return items;
  }
  items.push({
    label: appCopy.result.spotlightDiscovery,
    value: String(result.insight.discoveryScore),
    note: appCopy.result.discovery,
    tone: 'neutral',
  });
  return items;
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

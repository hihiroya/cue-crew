import { PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS } from '../game/constants';
import type { PerformanceResult } from '../game/types';
import { Icon } from '../components/ui/Icon';
import { appCopy, bestCueBody, bestCueMeta, nextChallengeCopy, resultLoadNote, resultScoreNote, sameSeedHintCopy, timelineBody, timelineMeta } from '../content/ja/appCopy';

type Props = {
  result: PerformanceResult;
  onTitle: () => void;
  onReplaySame: () => void;
  onReplayNew: () => void;
};

export function ResultScreen({ result, onTitle, onReplaySame, onReplayNew }: Props) {
  const styleLabel = result.performanceStyle ? PERFORMANCE_STYLE_DETAILS[result.performanceStyle].label : appCopy.result.unsetStyle;
  const timelineLogs = result.logs?.length ? result.logs : result.highlights;
  const maxDecisionCount = Math.max(1, ...result.insight.decisionDistribution.map((item) => item.count));
  return (
    <main className="result-screen">
      <section className="result-hero">
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
        <div className={`performance-rank-card rank-${rankClass(result.insight.rank)}`}>
          <span>{appCopy.result.rank}</span>
          <strong>{result.insight.rank}</strong>
          <p>{appCopy.result.totalScore(result.insight.totalScore)}</p>
          <em>{result.insight.pointsToNextRank === null ? appCopy.result.maxRank : appCopy.result.pointsToNext(result.insight.pointsToNextRank, result.insight.nextRank)}</em>
        </div>
        <div className="score-attack-note">
          <span>{appCopy.result.scoreNote}</span>
          <p>{result.insight.scoreNote}</p>
        </div>
        <div className="replay-challenge-note">
          <span>{appCopy.result.challenge}</span>
          <strong>{nextChallenge(result)}</strong>
          <p>{sameSeedHint(result)}</p>
        </div>
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
      </section>
      <section className="packet-panel cue-note-panel">
        <div className="section-heading">
          <p>{appCopy.result.record}</p>
          <h2>{appCopy.result.bestCue}</h2>
        </div>
        {result.insight.bestCue ? (
          <article className="best-cue-card">
            <span>{bestCueMeta(result.insight.bestCue)}</span>
            <h3>{result.insight.bestCue.sceneTitle}</h3>
            <p>{bestCueBody(result.insight.bestCue)}</p>
          </article>
        ) : null}
        <div className="next-note">
          <span>{appCopy.result.nextHandoff}</span>
          <p>{result.insight.nextNote}</p>
        </div>
      </section>
      <section className="packet-panel survey-panel">
        <div className="section-heading">
          <p>{appCopy.result.surveyKicker}</p>
          <h2>{appCopy.result.surveyTitle}</h2>
        </div>
        <div className="survey-grid">
          <SurveyMeter label={appCopy.result.surveyLabels.encore} value={result.audienceSurvey.encoreInterest} />
          <SurveyMeter label={appCopy.result.surveyLabels.afterglow} value={result.audienceSurvey.lingeringAfterglow} />
          <SurveyMeter label={appCopy.result.surveyLabels.heat} value={result.audienceSurvey.sceneHeat} />
          <SurveyMeter label={appCopy.result.surveyLabels.stability} value={result.audienceSurvey.stability} />
        </div>
      </section>
      <section className="packet-panel media-review-panel">
        <div className="section-heading">
          <p>{appCopy.result.mediaReview}</p>
          <h2>{result.mediaReview.outlet}</h2>
        </div>
        <div className="media-review">
          <span>{'★'.repeat(result.mediaReview.stars)}{'☆'.repeat(5 - result.mediaReview.stars)}</span>
          <strong>{result.mediaReview.headline}</strong>
          <p>{result.mediaReview.quote}</p>
        </div>
      </section>
      <section className="packet-panel decision-report-panel">
        <div className="section-heading">
          <p>{appCopy.result.record}</p>
          <h2>{appCopy.result.decisionTrend}</h2>
        </div>
        <div className="decision-bars">
          {result.insight.decisionDistribution.map((item) => (
            <div key={item.response} className="decision-bar">
              <span><Icon name={item.response} />{RESPONSE_LABELS[item.response]}</span>
              <meter min={0} max={maxDecisionCount} value={item.count} />
              <strong>{appCopy.result.decisionCount(item.count)}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="highlight-panel packet-panel timeline-report-panel">
        <div className="section-heading">
          <p>{appCopy.result.record}</p>
          <h2>{appCopy.result.timeline}</h2>
        </div>
        <div className="performance-timeline">
          {timelineLogs.map((log) => (
            <article key={`${log.totalTurn}-${log.sceneTitle}`} className={`timeline-tier-${log.resultTier}`}>
              <span>{timelineMeta(log)}</span>
              <h3>{log.sceneTitle}</h3>
              <p>{timelineBody(log)}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="result-actions">
        <button className="primary-action" onClick={onReplayNew}>{appCopy.result.replayNew}</button>
        <button className="secondary-action" onClick={onReplaySame}>{appCopy.result.replaySame}</button>
        <button className="ghost-button" onClick={onTitle}>{appCopy.result.title}</button>
      </div>
    </main>
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

function SurveyMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="survey-meter">
      <span>{label}</span>
      <strong>{value}%</strong>
      <meter min={0} max={100} value={value} />
    </div>
  );
}

function nextChallenge(result: PerformanceResult) {
  const swingTurn = mostImproveableTurn(result);
  return nextChallengeCopy(result, swingTurn);
}

function sameSeedHint(result: PerformanceResult) {
  const swingTurn = mostImproveableTurn(result);
  return sameSeedHintCopy(result, swingTurn);
}

function mostImproveableTurn(result: PerformanceResult) {
  return [...result.logs]
    .filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident' || log.prepQuality === 'miss' || log.deltaLoad >= 2)
    .sort((a, b) => (
      (tierRisk(b.resultTier) - tierRisk(a.resultTier))
      || b.deltaLoad - a.deltaLoad
      || Number(b.prepQuality === 'miss') - Number(a.prepQuality === 'miss')
    ))[0] ?? null;
}

function tierRisk(tier: PerformanceResult['logs'][number]['resultTier']) {
  if (tier === 'accident') return 4;
  if (tier === 'fray') return 3;
  if (tier === 'smallSuccess') return 2;
  if (tier === 'scene') return 1;
  return 0;
}

function rankClass(rank: PerformanceResult['insight']['rank']) {
  return rank.replace('+', 'plus').toLowerCase();
}

import { Icon } from '../../components/ui/Icon';
import { RESPONSE_LABELS } from '../../game/constants';
import type { PerformanceResult, ResultTier } from '../../game/types';
import { appCopy, timelineBody, timelineMeta } from '../../content/ja/appCopy';
import styles from './ResultScreenSections.module.css';

export function ResultRecordDetails({ result }: { result: PerformanceResult }) {
  const timelineLogs = result.logs?.length ? result.logs : result.highlights;
  const maxDecisionCount = Math.max(1, ...result.insight.decisionDistribution.map((item) => item.count));
  return (
    <details className={styles.recordDetails}>
      <summary>{appCopy.result.recordDetails}</summary>
      <div className="result-record-stack">
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
              <article key={`${log.totalTurn}-${log.sceneTitle}`} className={timelineTierClass[log.resultTier]}>
                <span>{timelineMeta(log)}</span>
                <h3>{log.sceneTitle}</h3>
                <p>{timelineBody(log)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </details>
  );
}

const timelineTierClass: Record<ResultTier, string> = {
  masterpiece: 'timeline-tier-masterpiece',
  scene: 'timeline-tier-scene',
  smallSuccess: 'timeline-tier-smallSuccess',
  fray: 'timeline-tier-fray',
  accident: 'timeline-tier-accident',
};

function SurveyMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="survey-meter">
      <span>{label}</span>
      <strong>{value}%</strong>
      <meter min={0} max={100} value={value} />
    </div>
  );
}

import type { PerformanceResult } from '../../game/types';
import { appCopy, bestCueBody, bestCueMeta } from '../../content/ja/appCopy';
import { backstageFinishedLog, backstageLogCopy } from '../../content/ja/backstageLogCopy';
import styles from './ResultScreenSections.module.css';

export function ResultCueNotePanel({ result }: { result: PerformanceResult }) {
  const backstageNote = backstageFinishedLog(result);
  return (
    <section className={styles.cueNotePanel}>
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
      <aside className="backstage-log-note">
        <span>{backstageLogCopy.finishedLabel}</span>
        <p>{backstageNote}</p>
      </aside>
    </section>
  );
}

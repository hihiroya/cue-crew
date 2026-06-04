import { useState } from 'react';
import titlePosterImage from '../assets/title/title-poster.webp';
import type { PerformanceResult } from '../game/types';
import type { CollectionState } from '../game/rogueliteProgress';
import { Icon } from '../components/ui/Icon';
import { dailyRunFor } from '../game/rogueliteProgress';
import { appCopy, titleHistoryMeta } from '../content/ja/appCopy';

type Props = {
  history: PerformanceResult[];
  collection: CollectionState;
  onStart: () => void;
  onStartDaily: (seed: string) => void;
  onReplay: (seed: string) => void;
};

export function TitleScreen({ history, collection, onStart, onStartDaily, onReplay }: Props) {
  const [showHowTo, setShowHowTo] = useState(false);
  const bests = historyBests(history);
  const dailyRun = dailyRunFor();
  const dailyBest = history.find((item) => item.seed === dailyRun.seed);
  return (
    <main className="title-screen">
      <section className="title-panel">
        <div className="title-ghost-stage" aria-hidden="true">
          <img src={titlePosterImage} alt="" draggable={false} />
        </div>
        <div className="stage-mark"><Icon name="spark" /></div>
        <div className="title-lockup">
          <p className="title-series">{appCopy.title.series}</p>
          <h1 className="title-logo" aria-label={appCopy.title.logoLabel}>
            <span>{appCopy.title.logoFirst}</span>
            <span className="title-cross" aria-hidden="true" />
            <span>{appCopy.title.logoSecond}</span>
          </h1>
          <p className="title-copy">{appCopy.title.catchphrase}</p>
          <div className="title-actions">
            <button className="primary-action" onClick={onStart}>{appCopy.title.start}</button>
            <button className="secondary-action" onClick={() => setShowHowTo((value) => !value)}>{appCopy.title.howTo}</button>
          </div>
        </div>
        {showHowTo ? (
          <div className="howto-panel">
            {appCopy.title.howToLines.map((line) => <p key={line}>{line}</p>)}
          </div>
        ) : null}
      </section>
      <section className="daily-run-panel">
        <div className="section-heading">
          <p><Icon name="spark" /> {appCopy.title.dailyKicker}</p>
          <h2>{dailyRun.title}</h2>
        </div>
        <div className="daily-run-card">
          <span>{dailyRun.modifier}</span>
          <p>{dailyRun.detail}</p>
          <small>{dailyBest ? appCopy.title.dailyBest(dailyBest.insight.rank, dailyBest.insight.totalScore) : appCopy.title.dailyFresh}</small>
          <button type="button" className="secondary-action" onClick={() => onStartDaily(dailyRun.seed)}>{appCopy.title.dailyStart}</button>
        </div>
      </section>
      <section className="collection-panel">
        <div className="section-heading">
          <p><Icon name="history" /> {appCopy.title.collectionKicker}</p>
          <h2>{appCopy.title.collectionTitle}</h2>
        </div>
        <div className="collection-summary-grid">
          <span>
            {appCopy.title.collectionScenes}
            <strong>{Object.keys(collection.scenes).length}</strong>
          </span>
          <span>
            {appCopy.title.collectionAchievements}
            <strong>{Object.keys(collection.achievements).length}</strong>
          </span>
        </div>
        <p className="collection-note">{latestAchievementNote(collection)}</p>
      </section>
      <section className="history-panel">
        <div className="section-heading">
          <p><Icon name="history" /> {appCopy.title.historyKicker}</p>
          <h2>{appCopy.title.historyTitle}</h2>
        </div>
        {history.length === 0 ? (
          <p className="muted">{appCopy.title.emptyHistory}</p>
        ) : (
          <div className="history-list">
            {history.map((item, index) => (
              <button key={`${item.seed}-${item.finishedAt}`} onClick={() => onReplay(item.seed)}>
                <strong>{item.title}</strong>
                <span>{appCopy.title.historyStats(item)}</span>
                <small>{historyMeta(item, history.slice(index + 1), bests)}</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function latestAchievementNote(collection: CollectionState) {
  const latest = Object.values(collection.achievements)
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))[0];
  return latest ? `${latest.label}: ${latest.detail}` : appCopy.title.collectionEmpty;
}

function historyBests(history: PerformanceResult[]) {
  const total = (item: PerformanceResult) => item.insight.totalScore;
  return {
    rank: history.reduce<PerformanceResult | null>((best, item) => (!best || total(item) > total(best) ? item : best), null),
    scene: history.reduce<PerformanceResult | null>((best, item) => (!best || item.sceneScore > best.sceneScore ? item : best), null),
    load: history.reduce<PerformanceResult | null>((best, item) => (!best || item.backstageLoad < best.backstageLoad ? item : best), null),
  };
}

function historyMeta(item: PerformanceResult, olderHistory: PerformanceResult[], bests: ReturnType<typeof historyBests>) {
  const previousSameSeed = olderHistory.find((entry) => entry.seed === item.seed);
  const badges = [
    bests.rank === item ? appCopy.title.bestBadges.rank : '',
    bests.scene === item ? appCopy.title.bestBadges.scene : '',
    bests.load === item ? appCopy.title.bestBadges.load : '',
  ].filter(Boolean).join(' / ');
  return titleHistoryMeta({ item, previousSameSeed, badges });
}

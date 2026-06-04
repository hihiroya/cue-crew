import { useMemo, useState } from 'react';
import titlePosterImage from '../assets/title/title-poster.webp';
import type { PerformanceResult } from '../game/types';
import { ACHIEVEMENT_CATALOG, dailyRunFor, lockedSceneHints, nextChallengeRecommendation, resultTierShort, type CollectionState, type NextChallengeRecommendation } from '../game/rogueliteProgress';
import { analyzeReplayImprovement } from '../game/replayAnalysis';
import { Icon } from '../components/ui/Icon';
import { ACTOR_LABELS, EVENT_LABELS, RESPONSE_LABELS } from '../game/constants';
import { appCopy, titleHistoryMeta } from '../content/ja/appCopy';

type Props = {
  history: PerformanceResult[];
  collection: CollectionState;
  dailyBests: Record<string, PerformanceResult>;
  onStart: () => void;
  onStartDaily: (seed: string) => void;
  onReplay: (seed: string) => void;
};

export function TitleScreen({ history, collection, dailyBests, onStart, onStartDaily, onReplay }: Props) {
  const [showHowTo, setShowHowTo] = useState(false);
  const [showCollection, setShowCollection] = useState(() => new URLSearchParams(globalThis.location?.search ?? '').get('uiScenario') === 'title-collection');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const bests = historyBests(history);
  const badgeOptions = historyBadgeOptions(history);
  const displayHistory = selectedBadgeId
    ? history.filter((item) => item.insight.performanceBadges?.some((badge) => badge.id === selectedBadgeId))
    : history;
  const dailyRun = dailyRunFor();
  const dailyBest = dailyBests[dailyRun.seed];
  const replaySuggestions = useMemo(() => Object.fromEntries(
    history.map((item) => [item.seed, analyzeReplayImprovement(item)]),
  ), [history]);
  const recommendation = nextChallengeRecommendation({ history, collection, dailyRun, dailyBest, replaySuggestions });
  const startRecommendation = () => {
    if (recommendation.kind === 'daily' && recommendation.seed) {
      onStartDaily(recommendation.seed);
      return;
    }
    if (recommendation.kind === 'replaySeed' && recommendation.seed) {
      onReplay(recommendation.seed);
      return;
    }
    onStart();
  };
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
      <NextPerformancePanel recommendation={recommendation} onStart={startRecommendation} />
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
        <button type="button" className="secondary-action collection-toggle" onClick={() => setShowCollection((value) => !value)}>
          {showCollection ? appCopy.title.collectionClose : appCopy.title.collectionOpen}
        </button>
        {showCollection ? <CollectionDetails collection={collection} onReplay={onReplay} /> : null}
      </section>
      <section className="history-panel">
        <div className="section-heading">
          <p><Icon name="history" /> {appCopy.title.historyKicker}</p>
          <h2>{appCopy.title.historyTitle}</h2>
        </div>
        {history.length === 0 ? (
          <p className="muted">{appCopy.title.emptyHistory}</p>
        ) : (
          <>
            {badgeOptions.length ? (
              <div className="history-badge-filter" aria-label={appCopy.title.historyBadgeFilter}>
                <button type="button" className={selectedBadgeId === null ? 'is-active' : ''} onClick={() => setSelectedBadgeId(null)}>{appCopy.title.historyBadgeAll}</button>
                {badgeOptions.map((badge) => (
                  <button key={badge.id} type="button" className={selectedBadgeId === badge.id ? 'is-active' : ''} onClick={() => setSelectedBadgeId(badge.id)}>
                    {badge.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="history-list">
              {displayHistory.map((item) => (
                <button key={`${item.seed}-${item.finishedAt}`} onClick={() => onReplay(item.seed)}>
                  <strong>{item.title}</strong>
                  <span>{appCopy.title.historyStats(item)}</span>
                  {item.insight.performanceBadges?.length ? <BadgeStrip badges={item.insight.performanceBadges.slice(0, 2)} /> : null}
                  <small>{historyMeta(item, history.slice(history.indexOf(item) + 1), bests)}</small>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function NextPerformancePanel({ recommendation, onStart }: { recommendation: NextChallengeRecommendation; onStart: () => void }) {
  return (
    <section className={`next-performance-panel next-${recommendation.kind}`}>
      <div>
        <span>{recommendation.kicker}</span>
        <h2>{recommendation.title}</h2>
        <p>{recommendation.body}</p>
      </div>
      <button type="button" className="primary-action" onClick={onStart}>{recommendation.cta}</button>
    </section>
  );
}

function BadgeStrip({ badges }: { badges: NonNullable<PerformanceResult['insight']['performanceBadges']> }) {
  return (
    <div className="performance-badge-strip" aria-label={appCopy.title.historyBadges}>
      {badges.map((badge) => (
        <em key={badge.id} className={`performance-badge badge-${badge.tone}`} title={badge.detail}>{badge.label}</em>
      ))}
    </div>
  );
}

function latestAchievementNote(collection: CollectionState) {
  const latest = Object.values(collection.achievements)
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))[0];
  return latest ? `${latest.label}: ${latest.detail}` : appCopy.title.collectionEmpty;
}

function CollectionDetails({ collection, onReplay }: { collection: CollectionState; onReplay: (seed: string) => void }) {
  const scenes = Object.values(collection.scenes)
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))
    .slice(0, 8);
  const lockedHints = lockedSceneHints(collection);
  return (
    <div className="collection-details">
      <section>
        <h3>{appCopy.title.collectionRecentScenes}</h3>
        {scenes.length ? (
          <div className="collection-scene-list">
            {scenes.map((scene) => (
              <article key={scene.id}>
                <span>{labelFor(ACTOR_LABELS, scene.actor)} / {labelFor(EVENT_LABELS, scene.event)} / {labelFor(RESPONSE_LABELS, scene.response)}</span>
                <strong>{scene.title}</strong>
                <small>{resultTierShort(scene.bestTier)} / {scene.firstSeed}</small>
                <button type="button" className="ghost-button collection-replay-button" onClick={() => onReplay(scene.firstSeed)}>{appCopy.title.collectionReplay}</button>
              </article>
            ))}
          </div>
        ) : <p>{appCopy.title.collectionNoScenes}</p>}
      </section>
      <section>
        <h3>{appCopy.title.collectionLockedScenes}</h3>
        <div className="collection-scene-list">
          {lockedHints.map((hint) => (
            <article key={hint.id} className="is-locked">
              <span>{hint.actor === 'any' ? '？？？' : labelFor(ACTOR_LABELS, hint.actor)} / {labelFor(EVENT_LABELS, hint.event)} / {hint.response ? labelFor(RESPONSE_LABELS, hint.response) : '？？？'}</span>
              <strong>未開放の場面</strong>
              <small>{hint.hint}</small>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h3>{appCopy.title.collectionAchievementList}</h3>
        <div className="collection-achievement-list">
          {ACHIEVEMENT_CATALOG.map((item) => {
            const unlocked = collection.achievements[item.id];
            return (
              <article key={item.id} className={unlocked ? 'is-unlocked' : 'is-locked'}>
                <span>{unlocked ? appCopy.title.collectionUnlocked : appCopy.title.collectionLocked}</span>
                <strong>{item.label}</strong>
                <small>{unlocked ? unlocked.detail : item.detail}</small>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function labelFor(labels: Record<string, string>, key: string) {
  return labels[key] ?? key;
}

function historyBests(history: PerformanceResult[]) {
  const total = (item: PerformanceResult) => item.insight.totalScore;
  return {
    rank: history.reduce<PerformanceResult | null>((best, item) => (!best || total(item) > total(best) ? item : best), null),
    scene: history.reduce<PerformanceResult | null>((best, item) => (!best || item.sceneScore > best.sceneScore ? item : best), null),
    load: history.reduce<PerformanceResult | null>((best, item) => (!best || item.backstageLoad < best.backstageLoad ? item : best), null),
  };
}

function historyBadgeOptions(history: PerformanceResult[]) {
  const badges = new Map<string, { id: string; label: string; count: number }>();
  history.forEach((item) => {
    item.insight.performanceBadges?.forEach((badge) => {
      const current = badges.get(badge.id);
      badges.set(badge.id, { id: badge.id, label: badge.label, count: (current?.count ?? 0) + 1 });
    });
  });
  return [...badges.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
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

import { useMemo, useState } from 'react';
import type { PerformanceResult } from '../game/types';
import { dailyRunFor, nextChallengeRecommendation, type CollectionState } from '../game/rogueliteProgress';
import { analyzeReplayImprovement } from '../game/replayAnalysis';
import {
  CollectionView,
  HomeView,
  HowToView,
  RecordsView,
  TitleHero,
  TitleNav,
  historyBadgeOptions,
  historyBests,
} from './title/TitleScreenViews';
import { initialTitleView, updateTitleViewParam, type TitleView } from './title/titleViewState';

type Props = {
  history: PerformanceResult[];
  collection: CollectionState;
  dailyBests: Record<string, PerformanceResult>;
  onStart: () => void;
  onStartDaily: (seed: string) => void;
  onReplay: (seed: string) => void;
};

export function TitleScreen({ history, collection, dailyBests, onStart, onStartDaily, onReplay }: Props) {
  const [titleView, setTitleView] = useState<TitleView>(initialTitleView);
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
  const showView = (view: TitleView) => {
    setTitleView(view);
    updateTitleViewParam(view);
  };
  return (
    <main className="title-screen">
      <TitleHero />
      <TitleNav activeView={titleView} onSelect={showView} />
      {titleView === 'home' ? (
        <HomeView
          recommendation={recommendation}
          onStart={onStart}
          onStartRecommendation={startRecommendation}
        />
      ) : null}
      {titleView === 'records' ? (
        <RecordsView
          history={history}
          displayHistory={displayHistory}
          badgeOptions={badgeOptions}
          selectedBadgeId={selectedBadgeId}
          bests={bests}
          onSelectBadge={setSelectedBadgeId}
          onReplay={onReplay}
        />
      ) : null}
      {titleView === 'collection' ? <CollectionView collection={collection} onReplay={onReplay} /> : null}
      {titleView === 'howTo' ? <HowToView onStart={startRecommendation} /> : null}
    </main>
  );
}

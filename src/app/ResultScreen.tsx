import type { PerformanceResult } from '../game/types';
import type { CollectionState, DailyRun } from '../game/rogueliteProgress';
import { ResultActions, ResultCueNotePanel, ResultHeroSection, ResultRecordDetails } from './result/ResultScreenSections';
import styles from './result/ResultScreen.module.css';

type Props = {
  result: PerformanceResult;
  previousSameSeed: PerformanceResult | null;
  collection: CollectionState;
  dailyRun: DailyRun;
  dailyBest: PerformanceResult | null;
  onTitle: () => void;
  onReplaySame: () => void;
  onReplayNew: () => void;
  onReplayDaily: (seed: string) => void;
};

export function ResultScreen({ result, previousSameSeed, dailyRun, onTitle, onReplaySame, onReplayNew, onReplayDaily }: Props) {
  return (
    <main className={styles.root}>
      <ResultHeroSection result={result} previousSameSeed={previousSameSeed} />
      <ResultCueNotePanel result={result} />
      <ResultRecordDetails result={result} />
      <ResultActions
        dailyRun={dailyRun}
        onReplayDaily={onReplayDaily}
        onReplayNew={onReplayNew}
        onReplaySame={onReplaySame}
        onTitle={onTitle}
      />
    </main>
  );
}

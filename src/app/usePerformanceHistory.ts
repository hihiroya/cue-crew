import { useEffect, useMemo, useRef, useState } from 'react';
import { finishPerformance } from '../game/gameReducer';
import { readCollectionState, readDailyBestResults, saveCollectionForResult, saveDailyBestForResult } from '../game/rogueliteProgress';
import { readPerformanceHistory, savePerformanceResult } from './storage/performanceHistoryStorage';
import type { GameState } from '../game/types';

export function usePerformanceHistory(displayState: GameState, disabled = false) {
  const [historyVersion, setHistoryVersion] = useState(0);
  const savedFinishedStateRef = useRef<GameState | null>(null);
  const history = useMemo(() => {
    historyVersion;
    return readPerformanceHistory();
  }, [historyVersion]);
  const collection = useMemo(() => {
    historyVersion;
    return readCollectionState();
  }, [historyVersion]);
  const dailyBests = useMemo(() => {
    historyVersion;
    return readDailyBestResults();
  }, [historyVersion]);
  const finishedResult = useMemo(() => (
    displayState.status === 'finished' ? finishPerformance(displayState) : null
  ), [displayState]);

  useEffect(() => {
    if (disabled || displayState.status !== 'finished' || !finishedResult) return;
    if (savedFinishedStateRef.current === displayState) return;
    savePerformanceResult(finishedResult);
    saveCollectionForResult(finishedResult);
    saveDailyBestForResult(finishedResult);
    savedFinishedStateRef.current = displayState;
    setHistoryVersion((version) => version + 1);
  }, [disabled, displayState, finishedResult]);

  const refreshHistory = () => setHistoryVersion((version) => version + 1);

  return { history, collection, dailyBests, finishedResult, refreshHistory };
}

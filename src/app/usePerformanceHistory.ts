import { useEffect, useMemo, useRef, useState } from 'react';
import { finishPerformance, readPerformanceHistory, savePerformanceResult } from '../game/gameReducer';
import type { GameState } from '../game/types';

export function usePerformanceHistory(displayState: GameState, disabled = false) {
  const [historyVersion, setHistoryVersion] = useState(0);
  const savedFinishedStateRef = useRef<GameState | null>(null);
  const history = useMemo(() => {
    historyVersion;
    return readPerformanceHistory();
  }, [historyVersion]);
  const finishedResult = useMemo(() => (
    displayState.status === 'finished' ? finishPerformance(displayState) : null
  ), [displayState]);

  useEffect(() => {
    if (disabled || displayState.status !== 'finished' || !finishedResult) return;
    if (savedFinishedStateRef.current === displayState) return;
    savePerformanceResult(finishedResult);
    savedFinishedStateRef.current = displayState;
    setHistoryVersion((version) => version + 1);
  }, [disabled, displayState, finishedResult]);

  const refreshHistory = () => setHistoryVersion((version) => version + 1);

  return { history, finishedResult, refreshHistory };
}

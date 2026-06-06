import { useEffect, useState, type Dispatch } from 'react';
import type { GameAction } from '../game/gameReducer';
import type { GameStatus, PerformanceResult, PrepAction } from '../game/types';

type PendingPrepCue = {
  prep: PrepAction;
};

export function usePendingPrepCue({
  dispatch,
  previousSameSeedRun,
  stateStatus,
}: {
  dispatch: Dispatch<GameAction>;
  previousSameSeedRun: PerformanceResult | null;
  stateStatus: GameStatus;
}) {
  const [pendingPrepCue, setPendingPrepCue] = useState<PendingPrepCue | null>(null);

  useEffect(() => {
    if (!pendingPrepCue) return;
    if (stateStatus !== 'prep') {
      setPendingPrepCue(null);
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReducedMotion ? 120 : previousSameSeedRun ? 260 : 1200;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'SELECT_PREP', prep: pendingPrepCue.prep });
      setPendingPrepCue(null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [dispatch, pendingPrepCue, previousSameSeedRun, stateStatus]);

  const beginPrepCue = (prep: PrepAction) => {
    if (pendingPrepCue) return;
    setPendingPrepCue({ prep });
  };

  return { pendingPrepCue, beginPrepCue };
}

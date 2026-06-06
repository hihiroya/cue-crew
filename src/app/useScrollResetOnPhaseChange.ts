import { useEffect } from 'react';
import type { GameStatus } from '../game/types';

export function useScrollResetOnPhaseChange({
  disabled,
  status,
  totalTurn,
}: {
  disabled: boolean;
  status: GameStatus;
  totalTurn: number;
}) {
  useEffect(() => {
    if (disabled) return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [disabled, status, totalTurn]);
}

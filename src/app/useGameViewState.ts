import { useMemo } from 'react';
import { getUiScenarioStateFromLocation } from '../game/uiScenarios';
import type { GameState } from '../game/types';

export function useGameViewState(state: GameState) {
  const uiScenarioState = useMemo(() => getUiScenarioStateFromLocation(), []);
  return {
    displayState: uiScenarioState ?? state,
    isUiScenario: Boolean(uiScenarioState),
  };
}

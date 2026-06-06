import { createInitialGame } from './gameReducer';
import { uiScenarioCopy } from '../content/ja/uiScenarioCopy';
import { finishedScenario, prepScenario, responseScenario } from './uiScenarioBuilders';
import { seedUiScenarioStorage } from './uiScenarioStorage';
import type { GameState } from './types';

export const UI_SCENARIO_QUERY_KEY = 'uiScenario';

export function getUiScenarioStateFromLocation(search = globalThis.location?.search ?? ''): GameState | null {
  const name = new URLSearchParams(search).get(UI_SCENARIO_QUERY_KEY);
  if (!name) return null;
  seedUiScenarioStorage(name);
  return uiScenarioState(name);
}

export function uiScenarioState(name: string): GameState | null {
  if (name === 'title-default') return titleScenario('ui-title-default');
  if (name === 'title-history-legacy') return titleScenario('ui-title-history-legacy');
  if (name === 'title-collection') return titleScenario('ui-title-collection');
  if (name === 'prep-default') return prepScenario('watch');
  if (name === 'prep-selected-space') return prepScenario('makeSpace');
  if (name === 'response-primary') {
    return responseScenario(name, {
      prep: 'watch',
      event: 'adlib',
      selectedResponse: 'catch',
      focus: 'junior',
      focusState: 'elated',
    });
  }
  if (name === 'response-alternate') {
    return responseScenario(name, {
      prep: 'watch',
      event: 'heatUp',
      selectedResponse: 'arrange',
      focus: 'lead',
      focusState: 'contemplative',
      totalTurn: 3,
      performanceStyle: 'control',
      flowScore: 3,
      trustScore: 2,
    });
  }
  if (name === 'response-danger') {
    return responseScenario(name, {
      prep: 'makeSpace',
      event: 'tempoRush',
      selectedResponse: 'wait',
      focus: 'junior',
      focusState: 'elated',
      focusFatigue: 2,
      trustScore: -4,
      backstageLoad: 5,
      lastResponses: ['wait', 'wait'],
    });
  }
  if (name === 'response-many-effects') {
    return responseScenario(name, {
      prep: 'watch',
      event: 'heatUp',
      selectedResponse: 'catch',
      focus: 'junior',
      focusState: 'elated',
      totalTurn: 4,
      performanceStyle: 'heat',
      sceneScore: 5,
      trustScore: 3,
      backstageLoad: 4,
      lastResponses: ['catch', 'catch'],
    });
  }
  if (name === 'response-long-label') {
    return responseScenario(name, {
      prep: 'tightenFlow',
      event: 'positionShift',
      eventTitle: uiScenarioCopy.longEventTitle,
      eventDescription: uiScenarioCopy.longEventDescription,
      selectedResponse: 'arrange',
      focus: 'skilled',
      focusState: 'fatigued',
      focusFatigue: 3,
      totalTurn: 5,
      performanceStyle: 'control',
      flowScore: 6,
      trustScore: 2,
      backstageLoad: 3,
    });
  }
  if (name === 'response-fray') {
    return responseScenario(name, {
      prep: 'makeSpace',
      event: 'silence',
      selectedResponse: 'wait',
      focus: 'lead',
      focusState: 'contemplative',
      totalTurn: 3,
      trustScore: 2,
      backstageLoad: 4,
      pendingFrayEvent: { bias: 'sound', title: uiScenarioCopy.soundFrayTitle },
      loadStrain: { light: 0, sound: 4, stageManagement: 1, props: 0 },
    });
  }
  if (name === 'result-preview') {
    return {
      ...responseScenario(name, {
        prep: 'watch',
        event: 'adlib',
        selectedResponse: 'catch',
        focus: 'junior',
        focusState: 'elated',
        totalTurn: 2,
        sceneScore: 3,
        trustScore: 2,
      }),
      status: 'result',
    };
  }
  if (name === 'result-fray') {
    return {
      ...responseScenario(name, {
        prep: 'makeSpace',
        event: 'silence',
        selectedResponse: 'wait',
        focus: 'lead',
        focusState: 'contemplative',
        totalTurn: 3,
        trustScore: 2,
        backstageLoad: 4,
        pendingFrayEvent: { bias: 'sound', title: uiScenarioCopy.soundFrayTitle },
        loadStrain: { light: 0, sound: 4, stageManagement: 1, props: 0 },
      }),
      status: 'result',
    };
  }
  if (name === 'finished-heat') return finishedScenario('finished-heat');
  if (name === 'finished-rough') return finishedScenario('finished-rough', {
    sceneScore: 8,
    flowScore: -6,
    trustScore: -1,
    backstageLoad: 4,
    performanceStyle: 'heat',
  });
  return null;
}

function titleScenario(seed: string): GameState {
  return { ...createInitialGame(seed), currentFocusActorId: null, status: 'title' };
}

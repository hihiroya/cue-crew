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

const scenarioBuilders: Record<string, () => GameState> = {
  'title-default': () => titleScenario('ui-title-default'),
  'title-history-legacy': () => titleScenario('ui-title-history-legacy'),
  'title-collection': () => titleScenario('ui-title-collection'),
  'prep-default': () => prepScenario('watch'),
  'prep-selected-space': () => prepScenario('makeSpace'),
  'response-primary': () => responseScenario('response-primary', {
    prep: 'watch',
    event: 'adlib',
    selectedResponse: 'catch',
    focus: 'junior',
    focusState: 'elated',
  }),
  'response-alternate': () => responseScenario('response-alternate', {
    prep: 'watch',
    event: 'heatUp',
    selectedResponse: 'arrange',
    focus: 'lead',
    focusState: 'contemplative',
    totalTurn: 3,
    performanceStyle: 'control',
    flowScore: 3,
    trustScore: 2,
  }),
  'response-danger': () => responseScenario('response-danger', {
    prep: 'makeSpace',
    event: 'tempoRush',
    selectedResponse: 'wait',
    focus: 'junior',
    focusState: 'elated',
    focusFatigue: 2,
    trustScore: -4,
    backstageLoad: 5,
    lastResponses: ['wait', 'wait'],
  }),
  'response-many-effects': () => responseScenario('response-many-effects', {
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
  }),
  'response-long-label': () => responseScenario('response-long-label', {
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
  }),
  'response-fray': () => responseScenario('response-fray', {
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
  'response-wait-impact': () => responseScenario('response-wait-impact', {
    prep: 'watch',
    event: 'delayedExit',
    selectedResponse: 'wait',
    focus: 'lead',
    focusState: 'contemplative',
    totalTurn: 6,
    performanceStyle: 'breath',
    sceneScore: 7,
    flowScore: 2,
    trustScore: 4,
    backstageLoad: 3,
    lastResponses: ['wait', 'wait'],
    loadStrain: { light: 1, sound: 2, stageManagement: 3, props: 0 },
  }),
  'result-preview': () => ({
    ...responseScenario('result-preview', {
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
  }),
  'result-wait-impact': () => ({
    ...responseScenario('result-wait-impact', {
      prep: 'watch',
      event: 'delayedExit',
      selectedResponse: 'wait',
      focus: 'lead',
      focusState: 'contemplative',
      totalTurn: 6,
      performanceStyle: 'breath',
      sceneScore: 7,
      flowScore: 2,
      trustScore: 4,
      backstageLoad: 3,
      lastResponses: ['wait', 'wait'],
      loadStrain: { light: 1, sound: 2, stageManagement: 3, props: 0 },
    }),
    status: 'result',
  }),
  'result-fray': () => ({
    ...responseScenario('result-fray', {
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
  }),
  'finished-heat': () => finishedScenario('finished-heat'),
  'finished-rough': () => finishedScenario('finished-rough', {
    sceneScore: 8,
    flowScore: -6,
    trustScore: -1,
    backstageLoad: 4,
    performanceStyle: 'heat',
  }),
};

export function uiScenarioState(name: string): GameState | null {
  return scenarioBuilders[name]?.() ?? null;
}

function titleScenario(seed: string): GameState {
  return {
    ...createInitialGame(seed),
    currentFocusActorId: null,
    currentActorEvent: null,
    selectedPrep: null,
    selectedResponse: null,
    status: 'title',
  };
}

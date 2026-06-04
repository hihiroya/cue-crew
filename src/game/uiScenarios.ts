import { assignActorRoles } from './actorLogic';
import { EVENT_DESCRIPTIONS, EVENT_LABELS, INITIAL_ACTORS } from './constants';
import { createInitialGame } from './gameReducer';
import { actForTurn } from './turnCalendar';
import { uiScenarioCopy } from '../content/ja/uiScenarioCopy';
import type { ActorEvent, ActorEventType, ActorState, ActorType, FrayEvent, GameState, LoadBias, LoadStrain, MainResponse, PerformanceStyle, PrepAction, PrepPredictionQuality, ResultTier, TurnLog } from './types';

export const UI_SCENARIO_QUERY_KEY = 'uiScenario';

type ResponseScenarioOptions = {
  prep: PrepAction;
  event: ActorEventType;
  selectedResponse: MainResponse;
  eventTitle?: string;
  eventDescription?: string;
  focus?: ActorType;
  focusState?: ActorState;
  focusFatigue?: number;
  totalTurn?: number;
  performanceStyle?: PerformanceStyle | null;
  sceneScore?: number;
  flowScore?: number;
  trustScore?: number;
  backstageLoad?: number;
  lastResponses?: MainResponse[];
  pendingFrayEvent?: FrayEvent;
  loadStrain?: LoadStrain;
};

export function getUiScenarioStateFromLocation(search = globalThis.location?.search ?? ''): GameState | null {
  const name = new URLSearchParams(search).get(UI_SCENARIO_QUERY_KEY);
  if (!name) return null;
  seedUiScenarioStorage(name);
  return uiScenarioState(name);
}

export function uiScenarioState(name: string): GameState | null {
  if (name === 'title-default') return { ...createInitialGame('ui-title-default'), currentFocusActorId: null, status: 'title' };
  if (name === 'title-history-legacy') return { ...createInitialGame('ui-title-history-legacy'), currentFocusActorId: null, status: 'title' };
  if (name === 'title-collection') return { ...createInitialGame('ui-title-collection'), currentFocusActorId: null, status: 'title' };
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

function seedUiScenarioStorage(name: string) {
  if (name !== 'title-history-legacy' && name !== 'title-collection') return;
  try {
    if (name === 'title-history-legacy') {
      globalThis.localStorage?.setItem('honban.performance.history.v1', JSON.stringify([
        {
          seed: 'legacy-history-seed',
          finishedAt: '2026-01-01T00:00:00.000Z',
          sceneScore: 8,
          flowScore: -2,
          trustScore: 1,
          backstageLoad: 4,
          performanceStyle: 'heat',
          title: uiScenarioCopy.legacyTitle,
          review: uiScenarioCopy.legacyReview,
          highlights: [],
          logs: [],
        },
      ]));
      return;
    }
    globalThis.localStorage?.setItem('honban.collection.v1', JSON.stringify({
      scenes: {
        [`junior:adlib:catch:${uiScenarioCopy.collectionSceneTitle}`]: {
          id: `junior:adlib:catch:${uiScenarioCopy.collectionSceneTitle}`,
          title: uiScenarioCopy.collectionSceneTitle,
          actor: 'junior',
          event: 'adlib',
          response: 'catch',
          bestTier: 'scene',
          firstSeed: 'ui-collection-seed',
          firstSeenAt: '2026-06-04T00:00:00.000Z',
        },
      },
      achievements: {
        'read-the-room': {
          id: 'read-the-room',
          label: uiScenarioCopy.collectionAchievement.label,
          detail: uiScenarioCopy.collectionAchievement.detail,
          firstSeed: 'ui-collection-seed',
          firstSeenAt: '2026-06-04T00:00:00.000Z',
        },
      },
    }));
    globalThis.localStorage?.setItem('honban.performance.history.v1', JSON.stringify([
      {
        seed: 'ui-collection-seed',
        finishedAt: '2026-06-04T00:00:00.000Z',
        sceneScore: 12,
        flowScore: 4,
        trustScore: 5,
        backstageLoad: 1,
        performanceStyle: 'control',
        title: uiScenarioCopy.collectionScenarioTitle,
        review: uiScenarioCopy.legacyReview,
        highlights: [],
        logs: [],
      },
    ]));
  } catch {
    // UI scenario helpers must not affect normal play if storage is unavailable.
  }
}

function prepScenario(selectedPrep: PrepAction): GameState {
  const focus = 'junior';
  const base = createInitialGame('ui-prep-selected-space');
  return {
    ...base,
    actors: scenarioActors(focus, 'elated'),
    currentFocusActorId: focus,
    selectedPrep,
    status: 'prep',
  };
}

function responseScenario(name: string, options: ResponseScenarioOptions): GameState {
  const totalTurn = options.totalTurn ?? 1;
  const focus = options.focus ?? 'junior';
  const base = createInitialGame(`ui-${name}`);
  return {
    ...base,
    ...actForTurn(totalTurn),
    totalTurn,
    actors: scenarioActors(focus, options.focusState ?? 'elated', options.focusFatigue ?? 0),
    currentFocusActorId: focus,
    currentActorEvent: scenarioEvent(options.event, focus, options.eventTitle, options.eventDescription),
    selectedPrep: options.prep,
    selectedResponse: options.selectedResponse,
    lastResponses: options.lastResponses ?? [],
    performanceStyle: options.performanceStyle ?? null,
    sceneScore: options.sceneScore ?? base.sceneScore,
    flowScore: options.flowScore ?? base.flowScore,
    trustScore: options.trustScore ?? base.trustScore,
    backstageLoad: options.backstageLoad ?? base.backstageLoad,
    pendingFrayEvent: options.pendingFrayEvent,
    loadStrain: options.loadStrain ?? base.loadStrain,
    status: 'response',
  };
}

function scenarioActors(focus: ActorType, state: ActorState, fatigue = 0) {
  const actors = INITIAL_ACTORS.map((actor) => (
    actor.id === focus ? { ...actor, state, fatigue } : { ...actor }
  ));
  return assignActorRoles(actors, focus);
}

function scenarioEvent(type: ActorEventType, actorId: ActorType, title: string = EVENT_LABELS[type], description: string = EVENT_DESCRIPTIONS[type]): ActorEvent {
  return {
    type,
    actorId,
    title,
    description,
  };
}

type FinishedScenarioOptions = {
  sceneScore?: number;
  flowScore?: number;
  trustScore?: number;
  backstageLoad?: number;
  performanceStyle?: PerformanceStyle;
};

function finishedScenario(name: string, options: FinishedScenarioOptions = {}): GameState {
  const base = createInitialGame(`ui-${name}`);
  const performanceStyle = options.performanceStyle ?? 'control';
  return {
    ...base,
    ...actForTurn(6),
    totalTurn: 6,
    performanceStyle,
    sceneScore: options.sceneScore ?? 18,
    flowScore: options.flowScore ?? 7,
    trustScore: options.trustScore ?? 6,
    backstageLoad: options.backstageLoad ?? 2,
    loadBias: 'sound',
    logs: finishedLogs(performanceStyle),
    status: 'finished',
  };
}

function finishedLogs(performanceStyle: PerformanceStyle): TurnLog[] {
  return [
    turnLog(1, 1, 'junior', 'elated', 'adlib', 'watch', 'catch', 'scene', 5, 3, 1, 1, 1, uiScenarioCopy.finishedSceneTitles.adlib, 'light', true, 'hit', performanceStyle),
    turnLog(1, 2, 'lead', 'contemplative', 'silence', 'makeSpace', 'wait', 'smallSuccess', 3, 1, 1, 1, -1, uiScenarioCopy.finishedSceneTitles.silence, 'sound', true, 'hit', performanceStyle),
    turnLog(2, 1, 'skilled', 'anxious', 'positionShift', 'tightenFlow', 'arrange', 'scene', 4, 3, 2, 1, -1, uiScenarioCopy.finishedSceneTitles.position, 'stageManagement', true, 'hit', performanceStyle),
    turnLog(2, 2, 'junior', 'elated', 'heatUp', 'watch', 'catch', 'fray', 0, 0, -1, -1, 2, uiScenarioCopy.finishedSceneTitles.heat, 'light', false, 'partial', performanceStyle),
    turnLog(3, 1, 'lead', 'immersed', 'delayedExit', 'makeSpace', 'wait', 'masterpiece', 8, 4, 2, 3, -1, uiScenarioCopy.finishedSceneTitles.exit, 'sound', true, 'hit', performanceStyle),
    turnLog(3, 2, 'skilled', 'fatigued', 'ensembleWaver', 'tightenFlow', 'arrange', 'smallSuccess', 3, 1, 1, 0, -1, uiScenarioCopy.finishedSceneTitles.breath, 'stageManagement', true, 'hit', performanceStyle),
  ];
}

function turnLog(
  act: number,
  turnInAct: number,
  focusActorType: ActorType,
  actorState: ActorState,
  actorEventType: ActorEventType,
  prepAction: PrepAction,
  mainResponse: MainResponse,
  resultTier: ResultTier,
  score: number,
  deltaScene: number,
  deltaFlow: number,
  deltaTrust: number,
  deltaLoad: number,
  sceneTitle: string,
  loadBias: LoadBias,
  prepMatched: boolean,
  prepQuality: PrepPredictionQuality,
  performanceStyle: PerformanceStyle,
): TurnLog {
  return {
    act,
    turnInAct,
    totalTurn: (act - 1) * 2 + turnInAct,
    focusActorType,
    actorState,
    actorEventType,
    prepAction,
    mainResponse,
    resultTier,
    score,
    performanceStyle,
    prepMatched,
    prepQuality,
    sceneTitle,
    flavorText: uiScenarioCopy.fixedFlavorText,
    deltaScene,
    deltaFlow,
    deltaTrust,
    deltaLoad,
    loadBias,
  };
}

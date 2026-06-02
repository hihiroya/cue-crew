import { assignActorRoles } from './actorLogic';
import { EVENT_DESCRIPTIONS, EVENT_LABELS, INITIAL_ACTORS } from './constants';
import { createInitialGame } from './gameReducer';
import { actForTurn } from './scoring';
import type { ActorEvent, ActorEventType, ActorState, ActorType, FrayEvent, GameState, LoadStrain, MainResponse, PerformanceStyle, PrepAction } from './types';

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
  return uiScenarioState(name);
}

export function uiScenarioState(name: string): GameState | null {
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
      eventTitle: '立ち位置と照明の軸が大きくズレる',
      eventDescription: '立ち位置のズレが照明と客席の視線まで巻き込み、舞台全体の軸が揺れている。',
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
      pendingFrayEvent: { bias: 'sound', title: '残響が少し長く残った' },
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
        pendingFrayEvent: { bias: 'sound', title: '残響が少し長く残った' },
        loadStrain: { light: 0, sound: 4, stageManagement: 1, props: 0 },
      }),
      status: 'result',
    };
  }
  return null;
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

function scenarioEvent(type: ActorEventType, actorId: ActorType, title = EVENT_LABELS[type], description = EVENT_DESCRIPTIONS[type]): ActorEvent {
  return {
    type,
    actorId,
    title,
    description,
  };
}

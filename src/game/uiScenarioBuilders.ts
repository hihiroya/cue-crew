import { assignActorRoles } from './actorLogic';
import { EVENT_DESCRIPTIONS, EVENT_LABELS, INITIAL_ACTORS } from './constants';
import { createInitialGame } from './gameReducer';
import { actForTurn } from './turnCalendar';
import { uiScenarioCopy } from '../content/ja/uiScenarioCopy';
import type {
  ActorEvent,
  ActorEventType,
  ActorState,
  ActorType,
  FrayEvent,
  FinishedGameState,
  LoadBias,
  LoadStrain,
  MainResponse,
  PerformanceStyle,
  PrepGameState,
  PrepAction,
  PrepPredictionQuality,
  ResponseGameState,
  ResultTier,
  TurnLog,
} from './types';

type InspectedResponseScenario = ResponseGameState & {
  selectedResponse: MainResponse;
};

export type ResponseScenarioOptions = {
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

type FinishedScenarioOptions = {
  sceneScore?: number;
  flowScore?: number;
  trustScore?: number;
  backstageLoad?: number;
  performanceStyle?: PerformanceStyle;
};

export function prepScenario(selectedPrep: PrepAction): PrepGameState {
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

export function responseScenario(name: string, options: ResponseScenarioOptions): InspectedResponseScenario {
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

export function finishedScenario(name: string, options: FinishedScenarioOptions = {}): FinishedGameState {
  const base = createInitialGame(`ui-${name}`);
  const performanceStyle = options.performanceStyle ?? 'control';
  const focus = 'skilled';
  const event = scenarioEvent('ensembleWaver', focus);
  return {
    ...base,
    ...actForTurn(6),
    totalTurn: 6,
    actors: scenarioActors(focus, 'fatigued', 1),
    currentFocusActorId: focus,
    currentActorEvent: event,
    selectedPrep: 'tightenFlow',
    selectedResponse: 'arrange',
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

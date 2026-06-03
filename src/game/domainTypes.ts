export type ActorType = 'lead' | 'junior' | 'skilled';

export type ActorState =
  | 'elated'
  | 'contemplative'
  | 'anxious'
  | 'immersed'
  | 'fatigued';

export type Actor = {
  id: ActorType;
  type: ActorType;
  name: string;
  state: ActorState;
  trust: number;
  fatigue: number;
  currentRole: 'focus' | 'sign' | 'waiting';
};

export type ActorEventType =
  | 'stepForward'
  | 'adlib'
  | 'heatUp'
  | 'silence'
  | 'positionShift'
  | 'tempoRush'
  | 'delayedExit'
  | 'ensembleWaver';

export type ActorEvent = {
  type: ActorEventType;
  actorId: ActorType;
  title: string;
  description: string;
};

export type PrepAction = 'watch' | 'makeSpace' | 'tightenFlow' | 'prepareTransition';

export type MainResponse = 'catch' | 'arrange' | 'wait' | 'cut';

export type LoadBias = 'light' | 'sound' | 'stageManagement' | 'props' | null;

export type LoadBiasArea = Exclude<LoadBias, null>;

export type LoadStrain = Record<LoadBiasArea, number>;

export type ResultTier = 'masterpiece' | 'scene' | 'smallSuccess' | 'fray' | 'accident';

export type PrepPredictionQuality = 'hit' | 'partial' | 'miss';

export type PrepRecoveryTone = 'matched' | 'partial' | 'thin' | 'missed';

export type GameStatus = 'title' | 'prep' | 'response' | 'result' | 'finished';

export type PerformanceSlot = 'matinee' | 'soiree';

export type PerformanceStyle = 'heat' | 'breath' | 'control' | 'closure';

export type FrayEvent = {
  bias: LoadBiasArea;
  title: string;
};

export type TurnLog = {
  act: number;
  turnInAct: number;
  totalTurn: number;
  focusActorType: ActorType;
  actorState: ActorState;
  actorEventType: ActorEventType;
  prepAction: PrepAction;
  mainResponse: MainResponse;
  resultTier: ResultTier;
  score: number;
  performanceStyle: PerformanceStyle | null;
  prepMatched: boolean;
  prepQuality: PrepPredictionQuality;
  sceneTitle: string;
  flavorText: string;
  deltaScene: number;
  deltaFlow: number;
  deltaTrust: number;
  deltaLoad: number;
  loadBias: LoadBias;
};

export type GameState = {
  seed: string;
  act: number;
  turnInAct: number;
  totalTurn: number;
  theme: string;
  performanceStyle: PerformanceStyle | null;
  sceneScore: number;
  flowScore: number;
  trustScore: number;
  backstageLoad: number;
  loadBias: LoadBias;
  loadStrain: LoadStrain;
  actors: Actor[];
  currentFocusActorId: ActorType | null;
  currentActorEvent: ActorEvent | null;
  selectedPrep: PrepAction | null;
  selectedResponse: MainResponse | null;
  lastResponses: MainResponse[];
  pendingFrayEvent?: FrayEvent;
  logs: TurnLog[];
  status: GameStatus;
};

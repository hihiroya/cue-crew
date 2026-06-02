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

export type ScoreBreakdownTone = 'positive' | 'negative' | 'neutral';

export type ScoreBreakdownItem = {
  id: string;
  label: string;
  value: number;
  tone: ScoreBreakdownTone;
  detail?: string;
};

export type CueResultSummary = {
  keyPoint: string;
  cost: string;
  handoff: string;
  audienceReaction: string;
};

export type AudienceSurvey = {
  encoreInterest: number;
  lingeringAfterglow: number;
  sceneHeat: number;
  stability: number;
};

export type MediaReview = {
  outlet: string;
  stars: number;
  headline: string;
  quote: string;
};

export type DecisionDistributionItem = {
  response: MainResponse;
  count: number;
};

export type PerformanceInsight = {
  prepHits: number;
  prepHitRate: number;
  masterpieceCount: number;
  sceneOrBetterCount: number;
  frayOrAccidentCount: number;
  dominantResponse: MainResponse;
  decisionDistribution: DecisionDistributionItem[];
  bestCue: TurnLog | null;
  nextNote: string;
};

export type ResponseInsight = {
  response: MainResponse;
  score: number;
  resultTier: ResultTier;
  deltaLoad: number;
  successRangeLabel: string;
  upsideLabel: string;
  downsideLabel: string;
  prepRelationLabel: string;
  prepRelationTone: 'primary' | 'alternate' | 'poor';
  responseAimLabel: string;
  eventAffinityLabel: string;
  actorAffinityLabel: string;
  actInfluenceLabel: string;
  sideEffectLabel: string;
  frayRelationLabel?: string;
  frayRelationTone?: 'recover' | 'miss';
  dangerWarning?: string;
  rangeTone: 'best' | 'good' | 'thin' | 'danger';
  scoreBreakdown: ScoreBreakdownItem[];
};

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

export type ResultPreview = Omit<TurnLog, 'act' | 'turnInAct' | 'totalTurn'> & {
  score: number;
  day: number;
  performanceSlot: PerformanceSlot;
  performanceLabel: string;
  resultMode: 'matinee' | 'soiree' | 'finale';
  performanceStyle: PerformanceStyle | null;
  styleLabel?: string;
  styleText?: string;
  styleIsNew?: boolean;
  eventTitle: string;
  eventDescription: string;
  prepRelationLabel: string;
  prepRelationTone: ResponseInsight['prepRelationTone'];
  responseAimLabel: string;
  prepMatched: boolean;
  prepQuality: PrepPredictionQuality;
  prepRecoveryTone: PrepRecoveryTone;
  prepRecoveryLabel: string;
  prepRecoveryTitle: string;
  prepRecoveryText: string;
  cueSummary: CueResultSummary;
  scoreBreakdown: ScoreBreakdownItem[];
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

export type PerformanceResult = {
  seed: string;
  finishedAt: string;
  sceneScore: number;
  flowScore: number;
  trustScore: number;
  backstageLoad: number;
  performanceStyle: PerformanceStyle | null;
  title: string;
  review: string;
  reviewNotes: string[];
  insight: PerformanceInsight;
  audienceSurvey: AudienceSurvey;
  mediaReview: MediaReview;
  logs: TurnLog[];
  highlights: TurnLog[];
};

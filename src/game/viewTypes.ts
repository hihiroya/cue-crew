import type { ActorState, ActorType, ActorEventType, LoadBias, MainResponse, PerformanceSlot, PerformanceStyle, PrepAction, PrepPredictionQuality, PrepRecoveryTone, ResultTier, TurnLog } from './domainTypes';

export type ScoreBreakdownTone = 'positive' | 'negative' | 'neutral';

export type ScoreBreakdownItem = {
  id: string;
  label: string;
  value: number;
  tone: ScoreBreakdownTone;
  detail?: string;
};

export type ResponseEffectTarget = 'scene' | 'flow' | 'trust' | 'load';

export type ResponseEffect = {
  target: ResponseEffectTarget;
  value: number;
  repeat: boolean;
  label: string;
};

export type CueResultSummary = {
  keyPoint: string;
  cost: string;
  handoff: string;
  audienceReaction: string;
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
  sideEffects: ResponseEffect[];
  frayRelationLabel?: string;
  frayRelationTone?: 'recover' | 'miss';
  dangerWarning?: string;
  rangeTone: 'best' | 'good' | 'thin' | 'danger';
  scoreBreakdown: ScoreBreakdownItem[];
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
  focusActorType: ActorType;
  actorState: ActorState;
  actorEventType: ActorEventType;
  prepAction: PrepAction;
  mainResponse: MainResponse;
  resultTier: ResultTier;
  loadBias: LoadBias;
};

import type { MainResponse, PerformanceStyle, TurnLog } from './domainTypes';
import type { AchievementUnlock, BuildStyleSummary } from './rogueliteProgress';

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
  totalScore: number;
  rank: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
  nextRank: 'S+' | 'S' | 'A' | 'B' | 'C' | null;
  pointsToNextRank: number | null;
  scoreNote: string;
  prepHits: number;
  prepHitRate: number;
  masterpieceCount: number;
  sceneOrBetterCount: number;
  frayOrAccidentCount: number;
  dominantResponse: MainResponse;
  decisionDistribution: DecisionDistributionItem[];
  bestCue: TurnLog | null;
  nextNote: string;
  buildStyle: BuildStyleSummary;
  discoveryScore: number;
  unlockedAchievements: AchievementUnlock[];
  sceneCollectionCount: number;
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

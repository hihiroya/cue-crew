import { ACTS, INITIAL_ACTORS, INITIAL_LOAD_STRAIN, TURNS_PER_ACT, TOTAL_TURNS } from './constants';
import { FALLBACK_ACT_NAME } from '../content/ja/gameLabels';
import { advanceActorStates, assignActorRoles, pickFocusActor, resolveActorEvent } from './actorLogic';
import { nextLoadStrain, resolvePendingFray } from './fray';
import { createAudienceSurvey, createMediaReview, createPerformanceInsight, createPerformanceReview } from './performanceReport';
import { makeSeed } from './rng';
import { previewResult } from './resultPreview';
import { clampLoad, determinePerformanceStyle, toTurnLog } from './scoring';
import { actForTurn } from './turnCalendar';
import type { GameState, MainResponse, PerformanceResult, PrepAction } from './types';

export type GameAction =
  | { type: 'START'; seed?: string }
  | { type: 'SELECT_PREP'; prep: PrepAction }
  | { type: 'SELECT_RESPONSE'; response: MainResponse }
  | { type: 'COMMIT_RESULT' }
  | { type: 'RESET_TO_TITLE' };

const HISTORY_KEY = 'honban.performance.history.v1';

export function createInitialGame(seed = makeSeed()): GameState {
  const totalTurn = 1;
  const focus = pickFocusActor(seed, totalTurn);
  return {
    seed,
    ...actForTurn(totalTurn),
    totalTurn,
    sceneScore: 0,
    flowScore: 0,
    trustScore: 0,
    performanceStyle: null,
    backstageLoad: 0,
    loadBias: null,
    loadStrain: { ...INITIAL_LOAD_STRAIN },
    actors: assignActorRoles(INITIAL_ACTORS, focus),
    currentFocusActorId: focus,
    currentActorEvent: null,
    selectedPrep: null,
    selectedResponse: null,
    lastResponses: [],
    pendingFrayEvent: undefined,
    logs: [],
    status: 'prep',
  };
}

export const titleState: GameState = {
  ...createInitialGame('title-preview'),
  currentFocusActorId: null,
  status: 'title',
};

export function finishPerformance(state: GameState): PerformanceResult {
  const { title, review, reviewNotes } = createPerformanceReview(state.logs, state.sceneScore, state.flowScore, state.trustScore, state.backstageLoad);
  const insight = createPerformanceInsight(state.logs, state.sceneScore, state.flowScore, state.trustScore, state.backstageLoad);
  const audienceSurvey = createAudienceSurvey(state.logs, state.sceneScore, state.flowScore, state.trustScore, state.backstageLoad);
  const mediaReview = createMediaReview(state.logs, state.sceneScore, state.flowScore, state.trustScore, state.backstageLoad);
  const highlights = [...state.logs]
    .sort((a, b) => {
      const tierRank = { masterpiece: 4, scene: 3, smallSuccess: 2, fray: 1, accident: 0 };
      return tierRank[b.resultTier] - tierRank[a.resultTier] || b.deltaScene - a.deltaScene;
    })
    .slice(0, 5)
    .sort((a, b) => a.totalTurn - b.totalTurn);
  return {
    seed: state.seed,
    finishedAt: new Date().toISOString(),
    sceneScore: state.sceneScore,
    flowScore: state.flowScore,
    trustScore: state.trustScore,
    backstageLoad: state.backstageLoad,
    performanceStyle: state.performanceStyle,
    title,
    review,
    reviewNotes,
    insight,
    audienceSurvey,
    mediaReview,
    logs: state.logs,
    highlights,
  };
}

export function savePerformanceResult(result: PerformanceResult) {
  const current = readPerformanceHistory();
  const next = [result, ...current].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function readPerformanceHistory(): PerformanceResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PerformanceResult>[];
    const normalized = parsed.map(normalizePerformanceResult);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

function normalizePerformanceResult(result: Partial<PerformanceResult>): PerformanceResult {
  const logs = result.logs ?? [];
  const sceneScore = result.sceneScore ?? 0;
  const flowScore = result.flowScore ?? 0;
  const trustScore = result.trustScore ?? 0;
  const backstageLoad = result.backstageLoad ?? 0;
  const fallbackReview = createPerformanceReview(logs, sceneScore, flowScore, trustScore, backstageLoad);
  const fallbackInsight = createPerformanceInsight(logs, sceneScore, flowScore, trustScore, backstageLoad);
  return {
    seed: result.seed ?? 'unknown-seed',
    finishedAt: result.finishedAt ?? new Date(0).toISOString(),
    sceneScore,
    flowScore,
    trustScore,
    backstageLoad,
    performanceStyle: result.performanceStyle ?? null,
    title: result.title ?? fallbackReview.title,
    review: result.review ?? fallbackReview.review,
    reviewNotes: result.reviewNotes ?? fallbackReview.reviewNotes,
    insight: { ...fallbackInsight, ...result.insight },
    audienceSurvey: result.audienceSurvey ?? createAudienceSurvey(logs, sceneScore, flowScore, trustScore, backstageLoad),
    mediaReview: result.mediaReview ?? createMediaReview(logs, sceneScore, flowScore, trustScore, backstageLoad),
    logs,
    highlights: result.highlights ?? logs.slice(0, 5),
  };
}

export function commitResult(state: GameState): GameState {
  if (state.status !== 'result') return state;
  const preview = previewResult(state);
  const log = toTurnLog(state, preview);
  const logs = [...state.logs, log];
  const performanceStyle = state.performanceStyle ?? (state.totalTurn === TURNS_PER_ACT ? determinePerformanceStyle(logs) : null);
  const loadAfterResult = clampLoad(state.backstageLoad + preview.deltaLoad);
  const actBreakRelief = state.turnInAct === TURNS_PER_ACT ? -1 : 0;
  const backstageLoad = clampLoad(loadAfterResult + actBreakRelief);
  const loadStrain = nextLoadStrain(state, preview, actBreakRelief);
  const nextBase = {
    ...state,
    logs,
    sceneScore: state.sceneScore + preview.deltaScene,
    flowScore: state.flowScore + preview.deltaFlow,
    trustScore: state.trustScore + preview.deltaTrust,
    performanceStyle,
    backstageLoad,
    loadBias: preview.loadBias,
    loadStrain,
    lastResponses: [...state.lastResponses, preview.mainResponse].slice(-4),
    pendingFrayEvent: resolvePendingFray(state, preview, loadStrain),
  };
  const withActors = { ...nextBase, actors: advanceActorStates(nextBase) };
  if (state.totalTurn >= TOTAL_TURNS) {
    return { ...withActors, status: 'finished' as const };
  }
  const totalTurn = state.totalTurn + 1;
  const focus = pickFocusActor(state.seed, totalTurn);
  return {
    ...withActors,
    ...actForTurn(totalTurn),
    totalTurn,
    theme: ACTS[Math.ceil(totalTurn / TURNS_PER_ACT) - 1]?.name ?? FALLBACK_ACT_NAME,
    actors: assignActorRoles(withActors.actors, focus),
    currentFocusActorId: focus,
    currentActorEvent: null,
    selectedPrep: null,
    selectedResponse: null,
    status: 'prep',
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return createInitialGame(action.seed);
    case 'RESET_TO_TITLE':
      return titleState;
    case 'SELECT_PREP': {
      if (state.status !== 'prep') return state;
      const selected = { ...state, selectedPrep: action.prep };
      return {
        ...selected,
        currentActorEvent: resolveActorEvent(selected),
        status: 'response',
      };
    }
    case 'SELECT_RESPONSE': {
      if (state.status !== 'response' && state.status !== 'result') return state;
      return {
        ...state,
        selectedResponse: action.response,
        status: 'result',
      };
    }
    case 'COMMIT_RESULT': {
      return commitResult(state);
    }
    default:
      return state;
  }
}

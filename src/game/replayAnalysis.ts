import { gameReducer, createInitialGame, finishPerformance } from './gameReducer';
import { previewResult } from './resultPreview';
import { mostImproveableTurn, type ReplayImprovementSuggestion } from './rogueliteProgress';
import type { GameState, MainResponse, PerformanceResult, PrepAction, ResultTier, TurnLog } from './types';

const PREP_ACTIONS: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
const RESPONSES: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];
const TIER_ORDER: ResultTier[] = ['accident', 'fray', 'smallSuccess', 'scene', 'masterpiece'];

export function analyzeReplayImprovement(result: PerformanceResult): ReplayImprovementSuggestion | null {
  const target = mostImproveableTurn(result);
  if (!target) return null;
  const candidates = PREP_ACTIONS.flatMap((prep) => RESPONSES.map((response) => simulateCandidate(result, target, prep, response)))
    .filter((item): item is ReplayImprovementSuggestion => Boolean(item))
    .filter((item) => item.totalScoreDelta > 0 || tierValue(item.resultTier) > tierValue(target.resultTier))
    .sort((a, b) => (
      b.totalScoreDelta - a.totalScoreDelta
      || tierValue(b.resultTier) - tierValue(a.resultTier)
      || a.loadDelta - b.loadDelta
    ));
  return candidates[0] ?? null;
}

function simulateCandidate(
  result: PerformanceResult,
  target: TurnLog,
  prep: PrepAction,
  response: MainResponse,
): ReplayImprovementSuggestion | null {
  if (prep === target.prepAction && response === target.mainResponse) return null;
  try {
    let state: GameState = createInitialGame(result.seed);
    let targetPreview: ReturnType<typeof previewResult> | null = null;
    for (const log of result.logs) {
      const selectedPrep = log.totalTurn === target.totalTurn ? prep : log.prepAction;
      const selectedResponse = log.totalTurn === target.totalTurn ? response : log.mainResponse;
      state = gameReducer(state, { type: 'SELECT_PREP', prep: selectedPrep });
      state = gameReducer(state, { type: 'SELECT_RESPONSE', response: selectedResponse });
      if (log.totalTurn === target.totalTurn) {
        targetPreview = previewResult(state);
      }
      state = gameReducer(state, { type: 'COMMIT_RESULT' });
    }
    if (state.status !== 'finished' || !targetPreview) return null;
    const candidate = finishPerformance(state);
    return {
      totalTurn: target.totalTurn,
      prep,
      response,
      resultTier: targetPreview.resultTier,
      sceneTitle: targetPreview.sceneTitle,
      totalScoreDelta: candidate.insight.totalScore - result.insight.totalScore,
      loadDelta: candidate.backstageLoad - result.backstageLoad,
    };
  } catch {
    return null;
  }
}

function tierValue(tier: ResultTier) {
  return TIER_ORDER.indexOf(tier);
}

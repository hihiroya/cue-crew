import { buildStyleSummary, replayDeltaForResponse, responseBuildCue } from '../../game/rogueliteProgress';
import { responseInsight } from '../../game/responseInsight';
import type { GameState, MainResponse, TurnLog } from '../../game/types';

export const responses: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];

export function buildResponsePanelViewModel(state: GameState, previousTurnLog: TurnLog | null) {
  const insights = responses.map((response) => responseInsight(state, response));
  const buildStyle = buildStyleSummary(state.logs, state.performanceStyle);
  const detailsByResponse = Object.fromEntries(
    insights.map((insight) => [
      insight.response,
      {
        buildCue: responseBuildCue(insight.response, buildStyle),
        replayDelta: replayDeltaForResponse({
          currentTier: insight.resultTier,
          currentLoad: insight.deltaLoad,
          previous: previousTurnLog,
        }),
      },
    ]),
  ) as Record<MainResponse, {
    buildCue: string;
    replayDelta: ReturnType<typeof replayDeltaForResponse>;
  }>;

  return { insights, detailsByResponse };
}

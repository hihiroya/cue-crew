import { topOmenEvents } from '../../game/actorLogic';
import { PREP_MATCHES } from '../../game/constants';
import { buildStyleSummary, replayDeltaForResponse, responseBuildCue } from '../../game/rogueliteProgress';
import { responseInsight } from '../../game/responseInsight';
import type { ActorEventType, GameState, MainResponse, PrepAction, TurnLog } from '../../game/types';

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

  return { insights, detailsByResponse, readAlignment: buildReadAlignment(state) };
}

export type ReadAlignmentTone = 'hit' | 'partial' | 'miss';
export type ReadAlignmentReason = 'prepared' | 'visible' | 'preparedElsewhere' | 'unexpected';

export type ReadAlignment = {
  tone: ReadAlignmentTone;
  reason: ReadAlignmentReason;
  prep: PrepAction;
  actualEvent: ActorEventType;
  visibleOmens: ActorEventType[];
  preparedEvents: ActorEventType[];
};

function buildReadAlignment(state: GameState): ReadAlignment | null {
  if (!state.selectedPrep || !state.currentActorEvent || !state.currentFocusActorId) return null;
  const actor = state.actors.find((item) => item.id === state.currentFocusActorId);
  if (!actor) return null;
  const visibleOmens = topOmenEvents(actor, 3, { seed: state.seed, totalTurn: state.totalTurn }).map((omen) => omen.event);
  const preparedEvents = PREP_MATCHES[state.selectedPrep];
  const actualEvent = state.currentActorEvent.type;
  const actualPrepared = preparedEvents.includes(actualEvent);
  const actualVisible = visibleOmens.includes(actualEvent);
  const preparedVisible = visibleOmens.some((event) => preparedEvents.includes(event));
  if (actualPrepared) {
    return { tone: 'hit', reason: 'prepared', prep: state.selectedPrep, actualEvent, visibleOmens, preparedEvents };
  }
  if (actualVisible) {
    return { tone: 'partial', reason: 'visible', prep: state.selectedPrep, actualEvent, visibleOmens, preparedEvents };
  }
  if (preparedVisible) {
    return { tone: 'partial', reason: 'preparedElsewhere', prep: state.selectedPrep, actualEvent, visibleOmens, preparedEvents };
  }
  return { tone: 'miss', reason: 'unexpected', prep: state.selectedPrep, actualEvent, visibleOmens, preparedEvents };
}

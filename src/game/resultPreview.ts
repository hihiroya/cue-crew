import { PERFORMANCE_STYLE_DETAILS, RESPONSE_BIAS } from './constants';
import { createRng } from './rng';
import { frayFitFor } from './fray';
import { flavorText, prepRecovery, sceneTitle } from './sceneTemplates';
import { stylePreviewFor } from './scoreEngine';
import { performanceLabel, slotForTurnInAct } from './turnCalendar';
import { responseInsight } from './responseInsight';
import {
  cueResultSummary,
  deltasFor,
  prepPredictionQuality,
  repeatPenalty,
  scoreItem,
} from './scoreRuleCore';
import type { GameState, ResultPreview } from './types';
export function previewResult(state: GameState): ResultPreview {
  if (!state.currentActorEvent || !state.selectedPrep || !state.selectedResponse || !state.currentFocusActorId) {
    throw new Error('Cannot preview result before event, prep, and response are selected.');
  }
  const actor = state.actors.find((item) => item.id === state.currentFocusActorId) ?? state.actors[0];
  const response = state.selectedResponse;
  const prepQuality = prepPredictionQuality(state, actor);
  const prepMatched = prepQuality === 'hit';
  const insight = responseInsight(state, response);
  const score = insight.score;

  const tier = insight.resultTier;
  const deltas = deltasFor(tier, response, state, prepQuality);
  const stylePreview = stylePreviewFor(state, { mainResponse: response, deltaScene: deltas.deltaScene, deltaFlow: deltas.deltaFlow, deltaTrust: deltas.deltaTrust, deltaLoad: deltas.deltaLoad });
  const slot = slotForTurnInAct(state.turnInAct);
  const resultMode = state.act === 3 && slot === 'soiree' ? 'finale' : slot;
  const rng = createRng(`${state.seed}:title:${state.totalTurn}:${score}`);
  const frayFit = frayFitFor(state, response);
  const recoveredBias = tier !== 'accident' && state.pendingFrayEvent && frayFit.status !== 'miss' && frayFit.status !== 'none'
    ? state.pendingFrayEvent.bias
    : undefined;
  const title = sceneTitle({
    actor: actor.type,
    event: state.currentActorEvent.type,
    response,
    tier,
    frayBias: recoveredBias ?? null,
    seedIndex: Math.floor(rng() * 1000),
  });
  const recovery = prepRecovery({
    actor: actor.type,
    event: state.currentActorEvent.type,
    prep: state.selectedPrep,
    response,
    tier,
    quality: prepQuality,
  });

  const scoreBreakdown = deltas.repeat.label && !insight.scoreBreakdown.some((item) => item.id === 'repeat')
    ? [
        ...insight.scoreBreakdown,
        scoreItem(
          'repeat-effect',
          deltas.repeat.label,
          repeatPenalty(state, response),
          deltas.repeat.detail,
        ),
      ]
    : insight.scoreBreakdown;

  const preview: ResultPreview = {
    score,
    day: state.act,
    performanceSlot: slot,
    performanceLabel: performanceLabel(state.act, slot),
    resultMode,
    performanceStyle: stylePreview.style,
    styleLabel: stylePreview.style ? PERFORMANCE_STYLE_DETAILS[stylePreview.style].label : undefined,
    styleText: stylePreview.style ? PERFORMANCE_STYLE_DETAILS[stylePreview.style].short : undefined,
    styleIsNew: stylePreview.isNew,
    focusActorType: actor.type,
    actorState: actor.state,
    actorEventType: state.currentActorEvent.type,
    prepAction: state.selectedPrep,
    mainResponse: response,
    resultTier: tier,
    sceneTitle: title,
    flavorText: flavorText({
      actor: actor.type,
      actorState: actor.state,
      event: state.currentActorEvent.type,
      prep: state.selectedPrep,
      response,
      tier,
      prepMatched,
      recoveredFray: recoveredBias,
    }),
    prepMatched,
    prepQuality,
    prepRecoveryTone: recovery.tone,
    prepRecoveryLabel: recovery.label,
    prepRecoveryTitle: recovery.title,
    prepRecoveryText: recovery.text,
    cueSummary: {
      keyPoint: '',
      cost: '',
      handoff: '',
      audienceReaction: '',
      lesson: '',
    },
    scoreBreakdown,
    loadBias: RESPONSE_BIAS[response],
    eventTitle: state.currentActorEvent.title,
    eventDescription: state.currentActorEvent.description,
    prepRelationLabel: insight.prepRelationLabel,
    prepRelationTone: insight.prepRelationTone,
    responseAimLabel: insight.responseAimLabel,
    ...deltas,
  };
  return {
    ...preview,
    cueSummary: cueResultSummary(state, preview),
  };
}

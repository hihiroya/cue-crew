import { MAX_LOAD, TURNS_PER_ACT } from './gameSettings';
import { committedCueSurge } from './cueSurge';
import type { GameState, PerformanceStyle, ResultPreview, ResultTier, TurnLog } from './types';

export type StyleSource = Pick<TurnLog, 'mainResponse' | 'deltaScene' | 'deltaFlow' | 'deltaTrust' | 'deltaLoad'>;

export function tierFromScore(score: number): ResultTier {
  if (score >= 7) return 'masterpiece';
  if (score >= 4) return 'scene';
  if (score >= 2) return 'smallSuccess';
  if (score >= 0) return 'fray';
  return 'accident';
}

export function determinePerformanceStyle(logs: StyleSource[]): PerformanceStyle {
  return performanceStyleScores(logs)[0][0];
}

export function committedPerformanceStyle(logs: StyleSource[]): PerformanceStyle | null {
  const ranked = performanceStyleScores(logs);
  const [topStyle, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;
  return topScore - secondScore >= 4 ? topStyle : null;
}

export function stylePreviewFor(state: GameState, preview: StyleSource): { style: PerformanceStyle | null; isNew: boolean } {
  if (state.performanceStyle) return { style: state.performanceStyle, isNew: false };
  if (state.totalTurn < TURNS_PER_ACT) return { style: null, isNew: false };
  const style = committedPerformanceStyle([...state.logs, preview]);
  return { style, isNew: Boolean(style) };
}

export function clampLoad(load: number): number {
  return Math.max(0, Math.min(MAX_LOAD, load));
}

export function toTurnLog(state: GameState, preview: ResultPreview): TurnLog {
  return {
    act: state.act,
    turnInAct: state.turnInAct,
    totalTurn: state.totalTurn,
    focusActorType: preview.focusActorType,
    actorState: preview.actorState,
    actorEventType: preview.actorEventType,
    prepAction: preview.prepAction,
    mainResponse: preview.mainResponse,
    resultTier: preview.resultTier,
    performanceStyle: preview.performanceStyle,
    score: preview.score,
    prepMatched: preview.prepMatched,
    prepQuality: preview.prepQuality,
    sceneTitle: preview.sceneTitle,
    flavorText: preview.flavorText,
    deltaScene: preview.deltaScene,
    deltaFlow: preview.deltaFlow,
    deltaTrust: preview.deltaTrust,
    deltaLoad: preview.deltaLoad,
    loadBias: preview.loadBias,
    cueSurge: committedCueSurge(preview.cueSurge),
  };
}

function performanceStyleScores(logs: StyleSource[]): Array<[PerformanceStyle, number]> {
  const scores: Record<PerformanceStyle, number> = {
    heat: 0,
    breath: 0,
    control: 0,
    closure: 0,
  };
  logs.forEach((log) => {
    if (log.mainResponse === 'catch') scores.heat += 4;
    if (log.mainResponse === 'wait') scores.breath += 4;
    if (log.mainResponse === 'arrange') scores.control += 4;
    if (log.mainResponse === 'cut') scores.closure += 4;
    if (log.mainResponse === 'catch') scores.heat += Math.min(2, Math.max(0, log.deltaScene));
    if (log.mainResponse === 'wait') scores.breath += Math.min(3, Math.max(0, log.deltaTrust));
    if (log.mainResponse === 'arrange') scores.control += Math.min(3, Math.max(0, log.deltaFlow) + Math.max(0, -log.deltaLoad));
    if (log.mainResponse === 'cut') scores.closure += Math.min(3, Math.max(0, -log.deltaFlow) + (log.deltaLoad <= 0 ? 1 : 0));
  });
  return (Object.entries(scores) as Array<[PerformanceStyle, number]>).sort((a, b) => b[1] - a[1]);
}

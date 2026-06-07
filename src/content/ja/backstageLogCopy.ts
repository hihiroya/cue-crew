import rawLogs from './backstage_logs.json';
import type {
  Actor,
  ActorEventType,
  GameState,
  MainResponse,
  PerformanceResult,
  PrepAction,
  ResultPreview,
  ResultTier,
} from '../../game/types';

export const backstageLogCopy = {
  label: '袖メモ',
  finishedLabel: '終演後の袖メモ',
} as const;

type BackstagePhase = 'prep' | 'response' | 'result' | 'finished';
type BackstageLog = {
  actorState: Actor['state'] | 'any';
  actorType: Actor['type'] | 'any';
  event: ActorEventType | 'any';
  id: string;
  phase: BackstagePhase;
  prep: PrepAction | 'any' | null;
  response: MainResponse | 'any' | null;
  resultTier: ResultTier | 'any' | null;
  staff: string[];
  text: string;
};

const backstageLogs = rawLogs as BackstageLog[];

type PrepLogArgs = {
  actor: Actor;
  prep: PrepAction;
  seed: string;
  totalTurn: number;
  visibleOmens: ActorEventType[];
};

export function backstagePrepLog(args: PrepLogArgs) {
  const event = bestOmen(args.visibleOmens);
  return selectLog({
    actorState: args.actor.state,
    actorType: args.actor.type,
    event,
    phase: 'prep',
    prep: args.prep,
    response: null,
    resultTier: null,
    seedKey: `${args.seed}:prep:${args.totalTurn}:${args.prep}:${event}`,
  });
}

export function backstageResponseLog(state: GameState, response: MainResponse) {
  const actor = state.actors.find((item) => item.id === state.currentFocusActorId) ?? state.actors[0];
  return selectLog({
    actorState: actor.state,
    actorType: actor.type,
    event: state.currentActorEvent?.type ?? 'any',
    phase: 'response',
    prep: state.selectedPrep ?? 'any',
    response,
    resultTier: null,
    seedKey: `${state.seed}:response:${state.totalTurn}:${response}`,
  });
}

export function backstageResultLog(preview: ResultPreview) {
  return selectLog({
    actorState: preview.actorState,
    actorType: preview.focusActorType,
    event: preview.actorEventType,
    phase: 'result',
    prep: preview.prepAction,
    response: preview.mainResponse,
    resultTier: preview.resultTier,
    seedKey: `${preview.day}:${preview.performanceSlot}:${preview.sceneTitle}:${preview.score}`,
  });
}

export function backstageFinishedLog(result: PerformanceResult) {
  const bestCue = result.insight.bestCue;
  return selectLog({
    actorState: bestCue?.actorState ?? 'any',
    actorType: bestCue?.focusActorType ?? 'any',
    event: bestCue?.actorEventType ?? 'any',
    phase: 'finished',
    prep: bestCue?.prepAction ?? 'any',
    response: result.insight.dominantResponse,
    resultTier: bestCue?.resultTier ?? 'any',
    seedKey: `${result.seed}:finished:${result.insight.rank}:${result.performanceStyle ?? 'unset'}`,
  });
}

function bestOmen(visibleOmens: ActorEventType[]) {
  return visibleOmens[0] ?? 'any';
}

function selectLog(criteria: {
  actorState: Actor['state'] | 'any';
  actorType: Actor['type'] | 'any';
  event: ActorEventType | 'any';
  phase: BackstagePhase;
  prep: PrepAction | 'any' | null;
  response: MainResponse | 'any' | null;
  resultTier: ResultTier | 'any' | null;
  seedKey: string;
}) {
  const candidates = backstageLogs
    .filter((log) => log.phase === criteria.phase)
    .map((log) => ({ log, score: matchScore(log, criteria) }))
    .filter((item) => item.score > Number.NEGATIVE_INFINITY)
    .sort((a, b) => b.score - a.score || stableHash(`${criteria.seedKey}:${a.log.id}`) - stableHash(`${criteria.seedKey}:${b.log.id}`));
  return candidates[0]?.log.text ?? '';
}

function matchScore(log: BackstageLog, criteria: Omit<Parameters<typeof selectLog>[0], 'seedKey'>) {
  let score = 0;
  score += fieldScore(log.actorType, criteria.actorType, 8);
  score += softFieldScore(log.actorState, criteria.actorState, 3);
  score += fieldScore(log.event, criteria.event, 8);
  score += fieldScore(log.prep, criteria.prep, 6);
  score += fieldScore(log.response, criteria.response, 6);
  score += fieldScore(log.resultTier, criteria.resultTier, 7);
  return score;
}

function softFieldScore(actual: string | null, expected: string | null, exactScore: number) {
  if (actual === expected) return exactScore;
  if (actual === 'any') return 1;
  return 0;
}

function fieldScore(actual: string | null, expected: string | null, exactScore: number) {
  if (actual === expected) return exactScore;
  if (actual === 'any') return 1;
  if (actual === null && expected === null) return exactScore;
  return Number.NEGATIVE_INFINITY;
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

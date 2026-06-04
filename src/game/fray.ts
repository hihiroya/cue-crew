import { INITIAL_LOAD_STRAIN, LOAD_BIAS_AREAS, RESPONSE_BIAS } from './constants';
import { FRAY_RESPONSE_RULES, FRAY_TITLES, frayFitLabel } from '../content/ja/frayCopy';
import { createRng } from './rng';
import type { FrayEvent, GameState, LoadBias, LoadBiasArea, LoadStrain, MainResponse, ResultPreview, ResultTier } from './types';

export type FrayFit = {
  status: 'none' | 'strong' | 'match' | 'miss';
  value: number;
  label?: string;
  detail?: string;
  deltaFlow: number;
  deltaLoad: number;
};

export function frayFitFor(state: GameState, response: MainResponse): FrayFit {
  const fray = state.pendingFrayEvent;
  if (!fray) return { status: 'none', value: 0, deltaFlow: 0, deltaLoad: 0 };
  const rule = FRAY_RESPONSE_RULES[fray.bias];
  if (response === rule.strong) {
    return {
      status: 'strong',
      value: 1,
      label: frayFitLabel(rule.label, 'strong'),
      detail: rule.strongDetail,
      deltaFlow: 0,
      deltaLoad: 0,
    };
  }
  if (response === rule.match) {
    return {
      status: 'match',
      value: 1,
      label: frayFitLabel(rule.label, 'match'),
      detail: rule.matchDetail,
      deltaFlow: 0,
      deltaLoad: 0,
    };
  }
  return {
    status: 'miss',
    value: 0,
    label: frayFitLabel(rule.label, 'miss'),
    detail: rule.missDetail,
    deltaFlow: -1,
    deltaLoad: state.backstageLoad >= 4 ? 1 : 0,
  };
}

export function guardTierForFrayRecovery(tier: ResultTier, state: GameState, response: MainResponse): ResultTier {
  const fit = frayFitFor(state, response);
  if (fit.status !== 'strong') return tier;
  if (tier === 'accident') return 'fray';
  return tier;
}

function normalizeLoadStrain(strain?: LoadStrain): LoadStrain {
  return {
    ...INITIAL_LOAD_STRAIN,
    ...(strain ?? {}),
  };
}

function clampStrain(value: number) {
  return Math.max(0, Math.min(5, value));
}

export function nextLoadStrain(state: GameState, preview: ResultPreview, actBreakRelief = 0): LoadStrain {
  const next = normalizeLoadStrain(state.loadStrain);
  const bias = preview.loadBias ?? RESPONSE_BIAS[preview.mainResponse];
  if (preview.deltaLoad > 0) {
    next[bias] = clampStrain(next[bias] + preview.deltaLoad);
  }
  if (preview.deltaLoad < 0) {
    next[bias] = clampStrain(next[bias] + preview.deltaLoad);
  }
  if (actBreakRelief < 0) {
    LOAD_BIAS_AREAS.forEach((area) => {
      next[area] = clampStrain(next[area] + actBreakRelief);
    });
  }
  return next;
}

function strongestStrainBias(strain: LoadStrain, fallback: LoadBiasArea): LoadBiasArea {
  const sorted = LOAD_BIAS_AREAS
    .map((area) => ({ area, value: strain[area] }))
    .sort((a, b) => b.value - a.value);
  return sorted[0]?.value > 0 ? sorted[0].area : fallback;
}

function chooseFrayBias(strain: LoadStrain, rng: () => number, fallback: LoadBiasArea): LoadBiasArea {
  const total = LOAD_BIAS_AREAS.reduce((sum, area) => sum + strain[area], 0);
  if (total <= 0) return fallback;
  let roll = rng() * total;
  for (const area of LOAD_BIAS_AREAS) {
    roll -= strain[area];
    if (roll <= 0) return area;
  }
  return strongestStrainBias(strain, fallback);
}

export function likelyFrayBias(state: GameState): LoadBiasArea | null {
  const strain = normalizeLoadStrain(state.loadStrain);
  const fallback = (state.loadBias ?? 'stageManagement') as LoadBiasArea;
  const area = strongestStrainBias(strain, fallback);
  return strain[area] > 0 || state.backstageLoad >= 3 ? area : null;
}

export function maybeCreateFray(state: GameState, preview: ResultPreview, loadStrain = nextLoadStrain(state, preview)): FrayEvent | undefined {
  const nextLoad = Math.max(0, Math.min(5, state.backstageLoad + preview.deltaLoad));
  if (nextLoad < 4 || preview.resultTier === 'masterpiece') return undefined;
  const rng = createRng(`${state.seed}:fray:${state.totalTurn}:${nextLoad}`);
  const guard = preview.prepAction === 'prepareTransition' && preview.mainResponse === 'cut';
  const styleGuard = state.performanceStyle === 'control' || (state.performanceStyle === 'closure' && preview.mainResponse === 'cut');
  const frayByTier = guard || styleGuard ? preview.resultTier === 'accident' || (preview.resultTier === 'fray' && rng() < 0.38) : preview.resultTier === 'fray' || preview.resultTier === 'accident';
  const randomFrayRate = guard || styleGuard ? 0.18 : 0.48;
  if (frayByTier || rng() < randomFrayRate) {
    const fallback = (preview.loadBias ?? state.loadBias ?? 'stageManagement') as LoadBiasArea;
    const bias = chooseFrayBias(loadStrain, rng, fallback);
    const list = FRAY_TITLES[bias];
    return { bias, title: list[Math.floor(rng() * list.length)] };
  }
  return undefined;
}

export function resolvePendingFray(state: GameState, preview: ResultPreview, loadStrain: LoadStrain): FrayEvent | undefined {
  const created = maybeCreateFray(state, preview, loadStrain);
  if (created) return created;
  const fit = frayFitFor(state, preview.mainResponse);
  if (state.pendingFrayEvent && fit.status === 'miss') return state.pendingFrayEvent;
  return undefined;
}

export type { LoadBias };

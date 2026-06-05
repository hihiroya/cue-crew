import { FRAY_RESPONSE_RULES } from './frayCopy';
import type { GameState } from '../../game/types';

export const scoreBarCopy = {
  aria: '公演スコア',
  scene: '評判',
  flow: '段取り',
  trust: '一体感',
  load: '裏方負荷',
  fray: '舞台裏のほころび',
  likelyFray: '乱れそう',
} as const;

export function loadRiskLabel(load: number) {
  if (load <= 1) return { label: '余裕', tone: 'safe' };
  if (load === 2) return { label: '注意', tone: 'watch' };
  if (load === 3) return { label: 'ほころび寸前', tone: 'danger' };
  return { label: 'ほころび圏内', tone: 'fray' };
}

export function loadAria(load: number, label: string) {
  return `${scoreBarCopy.load} ${load}/5 ${label}`;
}

export function frayAreaLabel(bias: NonNullable<GameState['pendingFrayEvent']>['bias']) {
  return FRAY_RESPONSE_RULES[bias].label;
}

export function frayAria(bias: NonNullable<GameState['pendingFrayEvent']>['bias'], title: string) {
  return `${scoreBarCopy.fray}: ${frayAreaLabel(bias)} ${title}`;
}

export function likelyFrayAria(bias: NonNullable<GameState['pendingFrayEvent']>['bias']) {
  return `${scoreBarCopy.likelyFray}: ${frayAreaLabel(bias)}`;
}

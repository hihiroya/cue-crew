import type { ResponseEffect } from '../../game/types';

type EffectIcon = ResponseEffect['target'];

export const responseEffectsCopy = {
  neutralLoadRaw: '負荷維持',
  noLoadRecovery: '負荷回復なし',
  repeatPrefix: '連続使用: ',
  repeatPhrasePrefix: '連続使用で',
  summarySeparator: '、',
} as const;

export function effectChangeLabel(value: number) {
  if (value >= 2) return '大きく増える';
  if (value === 1) return '増える';
  if (value === 0) return '維持';
  if (value === -1) return '減る';
  return '大きく減る';
}

export function effectTargetLabel(icon: EffectIcon) {
  if (icon === 'scene') return '評判';
  if (icon === 'load') return '負荷';
  if (icon === 'trust') return '一体感';
  return '段取り';
}

export function effectTitle(icon: EffectIcon, value: number, repeat: boolean) {
  return `${repeat ? responseEffectsCopy.repeatPrefix : ''}${effectTargetLabel(icon)} ${effectChangeLabel(value)}`;
}

function repeatPrefix(repeat: boolean) {
  return repeat ? responseEffectsCopy.repeatPhrasePrefix : '';
}

export function effectPhrase(args: { raw: string; icon: EffectIcon; value: number; repeat: boolean }) {
  if (args.raw === responseEffectsCopy.noLoadRecovery) return `${repeatPrefix(args.repeat)}負荷は軽くならない`;
  if (args.icon === 'load') {
    if (args.value >= 2) return `${repeatPrefix(args.repeat)}負荷が大きく増える`;
    if (args.value > 0) return `${repeatPrefix(args.repeat)}負荷が増える`;
    if (args.value < 0) return `${repeatPrefix(args.repeat)}負荷が減る`;
    return '負荷は変わらない';
  }
  if (args.icon === 'trust') {
    if (args.value > 0) return `${repeatPrefix(args.repeat)}一体感が増える`;
    if (args.value < 0) return `${repeatPrefix(args.repeat)}一体感が減る`;
    return '一体感は変わらない';
  }
  if (args.icon === 'scene') {
    if (args.value > 0) return `${repeatPrefix(args.repeat)}評判が伸びる`;
    if (args.value < 0) return `${repeatPrefix(args.repeat)}評判が伸びにくい`;
    return '評判は変わらない';
  }
  if (args.value > 0) return `${repeatPrefix(args.repeat)}段取りが整う`;
  if (args.value < 0) return `${repeatPrefix(args.repeat)}段取りが乱れる`;
  return '段取りは変わらない';
}

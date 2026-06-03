import type { ResponseEffect, ResponseInsight } from '../../game/types';

export type EffectIcon = ResponseEffect['target'];
export type EffectTone = 'good' | 'watch' | 'bad' | 'neutral';
export type EffectItem = {
  key: string;
  icon: EffectIcon;
  raw: string;
  title: string;
  tone: EffectTone;
  value: number;
  repeat: boolean;
};

export function effectItems(insight: ResponseInsight) {
  const parsed = insight.sideEffects.map(makeEffect);
  return parsed.length ? parsed : [makeEffect('負荷維持', 'load', 0, false)];
}

function makeEffect(effect: ResponseEffect): EffectItem;
function makeEffect(raw: string, icon: EffectIcon, value: number, repeat: boolean): EffectItem;
function makeEffect(rawOrEffect: string | ResponseEffect, icon?: EffectIcon, value?: number, repeat?: boolean): EffectItem {
  const raw = typeof rawOrEffect === 'string' ? rawOrEffect : rawOrEffect.label;
  const effectIcon = typeof rawOrEffect === 'string' ? icon ?? 'load' : rawOrEffect.target;
  const effectValue = typeof rawOrEffect === 'string' ? value ?? 0 : rawOrEffect.value;
  const isRepeat = typeof rawOrEffect === 'string' ? repeat ?? false : rawOrEffect.repeat;
  const tone = effectTone(effectIcon, effectValue);
  const changeLabel = effectChangeLabel(effectValue);
  const title = `${isRepeat ? '連続使用: ' : ''}${effectTargetLabel(effectIcon)} ${changeLabel}`;
  return {
    key: `${isRepeat ? 'repeat-' : ''}${raw}`,
    icon: effectIcon,
    raw,
    title,
    tone,
    value: effectValue,
    repeat: isRepeat,
  };
}

function effectChangeLabel(value: number) {
  if (value >= 2) return '大きく増える';
  if (value === 1) return '増える';
  if (value === 0) return '維持';
  if (value === -1) return '減る';
  return '大きく減る';
}

function effectTone(icon: EffectIcon, value: number): EffectTone {
  if (value === 0) return 'neutral';
  if (icon === 'load') {
    if (value < 0) return 'good';
    return value >= 2 ? 'bad' : 'watch';
  }
  return value > 0 ? 'good' : 'bad';
}

export function evaluationValue(item: EffectItem) {
  if (item.icon === 'load') return -item.value;
  return item.value;
}

export function evaluationSign(item: EffectItem) {
  const value = evaluationValue(item);
  if (value > 0) return '+';
  if (value < 0) return '-';
  return '±';
}

export function effectTargetLabel(icon: EffectIcon) {
  if (icon === 'scene') return '場面';
  if (icon === 'load') return '負荷';
  if (icon === 'trust') return '信頼';
  return '流れ';
}

export function effectDirection(item: EffectItem) {
  if (item.value > 0) return 'up';
  if (item.value < 0) return 'down';
  return 'flat';
}

export function effectIntensity(item: EffectItem) {
  return Math.min(2, Math.abs(item.value));
}

export function effectLedSlots(item: EffectItem) {
  const magnitude = effectIntensity(item);
  if (item.value > 0) return [false, false, true, true, magnitude >= 2];
  if (item.value < 0) return [magnitude >= 2, true, true, false, false];
  return [false, false, true, false, false];
}

export function effectPhrase(item: EffectItem) {
  if (item.raw === '負荷回復なし') return `${item.repeat ? '連続使用で' : ''}負荷は軽くならない`;
  if (item.icon === 'load') {
    if (item.value >= 2) return `${item.repeat ? '連続使用で' : ''}負荷が大きく増える`;
    if (item.value > 0) return `${item.repeat ? '連続使用で' : ''}負荷が増える`;
    if (item.value < 0) return `${item.repeat ? '連続使用で' : ''}負荷が減る`;
    return '負荷は変わらない';
  }
  if (item.icon === 'trust') {
    if (item.value > 0) return `${item.repeat ? '連続使用で' : ''}信頼が増える`;
    if (item.value < 0) return `${item.repeat ? '連続使用で' : ''}信頼が減る`;
    return '信頼は変わらない';
  }
  if (item.icon === 'scene') {
    if (item.value > 0) return `${item.repeat ? '連続使用で' : ''}場面が伸びる`;
    if (item.value < 0) return `${item.repeat ? '連続使用で' : ''}場面が伸びにくい`;
    return '場面は変わらない';
  }
  if (item.value > 0) return `${item.repeat ? '連続使用で' : ''}流れが整う`;
  if (item.value < 0) return `${item.repeat ? '連続使用で' : ''}流れが乱れる`;
  return '流れは変わらない';
}

export function effectSummary(insight: ResponseInsight) {
  return effectItems(insight).map(effectPhrase).join('、');
}

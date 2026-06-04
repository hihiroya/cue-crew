import type { ResponseEffect, ResponseInsight } from '../../game/types';
import { effectChangeLabel, effectPhrase as effectPhraseCopy, effectTargetLabel, effectTitle, responseEffectsCopy } from '../../content/ja/responseEffectsCopy';

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
  return parsed.length ? parsed : [makeEffect(responseEffectsCopy.neutralLoadRaw, 'load', 0, false)];
}

function makeEffect(effect: ResponseEffect): EffectItem;
function makeEffect(raw: string, icon: EffectIcon, value: number, repeat: boolean): EffectItem;
function makeEffect(rawOrEffect: string | ResponseEffect, icon?: EffectIcon, value?: number, repeat?: boolean): EffectItem {
  const raw = typeof rawOrEffect === 'string' ? rawOrEffect : rawOrEffect.label;
  const effectIcon = typeof rawOrEffect === 'string' ? icon ?? 'load' : rawOrEffect.target;
  const effectValue = typeof rawOrEffect === 'string' ? value ?? 0 : rawOrEffect.value;
  const isRepeat = typeof rawOrEffect === 'string' ? repeat ?? false : rawOrEffect.repeat;
  const tone = effectTone(effectIcon, effectValue);
  const title = effectTitle(effectIcon, effectValue, isRepeat);
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

export { effectTargetLabel };

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
  return effectPhraseCopy(item);
}

export function effectSummary(insight: ResponseInsight) {
  return effectItems(insight).map(effectPhrase).join(responseEffectsCopy.summarySeparator);
}

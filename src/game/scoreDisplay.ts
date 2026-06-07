export const SCORE_DISPLAY_MULTIPLIER = 10;

export function displayScore(score: number): number {
  return score * SCORE_DISPLAY_MULTIPLIER;
}

export function signedDisplayScore(score: number): string {
  const value = displayScore(score);
  if (value === 0) return '±0';
  return `${value > 0 ? '+' : ''}${value}`;
}

import type { PerformanceResult } from '../../game/types';
import { appCopy, titleHistoryMeta } from '../../content/ja/appCopy';

export function historyBests(history: PerformanceResult[]) {
  const total = (item: PerformanceResult) => item.insight.totalScore;
  return {
    rank: history.reduce<PerformanceResult | null>((best, item) => (!best || total(item) > total(best) ? item : best), null),
    scene: history.reduce<PerformanceResult | null>((best, item) => (!best || item.sceneScore > best.sceneScore ? item : best), null),
    load: history.reduce<PerformanceResult | null>((best, item) => (!best || item.backstageLoad < best.backstageLoad ? item : best), null),
  };
}

export function historyBadgeOptions(history: PerformanceResult[]) {
  const badges = new Map<string, { id: string; label: string; count: number }>();
  history.forEach((item) => {
    item.insight.performanceBadges?.forEach((badge) => {
      const current = badges.get(badge.id);
      badges.set(badge.id, { id: badge.id, label: badge.label, count: (current?.count ?? 0) + 1 });
    });
  });
  return [...badges.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function historyMeta(item: PerformanceResult, olderHistory: PerformanceResult[], bests: ReturnType<typeof historyBests>) {
  const previousSameSeed = olderHistory.find((entry) => entry.seed === item.seed);
  const badges = [
    bests.rank === item ? appCopy.title.bestBadges.rank : '',
    bests.scene === item ? appCopy.title.bestBadges.scene : '',
    bests.load === item ? appCopy.title.bestBadges.load : '',
  ].filter(Boolean).join(' / ');
  return titleHistoryMeta({ item, previousSameSeed, badges });
}

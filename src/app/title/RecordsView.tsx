import { Icon } from '../../components/ui/Icon';
import { classNames } from '../../components/ui/classNames';
import type { PerformanceResult } from '../../game/types';
import { appCopy } from '../../content/ja/appCopy';
import styles from './TitleScreenViews.module.css';
import { historyBests, historyMeta } from './titleHistoryViewModel';

export function RecordsView({
  history,
  displayHistory,
  badgeOptions,
  selectedBadgeId,
  bests,
  onSelectBadge,
  onReplay,
}: {
  history: PerformanceResult[];
  displayHistory: PerformanceResult[];
  badgeOptions: Array<{ id: string; label: string; count: number }>;
  selectedBadgeId: string | null;
  bests: ReturnType<typeof historyBests>;
  onSelectBadge: (id: string | null) => void;
  onReplay: (seed: string) => void;
}) {
  return (
    <section className={styles.historyPanel}>
      <div className="section-heading">
        <p><Icon name="history" /> {appCopy.title.historyKicker}</p>
        <h2>{appCopy.title.historyTitle}</h2>
      </div>
      <p className="title-subpage-lead">{appCopy.title.recordsLead}</p>
      {history.length === 0 ? (
        <p className="muted">{appCopy.title.emptyHistory}</p>
      ) : (
        <>
          <div className="recent-replay-list">
            <span>{appCopy.title.recentReplayTitle}</span>
            {history.slice(0, 3).map((item) => (
              <button key={`recent-${item.seed}-${item.finishedAt}`} type="button" onClick={() => onReplay(item.seed)}>
                <strong>{item.insight.rank}</strong>
                <small>{item.title}</small>
              </button>
            ))}
          </div>
          {badgeOptions.length ? (
            <div className="history-badge-filter" aria-label={appCopy.title.historyBadgeFilter}>
              <button type="button" className={activeClass(selectedBadgeId === null)} onClick={() => onSelectBadge(null)}>{appCopy.title.historyBadgeAll}</button>
              {badgeOptions.map((badge) => (
                <button key={badge.id} type="button" className={activeClass(selectedBadgeId === badge.id)} onClick={() => onSelectBadge(badge.id)}>
                  {badge.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="history-list">
            {displayHistory.map((item) => (
              <button key={`${item.seed}-${item.finishedAt}`} onClick={() => onReplay(item.seed)}>
                <strong>{item.title}</strong>
                <span>{appCopy.title.historyStats(item)}</span>
                {item.insight.performanceBadges?.length ? <BadgeStrip badges={item.insight.performanceBadges.slice(0, 2)} /> : null}
                <small>{historyMeta(item, history.slice(history.indexOf(item) + 1), bests)}</small>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function BadgeStrip({ badges }: { badges: NonNullable<PerformanceResult['insight']['performanceBadges']> }) {
  return (
    <div className="performance-badge-strip" aria-label={appCopy.title.historyBadges}>
      {badges.map((badge) => (
        <em key={badge.id} className={classNames('performance-badge', performanceBadgeToneClass[badge.tone])} title={badge.detail}>{badge.label}</em>
      ))}
    </div>
  );
}

function activeClass(active: boolean) {
  return active ? 'is-active' : '';
}

const performanceBadgeToneClass: Record<NonNullable<PerformanceResult['insight']['performanceBadges']>[number]['tone'], string> = {
  gold: 'badge-gold',
  good: 'badge-good',
  cool: 'badge-cool',
  risk: 'badge-risk',
};

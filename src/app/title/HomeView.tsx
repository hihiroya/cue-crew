import type { NextChallengeRecommendation } from '../../game/rogueliteProgress';
import { appCopy } from '../../content/ja/appCopy';
import styles from './TitleScreenViews.module.css';

export function HomeView({
  recommendation,
  onStart,
  onStartRecommendation,
}: {
  recommendation: NextChallengeRecommendation;
  onStart: () => void;
  onStartRecommendation: () => void;
}) {
  const hasDistinctRecommendation = recommendation.kind !== 'newSeed';
  return (
    <>
      <section className={styles.homeActions} aria-label={appCopy.title.nav.home}>
        <button type="button" className="primary-action" onClick={onStart}>{appCopy.title.startNew}</button>
        {hasDistinctRecommendation ? (
          <button type="button" className="secondary-action" onClick={onStartRecommendation}>
            {recommendation.kind === 'daily' ? recommendation.cta : appCopy.title.replayRecommended}
          </button>
        ) : null}
      </section>
      {hasDistinctRecommendation ? (
        <section className={styles.homeGoal} aria-label={recommendation.kicker}>
          <span>{recommendation.kicker}</span>
          <h2>{recommendation.title}</h2>
          <p>{recommendation.body}</p>
        </section>
      ) : null}
    </>
  );
}

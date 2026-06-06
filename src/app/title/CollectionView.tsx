import { Icon } from '../../components/ui/Icon';
import { ACTOR_LABELS, EVENT_LABELS, RESPONSE_LABELS } from '../../game/constants';
import { ACHIEVEMENT_CATALOG, lockedSceneHints, resultTierShort, type CollectionState } from '../../game/rogueliteProgress';
import { appCopy } from '../../content/ja/appCopy';
import styles from './TitleScreenViews.module.css';

export function CollectionView({ collection, onReplay }: { collection: CollectionState; onReplay: (seed: string) => void }) {
  return (
    <section className={styles.collectionPanel}>
      <div className="section-heading">
        <p><Icon name="history" /> {appCopy.title.collectionKicker}</p>
        <h2>{appCopy.title.collectionTitle}</h2>
      </div>
      <p className="title-subpage-lead">{appCopy.title.collectionLead}</p>
      <div className="collection-summary-grid">
        <span>
          {appCopy.title.collectionScenes}
          <strong>{Object.keys(collection.scenes).length}</strong>
        </span>
        <span>
          {appCopy.title.collectionAchievements}
          <strong>{Object.keys(collection.achievements).length}</strong>
        </span>
      </div>
      <p className="collection-note">{latestAchievementNote(collection)}</p>
      <CollectionDetails collection={collection} onReplay={onReplay} />
    </section>
  );
}

function latestAchievementNote(collection: CollectionState) {
  const latest = Object.values(collection.achievements)
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))[0];
  return latest ? `${latest.label}: ${latest.detail}` : appCopy.title.collectionEmpty;
}

function CollectionDetails({ collection, onReplay }: { collection: CollectionState; onReplay: (seed: string) => void }) {
  const scenes = Object.values(collection.scenes)
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))
    .slice(0, 8);
  const lockedHints = lockedSceneHints(collection);
  return (
    <div className="collection-details">
      <section>
        <h3>{appCopy.title.collectionLockedScenes}</h3>
        <div className="collection-scene-list">
          {lockedHints.map((hint) => (
            <article key={hint.id} className="is-locked">
              <span>{hint.actor === 'any' ? '？？？' : labelFor(ACTOR_LABELS, hint.actor)} / {labelFor(EVENT_LABELS, hint.event)} / {hint.response ? labelFor(RESPONSE_LABELS, hint.response) : '？？？'}</span>
              <strong>{appCopy.title.collectionLockedSceneTitle}</strong>
              <small>{hint.hint}</small>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h3>{appCopy.title.collectionRecentScenes}</h3>
        {scenes.length ? (
          <div className="collection-scene-list">
            {scenes.map((scene) => (
              <article key={scene.id}>
                <span>{labelFor(ACTOR_LABELS, scene.actor)} / {labelFor(EVENT_LABELS, scene.event)} / {labelFor(RESPONSE_LABELS, scene.response)}</span>
                <strong>{scene.title}</strong>
                <small>{resultTierShort(scene.bestTier)}</small>
                <button type="button" className="ghost-button collection-replay-button" onClick={() => onReplay(scene.firstSeed)}>{appCopy.title.collectionReplay}</button>
              </article>
            ))}
          </div>
        ) : <p>{appCopy.title.collectionNoScenes}</p>}
      </section>
      <section>
        <h3>{appCopy.title.collectionAchievementList}</h3>
        <div className="collection-achievement-list">
          {ACHIEVEMENT_CATALOG.map((item) => {
            const unlocked = collection.achievements[item.id];
            return (
              <article key={item.id} className={unlocked ? 'is-unlocked' : 'is-locked'}>
                <span>{unlocked ? appCopy.title.collectionUnlocked : appCopy.title.collectionLocked}</span>
                <strong>{item.label}</strong>
                <small>{unlocked ? unlocked.detail : item.detail}</small>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function labelFor(labels: Record<string, string>, key: string) {
  return labels[key] ?? key;
}

import type { GameState } from '../../game/types';
import { eventDescription, eventPanelCopy, eventTitle, frayNote } from '../../content/ja/eventPanelCopy';
import { classNames } from '../ui/classNames';
import styles from './EventPanel.module.css';

export function EventPanel({ state }: { state: GameState }) {
  const event = state.currentActorEvent;
  return (
    <section className={classNames(styles.root, event && styles.hasEvent)}>
      <div className="section-heading">
        <p>{eventPanelCopy.heading}</p>
        <h2>{eventTitle(event)}</h2>
      </div>
      <p>{eventDescription(state)}</p>
      {state.pendingFrayEvent ? <div className={styles.frayNote}>{frayNote(state.pendingFrayEvent.title)}</div> : null}
    </section>
  );
}

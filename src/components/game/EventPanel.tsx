import type { GameState } from '../../game/types';
import { eventDescription, eventPanelCopy, eventTitle, frayNote } from '../../content/ja/eventPanelCopy';

export function EventPanel({ state }: { state: GameState }) {
  const event = state.currentActorEvent;
  return (
    <section className={`event-panel ${event ? 'has-event' : ''}`}>
      <div className="section-heading">
        <p>{eventPanelCopy.heading}</p>
        <h2>{eventTitle(event)}</h2>
      </div>
      <p>{eventDescription(state)}</p>
      {state.pendingFrayEvent ? <div className="fray-note">{frayNote(state.pendingFrayEvent.title)}</div> : null}
    </section>
  );
}

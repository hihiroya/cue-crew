import { ACTOR_LABELS, PREP_LABELS } from '../../game/constants';
import type { GameState } from '../../game/types';

export function EventPanel({ state }: { state: GameState }) {
  const event = state.currentActorEvent;
  const actor = event ? ACTOR_LABELS[event.actorId] : '焦点役者';
  return (
    <section className={`event-panel ${event ? 'has-event' : ''}`}>
      <div className="section-heading">
        <p>本番の出来事</p>
        <h2>{event ? `${actor}：${event.title}` : 'まだ起きていない'}</h2>
      </div>
      <p>{event ? event.description : state.selectedPrep ? `${PREP_LABELS[state.selectedPrep]}で備えた。役者の次の動きを待っている。` : '兆候を見て、想定外に備える一手を選ぶ。'}</p>
      {state.pendingFrayEvent ? <div className="fray-note">前のほころび: {state.pendingFrayEvent.title}</div> : null}
    </section>
  );
}

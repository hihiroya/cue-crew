import { ACTOR_LABELS, ACTOR_TRAITS, EVENT_LABELS, STATE_LABELS } from '../../game/constants';
import { topOmenEvents } from '../../game/actorLogic';
import type { Actor, ActorEvent, ActorType } from '../../game/types';
import { ActorSilhouette } from '../actors/ActorSilhouette';

type Props = {
  actors: Actor[];
  focusActorId: string | null;
  nextFocusActorId?: ActorType | null;
  backstageLoad: number;
  event?: ActorEvent | null;
};

export function ActorStage({ actors, focusActorId, nextFocusActorId, backstageLoad, event }: Props) {
  const focusActor = actors.find((actor) => actor.id === focusActorId) ?? actors[0];
  const supportingActors = actors.filter((actor) => actor.id !== focusActor.id);
  return (
    <section className={`actor-stage focus-stage ${event ? 'has-event-stage' : ''}`} aria-label="役者の兆候">
      <article className="actor-card focus-actor-card is-focus">
        <div className={`actor-figure-wrap actor-figure-${focusActor.type} figure-state-${focusActor.state}`}>
          <ActorSilhouette type={focusActor.type} />
        </div>
        <div className="actor-card-head">
          <div>
            <h3>{focusActor.name}</h3>
            <p>{event ? '本番の出来事' : '焦点役者'}</p>
          </div>
          <span className={`state-badge state-${focusActor.state}`}>{STATE_LABELS[focusActor.state]}</span>
        </div>
        {!event ? <p className="actor-trait">{ACTOR_TRAITS[focusActor.type]}</p> : null}
        {event ? (
          <div className="inline-event">
            <strong>{ACTOR_LABELS[event.actorId]}：{event.title}</strong>
            <span>{event.description}</span>
          </div>
        ) : (
          <OmenList actor={focusActor} />
        )}
      </article>
      {!event ? (
        <div className="support-actors" aria-label="他の役者">
          {supportingActors.map((actor) => (
            <div key={actor.id} className={`support-actor-chip ${actor.id === nextFocusActorId ? 'is-next' : ''}`}>
              <span>{actor.id === nextFocusActorId ? '次に来そう' : '控え'}</span>
              <strong>{actor.name}</strong>
              <em>{STATE_LABELS[actor.state]} / {nextPressure(actor, actor.id === nextFocusActorId, backstageLoad)}</em>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function OmenList({ actor }: { actor: Actor }) {
  const sorted = topOmenEvents(actor);
  return (
    <dl className="omen-list">
      {sorted.map(({ event, intensity }) => (
        <div key={event}>
          <dt>{EVENT_LABELS[event]}</dt>
          <dd>{intensity}</dd>
        </div>
      ))}
    </dl>
  );
}

function nextPressure(actor: Actor, isNext: boolean, backstageLoad: number) {
  if (isNext && backstageLoad >= 3) {
    if (actor.type === 'lead') return '負荷が高いまま入ると、沈黙が事故化しやすい';
    if (actor.type === 'junior') return '負荷が高いまま入ると、勢いがほころびやすい';
    return '負荷が高いまま入ると、ズレが広がりやすい';
  }
  if (actor.state === 'fatigued') return '疲労。次ターンの下振れリスク';
  if (actor.state === 'anxious') return '不安。負荷を残すと乱れやすい';
  if (actor.type === 'junior') return '拾うが活きやすいかも';
  if (actor.type === 'lead') return '待つが活きやすいかも';
  return '整えるが活きやすいかも';
}

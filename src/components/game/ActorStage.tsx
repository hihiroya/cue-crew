import { ACTOR_TRAITS, EVENT_LABELS, STATE_LABELS } from '../../game/constants';
import { topOmenEvents } from '../../game/actorLogic';
import type { Actor, ActorEvent, ActorState, ActorType, PrepAction } from '../../game/types';
import { ActorSilhouette } from '../actors/ActorSilhouette';

type Props = {
  actors: Actor[];
  focusActorId: string | null;
  nextFocusActorId?: ActorType | null;
  backstageLoad: number;
  event?: ActorEvent | null;
  selectedPrep?: PrepAction | null;
};

export function ActorStage({ actors, focusActorId, nextFocusActorId, backstageLoad, event }: Props) {
  const focusActor = actors.find((actor) => actor.id === focusActorId) ?? actors[0];
  const supportingActors = actors.filter((actor) => actor.id !== focusActor.id);

  if (event) {
    return (
      <section className={`event-reveal actor-figure-${focusActor.type} figure-state-${focusActor.state}`} aria-label="本番の出来事">
        <div className="event-reveal-figure">
          <ActorSilhouette type={focusActor.type} />
          <em className="event-actor-tag">{focusActor.name} / {STATE_LABELS[focusActor.state]}</em>
        </div>
        <div className="event-reveal-body">
          <div className="event-reveal-kicker">
            <span>本番で起きた</span>
          </div>
          <h2 className={`event-title title-${eventTitleSize(event.title)}`}>{event.title}</h2>
          <p>{event.description}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="actor-stage focus-stage" aria-label="役者の兆候">
      <article className="actor-card focus-actor-card is-focus">
        <span className="actor-role-badge focus-role">焦点役者</span>
        <div className={`actor-figure-wrap actor-figure-${focusActor.type} figure-state-${focusActor.state}`}>
          <ActorSilhouette type={focusActor.type} />
        </div>
        <div className="actor-card-head">
          <div>
            <h3>{focusActor.name}</h3>
            <p className="actor-trait">{ACTOR_TRAITS[focusActor.type]}</p>
          </div>
        </div>
        <div className="actor-state-card">
          <span>状態</span>
          <strong>{STATE_LABELS[focusActor.state]}</strong>
          <em>{STATE_HINTS[focusActor.state]} / {trustHint(focusActor)}</em>
        </div>
        <OmenList actor={focusActor} />
      </article>
      <div className="support-actors" aria-label="他の役者">
        {supportingActors.map((actor) => (
          <div key={actor.id} className={`support-actor-chip ${actor.id === nextFocusActorId ? 'is-next' : ''}`}>
            <span className={`actor-role-badge ${actor.id === nextFocusActorId ? 'next-role' : 'reserve-role'}`}>
              {actor.id === nextFocusActorId ? '次に来そう' : '控え'}
            </span>
            <strong>{actor.name}</strong>
            <em>{STATE_LABELS[actor.state]} / {trustHint(actor)} / {nextPressure(actor, actor.id === nextFocusActorId, backstageLoad)}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

const STATE_HINTS: Record<ActorState, string> = {
  elated: '拾うと伸びやすい',
  contemplative: '待つと活きやすい',
  anxious: '整えると崩れにくい',
  immersed: '拾う・待つが効きやすい',
  fatigued: '整える・切るで守りやすい',
};

function eventTitleSize(title: string) {
  if (title.length <= 6) return 'large';
  if (title.length <= 10) return 'medium';
  return 'compact';
}

function OmenList({ actor }: { actor: Actor }) {
  const sorted = topOmenEvents(actor);
  return (
    <div className="omen-chip-panel" aria-label="見えている兆候">
      <span>見えている兆候</span>
      <div className="omen-chip-list">
        {sorted.map(({ event, intensity }) => (
          <em key={event} className={`omen-chip omen-${intensity}`}>
            <b>{EVENT_LABELS[event]}</b>
            <small>{intensity}</small>
          </em>
        ))}
      </div>
    </div>
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

function trustHint(actor: Actor) {
  if (actor.trust >= 5) return '呼吸が強い';
  if (actor.trust >= 3) return '呼吸あり';
  return '呼吸これから';
}

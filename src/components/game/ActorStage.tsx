import { EVENT_LABELS, STATE_LABELS } from '../../game/constants';
import { topOmenEvents } from '../../game/actorLogic';
import type { Actor, ActorEvent, ActorType, PrepAction } from '../../game/types';
import { ActorSilhouette } from '../actors/ActorSilhouette';
import { Icon } from '../ui/Icon';
import { actorPassiveLabel, actorStageCopy, omenIntensityCopy, supportActorSummary } from '../../content/ja/actorStageCopy';

type Props = {
  actors: Actor[];
  focusActorId: string | null;
  nextFocusActorId?: ActorType | null;
  backstageLoad: number;
  event?: ActorEvent | null;
  selectedPrep?: PrepAction | null;
  seed: string;
  totalTurn: number;
};

export function ActorStage({ actors, focusActorId, nextFocusActorId, backstageLoad, event, seed, totalTurn }: Props) {
  const focusActor = actors.find((actor) => actor.id === focusActorId) ?? actors[0];
  const supportingActors = actors.filter((actor) => actor.id !== focusActor.id);
  const focusPassive = actorPassiveLabel(focusActor);

  if (event) {
    return (
      <section className={`event-reveal actor-figure-${focusActor.type} figure-state-${focusActor.state}`} aria-label={actorStageCopy.eventAria}>
        <div className="event-reveal-figure">
          <ActorSilhouette type={focusActor.type} />
          <em className="event-actor-tag">{focusActor.name} / {STATE_LABELS[focusActor.state]}</em>
        </div>
        <div className="event-reveal-body">
          <div className="event-reveal-kicker">
            <span>{actorStageCopy.eventKicker}</span>
          </div>
          <h2 className={`event-title title-${eventTitleSize(event.title)}`}>{event.title}</h2>
          <p>{event.description}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="actor-stage focus-stage" aria-label={actorStageCopy.stageAria}>
      <article className="actor-card focus-actor-card is-focus">
        <span className="actor-role-badge focus-role">{actorStageCopy.focusRole}</span>
        <div className={`actor-figure-wrap actor-figure-${focusActor.type} figure-state-${focusActor.state}`}>
          <ActorSilhouette type={focusActor.type} />
        </div>
        <div className="actor-card-head">
          <div className="actor-title-stack">
            <h3>{focusActor.name}</h3>
            <div className="actor-meta-line">
              <span className="actor-state-inline">{STATE_LABELS[focusActor.state]}</span>
              {focusPassive ? (
                <small className={`actor-trust-pill trust-${trustLevel(focusActor)}`}>{focusPassive}</small>
              ) : null}
            </div>
          </div>
        </div>
        <OmenList actor={focusActor} seed={seed} totalTurn={totalTurn} />
      </article>
      <SupportActors
        actors={supportingActors}
        nextFocusActorId={nextFocusActorId}
        backstageLoad={backstageLoad}
      />
    </section>
  );
}

function SupportActors({
  actors,
  nextFocusActorId,
  backstageLoad,
}: {
  actors: Actor[];
  nextFocusActorId?: ActorType | null;
  backstageLoad: number;
}) {
  if (!actors.length || !nextFocusActorId) return null;
  const nextActor = actors.find((actor) => actor.id === nextFocusActorId) ?? actors[0];
  return (
    <section className="support-actors-panel" aria-label={actorStageCopy.nextRole}>
      <div className="support-actor-chip support-next-card is-next">
        <span className="actor-role-badge next-role">{actorStageCopy.nextRole}</span>
        <strong>{nextActor.name}</strong>
        <em>{supportActorSummary(nextActor, true, backstageLoad, actorPassiveLabel(nextActor))}</em>
      </div>
    </section>
  );
}

function eventTitleSize(title: string) {
  if (title.length <= 6) return 'large';
  if (title.length <= 10) return 'medium';
  return 'compact';
}

function OmenList({ actor, seed, totalTurn }: { actor: Actor; seed: string; totalTurn: number }) {
  const sorted = topOmenEvents(actor, 3, { seed, totalTurn });
  return (
    <div className="omen-chip-panel" aria-label={actorStageCopy.visibleOmens}>
      <span>{actorStageCopy.visibleOmens}</span>
      <div className="omen-chip-list">
        {sorted.map(({ event, intensity }) => (
          <em key={event} className={`omen-chip omen-${intensity}`}>
            <Icon name={event} />
            <b>{EVENT_LABELS[event]}</b>
            <OmenStrength intensity={intensity} />
          </em>
        ))}
      </div>
    </div>
  );
}

function OmenStrength({ intensity }: { intensity: string }) {
  const lit = intensity === omenIntensityCopy.high ? 3 : intensity === omenIntensityCopy.medium ? 2 : 1;
  return (
    <span className="omen-strength" aria-label={omenIntensityCopy.strengthAria(intensity)}>
      {Array.from({ length: 3 }, (_, index) => (
        <i key={index} className={index < lit ? 'is-lit' : ''} />
      ))}
    </span>
  );
}

function trustLevel(actor: Actor) {
  if (actor.trust >= 5) return 'strong';
  if (actor.trust >= 3) return 'good';
  return 'thin';
}

import { EVENT_LABELS, STATE_LABELS } from '../../game/constants';
import { topOmenEvents } from '../../game/actorLogic';
import type { Actor, ActorEvent, ActorEventType, ActorState, ActorType, PrepAction } from '../../game/types';
import { ActorSilhouette } from '../actors/ActorSilhouette';
import { classNames } from '../ui/classNames';
import { Icon } from '../ui/Icon';
import { actorPassiveLabel, actorStageCopy, omenIntensityCopy, supportActorSummary } from '../../content/ja/actorStageCopy';
import styles from './ActorStage.module.css';

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
      <section className={classNames(styles.eventReveal, actorTypeClass[focusActor.type], actorStateClass[focusActor.state], eventTypeClass[event.type], eventMotionClass[eventMotionType(event.type)])} aria-label={actorStageCopy.eventAria}>
        <div className={styles.eventFigure}>
          <ActorSilhouette type={focusActor.type} />
        </div>
        <div className={styles.eventBody}>
          <div className={styles.eventKicker}>
            <span>{actorStageCopy.eventKicker}</span>
            <div className={styles.eventActorTags} aria-label={actorStageCopy.eventActorAria(focusActor.name, STATE_LABELS[focusActor.state])}>
              <em>{focusActor.name}</em>
              <em><small>{actorStageCopy.stateLabel}</small>{STATE_LABELS[focusActor.state]}</em>
            </div>
          </div>
          <h2 className={classNames(styles.eventTitle, eventTitleSizeClass[eventTitleSize(event.title)])}>{event.title}</h2>
          <p>{event.description}</p>
        </div>
      </section>
    );
  }
  return (
    <section className={styles.stage} aria-label={actorStageCopy.stageAria}>
      <article className={styles.focusCard}>
        <div className={classNames(styles.figureWrap, actorTypeClass[focusActor.type], actorStateClass[focusActor.state])}>
          <ActorSilhouette type={focusActor.type} />
        </div>
        <div className={styles.stageMain}>
          <div className={styles.cardHead}>
            <div className={styles.titleStack}>
              <div className={styles.identityLine}>
                <span className={classNames(styles.roleBadge, styles.focusRole)}>{actorStageCopy.focusRole}</span>
                <h3>{focusActor.name}</h3>
              </div>
              <div className={styles.metaLine}>
                <span className={styles.stateInline}><small>{actorStageCopy.stateLabel}</small>{STATE_LABELS[focusActor.state]}</span>
                {focusPassive ? (
                  <small className={classNames(styles.trustPill, trustLevelClass[trustLevel(focusActor)])}>{focusPassive}</small>
                ) : null}
              </div>
            </div>
          </div>
          <OmenList actor={focusActor} seed={seed} totalTurn={totalTurn} />
        </div>
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
    <section className={styles.supportPanel} aria-label={actorStageCopy.nextRole}>
      <div className={styles.supportNextCard}>
        <span className={classNames(styles.roleBadge, styles.nextRole)}>{actorStageCopy.nextRole}</span>
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

function eventMotionType(event: ActorEvent['type']) {
  if (event === 'stepForward' || event === 'adlib' || event === 'heatUp') return 'heat';
  if (event === 'silence' || event === 'delayedExit') return 'pause';
  return 'flow';
}

function OmenList({ actor, seed, totalTurn }: { actor: Actor; seed: string; totalTurn: number }) {
  const sorted = topOmenEvents(actor, 3, { seed, totalTurn });
  return (
    <div className={styles.omenPanel} aria-label={actorStageCopy.visibleOmens}>
      <span>{actorStageCopy.visibleOmens}</span>
      <div className={styles.omenList}>
        {sorted.map(({ event, intensity }) => (
          <em key={event} className={classNames(styles.omenChip, omenIntensityClass[intensity])}>
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
  const level = intensity === omenIntensityCopy.high ? 'high' : intensity === omenIntensityCopy.medium ? 'medium' : 'low';
  return (
    <span className={classNames(styles.omenStrength, omenStrengthClass[level])} aria-label={omenIntensityCopy.strengthAria(intensity)}>
      <i />
    </span>
  );
}

function trustLevel(actor: Actor) {
  if (actor.trust >= 5) return 'strong';
  if (actor.trust >= 3) return 'good';
  return 'thin';
}

type EventMotion = ReturnType<typeof eventMotionType>;
type EventTitleSize = ReturnType<typeof eventTitleSize>;
type TrustLevel = ReturnType<typeof trustLevel>;
type OmenStrengthLevel = 'high' | 'medium' | 'low';

const actorTypeClass: Record<ActorType, string> = {
  lead: styles.actorFigureLead,
  junior: styles.actorFigureJunior,
  skilled: styles.actorFigureSkilled,
};

const actorStateClass: Record<ActorState, string> = {
  elated: styles.stateElated,
  contemplative: styles.stateContemplative,
  anxious: styles.stateAnxious,
  immersed: styles.stateImmersed,
  fatigued: styles.stateFatigued,
};

const eventTypeClass: Record<ActorEventType, string> = {
  stepForward: styles.eventStepForward,
  adlib: styles.eventAdlib,
  heatUp: styles.eventHeatUp,
  silence: styles.eventSilence,
  positionShift: styles.eventPositionShift,
  tempoRush: styles.eventTempoRush,
  delayedExit: styles.eventDelayedExit,
  ensembleWaver: styles.eventEnsembleWaver,
};

const eventMotionClass: Record<EventMotion, string> = {
  heat: styles.motionHeat,
  pause: styles.motionPause,
  flow: styles.motionFlow,
};

const eventTitleSizeClass: Record<EventTitleSize, string> = {
  large: styles.titleLarge,
  medium: styles.titleMedium,
  compact: styles.titleCompact,
};

const trustLevelClass: Record<TrustLevel, string> = {
  strong: styles.trustStrong,
  good: styles.trustGood,
  thin: '',
};

const omenIntensityClass: Record<string, string> = {
  [omenIntensityCopy.high]: styles.omenHigh,
  [omenIntensityCopy.medium]: styles.omenMedium,
  [omenIntensityCopy.low]: styles.omenLow,
};

const omenStrengthClass: Record<OmenStrengthLevel, string> = {
  high: styles.strengthHigh,
  medium: styles.strengthMedium,
  low: styles.strengthLow,
};

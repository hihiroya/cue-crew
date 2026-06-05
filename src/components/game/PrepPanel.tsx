import { useState } from 'react';
import { EVENT_LABELS, PREP_LABELS, PREP_MATCHES, PREP_PRIMARY_RESPONSE, RESPONSE_LABELS } from '../../game/constants';
import type { Actor, ActorEventType, GameState, PrepAction } from '../../game/types';
import { Icon } from '../ui/Icon';
import {
  actorBreathLabel,
  actorBreathMemo,
  appCopy,
  prepActorMemo,
  prepExpectedMemo,
  prepKindLabel,
  prepMeaningMemo,
  prepMissedMemo,
  prepPerformanceMemo,
  scoreMoodMemo,
} from '../../content/ja/appCopy';

type PrepProps = {
  selected: PrepAction | null;
  disabled: boolean;
  approvingPrep: PrepAction | null;
  state: GameState;
  focusActor: Actor;
  visibleOmens: ActorEventType[];
  previousPrep?: PrepAction | null;
  onSelect: (prep: PrepAction) => void;
};

const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
type PrepTone = 'strong' | 'good' | 'thin' | 'danger';

export function PrepPanel({ selected, disabled, approvingPrep, state, focusActor, visibleOmens, previousPrep = null, onSelect }: PrepProps) {
  const [inspectedPrep, setInspectedPrep] = useState<PrepAction>(selected ?? 'watch');
  const inspected = inspectedPrep;
  const isApproving = approvingPrep === inspected;
  const inspectedCoveredOmens = visibleOmens.filter((event) => PREP_MATCHES[inspected].includes(event));
  const inspectedTone = prepTone(inspectedCoveredOmens.length, visibleOmens.length);
  const inspectedResponse = PREP_PRIMARY_RESPONSE[inspected];
  return (
    <section className={`choice-panel prep-panel ${isApproving ? 'is-approving' : ''}`}>
      <div className="section-heading">
        <h2>{appCopy.prep.heading}</h2>
        <small>{appCopy.prep.lead}</small>
      </div>
      <div className="choice-grid">
        {prepActions.map((prep) => {
          const coveredOmens = visibleOmens.filter((event) => PREP_MATCHES[prep].includes(event));
          const tone = prepTone(coveredOmens.length, visibleOmens.length);
          const isInspected = inspected === prep;
          return (
            <button
              key={prep}
              aria-pressed={isInspected}
              className={`choice-button prep-choice cue-${tone} ${isInspected ? 'is-selected' : ''}`}
              disabled={disabled}
              onClick={() => setInspectedPrep(prep)}
              onFocus={() => setInspectedPrep(prep)}
            >
              <div className="prep-card-top">
                <Icon name={prep} />
                <span className="prep-title">
                  <strong>{PREP_LABELS[prep]}</strong>
                  <em>{prepKindLabel(prep)}</em>
                </span>
              </div>
              <div className="cue-cover">
                <span>{appCopy.prep.coverage}</span>
                <PrepCoverageMeter covered={coveredOmens.length} total={visibleOmens.length} tone={tone} />
              </div>
              <small className="prep-response-hint">
                <Icon name={PREP_PRIMARY_RESPONSE[prep]} />
                {appCopy.prep.responseHint(RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[prep]])}
              </small>
              {previousPrep === prep ? <em className="replay-ghost-mark">{appCopy.replayGhost.previous}</em> : null}
              <PrepSelectionMarker visible={isInspected} />
            </button>
          );
        })}
      </div>
      <div className="prep-commit-bar">
        <button className="primary-action prep-commit-action" disabled={disabled} onClick={() => onSelect(inspected)}>
          {appCopy.prep.commit}
        </button>
      </div>
      <aside className={`cue-sheet cue-${inspectedTone} ${isApproving ? 'is-approving' : ''}`}>
        <div className="cue-paper">
          <div className="cue-sheet-head">
            <span>{appCopy.prep.memo}</span>
            <strong>{appCopy.prep.prepTitle(PREP_LABELS[inspected])}</strong>
          </div>
          <div className="cue-sheet-grid cue-sheet-focus">
            <section>
              <span>{appCopy.prep.visibleOmens}</span>
              <div className="cue-readiness-list">
                {visibleOmens.map((event) => {
                  const isCovered = PREP_MATCHES[inspected].includes(event);
                  return (
                    <em key={event} className={isCovered ? 'is-covered' : 'is-missed'}>
                      <span className="cue-check" aria-hidden="true">{isCovered ? '✓' : ''}</span>
                      <span>{EVENT_LABELS[event]}</span>
                      <b>{isCovered ? appCopy.prep.covered : appCopy.prep.missed}</b>
                    </em>
                  );
                })}
              </div>
            </section>
            {prepExtraEvents(inspected, visibleOmens).length ? (
              <section>
                <span>{appCopy.prep.extraEvents}</span>
                <div className="cue-tags">
                  {prepExtraEvents(inspected, visibleOmens).map((event) => (
                    <em key={event}>{EVENT_LABELS[event]}</em>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <div className="cue-read">
            <div className="prep-intent-line">
              <span>{appCopy.prep.prepMeaning}</span>
              <strong>{prepKindLabel(inspected)}</strong>
              {inspectedTone === 'danger' ? <em>{appCopy.prep.danger}</em> : null}
              <p>{prepMeaningMemo(inspected)}</p>
            </div>
            <div className="cue-note-branches">
              <section>
                <span>{appCopy.prep.responseFit}</span>
                <p><strong>{RESPONSE_LABELS[inspectedResponse]}</strong>。{prepExpectedMemo(inspected)}</p>
              </section>
              <section>
                <span>{appCopy.prep.onMissed}</span>
                <p>{prepMissedMemo(inspected)}</p>
              </section>
            </div>
          </div>
          <div className="cue-read cue-read--context">
            <div className="prep-state-line">
              <span>{appCopy.prep.performanceMemo}</span>
              <p>{prepPerformanceMemo(state)}</p>
            </div>
            <div className="prep-state-line">
              <span>{appCopy.prep.actorMemo}</span>
              <p>{prepActorMemo(focusActor)}</p>
            </div>
            <div className="prep-breath-line">
              <span>{appCopy.prep.actorBreath}</span>
              <strong>{actorBreathLabel(focusActor.trust)}</strong>
              <BreathMeter value={focusActor.trust} />
              <p>{actorBreathMemo(focusActor)}</p>
            </div>
          </div>
          <section className="cue-performance-mood" aria-label={appCopy.prep.scoreMood}>
            <span>{appCopy.prep.scoreMood}</span>
            <ScoreMoodLine icon="scene" label={appCopy.prep.scoreLabels.scene} value={state.sceneScore} body={scoreMoodMemo('scene', state.sceneScore)} />
            <ScoreMoodLine icon="flow" label={appCopy.prep.scoreLabels.flow} value={state.flowScore} body={scoreMoodMemo('flow', state.flowScore)} />
            <ScoreMoodLine icon="trust" label={appCopy.prep.scoreLabels.trust} value={state.trustScore} body={scoreMoodMemo('trust', state.trustScore)} />
          </section>
          <div className={`cue-approval-slot ${isApproving ? 'is-approved' : ''}`} aria-label={appCopy.prep.approvalLabel} aria-live="polite">
            <span>{appCopy.prep.approvalLabel}</span>
            <strong>{isApproving ? appCopy.prep.approved : appCopy.prep.pending}</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}

function PrepCoverageMeter({ covered, total, tone }: { covered: number; total: number; tone: PrepTone }) {
  const slots = Math.max(3, total);
  return (
    <strong className={`prep-coverage-meter cue-${tone}`} aria-label={appCopy.prep.coverageAria(covered, total)}>
      {Array.from({ length: slots }, (_, index) => (
        <i key={index} className={index < covered ? 'is-lit' : ''} />
      ))}
    </strong>
  );
}

function BreathMeter({ value }: { value: number }) {
  const lit = Math.min(5, Math.max(0, value));
  return (
    <span className="breath-meter" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <i key={index} className={index < lit ? 'is-lit' : ''} />
      ))}
    </span>
  );
}

function ScoreMoodLine({ icon, label, value, body }: { icon: 'scene' | 'flow' | 'trust'; label: string; value: number; body: string }) {
  return (
    <p className="cue-performance-mood-line">
      <span>
        <Icon name={icon} />
        <strong>{label}</strong>
        <b>{value}</b>
      </span>
      {body}
    </p>
  );
}

function PrepSelectionMarker({ visible }: { visible: boolean }) {
  return (
    <em className={`selection-marker selection-marker--prep ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {visible ? appCopy.prep.marker : ''}
    </em>
  );
}

function prepExtraEvents(prep: PrepAction, visibleOmens: ActorEventType[]) {
  return PREP_MATCHES[prep].filter((event) => !visibleOmens.includes(event));
}

function prepTone(covered: number, total: number): PrepTone {
  if (covered >= 2) return 'strong';
  if (covered === 1) return 'good';
  if (total === 0) return 'thin';
  return 'danger';
}

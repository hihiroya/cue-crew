import { useState } from 'react';
import { EVENT_LABELS, PREP_LABELS, PREP_MATCHES, PREP_PRIMARY_RESPONSE, PREP_RESPONSE_HINTS, RESPONSE_LABELS } from '../../game/constants';
import type { ActorEventType, PrepAction } from '../../game/types';
import { Icon } from '../ui/Icon';
import { appCopy, prepIntent, prepReadMemo, prepShortAim, prepToneLabel } from '../../content/ja/appCopy';

type PrepProps = {
  selected: PrepAction | null;
  disabled: boolean;
  approvingPrep: PrepAction | null;
  visibleOmens: ActorEventType[];
  previousPrep?: PrepAction | null;
  onSelect: (prep: PrepAction) => void;
};

const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
type PrepTone = 'strong' | 'good' | 'thin' | 'danger';

export function PrepPanel({ selected, disabled, approvingPrep, visibleOmens, previousPrep = null, onSelect }: PrepProps) {
  const [inspectedPrep, setInspectedPrep] = useState<PrepAction>(selected ?? 'watch');
  const inspected = inspectedPrep;
  const isApproving = approvingPrep === inspected;
  const inspectedCoveredOmens = visibleOmens.filter((event) => PREP_MATCHES[inspected].includes(event));
  const inspectedTone = prepTone(inspectedCoveredOmens.length, visibleOmens.length);
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
                  <em>{prepToneLabel(tone)}</em>
                </span>
              </div>
              <div className="cue-cover">
                <span>{appCopy.prep.coverage(coveredOmens.length, visibleOmens.length)}</span>
                <strong>{prepShortAim(prep)}</strong>
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
              <span>{appCopy.prep.intent}</span>
              <strong>{prepIntent(inspected)}</strong>
              {inspectedTone === 'danger' ? <em>{appCopy.prep.danger}</em> : null}
            </div>
            <p>{prepReadMemo(inspected, inspectedCoveredOmens.length)}</p>
            <div className="cue-note-branches">
              <section>
                <span>{appCopy.prep.onExpected}</span>
                <p>{appCopy.prep.receiveWith(RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[inspected]], PREP_RESPONSE_HINTS[inspected].aim)}</p>
              </section>
              <section>
                <span>{appCopy.prep.onMissed}</span>
                <p>{PREP_RESPONSE_HINTS[inspected].alternate}。</p>
              </section>
            </div>
          </div>
          <div className={`cue-approval-slot ${isApproving ? 'is-approved' : ''}`} aria-label={appCopy.prep.approvalLabel} aria-live="polite">
            <span>{appCopy.prep.approvalLabel}</span>
            <strong>{isApproving ? appCopy.prep.approved : appCopy.prep.pending}</strong>
          </div>
        </div>
      </aside>
    </section>
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

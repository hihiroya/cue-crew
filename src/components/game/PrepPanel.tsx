import { useEffect, useMemo, useRef, useState } from 'react';
import { EVENT_LABELS } from '../../game/constants';
import type { Actor, ActorEventType, GameState, PrepAction } from '../../game/types';
import { Icon } from '../ui/Icon';
import { classNames } from '../ui/classNames';
import {
  actorBreathLabel,
  actorBreathMemo,
  appCopy,
  prepActorMemo,
  prepExpectedMemo,
  prepMissedMemo,
  prepPerformanceMemo,
  scoreMoodMemo,
} from '../../content/ja/appCopy';
import { backstageLogCopy, backstagePrepLog } from '../../content/ja/backstageLogCopy';
import { prepChoiceStory } from '../../content/ja/choiceStoryCopy';
import styles from './PrepPanel.module.css';
import { buildPrepPanelViewModel, type PrepTone } from './prepPanelViewModel';

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

export function PrepPanel({ selected, disabled, approvingPrep, state, focusActor, visibleOmens, previousPrep = null, onSelect }: PrepProps) {
  const [inspectedPrep, setInspectedPrep] = useState<PrepAction>(selected ?? 'watch');
  const viewModel = useMemo(
    () => buildPrepPanelViewModel({ inspectedPrep, previousPrep, visibleOmens }),
    [inspectedPrep, previousPrep, visibleOmens],
  );
  const { inspected } = viewModel;
  const backstageNote = backstagePrepLog({
    actor: focusActor,
    prep: inspected.prep,
    seed: state.seed,
    totalTurn: state.totalTurn,
    visibleOmens: inspected.coveredOmens.length ? inspected.coveredOmens : visibleOmens,
  });
  const isApproving = approvingPrep === inspected.prep;
  const inspectedStory = prepChoiceStory(inspected.prep, visibleOmens);
  const approvalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isApproving) return;
    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      approvalRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }, [isApproving]);

  return (
    <section className={isApproving ? styles.rootApproving : styles.root}>
      <div className="section-heading">
        <h2>{appCopy.prep.heading}</h2>
        <small>{appCopy.prep.lead}</small>
      </div>
      <div className={styles.choiceGrid}>
        {viewModel.options.map(({ prep, coveredOmens, tone, isPrevious }) => {
          const isInspected = inspected.prep === prep;
          const story = prepChoiceStory(prep, visibleOmens);
          return (
            <button
              key={prep}
              aria-pressed={isInspected}
              className={classNames(styles.choiceButton, prepToneClass[tone], isInspected && styles.selected)}
              disabled={disabled}
              onClick={() => setInspectedPrep(prep)}
              onFocus={() => setInspectedPrep(prep)}
            >
              <div className="prep-card-top">
                <Icon name={prep} />
                <span className="prep-title">
                  <strong>{story.title}</strong>
                  <em>{story.caution}</em>
                </span>
              </div>
              <p className="choice-story-body">{story.body}</p>
              <div className="choice-story-tags" aria-label="準備の対象と作業">
                <em><span>対象</span>{story.target}</em>
                <em><span>作業</span>{story.work}</em>
              </div>
              <div className="cue-cover">
                <span>{appCopy.prep.coverage}</span>
                <PrepCoverageMeter covered={coveredOmens.length} total={visibleOmens.length} tone={tone} />
              </div>
              {isPrevious ? <em className="replay-ghost-mark">{appCopy.replayGhost.previous}</em> : null}
              <PrepSelectionMarker visible={isInspected} />
            </button>
          );
        })}
      </div>
      <div className={styles.commitBar}>
        <button className={styles.commitAction} disabled={disabled} onClick={() => onSelect(inspected.prep)}>
          {appCopy.prep.commit}
        </button>
      </div>
      <aside className={classNames(isApproving ? styles.cueSheetApproving : styles.cueSheet, prepToneClass[inspected.tone])}>
        <div className="cue-paper">
          <div className="cue-sheet-head">
            <div className="cue-sheet-title">
              <span>{appCopy.prep.memo}</span>
              <strong>{inspectedStory.title}</strong>
            </div>
            <div ref={approvalRef} className={`cue-approval-slot ${isApproving ? 'is-approved' : ''}`} aria-label={appCopy.prep.approvalLabel} aria-live="polite">
              <span>{appCopy.prep.approvalLabel}</span>
              <strong>{isApproving ? appCopy.prep.approved : appCopy.prep.pending}</strong>
            </div>
          </div>
          <div className="cue-sheet-grid cue-sheet-focus">
            <section>
              <span>{appCopy.prep.visibleOmens}</span>
              <div className="cue-readiness-list">
                {visibleOmens.map((event) => {
                  const isCovered = inspected.coveredOmens.includes(event);
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
            {viewModel.extraEvents.length ? (
              <section>
                <span>{appCopy.prep.extraEvents}</span>
                <div className="cue-tags">
                  {viewModel.extraEvents.map((event) => (
                    <em key={event}>{EVENT_LABELS[event]}</em>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <div className="cue-read">
            <div className="prep-intent-line">
              <span>{appCopy.prep.prepMeaning}</span>
              <strong>{inspectedStory.target}</strong>
              {inspected.tone === 'danger' ? <em>{appCopy.prep.danger}</em> : null}
              <p>{inspectedStory.body}</p>
            </div>
            <div className="cue-note-branches">
              <section>
                <span>{appCopy.prep.responseFit}</span>
                <p>{prepExpectedMemo(inspected.prep)}</p>
              </section>
              <section>
                <span>{appCopy.prep.onMissed}</span>
                <p>{prepMissedMemo(inspected.prep)}</p>
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
          <aside className="backstage-log-note">
            <span>{backstageLogCopy.label}</span>
            <p>{backstageNote}</p>
          </aside>
          <section className="cue-performance-mood" aria-label={appCopy.prep.scoreMood}>
            <span>{appCopy.prep.scoreMood}</span>
            <ScoreMoodLine icon="scene" label={appCopy.prep.scoreLabels.scene} value={state.sceneScore} body={scoreMoodMemo('scene', state.sceneScore)} />
            <ScoreMoodLine icon="flow" label={appCopy.prep.scoreLabels.flow} value={state.flowScore} body={scoreMoodMemo('flow', state.flowScore)} />
            <ScoreMoodLine icon="trust" label={appCopy.prep.scoreLabels.trust} value={state.trustScore} body={scoreMoodMemo('trust', state.trustScore)} />
          </section>
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

const prepToneClass: Record<PrepTone, string> = {
  strong: 'cue-strong',
  good: 'cue-good',
  thin: 'cue-thin',
  danger: 'cue-danger',
};

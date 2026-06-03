import { useState } from 'react';
import { EVENT_LABELS, PREP_LABELS, PREP_MATCHES, PREP_PRIMARY_RESPONSE, PREP_RESPONSE_HINTS, RESPONSE_LABELS } from '../../game/constants';
import type { ActorEventType, PrepAction } from '../../game/types';
import { Icon } from '../ui/Icon';

type PrepProps = {
  selected: PrepAction | null;
  disabled: boolean;
  approvingPrep: PrepAction | null;
  visibleOmens: ActorEventType[];
  onSelect: (prep: PrepAction) => void;
};

const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
type PrepTone = 'strong' | 'good' | 'thin' | 'danger';

export function PrepPanel({ selected, disabled, approvingPrep, visibleOmens, onSelect }: PrepProps) {
  const [inspectedPrep, setInspectedPrep] = useState<PrepAction>(selected ?? 'watch');
  const inspected = inspectedPrep;
  const isApproving = approvingPrep === inspected;
  const inspectedCoveredOmens = visibleOmens.filter((event) => PREP_MATCHES[inspected].includes(event));
  const inspectedTone = prepTone(inspectedCoveredOmens.length, visibleOmens.length);
  return (
    <section className={`choice-panel prep-panel ${isApproving ? 'is-approving' : ''}`}>
      <div className="section-heading">
        <h2>準備を決める</h2>
        <small>役者の兆候を見て、本番中の想定外に備える準備を選ぶ。</small>
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
                  <em>本番で{RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[prep]]}と活きる</em>
                </span>
              </div>
              <div className="cue-cover">
                <span>兆候との相性</span>
                <strong>{prepToneLabel(tone)}</strong>
              </div>
              <PrepSelectionMarker visible={isInspected} />
            </button>
          );
        })}
      </div>
      <aside className={`cue-sheet cue-${inspectedTone} ${isApproving ? 'is-approving' : ''}`}>
        <div className="cue-paper">
          <div className="cue-sheet-head">
            <span>本番前メモ</span>
            <strong>{PREP_LABELS[inspected]}の準備</strong>
          </div>
          <div className="cue-sheet-grid cue-sheet-focus">
            <section>
              <span>見えている兆候</span>
              <div className="cue-readiness-list">
                {visibleOmens.map((event) => {
                  const isCovered = PREP_MATCHES[inspected].includes(event);
                  return (
                    <em key={event} className={isCovered ? 'is-covered' : 'is-missed'}>
                      <span className="cue-check" aria-hidden="true">{isCovered ? '✓' : ''}</span>
                      <span>{EVENT_LABELS[event]}</span>
                      <b>{isCovered ? '準備済み' : '対象外'}</b>
                    </em>
                  );
                })}
              </div>
            </section>
            {prepExtraEvents(inspected, visibleOmens).length ? (
              <section>
                <span>同じ準備で拾える出来事</span>
                <div className="cue-tags">
                  {prepExtraEvents(inspected, visibleOmens).map((event) => (
                    <em key={event}>{EVENT_LABELS[event]}</em>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <div className="cue-read">
            <p>{prepReadMemo(inspected, inspectedCoveredOmens.length, visibleOmens.length)}</p>
            <div className="cue-note-branches">
              <section>
                <span>備えどおりに来たら</span>
                <p><strong>{RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[inspected]]}</strong>で受ける。{PREP_RESPONSE_HINTS[inspected].aim}。</p>
              </section>
              <section>
                <span>外れたら</span>
                <p>{PREP_RESPONSE_HINTS[inspected].alternate}。</p>
              </section>
            </div>
          </div>
          <div className={`cue-approval-slot ${isApproving ? 'is-approved' : ''}`} aria-label="承認欄" aria-live="polite">
            <span>承認欄</span>
            <strong>{isApproving ? '承認済' : '未承認'}</strong>
          </div>
        </div>
      </aside>
      <div className="prep-commit-bar">
        <button className="primary-action prep-commit-action" disabled={disabled} onClick={() => onSelect(inspected)}>
          この準備で本番へ
        </button>
      </div>
    </section>
  );
}

function PrepSelectionMarker({ visible }: { visible: boolean }) {
  return (
    <em className={`selection-marker selection-marker--prep ${visible ? 'is-visible' : ''}`} aria-hidden={!visible}>
      {visible ? 'メモ反映中' : ''}
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

function prepToneLabel(tone: PrepTone) {
  if (tone === 'strong') return '見えている兆候に合う';
  if (tone === 'good') return '一部に備えあり';
  if (tone === 'thin') return '別筋に備える';
  return '今の兆候とは遠い';
}

function prepReadMemo(prep: PrepAction, covered: number, _total: number) {
  if (covered >= 2) {
    return '見えている兆候に備えが入っている。起きた出来事を、次の対応へつなぎやすい準備。';
  }
  if (covered === 1) {
    return '見えている兆候の一部に備えている。備えが外れた時の受け方も残す準備。';
  }
  if (prep === 'prepareTransition') {
    return '今見えている兆候とは別筋だが、崩れを小さく閉じるための準備。高負荷になる前に退路を残す。';
  }
  return '今見えている兆候とは別筋。役者の出来事が違う方向へ動いた時に備える準備。';
}

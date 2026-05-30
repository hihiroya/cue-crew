import { EVENT_LABELS, PREP_DESCRIPTIONS, PREP_LABELS, PREP_MATCHES, PREP_PRIMARY_RESPONSE, PREP_RESPONSE_HINTS, PREP_RESPONSE_READY_LABELS, RESPONSE_DESCRIPTIONS, RESPONSE_LABELS } from '../../game/constants';
import { responseInsight } from '../../game/scoring';
import type { ActorEventType, GameState, MainResponse, PrepAction } from '../../game/types';
import { Icon } from '../ui/Icon';

type PrepProps = {
  selected: PrepAction | null;
  disabled: boolean;
  visibleOmens: ActorEventType[];
  onSelect: (prep: PrepAction) => void;
};

const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
const responses: MainResponse[] = ['catch', 'arrange', 'wait', 'cut'];

export function PrepPanel({ selected, disabled, visibleOmens, onSelect }: PrepProps) {
  return (
    <section className="choice-panel">
      <div className="section-heading">
        <p>一手目</p>
        <h2>先読みを決める</h2>
      </div>
      <div className="choice-grid">
        {prepActions.map((prep) => {
          const coveredOmens = visibleOmens.filter((event) => PREP_MATCHES[prep].includes(event));
          const coverLabels = PREP_MATCHES[prep].map((event) => EVENT_LABELS[event]).join(' / ');
          return (
            <button key={prep} className={`choice-button prep-choice ${selected === prep ? 'is-selected' : ''}`} disabled={disabled} onClick={() => onSelect(prep)}>
              <Icon name={prep} />
              <span>{PREP_LABELS[prep]}</span>
              <em className="ready-label">{PREP_RESPONSE_READY_LABELS[prep]}</em>
              <em className="fit-label">見えている兆候 {coveredOmens.length}/{visibleOmens.length}</em>
              <small>{PREP_DESCRIPTIONS[prep]}</small>
              <div className="prep-plan">
                <strong>主対応: {RESPONSE_LABELS[PREP_PRIMARY_RESPONSE[prep]]}</strong>
                <small>{PREP_RESPONSE_HINTS[prep].aim}</small>
                <small>別筋: {PREP_RESPONSE_HINTS[prep].alternate}</small>
              </div>
              <small className="cover-line">カバー: {coverLabels}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type ResponseProps = {
  selected: MainResponse | null;
  disabled: boolean;
  state: GameState;
  onSelect: (response: MainResponse) => void;
};

export function ResponsePanel({ selected, disabled, state, onSelect }: ResponseProps) {
  return (
    <section className="choice-panel">
      <div className="section-heading">
        <p>二手目{state.selectedPrep ? ` / 先読み: ${PREP_LABELS[state.selectedPrep]}` : ''}</p>
        <h2>本対応を選ぶ</h2>
      </div>
      <div className="choice-grid response-grid">
        {responses.map((response) => {
          const insight = responseInsight(state, response);
          return (
            <button key={response} className={`choice-button response-choice fit-${insight.rangeTone} ${selected === response ? 'is-selected' : ''}`} disabled={disabled} onClick={() => onSelect(response)}>
              <Icon name={response} />
              <span>{RESPONSE_LABELS[response]}</span>
              <em className="fit-label">{insight.handTypeLabel}</em>
              <small>{RESPONSE_DESCRIPTIONS[response]}</small>
              {insight.dangerWarning ? <strong className="danger-warning">{insight.dangerWarning}</strong> : null}
              <div className={`prep-relation relation-${insight.prepRelationTone}`}>
                <span>先読み: {insight.prepRelationLabel}</span>
                <small>狙い: {insight.responseAimLabel}</small>
              </div>
              <div className="range-copy">
                <span>成功幅: {insight.successRangeLabel}</span>
                <small>上振れ: {insight.upsideLabel}</small>
                <small>下振れ: {insight.downsideLabel}</small>
              </div>
              <dl className="reason-grid">
                <div><dt>出来事</dt><dd>{insight.eventAffinityLabel}</dd></div>
                <div><dt>役者</dt><dd>{insight.actorAffinityLabel}</dd></div>
                <div><dt>公演回</dt><dd>{insight.actInfluenceLabel}</dd></div>
                <div><dt>副作用</dt><dd>{insight.sideEffectLabel}</dd></div>
              </dl>
            </button>
          );
        })}
      </div>
    </section>
  );
}

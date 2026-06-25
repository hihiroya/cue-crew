import { useMemo, useState } from 'react';
import type { GameState, MainResponse, TurnLog } from '../../game/types';
import {
  eventListForReadMatch,
  prepLabelForReadMatch,
  readAlignmentBody,
  readAlignmentLabel,
  responsePanelCopy,
} from '../../content/ja/responsePanelCopy';
import { EVENT_LABELS } from '../../game/constants';
import { classNames } from '../ui/classNames';
import styles from './ActionPanel.module.css';
import { buildResponsePanelViewModel, type ReadAlignment } from './responsePanelViewModel';
import { ResponseChoiceCard, ResponseConsole, ResponseSendBar } from './ResponsePanelParts';

export { PrepPanel } from './PrepPanel';

type ResponseProps = {
  selected: MainResponse | null;
  disabled: boolean;
  state: GameState;
  previousTurnLog?: TurnLog | null;
  onSelect: (response: MainResponse) => void;
};

export function ResponsePanel({ selected, disabled, state, previousTurnLog = null, onSelect }: ResponseProps) {
  const viewModel = useMemo(() => buildResponsePanelViewModel(state, previousTurnLog), [state, previousTurnLog]);
  const [inspectedResponse, setInspectedResponse] = useState<MainResponse>(selected ?? 'catch');
  const inspected = viewModel.insights.find((insight) => insight.response === inspectedResponse) ?? viewModel.insights[0];
  const inspectedDetails = viewModel.detailsByResponse[inspected.response];
  const readAlignment = viewModel.readAlignment;
  return (
    <section className={classNames(styles.responseRoot, readAlignment && readToneClass[readAlignment.tone])}>
      <div className="section-heading">
        <h2>{responsePanelCopy.heading}</h2>
      </div>
      {readAlignment ? <ReadAlignmentPanel alignment={readAlignment} /> : null}
      <div className={styles.responseGrid}>
        {viewModel.insights.map((insight) => (
          <ResponseChoiceCard
            key={insight.response}
            disabled={disabled}
            event={state.currentActorEvent?.type}
            insight={insight}
            isInspected={inspected.response === insight.response}
            readTone={readAlignment?.tone ?? null}
            onInspect={setInspectedResponse}
          />
        ))}
      </div>
      <ResponseSendBar disabled={disabled} response={inspected.response} onSelect={onSelect} />
      <ResponseConsole
        insight={inspected}
        state={state}
        buildCue={inspectedDetails.buildCue}
        replayDelta={inspectedDetails.replayDelta}
      />
    </section>
  );
}

function ReadAlignmentPanel({ alignment }: { alignment: ReadAlignment }) {
  const label = readAlignmentLabel(alignment.tone);
  return (
    <section className="read-match-panel" aria-label={`${responsePanelCopy.readMatchTitle}: ${label}`}>
      <div className="read-match-head">
        <span>{responsePanelCopy.readMatchTitle}</span>
        <strong>{label}</strong>
      </div>
      <div className="read-match-flow">
        <em>
          <span>{responsePanelCopy.readMatchPrep}</span>
          <strong>{prepLabelForReadMatch(alignment.prep)}</strong>
        </em>
        <b aria-hidden="true">→</b>
        <em>
          <span>{responsePanelCopy.readMatchActual}</span>
          <strong>{EVENT_LABELS[alignment.actualEvent]}</strong>
        </em>
      </div>
      <div className="read-match-tags">
        <em><span>{responsePanelCopy.readMatchVisible}</span>{eventListForReadMatch(alignment.visibleOmens)}</em>
        <em><span>{responsePanelCopy.readMatchPrepared}</span>{eventListForReadMatch(alignment.preparedEvents)}</em>
      </div>
      <p>{readAlignmentBody(alignment.reason)}</p>
    </section>
  );
}

const readToneClass: Record<ReadAlignment['tone'], string> = {
  hit: 'read-hit',
  partial: 'read-partial',
  miss: 'read-miss',
};

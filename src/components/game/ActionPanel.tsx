import { useMemo, useState } from 'react';
import type { GameState, MainResponse, TurnLog } from '../../game/types';
import { responsePanelCopy } from '../../content/ja/responsePanelCopy';
import styles from './ActionPanel.module.css';
import { buildResponsePanelViewModel } from './responsePanelViewModel';
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
  return (
    <section className={styles.responseRoot}>
      <div className="section-heading">
        <h2>{responsePanelCopy.heading}</h2>
      </div>
      <div className={styles.responseGrid}>
        {viewModel.insights.map((insight) => (
          <ResponseChoiceCard
            key={insight.response}
            disabled={disabled}
            event={state.currentActorEvent?.type}
            insight={insight}
            isInspected={inspected.response === insight.response}
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

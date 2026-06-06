import { useMemo, useReducer } from 'react';
import { PrepPanel, ResponsePanel } from '../components/game/ActionPanel';
import { ActorStage } from '../components/game/ActorStage';
import { ResultPreviewCard } from '../components/game/ResultPreviewCard';
import { ScoreBar } from '../components/game/ScoreBar';
import { GameHeader } from '../components/layout/GameHeader';
import { ExitConfirmDialog, GameExitControl, PhaseStrip } from './GameShellControls';
import { ResultScreen } from './ResultScreen';
import { TitleScreen } from './TitleScreen';
import { useExitConfirm } from './useExitConfirm';
import { useGameViewState } from './useGameViewState';
import { usePerformanceHistory } from './usePerformanceHistory';
import { usePendingPrepCue } from './usePendingPrepCue';
import { useScrollResetOnPhaseChange } from './useScrollResetOnPhaseChange';
import { pickFocusActor, topOmenEvents } from '../game/actorLogic';
import { TOTAL_TURNS } from '../game/constants';
import { finishPerformance, gameReducer, titleState } from '../game/gameReducer';
import { dailyRunFor } from '../game/rogueliteProgress';
import { makeSeed } from '../game/rng';
import { previewResult } from '../game/resultPreview';

export function App() {
  const [state, dispatch] = useReducer(gameReducer, titleState);
  const { displayState, isUiScenario } = useGameViewState(state);
  const { showExitConfirm, openExitConfirm, closeExitConfirm } = useExitConfirm();
  const { history, collection, dailyBests, finishedResult, refreshHistory } = usePerformanceHistory(displayState, isUiScenario);

  const resultPreview = useMemo(() => {
    if (displayState.status !== 'result') return null;
    try {
      return previewResult(displayState);
    } catch {
      return null;
    }
  }, [displayState]);
  const focusActor = displayState.actors.find((actor) => actor.id === displayState.currentFocusActorId) ?? displayState.actors[0];
  const visibleOmenEvents = topOmenEvents(focusActor, 3, { seed: displayState.seed, totalTurn: displayState.totalTurn }).map((omen) => omen.event);
  const nextFocusActorId = displayState.totalTurn < TOTAL_TURNS ? pickFocusActor(displayState.seed, displayState.totalTurn + 1) : null;
  const previousSameSeedRun = useMemo(
    () => history.find((entry) => entry.seed === displayState.seed) ?? null,
    [history, displayState.seed],
  );
  const { pendingPrepCue, beginPrepCue } = usePendingPrepCue({
    dispatch,
    previousSameSeedRun,
    stateStatus: state.status,
  });
  const previousTurnLog = previousSameSeedRun?.logs.find((log) => log.totalTurn === displayState.totalTurn) ?? null;
  const dailyRun = useMemo(() => dailyRunFor(), []);

  useScrollResetOnPhaseChange({
    disabled: isUiScenario,
    status: displayState.status,
    totalTurn: displayState.totalTurn,
  });

  if (displayState.status === 'title') {
    return (
      <TitleScreen
        history={history}
        collection={collection}
        dailyBests={dailyBests}
        onStart={() => dispatch({ type: 'START' })}
        onStartDaily={(seed) => dispatch({ type: 'START', seed })}
        onReplay={(seed) => dispatch({ type: 'START', seed })}
      />
    );
  }

  if (displayState.status === 'finished') {
    return (
      <ResultScreen
        result={finishedResult ?? finishPerformance(displayState)}
        previousSameSeed={previousSameSeedRun}
        collection={collection}
        dailyRun={dailyRun}
        dailyBest={dailyBests[dailyRun.seed] ?? null}
        onTitle={() => {
          refreshHistory();
          dispatch({ type: 'RESET_TO_TITLE' });
        }}
        onReplaySame={() => dispatch({ type: 'START', seed: state.seed })}
        onReplayNew={() => dispatch({ type: 'START', seed: makeSeed() })}
        onReplayDaily={(seed) => dispatch({ type: 'START', seed })}
      />
    );
  }

  return (
    <main className="game-shell">
      <GameHeader state={displayState} />
      <ScoreBar state={displayState} />
      <PhaseStrip status={displayState.status} />
      {displayState.status !== 'result' ? (
        <ActorStage
          actors={displayState.actors}
          focusActorId={displayState.currentFocusActorId}
          nextFocusActorId={nextFocusActorId}
          backstageLoad={displayState.backstageLoad}
          event={displayState.currentActorEvent}
          selectedPrep={displayState.selectedPrep}
          seed={displayState.seed}
          totalTurn={displayState.totalTurn}
        />
      ) : null}
      <div className="action-slot">
        {displayState.status === 'prep' ? (
          <PrepPanel
            selected={displayState.selectedPrep}
            disabled={Boolean(pendingPrepCue)}
            approvingPrep={pendingPrepCue?.prep ?? null}
            state={displayState}
            focusActor={focusActor}
            visibleOmens={visibleOmenEvents}
            previousPrep={previousTurnLog?.prepAction ?? null}
            onSelect={(prep) => {
              if (!isUiScenario) beginPrepCue(prep);
            }}
          />
        ) : null}
        {displayState.status === 'response' ? (
          <ResponsePanel
            selected={displayState.selectedResponse}
            disabled={false}
            state={displayState}
            previousTurnLog={previousTurnLog}
            onSelect={(response) => {
              if (!isUiScenario) dispatch({ type: 'SELECT_RESPONSE', response });
            }}
          />
        ) : null}
        {displayState.status === 'result' ? (
          <ResultPreviewCard
            preview={resultPreview}
            collection={collection}
            canCommit
            onCommit={() => {
              if (!isUiScenario) dispatch({ type: 'COMMIT_RESULT' });
            }}
          />
        ) : null}
      </div>
      <GameExitControl
        disabled={isUiScenario}
        onRequestExit={openExitConfirm}
      />
      {showExitConfirm ? (
        <ExitConfirmDialog
          onCancel={closeExitConfirm}
          onConfirm={() => {
            closeExitConfirm();
            dispatch({ type: 'RESET_TO_TITLE' });
          }}
        />
      ) : null}
    </main>
  );
}

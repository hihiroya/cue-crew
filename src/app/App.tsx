import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { PrepPanel, ResponsePanel } from '../components/game/ActionPanel';
import { ActorStage } from '../components/game/ActorStage';
import { ResultPreviewCard } from '../components/game/ResultPreviewCard';
import { ScoreBar } from '../components/game/ScoreBar';
import { GameHeader } from '../components/layout/GameHeader';
import { ResultScreen } from './ResultScreen';
import { TitleScreen } from './TitleScreen';
import { pickFocusActor, topOmenEvents } from '../game/actorLogic';
import { TOTAL_TURNS } from '../game/constants';
import { finishPerformance, gameReducer, readPerformanceHistory, savePerformanceResult, titleState } from '../game/gameReducer';
import { makeSeed } from '../game/rng';
import { previewResult } from '../game/scoring';
import type { GameState, GameStatus, PrepAction } from '../game/types';
import { getUiScenarioStateFromLocation } from '../game/uiScenarios';

type PendingPrepCue = {
  prep: PrepAction;
};

export function App() {
  const [state, dispatch] = useReducer(gameReducer, titleState);
  const uiScenarioState = useMemo(() => getUiScenarioStateFromLocation(), []);
  const displayState = uiScenarioState ?? state;
  const isUiScenario = Boolean(uiScenarioState);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [pendingPrepCue, setPendingPrepCue] = useState<PendingPrepCue | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const savedFinishedStateRef = useRef<GameState | null>(null);
  const history = useMemo(() => {
    historyVersion;
    return readPerformanceHistory();
  }, [historyVersion]);

  const resultPreview = useMemo(() => {
    if (displayState.status !== 'result') return null;
    try {
      return previewResult(displayState);
    } catch {
      return null;
    }
  }, [displayState]);
  const finishedResult = useMemo(() => (
    displayState.status === 'finished' ? finishPerformance(displayState) : null
  ), [displayState]);
  const focusActor = displayState.actors.find((actor) => actor.id === displayState.currentFocusActorId) ?? displayState.actors[0];
  const visibleOmenEvents = topOmenEvents(focusActor).map((omen) => omen.event);
  const nextFocusActorId = displayState.totalTurn < TOTAL_TURNS ? pickFocusActor(displayState.seed, displayState.totalTurn + 1) : null;

  useEffect(() => {
    if (!pendingPrepCue) return;
    if (state.status !== 'prep') {
      setPendingPrepCue(null);
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReducedMotion ? 120 : 1200;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'SELECT_PREP', prep: pendingPrepCue.prep });
      setPendingPrepCue(null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [pendingPrepCue, state.status]);

  useEffect(() => {
    if (isUiScenario) return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [displayState.status, displayState.totalTurn, isUiScenario]);

  useEffect(() => {
    if (!showExitConfirm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowExitConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showExitConfirm]);

  useEffect(() => {
    if (isUiScenario || displayState.status !== 'finished' || !finishedResult) return;
    if (savedFinishedStateRef.current === displayState) return;
    savePerformanceResult(finishedResult);
    savedFinishedStateRef.current = displayState;
    setHistoryVersion((version) => version + 1);
  }, [displayState, finishedResult, isUiScenario]);

  const beginPrepCue = (prep: PrepAction) => {
    if (pendingPrepCue) return;
    setPendingPrepCue({ prep });
  };

  if (displayState.status === 'title') {
    return (
      <TitleScreen
        history={history}
        onStart={() => dispatch({ type: 'START' })}
        onReplay={(seed) => dispatch({ type: 'START', seed })}
      />
    );
  }

  if (displayState.status === 'finished') {
    return (
      <ResultScreen
        result={finishedResult ?? finishPerformance(displayState)}
        onTitle={() => {
          setHistoryVersion((version) => version + 1);
          dispatch({ type: 'RESET_TO_TITLE' });
        }}
        onReplaySame={() => dispatch({ type: 'START', seed: state.seed })}
        onReplayNew={() => dispatch({ type: 'START', seed: makeSeed() })}
      />
    );
  }

  return (
    <main className="game-shell">
      <GameHeader state={displayState} />
      <ScoreBar state={displayState} />
      <div className="phase-strip">
        <span className={phaseStepClass(displayState.status, 'prep')}><i aria-hidden="true" />準備</span>
        <span className={phaseStepClass(displayState.status, 'response')}><i aria-hidden="true" />対応</span>
        <span className={phaseStepClass(displayState.status, 'result')}><i aria-hidden="true" />場面</span>
      </div>
      {displayState.status !== 'result' ? (
        <ActorStage
          actors={displayState.actors}
          focusActorId={displayState.currentFocusActorId}
          nextFocusActorId={nextFocusActorId}
          backstageLoad={displayState.backstageLoad}
          event={displayState.currentActorEvent}
          selectedPrep={displayState.selectedPrep}
        />
      ) : null}
      <div className="action-slot">
        {displayState.status === 'prep' ? (
          <PrepPanel
            selected={displayState.selectedPrep}
            disabled={Boolean(pendingPrepCue)}
            approvingPrep={pendingPrepCue?.prep ?? null}
            visibleOmens={visibleOmenEvents}
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
            onSelect={(response) => {
              if (!isUiScenario) dispatch({ type: 'SELECT_RESPONSE', response });
            }}
          />
        ) : null}
        {displayState.status === 'result' ? (
          <ResultPreviewCard
            preview={resultPreview}
            canCommit
            onCommit={() => {
              if (!isUiScenario) dispatch({ type: 'COMMIT_RESULT' });
            }}
          />
        ) : null}
      </div>
      <GameExitControl
        disabled={isUiScenario}
        onRequestExit={() => setShowExitConfirm(true)}
      />
      {showExitConfirm ? (
        <ExitConfirmDialog
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setShowExitConfirm(false);
            dispatch({ type: 'RESET_TO_TITLE' });
          }}
        />
      ) : null}
    </main>
  );
}

function phaseStepClass(status: GameStatus, step: 'prep' | 'response' | 'result') {
  const order = { prep: 0, response: 1, result: 2 };
  if (status === step) return 'is-active';
  if (status in order && order[status as keyof typeof order] > order[step]) return 'is-done';
  return '';
}

function GameExitControl({ disabled, onRequestExit }: { disabled: boolean; onRequestExit: () => void }) {
  return (
    <div className="game-exit-control">
      <button type="button" disabled={disabled} onClick={onRequestExit}>公演を降りる</button>
    </div>
  );
}

function ExitConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="exit-dialog-backdrop" role="presentation" onClick={onCancel}>
      <section
        className="exit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <p>途中退場</p>
          <h2 id="exit-dialog-title">公演を降りますか？</h2>
          <span>この公演の途中経過は保存されません。</span>
        </div>
        <div className="exit-dialog-actions">
          <button type="button" className="primary-action" onClick={onCancel}>続ける</button>
          <button type="button" className="danger-outline-action" onClick={onConfirm}>タイトルへ戻る</button>
        </div>
      </section>
    </div>
  );
}

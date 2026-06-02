import { useEffect, useMemo, useReducer, useState } from 'react';
import { PrepPanel, ResponsePanel } from '../components/game/ActionPanel';
import { ActorStage } from '../components/game/ActorStage';
import { ResultPreviewCard } from '../components/game/ResultPreviewCard';
import { ScoreBar } from '../components/game/ScoreBar';
import { GameHeader } from '../components/layout/GameHeader';
import { Icon } from '../components/ui/Icon';
import { ActorSilhouette } from '../components/actors/ActorSilhouette';
import { pickFocusActor, topOmenEvents } from '../game/actorLogic';
import { ACTOR_LABELS, EVENT_LABELS, PERFORMANCE_SLOT_LABELS, PERFORMANCE_STYLE_DETAILS, TOTAL_TURNS } from '../game/constants';
import { finishPerformance, gameReducer, readPerformanceHistory, titleState } from '../game/gameReducer';
import { makeSeed } from '../game/rng';
import { previewResult } from '../game/scoring';
import type { GameStatus, PerformanceResult, PrepAction } from '../game/types';
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
        result={finishPerformance(displayState)}
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
      <GameHeader state={displayState} onTitle={() => {
        if (!isUiScenario) dispatch({ type: 'RESET_TO_TITLE' });
      }} />
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
      {displayState.pendingFrayEvent ? <div className="fray-note compact-fray">前のほころび: {displayState.pendingFrayEvent.title}</div> : null}
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
    </main>
  );
}

function phaseStepClass(status: GameStatus, step: 'prep' | 'response' | 'result') {
  const order = { prep: 0, response: 1, result: 2 };
  if (status === step) return 'is-active';
  if (status in order && order[status as keyof typeof order] > order[step]) return 'is-done';
  return '';
}

function TitleScreen({ history, onStart, onReplay }: { history: PerformanceResult[]; onStart: () => void; onReplay: (seed: string) => void }) {
  const [showHowTo, setShowHowTo] = useState(false);
  return (
    <main className="title-screen">
      <section className="title-panel">
        <div className="title-ghost-stage" aria-hidden="true">
          <ActorSilhouette type="lead" />
          <ActorSilhouette type="junior" />
          <ActorSilhouette type="skilled" />
        </div>
        <div className="stage-mark"><Icon name="spark" /></div>
        <p className="title-series">本番中につき！</p>
        <h1>舞台裏の一手</h1>
        <p className="title-copy">3日間のマチネとソワレを回し、初日の手応えから公演の色を作る。</p>
        <div className="title-actions">
          <button className="primary-action" onClick={onStart}>はじめる</button>
          <button className="secondary-action" onClick={() => setShowHowTo((value) => !value)}>遊び方</button>
        </div>
        {showHowTo ? (
          <div className="howto-panel">
            <p>全6公演。マチネは次のソワレへ向けた調整、ソワレはその日の評判と公演全体への影響が大きい。</p>
            <p>1日目ソワレ後に公演の色が決まり、2日目以降の拾う・待つ・整える・切るの意味が少し変わる。</p>
          </div>
        ) : null}
      </section>
      <section className="history-panel">
        <div className="section-heading">
          <p><Icon name="history" /> 履歴</p>
          <h2>最近の公演</h2>
        </div>
        {history.length === 0 ? (
          <p className="muted">まだ記録はない。初日のマチネを開けよう。</p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <button key={`${item.seed}-${item.finishedAt}`} onClick={() => onReplay(item.seed)}>
                <strong>{item.title}</strong>
                <span>評判 {item.sceneScore} / 段取り {item.flowScore} / 座組信頼 {item.trustScore}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ResultScreen({ result, onTitle, onReplaySame, onReplayNew }: { result: PerformanceResult; onTitle: () => void; onReplaySame: () => void; onReplayNew: () => void }) {
  return (
    <main className="result-screen">
      <section className="result-hero">
        <div className="stage-mark"><Icon name="spark" /></div>
        <p>終演</p>
        <h1>{result.title}</h1>
        {result.performanceStyle ? <p>{PERFORMANCE_STYLE_DETAILS[result.performanceStyle].label}</p> : null}
        <div className="review-notes">
          {(result.reviewNotes?.length ? result.reviewNotes : [result.review]).map((note) => <p key={note}>{note}</p>)}
        </div>
        <div className="final-scores">
          <span>評判 <strong>{result.sceneScore}</strong></span>
          <span>段取り <strong>{result.flowScore}</strong></span>
          <span>座組信頼 <strong>{result.trustScore}</strong></span>
          <span>裏方負荷 <strong>{result.backstageLoad}/5</strong></span>
        </div>
      </section>
      <section className="highlight-panel">
        <div className="section-heading">
          <p>ハイライト</p>
          <h2>三日間に残った場面</h2>
        </div>
        <div className="highlight-list">
          {result.highlights.map((log) => (
            <article key={`${log.totalTurn}-${log.sceneTitle}`}>
              <span>{log.act}日目 {PERFORMANCE_SLOT_LABELS[log.turnInAct === 1 ? 'matinee' : 'soiree'].label}</span>
              <h3>{log.sceneTitle}</h3>
              <p>{ACTOR_LABELS[log.focusActorType]}の{EVENT_LABELS[log.actorEventType]}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="result-actions">
        <button className="primary-action" onClick={onReplayNew}>新しいseedで再演</button>
        <button className="secondary-action" onClick={onReplaySame}>同じseedで再演</button>
        <button className="ghost-button" onClick={onTitle}>タイトルへ</button>
      </div>
    </main>
  );
}

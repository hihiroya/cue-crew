import { useEffect, useMemo, useReducer, useState } from 'react';
import { PrepPanel, ResponsePanel } from '../components/game/ActionPanel';
import { ActorStage } from '../components/game/ActorStage';
import { ResultPreviewCard } from '../components/game/ResultPreviewCard';
import { ScoreBar } from '../components/game/ScoreBar';
import { GameHeader } from '../components/layout/GameHeader';
import { Icon } from '../components/ui/Icon';
import { ActorSilhouette } from '../components/actors/ActorSilhouette';
import { pickFocusActor, topOmenEvents } from '../game/actorLogic';
import { ACTOR_LABELS, EVENT_LABELS, PERFORMANCE_SLOT_LABELS, PERFORMANCE_STYLE_DETAILS, PREP_LABELS, PREP_MATCHES, PREP_RESPONSE_READY_LABELS, TOTAL_TURNS } from '../game/constants';
import { finishPerformance, gameReducer, readPerformanceHistory, titleState } from '../game/gameReducer';
import { makeSeed } from '../game/rng';
import { previewResult } from '../game/scoring';
import type { ActorEventType, PerformanceResult, PrepAction } from '../game/types';

type PendingPrepCue = {
  prep: PrepAction;
  coveredCount: number;
  visibleCount: number;
};

export function App() {
  const [state, dispatch] = useReducer(gameReducer, titleState);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [pendingPrepCue, setPendingPrepCue] = useState<PendingPrepCue | null>(null);
  const history = useMemo(() => {
    historyVersion;
    return readPerformanceHistory();
  }, [historyVersion]);

  const resultPreview = useMemo(() => {
    if (state.status !== 'result') return null;
    try {
      return previewResult(state);
    } catch {
      return null;
    }
  }, [state]);
  const focusActor = state.actors.find((actor) => actor.id === state.currentFocusActorId) ?? state.actors[0];
  const visibleOmenEvents = topOmenEvents(focusActor).map((omen) => omen.event);
  const nextFocusActorId = state.totalTurn < TOTAL_TURNS ? pickFocusActor(state.seed, state.totalTurn + 1) : null;

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
    const coveredCount = visibleOmenEvents.filter((event: ActorEventType) => PREP_MATCHES[prep].includes(event)).length;
    setPendingPrepCue({ prep, coveredCount, visibleCount: visibleOmenEvents.length });
  };

  if (state.status === 'title') {
    return (
      <TitleScreen
        history={history}
        onStart={() => dispatch({ type: 'START' })}
        onReplay={(seed) => dispatch({ type: 'START', seed })}
      />
    );
  }

  if (state.status === 'finished') {
    return (
      <ResultScreen
        result={finishPerformance(state)}
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
      <GameHeader state={state} onTitle={() => dispatch({ type: 'RESET_TO_TITLE' })} />
      <ScoreBar state={state} />
      <div className="phase-strip">
        <span className={state.status === 'prep' ? 'is-active' : ''}>先読みを決める</span>
        <span className={state.status === 'response' ? 'is-active' : ''}>行動に対応</span>
        <span className={state.status === 'result' ? 'is-active' : ''}>場面を見る</span>
      </div>
      {state.status !== 'result' ? (
        <ActorStage
          actors={state.actors}
          focusActorId={state.currentFocusActorId}
          nextFocusActorId={nextFocusActorId}
          backstageLoad={state.backstageLoad}
          event={state.currentActorEvent}
          selectedPrep={state.selectedPrep}
        />
      ) : null}
      {state.pendingFrayEvent ? <div className="fray-note compact-fray">前のほころび: {state.pendingFrayEvent.title}</div> : null}
      <div className="action-slot">
        {state.status === 'prep' ? (
          <PrepPanel
            selected={state.selectedPrep}
            disabled={Boolean(pendingPrepCue)}
            visibleOmens={visibleOmenEvents}
            onSelect={beginPrepCue}
          />
        ) : null}
        {state.status === 'response' ? (
          <ResponsePanel
            selected={state.selectedResponse}
            disabled={false}
            state={state}
            onSelect={(response) => dispatch({ type: 'SELECT_RESPONSE', response })}
          />
        ) : null}
        {state.status === 'result' ? (
          <ResultPreviewCard
            preview={resultPreview}
            canCommit
            onCommit={() => dispatch({ type: 'COMMIT_RESULT' })}
          />
        ) : null}
      </div>
      {pendingPrepCue ? <PrepCueTransition cue={pendingPrepCue} /> : null}
    </main>
  );
}

function PrepCueTransition({ cue }: { cue: PendingPrepCue }) {
  return (
    <div className="prep-cue-transition" role="status" aria-live="polite" aria-label="先読み待機中">
      <div className="prep-cue-card">
        <span className="prep-cue-icon"><Icon name={cue.prep} /></span>
        <p>{PREP_RESPONSE_READY_LABELS[cue.prep]}</p>
        <h2>{PREP_LABELS[cue.prep]}で読む</h2>
        <strong>本番の揺れを待つ</strong>
        <em>兆候カバー {cue.coveredCount}/{cue.visibleCount}</em>
      </div>
    </div>
  );
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
        <p className="title-copy">3日間のマチネとソワレを回し、初日の手応えから公演の型を作る。</p>
        <div className="title-actions">
          <button className="primary-action" onClick={onStart}>はじめる</button>
          <button className="secondary-action" onClick={() => setShowHowTo((value) => !value)}>遊び方</button>
        </div>
        {showHowTo ? (
          <div className="howto-panel">
            <p>全6公演。マチネは次のソワレへ向けた調整、ソワレはその日の評判と公演全体への影響が大きい。</p>
            <p>1日目ソワレ後に公演の型が決まり、2日目以降の拾う・待つ・整える・切るの意味が少し変わる。</p>
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

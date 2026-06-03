import { useEffect, useMemo, useReducer, useState } from 'react';
import { PrepPanel, ResponsePanel } from '../components/game/ActionPanel';
import { ActorStage } from '../components/game/ActorStage';
import { ResultPreviewCard } from '../components/game/ResultPreviewCard';
import { ScoreBar } from '../components/game/ScoreBar';
import { GameHeader } from '../components/layout/GameHeader';
import { Icon } from '../components/ui/Icon';
import titlePosterImage from '../assets/title/title-poster.webp';
import { pickFocusActor, topOmenEvents } from '../game/actorLogic';
import { ACTOR_LABELS, EVENT_LABELS, PERFORMANCE_SLOT_LABELS, PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS, TOTAL_TURNS } from '../game/constants';
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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

function TitleScreen({ history, onStart, onReplay }: { history: PerformanceResult[]; onStart: () => void; onReplay: (seed: string) => void }) {
  const [showHowTo, setShowHowTo] = useState(false);
  return (
    <main className="title-screen">
      <section className="title-panel">
        <div className="title-ghost-stage" aria-hidden="true">
          <img src={titlePosterImage} alt="" draggable={false} />
        </div>
        <div className="stage-mark"><Icon name="spark" /></div>
        <div className="title-lockup">
          <p className="title-series">1人用舞台裏マネジメント</p>
          <h1 className="title-logo" aria-label="本番中 x 舞台裏">
            <span>本番中</span>
            <span className="title-cross" aria-hidden="true" />
            <span>舞台裏</span>
          </h1>
          <p className="title-copy">兆候を読み 予定外を名場面へ</p>
          <div className="title-actions">
            <button className="primary-action" onClick={onStart}>はじめる</button>
            <button className="secondary-action" onClick={() => setShowHowTo((value) => !value)}>遊び方</button>
          </div>
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
                <small>同じ公演をやり直す</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ResultScreen({ result, onTitle, onReplaySame, onReplayNew }: { result: PerformanceResult; onTitle: () => void; onReplaySame: () => void; onReplayNew: () => void }) {
  const styleLabel = result.performanceStyle ? PERFORMANCE_STYLE_DETAILS[result.performanceStyle].label : '公演の色 未確定';
  const timelineLogs = result.logs?.length ? result.logs : result.highlights;
  const maxDecisionCount = Math.max(1, ...result.insight.decisionDistribution.map((item) => item.count));
  return (
    <main className="result-screen">
      <section className="result-hero">
        <div className="stage-mark"><Icon name="spark" /></div>
        <p>公演報告書</p>
        <h1>{result.title}</h1>
        <div className="final-style-badge">
          <span>公演の色</span>
          <strong>{styleLabel}</strong>
        </div>
        <div className="review-notes">
          {(result.reviewNotes?.length ? result.reviewNotes.slice(0, 3) : [result.review]).map((note) => <p key={note}>{note}</p>)}
        </div>
        <div className="report-section-label">
          <span>総合評価欄</span>
          <small>全公演結果</small>
        </div>
        <div className={`performance-rank-card rank-${rankClass(result.insight.rank)}`}>
          <span>公演ランク</span>
          <strong>{result.insight.rank}</strong>
          <p>総合評価点 {result.insight.totalScore}</p>
          <em>{result.insight.pointsToNextRank === null ? '最高ランク到達' : `あと${result.insight.pointsToNextRank}点で ${result.insight.nextRank}`}</em>
        </div>
        <div className="score-attack-note">
          <span>次回改善メモ</span>
          <p>{result.insight.scoreNote}</p>
        </div>
        <div className="report-section-label">
          <span>公演指標</span>
          <small>集計</small>
        </div>
        <div className="packet-metrics">
          <span>準備 <strong>{result.insight.prepHits}/6</strong><small>{result.insight.prepHitRate}%</small></span>
          <span>名場面 <strong>{result.insight.masterpieceCount}</strong><small>場面</small></span>
          <span>場面以上 <strong>{result.insight.sceneOrBetterCount}</strong><small>回</small></span>
          <span>ほころび <strong>{result.insight.frayOrAccidentCount}</strong><small>回</small></span>
        </div>
        <div className="final-scores">
          <FinalScore label="評判" value={result.sceneScore} note={scoreNote('scene', result.sceneScore)} />
          <FinalScore label="段取り" value={result.flowScore} note={scoreNote('flow', result.flowScore)} />
          <FinalScore label="座組信頼" value={result.trustScore} note={scoreNote('trust', result.trustScore)} />
          <FinalScore label="裏方負荷" value={`${result.backstageLoad}/5`} note={loadNote(result.backstageLoad)} />
        </div>
      </section>
      <section className="packet-panel cue-note-panel">
        <div className="section-heading">
          <p>進行記録</p>
          <h2>代表的な一手</h2>
        </div>
        {result.insight.bestCue ? (
          <article className="best-cue-card">
            <span>{result.insight.bestCue.act}日目 {PERFORMANCE_SLOT_LABELS[result.insight.bestCue.turnInAct === 1 ? 'matinee' : 'soiree'].label} / {RESULT_TIER_LABELS[result.insight.bestCue.resultTier]} {RESULT_TIER_STARS[result.insight.bestCue.resultTier]}</span>
            <h3>{result.insight.bestCue.sceneTitle}</h3>
            <p>{ACTOR_LABELS[result.insight.bestCue.focusActorType]}の{EVENT_LABELS[result.insight.bestCue.actorEventType]}を{RESPONSE_LABELS[result.insight.bestCue.mainResponse]}で受けた。</p>
          </article>
        ) : null}
        <div className="next-note">
          <span>次回への申し送り</span>
          <p>{result.insight.nextNote}</p>
        </div>
      </section>
      <section className="packet-panel survey-panel">
        <div className="section-heading">
          <p>観客アンケート</p>
          <h2>客席に届いたもの</h2>
        </div>
        <div className="survey-grid">
          <SurveyMeter label="また観たい" value={result.audienceSurvey.encoreInterest} />
          <SurveyMeter label="余韻に残った" value={result.audienceSurvey.lingeringAfterglow} />
          <SurveyMeter label="場面の熱量" value={result.audienceSurvey.sceneHeat} />
          <SurveyMeter label="進行の安定感" value={result.audienceSurvey.stability} />
        </div>
      </section>
      <section className="packet-panel media-review-panel">
        <div className="section-heading">
          <p>外部評</p>
          <h2>{result.mediaReview.outlet}</h2>
        </div>
        <div className="media-review">
          <span>{'★'.repeat(result.mediaReview.stars)}{'☆'.repeat(5 - result.mediaReview.stars)}</span>
          <strong>{result.mediaReview.headline}</strong>
          <p>{result.mediaReview.quote}</p>
        </div>
      </section>
      <section className="packet-panel decision-report-panel">
        <div className="section-heading">
          <p>進行記録</p>
          <h2>判断傾向</h2>
        </div>
        <div className="decision-bars">
          {result.insight.decisionDistribution.map((item) => (
            <div key={item.response} className="decision-bar">
              <span><Icon name={item.response} />{RESPONSE_LABELS[item.response]}</span>
              <meter min={0} max={maxDecisionCount} value={item.count} />
              <strong>{item.count}回</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="highlight-panel packet-panel timeline-report-panel">
        <div className="section-heading">
          <p>進行記録</p>
          <h2>三日間の流れ</h2>
        </div>
        <div className="performance-timeline">
          {timelineLogs.map((log) => (
            <article key={`${log.totalTurn}-${log.sceneTitle}`} className={`timeline-tier-${log.resultTier}`}>
              <span>{log.act}日目 {PERFORMANCE_SLOT_LABELS[log.turnInAct === 1 ? 'matinee' : 'soiree'].label}</span>
              <h3>{log.sceneTitle}</h3>
              <p>{ACTOR_LABELS[log.focusActorType]}の{EVENT_LABELS[log.actorEventType]} / {RESPONSE_LABELS[log.mainResponse]} / {RESULT_TIER_LABELS[log.resultTier]}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="result-actions">
        <button className="primary-action" onClick={onReplayNew}>別の公演を開ける</button>
        <button className="secondary-action" onClick={onReplaySame}>同じ公演をやり直す</button>
        <button className="ghost-button" onClick={onTitle}>タイトルへ</button>
      </div>
    </main>
  );
}

function FinalScore({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <span>
      {label}
      <strong>{value}</strong>
      <small>{note}</small>
    </span>
  );
}

function SurveyMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="survey-meter">
      <span>{label}</span>
      <strong>{value}%</strong>
      <meter min={0} max={100} value={value} />
    </div>
  );
}

function scoreNote(kind: 'scene' | 'flow' | 'trust', value: number) {
  if (kind === 'scene') {
    if (value >= 18) return '見せ場豊作';
    if (value >= 10) return '場面が残った';
    if (value >= 4) return '手応えあり';
    return '伸びしろ';
  }
  if (kind === 'flow') {
    if (value >= 8) return '呼吸安定';
    if (value >= 3) return '大崩れなし';
    if (value >= 0) return '維持';
    return '乱れ多め';
  }
  if (value >= 8) return '座組が強い';
  if (value >= 3) return '信頼あり';
  if (value >= 0) return '維持';
  return '削れ気味';
}

function loadNote(value: number) {
  if (value >= 4) return '次回注意';
  if (value >= 2) return '余熱あり';
  return '軽い';
}

function rankClass(rank: PerformanceResult['insight']['rank']) {
  return rank.replace('+', 'plus').toLowerCase();
}

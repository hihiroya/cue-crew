import { ACTOR_LABELS, EVENT_LABELS, PERFORMANCE_SLOT_LABELS, PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS } from '../game/constants';
import type { PerformanceResult } from '../game/types';
import { Icon } from '../components/ui/Icon';

type Props = {
  result: PerformanceResult;
  onTitle: () => void;
  onReplaySame: () => void;
  onReplayNew: () => void;
};

export function ResultScreen({ result, onTitle, onReplaySame, onReplayNew }: Props) {
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
        <div className="replay-challenge-note">
          <span>次回チャレンジ</span>
          <strong>{nextChallenge(result)}</strong>
          <p>{sameSeedHint(result)}</p>
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

function nextChallenge(result: PerformanceResult) {
  if (result.insight.pointsToNextRank !== null && result.insight.pointsToNextRank <= 8) {
    return `同じseedで${result.insight.nextRank}到達`;
  }
  if (result.insight.prepHits < 4) return '準備ヒット4回以上';
  if (result.insight.frayOrAccidentCount >= 2) return 'ほころび1回以下で終演';
  if (result.backstageLoad >= 3) return '最終負荷2以下';
  if (result.insight.masterpieceCount < 2) return '名場面2回以上';
  return `${RESPONSE_LABELS[result.insight.dominantResponse]}型の最高ランク更新`;
}

function sameSeedHint(result: PerformanceResult) {
  if (result.insight.pointsToNextRank === null) return '最高ランク到達。同じ公演で別の型を狙える。';
  if (result.insight.bestCue) {
    return `${result.insight.bestCue.act}日目${PERFORMANCE_SLOT_LABELS[result.insight.bestCue.turnInAct === 1 ? 'matinee' : 'soiree'].label}を基準に、あと${result.insight.pointsToNextRank}点を詰めたい。`;
  }
  return `あと${result.insight.pointsToNextRank}点。準備と負荷管理を詰める。`;
}

function rankClass(rank: PerformanceResult['insight']['rank']) {
  return rank.replace('+', 'plus').toLowerCase();
}

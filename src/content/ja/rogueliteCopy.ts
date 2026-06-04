import { RESPONSE_LABELS, RESULT_TIER_LABELS } from './gameLabels';
import type { MainResponse, PerformanceResult, PrepAction, TurnLog } from '../../game/types';

export const dailyRunCopy = {
  title: '今日の巡り合わせ',
  variants: {
    roughOpening: { modifier: '初日は荒れやすい', detail: '守りの価値が少し上がる' },
    juniorHeat: { modifier: '若手が乗りやすい', detail: '拾う判断が評判へつながりやすい' },
    leadSilence: { modifier: '主役が沈黙を抱える', detail: '待つ判断の読みどころが増える' },
    skilledDrift: { modifier: '技巧派の軸が揺れる', detail: '整える判断が光りやすい' },
    heavyTransition: { modifier: '転換が重い', detail: '切る・整えるの負荷管理が大事' },
    hotAudience: { modifier: '客席が熱い', detail: '評判は伸びるが負荷も残りやすい' },
  },
} as const;

export const performanceBadgeCopy = {
  sharpRead: (prepHits: number) => ({ label: `準備${prepHits}/6的中`, detail: '兆候読みが公演全体を支えた' }),
  doubleMasterpiece: (masterpieceCount: number) => ({ label: `名場面${masterpieceCount}回`, detail: '強い場面が複数残った' }),
  lightLoad: { label: '負荷軽く終演', detail: '舞台裏を崩さず渡した' },
  cleanRun: { label: 'ほころびなし', detail: '三日間を安定して閉じた' },
  finaleScene: { label: '千秋楽で場面化', detail: '最後の一手が客席へ届いた' },
  styleMax: { label: '型Lv.3到達', detail: '今回の公演の色を伸ばし切った' },
  manyDiscoveries: { label: '発見多め', detail: '図鑑と称号が大きく進んだ' },
  allCues: { label: '四つのキュー完走', detail: '全対応を使って場面を作った' },
  hotBackstage: { label: '負荷注意', detail: '再演では終盤の整えどころ' },
  steadyScenes: { label: '場面以上2回', detail: '次は名場面まで伸ばせる' },
} as const;

export const rogueliteProgressCopy = {
  unbuiltStyle: {
    label: '未確立',
    note: '初日ソワレ後に公演の型が決まる',
  },
  styleNote: (label: string, level: number, toNext: number) => {
    if (level >= 3) return `${label}が千秋楽フィニッシュ圏に入った`;
    if (level >= 2) return `${label}が強化中。あと${toNext}で最大化`;
    if (level >= 1) return `${label}が立ち上がった。あと${toNext}で伸びる`;
    return `${label}の芽がある。得意な対応で育つ`;
  },
  rankDelta: (delta: number) => {
    if (delta > 0) return `ランク+${delta}`;
    if (delta < 0) return `ランク${delta}`;
    return 'ランク維持';
  },
  replayDelta: {
    previousBetter: '前回より上',
    rankUp: 'ランク上',
    lighterLoad: '負荷軽い',
    same: '前回同等',
    rankDown: 'ランク下',
    heavierLoad: '負荷重い',
  },
  comparison: (comparison: {
    totalScoreDelta: number;
    rankDeltaLabel: string;
    prepHitsDelta: number;
    masterpieceDelta: number;
    loadDelta: number;
  }) => {
    const score = comparison.totalScoreDelta === 0 ? '総合±0' : `総合${comparison.totalScoreDelta > 0 ? '+' : ''}${comparison.totalScoreDelta}`;
    const load = comparison.loadDelta === 0 ? '負荷±0' : `負荷${comparison.loadDelta > 0 ? '+' : ''}${comparison.loadDelta}`;
    return `${score} / ${comparison.rankDeltaLabel} / 準備${signed(comparison.prepHitsDelta)} / 名場面${signed(comparison.masterpieceDelta)} / ${load}`;
  },
  initialBuildCue: '初日ソワレで型が決まる',
  alternateBuildCue: (response: MainResponse) => `${RESPONSE_LABELS[response]}で別筋`,
  noNewAchievements: '新規称号なし',
} as const;

export const nextChallengeCopy = {
  kicker: '次の公演目標',
  sameSeedCta: '同じ巡り合わせで再演',
  retrySeedCta: '同じ巡り合わせで再演',
  replaySeedCta: '同じ巡り合わせで再演',
  newSeedCta: '別の公演を開ける',
  startCta: 'はじめる',
  dailyCta: '今日の巡り合わせへ',
  suggestionTitle: (totalTurn: number, response: MainResponse) => `${turnLabelByNumber(totalTurn)}で${RESPONSE_LABELS[response]}を試す`,
  suggestionBody: (suggestion: { prep: PrepAction; response: MainResponse; resultTier: TurnLog['resultTier']; totalScoreDelta: number; loadDelta: number }) => (
    `候補: ${prepLabel(suggestion.prep)} -> ${RESPONSE_LABELS[suggestion.response]}。${RESULT_TIER_LABELS[suggestion.resultTier]}見込みで総合${signed(suggestion.totalScoreDelta)}、負荷${signed(suggestion.loadDelta)}。`
  ),
  titleWithTurn: (log: TurnLog) => `${turnLabel(log)}を詰める`,
  fallbackSwingBody: (targetTurn: TurnLog | null) => (
    `「${targetTurn?.sceneTitle ?? '詰めどころ'}」が伸びしろ。${targetTurn ? improvementReason(targetTurn) : ''}同じ巡り合わせで差分を取りにいく。`
  ),
  nearRankTitle: (rank: PerformanceResult['insight']['nextRank'], points: number) => `${rank}まであと${points}点`,
  nearRankBody: '今回の読み筋は届きかけている。準備ヒットと最終負荷を少し詰めるだけで更新圏。',
  lockedSceneTitle: '未開放の場面を探す',
  lockedSceneBody: (hint: string) => `狙い目: ${hint}。別の巡り合わせで図鑑の空白を開ける。`,
  dominantStyleTitle: (response: MainResponse) => `${RESPONSE_LABELS[response]}型を更新する`,
  dominantStyleBody: '同じ癖に寄せず、次の巡り合わせで別の型や名場面を拾いにいく。',
  firstRunTitle: '初日のマチネを開ける',
  firstRunBody: 'まずは6ターンを通して、準備と対応がどう公演の色になるかを見る。',
  replaySuggestionBody: (suggestion: { prep: PrepAction; response: MainResponse; totalScoreDelta: number }) => (
    `候補: ${prepLabel(suggestion.prep)} -> ${RESPONSE_LABELS[suggestion.response]}。総合${signed(suggestion.totalScoreDelta)}を狙える。`
  ),
  replayTurnTitle: (log: TurnLog) => `${turnLabel(log)}を再演で詰める`,
  replayFallbackTitle: '同じ巡り合わせを詰める',
  replayTurnBody: (log: TurnLog) => `直近の「${log.sceneTitle}」が改善候補。前回と違う準備か対応を試す。`,
  replayFallbackBody: '履歴に伸びしろが残っている。',
  historyNearRankBody: '届きかけの公演がある。最終負荷と準備ヒットを詰めると更新しやすい。',
  collectionTitle: '図鑑の空白を開ける',
  collectionBody: (hint: string) => `狙い目: ${hint}。新しい巡り合わせでまだ見ていない場面を探す。`,
  newStyleTitle: '新しい型を探す',
  newStyleBody: '履歴とは違う巡り合わせで、別の役者・出来事・公演の色を拾いにいく。',
  dailyBody: (modifier: string, detail: string) => `${modifier}。${detail}。今日の固定公演で自己ベストを作る。`,
} as const;

export const achievementCatalogCopy = [
  { id: 'heat-catcher', label: '拾う手の演出助手', detail: '拾うで名場面を重ねる' },
  { id: 'finale-breath', label: '間を信じた舞台監督', detail: '千秋楽で待つ判断を成功させる' },
  { id: 'flow-keeper', label: '乱れを包む進行役', detail: '整える判断で負荷を抜く' },
  { id: 'clean-blackout', label: '暗転の切れ味', detail: '切る判断で崩れを閉じる' },
  { id: 'light-backstage', label: '三日間を軽く渡した', detail: '最終負荷を低く抑える' },
  { id: 'read-the-room', label: '兆候読みの達人', detail: '準備を5回以上活かす' },
  { id: 'all-cue-run', label: '四つのキューを使い切った', detail: '全対応を使って場面を作る' },
  { id: 'heat-finale', label: '熱量の千秋楽', detail: '熱量型Lv.3で千秋楽に場面以上を作る' },
  { id: 'breath-finale', label: '余韻の千秋楽', detail: '余韻型Lv.3で千秋楽に場面以上を作る' },
  { id: 'control-finale', label: '精度の千秋楽', detail: '精度型Lv.3で千秋楽に場面以上を作る' },
  { id: 'closure-finale', label: '収束の千秋楽', detail: '収束型Lv.3で千秋楽に場面以上を作る' },
] as const;

export const sceneHintCatalogCopy = [
  { id: 'junior:adlib:catch', actor: 'junior', event: 'adlib', response: 'catch', hint: '予定外の一言を客席へ渡す' },
  { id: 'junior:heatUp:catch', actor: 'junior', event: 'heatUp', response: 'catch', hint: '熱を止めずに見せ場へ伸ばす' },
  { id: 'lead:silence:wait', actor: 'lead', event: 'silence', response: 'wait', hint: '沈黙の間を信じる' },
  { id: 'lead:delayedExit:wait', actor: 'lead', event: 'delayedExit', response: 'wait', hint: '遅れた退場を余韻にする' },
  { id: 'skilled:positionShift:arrange', actor: 'skilled', event: 'positionShift', response: 'arrange', hint: 'ズレた位置へ意味を与える' },
  { id: 'skilled:ensembleWaver:arrange', actor: 'skilled', event: 'ensembleWaver', response: 'arrange', hint: '揺れた群像を包む' },
  { id: 'any:tempoRush:cut', actor: 'any', event: 'tempoRush', response: 'cut', hint: '走った拍を暗転で閉じる' },
  { id: 'any:silence:wait', actor: 'any', event: 'silence', response: 'wait', hint: '客席まで届く間を作る' },
] as const;

export const scoreRuleExtraCopy = {
  buildLevel3: '育った公演の型が千秋楽の伸びを押す',
  buildLevel2: '育った公演の型が得意な対応を支える',
} as const;

function turnLabel(log: TurnLog) {
  return `${log.act}日目${log.turnInAct === 1 ? 'マチネ' : 'ソワレ'}`;
}

function turnLabelByNumber(totalTurn: number) {
  const act = Math.ceil(totalTurn / 2);
  return `${act}日目${totalTurn % 2 === 1 ? 'マチネ' : 'ソワレ'}`;
}

function prepLabel(prep: PrepAction) {
  if (prep === 'watch') return '注視';
  if (prep === 'makeSpace') return '余白';
  if (prep === 'tightenFlow') return '締め';
  return '転換';
}

function improvementReason(log: TurnLog) {
  if (log.prepQuality === 'miss') return '準備が外れた回。';
  if (log.deltaLoad >= 2) return '負荷が重く残った回。';
  if (log.resultTier === 'accident') return '事故相当まで崩れた回。';
  if (log.resultTier === 'fray') return 'ほころびが残った回。';
  return 'もう一段伸ばせる回。';
}

function signed(value: number) {
  if (value === 0) return '±0';
  return `${value > 0 ? '+' : ''}${value}`;
}

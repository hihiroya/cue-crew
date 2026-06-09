import { ACTOR_LABELS, ACTOR_TRAITS, EVENT_LABELS, PERFORMANCE_SLOT_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS, STATE_LABELS } from './gameLabels';
import { STATE_HINTS } from './actorStageCopy';
import { displayScore, signedDisplayScore } from '../../game/scoreDisplay';
import type { Actor, GameState, MainResponse, PerformanceResult, PrepAction, PrepPredictionQuality, ResultTier } from '../../game/types';

export const appCopy = {
  phase: {
    prep: '準備',
    response: '対応',
    result: '場面',
  },
  replayGhost: {
    previous: '前回',
  },
  exit: {
    action: '公演を終了する',
    kicker: '公演終了',
    title: 'この公演を終了しますか？',
    body: '途中経過は保存されず、タイトルへ戻ります。',
    cancel: '公演を続ける',
    confirm: '終了してタイトルへ',
  },
  title: {
    series: '舞台裏マネジメント',
    logoLabel: '本番中 x 舞台裏',
    logoFirst: '本番中',
    logoSecond: '舞台裏',
    catchphrase: '兆候を読み 予定外を名場面へ',
    start: 'はじめる',
    startNew: '新しい公演を始める',
    replayRecommended: '同じ巡り合わせで再演',
    howTo: '遊び方',
    nav: {
      home: 'ホーム',
      records: '記録',
      collection: '図鑑',
      howTo: '遊び方',
    },
    quickActions: {
      daily: '今日',
      records: '記録を見る',
      collection: '図鑑を見る',
      howTo: '遊び方',
    },
    homeDailyLabel: '今日の巡り合わせ',
    homeDailyFresh: '本日未挑戦',
    homeDailyBest: (rank: string, score: number) => `本日ベスト ${rank} / ${displayScore(score)}点`,
    homeCollectionSummary: (scenes: number, achievements: number) => `図鑑 ${scenes}場面 / 称号 ${achievements}`,
    recordsLead: '再演したい公演や、公演バッジから過去の公演を選ぶ。',
    collectionLead: '未開放の場面と称号から、次に狙う公演を探す。',
    howToLines: [
      '全3日、マチネとソワレの全6回。マチネは次のソワレへ向けた調整、ソワレはその日の評判と公演全体への影響が大きい。',
      '1日目ソワレ後に公演の色が決まり、2日目以降の拾う・待つ・整える・切るの意味が少し変わる。',
    ],
    howToSteps: [
      { title: '兆候を見る', body: '注目役者の状態と出やすい出来事を読む。' },
      { title: '準備する', body: '本番前メモへ備えを反映し、想定外の受け方を決める。' },
      { title: 'キューを出す', body: '拾う、整える、待つ、切るから一手を選び、結果を次へ渡す。' },
    ],
    historyKicker: '履歴',
    historyTitle: '最近の公演',
    recentReplayTitle: 'すぐ再演',
    emptyHistory: 'まだ記録はない。初日のマチネを開けよう。',
    historyStats: (item: PerformanceResult) => `ランク ${item.insight.rank} / 評判 ${item.sceneScore} / 段取り ${item.flowScore} / 一体感 ${item.trustScore}`,
    historyReplaySuffix: '同じ巡り合わせでやり直す',
    historyBadges: '公演バッジ',
    historyBadgeFilter: '公演バッジで履歴を絞り込む',
    historyBadgeAll: 'すべて',
    dailyKicker: '日替わり挑戦',
    dailyStart: '今日の巡り合わせへ',
    dailyFresh: '本日未記録',
    dailyBest: (rank: string, score: number) => `本日ベスト ${rank} / ${displayScore(score)}点`,
    collectionKicker: '図鑑',
    collectionTitle: '場面図鑑と称号',
    collectionScenes: '場面',
    collectionAchievements: '称号',
    collectionEmpty: 'まだ称号はない。終演まで通すと記録が増える。',
    collectionOpen: '図鑑を見る',
    collectionClose: '図鑑を閉じる',
    collectionRecentScenes: '最近開いた場面',
    collectionNoScenes: 'まだ場面は記録されていない。',
    collectionLockedScenes: '未開放の狙い目',
    collectionLockedSceneTitle: '未開放の場面',
    collectionAchievementList: '称号一覧',
    collectionUnlocked: '解放済み',
    collectionLocked: '未解放',
    collectionReplay: '同じ巡り合わせで再演',
    bestBadges: {
      rank: '最高評価',
      scene: '評判最高',
      load: '最少負荷',
    },
  },
  result: {
    unsetStyle: '公演の色 未確定',
    heroKicker: '公演報告書',
    styleLabel: '公演の色',
    totalReview: '総合評価欄',
    allResults: '全公演結果',
    rank: '公演ランク',
    totalScore: (score: number) => `総合評価点 ${displayScore(score)}`,
    maxRank: '最高ランク到達',
    pointsToNext: (points: number, rank: string | null) => (
      points <= 0 ? `${rank ?? '次ランク'}条件を満たすと昇格` : `あと${displayScore(points)}点で ${rank ?? ''}`
    ),
    scoreNote: '足りない部分',
    challenge: '再演チャレンジ',
    spotlight: '今回の見どころ',
    spotlightSub: '公演に残った成果',
    spotlightMasterpiece: '名場面',
    spotlightPrep: '準備的中',
    spotlightPrevious: '前回比',
    spotlightAchievement: '新称号',
    spotlightBadge: '公演バッジ',
    spotlightDiscovery: '発見',
    spotlightSceneUnit: '場面',
    spotlightScoreDelta: (value: number) => signedDisplayScore(value),
    spotlightAchievementCount: (count: number) => `${count}件`,
    spotlightBadgeCount: (count: number) => `${count}個`,
    performanceBadges: '今回の公演バッジ',
    buildStyle: '公演の色',
    buildLevel: (level: number) => {
      if (level >= 3) return '濃く出た';
      if (level >= 2) return '育っている';
      if (level >= 1) return '芽が出た';
      return '未確定';
    },
    discovery: '発見',
    discoveryScore: (score: number) => `発見点 ${score}`,
    collectionScenes: (count: number) => `場面 ${count}`,
    achievements: '称号',
    noAchievements: '新規称号なし',
    previousSeed: '前回比',
    poster: '終演ポスター',
    posterSeed: '再演の巡り合わせ',
    metrics: '公演指標',
    aggregate: '集計',
    prepMetric: '準備',
    masterpieceMetric: '名場面',
    sceneOrBetterMetric: '場面以上',
    frayMetric: 'ほころび',
    sceneUnit: '場面',
    countUnit: '回',
    finalScoreLabels: {
      scene: '評判',
      flow: '段取り',
      trust: '一体感',
      load: '裏方負荷',
    },
    record: '進行記録',
    recordDetails: '公演記録を見る',
    bestCue: '代表的な一手',
    bestCueBody: (result: PerformanceResult) => {
      const cue = result.insight.bestCue;
      if (!cue) return '';
      return `${cue.act}日目 ${PERFORMANCE_SLOT_LABELS[cue.turnInAct === 1 ? 'matinee' : 'soiree'].label} / ${cue.resultTier}`;
    },
    nextHandoff: '再演への申し送り',
    surveyKicker: '観客アンケート',
    surveyTitle: '客席に届いたもの',
    surveyLabels: {
      encore: 'また観たい',
      afterglow: '余韻に残った',
      heat: '場面の熱量',
      stability: '進行の安定感',
    },
    mediaReview: '劇評',
    decisionTrend: '判断傾向',
    timeline: '三日間の流れ',
    replayNew: '別の公演を開ける',
    replaySame: '同じ巡り合わせでやり直す',
    title: 'タイトルへ',
    decisionCount: (count: number) => `${count}回`,
  },
  prep: {
    heading: '準備を決める',
    lead: '役者の兆候を見て、本番中の想定外に備える準備を選ぶ。',
    affinity: '兆候との相性',
    coverage: '兆候備え',
    coverageAria: (covered: number, total: number) => `兆候備え ${covered}/${total}`,
    memo: '本番前メモ',
    prepTitle: (label: string) => `${label}の準備`,
    visibleOmens: '見えている兆候',
    covered: '備えあり',
    missed: '備え外',
    extraEvents: '同じ準備で拾える出来事',
    performanceMemo: '今回の回',
    actorMemo: '注目役者',
    actorBreath: '役者との呼吸',
    prepMeaning: '準備の意味',
    responseFit: '活きる対応',
    scoreMood: '公演の雰囲気',
    scoreLabels: {
      scene: '評判',
      flow: '段取り',
      trust: '一体感',
    },
    stateRead: '状態の読み',
    intent: '今回の読み',
    danger: '見えている兆候とは少し外れる',
    onExpected: '備えどおりに来たら',
    onMissed: '外れたら',
    responseHint: (responseLabel: string) => `活きる対応 ${responseLabel}`,
    approvalLabel: '承認欄',
    approved: '承認済',
    pending: '未承認',
    commit: 'この準備で本番へ',
    marker: 'メモに反映',
  },
  resultPreview: {
    emptyKicker: '場面の見立て',
    emptyTitle: '対応を選ぶと、見立てが立つ',
    emptyBody: '結果は確定前に確認できる。拾うか、整えるか、待つか、切るか。',
    ticket: 'キュー結果票',
    finale: '千秋楽',
    ratingLabel: 'キュー判定',
    ratingAria: (tierLabel: string) => `キュー判定 ${tierLabel}`,
    scoreLabel: '判定点',
    scoreUnit: '点',
    tierRail: 'キュー判定の段階',
    reasonChips: '効いた理由',
    scoreReached: (tierLabel: string) => `${tierLabel}到達`,
    pointsToTier: (points: number, tierLabel: string) => `${tierLabel}まであと${displayScore(points)}点`,
    sceneRecord: '場面記録',
    scoringMemo: 'キューの効き方',
    frayRecovery: 'ほころび回収',
    frayRecoveryBody: '失敗の余白が場面の材料になった',
    newScene: '新場面候補',
    newSceneBody: '終演まで通すと場面図鑑に記録される',
    lesson: '次の判断メモ',
    key: '決め手',
    cost: '代償',
    handoff: '申し送り',
    finalHandoff: '公演報告へ',
    audience: '客席',
    reasons: '主な理由',
    styleNew: 'この公演の色が決まった',
    style: '公演の色',
    deltaAria: '公演への反映',
    deltaTitle: '公演への反映',
    deltaSub: '次に残る変化',
    deltaLabels: {
      flow: '段取り',
      trust: '一体感',
      load: '負荷',
    },
    commitNext: 'この結果で次の回へ',
    commitFinale: 'この結果で公演報告へ',
  },
} as const;

export const prepQualityBanner: Record<PrepPredictionQuality, { className: string; label: string; detail: string }> = {
  hit: { className: 'is-hit', label: '準備が活きた', detail: '上振れ幅が広がった' },
  partial: { className: 'is-partial', label: '準備が一部活きた', detail: '崩れを抑えた' },
  miss: { className: 'is-miss', label: '別の備えだった', detail: '上限が下がった' },
};

export function titleHistoryMeta(args: {
  item: PerformanceResult;
  previousSameSeed?: PerformanceResult;
  badges: string;
}) {
  const { item, previousSameSeed, badges } = args;
  if (previousSameSeed) {
    const deltas = [
      deltaLabel('評判', item.sceneScore - previousSameSeed.sceneScore),
      deltaLabel('準備', item.insight.prepHits - previousSameSeed.insight.prepHits),
      deltaLabel('名場面', item.insight.masterpieceCount - previousSameSeed.insight.masterpieceCount),
    ].filter(Boolean).join(' / ');
    return `前回比 ${deltas}${badges ? ` / ${badges}` : ''}`;
  }
  return `準備 ${item.insight.prepHits}/6 / 名場面 ${item.insight.masterpieceCount}${badges ? ` / ${badges}` : ''} / ${appCopy.title.historyReplaySuffix}`;
}

export function deltaLabel(label: string, value: number) {
  if (value === 0) return '';
  return `${label}${value > 0 ? '+' : ''}${value}`;
}

export function resultScoreNote(kind: 'scene' | 'flow' | 'trust', value: number) {
  if (kind === 'scene') {
    if (value >= 18) return '見せ場豊作';
    if (value >= 10) return '評判が残った';
    if (value >= 4) return '手応えあり';
    return '伸びしろ';
  }
  if (kind === 'flow') {
    if (value >= 8) return '呼吸安定';
    if (value >= 3) return '大崩れなし';
    if (value >= 0) return '維持';
    return '乱れ多め';
  }
  if (value >= 8) return '息が合った';
  if (value >= 3) return '一体感あり';
  if (value >= 0) return '維持';
  return '削れ気味';
}

export function resultLoadNote(value: number) {
  if (value >= 4) return '負荷注意';
  if (value >= 2) return '余熱あり';
  return '軽い';
}

export function nextChallengeCopy(result: PerformanceResult, swingTurn: PerformanceResult['logs'][number] | null) {
  if (swingTurn && result.insight.pointsToNextRank !== null && result.insight.pointsToNextRank <= 10) {
    return `${swingTurn.act}日目${PERFORMANCE_SLOT_LABELS[swingTurn.turnInAct === 1 ? 'matinee' : 'soiree'].label}を場面化`;
  }
  if (result.insight.pointsToNextRank !== null && result.insight.pointsToNextRank <= 8) {
    return `同じ巡り合わせで${result.insight.nextRank}到達`;
  }
  if (result.insight.prepHits < 4) return '準備ヒット4回以上';
  if (result.insight.frayOrAccidentCount >= 2) return 'ほころび1回以下で終演';
  if (result.backstageLoad >= 3) return '最終負荷2以下';
  if (result.insight.masterpieceCount < 2) return '名場面2回以上';
  return `${RESPONSE_LABELS[result.insight.dominantResponse]}軸の最高ランク更新`;
}

export function sameSeedHintCopy(result: PerformanceResult, swingTurn: PerformanceResult['logs'][number] | null) {
  if (result.insight.pointsToNextRank === null) return '最高ランク到達。同じ巡り合わせで別の公演の色を狙える。';
  if (result.insight.pointsToNextRank <= 0) return `${result.insight.nextRank}条件は点数以外が詰めどころ。同じ巡り合わせで負荷、準備、終盤を整えたい。`;
  if (swingTurn) {
    return `${swingTurn.act}日目${PERFORMANCE_SLOT_LABELS[swingTurn.turnInAct === 1 ? 'matinee' : 'soiree'].label}の「${swingTurn.sceneTitle}」が詰めどころ。あと${displayScore(result.insight.pointsToNextRank)}点を狙う。`;
  }
  if (result.insight.bestCue) {
    return `${result.insight.bestCue.act}日目${PERFORMANCE_SLOT_LABELS[result.insight.bestCue.turnInAct === 1 ? 'matinee' : 'soiree'].label}を基準に、あと${displayScore(result.insight.pointsToNextRank)}点を詰めたい。`;
  }
  return `あと${displayScore(result.insight.pointsToNextRank)}点。準備と負荷管理を詰める。`;
}

export function bestCueMeta(cue: NonNullable<PerformanceResult['insight']['bestCue']>) {
  return `${cue.act}日目 ${PERFORMANCE_SLOT_LABELS[cue.turnInAct === 1 ? 'matinee' : 'soiree'].label} / ${RESULT_TIER_LABELS[cue.resultTier]} ${RESULT_TIER_STARS[cue.resultTier]}`;
}

export function bestCueBody(cue: NonNullable<PerformanceResult['insight']['bestCue']>) {
  return `${ACTOR_LABELS[cue.focusActorType]}の${EVENT_LABELS[cue.actorEventType]}を${RESPONSE_LABELS[cue.mainResponse]}で受けた。`;
}

export function timelineMeta(log: PerformanceResult['logs'][number]) {
  return `${log.act}日目 ${PERFORMANCE_SLOT_LABELS[log.turnInAct === 1 ? 'matinee' : 'soiree'].label}`;
}

export function timelineBody(log: PerformanceResult['logs'][number]) {
  return `${ACTOR_LABELS[log.focusActorType]}の${EVENT_LABELS[log.actorEventType]} / ${RESPONSE_LABELS[log.mainResponse]} / ${RESULT_TIER_LABELS[log.resultTier]}`;
}

export function prepToneLabel(tone: 'strong' | 'good' | 'thin' | 'danger') {
  if (tone === 'strong') return '広く備える';
  if (tone === 'good') return '一部に備える';
  if (tone === 'thin') return '別筋に備える';
  return '備え外';
}

export function prepPerformanceMemo(state: Pick<GameState, 'act' | 'turnInAct'>) {
  const slot = state.turnInAct === 1 ? 'matinee' : 'soiree';
  const label = PERFORMANCE_SLOT_LABELS[slot].label;
  if (state.turnInAct === 1) {
    return `${state.act}日目${label}。昼の回は、夜へ向けて公演の土台を作りやすい。無理に伸ばし切るより、次に残る呼吸を整えたい。`;
  }
  return `${state.act}日目${label}。夜の回は、その日の印象が客席と座組に残りやすい。攻めるなら評判へ、守るなら段取りへ、判断の色が出る。`;
}

export function prepActorMemo(actor: Actor) {
  return `${actor.name}。${ACTOR_TRAITS[actor.type]} 今は${STATE_LABELS[actor.state]}で、${STATE_HINTS[actor.state]}。`;
}

export function actorBreathLabel(trust: number) {
  if (trust >= 5) return '以心伝心';
  if (trust >= 4) return '深い呼吸';
  if (trust >= 3) return '阿吽の呼吸';
  if (trust >= 2) return '少し通じている';
  if (trust >= 1) return '合わせ始め';
  return '探り合い';
}

export function actorBreathMemo(actor: Actor) {
  const label = actorBreathLabel(actor.trust);
  if (actor.trust >= 5) return `${label}。こちらの意図がかなり届いていて、得意な対応なら場面の芯を作りやすい。`;
  if (actor.trust >= 3) return `${label}。得意な対応で受けると、役者がこちらの読みを汲みやすい。`;
  if (actor.trust >= 1) return `${label}。まだ強い補正はないが、噛み合う対応を重ねれば呼吸は育つ。`;
  return `${label}。まずはこの回で、役者が動きやすい受け方を探したい。`;
}

export function prepKindLabel(prep: PrepAction) {
  if (prep === 'watch') return '熱を見る';
  if (prep === 'makeSpace') return '間を残す';
  if (prep === 'tightenFlow') return '進行を締める';
  return '崩れを閉じる';
}

export function prepMeaningMemo(prep: PrepAction) {
  if (prep === 'watch') return '注視は、役者の熱がこぼれた瞬間を見逃さないための準備。止めるよりも、出てきた動きを舞台上の意味に変える。';
  if (prep === 'makeSpace') return '余白は、沈黙や退場の間を急かさず残すための準備。何も起きていないように見える時間を、余韻として客席へ渡す。';
  if (prep === 'tightenFlow') return '締めは、立ち位置やテンポのズレを舞台全体の呼吸へ戻すための準備。熱を削りすぎず、進行の軸を支える。';
  return '転換は、崩れを大きくする前に小さく閉じるための準備。場面を伸ばすより、次の回へ渡す道筋を残す。';
}

export function prepExpectedMemo(prep: PrepAction) {
  if (prep === 'watch') return '役者が前へ出たら、その動きを拾って場面にする。予定外の熱を止めず、客席に届く見せ場として扱う。';
  if (prep === 'makeSpace') return '沈黙や退場の余韻が来たら、待つことで間を保つ。急いで埋めず、役者の呼吸が客席へ届く時間にする。';
  if (prep === 'tightenFlow') return '立ち位置やテンポが乱れたら、整えることで舞台全体の呼吸に戻す。目立つ熱より、崩れない進行を優先する。';
  return '転換の崩れが来たら、切ることで場面を閉じる。広がりかけた乱れを小さくして、次の回が始めやすい形にする。';
}

export function prepMissedMemo(prep: PrepAction) {
  if (prep === 'watch') return '熱ではなく進行の乱れが来た時は、整える判断で安全寄りに戻せる。注視していたぶん、崩れの入口は見つけやすい。';
  if (prep === 'makeSpace') return '間ではなく熱が来た時は、拾う判断に切り替える余地がある。残した余白を、熱が立ち上がる場所として使える。';
  if (prep === 'tightenFlow') return '進行ではなく熱や間が来た時は、無理に締めすぎない。負荷が高いなら切る、余裕があるなら拾う・待つへ寄せる。';
  return '崩れが来なければ、低負荷のまま整える・待つで場面化を狙える。閉じる準備は、外れても退路として残る。';
}

export function scoreMoodMemo(kind: 'scene' | 'flow' | 'trust', value: number) {
  if (kind === 'scene') {
    if (value <= 0) return '客席はまだ静か。ここから最初の見せ場を作る。';
    if (value < 6) return '客席に少し熱が残っている。噛み合う対応なら、場面として届きやすい。';
    return '客席の熱が育っている。攻めた判断が、そのまま評判として残りやすい。';
  }
  if (kind === 'flow') {
    if (value <= 0) return '進行はまだ手探り。乱れを残さず、舞台の足場を作りたい。';
    if (value < 4) return '段取りの支えができ始めている。少し揺れても、舞台へ戻す余地がある。';
    return '進行の軸が通っている。多少の揺れなら、舞台全体で受け止められる。';
  }
  if (value <= 0) return '座組の呼吸はこれから。噛み合う受け方を重ねて、舞台の息を合わせたい。';
  if (value < 4) return '座組に少し呼吸が残っている。待つ判断や得意筋が、場面の余韻になりやすい。';
  return '座組の呼吸が深まっている。終盤の伸びまでつながる空気がある。';
}

export function prepReadMemo(prep: PrepAction, covered: number) {
  if (covered >= 2) {
    return '見えている兆候に備えが入っている。起きた出来事を、次の対応へつなぎやすい準備。';
  }
  if (covered === 1) {
    return '見えている兆候の一部に備えている。備えが外れた時の受け方も残す準備。';
  }
  if (prep === 'prepareTransition') {
    return '今見えている兆候とは別筋だが、崩れを小さく閉じるための準備。高負荷になる前に退路を残す。';
  }
  return '今見えている兆候とは別筋。役者の出来事が違う方向へ動いた時に備える準備。';
}

export function prepShortAim(prep: PrepAction) {
  if (prep === 'watch') return '熱の揺れ';
  if (prep === 'makeSpace') return '間の揺れ';
  if (prep === 'tightenFlow') return '進行の乱れ';
  return '転換の崩れ';
}

export function prepIntent(prep: PrepAction) {
  if (prep === 'watch') return '予定外の熱を見せ場に変える';
  if (prep === 'makeSpace') return '沈黙や退場を急かさず残す';
  if (prep === 'tightenFlow') return 'ズレを舞台全体の呼吸へ戻す';
  return '崩れを小さく閉じ、次の回を楽にする';
}

export type DeltaKind = 'scene' | 'flow' | 'trust' | 'load';

export function deltaImpact(kind: DeltaKind, value: number, maxLevel = 4): { label: string; level: number; tone: 'positive' | 'neutral' | 'negative' } {
  const level = Math.min(maxLevel, Math.abs(value));
  if (kind === 'scene') {
    if (value >= 4) return { label: '見せ場級', level: 4, tone: 'positive' };
    if (value >= 3) return { label: '評判が伸びた', level: 3, tone: 'positive' };
    if (value > 0) return { label: '少し伸びた', level: value, tone: 'positive' };
    if (value === 0) return { label: '伸びは控えめ', level: 0, tone: 'neutral' };
    return { label: '沈んだ', level, tone: 'negative' };
  }
  if (kind === 'flow') {
    if (value >= 2) return { label: '段取りが戻った', level: 2, tone: 'positive' };
    if (value > 0) return { label: '整った', level: 1, tone: 'positive' };
    if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
    return { label: value <= -2 ? '大きく乱れた' : '乱れた', level, tone: 'negative' };
  }
  if (kind === 'trust') {
    if (value >= 2) return { label: '強く残った', level: 2, tone: 'positive' };
    if (value > 0) return { label: '一体感が深まった', level: 1, tone: 'positive' };
    if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
    return { label: value <= -2 ? '一体感が削れた' : '一体感が少し削れた', level, tone: 'negative' };
  }
  if (value < 0) return { label: '軽くなった', level, tone: 'positive' };
  if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
  if (value >= 3) return { label: '危険圏', level: Math.min(maxLevel, value), tone: 'negative' };
  return { label: value >= 2 ? '重い代償' : '攻めの代償', level: value, tone: 'negative' };
}

export function resultRangeShortLabel(tier: ResultTier) {
  if (tier === 'masterpiece') return '名場面狙い';
  if (tier === 'scene') return '場面化狙い';
  if (tier === 'smallSuccess') return '小さく成功';
  if (tier === 'fray') return '崩れ抑え';
  return '事故注意';
}

export function responseSendLabel(response: MainResponse) {
  return `${RESPONSE_LABELS[response]}のキューを出す`;
}

export function actorSilhouetteAlt(actorLabel: string) {
  return `${actorLabel}のシルエット`;
}

export function stripAudienceReactionPrefix(text: string) {
  return text.replace(/^客席反応: /, '');
}

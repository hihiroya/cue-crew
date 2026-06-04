import { ACTOR_LABELS, EVENT_LABELS, PERFORMANCE_SLOT_LABELS, RESPONSE_LABELS, RESULT_TIER_LABELS, RESULT_TIER_STARS } from './gameLabels';
import type { MainResponse, PerformanceResult, PrepAction, PrepPredictionQuality, ResultTier } from '../../game/types';

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
    series: '1人用舞台裏マネジメント',
    logoLabel: '本番中 x 舞台裏',
    logoFirst: '本番中',
    logoSecond: '舞台裏',
    catchphrase: '兆候を読み 予定外を名場面へ',
    start: 'はじめる',
    howTo: '遊び方',
    howToLines: [
      '全3日、マチネとソワレの全6回。マチネは次のソワレへ向けた調整、ソワレはその日の評判と公演全体への影響が大きい。',
      '1日目ソワレ後に公演の色が決まり、2日目以降の拾う・待つ・整える・切るの意味が少し変わる。',
    ],
    historyKicker: '履歴',
    historyTitle: '最近の公演',
    emptyHistory: 'まだ記録はない。初日のマチネを開けよう。',
    historyStats: (item: PerformanceResult) => `ランク ${item.insight.rank} / 評判 ${item.sceneScore} / 段取り ${item.flowScore} / 座組信頼 ${item.trustScore}`,
    historyReplaySuffix: '同じ巡り合わせでやり直す',
    dailyKicker: '日替わり挑戦',
    dailyStart: '今日の巡り合わせへ',
    dailyFresh: '本日未記録',
    dailyBest: (rank: string, score: number) => `本日ベスト ${rank} / ${score}点`,
    collectionKicker: '図鑑',
    collectionTitle: '場面図鑑と称号',
    collectionScenes: '場面',
    collectionAchievements: '称号',
    collectionEmpty: 'まだ称号はない。終演まで通すと記録が増える。',
    collectionOpen: '図鑑を見る',
    collectionClose: '図鑑を閉じる',
    collectionRecentScenes: '最近開いた場面',
    collectionNoScenes: 'まだ場面は記録されていない。',
    collectionAchievementList: '称号一覧',
    collectionUnlocked: '解放済み',
    collectionLocked: '未解放',
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
    totalScore: (score: number) => `総合評価点 ${score}`,
    maxRank: '最高ランク到達',
    pointsToNext: (points: number, rank: string | null) => `あと${points}点で ${rank ?? ''}`,
    scoreNote: '再演メモ',
    challenge: '再演チャレンジ',
    buildStyle: '今回のビルド',
    buildLevel: (level: number) => `Lv.${level}`,
    discovery: '発見',
    discoveryScore: (score: number) => `発見点 ${score}`,
    collectionScenes: (count: number) => `場面 ${count}`,
    achievements: '称号',
    noAchievements: '新規称号なし',
    previousSeed: '前回比',
    poster: '終演ポスター',
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
      trust: '座組信頼',
      load: '裏方負荷',
    },
    record: '進行記録',
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
    coverage: (covered: number, total: number) => `兆候 ${covered}/${Math.max(1, total)}`,
    memo: '本番前メモ',
    prepTitle: (label: string) => `${label}の準備`,
    visibleOmens: '見えている兆候',
    covered: '準備済み',
    missed: '備え外',
    extraEvents: '同じ準備で拾える出来事',
    intent: '今回の狙い',
    danger: '見えている兆候とは少し外れる',
    onExpected: '備えどおりに来たら',
    onMissed: '外れたら',
    receiveWith: (responseLabel: string, aim: string) => `${responseLabel}で受ける。${aim}。`,
    approvalLabel: '承認欄',
    approved: '承認済',
    pending: '未承認',
    commit: 'この準備で本番へ',
    marker: 'メモに反映',
  },
  resultPreview: {
    emptyKicker: '場面の見通し',
    emptyTitle: '対応を選ぶと、見通しが立つ',
    emptyBody: '結果は確定前に確認できる。拾うか、整えるか、待つか、切るか。',
    ticket: 'キュー結果票',
    finale: '千秋楽',
    ratingLabel: '仕上がり',
    ratingAria: (tierLabel: string) => `仕上がり ${tierLabel}`,
    frayRecovery: 'ほころび回収',
    frayRecoveryBody: '失敗の余白が場面の材料になった',
    lesson: '次の判断メモ',
    key: '決め手',
    cost: '代償',
    handoff: '申し送り',
    finalHandoff: '公演報告へ',
    audience: '客席',
    reasons: '主な理由',
    styleNew: 'この公演の色が決まった',
    style: '公演の色',
    deltaAria: '結果差分',
    deltaTitle: '結果差分',
    deltaLabels: {
      flow: '流れ',
      trust: '信頼',
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
  if (value >= 8) return '座組が強い';
  if (value >= 3) return '信頼あり';
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
  return `${RESPONSE_LABELS[result.insight.dominantResponse]}型の最高ランク更新`;
}

export function sameSeedHintCopy(result: PerformanceResult, swingTurn: PerformanceResult['logs'][number] | null) {
  if (result.insight.pointsToNextRank === null) return '最高ランク到達。同じ巡り合わせで別の型を狙える。';
  if (swingTurn) {
    return `${swingTurn.act}日目${PERFORMANCE_SLOT_LABELS[swingTurn.turnInAct === 1 ? 'matinee' : 'soiree'].label}の「${swingTurn.sceneTitle}」が詰めどころ。あと${result.insight.pointsToNextRank}点を狙う。`;
  }
  if (result.insight.bestCue) {
    return `${result.insight.bestCue.act}日目${PERFORMANCE_SLOT_LABELS[result.insight.bestCue.turnInAct === 1 ? 'matinee' : 'soiree'].label}を基準に、あと${result.insight.pointsToNextRank}点を詰めたい。`;
  }
  return `あと${result.insight.pointsToNextRank}点。準備と負荷管理を詰める。`;
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
  if (tone === 'strong') return '見えている兆候に合う';
  if (tone === 'good') return '一部に備えあり';
  if (tone === 'thin') return '別筋に備える';
  return '今の兆候とは遠い';
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
  if (prep === 'watch') return '熱を拾う';
  if (prep === 'makeSpace') return '間を残す';
  if (prep === 'tightenFlow') return '乱れを戻す';
  return '次へ渡す';
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
    if (value >= 2) return { label: '呼吸が戻った', level: 2, tone: 'positive' };
    if (value > 0) return { label: '整った', level: 1, tone: 'positive' };
    if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
    return { label: value <= -2 ? '大きく乱れた' : '乱れた', level, tone: 'negative' };
  }
  if (kind === 'trust') {
    if (value >= 2) return { label: '強く残った', level: 2, tone: 'positive' };
    if (value > 0) return { label: '深まった', level: 1, tone: 'positive' };
    if (value === 0) return { label: '維持', level: 0, tone: 'neutral' };
    return { label: value <= -2 ? '削れた' : '少し削れた', level, tone: 'negative' };
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

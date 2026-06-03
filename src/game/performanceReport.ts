import { PERFORMANCE_SLOT_LABELS, PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS } from './constants';
import { determinePerformanceStyle } from './scoring';
import type { AudienceSurvey, MainResponse, MediaReview, PerformanceInsight, ResultTier, TurnLog } from './types';

export function createPerformanceReview(logs: TurnLog[], sceneScore: number, flowScore: number, trustScore: number, backstageLoad = 0): { title: string; review: string; reviewNotes: string[] } {
  const catchCount = logs.filter((log) => log.mainResponse === 'catch').length;
  const waitCount = logs.filter((log) => log.mainResponse === 'wait').length;
  const arrangeCount = logs.filter((log) => log.mainResponse === 'arrange').length;
  const cutCount = logs.filter((log) => log.mainResponse === 'cut').length;
  const masterpieceCount = logs.filter((log) => log.resultTier === 'masterpiece').length;
  const prepHitCount = logs.filter((log) => log.prepMatched).length;
  const frayCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  const style = logs.find((log) => log.performanceStyle)?.performanceStyle ?? determinePerformanceStyle(logs);
  const styleLabel = PERFORMANCE_STYLE_DETAILS[style].label;
  let title = '三日間を支えきった公演';
  if (masterpieceCount >= 2 && catchCount >= 2) title = '予定外を評判に変えた公演';
  else if (waitCount >= 2 && trustScore >= 4) title = '余韻が残る千秋楽';
  else if (catchCount >= 3) title = '熱量で押し切った公演';
  else if (arrangeCount >= 3 && flowScore >= sceneScore) title = '段取りが支えた公演';
  else if (flowScore < 0 || trustScore < 0) title = '荒れたが忘れがたい三日間';

  const dominantResponse = [
    { response: '拾う', count: catchCount },
    { response: '整える', count: arrangeCount },
    { response: '待つ', count: waitCount },
    { response: '切る', count: cutCount },
  ].sort((a, b) => b.count - a.count)[0];
  const lateRecovery = logs.find((log) => log.act >= 3 && log.mainResponse === 'arrange' && ['masterpiece', 'scene'].includes(log.resultTier));
  const earlyFray = logs.find((log) => log.act <= 3 && (log.resultTier === 'fray' || log.resultTier === 'accident'));
  const hitRate = logs.length > 0 ? Math.round((prepHitCount / logs.length) * 100) : 0;
  const reviewNotes = [
    `全日程を終えて、公演の色は「${styleLabel}」になった。`,
    `準備は${prepHitCount}/${logs.length}回噛み合い、噛み合い率は${hitRate}%だった。`,
    `${dominantResponse.response}判断が多く、${dominantResponse.response === '拾う' ? '予定外を熱に変えて評判が伸びた。' : dominantResponse.response === '待つ' ? '余韻を残す判断が信頼を支えた。' : dominantResponse.response === '整える' ? '乱れを舞台の呼吸へ戻す判断が流れを守った。' : '崩れを閉じて進行を守る判断が目立った。'}`,
    earlyFray
      ? `${earlyFray.act}日目${PERFORMANCE_SLOT_LABELS[earlyFray.turnInAct === 1 ? 'matinee' : 'soiree'].label}でほころびが出たため、以降は負荷管理が課題になった。`
      : `初日から2日目まで大きなほころびを抑え、判断の余裕を残せた。`,
    lateRecovery
      ? `${lateRecovery.act}日目${PERFORMANCE_SLOT_LABELS[lateRecovery.turnInAct === 1 ? 'matinee' : 'soiree'].label}で整えた判断により、千秋楽の流れは持ち直した。`
      : backstageLoad >= 3
        ? '次回は2日目マチネか3日目マチネで一度待つか整えると、ソワレへ負荷を残しにくい。'
        : '次回は高負荷を恐れすぎず、噛み合った準備から強い本対応を狙うと名場面を増やせる。',
  ];
  if (frayCount >= 3) reviewNotes.push('ほころびが多かったため、同じ対応の連続使用と負荷4以上の局面に注意したい。');
  const review = reviewNotes.join('');
  return { title, review, reviewNotes };
}

function clampPercent(value: number) {
  return Math.max(18, Math.min(98, Math.round(value)));
}

const PERFORMANCE_RANKS: Array<{ rank: PerformanceInsight['rank']; threshold: number }> = [
  { rank: 'S+', threshold: 52 },
  { rank: 'S', threshold: 44 },
  { rank: 'A', threshold: 34 },
  { rank: 'B', threshold: 24 },
  { rank: 'C', threshold: 14 },
  { rank: 'D', threshold: Number.NEGATIVE_INFINITY },
];

export function createPerformanceInsight(logs: TurnLog[], sceneScore = 0, flowScore = 0, trustScore = 0, backstageLoad = 0): PerformanceInsight {
  const totalScore = sceneScore * 2 + flowScore + trustScore - backstageLoad * 2 - (backstageLoad >= 4 ? 3 : 0);
  const rankIndex = PERFORMANCE_RANKS.findIndex((item) => totalScore >= item.threshold);
  const rank = PERFORMANCE_RANKS[rankIndex]?.rank ?? 'D';
  const nextRankEntry = rankIndex > 0 ? PERFORMANCE_RANKS[rankIndex - 1] : null;
  const nextRank = (nextRankEntry?.rank ?? null) as PerformanceInsight['nextRank'];
  const pointsToNextRank = nextRankEntry ? Math.max(0, nextRankEntry.threshold - totalScore) : null;
  const prepHits = logs.filter((log) => log.prepMatched).length;
  const prepHitRate = logs.length > 0 ? Math.round((prepHits / logs.length) * 100) : 0;
  const masterpieceCount = logs.filter((log) => log.resultTier === 'masterpiece').length;
  const sceneOrBetterCount = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const frayOrAccidentCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  const decisionDistribution = (['catch', 'arrange', 'wait', 'cut'] as MainResponse[]).map((response) => ({
    response,
    count: logs.filter((log) => log.mainResponse === response).length,
  }));
  const dominantResponse = [...decisionDistribution].sort((a, b) => b.count - a.count)[0]?.response ?? 'catch';
  const tierRank: Record<ResultTier, number> = { masterpiece: 4, scene: 3, smallSuccess: 2, fray: 1, accident: 0 };
  const bestCue = [...logs].sort((a, b) => (
    tierRank[b.resultTier] - tierRank[a.resultTier]
    || b.deltaScene - a.deltaScene
    || b.score - a.score
  ))[0] ?? null;
  const nextNote = frayOrAccidentCount >= 3
    ? 'ほころびが多い公演だった。次回は同じ対応を続けすぎず、負荷4に入る前に整える判断を挟みたい。'
    : backstageLoad >= 3
      ? '裏方負荷が高く残った。次回は2日目マチネか3日目マチネで待つか整えると、ソワレへ負荷を残しにくい。'
      : prepHitRate < 50
        ? '準備の読みが外れやすかった。焦点役者の兆候上位と準備カードの対応範囲を合わせると安定する。'
        : sceneOrBetterCount <= 1
          ? '舞台は支えられた。次回は噛み合った準備から、評判を伸ばす対応を一度強く狙いたい。'
          : '次回は高負荷を恐れすぎず、噛み合った準備から強い本対応を狙うと名場面を増やせる。';
  const scoreNote = pointsToNextRank === null
    ? '最高ランク。次は同じseedで安定再現を狙える。'
    : masterpieceCount === 0
      ? `${nextRank}まであと${pointsToNextRank}点。名場面を1回作ると大きく伸びる。`
      : backstageLoad >= 4
        ? `${nextRank}まであと${pointsToNextRank}点。終盤の負荷を抑えると届きやすい。`
        : prepHitRate < 67
          ? `${nextRank}まであと${pointsToNextRank}点。準備の噛み合いを増やすと底上げできる。`
          : `${nextRank}まであと${pointsToNextRank}点。場面化以上をもう1回増やしたい。`;
  return {
    totalScore,
    rank,
    nextRank,
    pointsToNextRank,
    scoreNote,
    prepHits,
    prepHitRate,
    masterpieceCount,
    sceneOrBetterCount,
    frayOrAccidentCount,
    dominantResponse,
    decisionDistribution,
    bestCue,
    nextNote,
  };
}

export function createAudienceSurvey(logs: TurnLog[], sceneScore: number, flowScore: number, trustScore: number, backstageLoad = 0): AudienceSurvey {
  const catchCount = logs.filter((log) => log.mainResponse === 'catch').length;
  const waitCount = logs.filter((log) => log.mainResponse === 'wait').length;
  const arrangeCount = logs.filter((log) => log.mainResponse === 'arrange').length;
  const sceneOrBetterCount = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const frayOrAccidentCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  return {
    encoreInterest: clampPercent(54 + sceneScore * 2 + trustScore * 3 + sceneOrBetterCount * 4 - backstageLoad * 3),
    lingeringAfterglow: clampPercent(50 + trustScore * 4 + waitCount * 5 + sceneOrBetterCount * 5 - frayOrAccidentCount * 4),
    sceneHeat: clampPercent(52 + sceneScore * 3 + catchCount * 5 + sceneOrBetterCount * 4 - frayOrAccidentCount * 3),
    stability: clampPercent(60 + flowScore * 4 + arrangeCount * 5 - backstageLoad * 8 - frayOrAccidentCount * 6),
  };
}

export function createMediaReview(logs: TurnLog[], sceneScore: number, flowScore: number, trustScore: number, backstageLoad = 0): MediaReview {
  const style = logs.find((log) => log.performanceStyle)?.performanceStyle ?? determinePerformanceStyle(logs);
  const styleLabel = PERFORMANCE_STYLE_DETAILS[style].label;
  const sceneOrBetterCount = logs.filter((log) => log.resultTier === 'masterpiece' || log.resultTier === 'scene').length;
  const frayOrAccidentCount = logs.filter((log) => log.resultTier === 'fray' || log.resultTier === 'accident').length;
  const reviewScore = sceneScore + flowScore + trustScore - backstageLoad * 2 + sceneOrBetterCount * 3 - frayOrAccidentCount * 2;
  const baseStars = reviewScore >= 28 ? 5 : reviewScore >= 16 ? 4 : reviewScore >= 6 ? 3 : reviewScore >= 0 ? 2 : 1;
  const heatFloor = sceneScore >= 16 || sceneOrBetterCount >= 4 ? 4 : sceneScore >= 10 || sceneOrBetterCount >= 3 ? 3 : 1;
  const roughCap = (flowScore < 0 || backstageLoad >= 4) && sceneOrBetterCount < 4 ? 3 : 5;
  const stars = Math.min(Math.max(baseStars, heatFloor), roughCap);
  const headline = stars >= 5
    ? '予定外を客席の記憶へ変えた三日間'
    : stars >= 4
      ? '揺れを隠さず、舞台の呼吸へ変えた公演'
      : stars >= 3
        ? sceneScore >= 10 && backstageLoad >= 4
          ? '熱は届いたが、荒さも残した公演'
          : '危うさごと支えた、手触りの残る公演'
        : '荒さは残るが、本番の熱は途切れなかった';
  const quote = stars >= 4
    ? `「${styleLabel}」の色が明確で、裏方の判断が場面の輪郭を作った。`
    : sceneScore >= 10 && backstageLoad >= 4
      ? '客席の熱量は高い。一方で、負荷の重さが進行の粗さとして見える瞬間もあった。'
      : backstageLoad >= 4
        ? '負荷の重さは見えたが、崩れを次の熱へ渡そうとする姿勢が残った。'
        : '大きな名場面は限られたが、三日間を通して舞台は途切れなかった。';
  return {
    outlet: '小劇場レビュー',
    stars,
    headline,
    quote,
  };
}

import { PERFORMANCE_SLOT_LABELS, PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS } from './gameLabels';
import type { MainResponse, PerformanceInsight, PerformanceStyle, TurnLog } from '../../game/types';

export function performanceTitle(args: {
  masterpieceCount: number;
  catchCount: number;
  waitCount: number;
  arrangeCount: number;
  sceneScore: number;
  flowScore: number;
  trustScore: number;
}) {
  if (args.masterpieceCount >= 2 && args.catchCount >= 2) return '予定外を評判に変えた公演';
  if (args.waitCount >= 2 && args.trustScore >= 4) return '余韻が残る千秋楽';
  if (args.catchCount >= 3) return '熱量で押し切った公演';
  if (args.arrangeCount >= 3 && args.flowScore >= args.sceneScore) return '段取りが支えた公演';
  if (args.flowScore < 0 || args.trustScore < 0) return '荒れたが忘れがたい三日間';
  return '三日間を支えきった公演';
}

export function dominantResponseReview(response: string) {
  if (response === RESPONSE_LABELS.catch) return '予定外を熱に変えて評判が伸びた。';
  if (response === RESPONSE_LABELS.wait) return '余韻を残す判断が信頼を支えた。';
  if (response === RESPONSE_LABELS.arrange) return '乱れを舞台の呼吸へ戻す判断が流れを守った。';
  return '崩れを閉じて進行を守る判断が目立った。';
}

export function reviewNotes(args: {
  styleLabel: string;
  prepHitCount: number;
  totalLogs: number;
  hitRate: number;
  dominantResponse: string;
  earlyFray?: TurnLog;
  lateRecovery?: TurnLog;
  backstageLoad: number;
}) {
  return [
    `全日程を終えて、公演の色は「${args.styleLabel}」になった。`,
    `準備は${args.prepHitCount}/${args.totalLogs}回噛み合い、噛み合い率は${args.hitRate}%だった。`,
    `${args.dominantResponse}判断が多く、${dominantResponseReview(args.dominantResponse)}`,
    args.earlyFray
      ? `${args.earlyFray.act}日目${PERFORMANCE_SLOT_LABELS[args.earlyFray.turnInAct === 1 ? 'matinee' : 'soiree'].label}でほころびが出たため、以降は負荷管理が課題になった。`
      : '初日から2日目まで大きなほころびを抑え、判断の余裕を残せた。',
    args.lateRecovery
      ? `${args.lateRecovery.act}日目${PERFORMANCE_SLOT_LABELS[args.lateRecovery.turnInAct === 1 ? 'matinee' : 'soiree'].label}で整えた判断により、千秋楽の流れは持ち直した。`
      : args.backstageLoad >= 3
        ? '再演では2日目マチネか3日目マチネで一度待つか整えると、ソワレへ負荷を残しにくい。'
        : '再演では高負荷を恐れすぎず、噛み合った準備から強い本対応を狙うと名場面を増やせる。',
  ];
}

export const manyFraysReviewNote = 'ほころびが多かったため、同じ対応の連続使用と負荷4以上の局面に注意したい。';

export function nextNote(args: {
  frayOrAccidentCount: number;
  backstageLoad: number;
  prepHitRate: number;
  sceneOrBetterCount: number;
}) {
  if (args.frayOrAccidentCount >= 3) {
    return 'ほころびが多い公演だった。再演では同じ対応を続けすぎず、負荷4に入る前に整える判断を挟みたい。';
  }
  if (args.backstageLoad >= 3) {
    return '裏方負荷が高く残った。再演では2日目マチネか3日目マチネで待つか整えると、ソワレへ負荷を残しにくい。';
  }
  if (args.prepHitRate < 50) {
    return '準備の読みが外れやすかった。注目役者の兆候上位と準備カードの対応範囲を合わせると安定する。';
  }
  if (args.sceneOrBetterCount <= 1) {
    return '舞台は支えられた。再演では噛み合った準備から、評判を伸ばす対応を一度強く狙いたい。';
  }
  return '再演では高負荷を恐れすぎず、噛み合った準備から強い本対応を狙うと名場面を増やせる。';
}

export function scoreNote(args: {
  pointsToNextRank: number | null;
  nextRank: PerformanceInsight['nextRank'];
  masterpieceCount: number;
  backstageLoad: number;
  prepHitRate: number;
}) {
  if (args.pointsToNextRank === null) return '最高ランク。同じ巡り合わせで安定再現を狙える。';
  if (args.masterpieceCount === 0) return `${args.nextRank}まであと${args.pointsToNextRank}点。名場面を1回作ると大きく伸びる。`;
  if (args.backstageLoad >= 4) return `${args.nextRank}まであと${args.pointsToNextRank}点。終盤の負荷を抑えると届きやすい。`;
  if (args.prepHitRate < 67) return `${args.nextRank}まであと${args.pointsToNextRank}点。準備の噛み合いを増やすと底上げできる。`;
  return `${args.nextRank}まであと${args.pointsToNextRank}点。場面化以上をもう1回増やしたい。`;
}

export function mediaHeadline(args: {
  stars: number;
  sceneScore: number;
  backstageLoad: number;
}) {
  if (args.stars >= 5) return '予定外を客席の記憶へ変えた三日間';
  if (args.stars >= 4) return '揺れを隠さず、舞台の呼吸へ変えた公演';
  if (args.stars >= 3) {
    return args.sceneScore >= 10 && args.backstageLoad >= 4
      ? '熱は届いたが、荒さも残した公演'
      : '危うさごと支えた、手触りの残る公演';
  }
  return '荒さは残るが、本番の熱は途切れなかった';
}

export function mediaQuote(args: {
  stars: number;
  style: PerformanceStyle;
  sceneScore: number;
  backstageLoad: number;
}) {
  const styleLabel = PERFORMANCE_STYLE_DETAILS[args.style].label;
  if (args.stars >= 4) return `「${styleLabel}」の色が明確で、裏方の判断が場面の輪郭を作った。`;
  if (args.sceneScore >= 10 && args.backstageLoad >= 4) {
    return '客席の熱量は高い。一方で、負荷の重さが進行の粗さとして見える瞬間もあった。';
  }
  if (args.backstageLoad >= 4) {
    return '負荷の重さは見えたが、崩れを次の熱へ渡そうとする姿勢が残った。';
  }
  return '大きな名場面は限られたが、三日間を通して舞台は途切れなかった。';
}

export const mediaOutlet = '小劇場レビュー';

export function responseCountItems(counts: Record<MainResponse, number>) {
  return (Object.entries(counts) as Array<[MainResponse, number]>).map(([response, count]) => ({
    response: RESPONSE_LABELS[response],
    count,
  }));
}

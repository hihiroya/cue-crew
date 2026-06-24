import {
  ACTOR_LABELS,
  EVENT_LABELS,
  LOAD_LABELS,
  PERFORMANCE_STYLE_DETAILS,
  PREP_LABELS,
  RESPONSE_DESCRIPTIONS,
  RESPONSE_LABELS,
  RESULT_TIER_LABELS,
  STATE_LABELS,
} from './gameLabels';
import { performanceLabel, slotForTurnInAct } from '../../game/turnCalendar';
import type {
  Actor,
  GameState,
  LoadBias,
  MainResponse,
  PrepAction,
  PrepPredictionQuality,
  ResponseEffectTarget,
  ResponseInsight,
  ResultPreview,
  ResultTier,
  ScoreBreakdownItem,
} from '../../game/types';

export const ruleCopy = {
  frayMiss: 'ほころびは残りそう',
  frayRecover: 'ほころびを拾った',
  frayRelationStrong: '舞台裏のほころびを拾える',
  frayRelationMatch: '舞台裏のほころびを整えられる',
  repeatedResponse: '同じ手が読まれた',
  trustScore: '座組の呼吸が合った',
  loadScore: '裏方の負荷が響いた',
  dangerWarning: '危険: 事故の恐れ',
  accidentVisibleLow: 'ほころび',
  repeatPrefix: '連続使用:',
  actFallback: (theme: string) => `${theme}の判断。`,
} as const;

export const cueSurgeScoreCopy = {
  label: '跳ね場の一押し',
  detail: '兆候、準備、出来事、役者の手応えが重なり、名場面ラインを少し押し上げる。',
} as const;

export function actorTrustPassiveLabel(trust: number) {
  return trust >= 5 ? '以心伝心' : '阿吽の呼吸';
}

export function actorTrustScoreCopy(actor: Actor, response: MainResponse) {
  const passiveLabel = actorTrustPassiveLabel(actor.trust);
  return {
    label: '信頼が背中を押した',
    detail: `${passiveLabel}: ${ACTOR_LABELS[actor.type]}の得意対応が${RESPONSE_LABELS[response]}の下振れを支える。`,
  };
}

export function finaleScoreCopy(kind: 'closeFray' | 'waitTrust' | 'attackLowLoad') {
  if (kind === 'closeFray') {
    return {
      label: '千秋楽を締めた',
      detail: '最終公演では、重い負荷を残さない判断が客席の余韻を守る。',
    };
  }
  if (kind === 'waitTrust') {
    return {
      label: '千秋楽の間を信じた',
      detail: '積み上げた一体感が、待つ間を支える。',
    };
  }
  return {
    label: '千秋楽で攻め切った',
    detail: '低負荷で迎えた最終公演では、予定外を評判に変えやすい。',
  };
}

export function performanceStyleScoreLabel(styleLabel: string, _response: MainResponse) {
  return `${styleLabel}の色が伸びた`;
}

export function prepRelationPrimaryLabel(prep: PrepAction) {
  return `◎ ${PREP_LABELS[prep]}が乗る`;
}

export function prepRelationCopy(kind: 'watchArrange' | 'spaceCatch' | 'flowCut' | 'transitionWait' | 'transitionArrange' | 'alternate' | 'poor') {
  if (kind === 'watchArrange') return { label: '△ 安定の別筋', aim: '予定外を伸ばしすぎず、舞台の呼吸に戻す' };
  if (kind === 'spaceCatch') return { label: '△ 攻めの別筋', aim: '残した余白から熱を見せ場に変える' };
  if (kind === 'flowCut') return { label: '△ 守りの別筋', aim: '走った場面を早めに閉じ、崩れを小さくする' };
  if (kind === 'transitionWait') return { label: '△ 別筋', aim: '遅れや揺れを余韻として残す' };
  if (kind === 'transitionArrange') return { label: '△ 別筋', aim: '遅れや揺れを舞台全体の段取りに戻す' };
  if (kind === 'alternate') return { label: '△ 別筋' };
  return { label: '× 噛み合いにくい' };
}

export function alternatePrepAim(prep: PrepAction, response: MainResponse) {
  return `${PREP_LABELS[prep]}とは狙いを変えて、${RESPONSE_DESCRIPTIONS[response]}`;
}

export function prepResponseGuardCopy(quality: PrepPredictionQuality) {
  const label = '仕込みが効いた';
  if (quality === 'hit') return { label, detail: '崩れを閉じるだけでなく、次へ渡す場面の切れ味になった。' };
  if (quality === 'partial') return { label, detail: '読みの一部を使い、崩れを小さく閉じた。' };
  return { label, detail: '場面の伸びより、崩れを小さく閉じる。' };
}

export function prepResponseCopy(prep: PrepAction, response: MainResponse, quality: Extract<PrepPredictionQuality, 'hit' | 'partial'>) {
  if (quality === 'hit') {
    return {
      label: '仕込みが効いた',
      detail: `${RESPONSE_LABELS[response]}の上振れを少し広げた。`,
    };
  }
  return {
    label: '読みの余白を活かした',
    detail: '見えていた兆候には沿っているため、判断が安定する。',
  };
}

export function prepPivotPenaltyCopy(quality: Exclude<PrepPredictionQuality, 'hit'>) {
  if (quality === 'partial') {
    return {
      label: '仕込みから少し外れた',
      value: -1,
      detail: '兆候の一部は読めていたが、本番対応への切り替えに一拍使った。',
    };
  }
  return {
    label: '仕込みから外れた',
    value: -2,
    detail: '本番前の備えと違う筋で受けたため、場面化までに余白を失った。',
  };
}

export function cutContainmentCopy(kind: 'transitionHighLoad' | 'transition' | 'highLoad') {
  if (kind === 'transitionHighLoad') {
    return { label: '早めに幕を引いた', detail: '場面を伸ばすより、崩れを次へ持ち越さない判断。' };
  }
  if (kind === 'transition') {
    return { label: '早めに幕を引いた', detail: '次の場面へ渡すために崩れを小さくした。' };
  }
  return { label: '早めに幕を引いた', detail: '負荷が重い局面では、閉じる判断が事故を抑える。' };
}

export function frayRecoveryRewardCopy() {
  return {
    label: '崩れかけを名場面に変えた',
    detail: '舞台裏の揺れを、次の場面の意味として回収した。',
  };
}

export function repeatAdjustmentCopy(response: MainResponse, count: number, success: boolean) {
  if (response === 'catch') {
    if (count >= 3) {
      return {
        label: '同じ手が読まれた',
        detail: '予定外を見せ場に変えるための負荷が残った。',
        cardLabel: '連続使用: 負荷+2 / 段取り-1',
      };
    }
    return {
      label: '同じ手が読まれた',
      detail: '攻め続けるぶん負荷が残った。',
      cardLabel: '連続使用: 負荷+1',
    };
  }
  if (response === 'arrange') {
    if (count >= 3) {
      return {
        label: '同じ手が読まれた',
        detail: '舞台は安定したが、同じ調整では場面の伸びが鈍った。',
        cardLabel: '連続使用: 負荷+1 / 評判-1',
      };
    }
    return {
      label: success ? '同じ手が読まれた' : undefined,
      detail: success ? '舞台は安定したが、同じ調整では負荷が抜けきらなかった。' : undefined,
      cardLabel: '連続使用: 負荷回復なし',
    };
  }
  if (response === 'wait') {
    if (count >= 3) {
      return {
        label: '同じ手が読まれた',
        detail: '余韻は残ったが、次の場面への処理が滞った。',
        cardLabel: '連続使用: 負荷+1 / 段取り-1',
      };
    }
    return {
      label: success ? '同じ手が読まれた' : undefined,
      detail: success ? '余韻は残ったが、同じ待ちでは負荷が抜けきらなかった。' : undefined,
      cardLabel: '連続使用: 負荷回復なし',
    };
  }
  if (count >= 3) {
    return {
      label: '同じ手が読まれた',
        detail: '進行は守ったが、役者の気持ちは少し置き去りになった。',
        cardLabel: '連続使用: 評判-1 / 段取り-1 / 一体感-1 / 負荷+1',
    };
  }
  return {
    label: '同じ手が読まれた',
    detail: '進行は守ったが、役者の気持ちは少し置き去りになった。',
    cardLabel: '連続使用: 一体感-1',
  };
}

export function diffuseRhythmPenaltyCopy() {
  return {
    label: '狙いが散った',
    value: -3,
    detail: '四つのキューを順番に散らすだけでは、公演全体の狙いが薄くなる。',
  };
}

export function actorResponseLabel(actor: Actor, response: MainResponse, value: number) {
  if (actor.type === 'junior' && response === 'wait' && actor.state === 'elated') return '高揚した若手に待つは噛み合いにくい';
  if (value > 0) return '役者に合った受け方';
  return `${ACTOR_LABELS[actor.type]}との相性は通常`;
}

export function stateResponseLabel(actor: Actor, response: MainResponse, value: number) {
  if (value > 0) return '今の状態を読んだ対応';
  if (value < 0) return `${STATE_LABELS[actor.state]}に${RESPONSE_LABELS[response]}は負担が大きい`;
  return `${STATE_LABELS[actor.state]}との相性は通常`;
}

export function actLabel(state: GameState, response: MainResponse, value: number) {
  const label = performanceLabel(state.act, slotForTurnInAct(state.turnInAct));
  if (value > 0) return '今日の流れに乗った';
  return `${label}との相性は通常`;
}

export function prepScoreCopy(quality: PrepPredictionQuality) {
  if (quality === 'hit') return { id: 'prep-hit', label: '仕込みが効いた', value: 1, detail: '上振れ幅が広がり、副作用を抑えやすくなる。' };
  if (quality === 'partial') return { id: 'prep-partial', label: '読みの余白を活かした', value: 0, detail: '見えている兆候には備えていたため、崩れにくい。' };
  return { id: 'prep-miss', label: '別の備えだった', value: -1, detail: '上限が下がり、攻めるほど負荷が残りやすい。' };
}

export function arrangeCapCopy() {
  return {
    label: '整える判断の上限',
    detail: '安定して場面化へ戻す手。名場面化には技巧派、不安/疲労、ほころび回収などの強い理由がいる。',
  };
}

export function eventScoreCopy(eventType: ResultPreview['actorEventType'], response: MainResponse, eventValue: number) {
  return {
    label: '兆候どおりの一手',
    detail: eventValue >= 3
      ? '出来事に強く噛み合う対応。'
      : eventValue > 0
        ? '出来事を受け止められる対応。'
        : eventValue < 0
          ? '出来事と逆方向の対応。'
          : '決定打にはなりにくい対応。',
  };
}

export function capScoreCopy(kind: 'arrange' | 'prep', prepQuality: PrepPredictionQuality, previousCutActive: boolean) {
  if (kind === 'arrange') return arrangeCapCopy();
  return {
    label: '準備の上限',
    detail: prepQuality === 'partial'
      ? '一部だけ活きたため場面化までに留まる。'
      : previousCutActive
        ? '前の場面を閉じていたため、別の備えでも場面化までは届く。'
        : '別の備えだったため小さな成功までに留まる。',
  };
}

export function rangeCopy(lowTier: ResultTier, highTier: ResultTier, dangerWarning?: string) {
  const visibleLow = lowTier === 'accident' ? ruleCopy.accidentVisibleLow : RESULT_TIER_LABELS[lowTier];
  return {
    label: `${visibleLow}〜${RESULT_TIER_LABELS[highTier]}`,
    dangerWarning: lowTier === 'accident' ? (dangerWarning ?? ruleCopy.dangerWarning) : undefined,
  };
}

export function upsideLabel(response: MainResponse, highTier: ResultTier) {
  if (highTier === 'masterpiece') return `${RESPONSE_LABELS[response]}が噛み合えば名場面まで狙える`;
  if (highTier === 'scene') return `${RESPONSE_LABELS[response]}が噛み合えば場面化まで届く`;
  if (highTier === 'smallSuccess') return `${RESPONSE_LABELS[response]}で小さな成功まで守れる`;
  return '崩れを小さく留める手';
}

export function downsideLabel(response: MainResponse, lowTier: ResultTier, deltaLoad: number) {
  if (lowTier === 'accident') return '下振れると事故の恐れ';
  if (response === 'catch' && deltaLoad > 0) return '下振れると負荷が残る';
  if (response === 'cut') return '場面は閉じるが一体感を削りやすい';
  if (lowTier === 'fray') return '下振れるとほころびが残る';
  return '下振れても大崩れはしにくい';
}

export function effectLabel(target: ResponseEffectTarget, value: number) {
  const label = {
    scene: '評判',
    flow: '段取り',
    trust: '一体感',
    load: '負荷',
  }[target];
  if (value > 0) return `${label}+${value}`;
  if (value < 0) return `${label}${value}`;
  return `${label}±0`;
}

export function repeatEffectLabel(label: string) {
  return `${ruleCopy.repeatPrefix} ${label}`;
}

export function sideEffectTargetFromLabel(part: string): ResponseEffectTarget {
  if (part.startsWith('評判') || part.startsWith('場面')) return 'scene';
  if (part.startsWith('流れ') || part.startsWith('段取り')) return 'flow';
  if (part.startsWith('信頼') || part.startsWith('一体感')) return 'trust';
  return 'load';
}

export function stripRepeatPrefix(label: string) {
  return label.replace(/^連続使用:\s*/, '');
}

export function cueKeyPoint(preview: Pick<ResultPreview, 'actorEventType' | 'mainResponse' | 'prepQuality' | 'resultTier' | 'scoreBreakdown'>) {
  const eventLabel = EVENT_LABELS[preview.actorEventType];
  const responseLabel = RESPONSE_LABELS[preview.mainResponse];
  if (preview.prepQuality === 'hit' && ['masterpiece', 'scene'].includes(preview.resultTier)) {
    return `${eventLabel}に備えが届き、${responseLabel}判断が場面の芯になった。`;
  }
  const strongest = [...preview.scoreBreakdown]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)[0];
  if (strongest) return `${strongest.label}が決め手になった。`;
  if (preview.resultTier === 'accident') return `${eventLabel}への${responseLabel}が一拍遅れ、流れから外れた。`;
  return `${eventLabel}を${responseLabel}で受け、小さく次へ渡した。`;
}

export function cueCost(preview: Pick<ResultPreview, 'deltaLoad' | 'deltaFlow' | 'deltaTrust' | 'resultTier' | 'mainResponse'>) {
  if (preview.deltaLoad >= 2) return `評判は伸びたが、${RESPONSE_LABELS[preview.mainResponse]}の代償として裏方負荷が重く残った。`;
  if (preview.deltaFlow < 0) return '場面の揺れが進行へ残り、次の回で整える余地がある。';
  if (preview.deltaTrust < 0) return '進行は守ったが、公演全体の一体感は少し削れた。';
  if (preview.resultTier === 'masterpiece') return '負荷は残るが、客席まで届く見せ場として回収できた。';
  if (preview.resultTier === 'fray' || preview.resultTier === 'accident') return '舞台裏に揺れが残り、次の判断で拾う余白になった。';
  return '大きな代償は抑えつつ、次の場面へ渡せた。';
}

export function cueHandoff(state: Pick<GameState, 'pendingFrayEvent' | 'backstageLoad'>, preview: Pick<ResultPreview, 'resultMode' | 'deltaLoad' | 'mainResponse' | 'performanceStyle'>) {
  if (preview.resultMode === 'finale') return 'この手応えを公演報告書へ回す。';
  if (state.pendingFrayEvent) {
    return `${LOAD_LABELS[state.pendingFrayEvent.bias as Exclude<LoadBias, null>]}のほころびが残る。次は拾える対応を優先したい。`;
  }
  if (state.backstageLoad + preview.deltaLoad >= 4) {
    return '次の回は負荷4以上で入る。整えるか待つ判断で一度息を戻したい。';
  }
  if (preview.performanceStyle) {
    const style = PERFORMANCE_STYLE_DETAILS[preview.performanceStyle];
    return `公演の色は「${style.label}」。${RESPONSE_LABELS[style.strength]}が次の軸になりやすい。`;
  }
  if (preview.mainResponse === 'catch') return '攻めの手応えがある。ソワレでは負荷との釣り合いを見る。';
  if (preview.mainResponse === 'arrange') return '段取りは戻った。次は場面を伸ばす余地を探す。';
  if (preview.mainResponse === 'wait') return '余韻は残った。次は熱が来たら拾う判断も視野に入る。';
  return '崩れは閉じた。次は一体感を戻す判断を置きたい。';
}

export function tacticalSummaryCopy(args: {
  frayRelationTone?: ResponseInsight['frayRelationTone'];
  transitionCutActive: boolean;
  response: MainResponse;
  backstageLoad: number;
  resultTier: ResultTier;
  trustScore: number;
  act: number;
  deltaLoad: number;
  prepRelationTone: ResponseInsight['prepRelationTone'];
}) {
  if (args.frayRelationTone === 'recover') return 'ほころび回収';
  if (args.transitionCutActive) return '次へ渡す';
  if (args.response === 'cut') return args.backstageLoad >= 3 ? '崩れを閉じる' : '早めに閉じる';
  if (args.response === 'arrange') return args.resultTier === 'masterpiece' ? '乱れを意味にする' : '安定させる';
  if (args.response === 'wait') return args.trustScore >= 4 || args.act === 3 ? '余韻を伸ばす' : '一体感を残す';
  if (args.deltaLoad >= 2) return '負荷覚悟で伸ばす';
  if (args.prepRelationTone === 'primary') return '準備から攻める';
  return '見せ場を狙う';
}

export function audienceReaction(preview: Pick<ResultPreview, 'resultTier' | 'mainResponse'>) {
  if (preview.resultTier === 'masterpiece') {
    if (preview.mainResponse === 'catch') return '客席反応: 予定外の一言に、拍手が少し長く残った。';
    if (preview.mainResponse === 'wait') return '客席反応: 沈黙のあと、客席の息が揃った。';
    if (preview.mainResponse === 'arrange') return '客席反応: 乱れが意味に変わり、場面の輪郭が締まった。';
    return '客席反応: 暗転の切れ味に、次の場面を待つ空気が生まれた。';
  }
  if (preview.resultTier === 'scene') return '客席反応: 危うさごと場面として受け取られた。';
  if (preview.resultTier === 'smallSuccess') return '客席反応: 大きな拍手ではないが、舞台の呼吸は途切れなかった。';
  if (preview.resultTier === 'fray') return '客席反応: ざわめきは残ったが、生の揺れとして受け止められた。';
  return '客席反応: 一拍の乱れが見えたが、熱は消えなかった。';
}

export function cueLesson(preview: Pick<ResultPreview, 'prepQuality' | 'deltaLoad' | 'deltaFlow' | 'deltaTrust' | 'scoreBreakdown' | 'resultTier'>) {
  const byId = (id: string) => preview.scoreBreakdown.find((item: ScoreBreakdownItem) => item.id === id);
  if (byId('fray-reward')) return 'ほころびは失敗の残骸ではなく、合う対応で拾うと場面の材料になる。';
  if (byId('actor-trust')) return '阿吽の呼吸や以心伝心が出ている役者は、得意対応を選ぶと下振れを支えられる。';
  if (byId('arrange-cap')) return '安定は守りの手。名場面を狙うなら、技巧派・不安/疲労・ほころび回収などの理由がほしい。';
  if (byId('cut-containment')) return '収束の仕込みから収束すると、崩れを閉じて次の場面へ渡しやすい。';
  if (preview.deltaLoad >= 2) return '攻めた代償が重い。次の回は余韻・安定・収束で負荷を戻したい。';
  if (preview.prepQuality === 'miss') return '準備が外れると上限が下がる。注目役者の兆候と準備範囲をもう一度合わせたい。';
  if (preview.deltaFlow < 0) return '場面の揺れが段取りに残った。次は進行か負荷を整える判断を挟みたい。';
  if (preview.deltaTrust < 0) return '閉じる判断は効くが、続けると一体感が削れる。次は一体感を戻す手を置きたい。';
  if (preview.resultTier === 'masterpiece') return '準備・出来事・対応が噛み合った形。似た兆候では同じ筋を再現できる。';
  return '大崩れは防げた。次は準備が活きた局面で、評判を伸ばす手も狙える。';
}

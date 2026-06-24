import { EVENT_LABELS, PERFORMANCE_STYLE_DETAILS, RESPONSE_LABELS } from './gameLabels';
import type { Actor, ActorEventType, CueSurgeLevel, MainResponse, PerformanceStyle, PrepAction, SurgeCostLevel } from '../../game/types';

export const cueSurgeCopy = {
  prepTargetWorkAria: '準備の対象と作業',
  prepSceneLabel: '現場',
  prepWorkLabel: '作業',
  responseCautionAria: '対応の注意',
  responseSceneLabel: '現場',
  responseCautionLabel: '注意',
  prepReasonCovered: (count: number) => `兆候${count}件を受けられる`,
  prepReasonTopOmen: (event: ActorEventType) => `最上位の${EVENT_LABELS[event]}に備える`,
  prepReasonActorFit: (actor: Actor) => `${actor.name}の得意筋とつながる`,
  prepReasonStateFit: (actor: Actor) => `${actor.name}の今の状態に合う`,
  prepContextReason: (prep: PrepAction, isFinalAct: boolean, hasPendingFray: boolean) => {
    if (prep === 'watch') return '低負荷で攻める余地がある';
    if (prep === 'makeSpace') return isFinalAct ? '終盤の余韻へつながる' : '一体感を伸ばす余地がある';
    if (prep === 'tightenFlow') return '負荷を整える価値が高い';
    return hasPendingFray ? '残ったほころびを閉じられる' : '高負荷を小さく閉じられる';
  },
  prepLabel: (level: CueSurgeLevel) => {
    if (level === 'peak') return '濃厚な仕込み';
    if (level === 'surge') return 'ここに備えたい';
    if (level === 'stacked') return '兆候が集まる';
    if (level === 'hint') return '兆しあり';
    return '読み薄め';
  },
  prepDetail: (level: CueSurgeLevel, response: MainResponse) => {
    if (level === 'peak') return `${RESPONSE_LABELS[response]}へ強くつながる仕込み。`;
    if (level === 'surge') return `本番で${RESPONSE_LABELS[response]}が跳ねる土台がある。`;
    if (level === 'stacked') return '見えている兆候を複数受けられる。';
    if (level === 'hint') return '一部の兆候には備えが入る。';
    return '別筋の備えとして残す。';
  },
  responseReasonPrepHit: '準備が本番の出来事に的中',
  responseReasonPrepPartial: '見えていた兆候の一部を回収',
  responseReasonPrepStacked: '仕込み段階から兆候が集まっていた',
  responseReasonEventStrong: (event: ActorEventType, response: MainResponse) => `${EVENT_LABELS[event]}と${RESPONSE_LABELS[response]}が強く噛み合う`,
  responseReasonEventFit: '出来事への受け方が合う',
  responseRiskEventMiss: '出来事との相性が悪い',
  responseReasonActorFit: (actor: Actor) => `${actor.name}の得意筋`,
  responseReasonStateFit: (actor: Actor) => `${actor.name}の状態が後押し`,
  responseReasonTrust: '役者との呼吸が届いている',
  responseReasonStyle: (style: PerformanceStyle) => `${PERFORMANCE_STYLE_DETAILS[style].label}の色に乗る`,
  responseReasonStrongFray: '残ったほころびを強く回収できる',
  responseReasonFray: 'ほころびに触れられる',
  responseRiskPrepPivot: '準備から一拍外れる',
  responseRiskLoad: '裏方負荷が重く残る',
  responseRiskDanger: 'ほころびや事故に近い代償圧',
  responseLabel: (level: CueSurgeLevel) => {
    if (level === 'peak') return 'ここが跳ね場';
    if (level === 'surge') return '大入りの気配';
    if (level === 'stacked') return '噛み合う';
    if (level === 'hint') return '少し噛み合う';
    return '通常の見立て';
  },
  responseDetail: (level: CueSurgeLevel, response: MainResponse, costLabel: string) => {
    const action = RESPONSE_LABELS[response];
    if (level === 'peak') return `${action}で公演を大きく動かせる。ただし${costLabel}。`;
    if (level === 'surge') return `${action}が場面の芯になりうる。${costLabel}。`;
    if (level === 'stacked') return `${action}へ複数の理由が重なっている。`;
    if (level === 'hint') return `${action}に小さな手応えがある。`;
    return '通常の判断として扱う。';
  },
  costLabel: (cost: SurgeCostLevel) => {
    if (cost === 'danger') return '危険圧あり';
    if (cost === 'heavy') return '舞台裏が熱くなる';
    if (cost === 'light') return '少し背負う';
    return '代償小';
  },
} as const;

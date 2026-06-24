import type {
  ActorEventType,
  ActorState,
  ActorType,
  LoadBias,
  MainResponse,
  PerformanceSlot,
  PerformanceStyle,
  PrepAction,
  ResultTier,
} from '../../game/types';

export const ACTS = [
  { act: 1, name: '1日目', role: '土台作り。準備と一体感が公演の色を作る' },
  { act: 2, name: '2日目', role: '揺らぎ。公演の色を活かして攻めるか、負荷を整える' },
  { act: 3, name: '3日目', role: '千秋楽。残った一体感と負荷を回収して閉じる' },
] as const;

export const FALLBACK_ACT_NAME = '千秋楽';

export const OMEN_INTENSITY_LABELS = {
  high: '高',
  medium: '中',
  low: '低',
} as const;

export const PERFORMANCE_SLOT_LABELS = {
  matinee: { label: 'マチネ', role: '昼公演。見極めと調整が効きやすい' },
  soiree: { label: 'ソワレ', role: '夜公演。評判は伸びるが、負荷も残りやすい' },
} as const satisfies Record<PerformanceSlot, { label: string; role: string }>;

export function performanceLabelText(day: number, slot: PerformanceSlot) {
  return `${day}日目 ${PERFORMANCE_SLOT_LABELS[slot].label}`;
}

export const PERFORMANCE_STYLE_DETAILS = {
  heat: {
    label: '熱量',
    short: '拾う判断は評判へつながりやすいが、裏方負荷も残りやすい。',
    strength: 'catch',
    cost: '攻めたぶん負荷が残りやすい',
  },
  breath: {
    label: '余韻',
    short: '待つ判断で一体感が伸び、空振りでも大きく崩れにくい。',
    strength: 'wait',
    cost: '場面の伸びは控えめになりやすい',
  },
  control: {
    label: '段取り',
    short: '整える判断で負荷が抜けやすく、ほころびを抑えやすい。',
    strength: 'arrange',
    cost: '名場面狙いは少し控えめになる',
  },
  closure: {
    label: '収束',
    short: '切る判断で事故を小さくしやすいが、一体感は伸びにくい。',
    strength: 'cut',
    cost: '評判の伸びは控えめになりやすい',
  },
} as const satisfies Record<PerformanceStyle, { label: string; short: string; strength: MainResponse; cost: string }>;

export const ACTOR_LABELS = {
  lead: '主役',
  junior: '若手',
  skilled: '技巧派',
} as const satisfies Record<ActorType, string>;

export const STATE_LABELS = {
  elated: '高揚',
  contemplative: '沈思',
  anxious: '不安',
  immersed: '没入',
  fatigued: '疲労',
} as const satisfies Record<ActorState, string>;

export const EVENT_LABELS = {
  stepForward: '前へ出る',
  adlib: 'アドリブ',
  heatUp: '熱が乗る',
  silence: '沈黙する',
  positionShift: '立ち位置がズレる',
  tempoRush: 'テンポが走る',
  delayedExit: '退場が遅れる',
  ensembleWaver: '群像が揺れる',
} as const satisfies Record<ActorEventType, string>;

export const EVENT_DESCRIPTIONS = {
  stepForward: '予定より半歩前に出て、客席の視線をさらいかけている。',
  adlib: '台詞の隙間に、台本にはない一言が落ちた。',
  heatUp: '言葉と身体に熱が宿り、場面が大きく膨らみ始めた。',
  silence: '台詞が止まり、舞台に息を呑むような間が生まれた。',
  positionShift: '立ち位置が少しズレ、照明と視線の軸が変わった。',
  tempoRush: '呼吸より先に台詞が走り、舞台全体の拍が揺れている。',
  delayedExit: '退場の一歩が遅れ、余韻と進行の境目で揺れている。',
  ensembleWaver: '周囲の動きがわずかに乱れ、群像の輪郭が揺らいだ。',
} as const satisfies Record<ActorEventType, string>;

export const PREP_LABELS = {
  watch: '見せ場の仕込み',
  makeSpace: '余韻の仕込み',
  tightenFlow: '安定の仕込み',
  prepareTransition: '収束の仕込み',
} as const satisfies Record<PrepAction, string>;

export const PREP_DESCRIPTIONS = {
  watch: '前へ出る・アドリブ・熱に備える',
  makeSpace: '沈黙・退場の余韻・熱に備える',
  tightenFlow: '立ち位置・テンポ・群像の乱れに備える',
  prepareTransition: '走り・退場・群像・立ち位置に備える',
} as const satisfies Record<PrepAction, string>;

export const PREP_EFFECT_SUMMARIES = {
  watch: '評判・名場面',
  makeSpace: '一体感・終盤',
  tightenFlow: '段取り・負荷',
  prepareTransition: 'ほころび・事故',
} as const satisfies Record<PrepAction, string>;

export const PREP_RESPONSE_HINTS = {
  watch: {
    aim: '評判と名場面を伸ばす',
    alternate: '安定で安全寄りに処理できる',
  },
  makeSpace: {
    aim: '一体感と終盤の伸びを作る',
    alternate: '熱が来たら見せ場で伸びる',
  },
  tightenFlow: {
    aim: '段取りを戻し、負荷を抑える',
    alternate: '高負荷なら収束で守る手もある',
  },
  prepareTransition: {
    aim: 'ほころびと事故を小さく閉じる',
    alternate: '低負荷なら安定・余韻で場面化を狙える',
  },
} as const satisfies Record<PrepAction, { aim: string; alternate: string }>;

export const RESPONSE_LABELS = {
  catch: '見せ場',
  arrange: '安定',
  wait: '余韻',
  cut: '収束',
} as const satisfies Record<MainResponse, string>;

export const RESPONSE_DESCRIPTIONS = {
  catch: '評判と名場面を伸ばす。負荷も背負いやすい',
  arrange: '段取りを戻し、裏方負荷を抑える',
  wait: '一体感と余韻を残し、終盤の伸びを作る',
  cut: 'ほころびや事故を小さく閉じて次へ渡す',
} as const satisfies Record<MainResponse, string>;

export const RESPONSE_EFFECT_SUMMARIES = {
  catch: '評判↑ 名場面↑',
  arrange: '段取り↑ 負荷↓',
  wait: '一体感↑ 終盤↑',
  cut: 'ほころび↓ 事故↓',
} as const satisfies Record<MainResponse, string>;

export const RESULT_TIER_LABELS = {
  masterpiece: '名場面',
  scene: '場面化',
  smallSuccess: '小さな成功',
  fray: 'ほころび',
  accident: '事故',
} as const satisfies Record<ResultTier, string>;

export const RESULT_TIER_STARS = {
  masterpiece: '★★★★★',
  scene: '★★★★☆',
  smallSuccess: '★★★☆☆',
  fray: '★★☆☆☆',
  accident: '★☆☆☆☆',
} as const satisfies Record<ResultTier, string>;

export const ACTOR_TRAITS = {
  junior: '勢い型。前へ出る・アドリブ・熱が乗るが多い。見せ場で伸びやすい。',
  lead: '間の型。沈黙・退場の余韻が多い。余韻で伸びやすい。',
  skilled: '制御型。立ち位置・群像の乱れが多い。安定で伸びやすい。',
} as const satisfies Record<ActorType, string>;

export const ACT_RESPONSE_GUIDES = {
  1: {
    catch: '1日目。初日の熱を評判に変えるが、公演の色は攻め寄りになる。',
    arrange: '1日目。まず段取りを作り、以降の負荷を扱いやすくする。',
    wait: '1日目。座組の呼吸を見て、一体感を残しやすい。',
    cut: '1日目。崩れを小さく閉じるが、評判の伸びは控えめ。',
  },
  2: {
    catch: '2日目。公演の色を活かして攻めると評判が伸びるが、負荷も残る。',
    arrange: '2日目。揺らぎを段取りへ戻し、ソワレ後のほころびを抑える。',
    wait: '2日目。余韻を残せるが、攻めどころを逃すこともある。',
    cut: '2日目。高負荷なら崩れを早めに閉じられる。',
  },
  3: {
    catch: '3日目。低負荷なら千秋楽の評判を狙える。',
    arrange: '3日目。千秋楽前後の負荷を戻し、終演を安定させる。',
    wait: '3日目。一体感が残っているほど、余韻として強く残る。',
    cut: '3日目。高負荷の崩れを閉じ、事故化を抑える。',
  },
} as const satisfies Record<number, Partial<Record<MainResponse, string>>>;

export const LOAD_LABELS = {
  light: '光',
  sound: '音',
  stageManagement: '進行',
  props: '道具',
} as const satisfies Record<Exclude<LoadBias, null>, string>;

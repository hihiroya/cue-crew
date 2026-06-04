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
  { act: 1, name: '1日目', role: '呼吸作り。準備と座組信頼が公演の型を作る' },
  { act: 2, name: '2日目', role: '揺らぎ。型を活かして攻めるか、負荷を整える' },
  { act: 3, name: '3日目', role: '千秋楽。残った信頼と負荷を回収して閉じる' },
] as const;

export const PERFORMANCE_SLOT_LABELS: Record<PerformanceSlot, { label: string; role: string }> = {
  matinee: { label: 'マチネ', role: '昼公演。見極めと調整が効きやすい' },
  soiree: { label: 'ソワレ', role: '夜公演。評判は伸びるが、負荷も残りやすい' },
};

export const PERFORMANCE_STYLE_DETAILS: Record<PerformanceStyle, { label: string; short: string; strength: MainResponse; cost: string }> = {
  heat: {
    label: '熱量で押す公演',
    short: '拾う判断は評判へつながりやすいが、裏方負荷も残りやすい。',
    strength: 'catch',
    cost: '攻めたぶん負荷が残りやすい',
  },
  breath: {
    label: '間で残す公演',
    short: '待つ判断で座組信頼が伸び、空振りでも大きく崩れにくい。',
    strength: 'wait',
    cost: '場面の伸びは控えめになりやすい',
  },
  control: {
    label: '段取りで支える公演',
    short: '整える判断で負荷が抜けやすく、ほころびを抑えやすい。',
    strength: 'arrange',
    cost: '名場面狙いは少し控えめになる',
  },
  closure: {
    label: '崩れを閉じる公演',
    short: '切る判断で事故を小さくしやすいが、信頼は伸びにくい。',
    strength: 'cut',
    cost: '評判の伸びは控えめになりやすい',
  },
};

export const ACTOR_LABELS: Record<ActorType, string> = {
  lead: '主役',
  junior: '若手',
  skilled: '技巧派',
};

export const STATE_LABELS: Record<ActorState, string> = {
  elated: '高揚',
  contemplative: '沈思',
  anxious: '不安',
  immersed: '没入',
  fatigued: '疲労',
};

export const EVENT_LABELS: Record<ActorEventType, string> = {
  stepForward: '前へ出る',
  adlib: 'アドリブ',
  heatUp: '熱が乗る',
  silence: '沈黙する',
  positionShift: '立ち位置がズレる',
  tempoRush: 'テンポが走る',
  delayedExit: '退場が遅れる',
  ensembleWaver: '群像が揺れる',
};

export const EVENT_DESCRIPTIONS: Record<ActorEventType, string> = {
  stepForward: '予定より半歩前に出て、客席の視線をさらいかけている。',
  adlib: '台詞の隙間に、台本にはない一言が落ちた。',
  heatUp: '言葉と身体に熱が宿り、場面が大きく膨らみ始めた。',
  silence: '台詞が止まり、舞台に息を呑むような間が生まれた。',
  positionShift: '立ち位置が少しズレ、照明と視線の軸が変わった。',
  tempoRush: '呼吸より先に台詞が走り、舞台全体の拍が揺れている。',
  delayedExit: '退場の一歩が遅れ、余韻と進行の境目で揺れている。',
  ensembleWaver: '周囲の動きがわずかに乱れ、群像の輪郭が揺らいだ。',
};

export const PREP_LABELS: Record<PrepAction, string> = {
  watch: '注視',
  makeSpace: '余白',
  tightenFlow: '締め',
  prepareTransition: '転換',
};

export const PREP_DESCRIPTIONS: Record<PrepAction, string> = {
  watch: '前へ出る・アドリブ・熱に備える',
  makeSpace: '沈黙・退場の余韻・熱に備える',
  tightenFlow: '立ち位置・テンポ・群像の乱れに備える',
  prepareTransition: '走り・退場・群像・立ち位置に備える',
};

export const PREP_RESPONSE_HINTS: Record<PrepAction, { aim: string; alternate: string }> = {
  watch: {
    aim: '予定外を見せ場に変える',
    alternate: '整えるで安全寄りに処理できる',
  },
  makeSpace: {
    aim: '間や余韻を急かさず残す',
    alternate: '熱が来たら拾うと伸びる',
  },
  tightenFlow: {
    aim: '乱れを舞台の呼吸に戻す',
    alternate: '高負荷なら切って守る手もある',
  },
  prepareTransition: {
    aim: '場面を伸ばすより、崩れを小さく閉じる',
    alternate: '低負荷なら整える・待つで場面化を狙える',
  },
};

export const RESPONSE_LABELS: Record<MainResponse, string> = {
  catch: '拾う',
  arrange: '整える',
  wait: '待つ',
  cut: '切る',
};

export const RESPONSE_DESCRIPTIONS: Record<MainResponse, string> = {
  catch: '予定外の行動を見せ場に変える',
  arrange: '乱れを舞台全体の呼吸に戻す',
  wait: '間や余韻を信じて急かさない',
  cut: '場面を閉じ、転換と道具を次へ送る',
};

export const RESULT_TIER_LABELS: Record<ResultTier, string> = {
  masterpiece: '名場面',
  scene: '場面化',
  smallSuccess: '小さな成功',
  fray: 'ほころび',
  accident: '事故',
};

export const RESULT_TIER_STARS: Record<ResultTier, string> = {
  masterpiece: '★★★★★',
  scene: '★★★★☆',
  smallSuccess: '★★★☆☆',
  fray: '★★☆☆☆',
  accident: '★☆☆☆☆',
};

export const ACTOR_TRAITS: Record<ActorType, string> = {
  junior: '勢い型。前へ出る・アドリブ・熱が乗るが多い。拾うと伸びやすい。',
  lead: '間の型。沈黙・退場の余韻が多い。待つと伸びやすい。',
  skilled: '制御型。立ち位置・群像の乱れが多い。整えると伸びやすい。',
};

export const ACT_RESPONSE_GUIDES: Record<number, Partial<Record<MainResponse, string>>> = {
  1: {
    catch: '1日目。初日の熱を評判に変えるが、型は攻め寄りになる。',
    arrange: '1日目。まず段取りを作り、以降の負荷を扱いやすくする。',
    wait: '1日目。座組の呼吸を見て、信頼を残しやすい。',
    cut: '1日目。崩れを小さく閉じるが、評判の伸びは控えめ。',
  },
  2: {
    catch: '2日目。型を活かして攻めると評判が伸びるが、負荷も残る。',
    arrange: '2日目。揺らぎを段取りへ戻し、ソワレ後のほころびを抑える。',
    wait: '2日目。余韻を残せるが、攻めどころを逃すこともある。',
    cut: '2日目。高負荷なら崩れを早めに閉じられる。',
  },
  3: {
    catch: '3日目。低負荷なら千秋楽の評判を狙える。',
    arrange: '3日目。千秋楽前後の負荷を戻し、終演を安定させる。',
    wait: '3日目。信頼が残っているほど、余韻として強く残る。',
    cut: '3日目。高負荷の崩れを閉じ、事故化を抑える。',
  },
};

export const LOAD_LABELS: Record<Exclude<LoadBias, null>, string> = {
  light: '光',
  sound: '音',
  stageManagement: '進行',
  props: '道具',
};

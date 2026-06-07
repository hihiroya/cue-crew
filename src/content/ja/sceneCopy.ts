import { ACTOR_LABELS, EVENT_LABELS, PREP_LABELS, RESPONSE_LABELS, STATE_LABELS } from './gameLabels';
import type {
  ActorEventType,
  ActorState,
  ActorType,
  LoadBias,
  MainResponse,
  PrepAction,
  PrepPredictionQuality,
  PrepRecoveryTone,
  ResultTier,
} from '../../game/types';

type TemplateKey = {
  actor?: ActorType;
  event?: ActorEventType;
  response?: MainResponse;
  tier?: ResultTier;
  frayBias?: LoadBias;
};

type SceneTemplate = TemplateKey & {
  title: string;
};

const templates: SceneTemplate[] = [
  { actor: 'junior', event: 'stepForward', response: 'catch', title: '勢いが生んだ見せ場' },
  { actor: 'junior', event: 'adlib', response: 'catch', title: '拾われたアドリブ' },
  { actor: 'junior', event: 'heatUp', response: 'catch', title: '熱量が届いた瞬間' },
  { actor: 'junior', event: 'tempoRush', response: 'arrange', title: '走る拍を束ねた場面' },
  { actor: 'junior', event: 'positionShift', response: 'catch', title: 'はみ出した一歩の光' },
  { actor: 'lead', event: 'silence', response: 'wait', title: '観客が息を呑む沈黙' },
  { actor: 'lead', event: 'delayedExit', response: 'wait', title: '余韻を残す退場' },
  { actor: 'lead', event: 'heatUp', response: 'catch', title: '主役の熱が満ちた夜' },
  { actor: 'lead', event: 'stepForward', response: 'arrange', title: '中心へ戻る視線' },
  { actor: 'lead', event: 'silence', response: 'arrange', title: '静けさに置いた照明' },
  { actor: 'skilled', event: 'silence', response: 'wait', title: '言葉にならない一拍' },
  { actor: 'skilled', event: 'positionShift', response: 'arrange', title: '意味を持った立ち位置' },
  { actor: 'skilled', event: 'delayedExit', response: 'wait', title: '残された背中の余韻' },
  { actor: 'skilled', event: 'ensembleWaver', response: 'arrange', title: '揺らぎを包む群像' },
  { actor: 'skilled', event: 'adlib', response: 'wait', title: '小さな一言が沈む間' },
  { event: 'ensembleWaver', response: 'arrange', title: '揺らぎを包む群像' },
  { event: 'tempoRush', response: 'cut', title: '鮮やかな暗転' },
  { event: 'delayedExit', response: 'cut', title: '静かに閉じた場面' },
  { event: 'positionShift', response: 'arrange', title: '照明に戻した構図' },
  { event: 'tempoRush', response: 'arrange', title: '呼吸を取り戻した台詞' },
  { event: 'silence', response: 'wait', title: '客席まで届いた間' },
  { event: 'heatUp', response: 'arrange', title: '熱を形にした一手' },
  { event: 'stepForward', response: 'cut', title: '半歩で閉じた緊張' },
  { event: 'adlib', response: 'wait', title: '言葉を泳がせた一瞬' },
  { event: 'ensembleWaver', response: 'cut', title: '群像を守った転換' },
  { event: 'delayedExit', response: 'catch', title: '遅れた背中の見せ場' },
  { event: 'positionShift', response: 'catch', title: 'ズレが描いた新しい構図' },
  { event: 'heatUp', response: 'wait', title: '熱をこぼさず待った拍' },
  { event: 'silence', response: 'catch', title: '沈黙をすくった光' },
  { event: 'stepForward', response: 'arrange', title: '前のめりを舞台に戻す' },
  { frayBias: 'light', tier: 'masterpiece', title: '遅れて差した光' },
  { frayBias: 'light', tier: 'scene', title: '一拍遅れのスポット' },
  { frayBias: 'sound', tier: 'masterpiece', title: '残り続けた響き' },
  { frayBias: 'sound', tier: 'scene', title: '沈黙に寄り添う音' },
  { frayBias: 'stageManagement', tier: 'masterpiece', title: '転換が生んだ余白' },
  { frayBias: 'props', tier: 'masterpiece', title: '渡し損ねた小道具の意味' },
];

const genericByTier: Record<ResultTier, string[]> = {
  masterpiece: ['予想外が生んだ一瞬', '舞台が息を合わせた瞬間', '本番だけの見せ場'],
  scene: ['崩れかけた場面の光', '偶然が形になった場面', '裏方がつないだ一幕'],
  smallSuccess: ['小さく整った呼吸', '次へ渡した一手', '舞台を支えた間'],
  fray: ['ほどけかけた場面', '熱だけが残った一瞬', '揺れたまま進んだ拍'],
  accident: ['照明の届かない一拍', '散りかけた舞台', '閉じ損ねた余韻'],
};

export function sceneTitle(input: TemplateKey & { seedIndex: number }): string {
  const matches = (template: SceneTemplate) => {
    if (template.frayBias && template.frayBias !== input.frayBias) return false;
    if (template.actor && template.actor !== input.actor) return false;
    if (template.event && template.event !== input.event) return false;
    if (template.response && template.response !== input.response) return false;
    if (template.tier && template.tier !== input.tier) return false;
    return template.title;
  };
  const found = input.frayBias
    ? templates.find((template) => template.frayBias && matches(template)) ?? templates.find(matches)
    : templates.find(matches);
  if (found) return found.title;
  const list = genericByTier[input.tier ?? 'smallSuccess'];
  return list[input.seedIndex % list.length];
}

export function flavorText(args: {
  actor: ActorType;
  actorState: ActorState;
  event: ActorEventType;
  prep: PrepAction;
  response: MainResponse;
  tier: ResultTier;
  prepMatched: boolean;
  recoveredFray?: LoadBias;
}): string {
  const actor = ACTOR_LABELS[args.actor];
  const event = EVENT_LABELS[args.event];
  const response = RESPONSE_LABELS[args.response];
  if (args.recoveredFray) {
    return `舞台裏のほころびを見つめ直したことで、袖で起きた乱れが意味を持った。${actor}の「${event}」は、裏方の${response}によって本番だけの輪郭を得た。`;
  }
  const specific = specificFlavorText(args, { actor, event, response });
  if (specific) return specific;
  if (args.tier === 'masterpiece') {
    return `${actor}の「${event}」を、裏方が見逃さなかった。予定外の揺れが客席まで届く名場面に変わった。`;
  }
  if (args.tier === 'scene') {
    return `${actor}の${STATE_LABELS[args.actorState]}が生んだ「${event}」を、${response}ことで場面として受け止めた。少し危うさは残ったが、舞台の呼吸は途切れなかった。`;
  }
  if (args.tier === 'smallSuccess') {
    return `大きな見せ場には届かなかったが、${actor}の「${event}」を丁寧に処理した。次の場面へ渡すための静かな一手になった。`;
  }
  if (args.tier === 'fray') {
    return `${actor}の「${event}」に舞台が少し追いつかなかった。場面は揺れたが、その揺れは次に拾える余白として残っている。`;
  }
  return `${actor}の「${event}」が流れから離れ、裏方の判断も一拍遅れた。舞台は散ったが、客席には生の熱が残った。`;
}

function specificFlavorText(
  args: {
    actor: ActorType;
    event: ActorEventType;
    response: MainResponse;
    tier: ResultTier;
    prepMatched: boolean;
  },
  labels: { actor: string; event: string; response: string },
) {
  if (!['masterpiece', 'scene'].includes(args.tier)) return '';
  const { actor, event, response } = labels;
  const isMasterpiece = args.tier === 'masterpiece';
  const prepLine = args.prepMatched
    ? '本番前の備えが、その一瞬に追いついていた。'
    : '備えとは少し違う流れだったが、袖の判断が遅れなかった。';

  if (args.event === 'stepForward' && args.response === 'catch') {
    return isMasterpiece
      ? `${actor}が一歩前へ出た瞬間、袖はその熱を止めなかった。${prepLine}予定外の前進が、客席まで届く見せ場に変わった。`
      : `${actor}の一歩を、袖がそのまま受け止めた。少し荒さは残ったが、舞台には前へ進む空気が生まれた。`;
  }
  if (args.event === 'adlib' && args.response === 'catch') {
    return isMasterpiece
      ? `こぼれた一言を、袖がすぐに場面へ乗せた。${actor}の「${event}」は予定外のまま、拍手の残る芯になった。`
      : `こぼれた一言は危うかったが、${response}判断で場面から外れずに済んだ。客席には生の手触りが残った。`;
  }
  if (args.event === 'silence' && args.response === 'wait') {
    return isMasterpiece
      ? `${actor}の沈黙に、誰も先回りしなかった。待った一拍で客席の息が揃い、沈黙そのものが台詞になった。`
      : `${actor}の「${event}」を急がず待った。間は伸びきらなかったが、舞台の呼吸は途切れなかった。`;
  }
  if (args.event === 'delayedExit' && args.response === 'wait') {
    return isMasterpiece
      ? `${actor}の退場が遅れた。その遅れを急かさず待ったことで、背中に余韻が宿った。`
      : `${actor}の「${event}」に、袖は一拍の余白を残した。場面は静かに閉じ、次へ渡る間が生まれた。`;
  }
  if (args.event === 'positionShift' && args.response === 'arrange') {
    return isMasterpiece
      ? `${actor}の立ち位置が一拍ずれた。袖の調整で乱れは構図になり、場面の輪郭だけが強く残った。`
      : `${actor}の「${event}」を整え、視線の流れを戻した。危うさは残ったが、舞台は形を失わなかった。`;
  }
  if (args.event === 'ensembleWaver' && args.response === 'arrange') {
    return isMasterpiece
      ? `群像が揺れた瞬間、袖は流れを束ね直した。ばらついた呼吸が一つのうねりに変わり、場面に厚みが出た。`
      : `群像の揺れを整えたことで、崩れは場面の範囲に留まった。客席には乱れよりも流れが残った。`;
  }
  if (args.event === 'tempoRush' && args.response === 'cut') {
    return isMasterpiece
      ? `走り出した拍を、袖が鮮やかに閉じた。切った一拍が場面の温度を残し、次の沈黙まで効いた。`
      : `速くなった拍を早めに閉じた。熱は伸びきらなかったが、次の場面へ渡す余白は守れた。`;
  }
  if (args.event === 'heatUp' && args.response === 'catch') {
    return isMasterpiece
      ? `${actor}の熱が上がった瞬間、袖はそれを拾い切った。舞台上の熱量が客席へ渡り、場面が一段明るくなった。`
      : `${actor}の「${event}」を拾い、場面の熱を逃がさなかった。負荷は残るが、客席には温度が届いた。`;
  }
  if (args.response === 'arrange') {
    return `${actor}の「${event}」に生まれた乱れを、袖が意味のある形へ戻した。${prepLine}`;
  }
  if (args.response === 'wait') {
    return `${actor}の「${event}」を急がず見守った。待った一拍が、場面に余韻を残した。`;
  }
  if (args.response === 'cut') {
    return `${actor}の「${event}」を長引かせず閉じた。熱は短く残り、次の場面へ渡る線が見えた。`;
  }
  return '';
}

const recoveryTitles: Record<PrepAction, string> = {
  watch: '注視の準備が効いた',
  makeSpace: '余白が場面を支えた',
  tightenFlow: '締めた流れが乱れを包んだ',
  prepareTransition: '備えた転換が効いた',
};

const thinTitles: Record<PrepAction, string> = {
  watch: '見ていた一拍が残った',
  makeSpace: '余白を残して進めた',
  tightenFlow: '乱れを小さく留めた',
  prepareTransition: '転換の備えで守った',
};

const missedTitles: Record<PrepAction, string> = {
  watch: '見ていたが届かなかった',
  makeSpace: '余白が活ききらなかった',
  tightenFlow: '締めた流れがほどけた',
  prepareTransition: '転換が一拍遅れた',
};

export function prepRecovery(args: {
  actor: ActorType;
  event: ActorEventType;
  prep: PrepAction;
  response: MainResponse;
  tier: ResultTier;
  quality: PrepPredictionQuality;
}): {
  tone: PrepRecoveryTone;
  label: string;
  title: string;
  text: string;
} {
  const actor = ACTOR_LABELS[args.actor];
  const event = EVENT_LABELS[args.event];
  const combo = `${PREP_LABELS[args.prep]} × ${RESPONSE_LABELS[args.response]}`;
  if (args.quality === 'hit' && !['fray', 'accident'].includes(args.tier)) {
    return {
      tone: 'matched',
      label: '準備が活きた',
      title: recoveryTitles[args.prep],
      text: `${combo}。${actor}の「${event}」が、客席まで届く揺れになった。`,
    };
  }
  if (args.quality === 'partial' && args.tier !== 'accident') {
    return {
      tone: 'partial',
      label: '準備が一部活きた',
      title: thinTitles[args.prep],
      text: `${combo}。備えた出来事とは違ったが、舞台の呼吸は崩れなかった。`,
    };
  }
  if (args.tier === 'smallSuccess' || args.tier === 'scene') {
    return {
      tone: 'thin',
      label: '別の備えだった',
      title: thinTitles[args.prep],
      text: `${combo}。備えた出来事とは違う流れが来た。`,
    };
  }
  return {
    tone: 'missed',
    label: '別の備えだった',
    title: missedTitles[args.prep],
    text: `${combo}。起きた「${event}」に対して、最初の備えは十分には届かなかった。`,
  };
}

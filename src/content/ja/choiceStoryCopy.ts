import type { ActorEventType, MainResponse, PrepAction } from '../../game/types';

export type PrepChoiceStory = {
  title: string;
  body: string;
  target: string;
  work: string;
  caution: string;
};

export type ResponseChoiceStory = {
  title: string;
  body: string;
  aim: string;
  caution: string;
};

const prepFallbackStories = {
  watch: {
    title: '前明かりを残す準備',
    body: '予定外の一歩や一言が出たら、照明で追えるよう卓と袖の合図を合わせておく。',
    target: '前進 / アドリブ / 声量上がり',
    work: '照明待機 / 呼び込み保留',
    caution: '進行の乱れは別対応',
  },
  makeSpace: {
    title: '音響キューを保留する準備',
    body: '台詞が止まってもすぐ音を入れない。舞監と音響で待つ合図を決めておく。',
    target: '沈黙 / 退場遅れ / 声量上がり',
    work: '音響保留 / 袖を空ける',
    caution: 'テンポ走りは遅れやすい',
  },
  tightenFlow: {
    title: '呼び込み順を戻す準備',
    body: '立ち位置や台詞の拍がズレても、袖の待機列と音響の入りを基準へ戻せるようにする。',
    target: '立ち位置 / テンポ / 群像',
    work: '位置確認 / 出順確認',
    caution: '強く戻すと見せ場は小さい',
  },
  prepareTransition: {
    title: '暗転と回収導線を近くに置く',
    body: '退場や転換が詰まったら早めに閉じられるよう、小道具卓と暗転キューを確認する。',
    target: '退場遅れ / 転換詰まり',
    work: '暗転準備 / 小道具回収',
    caution: '場面を伸ばす手ではない',
  },
} as const satisfies Record<PrepAction, PrepChoiceStory>;

const prepEventStories = {
  watch: {
    stepForward: {
      title: '前へ出たら照明で追う',
      body: '立ち位置より前に出ても顔が落ちないよう、前明かりを残す位置を照明卓と合わせる。',
      target: '前進',
      work: '照明待機 / 袖合図',
      caution: '出順の詰まりは見にくい',
    },
    adlib: {
      title: 'アドリブを拾えるようにする',
      body: '台本にない一言が入っても音をかぶせない。呼び込みを半拍止める合図を決める。',
      target: 'アドリブ',
      work: '音響待機 / 呼び込み保留',
      caution: '長引くと次キューが詰まる',
    },
    heatUp: {
      title: '声量が上がっても追えるようにする',
      body: '声が大きくなって前へ出ても、照明と音響が先走らないよう待機位置を決める。',
      target: '声量上がり',
      work: '照明残し / 音響待機',
      caution: '負荷は増えやすい',
    },
  },
  makeSpace: {
    silence: {
      title: '沈黙で音を入れない準備',
      body: '台詞が止まっても音響を急がせない。舞監が待つ合図を出せるようにする。',
      target: '沈黙',
      work: '音響保留 / 舞監合図',
      caution: 'テンポ走りには弱い',
    },
    delayedExit: {
      title: '退場口を詰まらせない準備',
      body: '退場が遅れても次の役者が出られるよう、袖の待機位置を一人分空ける。',
      target: '退場遅れ',
      work: '袖を空ける / 呼び込み調整',
      caution: '見せ場化は控えめ',
    },
    heatUp: {
      title: '声が大きくなっても音を足さない',
      body: '場面が大きくなっても音響を重ねない。照明と袖は一拍待てるようにする。',
      target: '声量上がり',
      work: '音響保留 / 照明残し',
      caution: '拾う判断より伸びは抑えめ',
    },
  },
  tightenFlow: {
    positionShift: {
      title: '立ち位置を戻せる準備',
      body: '白テープから外れた時に照明だけが追いすぎないよう、戻す位置を袖と確認する。',
      target: '立ち位置ズレ',
      work: '位置確認 / 照明中心確認',
      caution: '戻しすぎると動きが止まる',
    },
    tempoRush: {
      title: '走ったテンポを戻す準備',
      body: '台詞の頭が早く出ても、音響の入りと次の呼び込みを基準へ戻せるようにする。',
      target: 'テンポ走り',
      work: '音響基準 / 出順確認',
      caution: '勢いは少し削れる',
    },
    ensembleWaver: {
      title: '群像の待機列を戻す準備',
      body: '周囲の並びが崩れても、袖の待機列と出る順番を一本に戻せるようにする。',
      target: '群像の乱れ',
      work: '待機列確認 / 呼び込み整理',
      caution: '派手な見せ場にはしにくい',
    },
  },
  prepareTransition: {
    tempoRush: {
      title: '走ったら暗転で閉じる準備',
      body: '台詞が先へ流れた時に広がりすぎないよう、暗転キューを近くに置く。',
      target: 'テンポ走り',
      work: '暗転準備 / 次キュー確認',
      caution: '場面は伸ばしにくい',
    },
    delayedExit: {
      title: '退場遅れを次へ渡す準備',
      body: '退場が遅れても小道具回収と次の出がぶつからないよう、通路側を空ける。',
      target: '退場遅れ',
      work: '導線確保 / 回収順確認',
      caution: '拾うより早く閉じる',
    },
    ensembleWaver: {
      title: '群像が詰まったら回収に回す',
      body: '待機列が詰まった時に、袖と小道具卓が先に逃げられる導線を作る。',
      target: '群像の乱れ',
      work: '通路確保 / 回収箱準備',
      caution: '客席側の広がりは抑える',
    },
    positionShift: {
      title: '立ち位置ズレを次場面で切る準備',
      body: '照明の芯から外れても深追いせず、暗転と小道具回収で早めに次へ渡せるようにする。',
      target: '立ち位置ズレ',
      work: '暗転準備 / 回収導線',
      caution: 'その場で直す手ではない',
    },
  },
} as const satisfies Record<PrepAction, Partial<Record<ActorEventType, PrepChoiceStory>>>;

const responseStories = {
  stepForward: {
    catch: {
      title: '前へ出た役者を照明で追う',
      body: '照明は顔を残す。音響はまだ入れず、袖の呼び込みを半拍だけ止める。',
      aim: '予定外を見せ場にする',
      caution: '次の出が遅れやすい',
    },
    arrange: {
      title: '立ち位置を戻しながら受ける',
      body: '照明は追いすぎない。舞監が相手役の入りを示し、中心へ戻す。',
      aim: '段取りを崩さない',
      caution: '見せ場は小さくなる',
    },
    wait: {
      title: '前へ出たまま一拍見る',
      body: '音響も呼び込みも動かさず、役者が自分で戻るかを一拍だけ見る。',
      aim: '余計な合図を出さない',
      caution: '戻らないと照明が外れる',
    },
    cut: {
      title: '予定キューで早めに閉じる',
      body: '前へ出た動きを広げず、暗転と次の音響で予定の位置へ戻す。',
      aim: '進行を守る',
      caution: '客席の反応は拾いにくい',
    },
  },
  adlib: {
    catch: {
      title: 'アドリブを音で潰さない',
      body: '音響は入れない。袖の呼び込みを半拍止めて、相手役の返しを見る。',
      aim: '一言を見せ場にする',
      caution: '長引くと次キューが詰まる',
    },
    arrange: {
      title: '次の台詞位置へ戻す',
      body: '舞監が相手役の入りを示す。照明は追いすぎず、進行表の位置へ戻す。',
      aim: '会話を戻す',
      caution: 'アドリブの面白さは薄まる',
    },
    wait: {
      title: '客席の反応が収まるまで止める',
      body: '音響キューを保留。笑いやざわめきが落ちるまで次の呼び込みを動かさない。',
      aim: '反応待ち',
      caution: 'テンポが遅れやすい',
    },
    cut: {
      title: '予定のキューで切る',
      body: 'アドリブを広げず、次の音響と暗転を予定通り出す。',
      aim: '進行を優先する',
      caution: '見せ場を切る危険',
    },
  },
  heatUp: {
    catch: {
      title: '声量に合わせて照明を残す',
      body: '前明かりを落とし切らない。音響は足さず、役者の声をそのまま通す。',
      aim: '大きく見せる',
      caution: '負荷が残りやすい',
    },
    arrange: {
      title: '上がった声量を基準へ戻す',
      body: '音響の入りを予定位置へ戻し、照明は明るさを追いすぎない。',
      aim: '進行を安定させる',
      caution: '勢いは抑える',
    },
    wait: {
      title: '音を足さずに様子を見る',
      body: '声が大きくなっても音響を重ねない。袖の呼び込みだけ止めて様子を見る。',
      aim: '合図を増やさない',
      caution: '場面化は弱め',
    },
    cut: {
      title: '声量が広がる前に閉じる',
      body: '予定より早く暗転を構え、次の小道具回収へ渡す。',
      aim: '負荷を抑える',
      caution: '客席の盛り上がりは切れる',
    },
  },
  silence: {
    catch: {
      title: '沈黙を客席側へ見せる',
      body: '音響は入れない。照明を残して、役者の目線が動くまで待つ。',
      aim: '止まりを見せ場にする',
      caution: '長すぎると進行が詰まる',
    },
    arrange: {
      title: '返しの台詞を入れ直す',
      body: '舞監が相手役の入りを示し、音響は次のキューを予定位置へ戻す。',
      aim: '会話を再開する',
      caution: '沈黙は短くなる',
    },
    wait: {
      title: '次の音響を入れずに待つ',
      body: '音響キューを保留。袖の呼び込みも止め、役者が返すまで動かさない。',
      aim: '間を守る',
      caution: '判断が遅いと事故に見える',
    },
    cut: {
      title: '沈黙を暗転で閉じる',
      body: '返しを待たず、照明を落として次の場面へ渡す。',
      aim: '詰まりを切る',
      caution: '役者の意図を切ることがある',
    },
  },
  positionShift: {
    catch: {
      title: 'ズレた位置を照明で拾う',
      body: '照明は中心を少し広げる。音響は入れず、動きが意味になるか見る。',
      aim: 'ズレを見せ場にする',
      caution: '小道具導線が詰まりやすい',
    },
    arrange: {
      title: '照明の中心へ戻す',
      body: '照明は追いすぎず、袖が次の出の向きを戻す。相手役の入りで位置を整える。',
      aim: '配置を戻す',
      caution: '動きの面白さは削れる',
    },
    wait: {
      title: '位置ズレをそのまま見る',
      body: '照明も音響も動かさない。役者が戻るか、相手役が合わせるかを待つ。',
      aim: '余計な修正をしない',
      caution: '照明から外れやすい',
    },
    cut: {
      title: 'ズレたまま暗転で切る',
      body: '位置を直しに行かず、暗転と小道具回収で次場面へ渡す。',
      aim: '被害を小さくする',
      caution: '場面は伸びにくい',
    },
  },
  tempoRush: {
    catch: {
      title: '走った台詞をそのまま受ける',
      body: '音響は半拍待つ。袖の呼び込みは止めず、勢いだけを残す。',
      aim: '勢いを見せる',
      caution: '次キューが前倒しになる',
    },
    arrange: {
      title: '音響の入りを基準へ戻す',
      body: '舞監が次の台詞位置を示し、音響は予定の入りを動かさない。',
      aim: 'テンポを戻す',
      caution: '勢いは少し落ちる',
    },
    wait: {
      title: '走った台詞を待ってしまう',
      body: '音響を保留し、役者が戻るのを待つ。戻らない場合は次の入りが遅れる。',
      aim: '合図を増やさない',
      caution: '走りに置いていかれやすい',
    },
    cut: {
      title: '走ったところで早めに閉じる',
      body: '暗転を近くに置き、次の呼び込みと小道具回収を優先する。',
      aim: '進行を守る',
      caution: '勢いは途中で切れる',
    },
  },
  delayedExit: {
    catch: {
      title: '退場遅れを背中で拾う',
      body: '照明は背中を残す。次の出を半拍止め、退場の遅れを場面として扱う。',
      aim: '遅れを見せ場にする',
      caution: '袖が詰まりやすい',
    },
    arrange: {
      title: '次の出を止めて退場を戻す',
      body: '袖が次の役者を止める。衣装と小道具の通路を空けて、進行を戻す。',
      aim: '出はけを整える',
      caution: '客席側の伸びは小さい',
    },
    wait: {
      title: '退場が終わるまで待つ',
      body: '音響と呼び込みを保留。退場口が空いてから次のキューを出す。',
      aim: '袖を詰まらせない',
      caution: '客席には間延びして見える',
    },
    cut: {
      title: '暗転で退場を回収する',
      body: '照明を早めに落とし、小道具回収と次の出を暗転中に逃がす。',
      aim: '転換を守る',
      caution: '退場の表情は拾えない',
    },
  },
  ensembleWaver: {
    catch: {
      title: '群像の揺れを広く照らす',
      body: '照明を少し広げる。袖は次の出を止めず、乱れが画になるか見る。',
      aim: '揺れを見せる',
      caution: '中心が決まりにくい',
    },
    arrange: {
      title: '待機列と並びを戻す',
      body: '袖の呼び込みを一本に戻し、照明は中心を追いすぎず全体を支える。',
      aim: '群像を整える',
      caution: '派手さは抑える',
    },
    wait: {
      title: '群像が戻るのを待つ',
      body: '音響も照明も動かさない。周囲が自分で並び直すかを見る。',
      aim: '合図を増やさない',
      caution: '乱れが残りやすい',
    },
    cut: {
      title: '群像が広がる前に切る',
      body: '暗転を早め、袖の待機列と小道具回収を先に逃がす。',
      aim: '事故を抑える',
      caution: '場面は小さく閉じる',
    },
  },
} as const satisfies Record<ActorEventType, Record<MainResponse, ResponseChoiceStory>>;

const responseFallbackStories = {
  catch: {
    title: '予定外を見せ場にする',
    body: '照明と袖の合図を一拍待ち、起きたことを客席側へ残す。',
    aim: '見せ場化',
    caution: '負荷は増えやすい',
  },
  arrange: {
    title: '進行表の位置へ戻す',
    body: '舞監が次の入りを示し、照明と音響を予定の基準へ戻す。',
    aim: '段取り回復',
    caution: '伸びは控えめ',
  },
  wait: {
    title: '次のキューを保留する',
    body: '音響と呼び込みを動かさず、役者か客席の反応が収まるのを待つ。',
    aim: '合図を増やさない',
    caution: '遅れに見えやすい',
  },
  cut: {
    title: '早めに閉じて次へ渡す',
    body: '暗転と回収を優先し、広がる前に次の場面へ進める。',
    aim: '事故抑制',
    caution: '評判は伸びにくい',
  },
} as const satisfies Record<MainResponse, ResponseChoiceStory>;

export function prepChoiceStory(prep: PrepAction, visibleOmens: ActorEventType[]): PrepChoiceStory {
  const storiesForPrep: Partial<Record<ActorEventType, PrepChoiceStory>> = prepEventStories[prep];
  const eventStory = visibleOmens
    .map((event) => storiesForPrep[event])
    .find((story): story is PrepChoiceStory => Boolean(story));
  return eventStory ?? prepFallbackStories[prep];
}

export function responseChoiceStory(event: ActorEventType | null | undefined, response: MainResponse): ResponseChoiceStory {
  if (!event) return responseFallbackStories[response];
  return responseStories[event][response];
}

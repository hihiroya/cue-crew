import type { LoadBiasArea, MainResponse } from '../../game/types';

export const FRAY_RESPONSE_RULES: Record<LoadBiasArea, { strong: MainResponse; match: MainResponse; label: string; strongDetail: string; matchDetail: string; missDetail: string }> = {
  light: {
    strong: 'catch',
    match: 'arrange',
    label: '照明まわり',
    strongDetail: '遅れた光を見せ場に変えられる。',
    matchDetail: '照明の軸を舞台の呼吸へ戻せる。',
    missDetail: '光の遅れが舞台の流れに残りそう。',
  },
  sound: {
    strong: 'wait',
    match: 'arrange',
    label: '音響まわり',
    strongDetail: '残った音を余韻として扱える。',
    matchDetail: '音の入りを舞台の呼吸へ戻せる。',
    missDetail: '音の乱れが次の拍を邪魔しそう。',
  },
  stageManagement: {
    strong: 'arrange',
    match: 'cut',
    label: '進行まわり',
    strongDetail: 'ずれた合図を進行へ戻せる。',
    matchDetail: '崩れを次の場面へ小さく閉じられる。',
    missDetail: '進行のずれが場面の受け渡しに残りそう。',
  },
  props: {
    strong: 'cut',
    match: 'arrange',
    label: '道具まわり',
    strongDetail: '転換で道具の遅れを回収できる。',
    matchDetail: '受け渡しを舞台全体の流れに戻せる。',
    missDetail: '道具の遅れが袖に残りそう。',
  },
};

export function frayFitLabel(areaLabel: string, status: 'strong' | 'match' | 'miss') {
  if (status === 'strong') return `${areaLabel}のほころびを拾える`;
  if (status === 'match') return `${areaLabel}のほころびを整えられる`;
  return `${areaLabel}のほころびは残りそう`;
}

export const FRAY_TITLES: Record<LoadBiasArea, string[]> = {
  light: ['照明が一歩遅れた', 'スポットの輪郭が揺れた'],
  sound: ['音が感情を先取りしすぎた', '残響が少し長く残った'],
  stageManagement: ['転換が急ぎすぎた', '進行の合図が一拍ずれた'],
  props: ['小道具の受け渡しが遅れた', '袖の準備が詰まった'],
};

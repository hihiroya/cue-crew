export type Rng = () => number;

function xmur3(input: string) {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function createRng(seed: string): Rng {
  const seedFn = xmur3(seed);
  let t = seedFn();
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T extends string>(rng: Rng, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= Math.max(0, weight);
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function makeSeed(): string {
  const now = Date.now().toString(36);
  const random = Math.floor(Math.random() * 0xffffff).toString(36);
  return `honban-${now}-${random}`;
}

import type { ActorType } from '../../game/types';

type Props = {
  type: ActorType;
};

export function ActorSilhouette({ type }: Props) {
  if (type === 'junior') {
    return (
      <svg className="silhouette silhouette-junior" viewBox="0 0 150 214" role="img" aria-label="若手のシルエット">
        <path className="aura" d="M16 188 55 74 136 44 104 96 139 199 82 160Z" />
        <path className="prop" d="M23 201c24-10 66-12 103-4" />
        <path className="ribbon" d="M82 63c23-20 45-28 64-25-12 9-23 21-35 37 14-5 26-5 37 0-22 9-41 21-56 37" />
        <path className="ribbon ribbon-tail" d="M86 72c26 5 45 17 56 36-22-11-40-13-58-6" />
        <path className="hair" d="M58 38c4-11 14-18 25-17 4-7 10-10 18-9-2 5-1 10 3 14 8 1 14 5 18 12-7 1-12 4-15 8 2 8 0 16-6 23-10-8-25-10-45-5-4-9-3-18 2-26Z" />
        <path d="M84 39c13 0 23 10 23 23 0 9-5 17-12 21l12 15 33-10-15 22-30 10-8 41-20 9-16 33H21l23-45 14-42-37 20 7-29 40-23c-6-5-10-13-10-22 0-13 12-23 26-23Z" />
        <path className="arm" d="M91 93c19 3 35 12 51 27l-14 16c-14-13-28-20-43-22Z" />
        <path className="arm" d="M62 91c-13 14-29 23-49 28l-4-20c19-5 33-13 42-25Z" />
        <path className="cloth" d="M61 116c20 8 39 7 58-2-5 21-9 38-10 55l27 25H85l-15-21-35 27 23-43Z" />
        <path className="paper-cut" d="M52 181c19-14 39-23 61-27M58 122l-31 48M104 118l30 67M76 88c9 11 13 25 12 43" />
        <path className="accent" d="M57 115c18 10 39 9 61-2M81 89c7 11 10 24 9 41M39 154l31-13" />
      </svg>
    );
  }

  if (type === 'skilled') {
    return (
      <svg className="silhouette silhouette-skilled" viewBox="0 0 150 214" role="img" aria-label="技巧派のシルエット">
        <path className="aura" d="M44 20h83l-13 187H21Z" />
        <path className="prop" d="M25 201h96M31 170v36M115 165v40" />
        <path className="hair" d="M62 31c6-12 19-17 32-13 4-7 11-9 20-5-4 5-4 11 0 17 8 3 12 9 12 17-7-2-14-1-20 3-9-7-25-8-45-3-2-6-2-11 1-16Z" />
        <path d="M84 27c14 0 25 11 25 25 0 11-7 20-16 24l12 28 25 1-5 22-22-4-2 74H45l5-77-16 43-20-8c7-28 19-51 38-69l13-12c-8-5-13-13-13-22 0-14 14-25 32-25Z" />
        <path className="book" d="M91 86h45v56H91zM101 99h25M101 112h29M101 125h20" />
        <path className="arm" d="M91 88c10-8 28-11 49-8l-3 21c-19-1-34 1-45 8Z" />
        <path className="arm" d="M63 90c-15 16-24 36-27 61l-20-6c4-30 16-53 37-70Z" />
        <path className="cloth" d="M55 108h47l-5 91H37c5-34 11-65 18-91Z" />
        <path className="paper-cut" d="M49 188h52M52 164h49M57 126l-10 66M96 120l-8 75M62 145h34" />
        <path className="accent" d="M58 111h39M54 132h44M50 156h48" />
        <path className="glasses" d="M64 55h16M87 55h16M80 55h7" />
        <path className="rim" d="M52 83c-15 18-24 43-25 74M110 29c12 16 15 35 8 57" />
      </svg>
    );
  }

  return (
      <svg className="silhouette silhouette-lead" viewBox="0 0 150 214" role="img" aria-label="主役のシルエット">
        <path className="aura" d="M70 9 128 34 108 206H17L42 45Z" />
        <path className="prop" d="M22 202c25-9 72-12 111-4" />
        <path className="hair" d="M55 34c4-13 16-22 29-22 5-6 13-8 22-4-4 4-5 9-3 14 9 3 15 10 17 19-8-3-15-2-21 2-10-8-25-9-46-2-1-3 0-5 2-7Z" />
        <path className="collar" d="M56 72 22 91l23 28 24-34ZM91 73l38 18-20 31-25-36Z" />
        <path d="M82 22c15 0 27 12 27 27 0 12-8 22-19 26l15 31 24-10-5 34-17 12 25 62H92l-7-52-11 49H31l16-60-26 36 18-76 21-28c-8-5-13-14-13-24 0-15 15-27 35-27Z" />
        <path className="arm" d="M93 85c19 7 31 23 37 48l-18 9c-6-18-15-30-28-36Z" />
        <path className="arm" d="M67 82c-15 12-24 27-28 46l21 4c3-13 8-23 18-32Z" />
        <path className="chest-hand" d="M74 92c10 6 16 14 19 24-10 2-19 0-27-7 1-8 3-13 8-17Z" />
        <path className="cloth" d="M52 105c-12 33-21 66-30 99h100c-8-40-19-73-32-100-12 8-25 9-38 1Z" />
      <path className="paper-cut" d="M46 196c25-10 53-11 81-3M45 111c20 13 40 13 60 0M36 171l28-44M100 126l20 70M43 95h24M92 96h28" />
      <path className="accent" d="M66 86c9 15 12 40 8 75M95 106c-10 10-23 15-37 15M51 72l-16 48M105 78l17 35" />
      <path className="rim" d="M72 20c-24 22-36 52-38 92-2 35-11 66-27 93M111 36c13 29 15 69 7 120" />
    </svg>
  );
}

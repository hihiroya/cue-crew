import type { ActorType } from '../../game/types';

type Props = {
  type: ActorType;
};

export function ActorSilhouette({ type }: Props) {
  if (type === 'junior') {
    return (
      <svg className="silhouette silhouette-junior" viewBox="0 0 150 190" role="img" aria-label="若手のシルエット">
        <path className="prop" d="M18 151c16-8 32-11 48-7" />
        <path className="rim" d="M72 38c-19 6-31 22-43 43-8 14-16 23-27 29 27 5 50-4 67-25" />
        <path d="M78 34c12 0 22 9 22 21 0 10-6 18-15 21l17 16c18-2 31-9 43-22-4 22-17 38-38 48l-3 50H43l14-57-36 16 13-32 31-18c-5-5-8-12-8-20 0-13 9-23 21-23Z" />
        <path className="arm" d="M86 87c18 5 33 16 49 33l-16 14c-12-14-24-23-37-27Z" />
        <path className="cloth" d="M52 114c-16 20-21 39-27 61 21-13 39-22 61-29 20 9 35 19 53 31-6-28-14-48-31-64-18 8-37 9-56 1Z" />
      </svg>
    );
  }
  if (type === 'skilled') {
    return (
      <svg className="silhouette silhouette-skilled" viewBox="0 0 150 190" role="img" aria-label="技巧派のシルエット">
        <path className="prop" d="M21 160h42" />
        <path className="book" d="M76 84h52v50H76zM86 94h32M86 106h25M86 118h30" />
        <path d="M74 30c13 0 23 10 23 23 0 10-6 19-15 22l13 26-8 66H36l9-66 16-27c-8-4-13-12-13-21 0-13 12-23 26-23Z" />
        <path className="arm" d="M84 91c10-6 27-8 47-6l-2 19c-17-1-31 1-44 9Z" />
        <path className="rim" d="M49 80c-13 15-20 34-20 58" />
      </svg>
    );
  }
  return (
    <svg className="silhouette silhouette-lead" viewBox="0 0 150 190" role="img" aria-label="主役のシルエット">
      <path className="prop" d="M23 171c18-9 62-12 101-3" />
      <path className="rim" d="M72 27c-20 16-31 40-33 72-2 28-10 53-24 76" />
      <path d="M77 23c14 0 25 11 25 25 0 11-7 21-17 24l15 29 15 70H34l16-72 15-28c-9-4-14-13-14-23 0-14 12-25 26-25Z" />
      <path className="arm" d="M88 82c20 6 33 20 40 42l-19 8c-6-16-15-27-29-32Z" />
      <path className="arm" d="M67 77c-14 9-21 22-24 38l20 3c2-10 6-18 15-26Z" />
      <path className="chest-hand" d="M75 86c10 5 16 12 18 21-9 1-17-1-24-7 1-6 3-10 6-14Z" />
      <path className="cloth" d="M49 103c-13 29-19 51-25 75h97c-8-30-16-54-29-76-13 8-28 10-43 1Z" />
    </svg>
  );
}

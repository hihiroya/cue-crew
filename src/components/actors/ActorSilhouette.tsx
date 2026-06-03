import leadImage from '../../assets/actors/lead.png';
import juniorImage from '../../assets/actors/junior.png';
import skilledImage from '../../assets/actors/skilled.png';
import type { ActorType } from '../../game/types';

type Props = {
  type: ActorType;
};

const actorImages: Record<ActorType, string> = {
  lead: leadImage,
  junior: juniorImage,
  skilled: skilledImage,
};

const actorLabels: Record<ActorType, string> = {
  lead: '主役',
  junior: '若手',
  skilled: '技巧派',
};

export function ActorSilhouette({ type }: Props) {
  return (
    <img
      className={`silhouette silhouette-${type}`}
      src={actorImages[type]}
      alt={`${actorLabels[type]}のシルエット`}
      draggable={false}
    />
  );
}

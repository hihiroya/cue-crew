import leadImage from '../../assets/actors/lead.webp';
import juniorImage from '../../assets/actors/junior.webp';
import skilledImage from '../../assets/actors/skilled.webp';
import { ACTOR_LABELS } from '../../content/ja/gameLabels';
import { actorSilhouetteAlt } from '../../content/ja/appCopy';
import type { ActorType } from '../../game/types';

type Props = {
  type: ActorType;
};

const actorImages: Record<ActorType, string> = {
  lead: leadImage,
  junior: juniorImage,
  skilled: skilledImage,
};

export function ActorSilhouette({ type }: Props) {
  return (
    <img
      className={`silhouette silhouette-${type}`}
      src={actorImages[type]}
      alt={actorSilhouetteAlt(ACTOR_LABELS[type])}
      draggable={false}
    />
  );
}

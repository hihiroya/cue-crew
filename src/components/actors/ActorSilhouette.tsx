import leadImage from '../../assets/actors/lead.webp';
import juniorImage from '../../assets/actors/junior.webp';
import skilledImage from '../../assets/actors/skilled.webp';
import { ACTOR_LABELS } from '../../content/ja/gameLabels';
import { actorSilhouetteAlt } from '../../content/ja/appCopy';
import type { ActorType } from '../../game/types';
import { classNames } from '../ui/classNames';
import styles from './ActorSilhouette.module.css';

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
      className={classNames(styles.root, actorTypeClass[type])}
      src={actorImages[type]}
      alt={actorSilhouetteAlt(ACTOR_LABELS[type])}
      draggable={false}
    />
  );
}

const actorTypeClass: Record<ActorType, string> = {
  lead: styles.lead,
  junior: styles.junior,
  skilled: styles.skilled,
};

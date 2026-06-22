import { PREP_MATCHES, PREP_PRIMARY_RESPONSE } from '../../game/constants';
import { prepCueSurgeInsight } from '../../game/cueSurge';
import type { Actor, ActorEventType, GameState, PrepAction } from '../../game/types';

export const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
export type PrepTone = 'strong' | 'good' | 'thin' | 'danger';

export function buildPrepPanelViewModel({
  inspectedPrep,
  previousPrep,
  state,
  focusActor,
  visibleOmens,
}: {
  inspectedPrep: PrepAction;
  previousPrep: PrepAction | null;
  state: GameState;
  focusActor: Actor;
  visibleOmens: ActorEventType[];
}) {
  const options = prepActions.map((prep) => {
    const coveredOmens = visibleOmens.filter((event) => PREP_MATCHES[prep].includes(event));
    const cueSurge = prepCueSurgeInsight({ state, actor: focusActor, prep, visibleOmens });
    return {
      prep,
      coveredOmens,
      primaryResponse: PREP_PRIMARY_RESPONSE[prep],
      tone: prepTone(coveredOmens.length, visibleOmens.length),
      cueSurge,
      isPrevious: previousPrep === prep,
    };
  });
  const inspected = options.find((option) => option.prep === inspectedPrep) ?? options[0];
  return {
    options,
    inspected,
    extraEvents: PREP_MATCHES[inspected.prep].filter((event) => !visibleOmens.includes(event)),
  };
}

export function prepTone(covered: number, total: number): PrepTone {
  if (covered >= 2) return 'strong';
  if (covered === 1) return 'good';
  if (total === 0) return 'thin';
  return 'danger';
}

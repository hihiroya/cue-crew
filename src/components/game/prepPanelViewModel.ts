import { PREP_MATCHES, PREP_PRIMARY_RESPONSE } from '../../game/constants';
import type { ActorEventType, PrepAction } from '../../game/types';

export const prepActions: PrepAction[] = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
export type PrepTone = 'strong' | 'good' | 'thin' | 'danger';

export function buildPrepPanelViewModel({
  inspectedPrep,
  previousPrep,
  visibleOmens,
}: {
  inspectedPrep: PrepAction;
  previousPrep: PrepAction | null;
  visibleOmens: ActorEventType[];
}) {
  const options = prepActions.map((prep) => {
    const coveredOmens = visibleOmens.filter((event) => PREP_MATCHES[prep].includes(event));
    return {
      prep,
      coveredOmens,
      primaryResponse: PREP_PRIMARY_RESPONSE[prep],
      tone: prepTone(coveredOmens.length, visibleOmens.length),
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

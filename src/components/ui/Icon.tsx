import type { ActorEventType, MainResponse, PrepAction } from '../../game/types';
import type { ReactNode } from 'react';

type IconProps = {
  name: PrepAction | MainResponse | ActorEventType | 'scene' | 'flow' | 'trust' | 'load' | 'spark' | 'history' | 'event' | 'actor' | 'state' | 'act' | 'repeat';
  className?: string;
};

export function Icon({ name, className }: IconProps) {
  const common = { className: `icon ${className ?? ''}`, viewBox: '0 0 24 24', 'aria-hidden': true };
  const stroke = 'currentColor';
  const map: Record<IconProps['name'], ReactNode> = {
    watch: (
      <svg {...common}>
        <path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6Z" fill="none" stroke={stroke} strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" fill="none" stroke={stroke} strokeWidth="1.8" />
      </svg>
    ),
    makeSpace: (
      <svg {...common}>
        <path d="M5 5v14M19 5v14M8 12h8" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <path d="m9 9-3 3 3 3M15 9l3 3-3 3" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    tightenFlow: (
      <svg {...common}>
        <path d="M4 7h10a4 4 0 0 1 0 8H8" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <path d="m8 11-4 4 4 4M16 7l3-3 3 3" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    prepareTransition: (
      <svg {...common}>
        <path d="M4 5h16M4 19h16" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <path d="M7 9h7l3 3-3 3H7l3-3-3-3Z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    catch: (
      <svg {...common}>
        <path d="M5 15c2-5 5-8 10-9 1 3 0 6-3 8l5 5" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M4 20c2-2 5-3 8-2" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    ),
    arrange: (
      <svg {...common}>
        <path d="M4 7h16M7 12h10M10 17h4" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="7" cy="7" r="1.6" fill="currentColor" />
        <circle cx="17" cy="12" r="1.6" fill="currentColor" />
        <circle cx="10" cy="17" r="1.6" fill="currentColor" />
      </svg>
    ),
    wait: (
      <svg {...common}>
        <path d="M7 4h10M7 20h10M8 4c0 5 3 6 4 8-1 2-4 3-4 8M16 4c0 5-3 6-4 8 1 2 4 3 4 8" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    cut: (
      <svg {...common}>
        <path d="M5 5l14 14M19 5 5 19" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <path d="M4 12h16" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.2" opacity=".45" />
      </svg>
    ),
    scene: (
      <svg {...common}>
        <path d="M4 19c3-7 13-7 16 0" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <path d="M7 7h10v7H7z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    flow: (
      <svg {...common}>
        <path d="M4 8c4-5 8 5 12 0 1-1 2-2 4-2M4 16c4-5 8 5 12 0 1-1 2-2 4-2" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    ),
    trust: (
      <svg {...common}>
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    load: (
      <svg {...common}>
        <path d="M7 20V9M12 20V4M17 20v-7" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
    spark: (
      <svg {...common}>
        <path d="m12 2 2.1 6.3L20 10l-5.9 1.7L12 18l-2.1-6.3L4 10l5.9-1.7L12 2Z" fill="currentColor" />
      </svg>
    ),
    history: (
      <svg {...common}>
        <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M4 4v4.6h4.6M12 8v4l3 2" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    event: (
      <svg {...common}>
        <path d="m13 2-7 12h5l-1 8 8-13h-5l0-7Z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    actor: (
      <svg {...common}>
        <circle cx="12" cy="7" r="3" fill="none" stroke={stroke} strokeWidth="1.8" />
        <path d="M5 21c1.2-4 3.5-6 7-6s5.8 2 7 6" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    ),
    state: (
      <svg {...common}>
        <path d="M4 13h3l2-5 4 10 2-5h5" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    act: (
      <svg {...common}>
        <path d="M5 4h14v16H5z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M8 8h8M8 12h5M8 16h7" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    ),
    repeat: (
      <svg {...common}>
        <path d="M17 3l3 3-3 3" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M20 13v2a3 3 0 0 1-3 3H4" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    ),
    stepForward: (
      <svg {...common}>
        <path d="M6 19c4-1 7-4 9-9" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <path d="M12 6h6v6M7 11h4M5 15h5" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    adlib: (
      <svg {...common}>
        <path d="M5 7h14v8H9l-4 4V7Z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M9 11h.01M12 11h.01M15 11h.01" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2.4" />
      </svg>
    ),
    heatUp: (
      <svg {...common}>
        <path d="M12 21c-4-2-6-5-5-8 1-3 4-4 4-9 4 3 7 7 5 12 1-1 2-3 2-5 2 3 1 7-6 10Z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    silence: (
      <svg {...common}>
        <path d="M5 12h14" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" />
        <path d="M9 8v8M15 8v8" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.8" opacity=".65" />
      </svg>
    ),
    positionShift: (
      <svg {...common}>
        <path d="M6 6h6v6H6zM12 12h6v6h-6z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
        <path d="m13 5 3 3-3 3" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    tempoRush: (
      <svg {...common}>
        <path d="M4 13h5l2-6 3 10 2-4h4" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M15 5h5v5" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    delayedExit: (
      <svg {...common}>
        <path d="M6 5h10v14H6z" fill="none" stroke={stroke} strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M16 12h4M18 10l2 2-2 2M10 9v6" fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ),
    ensembleWaver: (
      <svg {...common}>
        <circle cx="7" cy="8" r="2" fill="none" stroke={stroke} strokeWidth="1.6" />
        <circle cx="17" cy="8" r="2" fill="none" stroke={stroke} strokeWidth="1.6" />
        <circle cx="12" cy="15" r="2" fill="none" stroke={stroke} strokeWidth="1.6" />
        <path d="M5 18c2-2 4-2 6 0M13 18c2-2 4-2 6 0" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="1.6" />
      </svg>
    ),
  };
  return map[name];
}

import type { MainResponse, PrepAction } from '../../game/types';
import type { ReactNode } from 'react';

type IconProps = {
  name: PrepAction | MainResponse | 'scene' | 'flow' | 'trust' | 'load' | 'spark' | 'history';
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
  };
  return map[name];
}

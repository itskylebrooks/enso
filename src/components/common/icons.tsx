import type { ReactElement, SVGProps } from 'react';

const baseProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const SettingsIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-settings-icon', props.className].filter(Boolean).join(' ')}>
    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const StarIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-star-icon', props.className].filter(Boolean).join(' ')}>
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </svg>
);

export const SearchIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-search-icon', props.className].filter(Boolean).join(' ')}>
    <path d="m21 21-4.34-4.34" />
    <circle cx="11" cy="11" r="8" />
  </svg>
);

export const MenuIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-menu-icon', props.className].filter(Boolean).join(' ')}>
    <line x1="4" x2="20" y1="7" y2="7" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="17" y2="17" />
  </svg>
);

export const InfoIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-info-icon', props.className].filter(Boolean).join(' ')}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const BookmarkIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-bookmark-icon', props.className].filter(Boolean).join(' ')}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

export const BookmarkCheckIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-bookmark-check-icon', props.className].filter(Boolean).join(' ')}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
    <path d="m9 10 2 2 4-4" />
  </svg>
);

export const PersonStandingIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-person-standing-icon', props.className].filter(Boolean).join(' ')}>
    <circle cx="12" cy="5" r="1" />
    <path d="m9 20 3-6 3 6" />
    <path d="m6 8 6 2 6-2" />
    <path d="M12 10v4" />
  </svg>
);

export const BookOpenTextIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-book-open-text-icon', props.className].filter(Boolean).join(' ')}>
    <path d="M12 7v14" />
    <path d="M16 12h2" />
    <path d="M16 8h2" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    <path d="M6 12h2" />
    <path d="M6 8h2" />
  </svg>
);

export const CheckIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-check-icon', props.className].filter(Boolean).join(' ')}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

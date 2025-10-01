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

export const PlusIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-plus-icon', props.className].filter(Boolean).join(' ')}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const DotsVerticalIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-dots-vertical-icon', props.className].filter(Boolean).join(' ')}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export const ChevronUpIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-chevron-up-icon', props.className].filter(Boolean).join(' ')}>
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export const ChevronDownIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-chevron-down-icon', props.className].filter(Boolean).join(' ')}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const TrashIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-trash-icon lucide-trash', props.className].filter(Boolean).join(' ')}>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const EditIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg
    {...baseProps}
    width={24}
    height={24}
    {...props}
    className={['lucide lucide-text-cursor-input-icon lucide-text-cursor-input', props.className].filter(Boolean).join(' ')}
  >
    <path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" />
    <path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" />
    <path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />
    <path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" />
    <path d="M9 6v12" />
  </svg>
);

export const FolderPlusIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-folder-plus-icon lucide-folder-plus', props.className].filter(Boolean).join(' ')}>
    <path d="M12 10v6" />
    <path d="M9 13h6" />
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

export const FolderCheckIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-folder-check-icon lucide-folder-check', props.className].filter(Boolean).join(' ')}>
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    <path d="m9 13 2 2 4-4" />
  </svg>
);

export const PencilIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-pencil-icon', props.className].filter(Boolean).join(' ')}>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </svg>
);

export const ListIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-list-icon lucide-list', props.className].filter(Boolean).join(' ')}>
    <path d="M3 5h.01" />
    <path d="M3 12h.01" />
    <path d="M3 19h.01" />
    <path d="M8 5h13" />
    <path d="M8 12h13" />
    <path d="M8 19h13" />
  </svg>
);

export const ListCheckIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-list-check-icon lucide-list-check', props.className].filter(Boolean).join(' ')}>
    <path d="M16 5H3" />
    <path d="M16 12H3" />
    <path d="M11 19H3" />
    <path d="m15 18 2 2 4-4" />
  </svg>
);

export const HandshakeIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-handshake-icon lucide-handshake', props.className].filter(Boolean).join(' ')}>
    <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
    <path d="m21 3 1 11h-2"/>
    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
    <path d="M3 4h8"/>
  </svg>
);

export const SproutIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-sprout-icon lucide-sprout', props.className].filter(Boolean).join(' ')}>
    <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
    <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/>
    <path d="M5 21h14"/>
  </svg>
);

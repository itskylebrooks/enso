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

export const LinkIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-link-icon', props.className].filter(Boolean).join(' ')}>
    <path d="M10.59 13.41a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6.93" />
    <path d="M13.41 10.59a5 5 0 0 0-7.07 0L5 11.93a5 5 0 0 0 7.07 7.07L13.41 17" />
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

export const BookmarkFilledIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} fill="currentColor" stroke="none" className={['lucide lucide-bookmark-filled-icon', props.className].filter(Boolean).join(' ')}>
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

// Lucide-inspired pencil-line icon (pencil with underline)
export const PencilLineIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg
    {...baseProps}
    {...props}
    className={['lucide lucide-pencil-line-icon lucide-pencil-line', props.className].filter(Boolean).join(' ')}
  >
    <path d="M13 21h8" />
    <path d="m15 5 4 4" />
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
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

export const MessageSquarePlusIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} {...props} className={['lucide lucide-message-square-plus-icon lucide-message-square-plus', props.className].filter(Boolean).join(' ')}>
    <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>
    <path d="M12 8v6"/>
    <path d="M9 11h6"/>
  </svg>
);

export const FootprintsIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-footprints-icon lucide-footprints', props.className].filter(Boolean).join(' ')}>
    <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
    <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
    <path d="M16 17h4" />
    <path d="M4 13h4" />
  </svg>
);

export const BugIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-bug-icon lucide-bug', props.className].filter(Boolean).join(' ')}>
    <path d="M12 20v-9" />
    <path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" />
    <path d="M14.12 3.88 16 2" />
    <path d="M21 21a4 4 0 0 0-3.81-4" />
    <path d="M21 5a4 4 0 0 1-3.55 3.97" />
    <path d="M22 13h-4" />
    <path d="M3 21a4 4 0 0 1 3.81-4" />
    <path d="M3 5a4 4 0 0 0 3.55 3.97" />
    <path d="M6 13H2" />
    <path d="m8 2 1.88 1.88" />
    <path d="M9 7.13V6a3 3 0 1 1 6 0v1.13" />
  </svg>
);

export const LightbulbIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-lightbulb-icon lucide-lightbulb', props.className].filter(Boolean).join(' ')}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const RocketIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-rocket-icon lucide-rocket', props.className].filter(Boolean).join(' ')}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

export const BadgePlusIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-badge-plus-icon lucide-badge-plus', props.className].filter(Boolean).join(' ')}>
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <line x1="12" x2="12" y1="8" y2="16" />
    <line x1="8" x2="16" y1="12" y2="12" />
  </svg>
);

export const HeartPulseIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-heart-pulse-icon lucide-heart-pulse', props.className].filter(Boolean).join(' ')}>
    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
    <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
  </svg>
);

export const PaletteIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-palette-icon lucide-palette', props.className].filter(Boolean).join(' ')}>
    <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
  </svg>
);

export const SplitSquareHorizontalIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-split-square-horizontal-icon lucide-split-square-horizontal', props.className].filter(Boolean).join(' ')}>
    <path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3" />
    <path d="M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3" />
    <line x1="12" x2="12" y1="4" y2="20" />
  </svg>
);

export const MapIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-map-icon lucide-map', props.className].filter(Boolean).join(' ')}>
    <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
    <path d="M15 5.764v15" />
    <path d="M9 3.236v15" />
  </svg>
);

export const GitBranchIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-git-branch-icon lucide-git-branch', props.className].filter(Boolean).join(' ')}>
    <line x1="6" x2="6" y1="3" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

export const CloudOffIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-cloud-off-icon lucide-cloud-off', props.className].filter(Boolean).join(' ')}>
    <path d="m2 2 20 20" />
    <path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" />
    <path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" />
  </svg>
);

export const SparklesIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-sparkles-icon lucide-sparkles', props.className].filter(Boolean).join(' ')}>
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle cx="4" cy="20" r="2" />
  </svg>
);

export const InfinityIcon = (props: SVGProps<SVGSVGElement>): ReactElement => (
  <svg {...baseProps} width={24} height={24} {...props} className={['lucide lucide-infinity-icon lucide-infinity', props.className].filter(Boolean).join(' ')}>
    <path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" />
  </svg>
);

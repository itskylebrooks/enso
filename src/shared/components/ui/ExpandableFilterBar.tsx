import { ContextPanelRail, useContextPanelPinButton } from './ContextPanelRail';
import type { ReactNode } from 'react';

export type ExpandableFilterBarProps = {
  children: ReactNode;
  label?: string;
  tourTargetId?: string;
  forceOpen?: boolean;
  sideRailAfter?: ReactNode;
};

export const usePinButton = useContextPanelPinButton;

export const ExpandableFilterBar = ({
  children,
  label = 'Filters',
  tourTargetId,
  forceOpen = false,
  sideRailAfter,
}: ExpandableFilterBarProps): ReactNode => {
  return (
    <ContextPanelRail
      label={label}
      tourTargetId={tourTargetId}
      forceOpen={forceOpen}
      sideRailAfter={sideRailAfter}
    >
      {children}
    </ContextPanelRail>
  );
};

import type { PropsWithChildren, ReactElement } from 'react';

export const Toast = ({ children }: PropsWithChildren): ReactElement => (
  <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center pointer-events-none">
    <div
      className="pointer-events-auto surface border surface-border shadow-lg px-4 py-2 rounded-full text-sm"
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  </div>
);

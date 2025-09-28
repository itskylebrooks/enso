import type { PropsWithChildren } from 'react';

export const SectionTitle = ({ children }: PropsWithChildren): JSX.Element => (
  <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">{children}</h3>
);

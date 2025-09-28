import type { PropsWithChildren } from 'react';

export const SectionTitle = ({ children }: PropsWithChildren): JSX.Element => (
  <h3
    className="text-[0.6875rem] font-medium tracking-[0.18em] text-muted uppercase"
    style={{ fontVariant: 'small-caps', letterSpacing: '0.18em' }}
  >
    {children}
  </h3>
);

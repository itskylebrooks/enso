import type { ReactElement } from 'react';

export type StepsListProps = {
  steps: string[];
  ariaLabel: string;
  versionLabel?: string;
};

export const StepsList = ({ steps, ariaLabel, versionLabel }: StepsListProps): ReactElement => (
  <div className="space-y-4">
    {versionLabel && (
      <p className="text-xs uppercase tracking-[0.3em] text-subtle">{versionLabel}</p>
    )}
    <ol aria-label={ariaLabel} className="space-y-5">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border surface-border text-xs font-semibold">
            {index + 1}
          </span>
          <p className="text-sm leading-relaxed text-[var(--color-text)]">{step}</p>
        </li>
      ))}
    </ol>
  </div>
);

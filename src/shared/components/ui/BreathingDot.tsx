import type { ReactElement } from 'react';

type BreathingDotProps = {
  label?: string;
  /** Size in px for the dot (defaults to 28) */
  size?: number;
  className?: string;
};

export const BreathingDot = ({ label = 'Loading', size = 28, className = '' }: BreathingDotProps): ReactElement => {
  const style: Record<string, string> = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div role="status" aria-live="polite" className={`flex items-center justify-center ${className}`}>
      <div className="breathing-dot" style={style} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default BreathingDot;

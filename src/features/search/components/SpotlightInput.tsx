import { forwardRef, type KeyboardEvent, type ReactElement } from 'react';
import { Search, X } from 'lucide-react';

export type SpotlightInputProps = {
  value: string;
  placeholder: string;
  label: string;
  clearLabel: string;
  listboxId: string;
  activeOptionId?: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

export const SpotlightInput = forwardRef<HTMLInputElement, SpotlightInputProps>(
  (
    {
      value,
      placeholder,
      label,
      clearLabel,
      listboxId,
      activeOptionId,
      onChange,
      onKeyDown,
      onClear,
    },
    ref,
  ): ReactElement => (
    <div className="relative flex items-center rounded-xl border surface surface-border pl-3 pr-2 py-2 shadow-inner transition-soft">
      <span className="text-muted" aria-hidden>
        <Search className="h-4 w-4" />
      </span>
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        autoComplete="off"
        spellCheck={false}
        className="ml-2 mr-8 h-10 flex-1 bg-transparent text-base text-[color:var(--color-text)] placeholder:text-subtle focus:outline-none"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm text-subtle transition-soft hover:bg-white/10 hover:text-[color:var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-text)]"
          aria-label={clearLabel}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  ),
);

SpotlightInput.displayName = 'SpotlightInput';

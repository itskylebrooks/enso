import { useState, useRef, useEffect, type ReactElement, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMotionPreferences } from './motion';
import { classNames } from '../../utils/classNames';
import { ChevronDownIcon } from './icons';

export type SelectOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  group?: string;
  disabled?: boolean;
};

export type SelectProps<T extends string = string> = {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  'aria-label'?: string;
  searchable?: boolean;
  className?: string;
};

export const Select = <T extends string = string>({
  options,
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  searchable = false,
  className,
}: SelectProps<T>): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { prefersReducedMotion } = useMotionPreferences();

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        typeof opt.label === 'string' &&
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Group options by group property
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || '';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(option);
    return acc;
  }, {} as Record<string, SelectOption<T>[]>);

  const groups = Object.keys(groupedOptions).sort((a, b) => {
    // Empty string (no group) comes first
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b);
  });

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
    }
  };

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) {
        handleSelect(option);
      }
      return;
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      setHighlightedIndex(filteredOptions.length - 1);
      return;
    }
  };

  return (
    <div className={classNames('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={classNames(
          'w-full px-4 py-2.5 rounded-xl border border-adaptive hover-border-adaptive bg-[var(--color-surface)]',
          'text-left text-sm transition-colors',
          'focus-halo focus:outline-none',
          'flex items-center justify-between gap-2'
        )}
      >
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption?.label || placeholder || 'Select…'}
          </span>
        </span>
        <ChevronDownIcon
          className={classNames(
            'w-4 h-4 text-subtle transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={classNames(
              'absolute z-50 w-full mt-2',
              'bg-[var(--color-surface)] rounded-xl border border-adaptive',
              'shadow-2xl shadow-black/20',
              'max-h-[min(400px,50vh)] overflow-auto',
              'py-2'
            )}
          >
            {searchable && (
              <div className="px-2 pb-2 mb-2 border-b border-adaptive">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setSearchQuery('');
                      triggerRef.current?.focus();
                      setIsOpen(false);
                    }
                  }}
                  placeholder="Search…"
                  className={classNames(
                    'w-full px-3 py-2 rounded-lg',
                    'bg-[var(--color-bg)] border border-adaptive',
                    'text-sm text-[var(--color-text)]',
                    'focus-halo focus:outline-none',
                    'placeholder:text-muted'
                  )}
                />
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted text-center">
                No options found
              </div>
            ) : (
              groups.map((groupName) => (
                <div key={groupName}>
                  {groupName && (
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      {groupName}
                    </div>
                  )}
                  {groupedOptions[groupName].map((option) => {
                    const globalIndex = filteredOptions.indexOf(option);
                    const isHighlighted = globalIndex === highlightedIndex;
                    const isSelected = option.value === value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                        disabled={option.disabled}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        className={classNames(
                          'w-full px-4 py-2.5 text-left text-sm transition-colors',
                          'flex items-center gap-3',
                          isHighlighted && !option.disabled && 'bg-white/5',
                          isSelected && 'text-[var(--color-text)] font-medium',
                          !isSelected && !option.disabled && 'text-subtle hover:text-[var(--color-text)]',
                          option.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}
                        <span className="flex-1 min-w-0 truncate">{option.label}</span>
                        {isSelected && (
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

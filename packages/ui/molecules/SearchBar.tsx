'use client';

import { Search, X } from 'lucide-react';
import type { ChangeEvent, ReactElement } from 'react';

import { Button, Icon, Input, type InputProps } from '../atoms';
import { cn } from '../utils/cn';

export interface SearchBarProps extends Omit<
  InputProps,
  'className' | 'defaultValue' | 'error' | 'helperText' | 'label' | 'onChange' | 'type' | 'value'
> {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  clearButtonLabel?: string;
}

export function SearchBar({
  value,
  onValueChange,
  className,
  inputClassName,
  clearButtonLabel = 'Clear search',
  disabled,
  'aria-label': ariaLabel,
  ...inputProps
}: SearchBarProps): ReactElement {
  return (
    <div role="search" className={cn('relative w-full', className)}>
      <Icon
        icon={Search}
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-subtle"
      />
      <Input
        {...inputProps}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Search'}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onValueChange(event.currentTarget.value)
        }
        className={cn('pl-9 pr-12', inputClassName)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={clearButtonLabel}
        disabled={disabled || value.length === 0}
        onClick={() => onValueChange('')}
        className="absolute right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 !p-0"
      >
        <Icon icon={X} size={16} />
      </Button>
    </div>
  );
}

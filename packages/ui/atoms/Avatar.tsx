import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { cn } from '../utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends Omit<
  ComponentPropsWithoutRef<'span'>,
  'children' | 'className' | 'role'
> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function initialsFromName(name: string | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) {
    return '?';
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function Avatar({
  alt,
  className,
  initials,
  size = 'md',
  src,
  'aria-label': ariaLabel,
  ...spanProps
}: AvatarProps): ReactElement {
  const fallback = initials?.trim() || initialsFromName(alt);

  return (
    <span
      {...spanProps}
      role="img"
      aria-label={ariaLabel ?? alt ?? fallback}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-brand-50 font-semibold text-brand-700',
        sizeClasses[size],
        className,
      )}
    >
      <span aria-hidden="true">{fallback}</span>
      {src ? (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
}

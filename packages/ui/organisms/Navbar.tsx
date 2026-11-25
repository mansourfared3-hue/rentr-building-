'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactElement } from 'react';

import { Avatar, Button, Icon } from '../atoms';
import { cn } from '../utils/cn';

export type NavbarRole = 'tenant' | 'owner';

export interface NavbarLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarUser {
  name: string;
  avatarUrl?: string;
  initials?: string;
}

export interface NavbarMenuItem {
  label: string;
  onSelect: () => void;
}

export interface NavbarProps {
  brand: string;
  logoUrl?: string;
  links: readonly NavbarLink[];
  currentRole: NavbarRole;
  onRoleChange: (role: NavbarRole) => void;
  user: NavbarUser;
  userMenuItems?: readonly NavbarMenuItem[];
  className?: string;
}

export function Navbar({
  brand,
  logoUrl,
  links,
  currentRole,
  onRoleChange,
  user,
  userMenuItems = [],
  className,
}: NavbarProps): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  return (
    <header
      className={cn(
        'relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 shadow-soft sm:px-6',
        className,
      )}
    >
      <a href="/" className="inline-flex min-w-0 items-center gap-2 font-semibold text-ink">
        {logoUrl ? <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" /> : null}
        <span className="truncate">{brand}</span>
      </a>

      <nav
        aria-label="Primary navigation"
        className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto"
      >
        {links.map((link) => (
          <a
            key={`${link.href}:${link.label}`}
            href={link.href}
            aria-current={link.active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
              link.active
                ? 'bg-brand-50 font-medium text-brand-700'
                : 'text-ink-muted hover:bg-neutral-50 hover:text-ink',
            )}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 sm:ml-0">
        <div
          role="group"
          aria-label="Choose account role"
          className="inline-flex rounded-md border border-border p-0.5"
        >
          <Button
            size="sm"
            variant={currentRole === 'tenant' ? 'primary' : 'ghost'}
            aria-pressed={currentRole === 'tenant'}
            onClick={() => onRoleChange('tenant')}
            className="h-8 px-2.5"
          >
            Tenant
          </Button>
          <Button
            size="sm"
            variant={currentRole === 'owner' ? 'primary' : 'ghost'}
            aria-pressed={currentRole === 'owner'}
            onClick={() => onRoleChange('owner')}
            className="h-8 px-2.5"
          >
            Owner
          </Button>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            aria-label={`Open user menu for ${user.name}`}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
            className="gap-2 px-2"
          >
            <Avatar
              {...(user.avatarUrl ? { src: user.avatarUrl } : {})}
              {...(user.initials ? { initials: user.initials } : {})}
              alt={user.name}
              size="sm"
            />
            <span className="hidden max-w-32 truncate text-sm sm:inline">{user.name}</span>
            <Icon icon={ChevronDown} size={16} />
          </Button>
          {menuOpen ? (
            <div
              id={menuId}
              role="group"
              aria-label="User menu"
              className="absolute right-0 top-full mt-2 min-w-48 rounded-lg border border-border bg-surface p-2 shadow-card"
            >
              <p className="px-3 py-2 text-sm font-medium text-ink">{user.name}</p>
              {userMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    item.onSelect();
                    setMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactElement } from 'react';
import { Bell, Coins, House, Menu, Plus, UserRound, Wallet, X } from 'lucide-react';

import type { NavbarRole } from '@rentr/ui/organisms';
import { apiRequest } from '@/lib/api-client';

const navigationLinks = [
  { label: 'اكتشف العقارات', href: '/properties', icon: House },
  { label: 'أضف عقارك', href: '/properties/new', icon: Plus },
  { label: 'طلباتي', href: '/requests', icon: Bell },
  { label: 'المحفظة', href: '/wallet', icon: Wallet },
  { label: 'حسابي', href: '/profile', icon: UserRound },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/requests') return pathname.startsWith('/requests/');
  if (href === '/properties') {
    return pathname.startsWith('/properties/') && pathname !== '/properties/new';
  }
  return false;
}

export interface AppNavbarProps {
  initialRole: NavbarRole;
  roleInteractive?: boolean;
}

export function AppNavbar({ initialRole, roleInteractive = true }: AppNavbarProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [roleError, setRoleError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleRoleChange = async (nextRole: NavbarRole): Promise<void> => {
    setRoleError('');
    if (nextRole === 'owner') {
      setBusy(true);
      try {
        await apiRequest('/auth/roles/owner', { method: 'POST' });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'تعذر تفعيل وضع المالك.';
        if (message.toLowerCase().includes('access token')) {
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
        } else {
          setRoleError(message);
        }
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setRole(nextRole);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 shadow-soft backdrop-blur-xl">
      <div className="page-shell flex min-h-[68px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition hover:bg-neutral-100 lg:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link href="/properties" className="flex shrink-0 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <img src="/rentr-connect-icon.png" alt="" className="h-8 w-8 rounded-lg" />
            </span>
            <span className="hidden text-base font-bold tracking-tight text-ink sm:block">
              رنتر <span className="text-brand-600">كونكت</span>
            </span>
          </Link>
        </div>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 lg:flex">
          {navigationLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActivePath(pathname, href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActivePath(pathname, href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-muted hover:bg-neutral-50 hover:text-ink'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/wallet"
            aria-label="افتح محفظة الاتصالات"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            <Coins size={16} />
            <span className="hidden sm:inline">رصيد الاتصالات</span>
          </Link>
          <button
            type="button"
            disabled
            aria-label="الإشعارات — معاينة فقط"
            className="hidden h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-ink-subtle sm:inline-flex"
          >
            <Bell size={19} />
          </button>
          <button
            type="button"
            disabled
            aria-label="تغيير اللغة — قريباً"
            className="hidden h-10 min-w-10 cursor-not-allowed items-center justify-center rounded-lg px-2 text-xs font-semibold text-ink-subtle sm:inline-flex"
          >
            EN
          </button>
          <Link
            href="/profile"
            aria-label="الملف الشخصي"
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-ink-muted sm:inline-flex"
          >
            <UserRound size={17} />
          </Link>
          <div
            role="group"
            aria-label="نوع الحساب"
            className="inline-flex rounded-lg border border-border bg-neutral-50 p-1"
          >
            <button
              type="button"
              aria-pressed={role === 'tenant'}
              onClick={() => void handleRoleChange('tenant')}
              disabled={!roleInteractive}
              className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition sm:px-3 ${
                role === 'tenant'
                  ? 'bg-white text-ink shadow-soft'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              مستأجر
            </button>
            <button
              type="button"
              aria-pressed={role === 'owner'}
              onClick={() => void handleRoleChange('owner')}
              disabled={busy || !roleInteractive}
              className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition sm:px-3 ${
                role === 'owner' ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
              }`}
            >
              مالك
            </button>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <nav
          aria-label="التنقل الرئيسي"
          className="border-t border-border bg-white px-4 py-3 lg:hidden"
        >
          <div className="page-shell grid gap-1">
            {navigationLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActivePath(pathname, href) ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActivePath(pathname, href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-muted hover:bg-neutral-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
      {roleError ? (
        <p
          role="alert"
          className="border-t border-danger-100 bg-danger-50 px-4 py-2 text-center text-sm text-danger-700"
        >
          {roleError}
        </p>
      ) : null}
    </header>
  );
}

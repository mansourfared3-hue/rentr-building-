import { Bath, BedDouble, MapPin, Ruler } from 'lucide-react';
import type { ReactElement } from 'react';

import { Icon } from '../atoms';
import { StatusPill } from '../molecules';
import { cn } from '../utils/cn';

export interface PropertyCardProps {
  href: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  priceLabel: string;
  bedrooms: number | string;
  bathrooms: number | string;
  area: number | string;
  areaUnit?: string;
  approximateLocation: string;
  lastUpdatedAt: Date | string;
  className?: string;
}

function formatUpdatedAt(value: Date | string): string {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return 'Updated recently';
  }

  const elapsedMinutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60_000);
  if (elapsedMinutes < 1) {
    return 'Updated just now';
  }
  if (elapsedMinutes < 60) {
    return `Updated ${elapsedMinutes} ${elapsedMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Updated ${elapsedHours} ${elapsedHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Updated ${elapsedDays} ${elapsedDays === 1 ? 'day' : 'days'} ago`;
}

export function PropertyCard({
  href,
  title,
  imageUrl,
  imageAlt,
  priceLabel,
  bedrooms,
  bathrooms,
  area,
  areaUnit = 'm²',
  approximateLocation,
  lastUpdatedAt,
  className,
}: PropertyCardProps): ReactElement {
  return (
    <a
      href={href}
      className={cn(
        'group block overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-shadow hover:shadow-elevated',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
        <img
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 flex-1 text-lg font-semibold text-ink">{title}</h2>
          <StatusPill label={formatUpdatedAt(lastUpdatedAt)} tone="neutral" />
        </div>

        <p className="text-lg font-semibold text-brand-700">{priceLabel}</p>

        <ul
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-muted"
          aria-label="Property details"
        >
          <li className="inline-flex items-center gap-1.5">
            <Icon icon={BedDouble} size={16} />
            <span>{bedrooms} beds</span>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Icon icon={Bath} size={16} />
            <span>{bathrooms} baths</span>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Icon icon={Ruler} size={16} />
            <span>
              {area} {areaUnit}
            </span>
          </li>
        </ul>

        <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <Icon icon={MapPin} size={16} />
          <span>{approximateLocation}</span>
        </p>
      </div>
    </a>
  );
}

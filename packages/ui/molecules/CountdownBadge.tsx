'use client';

import { useEffect, useState, type ReactElement } from 'react';

import { Badge, type BadgeVariant } from '../atoms';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DEFAULT_WARNING_THRESHOLD_MS = HOUR_MS;
const DEFAULT_DANGER_THRESHOLD_MS = 15 * MINUTE_MS;

export interface CountdownBadgeProps {
  target: Date;
  warningThresholdMs?: number;
  dangerThresholdMs?: number;
  className?: string;
}

function formatRemainingTime(remainingMs: number): string {
  const totalMinutes = Math.ceil(Math.max(0, remainingMs) / MINUTE_MS);
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `متبقي ${days} يوم${remainingHours > 0 ? ` و${remainingHours} س` : ''}`;
  }

  if (remainingHours > 0) {
    return `متبقي ${remainingHours} س و${minutes} د`;
  }

  return `متبقي ${totalMinutes} د`;
}

export function CountdownBadge({
  target,
  warningThresholdMs = DEFAULT_WARNING_THRESHOLD_MS,
  dangerThresholdMs = DEFAULT_DANGER_THRESHOLD_MS,
  className,
}: CountdownBadgeProps): ReactElement {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const targetTimestamp = target.getTime();

  useEffect(() => {
    const refreshRemainingTime = (): number => {
      const nextRemainingMs = Number.isFinite(targetTimestamp)
        ? Math.max(0, targetTimestamp - Date.now())
        : 0;
      setRemainingMs(nextRemainingMs);
      return nextRemainingMs;
    };

    if (refreshRemainingTime() === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (refreshRemainingTime() === 0) {
        window.clearInterval(intervalId);
      }
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [targetTimestamp]);

  const warningThreshold = Math.max(0, warningThresholdMs);
  const dangerThreshold = Math.max(0, dangerThresholdMs);
  const warningStartMs = Math.max(warningThreshold, dangerThreshold);
  const dangerStartMs = Math.min(warningThreshold, dangerThreshold);
  const tone: BadgeVariant =
    remainingMs === null
      ? 'neutral'
      : remainingMs <= dangerStartMs
        ? 'danger'
        : remainingMs <= warningStartMs
          ? 'warning'
          : 'neutral';
  const label = remainingMs === null ? '…' : formatRemainingTime(remainingMs);

  return (
    <Badge variant={tone} className={className ?? ''} aria-label={label}>
      {label}
    </Badge>
  );
}

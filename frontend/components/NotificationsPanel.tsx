'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactElement } from 'react';
import { Bell, ExternalLink } from 'lucide-react';

import { apiRequest } from '@/lib/api-client';
import type { AppNotification } from '@rentr/types';

export function NotificationsPanel(): ReactElement | null {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void apiRequest<AppNotification[]>('/notifications')
      .then(setNotifications)
      .catch(() => setError('تعذر تحميل الإشعارات الآن.'));
  }, []);

  const unread = notifications.filter((notification) => notification.readAt === null);
  if (unread.length === 0 && !error) return null;

  async function markRead(notification: AppNotification): Promise<void> {
    try {
      await apiRequest(`/notifications/${notification.id}/read`, { method: 'PATCH' });
      setNotifications((current) => current.map((item) =>
        item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
      ));
    } catch {
      setError('تعذر تحديث حالة الإشعار. حاول مرة أخرى.');
    }
  }

  return (
    <section aria-label="الإشعارات" className="surface-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Bell size={17} className="text-brand-600" />
        الإشعارات
      </h2>
      {error ? <p role="alert" className="mt-3 text-sm text-danger-700">{error}</p> : null}
      <ul className="mt-2 divide-y divide-border">
        {unread.map((notification) => (
          <li key={notification.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-medium text-ink">{translateTitle(notification.title)}</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">{translateBody(notification.body)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 underline" href={notification.targetUrl}>
                فتح
                <ExternalLink size={14} />
              </Link>
              <button type="button" className="text-sm text-ink-muted underline" onClick={() => void markRead(notification)}>
                تحديد كمقروء
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function translateTitle(value: string): string {
  const titles: Record<string, string> = {
    'New rental request': 'طلب تواصل جديد',
    'Request accepted': 'تم قبول طلبك',
    'Request declined': 'تم رفض الطلب',
    'Request expired': 'انتهت مهلة الطلب',
    'Rental request closes soon': 'اقترب انتهاء مهلة الطلب',
    'New message': 'رسالة جديدة',
  };
  return titles[value] ?? value;
}

function translateBody(value: string): string {
  if (value.includes('A tenant sent a request')) return 'أرسل مستأجر طلباً بخصوص أحد عقاراتك.';
  if (value.includes('Review this request')) return 'راجع هذا الطلب قبل انتهاء المهلة.';
  if (value.includes('The request deadline passed')) return 'انتهت المهلة وأُعيدت نقاط الاتصال المحجوزة إلى محفظتك.';
  if (value.includes('accepted by another tenant')) return 'تم قبول العقار لمستأجر آخر وأُعيدت النقاط المحجوزة.';
  if (value.includes('property is no longer available')) return 'العقار لم يعد متاحاً وأُعيدت النقاط المحجوزة.';
  if (value.includes('Reserved Connects were returned')) return 'أُعيدت نقاط الاتصال المحجوزة إلى محفظتك.';
  if (value.includes('Your request was accepted')) return 'وافق المالك على طلبك. يمكنكما الآن بدء محادثة خاصة.';
  if (value.includes('received a new message')) return 'لديك رسالة جديدة بخصوص طلب الإيجار.';
  return value;
}
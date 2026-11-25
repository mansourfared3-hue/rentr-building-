'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactElement } from 'react';

import { ChatWindow } from '@rentr/ui/organisms';
import type { Message } from '@rentr/types';
import { apiRequest } from '@/lib/api-client';

export interface ChatDemoProps {
  requestId: string;
}

function translateChatError(value: string): string {
  const message = value.toLowerCase();
  if (message.includes('access token')) return 'سجّل الدخول لفتح المحادثة.';
  if (message.includes('accepted')) return 'تُفتح المحادثة بعد موافقة المالك على الطلب.';
  if (message.includes('cannot be shared'))
    return 'لا يمكن مشاركة أرقام الهاتف أو البريد الإلكتروني داخل المحادثة.';
  return 'تعذر تحميل المحادثة أو إرسال الرسالة. تحقق من اتصالك وحاول مرة أخرى.';
}

export function ChatDemo({ requestId }: ChatDemoProps): ReactElement {
  const [messages, setMessages] = useState<readonly Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const [user, result] = await Promise.all([
          apiRequest<{ id: string }>('/auth/me'),
          apiRequest<Message[]>(`/requests/${requestId}/messages`),
        ]);
        if (active) {
          setCurrentUserId(user.id);
          setMessages(result);
          setNotice('');
        }
      } catch (caught) {
        if (active) {
          setNotice(translateChatError(caught instanceof Error ? caught.message : ''));
        }
      }
    };
    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 4000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [requestId]);

  const handleSend = (text: string): void => {
    if (!text.trim()) return;
    void apiRequest<Message>(`/requests/${requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: text }),
    })
      .then((message) => {
        setMessages((current) => [...current, message]);
        setDraft('');
        setNotice('');
      })
      .catch((caught: unknown) => {
        setNotice(translateChatError(caught instanceof Error ? caught.message : ''));
      });
  };

  return (
    <div className="space-y-3">
      {notice ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-surface p-3 text-sm text-ink-muted"
        >
          {notice}{' '}
          {notice.includes('سجّل الدخول') ? (
            <Link
              className="font-semibold text-brand-700 underline"
              href={`/login?next=${encodeURIComponent(`/requests/${requestId}/chat`)}`}
            >
              تسجيل الدخول
            </Link>
          ) : null}
        </p>
      ) : null}
      <ChatWindow
        messages={messages}
        currentUserId={currentUserId}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        disabled={!currentUserId}
        {...(notice.includes('لا يمكن مشاركة') ? { blockedMessage: notice } : {})}
      />
    </div>
  );
}

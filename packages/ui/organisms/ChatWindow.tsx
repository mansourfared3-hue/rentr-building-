'use client';

import { Send } from 'lucide-react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';

import { Button, Icon, Input } from '../atoms';
import { FormField, StatusPill } from '../molecules';
import { cn } from '../utils/cn';
import { ChatMessageBubble } from './ChatMessageBubble';
import type { ChatWindowMessage } from './chat-types';

export interface ChatWindowProps {
  messages: readonly ChatWindowMessage[];
  currentUserId: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (message: string) => void;
  blockedMessage?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function ChatWindow({
  messages,
  currentUserId,
  draft,
  onDraftChange,
  onSend,
  blockedMessage,
  emptyMessage = 'ابدأ المحادثة برسالة قصيرة للتعارف.',
  disabled = false,
  className,
}: ChatWindowProps): ReactElement {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSend(draft);
  };

  return (
    <section
      aria-label="محادثة خاصة"
      className={cn(
        'flex min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card',
        className,
      )}
    >
      <ol aria-label="رسائل المحادثة" className="flex-1 space-y-3 overflow-y-auto bg-neutral-50/70 p-4">
        {messages.length === 0 ? (
          <li className="py-8 text-center text-sm text-ink-muted">{emptyMessage}</li>
        ) : (
          messages.map((message) => (
            <li key={message.id}>
              <ChatMessageBubble
                senderName={message.senderName}
                sentAt={message.sentAt}
                content={message.content}
                isOwn={message.senderId === currentUserId}
              />
            </li>
          ))
        )}
      </ol>

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-border bg-white p-4">
        {blockedMessage ? (
          <div role="status" aria-live="polite">
            <StatusPill
              label={blockedMessage}
              tone="warning"
              className="whitespace-normal text-left"
            />
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <FormField label="اكتب رسالة" className="min-w-0 flex-1">
            <Input
              value={draft}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onDraftChange(event.currentTarget.value)
              }
              placeholder="اكتب رسالتك هنا..."
              disabled={disabled}
              autoComplete="off"
            />
          </FormField>
          <Button type="submit" aria-label="إرسال الرسالة" disabled={disabled || !draft.trim()}>
            <Icon icon={Send} size={16} />
            <span>إرسال</span>
          </Button>
        </div>
      </form>
    </section>
  );
}

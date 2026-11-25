import { MapPin } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge, Icon } from '../atoms';
import { cn } from '../utils/cn';
import type { ChatMessageContent } from './chat-types';

export interface ChatMessageBubbleProps {
  senderName: string;
  sentAt: string;
  content: ChatMessageContent;
  isOwn: boolean;
  className?: string;
}

export function ChatMessageBubble({
  senderName,
  sentAt,
  content,
  isOwn,
  className,
}: ChatMessageBubbleProps): ReactElement {
  const timestamp = new Date(sentAt);
  const timeLabel = Number.isNaN(timestamp.getTime())
    ? sentAt
    : new Intl.DateTimeFormat('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        numberingSystem: 'latn',
      }).format(timestamp);

  return (
    <article className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start', className)}>
      <div
        className={cn(
          'max-w-[min(85%,36rem)] rounded-xl px-4 py-3 shadow-soft',
          isOwn ? 'bg-brand-600 text-white' : 'border border-border bg-surface text-ink',
        )}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className={cn('text-xs font-semibold', isOwn ? 'text-white/90' : 'text-ink-muted')}>
            {senderName}
          </p>
          <time
            dateTime={!Number.isNaN(timestamp.getTime()) ? timestamp.toISOString() : undefined}
            className={cn('text-xs', isOwn ? 'text-white/75' : 'text-ink-subtle')}
          >
            {timeLabel}
          </time>
        </div>

        <div className="mt-2 break-words text-sm">
          {content.kind === 'text' ? (
            <p className="whitespace-pre-wrap">{content.text}</p>
          ) : (
            <div className="space-y-2">
              <Badge variant={isOwn ? 'neutral' : 'success'}>
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={MapPin} size={14} />
                  موقع تمت مشاركته
                </span>
              </Badge>
              <a
                href={content.mapUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'block font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2',
                  isOwn
                    ? 'text-white focus-visible:ring-white'
                    : 'text-brand-700 focus-visible:ring-brand-500',
                )}
              >
                {content.label ?? 'افتح الموقع'}
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

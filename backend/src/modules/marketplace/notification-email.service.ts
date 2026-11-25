import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailDeliveryService } from '../auth/otp-delivery.service';

const EMAIL_BATCH_WINDOW_MS = 60_000;

interface NotificationEmailEvent {
  title: string;
  body: string;
  targetUrl: string;
}

interface PendingEmailBatch {
  events: NotificationEmailEvent[];
  timer: NodeJS.Timeout;
}

@Injectable()
export class NotificationEmailService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationEmailService.name);
  private readonly pending = new Map<string, PendingEmailBatch>();
  private smtpWarningLogged = false;

  constructor(
    private readonly emailDelivery: EmailDeliveryService,
    private readonly config: ConfigService,
  ) {}

  enqueue(email: string, event: NotificationEmailEvent): void {
    if (!this.emailDelivery.isConfigured()) {
      if (!this.smtpWarningLogged) {
        this.logger.warn('Notification emails are disabled because SMTP is not configured.');
        this.smtpWarningLogged = true;
      }
      return;
    }

    const existing = this.pending.get(email);
    if (existing) {
      existing.events.push(event);
      return;
    }

    const timer = setTimeout(() => {
      void this.flush(email);
    }, EMAIL_BATCH_WINDOW_MS);
    timer.unref();
    this.pending.set(email, { events: [event], timer });
  }

  onModuleDestroy(): void {
    for (const [email, batch] of this.pending) {
      clearTimeout(batch.timer);
      this.logger.warn(
        `Discarding ${batch.events.length} queued notification email(s) for ${email} during shutdown.`,
      );
    }
    this.pending.clear();
  }

  private async flush(email: string): Promise<void> {
    const batch = this.pending.get(email);
    if (!batch) return;
    this.pending.delete(email);

    try {
      const origin = this.config
        .get<string>('WEB_ORIGIN', 'http://localhost:3000')
        .split(',')[0]
        ?.trim();
      if (!origin) {
        this.logger.error(
          `Cannot send notification email to ${email}: WEB_ORIGIN is not configured.`,
        );
        return;
      }
      const updates = batch.events.map((event) => {
        const target = new URL(event.targetUrl, origin).toString();
        return `${event.title}\n${event.body}\n${target}`;
      });
      await this.emailDelivery.send({
        to: email,
        subject:
          batch.events.length === 1
            ? batch.events[0]!.title
            : `${batch.events.length} new Rentr Connect updates`,
        text: updates.join('\n\n'),
      });
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${email}.`, error);
    }
  }
}

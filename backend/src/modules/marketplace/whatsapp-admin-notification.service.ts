import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const OUTBOX_POLL_INTERVAL_MS = 60_000;
const OUTBOX_LOCK_TIMEOUT_MS = 5 * 60_000;
const OUTBOX_BATCH_SIZE = 20;

interface WhatsAppConfiguration {
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
  adminNumber: string;
  templateName: string;
  templateLanguage: string;
}

interface OnHoldAlert {
  requestId: string;
  propertyTitle: string;
  ownerEmail: string;
}

@Injectable()
export class WhatsAppAdminNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppAdminNotificationService.name);
  private workerTimer?: NodeJS.Timeout;
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.workerTimer = setInterval(() => {
      void this.processPendingAlerts().catch((error: unknown) => {
        this.logger.error('Failed to process admin WhatsApp notifications.', error);
      });
    }, OUTBOX_POLL_INTERVAL_MS);
    this.workerTimer.unref();
    void this.processPendingAlerts().catch((error: unknown) => {
      this.logger.error('Failed to process admin WhatsApp notifications.', error);
    });
  }

  onModuleDestroy(): void {
    if (this.workerTimer) clearInterval(this.workerTimer);
  }

  async enqueueOnHoldAlert(tx: Prisma.TransactionClient, alert: OnHoldAlert): Promise<void> {
    await tx.adminWhatsAppOutbox.create({ data: alert });
  }

  async sendOnHoldAlert(alert: OnHoldAlert): Promise<void> {
    const settings = this.getConfiguration();
    const response = await fetch(
      `https://graph.facebook.com/${settings.apiVersion}/${settings.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${settings.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: settings.adminNumber,
          type: 'template',
          template: {
            name: settings.templateName,
            language: { code: settings.templateLanguage },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: alert.requestId },
                  { type: 'text', text: alert.propertyTitle },
                  { type: 'text', text: alert.ownerEmail },
                ],
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(`Meta WhatsApp Cloud API returned HTTP ${response.status}.`);
    }
  }

  private getConfiguration(): WhatsAppConfiguration {
    const apiVersion = this.config.get<string>('META_WHATSAPP_API_VERSION');
    const phoneNumberId = this.config.get<string>('META_WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('META_WHATSAPP_ACCESS_TOKEN');
    const adminNumber = this.config.get<string>('ADMIN_WHATSAPP_NUMBER')?.replace(/^\+/u, '');
    const templateName = this.config.get<string>('META_WHATSAPP_TEMPLATE_NAME');
    const templateLanguage = this.config.get<string>('META_WHATSAPP_TEMPLATE_LANGUAGE');

    if (
      !apiVersion ||
      !/^v\d+\.\d+$/u.test(apiVersion) ||
      !phoneNumberId ||
      !/^\d+$/u.test(phoneNumberId) ||
      !accessToken ||
      !adminNumber ||
      !/^[1-9]\d{6,14}$/u.test(adminNumber) ||
      !templateName ||
      !/^[a-z0-9_]+$/u.test(templateName) ||
      !templateLanguage ||
      !/^[a-z]{2,3}(?:_[A-Z]{2})?$/u.test(templateLanguage)
    ) {
      throw new ServiceUnavailableException(
        'Meta WhatsApp Cloud API settings are incomplete or invalid.',
      );
    }

    return {
      apiVersion,
      phoneNumberId,
      accessToken,
      adminNumber,
      templateName,
      templateLanguage,
    };
  }

  private async processPendingAlerts(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      const now = new Date();
      const staleLock = new Date(now.getTime() - OUTBOX_LOCK_TIMEOUT_MS);
      const alerts = await this.prisma.adminWhatsAppOutbox.findMany({
        where: {
          sentAt: null,
          nextAttemptAt: { lte: now },
          OR: [{ lockedAt: null }, { lockedAt: { lte: staleLock } }],
        },
        orderBy: { createdAt: 'asc' },
        take: OUTBOX_BATCH_SIZE,
      });

      for (const alert of alerts) {
        await this.deliverAlert(alert, now, staleLock);
      }
    } finally {
      this.processing = false;
    }
  }

  private async deliverAlert(
    alert: OnHoldAlert & { id: string; attempts: number },
    now: Date,
    staleLock: Date,
  ): Promise<void> {
    const claimedAt = new Date();
    const claim = await this.prisma.adminWhatsAppOutbox.updateMany({
      where: {
        id: alert.id,
        sentAt: null,
        nextAttemptAt: { lte: now },
        OR: [{ lockedAt: null }, { lockedAt: { lte: staleLock } }],
      },
      data: { lockedAt: claimedAt, attempts: { increment: 1 } },
    });
    if (claim.count !== 1) return;

    const attempt = alert.attempts + 1;
    try {
      await this.sendOnHoldAlert(alert);
      await this.prisma.adminWhatsAppOutbox.updateMany({
        where: { id: alert.id, sentAt: null, lockedAt: claimedAt },
        data: { sentAt: new Date(), lockedAt: null, lastError: null },
      });
    } catch (error) {
      const retryMinutes = Math.min(60, 2 ** Math.min(attempt - 1, 6));
      const lastError = error instanceof Error ? error.message : 'Unknown WhatsApp delivery error.';
      await this.prisma.adminWhatsAppOutbox.updateMany({
        where: { id: alert.id, sentAt: null, lockedAt: claimedAt },
        data: {
          lockedAt: null,
          nextAttemptAt: new Date(Date.now() + retryMinutes * 60_000),
          lastError: lastError.slice(0, 1000),
        },
      });
      this.logger.error(
        `Failed to send admin WhatsApp alert for request ${alert.requestId} (attempt ${attempt}).`,
        error,
      );
    }
  }
}

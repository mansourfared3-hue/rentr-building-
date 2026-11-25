import type { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppAdminNotificationService } from './whatsapp-admin-notification.service';

describe('WhatsAppAdminNotificationService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends an approved Meta template to the configured admin number', async () => {
    const values: Record<string, string> = {
      META_WHATSAPP_API_VERSION: 'v23.0',
      META_WHATSAPP_PHONE_NUMBER_ID: '1234567890',
      META_WHATSAPP_ACCESS_TOKEN: 'test-token',
      ADMIN_WHATSAPP_NUMBER: '+201012345678',
      META_WHATSAPP_TEMPLATE_NAME: 'admin_on_hold_alert',
      META_WHATSAPP_TEMPLATE_LANGUAGE: 'en',
    };
    const config = {
      get: (key: string): string | undefined => values[key],
    } as unknown as ConfigService;
    const prisma = {} as PrismaService;
    const service = new WhatsAppAdminNotificationService(prisma, config);
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await service.sendOnHoldAlert({
      requestId: 'request-1',
      propertyTitle: 'Quiet apartment',
      ownerEmail: 'owner@example.com',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v23.0/1234567890/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' }),
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: '201012345678',
          type: 'template',
          template: {
            name: 'admin_on_hold_alert',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: 'request-1' },
                  { type: 'text', text: 'Quiet apartment' },
                  { type: 'text', text: 'owner@example.com' },
                ],
              },
            ],
          },
        }),
      }),
    );
  });

  it('fails explicitly when WhatsApp delivery configuration is missing', async () => {
    const service = new WhatsAppAdminNotificationService(
      {} as PrismaService,
      { get: () => undefined } as unknown as ConfigService,
    );

    await expect(
      service.sendOnHoldAlert({
        requestId: 'request-1',
        propertyTitle: 'Quiet apartment',
        ownerEmail: 'owner@example.com',
      }),
    ).rejects.toThrow('Meta WhatsApp Cloud API settings are incomplete or invalid.');
  });

  it('queues an admin alert even when WhatsApp delivery settings are not configured', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const service = new WhatsAppAdminNotificationService(
      {} as PrismaService,
      { get: () => undefined } as unknown as ConfigService,
    );
    const tx = {
      adminWhatsAppOutbox: { create },
    } as unknown as Parameters<typeof service.enqueueOnHoldAlert>[0];
    const alert = {
      requestId: 'request-1',
      propertyTitle: 'Quiet apartment',
      ownerEmail: 'owner@example.com',
    };

    await expect(service.enqueueOnHoldAlert(tx, alert)).resolves.toBeUndefined();
    expect(create).toHaveBeenCalledWith({ data: alert });
  });
});

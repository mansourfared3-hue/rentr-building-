import type { ConfigService } from '@nestjs/config';
import { EmailDeliveryService } from '../auth/otp-delivery.service';
import { NotificationEmailService } from './notification-email.service';

describe('NotificationEmailService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('batches notifications for the same recipient for one minute', async () => {
    jest.useFakeTimers();
    const emailDelivery = {
      isConfigured: jest.fn().mockReturnValue(true),
      send: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: jest.fn().mockReturnValue('https://rentr.example'),
    };
    const service = new NotificationEmailService(
      emailDelivery as unknown as EmailDeliveryService,
      config as unknown as ConfigService,
    );

    service.enqueue('owner@example.com', {
      title: 'New rental request',
      body: 'A tenant sent a request for your property.',
      targetUrl: '/requests/request-1',
    });
    service.enqueue('owner@example.com', {
      title: 'New message',
      body: 'You received a new message about a rental request.',
      targetUrl: '/requests/request-1/chat',
    });

    expect(emailDelivery.send).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(emailDelivery.send).toHaveBeenCalledWith({
      to: 'owner@example.com',
      subject: '2 new Rentr Connect updates',
      text: expect.stringContaining('https://rentr.example/requests/request-1/chat'),
    });
    service.onModuleDestroy();
  });
});

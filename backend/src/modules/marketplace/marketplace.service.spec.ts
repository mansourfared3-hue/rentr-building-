import type { Property as PrismaProperty } from '@prisma/client';
import { PropertyFurnishing, PropertyType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  calculateConnectReservation,
  containsContactDetails,
  toPublicProperty,
} from './marketplace.service';
import { MarketplaceService } from './marketplace.service';
import type { CreatePropertyDto } from './marketplace.dto';
import { NotificationEmailService } from './notification-email.service';
import { WhatsAppAdminNotificationService } from './whatsapp-admin-notification.service';

const notificationEmail = {
  enqueue: jest.fn(),
} as unknown as NotificationEmailService;

const whatsappNotifications = {
  enqueueOnHoldAlert: jest.fn().mockResolvedValue(undefined),
} as unknown as WhatsAppAdminNotificationService;

describe('Connect reservation', () => {
  it('reserves half of the available balance rounded up on every request', () => {
    expect(calculateConnectReservation(10)).toBe(5);
    expect(calculateConnectReservation(5)).toBe(3);
    expect(calculateConnectReservation(2)).toBe(1);
    expect(calculateConnectReservation(1)).toBe(1);
    expect(calculateConnectReservation(0)).toBe(0);
  });
});

describe('chat contact firewall', () => {
  it('blocks phone numbers separated by punctuation, line breaks, and Arabic-Indic digits', () => {
    expect(containsContactDetails('رقمي ٠١٠-\n١٢٣٤،٥٦٧٨')).toBe(true);
  });

  it('blocks digit sequences written as Arabic or English number words', () => {
    expect(
      containsContactDetails('رقمي واحد صفر واحد اثنين ثلاثة اربعة خمسة ستة سبعة ثمانية'),
    ).toBe(true);
    expect(
      containsContactDetails('call me: zero one two three four five six seven eight nine'),
    ).toBe(true);
  });

  it('blocks email addresses written with words instead of symbols', () => {
    expect(containsContactDetails('write to renter at example dot com')).toBe(true);
  });

  it('allows ordinary conversation without contact details', () => {
    expect(containsContactDetails('The apartment is available in November.')).toBe(false);
  });

  it('allows ordinary property messages with separate facts, prices, and dates', () => {
    expect(
      containsContactDetails(
        'The 2-bedroom apartment has 1 bathroom, costs 1,000,000 EGP per month, and is available on 2026-11-01.',
      ),
    ).toBe(false);
    expect(
      containsContactDetails(
        'The flat has 3 bedrooms, 2 bathrooms, 120 m2, and monthly rent of 12,000 EGP.',
      ),
    ).toBe(false);
  });

  it('detects a phone number split across adjacent message text', () => {
    expect(containsContactDetails('You can reach me at 01012\n345678')).toBe(true);
  });

  it('does not join digits from unrelated parts of a message', () => {
    expect(containsContactDetails('2 bedrooms, 1 bathroom, 3 balconies, rent is 12000 EGP.')).toBe(
      false,
    );
  });
});

describe('public property serialization', () => {
  it('never returns the exact address or coordinates', () => {
    const property = {
      id: 'property-1',
      title: 'Two bedroom home',
      type: 'APARTMENT',
      community: 'Maadi',
      bedrooms: 2,
      bathrooms: 1,
      area: 100,
      areaUnit: 'm2',
      furnishing: 'FURNISHED',
      rent: 10000,
      currency: 'EGP',
      rentPeriod: 'MONTH',
      availabilityDate: new Date('2026-11-01T00:00:00.000Z'),
      description: 'A comfortable home with natural light and a quiet location.',
      images: [{ url: '/home.jpg', alt: 'Living room' }],
      approximateLocation: 'Maadi, Cairo',
      address: 'Private Street 12',
      latitude: 29.9602,
      longitude: 31.2569,
      additionalInfo: null,
      status: 'PUBLISHED',
      ownerId: 'owner-1',
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-02T00:00:00.000Z'),
    } as unknown as PrismaProperty;

    const result = toPublicProperty(property);
    expect(result).not.toHaveProperty('address');
    expect(result).not.toHaveProperty('latitude');
    expect(result).not.toHaveProperty('longitude');
    expect(result.approximateLocation).toBe('Maadi, Cairo');
  });
});

describe('private property coordinates', () => {
  const dto: CreatePropertyDto = {
    title: 'Two bedroom home',
    type: PropertyType.APARTMENT,
    community: 'Maadi',
    bedrooms: 2,
    bathrooms: 1,
    area: 100,
    furnishing: PropertyFurnishing.FURNISHED,
    rent: 10000,
    availabilityDate: '2026-11-01',
    description: 'A comfortable home with natural light and a quiet location.',
    images: [],
    approximateLocation: 'Maadi, Cairo',
    address: 'Private Street 12',
    latitude: '29.9602',
    longitude: '31.2569',
  };

  it('persists exact coordinates through the separate location relation', async () => {
    const property = {
      id: 'property-1',
      title: dto.title,
      type: dto.type,
      community: dto.community,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      area: dto.area,
      areaUnit: 'm²',
      furnishing: dto.furnishing,
      rent: dto.rent,
      currency: 'EGP',
      rentPeriod: 'MONTH',
      availabilityDate: new Date(dto.availabilityDate),
      description: dto.description,
      images: [],
      approximateLocation: dto.approximateLocation,
      address: dto.address,
      additionalInfo: null,
      status: 'PUBLISHED',
      ownerId: 'owner-1',
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-02T00:00:00.000Z'),
    } as unknown as PrismaProperty;
    const create = jest.fn().mockResolvedValue(property);
    const service = new MarketplaceService(
      { property: { create } } as unknown as PrismaService,
      notificationEmail,
      whatsappNotifications,
    );

    await service.createProperty('owner-1', dto);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          location: {
            create: { latitude: 29.9602, longitude: 31.2569 },
          },
        }),
      }),
    );
  });

  it('rejects incomplete coordinate pairs', async () => {
    const create = jest.fn();
    const service = new MarketplaceService(
      { property: { create } } as unknown as PrismaService,
      notificationEmail,
      whatsappNotifications,
    );
    const incompleteDto: CreatePropertyDto = { ...dto };
    delete incompleteDto.longitude;

    await expect(service.createProperty('owner-1', incompleteDto)).rejects.toThrow(
      'Latitude and longitude must be provided together.',
    );
    expect(create).not.toHaveBeenCalled();
  });
});

describe('rental request decisions', () => {
  const request = {
    id: 'request-1',
    ownerId: 'owner-1',
    tenantId: 'tenant-1',
    propertyId: 'property-1',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    connectsReserved: 3,
    owner: { email: 'owner@example.com' },
    property: { title: 'Quiet apartment' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks an unavailable property on hold and creates an admin alert', async () => {
    const tx = {
      rentalRequest: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: request.id, propertyId: request.propertyId })
          .mockResolvedValueOnce(request),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      property: { update: jest.fn().mockResolvedValue(undefined) },
      connectWallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1-wallet' }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      walletLedgerEntry: { create: jest.fn().mockResolvedValue(undefined) },
      notification: { create: jest.fn().mockResolvedValue(undefined) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new MarketplaceService(prisma, notificationEmail, whatsappNotifications);

    const result = await service.decideRentalRequest('owner-1', 'request-1', {
      decision: 'reject-unavailable',
    });

    expect(result).toEqual({
      id: 'request-1',
      status: 'rejected',
      rejectionReason: 'unavailable',
    });
    expect(tx.property.update).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      data: { status: 'ON_HOLD' },
    });
    expect(whatsappNotifications.enqueueOnHoldAlert).toHaveBeenCalledWith(tx, {
      requestId: 'request-1',
      propertyTitle: 'Quiet apartment',
      ownerEmail: 'owner@example.com',
    });
  });

  it('blocks a phone number split between the latest prior and current messages', async () => {
    const tx = {
      rentalRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'request-1',
          status: 'ACCEPTED',
          messages: [{ body: 'رقمي 01012' }],
          tenant: { email: 'tenant@example.com' },
          owner: { email: 'owner@example.com' },
        }),
      },
      rentalMessage: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new MarketplaceService(prisma, notificationEmail, whatsappNotifications);

    await expect(
      service.createMessage('tenant-1', 'request-1', { body: '345678' }),
    ).rejects.toThrow('Phone numbers and email addresses cannot be shared in chat.');
    expect(tx.rentalMessage.create).not.toHaveBeenCalled();
  });

  describe('held request deadlines', () => {
    it('expires held requests and refunds their reserved Connects', async () => {
      const expiredRequest = {
        id: 'request-held',
        tenantId: 'tenant-1',
        connectsReserved: 2,
      };
      const tx = {
        rentalRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        $queryRaw: jest.fn().mockResolvedValue([]),
        connectWallet: {
          findUnique: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
          update: jest.fn().mockResolvedValue(undefined),
        },
        walletLedgerEntry: { create: jest.fn().mockResolvedValue(undefined) },
        notification: { create: jest.fn().mockResolvedValue(undefined) },
      };
      const prisma = {
        rentalRequest: {
          findMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([expiredRequest]),
        },
        $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
      } as unknown as PrismaService;
      const service = new MarketplaceService(prisma, notificationEmail, whatsappNotifications);
      const processDeadlines = Reflect.get(service, 'processRequestDeadlines');

      if (typeof processDeadlines !== 'function') {
        throw new Error('Request deadline processor is not available.');
      }
      await Reflect.apply(processDeadlines, service, []);

      expect(tx.rentalRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: { in: ['PENDING', 'ON_HOLD'] } }),
          data: expect.objectContaining({ status: 'EXPIRED' }),
        }),
      );
      expect(tx.connectWallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { available: { increment: 2 }, reserved: { decrement: 2 } },
      });
      expect(tx.walletLedgerEntry.create).toHaveBeenCalledWith({
        data: {
          walletId: 'wallet-1',
          requestId: 'request-held',
          availableChange: 2,
          reservedChange: -2,
          reason: 'REQUEST_REFUND',
        },
      });
    });
  });

  it('accepts one request, withdraws the property, and refunds other active requests', async () => {
    const otherRequest = {
      id: 'request-2',
      tenantId: 'tenant-2',
      connectsReserved: 4,
    };
    const tx = {
      rentalRequest: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: request.id, propertyId: request.propertyId })
          .mockResolvedValueOnce(request),
        findMany: jest.fn().mockResolvedValue([otherRequest]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      property: { update: jest.fn().mockResolvedValue(undefined) },
      connectWallet: {
        findUnique: jest.fn(({ where }: { where: { userId: string } }) =>
          Promise.resolve({ id: `${where.userId}-wallet` }),
        ),
        update: jest.fn().mockResolvedValue(undefined),
      },
      walletLedgerEntry: { create: jest.fn().mockResolvedValue(undefined) },
      notification: { create: jest.fn().mockResolvedValue(undefined) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const service = new MarketplaceService(prisma, notificationEmail, whatsappNotifications);

    const result = await service.decideRentalRequest('owner-1', 'request-1', {
      decision: 'accept',
    });

    expect(result.status).toBe('accepted');
    expect(tx.property.update).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      data: { status: 'WITHDRAWN' },
    });
    expect(tx.connectWallet.update).toHaveBeenCalledTimes(2);
    expect(tx.walletLedgerEntry.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'request-1',
          availableChange: 0,
          reservedChange: -3,
          reason: 'REQUEST_CONSUME',
        }),
      }),
    );
    expect(tx.walletLedgerEntry.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'request-2',
          availableChange: 4,
          reservedChange: -4,
          reason: 'REQUEST_REFUND',
        }),
      }),
    );
  });
});

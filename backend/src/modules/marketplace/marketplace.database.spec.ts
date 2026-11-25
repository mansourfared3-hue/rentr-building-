import { randomUUID } from 'node:crypto';
import {
  PropertyFurnishing,
  PropertyStatus,
  PropertyType,
  RentPeriod,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MarketplaceService } from './marketplace.service';
import { NotificationEmailService } from './notification-email.service';
import { WhatsAppAdminNotificationService } from './whatsapp-admin-notification.service';

const databaseUrl = process.env['DATABASE_URL'];
const databaseName = databaseUrl ? new URL(databaseUrl).pathname.replace(/^\//u, '') : '';
const isLocalProjectDatabase =
  databaseUrl !== undefined &&
  ['localhost', '127.0.0.1', '::1'].includes(new URL(databaseUrl).hostname) &&
  databaseName === 'rentr_connect';
const runDatabaseTests = process.env['RUN_DATABASE_TESTS'] === 'true';

if (runDatabaseTests && !isLocalProjectDatabase) {
  throw new Error('Database tests are restricted to the local rentr_connect database.');
}

(runDatabaseTests ? describe : describe.skip)('Marketplace PostgreSQL integration', () => {
  jest.setTimeout(30_000);

  const prisma = new PrismaService();
  const service = new MarketplaceService(
    prisma,
    {
      enqueue: () => undefined,
    } as unknown as NotificationEmailService,
    {
      enqueueOnHoldAlert: () => Promise.resolve(),
    } as unknown as WhatsAppAdminNotificationService,
  );
  const tenantId = randomUUID();
  const ownerId = randomUUID();
  const propertyId = randomUUID();

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.createMany({
      data: [
        { id: tenantId, email: `${tenantId}@test.invalid`, roles: [UserRole.TENANT] },
        { id: ownerId, email: `${ownerId}@test.invalid`, roles: [UserRole.OWNER] },
      ],
    });
    await prisma.tenantProfile.create({
      data: {
        userId: tenantId,
        name: 'Database Test Tenant',
        occupation: 'Tester',
        livingArrangement: 'alone',
        familySize: 1,
        moveInDate: new Date('2026-11-01T00:00:00.000Z'),
        introduction: 'Integration test profile for wallet reservation.',
      },
    });
    await prisma.property.create({
      data: {
        id: propertyId,
        ownerId,
        title: 'Database test home',
        type: PropertyType.APARTMENT,
        community: 'Test District',
        bedrooms: 2,
        bathrooms: 1,
        area: 100,
        furnishing: PropertyFurnishing.FURNISHED,
        rent: 10000,
        rentPeriod: RentPeriod.MONTH,
        availabilityDate: new Date('2026-11-01T00:00:00.000Z'),
        description: 'A test property used only for the database integration test.',
        images: [],
        approximateLocation: 'Test District, Cairo',
        address: 'Private test address',
        location: { create: { latitude: 29.9602, longitude: 31.2569 } },
        status: PropertyStatus.PUBLISHED,
      },
    });
    await prisma.connectWallet.create({ data: { userId: tenantId, available: 10 } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [tenantId, ownerId] } } });
    await prisma.$disconnect();
  });

  it('stores exact coordinates outside the property record', async () => {
    const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
    const location = await prisma.propertyLocation.findUniqueOrThrow({ where: { propertyId } });

    expect(property).not.toHaveProperty('latitude');
    expect(property).not.toHaveProperty('longitude');
    expect(Number(location.latitude)).toBe(29.9602);
    expect(Number(location.longitude)).toBe(31.2569);
  });

  it('serializes concurrent reservations and refunds rejected requests exactly once', async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () => service.createRentalRequest(tenantId, { propertyId })),
    );
    const created = attempts.flatMap((attempt) =>
      attempt.status === 'fulfilled' ? [attempt.value] : [],
    );
    expect(created).toHaveLength(4);
    expect(attempts.filter((attempt) => attempt.status === 'rejected')).toHaveLength(1);

    const reservedAmounts = created
      .map((request) => request.connectsReserved)
      .sort((left, right) => left - right);
    expect(reservedAmounts).toEqual([1, 1, 3, 5]);
    expect(await prisma.connectWallet.findUnique({ where: { userId: tenantId } })).toMatchObject({
      available: 0,
      reserved: 10,
    });

    const largestRequest = created.find((request) => request.connectsReserved === 5);
    if (!largestRequest) throw new Error('Expected a request to reserve five Connects.');
    await service.decideRentalRequest(ownerId, largestRequest.id, { decision: 'reject-profile' });
    expect(await prisma.connectWallet.findUnique({ where: { userId: tenantId } })).toMatchObject({
      available: 5,
      reserved: 5,
    });
    await expect(
      service.decideRentalRequest(ownerId, largestRequest.id, { decision: 'reject-profile' }),
    ).rejects.toThrow('Request is no longer active.');
    expect(await prisma.connectWallet.findUnique({ where: { userId: tenantId } })).toMatchObject({
      available: 5,
      reserved: 5,
    });
  });
});

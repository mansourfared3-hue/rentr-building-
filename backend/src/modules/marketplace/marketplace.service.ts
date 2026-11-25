import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  PropertyStatus,
  RentalRequestStatus,
  RequestRejectionReason,
  WalletEntryReason,
  Prisma,
  type Property as PrismaProperty,
  type TenantProfile,
} from '@prisma/client';
import type { PublicProperty } from '@rentr/types';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppAdminNotificationService } from './whatsapp-admin-notification.service';
import {
  CreateMessageDto,
  CreatePropertyDto,
  CreateRentalRequestDto,
  DecideRentalRequestDto,
  GrantConnectsDto,
  TenantProfileDto,
} from './marketplace.dto';
import { NotificationEmailService } from './notification-email.service';

const REQUEST_TTL_HOURS = 12;
const REQUEST_REMINDER_HOURS = 2;
const ACTIVE_REQUEST_STATUSES: RentalRequestStatus[] = [
  RentalRequestStatus.PENDING,
  RentalRequestStatus.ON_HOLD,
];

export function calculateConnectReservation(available: number): number {
  return Math.ceil(available / 2);
}

function normalizeDigits(value: string): string {
  const digitMap: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  };
  return value.replace(/[٠-٩۰-۹]/gu, (digit) => digitMap[digit] ?? digit);
}

export function containsContactDetails(value: string): boolean {
  const normalized = normalizeDigits(value)
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/gu, '')
    .replace(/[أإآ]/gu, 'ا')
    .replace(/ة/gu, 'ه')
    .replace(/ى/gu, 'ي');
  const digitWords: Record<string, string> = {
    zero: '0',
    oh: '0',
    one: '1',
    two: '2',
    to: '2',
    too: '2',
    three: '3',
    four: '4',
    for: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    ate: '8',
    nine: '9',
    صفر: '0',
    واحد: '1',
    واحدة: '1',
    اثنين: '2',
    اتنين: '2',
    اثنان: '2',
    ثلاثه: '3',
    ثلاثة: '3',
    تلاته: '3',
    تلاتة: '3',
    اربعه: '4',
    اربعة: '4',
    خمسه: '5',
    خمسة: '5',
    سته: '6',
    ستة: '6',
    سبعه: '7',
    سبعة: '7',
    تمانيه: '8',
    ثمانيه: '8',
    ثمانية: '8',
    تسعه: '9',
    تسعة: '9',
  };
  const digitized = normalized.replace(/[\p{L}]+/gu, (word) => digitWords[word] ?? word);
  const withoutDates = digitized
    .replace(/\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/gu, ' ')
    .replace(/\b\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)\d{2}\b/gu, ' ');
  const phoneCandidates =
    withoutDates.match(/(?<![\p{L}\d])(?:\d[\s\p{P}\p{S}]*){7,15}(?![\s\p{P}\p{S}]*\d)/gu) ?? [];
  const hasPhone = phoneCandidates.some((candidate) => {
    const digits = candidate.replace(/\D/gu, '');
    if (/^\d{1,3}(?:,\d{3}){2,}$/u.test(candidate.trim())) return false;
    return /^(?:\+?20)?0?1[0125]\d{8}$/u.test(digits) || /^\d{7,15}$/u.test(digits);
  });
  const hasEmail =
    /[\p{L}\d._%+-]+\s*(?:@|\bat\b)\s*[\p{L}\d.-]+\s*(?:\.|\bdot\b)\s*[a-z]{2,}/iu.test(normalized);
  return hasPhone || hasEmail;
}

export function toPublicProperty(property: PrismaProperty): PublicProperty {
  const images = Array.isArray(property.images) ? property.images : [];
  return {
    id: property.id,
    title: property.title,
    type: property.type.toLowerCase() as PublicProperty['type'],
    community: property.community,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    areaUnit: property.areaUnit,
    furnishing: property.furnishing
      .toLowerCase()
      .replaceAll('_', '-') as PublicProperty['furnishing'],
    rent: property.rent,
    currency: property.currency,
    rentPeriod: property.rentPeriod.toLowerCase() as PublicProperty['rentPeriod'],
    availabilityDate: property.availabilityDate.toISOString().slice(0, 10),
    description: property.description,
    images: images as unknown as PublicProperty['images'],
    approximateLocation: property.approximateLocation,
    additionalInfo: property.additionalInfo ?? '',
    updatedAt: property.updatedAt.toISOString(),
  };
}

function toTenantProfile(
  profile: TenantProfile,
): Omit<TenantProfile, 'moveInDate'> & { moveInDate: string } {
  return { ...profile, moveInDate: profile.moveInDate.toISOString().slice(0, 10) };
}

@Injectable()
export class MarketplaceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketplaceService.name);
  private expiryTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEmail: NotificationEmailService,
    private readonly whatsappNotifications: WhatsAppAdminNotificationService,
  ) {}

  onModuleInit(): void {
    this.expiryTimer = setInterval(() => {
      void this.processRequestDeadlines().catch((error: unknown) => {
        this.logger.error('Failed to process request deadlines.', error);
      });
    }, 60_000);
    this.expiryTimer.unref();
    void this.processRequestDeadlines().catch((error: unknown) => {
      this.logger.error('Failed to process request deadlines.', error);
    });
  }

  onModuleDestroy(): void {
    if (this.expiryTimer) clearInterval(this.expiryTimer);
  }

  private async processRequestDeadlines(): Promise<void> {
    const now = new Date();
    const reminderLimit = new Date(now.getTime() + REQUEST_REMINDER_HOURS * 60 * 60 * 1000);
    const dueForReminder = await this.prisma.rentalRequest.findMany({
      where: {
        status: { in: ACTIVE_REQUEST_STATUSES },
        expiresSoonNotifiedAt: null,
        expiresAt: { gt: now, lte: reminderLimit },
      },
      select: { id: true, ownerId: true },
      take: 100,
    });
    for (const request of dueForReminder) {
      await this.prisma.$transaction(async (tx) => {
        const marked = await tx.rentalRequest.updateMany({
          where: {
            id: request.id,
            status: { in: ACTIVE_REQUEST_STATUSES },
            expiresSoonNotifiedAt: null,
            expiresAt: { gt: new Date(), lte: reminderLimit },
          },
          data: { expiresSoonNotifiedAt: new Date() },
        });
        if (marked.count === 1) {
          await tx.notification.create({
            data: {
              userId: request.ownerId,
              title: 'Rental request closes soon',
              body: 'Review this request within the next two hours.',
              targetUrl: `/requests/${request.id}`,
            },
          });
        }
      });
    }

    const expired = await this.prisma.rentalRequest.findMany({
      where: { status: { in: ACTIVE_REQUEST_STATUSES }, expiresAt: { lte: now } },
      select: { id: true, tenantId: true, connectsReserved: true },
      take: 100,
    });
    for (const request of expired) {
      await this.prisma.$transaction(async (tx) => {
        const marked = await tx.rentalRequest.updateMany({
          where: {
            id: request.id,
            status: { in: ACTIVE_REQUEST_STATUSES },
            expiresAt: { lte: new Date() },
          },
          data: { status: RentalRequestStatus.EXPIRED, decidedAt: new Date() },
        });
        if (marked.count !== 1) return;

        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "connect_wallets" WHERE "userId" = ${request.tenantId}::uuid FOR UPDATE
        `;
        const wallet = await tx.connectWallet.findUnique({ where: { userId: request.tenantId } });
        if (!wallet) throw new NotFoundException('Tenant wallet not found.');
        await tx.connectWallet.update({
          where: { id: wallet.id },
          data: {
            available: { increment: request.connectsReserved },
            reserved: { decrement: request.connectsReserved },
          },
        });
        await tx.walletLedgerEntry.create({
          data: {
            walletId: wallet.id,
            requestId: request.id,
            availableChange: request.connectsReserved,
            reservedChange: -request.connectsReserved,
            reason: WalletEntryReason.REQUEST_REFUND,
          },
        });
        await tx.notification.create({
          data: {
            userId: request.tenantId,
            title: 'Request expired',
            body: 'The request deadline passed. Reserved Connects were returned.',
            targetUrl: `/requests/${request.id}`,
          },
        });
      });
    }
  }

  async listProperties(): Promise<PublicProperty[]> {
    const properties = await this.prisma.property.findMany({
      where: { status: PropertyStatus.PUBLISHED },
      orderBy: { updatedAt: 'desc' },
    });
    return properties.map(toPublicProperty);
  }

  async getProperty(id: string): Promise<PublicProperty> {
    const property = await this.prisma.property.findFirst({
      where: { id, status: PropertyStatus.PUBLISHED },
    });
    if (!property) throw new NotFoundException('Property not found.');
    return toPublicProperty(property);
  }

  async createProperty(ownerId: string, dto: CreatePropertyDto): Promise<PublicProperty> {
    if ((dto.latitude === undefined) !== (dto.longitude === undefined)) {
      throw new BadRequestException('Latitude and longitude must be provided together.');
    }

    const property = await this.prisma.property.create({
      data: {
        ownerId,
        title: dto.title,
        type: dto.type,
        community: dto.community,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        area: dto.area,
        furnishing: dto.furnishing,
        rent: dto.rent,
        availabilityDate: new Date(dto.availabilityDate),
        description: dto.description,
        images: dto.images.map(({ url, alt }) => ({ url, alt })) as Prisma.InputJsonValue,
        approximateLocation: dto.approximateLocation,
        address: dto.address,
        ...(dto.latitude === undefined || dto.longitude === undefined
          ? {}
          : {
              location: {
                create: {
                  latitude: Number(dto.latitude),
                  longitude: Number(dto.longitude),
                },
              },
            }),
        ...(dto.additionalInfo === undefined ? {} : { additionalInfo: dto.additionalInfo }),
        status: PropertyStatus.PUBLISHED,
      },
    });
    return toPublicProperty(property);
  }

  async getTenantProfile(userId: string): Promise<ReturnType<typeof toTenantProfile> | null> {
    const profile = await this.prisma.tenantProfile.findUnique({ where: { userId } });
    return profile ? toTenantProfile(profile) : null;
  }

  async saveTenantProfile(
    userId: string,
    dto: TenantProfileDto,
  ): Promise<ReturnType<typeof toTenantProfile>> {
    const profile = await this.prisma.tenantProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
        moveInDate: new Date(dto.moveInDate),
      },
      update: {
        ...dto,
        moveInDate: new Date(dto.moveInDate),
      },
    });
    return toTenantProfile(profile);
  }

  async getWallet(userId: string): Promise<{ available: number; reserved: number }> {
    const wallet = await this.prisma.connectWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { available: true, reserved: true },
    });
    return wallet;
  }

  async listNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return notifications.map((notification) => ({
      ...notification,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    }));
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<{ success: true }> {
    const updated = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (updated.count === 0) {
      const existing = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
        select: { id: true },
      });
      if (!existing) throw new NotFoundException('Notification not found.');
    }
    return { success: true };
  }

  async grantConnects(dto: GrantConnectsDto): Promise<{ available: number; reserved: number }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found.');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.connectWallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id, available: dto.amount },
        update: { available: { increment: dto.amount } },
      });
      await tx.walletLedgerEntry.create({
        data: {
          walletId: wallet.id,
          availableChange: dto.amount,
          reservedChange: 0,
          reason: WalletEntryReason.GRANT,
        },
      });
      return { available: wallet.available, reserved: wallet.reserved };
    });
  }

  async createRentalRequest(tenantId: string, dto: CreateRentalRequestDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "properties" WHERE "id" = ${dto.propertyId}::uuid FOR UPDATE
      `;
      const [property, profile] = await Promise.all([
        tx.property.findFirst({
          where: { id: dto.propertyId, status: PropertyStatus.PUBLISHED },
          include: { owner: { select: { email: true } } },
        }),
        tx.tenantProfile.findUnique({ where: { userId: tenantId } }),
      ]);
      if (!property) throw new NotFoundException('Property not found.');
      if (property.ownerId === tenantId)
        throw new BadRequestException('You cannot request your own property.');
      if (!profile)
        throw new BadRequestException('Complete your tenant profile before sending a request.');

      await tx.connectWallet.upsert({
        where: { userId: tenantId },
        create: { userId: tenantId },
        update: {},
      });
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "connect_wallets" WHERE "userId" = ${tenantId}::uuid FOR UPDATE
      `;
      const wallet = await tx.connectWallet.findUnique({ where: { userId: tenantId } });
      if (!wallet) throw new NotFoundException('Wallet not found.');
      const reserved = calculateConnectReservation(wallet.available);
      if (reserved < 1) throw new BadRequestException('You need at least one available Connect.');

      const now = new Date();
      const request = await tx.rentalRequest.create({
        data: {
          tenantId,
          ownerId: property.ownerId,
          propertyId: property.id,
          profileSnapshot: {
            name: profile.name,
            occupation: profile.occupation,
            isStudent: profile.isStudent,
            livingArrangement: profile.livingArrangement,
            familySize: profile.familySize,
            moveInDate: profile.moveInDate.toISOString().slice(0, 10),
            introduction: profile.introduction,
            avatarUrl: profile.avatarUrl,
          },
          message: dto.message ?? '',
          connectsReserved: reserved,
          expiresAt: new Date(now.getTime() + REQUEST_TTL_HOURS * 60 * 60 * 1000),
        },
      });
      await tx.connectWallet.update({
        where: { id: wallet.id },
        data: { available: { decrement: reserved }, reserved: { increment: reserved } },
      });
      await tx.walletLedgerEntry.create({
        data: {
          walletId: wallet.id,
          requestId: request.id,
          availableChange: -reserved,
          reservedChange: reserved,
          reason: WalletEntryReason.REQUEST_RESERVE,
        },
      });
      await tx.notification.create({
        data: {
          userId: property.ownerId,
          title: 'New rental request',
          body: 'A tenant sent a request for your property.',
          targetUrl: `/requests/${request.id}`,
        },
      });
      return {
        response: {
          ...request,
          status: request.status.toLowerCase(),
          property: toPublicProperty(property),
        },
        ownerEmail: property.owner.email,
        notification: {
          title: 'New rental request',
          body: 'A tenant sent a request for your property.',
          targetUrl: `/requests/${request.id}`,
        },
      };
    });
    this.notificationEmail.enqueue(result.ownerEmail, result.notification);
    return result.response;
  }

  async listRentalRequests(userId: string) {
    const requests = await this.prisma.rentalRequest.findMany({
      where: { OR: [{ tenantId: userId }, { ownerId: userId }] },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map(({ property, status, rejectionReason, ...request }) => ({
      ...request,
      status: status.toLowerCase(),
      rejectionReason: rejectionReason?.toLowerCase(),
      isOwner: request.ownerId === userId,
      property: toPublicProperty(property),
    }));
  }

  async decideRentalRequest(ownerId: string, requestId: string, dto: DecideRentalRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const requestReference = await tx.rentalRequest.findFirst({
        where: { id: requestId, ownerId },
        select: { id: true, propertyId: true },
      });
      if (!requestReference) throw new NotFoundException('Rental request not found.');
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "properties" WHERE "id" = ${requestReference.propertyId}::uuid FOR UPDATE
      `;
      const request = await tx.rentalRequest.findFirst({
        where: { id: requestId, ownerId },
        include: {
          owner: { select: { email: true } },
          property: { select: { title: true } },
        },
      });
      if (!request) throw new NotFoundException('Rental request not found.');
      if (!ACTIVE_REQUEST_STATUSES.includes(request.status)) {
        throw new ConflictException('Request is no longer active.');
      }

      const expired = request.expiresAt <= new Date();
      const status = expired
        ? RentalRequestStatus.EXPIRED
        : dto.decision === 'accept'
          ? RentalRequestStatus.ACCEPTED
          : RentalRequestStatus.REJECTED;
      const rejectionReason =
        status !== RentalRequestStatus.REJECTED
          ? null
          : dto.decision === 'reject-profile'
            ? RequestRejectionReason.PROFILE
            : RequestRejectionReason.UNAVAILABLE;
      const updated = await tx.rentalRequest.updateMany({
        where: { id: request.id, status: request.status },
        data: {
          status,
          rejectionReason,
          decidedAt: ACTIVE_REQUEST_STATUSES.includes(status) ? null : new Date(),
        },
      });
      if (updated.count !== 1) throw new ConflictException('Request is no longer active.');

      const propertyUnavailable =
        dto.decision === 'reject-unavailable' && status === RentalRequestStatus.REJECTED;
      if (propertyUnavailable) {
        await this.whatsappNotifications.enqueueOnHoldAlert(tx, {
          requestId: request.id,
          propertyTitle: request.property.title,
          ownerEmail: request.owner.email,
        });
      }

      const closedRequests: Array<{
        id: string;
        tenantId: string;
        connectsReserved: number;
      }> = [];
      const closeOtherRequests = status === RentalRequestStatus.ACCEPTED || propertyUnavailable;
      if (closeOtherRequests) {
        const otherActiveRequests = await tx.rentalRequest.findMany({
          where: {
            propertyId: request.propertyId,
            id: { not: request.id },
            status: { in: ACTIVE_REQUEST_STATUSES },
          },
          select: { id: true, tenantId: true, connectsReserved: true },
        });
        for (const otherRequest of otherActiveRequests) {
          const closed = await tx.rentalRequest.updateMany({
            where: {
              id: otherRequest.id,
              status: { in: ACTIVE_REQUEST_STATUSES },
            },
            data: { status: RentalRequestStatus.REJECTED, decidedAt: new Date() },
          });
          if (closed.count === 1) closedRequests.push(otherRequest);
        }
      }

      if (closeOtherRequests) {
        await tx.property.update({
          where: { id: request.propertyId },
          data: {
            status:
              status === RentalRequestStatus.ACCEPTED
                ? PropertyStatus.WITHDRAWN
                : PropertyStatus.ON_HOLD,
          },
        });
      }

      const balanceChanges = [
        {
          id: request.id,
          tenantId: request.tenantId,
          connectsReserved: request.connectsReserved,
          consume: status === RentalRequestStatus.ACCEPTED,
        },
        ...closedRequests.map((otherRequest) => ({ ...otherRequest, consume: false })),
      ];
      const walletUserIds = [...new Set(balanceChanges.map(({ tenantId }) => tenantId))].sort();
      const wallets = new Map<string, string>();
      for (const userId of walletUserIds) {
        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "connect_wallets" WHERE "userId" = ${userId}::uuid FOR UPDATE
        `;
        const wallet = await tx.connectWallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Tenant wallet not found.');
        wallets.set(userId, wallet.id);
      }

      for (const change of balanceChanges) {
        const walletId = wallets.get(change.tenantId);
        if (!walletId) throw new NotFoundException('Tenant wallet not found.');
        await tx.connectWallet.update({
          where: { id: walletId },
          data: change.consume
            ? { reserved: { decrement: change.connectsReserved } }
            : {
                available: { increment: change.connectsReserved },
                reserved: { decrement: change.connectsReserved },
              },
        });
        await tx.walletLedgerEntry.create({
          data: {
            walletId,
            requestId: change.id,
            availableChange: change.consume ? 0 : change.connectsReserved,
            reservedChange: -change.connectsReserved,
            reason: change.consume
              ? WalletEntryReason.REQUEST_CONSUME
              : WalletEntryReason.REQUEST_REFUND,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: request.tenantId,
          title:
            status === RentalRequestStatus.EXPIRED
              ? 'Request expired'
              : status === RentalRequestStatus.ACCEPTED
                ? 'Request accepted'
                : 'Request declined',
          body:
            status !== RentalRequestStatus.ACCEPTED
              ? 'Reserved Connects were returned to your wallet.'
              : 'Your request was accepted. Other active requests for this property were closed.',
          targetUrl: `/requests/${request.id}`,
        },
      });
      for (const otherRequest of closedRequests) {
        await tx.notification.create({
          data: {
            userId: otherRequest.tenantId,
            title: 'Request declined',
            body:
              status === RentalRequestStatus.ACCEPTED
                ? 'The property was accepted by another tenant. Reserved Connects were returned.'
                : 'The property is no longer available. Reserved Connects were returned.',
            targetUrl: `/requests/${otherRequest.id}`,
          },
        });
      }
      return {
        id: request.id,
        status: status.toLowerCase(),
        rejectionReason: rejectionReason?.toLowerCase() ?? null,
      };
    });
  }

  async createMessage(userId: string, requestId: string, dto: CreateMessageDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.rentalRequest.findFirst({
        where: { id: requestId, OR: [{ tenantId: userId }, { ownerId: userId }] },
        include: {
          messages: { where: { senderId: userId }, orderBy: { createdAt: 'desc' }, take: 8 },
          tenant: { select: { email: true } },
          owner: { select: { email: true } },
        },
      });
      if (!request) throw new NotFoundException('Rental request not found.');
      if (request.status !== RentalRequestStatus.ACCEPTED) {
        throw new ForbiddenException('Chat opens only after the owner accepts the request.');
      }
      const recentText = [
        ...request.messages.map((message) => message.body).reverse(),
        dto.body,
      ].join(' ');
      if (containsContactDetails(recentText)) {
        throw new BadRequestException(
          'Phone numbers and email addresses cannot be shared in chat.',
        );
      }
      const message = await tx.rentalMessage.create({
        data: { requestId, senderId: userId, body: dto.body.trim() },
        include: { sender: { select: { tenantProfile: { select: { name: true } } } } },
      });
      const notification = {
        title: 'New message',
        body: 'You received a new message about a rental request.',
        targetUrl: `/requests/${requestId}/chat`,
      };
      const recipientEmail =
        request.tenantId === userId ? request.owner.email : request.tenant.email;
      await tx.notification.create({
        data: {
          userId: request.tenantId === userId ? request.ownerId : request.tenantId,
          ...notification,
        },
      });
      return {
        message: {
          id: message.id,
          requestId: message.requestId,
          senderId: message.senderId,
          senderName: message.sender.tenantProfile?.name ?? 'Rentr Connect user',
          sentAt: message.createdAt.toISOString(),
          content: { kind: 'text' as const, text: message.body },
        },
        recipientEmail,
        notification,
      };
    });
    this.notificationEmail.enqueue(result.recipientEmail, result.notification);
    return result.message;
  }

  async listMessages(userId: string, requestId: string) {
    const request = await this.prisma.rentalRequest.findFirst({
      where: { id: requestId, OR: [{ tenantId: userId }, { ownerId: userId }] },
      select: { id: true, status: true },
    });
    if (!request) throw new NotFoundException('Rental request not found.');
    if (request.status !== RentalRequestStatus.ACCEPTED) {
      throw new ForbiddenException('Chat opens only after the owner accepts the request.');
    }
    const messages = await this.prisma.rentalMessage.findMany({
      where: { requestId },
      include: { sender: { select: { tenantProfile: { select: { name: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((message) => ({
      id: message.id,
      requestId: message.requestId,
      senderId: message.senderId,
      senderName: message.sender.tenantProfile?.name ?? 'Rentr Connect user',
      sentAt: message.createdAt.toISOString(),
      content: { kind: 'text' as const, text: message.body },
    }));
  }
}

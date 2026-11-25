import { UserRole, type User } from '@prisma/client';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../../database/prisma.service';
import type { OtpService } from './otp.service';
import { AuthService } from './auth.service';

const config = {
  get: (key: string, fallback?: string): string | undefined =>
    ({ ACCESS_TOKEN_TTL_SECONDS: '900', REFRESH_TOKEN_TTL_DAYS: '30' })[key] ?? fallback,
  getOrThrow: (key: string): string =>
    ({ JWT_ACCESS_SECRET: 'access-test-secret', JWT_REFRESH_SECRET: 'refresh-test-secret' })[key] ?? '',
} as unknown as ConfigService;

describe('AuthService', () => {
  it('creates a tenant on first verified login and persists only a hash of the refresh token', async () => {
    const user = {
      id: 'user-1',
      email: 'tenant@example.com',
      phone: null,
      roles: [UserRole.TENANT],
      createdAt: new Date(),
    } as User;
    const prisma = {
      user: { upsert: jest.fn().mockResolvedValue(user) },
      refreshSession: { create: jest.fn().mockResolvedValue({}) },
    };
    const otp = { verifyCode: jest.fn().mockResolvedValue('tenant@example.com') };
    const jwt = {
      signAsync: jest.fn().mockResolvedValueOnce('access.jwt.token').mockResolvedValueOnce('refresh.jwt.token'),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      otp as unknown as OtpService,
      jwt as unknown as JwtService,
      config,
    );

    const result = await service.verifyOtp('tenant@example.com', '123456');
    const storedRefresh = prisma.refreshSession.create.mock.calls[0]?.[0].data as {
      tokenHash: string;
      userId: string;
    };

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { email: 'tenant@example.com' },
      create: { email: 'tenant@example.com', roles: [UserRole.TENANT] },
      update: {},
    });
    expect(result.accessToken).toBe('access.jwt.token');
    expect(result.refreshToken).toBe('refresh.jwt.token');
    expect(result.user.roles).toEqual([UserRole.TENANT]);
    expect(storedRefresh.userId).toBe(user.id);
    expect(storedRefresh.tokenHash).not.toBe(result.refreshToken);
    expect(storedRefresh.tokenHash).toHaveLength(64);
  });

  it('adds the owner role to the same account and issues an owner-capable session', async () => {
    const tenant = {
      id: 'user-2',
      email: 'tenant@example.com',
      phone: null,
      roles: [UserRole.TENANT],
      createdAt: new Date(),
    } as User;
    const owner = { ...tenant, roles: [UserRole.TENANT, UserRole.OWNER] } as User;
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(tenant),
        update: jest.fn().mockResolvedValue(owner),
      },
      refreshSession: { create: jest.fn().mockResolvedValue({}) },
    };
    const jwt = {
      signAsync: jest.fn().mockResolvedValueOnce('owner.access.token').mockResolvedValueOnce('owner.refresh.token'),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      {} as OtpService,
      jwt as unknown as JwtService,
      config,
    );

    const result = await service.enableOwnerRole(tenant.id);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: tenant.id },
      data: { roles: { push: UserRole.OWNER } },
    });
    expect(result.user.roles).toEqual([UserRole.TENANT, UserRole.OWNER]);
  });
});

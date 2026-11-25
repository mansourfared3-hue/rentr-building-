import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../database/prisma.service';
import { OtpDeliveryService } from './otp-delivery.service';
import { generateOtpCode, hashOtp, OtpService } from './otp.service';

const TEST_PEPPER = 'otp-pepper-for-unit-tests';

function createHarness(): {
  service: OtpService;
  prisma: {
    otpChallenge: {
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  delivery: { sendCode: jest.Mock };
  config: ConfigService;
} {
  const prisma = {
    otpChallenge: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const delivery = { sendCode: jest.fn().mockResolvedValue(undefined) };
  const values: Record<string, string> = {
    OTP_PEPPER: TEST_PEPPER,
    OTP_TTL_MINUTES: '10',
    OTP_MAX_ATTEMPTS: '5',
  };
  const config = {
    get: <T>(key: string, defaultValue?: T): T | string | undefined =>
      values[key] ?? defaultValue,
    getOrThrow: <T>(key: string): T => values[key] as T,
  } as unknown as ConfigService;

  return {
    service: new OtpService(
      prisma as unknown as PrismaService,
      delivery as unknown as OtpDeliveryService,
      config,
    ),
    prisma,
    delivery,
    config,
  };
}

describe('OtpService', () => {
  it('generates a six-digit code, including leading zeroes when applicable', () => {
    expect(generateOtpCode()).toMatch(/^\d{6}$/);
  });

  it('stores only a peppered code hash and sends the plaintext through the delivery adapter', async () => {
    const { service, prisma, delivery } = createHarness();
    prisma.otpChallenge.findFirst.mockResolvedValue(null);
    prisma.otpChallenge.create.mockResolvedValue({ id: 'challenge-1' });

    const response = await service.requestCode('  Tenant@Example.com ');
    const sentCode = delivery.sendCode.mock.calls[0]?.[1] as string;
    const storedData = prisma.otpChallenge.create.mock.calls[0]?.[0].data as {
      email: string;
      codeHash: string;
      expiresAt: Date;
    };

    expect(response.message).toContain('If the address');
    expect(storedData.email).toBe('tenant@example.com');
    expect(storedData.codeHash).toBe(hashOtp(sentCode, TEST_PEPPER));
    expect(storedData.codeHash).not.toBe(sentCode);
    expect(storedData.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(delivery.sendCode).toHaveBeenCalledWith('tenant@example.com', expect.stringMatching(/^\d{6}$/));
  });

  it('accepts a valid code exactly once and marks its challenge consumed', async () => {
    const { service, prisma } = createHarness();
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'challenge-1',
      email: 'tenant@example.com',
      codeHash: hashOtp('012345', TEST_PEPPER),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      attemptCount: 0,
      createdAt: new Date(),
      userId: null,
    });

    await expect(service.verifyCode('Tenant@Example.com', '012345')).resolves.toBe(
      'tenant@example.com',
    );
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ consumedAt: null }) }),
    );
  });

  it('rejects an incorrect code and increments the bounded attempt counter', async () => {
    const { service, prisma } = createHarness();
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'challenge-1',
      email: 'tenant@example.com',
      codeHash: hashOtp('012345', TEST_PEPPER),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      attemptCount: 0,
      createdAt: new Date(),
      userId: null,
    });

    await expect(service.verifyCode('tenant@example.com', '999999')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attemptCount: { increment: 1 } } }),
    );
  });

  it('rejects expired challenges', async () => {
    const { service, prisma } = createHarness();
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'challenge-expired',
      email: 'tenant@example.com',
      codeHash: hashOtp('012345', TEST_PEPPER),
      expiresAt: new Date(Date.now() - 1_000),
      consumedAt: null,
      attemptCount: 0,
      createdAt: new Date(),
      userId: null,
    });

    await expect(service.verifyCode('tenant@example.com', '012345')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.otpChallenge.updateMany).not.toHaveBeenCalled();
  });
});

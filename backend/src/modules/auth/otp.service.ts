import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { OtpDeliveryService } from './otp-delivery.service';

export const OTP_REQUEST_MESSAGE = 'If the address can receive sign-in codes, a code will be sent shortly.';
const RESEND_COOLDOWN_MS = 60_000;

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(code: string, pepper: string): string {
  return createHmac('sha256', pepper).update(code).digest('hex');
}

function hashesMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual, 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: OtpDeliveryService,
    private readonly config: ConfigService,
  ) {}

  async requestCode(emailAddress: string): Promise<{ message: string }> {
    const email = normalizedEmail(emailAddress);
    const now = new Date();
    const cooldownStart = new Date(now.getTime() - RESEND_COOLDOWN_MS);
    const recentChallenge = await this.prisma.otpChallenge.findFirst({
      where: { email, createdAt: { gt: cooldownStart } },
      select: { id: true },
    });
    if (recentChallenge) {
      return { message: OTP_REQUEST_MESSAGE };
    }

    const code = generateOtpCode();
    const ttlMinutes = Math.max(1, Number(this.config.get<string>('OTP_TTL_MINUTES', '10')));
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        email,
        codeHash: hashOtp(code, this.config.getOrThrow<string>('OTP_PEPPER')),
        expiresAt: new Date(now.getTime() + ttlMinutes * 60_000),
      },
      select: { id: true },
    });

    try {
      await this.delivery.sendCode(email, code);
    } catch (error) {
      await this.prisma.otpChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      throw error;
    }

    return { message: OTP_REQUEST_MESSAGE };
  }

  async verifyCode(emailAddress: string, code: string): Promise<string> {
    if (!/^\d{6}$/.test(code)) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { email: normalizedEmail(emailAddress), consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const maxAttempts = Math.max(1, Number(this.config.get<string>('OTP_MAX_ATTEMPTS', '5')));
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attemptCount >= maxAttempts) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    const expectedHash = hashOtp(code, this.config.getOrThrow<string>('OTP_PEPPER'));
    if (!hashesMatch(challenge.codeHash, expectedHash)) {
      const updated = await this.prisma.otpChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, attemptCount: challenge.attemptCount },
        data: { attemptCount: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new HttpException(
          'Verification attempts exceeded. Request a new code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    const consumed = await this.prisma.otpChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null, attemptCount: challenge.attemptCount },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    return normalizedEmail(emailAddress);
  }
}

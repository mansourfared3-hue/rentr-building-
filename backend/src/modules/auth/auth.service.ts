import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, type User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OtpService } from './otp.service';

const JWT_ISSUER = 'rentr-connect-api';
const JWT_AUDIENCE = 'rentr-connect';

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: { id: string; email: string; roles: UserRole[] };
}

interface RefreshClaims {
  sub?: unknown;
  jti?: unknown;
  tokenUse?: unknown;
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function hashesMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual, 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  requestOtp(email: string): Promise<{ message: string }> {
    return this.otp.requestCode(email);
  }

  async verifyOtp(email: string, code: string): Promise<AuthSessionResult> {
    const verifiedEmail = await this.otp.verifyCode(email, code);
    const user = await this.prisma.user.upsert({
      where: { email: verifiedEmail },
      create: { email: verifiedEmail, roles: [UserRole.TENANT] },
      update: {},
    });
    return this.issueSession(user);
  }

  async enableOwnerRole(userId: string): Promise<AuthSessionResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('A valid user session is required.');
    const updatedUser = user.roles.includes(UserRole.OWNER)
      ? user
      : await this.prisma.user.update({
          where: { id: userId },
          data: { roles: { push: UserRole.OWNER } },
        });
    return this.issueSession(updatedUser);
  }

  async rotateRefreshToken(refreshToken: string): Promise<AuthSessionResult> {
    let claims: RefreshClaims;
    try {
      claims = await this.jwt.verifyAsync<RefreshClaims>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException('A valid refresh session is required.');
    }

    if (claims.tokenUse !== 'refresh' || typeof claims.sub !== 'string' || typeof claims.jti !== 'string') {
      throw new UnauthorizedException('A valid refresh session is required.');
    }

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: claims.jti },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== claims.sub ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date() ||
      !hashesMatch(session.tokenHash, hashRefreshToken(refreshToken))
    ) {
      throw new UnauthorizedException('A valid refresh session is required.');
    }

    const revoked = await this.prisma.refreshSession.updateMany({
      where: {
        id: session.id,
        tokenHash: session.tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
    if (revoked.count !== 1) {
      throw new UnauthorizedException('A valid refresh session is required.');
    }

    return this.issueSession(session.user);
  }

  async revokeRefreshToken(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const claims = await this.jwt.verifyAsync<RefreshClaims>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      if (claims.tokenUse !== 'refresh' || typeof claims.jti !== 'string') {
        return;
      }
      await this.prisma.refreshSession.updateMany({
        where: { id: claims.jti, tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Logout is idempotent; an invalid or expired cookie is still cleared by the controller.
    }
  }

  private async issueSession(user: User): Promise<AuthSessionResult> {
    const accessTtlSeconds = Math.max(
      60,
      Number(this.config.get<string>('ACCESS_TOKEN_TTL_SECONDS', '900')),
    );
    const refreshTtlDays = Math.max(
      1,
      Number(this.config.get<string>('REFRESH_TOKEN_TTL_DAYS', '30')),
    );
    const sessionId = randomUUID();
    const accessToken = await this.jwt.signAsync(
      { roles: user.roles, tokenUse: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        subject: user.id,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expiresIn: accessTtlSeconds,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { tokenUse: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        subject: user.id,
        jwtid: sessionId,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expiresIn: refreshTtlDays * 24 * 60 * 60,
      },
    );

    await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessTtlSeconds,
      user: { id: user.id, email: user.email, roles: user.roles },
    };
  }
}

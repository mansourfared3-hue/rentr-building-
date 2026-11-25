import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

export interface AuthenticatedPrincipal {
  id: string;
  roles: UserRole[];
}

export type AuthenticatedRequest = Request & { user: AuthenticatedPrincipal };

interface AccessClaims {
  sub?: unknown;
  roles?: unknown;
  tokenUse?: unknown;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    const accessToken = match?.[1] ?? request.cookies?.['rentr_access'];
    if (!accessToken) {
      throw new UnauthorizedException('A valid access token is required.');
    }

    let claims: AccessClaims;
    try {
      claims = await this.jwtService.verifyAsync<AccessClaims>(accessToken, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        issuer: 'rentr-connect-api',
        audience: 'rentr-connect',
      });
    } catch {
      throw new UnauthorizedException('A valid access token is required.');
    }

    const knownRoles = new Set<string>(Object.values(UserRole));
    if (
      typeof claims.sub !== 'string' ||
      claims.tokenUse !== 'access' ||
      !Array.isArray(claims.roles) ||
      !claims.roles.every((role) => typeof role === 'string' && knownRoles.has(role))
    ) {
      throw new UnauthorizedException('A valid access token is required.');
    }

    request.user = { id: claims.sub, roles: claims.roles as UserRole[] };
    return true;
  }
}

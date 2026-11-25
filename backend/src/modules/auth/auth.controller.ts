import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from './guards/jwt-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService, AuthSessionResult } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

const REFRESH_COOKIE = 'rentr_refresh';
const ACCESS_COOKIE = 'rentr_access';
const AUTH_COOKIE_PATH = '/api/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('otp/request')
  requestOtp(@Body() body: CreateAuthDto): Promise<{ message: string }> {
    return this.auth.requestOtp(body.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest): { id: string; roles: UserRole[] } {
    return request.user;
  }

  @Post('roles/owner')
  @UseGuards(JwtAuthGuard)
  async enableOwnerRole(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthSessionResult, 'refreshToken'>> {
    const session = await this.auth.enableOwnerRole(request.user.id);
    response.cookie(REFRESH_COOKIE, session.refreshToken, this.refreshCookieOptions());
    response.cookie(ACCESS_COOKIE, session.accessToken, this.accessCookieOptions());
    const { refreshToken: _refreshToken, ...publicSession } = session;
    return publicSession;
  }

  @Post('otp/verify')
  async verifyOtp(
    @Body() body: UpdateAuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthSessionResult, 'refreshToken'>> {
    const session = await this.auth.verifyOtp(body.email, body.code);
    response.cookie(REFRESH_COOKIE, session.refreshToken, this.refreshCookieOptions());
    response.cookie(ACCESS_COOKIE, session.accessToken, this.accessCookieOptions());
    const { refreshToken: _refreshToken, ...publicSession } = session;
    return publicSession;
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthSessionResult, 'refreshToken'>> {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];
    const session = await this.auth.rotateRefreshToken(refreshToken);
    response.cookie(REFRESH_COOKIE, session.refreshToken, this.refreshCookieOptions());
    response.cookie(ACCESS_COOKIE, session.accessToken, this.accessCookieOptions());
    const { refreshToken: _refreshToken, ...publicSession } = session;
    return publicSession;
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.auth.revokeRefreshToken(request.cookies?.[REFRESH_COOKIE]);
    response.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
    response.clearCookie(ACCESS_COOKIE, this.accessCookieOptions());
    return { success: true };
  }

  private refreshCookieOptions(): CookieOptions {
    const sameSite = this.config.get<string>('COOKIE_SAME_SITE', 'lax');
    const isSecure =
      this.config.get<string>('COOKIE_SECURE') === 'true' ||
      this.config.get<string>('NODE_ENV') === 'production' ||
      sameSite === 'none';
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    const maxAgeDays = Math.max(
      1,
      Number(this.config.get<string>('REFRESH_TOKEN_TTL_DAYS', '30')),
    );
    return {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSite as CookieOptions['sameSite'],
      path: AUTH_COOKIE_PATH,
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
      ...(domain ? { domain } : {}),
    };
  }

  private accessCookieOptions(): CookieOptions {
    const sameSite = this.config.get<string>('COOKIE_SAME_SITE', 'lax');
    const isSecure =
      this.config.get<string>('COOKIE_SECURE') === 'true' ||
      this.config.get<string>('NODE_ENV') === 'production' ||
      sameSite === 'none';
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    const maxAgeSeconds = Math.max(
      60,
      Number(this.config.get<string>('ACCESS_TOKEN_TTL_SECONDS', '900')),
    );
    return {
      httpOnly: true,
      secure: isSecure,
      sameSite: sameSite as CookieOptions['sameSite'],
      path: '/api',
      maxAge: maxAgeSeconds * 1000,
      ...(domain ? { domain } : {}),
    };
  }
}

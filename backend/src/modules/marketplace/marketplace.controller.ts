import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { timingSafeEqual } from 'node:crypto';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateMessageDto,
  CreatePropertyDto,
  CreateRentalRequestDto,
  DecideRentalRequestDto,
  GrantConnectsDto,
  TenantProfileDto,
} from './marketplace.dto';
import { MarketplaceService } from './marketplace.service';
import { PropertyImageStorageService } from './property-image-storage.service';

@Controller()
export class MarketplaceController {
  constructor(
    private readonly marketplace: MarketplaceService,
    private readonly config: ConfigService,
    private readonly imageStorage: PropertyImageStorageService,
  ) {}

  @Get('properties')
  listProperties() {
    return this.marketplace.listProperties();
  }

  @Get('properties/:id')
  getProperty(@Param('id') id: string) {
    return this.marketplace.getProperty(id);
  }

  @Post('properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  createProperty(@Req() request: AuthenticatedRequest, @Body() body: CreatePropertyDto) {
    return this.marketplace.createProperty(request.user.id, body);
  }

  @Post('properties/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @UseInterceptors(
    FilesInterceptor('images', 12, {
      limits: { fileSize: 5 * 1024 * 1024, files: 12 },
      fileFilter: (_request, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          callback(
            new BadRequestException('Only JPEG, PNG, and WebP image files are supported.'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadPropertyImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.imageStorage.upload(files);
  }

  @Get('profiles/me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.marketplace.getTenantProfile(request.user.id);
  }

  @Put('profiles/me')
  @UseGuards(JwtAuthGuard)
  saveProfile(@Req() request: AuthenticatedRequest, @Body() body: TenantProfileDto) {
    return this.marketplace.saveTenantProfile(request.user.id, body);
  }

  @Get('wallet/me')
  @UseGuards(JwtAuthGuard)
  getWallet(@Req() request: AuthenticatedRequest) {
    return this.marketplace.getWallet(request.user.id);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  listNotifications(@Req() request: AuthenticatedRequest) {
    return this.marketplace.listNotifications(request.user.id);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  markNotificationRead(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplace.markNotificationRead(request.user.id, id);
  }

  @Post('wallet/grants')
  grantConnects(
    @Headers('x-internal-admin-token') token: string | undefined,
    @Body() body: GrantConnectsDto,
  ) {
    const expected = this.config.get<string>('INTERNAL_ADMIN_TOKEN');
    if (!token || !expected) throw new UnauthorizedException('Administrative grants are disabled.');
    const actualBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid administrative token.');
    }
    return this.marketplace.grantConnects(body);
  }

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  createRequest(@Req() request: AuthenticatedRequest, @Body() body: CreateRentalRequestDto) {
    return this.marketplace.createRentalRequest(request.user.id, body);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  listRequests(@Req() request: AuthenticatedRequest) {
    return this.marketplace.listRentalRequests(request.user.id);
  }

  @Post('requests/:id/decision')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  decideRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: DecideRentalRequestDto,
  ) {
    return this.marketplace.decideRentalRequest(request.user.id, id, body);
  }

  @Get('requests/:id/messages')
  @UseGuards(JwtAuthGuard)
  listMessages(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplace.listMessages(request.user.id, id);
  }

  @Post('requests/:id/messages')
  @UseGuards(JwtAuthGuard)
  createMessage(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
  ) {
    return this.marketplace.createMessage(request.user.id, id, body);
  }
}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { NotificationEmailService } from './notification-email.service';
import { PropertyImageStorageService } from './property-image-storage.service';
import { WhatsAppAdminNotificationService } from './whatsapp-admin-notification.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    NotificationEmailService,
    PropertyImageStorageService,
    WhatsAppAdminNotificationService,
  ],
})
export class MarketplaceModule {}

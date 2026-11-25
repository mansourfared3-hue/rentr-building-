import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import {
  DevelopmentOtpDeliveryService,
  EmailDeliveryService,
  OtpDeliveryService,
  SmtpEmailDeliveryService,
  SmtpOtpDeliveryService,
} from './otp-delivery.service';
import { OtpService } from './otp.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: EmailDeliveryService,
      useFactory: (config: ConfigService): EmailDeliveryService =>
        new SmtpEmailDeliveryService(config),
      inject: [ConfigService],
    },
    {
      provide: OtpDeliveryService,
      useFactory: (
        config: ConfigService,
        emailDelivery: EmailDeliveryService,
      ): OtpDeliveryService =>
        config.get<string>('SMTP_HOST') && config.get<string>('EMAIL_FROM')
          ? new SmtpOtpDeliveryService(emailDelivery)
          : new DevelopmentOtpDeliveryService(config),
      inject: [ConfigService, EmailDeliveryService],
    },
  ],
  exports: [AuthService, EmailDeliveryService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export abstract class OtpDeliveryService {
  abstract sendCode(email: string, code: string): Promise<void>;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export abstract class EmailDeliveryService {
  abstract isConfigured(): boolean;
  abstract send(message: EmailMessage): Promise<void>;
}

@Injectable()
export class SmtpEmailDeliveryService extends EmailDeliveryService {
  private readonly transport: ReturnType<typeof nodemailer.createTransport> | null;
  private readonly from: string | undefined;

  constructor(config: ConfigService) {
    super();
    const host = config.get<string>('SMTP_HOST');
    this.from = config.get<string>('EMAIL_FROM');
    if (!host || !this.from) {
      this.transport = null;
      return;
    }

    const port = Number(config.get<string>('SMTP_PORT', '587'));
    const user = config.get<string>('SMTP_USER');
    const password = config.get<string>('SMTP_PASSWORD');
    const secure = config.get<string>('SMTP_SECURE', 'false') === 'true';
    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user && password ? { auth: { user, pass: password } } : {}),
    });
  }

  isConfigured(): boolean {
    return this.transport !== null;
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transport || !this.from) {
      throw new ServiceUnavailableException('SMTP email delivery is not configured.');
    }
    await this.transport.sendMail({ from: this.from, ...message });
  }
}

@Injectable()
export class DevelopmentOtpDeliveryService extends OtpDeliveryService {
  private readonly logger = new Logger(DevelopmentOtpDeliveryService.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async sendCode(email: string, code: string): Promise<void> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException('Email OTP delivery is not configured.');
    }
    this.logger.warn(`Development-only OTP for ${email}: ${code}`);
  }
}

@Injectable()
export class SmtpOtpDeliveryService extends OtpDeliveryService {
  constructor(private readonly emailDelivery: EmailDeliveryService) {
    super();
  }

  async sendCode(email: string, code: string): Promise<void> {
    await this.emailDelivery.send({
      to: email,
      subject: 'Your Rentr Connect sign-in code',
      text: `Your Rentr Connect verification code is ${code}. It expires soon. If you did not request it, you can ignore this email.`,
    });
  }
}

import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PROPERTY_IMAGES = 12;

interface ValidatedImage {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
}

function validateImage(file: Express.Multer.File): ValidatedImage {
  const bytes = file.buffer;
  if (bytes.length > MAX_IMAGE_SIZE_BYTES) {
    throw new BadRequestException('Each property image must be 5 MB or smaller.');
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { contentType: 'image/png', extension: 'png' };
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { contentType: 'image/webp', extension: 'webp' };
  }
  throw new BadRequestException('Only valid JPEG, PNG, and WebP image files are supported.');
}

@Injectable()
export class PropertyImageStorageService implements OnModuleDestroy {
  private readonly logger = new Logger(PropertyImageStorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string | undefined;
  private readonly publicBaseUrl: string | undefined;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');
    const region = config.get<string>('S3_REGION')?.trim() || (endpoint ? 'auto' : 'us-east-1');
    this.bucket = config.get<string>('S3_BUCKET');
    this.publicBaseUrl = config.get<string>('S3_PUBLIC_BASE_URL');

    if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
      throw new ServiceUnavailableException(
        'Both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together.',
      );
    }

    this.client = new S3Client({
      region,
      forcePathStyle: Boolean(endpoint),
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }

  async upload(
    files: readonly Express.Multer.File[],
  ): Promise<Array<{ url: string; alt: string }>> {
    if (!this.bucket || !this.publicBaseUrl) {
      throw new ServiceUnavailableException(
        'Property image storage is not configured. Set S3_BUCKET and S3_PUBLIC_BASE_URL.',
      );
    }
    if (files.length < 1 || files.length > MAX_PROPERTY_IMAGES) {
      throw new BadRequestException(`Choose between 1 and ${MAX_PROPERTY_IMAGES} property images.`);
    }

    const validatedFiles = files.map((file) => ({ file, image: validateImage(file) }));
    const uploadedKeys: string[] = [];
    const uploadedImages: Array<{ url: string; alt: string }> = [];
    const baseUrl = this.publicBaseUrl.replace(/\/+$/u, '');

    try {
      for (const { file, image } of validatedFiles) {
        const key = `properties/${randomUUID()}.${image.extension}`;
        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: image.contentType,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        );
        uploadedKeys.push(key);
        const encodedKey = key.split('/').map(encodeURIComponent).join('/');
        uploadedImages.push({
          url: `${baseUrl}/${encodedKey}`,
          alt:
            file.originalname
              .replace(/\.[^.]+$/u, '')
              .replace(/\s+/gu, ' ')
              .trim()
              .slice(0, 240) || 'Property image',
        });
      }
    } catch (error) {
      const cleanupResults = await Promise.allSettled(
        uploadedKeys.map((Key) =>
          this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key })),
        ),
      );
      cleanupResults.forEach((result) => {
        if (result.status === 'rejected') {
          this.logger.error('Failed to remove a partially uploaded property image.', result.reason);
        }
      });
      throw error;
    }

    return uploadedImages;
  }
}

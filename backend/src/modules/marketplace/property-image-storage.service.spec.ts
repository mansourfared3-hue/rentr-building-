import type { ConfigService } from '@nestjs/config';
import { PropertyImageStorageService } from './property-image-storage.service';

describe('PropertyImageStorageService', () => {
  const config = {
    get: (key: string): string | undefined =>
      ({
        S3_BUCKET: 'rentr-images',
        S3_PUBLIC_BASE_URL: 'https://images.example.test',
        S3_ENDPOINT: 'https://s3.example.test',
        S3_REGION: 'auto',
      })[key],
  } as unknown as ConfigService;

  it('rejects non-image file contents rather than trusting the uploaded MIME type', async () => {
    const service = new PropertyImageStorageService(config);
    const file = {
      buffer: Buffer.from('<svg><script>alert(1)</script></svg>'),
      mimetype: 'image/png',
      originalname: 'image.png',
    } as Express.Multer.File;

    await expect(service.upload([file])).rejects.toThrow(
      'Only valid JPEG, PNG, and WebP image files are supported.',
    );
    service.onModuleDestroy();
  });
});

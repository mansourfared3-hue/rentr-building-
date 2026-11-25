import { Controller, Get } from '@nestjs/common';

import type { HelloResponse } from '@rentr/types';

@Controller()
export class AppController {
  @Get()
  getHello(): HelloResponse {
    return { message: 'Hello from rentr-connect API' };
  }

  @Get('health')
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }
}

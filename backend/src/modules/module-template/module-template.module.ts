import { Module } from '@nestjs/common';
import { ModuleTemplateController } from './module-template.controller';
import { ModuleTemplateService } from './module-template.service';

@Module({
  controllers: [ModuleTemplateController],
  providers: [ModuleTemplateService],
  exports: [ModuleTemplateService],
})
export class ModuleTemplateModule {}

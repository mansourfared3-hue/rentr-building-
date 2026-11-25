import { Body, Controller, Post } from '@nestjs/common';
import { CreateModuleTemplateDto } from './dto/create-module-template.dto';
import { UpdateModuleTemplateDto } from './dto/update-module-template.dto';
import { ModuleTemplateService } from './module-template.service';

@Controller('module-template')
export class ModuleTemplateController {
  constructor(private readonly service: ModuleTemplateService) {}

  @Post()
  create(@Body() dto: CreateModuleTemplateDto): { label: string } {
    return this.service.create(dto);
  }

  @Post('update-preview')
  updatePreview(@Body() dto: UpdateModuleTemplateDto): { label: string } {
    return this.service.updatePreview(dto);
  }
}

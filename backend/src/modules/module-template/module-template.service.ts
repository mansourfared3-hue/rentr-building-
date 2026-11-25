import { Injectable } from '@nestjs/common';
import { CreateModuleTemplateDto } from './dto/create-module-template.dto';
import { UpdateModuleTemplateDto } from './dto/update-module-template.dto';

@Injectable()
export class ModuleTemplateService {
  create(dto: CreateModuleTemplateDto): { label: string } {
    return { label: dto.label };
  }

  updatePreview(dto: UpdateModuleTemplateDto): { label: string } {
    return { label: dto.label ?? 'unchanged' };
  }
}

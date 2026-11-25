import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateModuleTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label?: string;
}

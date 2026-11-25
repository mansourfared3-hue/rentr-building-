import { PropertyFurnishing, PropertyType } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TenantProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  occupation!: string;

  @IsBoolean()
  isStudent!: boolean;

  @IsIn(['alone', 'couple', 'family'])
  livingArrangement!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  familySize!: number;

  @IsDateString()
  moveInDate!: string;

  @IsString()
  @MaxLength(1000)
  introduction!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  avatarUrl?: string;
}

export class PropertyImageDto {
  @IsString()
  @MaxLength(2048)
  url!: string;

  @IsString()
  @MaxLength(240)
  alt!: string;
}

export class CreatePropertyDto {
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title!: string;

  @IsEnum(PropertyType)
  type!: PropertyType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  community!: string;

  @IsInt()
  @Min(0)
  @Max(30)
  bedrooms!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  bathrooms!: number;

  @IsInt()
  @Min(10)
  @Max(10000)
  area!: number;

  @IsEnum(PropertyFurnishing)
  furnishing!: PropertyFurnishing;

  @IsInt()
  @Min(1)
  rent!: number;

  @IsDateString()
  availabilityDate!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  description!: string;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => PropertyImageDto)
  images!: PropertyImageDto[];

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  approximateLocation!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address!: string;

  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @IsOptional()
  @IsLongitude()
  longitude?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalInfo?: string;
}

export class CreateRentalRequestDto {
  @IsUUID()
  propertyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class DecideRentalRequestDto {
  @IsIn(['accept', 'reject-profile', 'reject-unavailable'])
  decision!: 'accept' | 'reject-profile' | 'reject-unavailable';
}

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class GrantConnectsDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  amount!: number;
}

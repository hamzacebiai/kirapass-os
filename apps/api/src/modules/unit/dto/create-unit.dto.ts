import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UnitType } from '@prisma/client';

export class CreateUnitDto {
  @IsUUID()
  propertyId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  unitNumber: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;
}

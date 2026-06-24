import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UnitStatus, UnitType } from '@prisma/client';

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unitNumber?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}

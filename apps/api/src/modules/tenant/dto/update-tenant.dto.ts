import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}

import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { RentScheduleStatus } from '@prisma/client';

export class UpdateRentScheduleDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(RentScheduleStatus)
  status?: RentScheduleStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRentScheduleDto {
  @IsUUID()
  leaseId: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsDateString()
  dueDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

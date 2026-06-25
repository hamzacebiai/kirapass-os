import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateLeaseDto {
  @IsUUID()
  unitId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  rentAmount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

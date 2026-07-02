import { IsBoolean, IsEnum, IsInt, IsUUID, Max, Min } from 'class-validator';
import { ScoreCategory } from '@prisma/client';

export class CreateScoreEventDto {
  @IsUUID()
  cycleId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsEnum(ScoreCategory)
  category: ScoreCategory;

  // Whether the category criterion was met this month (all-or-nothing scoring).
  @IsBoolean()
  met: boolean;
}

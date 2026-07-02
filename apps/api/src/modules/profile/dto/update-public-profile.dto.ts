import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePublicProfileDto {
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  showScore?: boolean;

  @IsOptional()
  @IsBoolean()
  showBadges?: boolean;

  @IsOptional()
  @IsBoolean()
  showReviews?: boolean;

  @IsOptional()
  @IsBoolean()
  showName?: boolean;
}

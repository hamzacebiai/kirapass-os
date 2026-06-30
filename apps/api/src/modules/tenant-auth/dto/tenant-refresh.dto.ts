import { IsString } from 'class-validator';

export class TenantRefreshDto {
  @IsString()
  refreshToken: string;
}

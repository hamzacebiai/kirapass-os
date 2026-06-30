import { IsOptional, IsUUID } from 'class-validator';

export class CreateThreadDto {
  @IsUUID()
  tenantId: string;

  @IsOptional()
  @IsUUID()
  leaseId?: string;
}

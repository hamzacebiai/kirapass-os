import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantAuthModule } from '../tenant-auth/tenant-auth.module';

@Module({
  imports: [TenantAuthModule],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}

import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import {
  AgencyProfileController,
  TenantProfileController,
  PublicProfileController,
} from './profile.controller';

@Module({
  controllers: [
    AgencyProfileController,
    TenantProfileController,
    PublicProfileController,
  ],
  providers: [ProfileService],
})
export class ProfileModule {}

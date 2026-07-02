import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdatePublicProfileDto } from './dto/update-public-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';
import { TenantJwtAuthGuard } from '../tenant-auth/guards/tenant-jwt-auth.guard';

// AGENCY: GET /tenants/:id/public-profile
@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgencyProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get(':id/public-profile')
  @Permissions(Permission.TenantRead)
  get(@Param('id') id: string) {
    return this.profile.getForAgency(id);
  }
}

// TENANT: PATCH /tenants/:id/public-profile. The URL :id is IGNORED — the
// tenantId is taken ONLY from the JWT, so a tenant can only edit their own.
@Controller('tenants')
@UseGuards(TenantJwtAuthGuard)
export class TenantProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Patch(':id/public-profile')
  update(
    @Body() dto: UpdatePublicProfileDto,
    @Req() req: { user?: { tenantId?: string } },
  ) {
    return this.profile.updateForTenant(req.user?.tenantId ?? '', dto);
  }
}

// PUBLIC: GET /p/:slug — no auth. Only opted-in fields are returned.
@Controller('p')
export class PublicProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.profile.getPublic(slug);
  }
}

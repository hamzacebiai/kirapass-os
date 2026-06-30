import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';
import { TenantAuthService } from '../tenant-auth/tenant-auth.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantController {
  constructor(
    private readonly tenants: TenantService,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  @Post()
  @Permissions(Permission.TenantWrite)
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Get()
  @Permissions(Permission.TenantRead)
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.tenants.list(page, pageSize, includeArchived);
  }

  @Get(':id')
  @Permissions(Permission.TenantRead)
  getById(@Param('id') id: string) {
    return this.tenants.getById(id);
  }

  @Patch(':id')
  @Permissions(Permission.TenantWrite)
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(id, dto);
  }

  @Patch(':id/archive')
  @Permissions(Permission.TenantDelete)
  archive(@Param('id') id: string) {
    return this.tenants.archive(id);
  }

  // Mint a tenant-portal invite token (returned to the agency UI).
  @Post(':id/invite')
  @Permissions(Permission.TenantWrite)
  invite(@Param('id') id: string) {
    return this.tenantAuth.createInvite(id);
  }
}

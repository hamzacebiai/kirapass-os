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
import { LeaseService } from './lease.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

@Controller('leases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaseController {
  constructor(private readonly leases: LeaseService) {}

  @Post()
  @Permissions(Permission.LeaseWrite)
  create(@Body() dto: CreateLeaseDto) {
    return this.leases.create(dto);
  }

  @Get()
  @Permissions(Permission.LeaseRead)
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.leases.list(page, pageSize, includeArchived);
  }

  @Get(':id')
  @Permissions(Permission.LeaseRead)
  getById(@Param('id') id: string) {
    return this.leases.getById(id);
  }

  @Patch(':id')
  @Permissions(Permission.LeaseWrite)
  update(@Param('id') id: string, @Body() dto: UpdateLeaseDto) {
    return this.leases.update(id, dto);
  }

  @Patch(':id/archive')
  @Permissions(Permission.LeaseDelete)
  archive(@Param('id') id: string) {
    return this.leases.archive(id);
  }

  @Patch(':id/activate')
  @Permissions(Permission.LeaseWrite)
  activate(@Param('id') id: string) {
    return this.leases.activate(id);
  }

  @Patch(':id/expire')
  @Permissions(Permission.LeaseWrite)
  expire(@Param('id') id: string) {
    return this.leases.expire(id);
  }

  @Patch(':id/terminate')
  @Permissions(Permission.LeaseWrite)
  terminate(@Param('id') id: string) {
    return this.leases.terminate(id);
  }
}

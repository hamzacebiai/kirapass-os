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
import { OwnerService } from './owner.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

@Controller('owners')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OwnerController {
  constructor(private readonly owners: OwnerService) {}

  @Post()
  @Permissions(Permission.OwnerWrite)
  create(@Body() dto: CreateOwnerDto) {
    return this.owners.create(dto);
  }

  @Get()
  @Permissions(Permission.OwnerRead)
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.owners.list(page, pageSize, includeArchived);
  }

  @Get(':id')
  @Permissions(Permission.OwnerRead)
  getById(@Param('id') id: string) {
    return this.owners.getById(id);
  }

  @Patch(':id')
  @Permissions(Permission.OwnerWrite)
  update(@Param('id') id: string, @Body() dto: UpdateOwnerDto) {
    return this.owners.update(id, dto);
  }

  @Patch(':id/archive')
  @Permissions(Permission.OwnerDelete)
  archive(@Param('id') id: string) {
    return this.owners.archive(id);
  }
}

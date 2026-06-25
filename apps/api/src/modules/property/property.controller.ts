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
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

@Controller('properties')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PropertyController {
  constructor(private readonly properties: PropertyService) {}

  @Post()
  @Permissions(Permission.PropertyWrite)
  create(@Body() dto: CreatePropertyDto) {
    return this.properties.create(dto);
  }

  @Get()
  @Permissions(Permission.PropertyRead)
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.properties.list(page, pageSize, includeArchived);
  }

  @Get(':id')
  @Permissions(Permission.PropertyRead)
  getById(@Param('id') id: string) {
    return this.properties.getById(id);
  }

  @Patch(':id')
  @Permissions(Permission.PropertyWrite)
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(id, dto);
  }

  @Patch(':id/archive')
  @Permissions(Permission.PropertyDelete)
  archive(@Param('id') id: string) {
    return this.properties.archive(id);
  }
}

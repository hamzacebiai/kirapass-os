import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

@Controller('units')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UnitController {
  constructor(private readonly units: UnitService) {}

  @Post()
  @Permissions(Permission.UnitWrite)
  create(@Body() dto: CreateUnitDto) {
    return this.units.create(dto);
  }

  @Get()
  @Permissions(Permission.UnitRead)
  list() {
    return this.units.list();
  }

  @Get(':id')
  @Permissions(Permission.UnitRead)
  getById(@Param('id') id: string) {
    return this.units.getById(id);
  }

  @Patch(':id')
  @Permissions(Permission.UnitWrite)
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.units.update(id, dto);
  }

  @Patch(':id/archive')
  @Permissions(Permission.UnitDelete)
  archive(@Param('id') id: string) {
    return this.units.archive(id);
  }
}

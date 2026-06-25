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
import { RentScheduleService } from './rent-schedule.service';
import { CreateRentScheduleDto } from './dto/create-rent-schedule.dto';
import { UpdateRentScheduleDto } from './dto/update-rent-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

@Controller('rent-schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RentScheduleController {
  constructor(private readonly rentSchedules: RentScheduleService) {}

  @Post()
  @Permissions(Permission.RentScheduleWrite)
  create(@Body() dto: CreateRentScheduleDto) {
    return this.rentSchedules.create(dto);
  }

  @Get()
  @Permissions(Permission.RentScheduleRead)
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.rentSchedules.list(page, pageSize, includeArchived);
  }

  @Get(':id')
  @Permissions(Permission.RentScheduleRead)
  getById(@Param('id') id: string) {
    return this.rentSchedules.getById(id);
  }

  @Patch(':id')
  @Permissions(Permission.RentScheduleWrite)
  update(@Param('id') id: string, @Body() dto: UpdateRentScheduleDto) {
    return this.rentSchedules.update(id, dto);
  }

  @Patch(':id/cancel')
  @Permissions(Permission.RentScheduleDelete)
  cancel(@Param('id') id: string) {
    return this.rentSchedules.cancel(id);
  }
}

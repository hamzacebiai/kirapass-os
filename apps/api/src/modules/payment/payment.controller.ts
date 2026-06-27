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
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post()
  @Permissions(Permission.PaymentWrite)
  create(@Body() dto: CreatePaymentDto) {
    return this.payments.create(dto);
  }

  @Get()
  @Permissions(Permission.PaymentRead)
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.payments.list(page, pageSize, includeArchived);
  }

  @Get(':id')
  @Permissions(Permission.PaymentRead)
  getById(@Param('id') id: string) {
    return this.payments.getById(id);
  }

  @Patch(':id')
  @Permissions(Permission.PaymentWrite)
  update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.payments.update(id, dto);
  }

  @Patch(':id/void')
  @Permissions(Permission.PaymentDelete)
  void(@Param('id') id: string) {
    return this.payments.void(id);
  }

  @Patch(':id/pay')
  @Permissions(Permission.PaymentWrite)
  markAsPaid(@Param('id') id: string) {
    return this.payments.markAsPaid(id);
  }
}

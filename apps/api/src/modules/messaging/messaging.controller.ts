import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';

// AGENCY side. JwtAuthGuard + PermissionsGuard: a tenant token (no role) is
// rejected by PermissionsGuard, so it can never reach agency-wide threads.
@Controller('messaging')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Post('threads')
  @Permissions(Permission.TenantWrite)
  createThread(@Body() dto: CreateThreadDto) {
    return this.messaging.createThread(dto);
  }

  @Get('threads')
  @Permissions(Permission.TenantRead)
  listThreads() {
    return this.messaging.listThreads();
  }

  @Get('threads/:id')
  @Permissions(Permission.TenantRead)
  getThread(@Param('id') id: string) {
    return this.messaging.getThread(id);
  }

  @Post('threads/:id/messages')
  @Permissions(Permission.TenantWrite)
  sendMessage(@Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.messaging.sendMessage(id, dto);
  }

  @Patch('threads/:id/read')
  @Permissions(Permission.TenantWrite)
  markAsRead(@Param('id') id: string) {
    return this.messaging.markAsRead(id);
  }
}

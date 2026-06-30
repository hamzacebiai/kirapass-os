import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantMessagingService } from './tenant-messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { TenantJwtAuthGuard } from '../tenant-auth/guards/tenant-jwt-auth.guard';

// TENANT side. tenantId comes ONLY from the validated JWT (req.user.tenantId,
// set by TenantJwtStrategy) — never from a URL param or body.
@Controller('tenant-messaging')
@UseGuards(TenantJwtAuthGuard)
export class TenantMessagingController {
  constructor(private readonly messaging: TenantMessagingService) {}

  private tenantId(req: { user?: { tenantId?: string } }): string {
    return req.user?.tenantId ?? '';
  }

  @Get('threads')
  listMyThreads(@Req() req: { user?: { tenantId?: string } }) {
    return this.messaging.listMyThreads(this.tenantId(req));
  }

  @Get('threads/:id')
  getMyThread(
    @Param('id') id: string,
    @Req() req: { user?: { tenantId?: string } },
  ) {
    return this.messaging.getMyThread(id, this.tenantId(req));
  }

  @Post('threads/:id/messages')
  sendMyMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @Req() req: { user?: { tenantId?: string } },
  ) {
    return this.messaging.sendMyMessage(id, this.tenantId(req), dto);
  }

  @Patch('threads/:id/read')
  markMyRead(
    @Param('id') id: string,
    @Req() req: { user?: { tenantId?: string } },
  ) {
    return this.messaging.markMyRead(id, this.tenantId(req));
  }
}

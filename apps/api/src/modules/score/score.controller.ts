import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ScoreService } from './score.service';
import { CreateScoreEventDto } from './dto/create-score-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';
import { TenantJwtAuthGuard } from '../tenant-auth/guards/tenant-jwt-auth.guard';

// AGENCY side. POST /score/events is internal (invoked by a future scheduler)
// but guarded as an agency mutation so it is never publicly reachable.
@Controller('score')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScoreController {
  constructor(private readonly score: ScoreService) {}

  @Get('tenants/:id')
  @Permissions(Permission.TenantRead)
  getTenantScore(@Param('id') id: string) {
    return this.score.getTenantScore(id);
  }

  @Post('events')
  @Permissions(Permission.TenantWrite)
  addEvent(@Body() dto: CreateScoreEventDto) {
    return this.score.addEvent(dto);
  }
}

// TENANT side. tenantId comes ONLY from the validated JWT.
@Controller('tenant-score')
@UseGuards(TenantJwtAuthGuard)
export class TenantScoreController {
  constructor(private readonly score: ScoreService) {}

  @Get('my')
  getMyScore(@Req() req: { user?: { tenantId?: string } }) {
    return this.score.getMyScore(req.user?.tenantId ?? '');
  }
}

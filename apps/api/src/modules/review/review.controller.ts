import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/authz/permissions.enum';
import { TenantJwtAuthGuard } from '../tenant-auth/guards/tenant-jwt-auth.guard';

// Agency: POST /leases/:id/review. PermissionsGuard added (spec said only
// JwtAuthGuard) so a tenant token — which has no role — is rejected here.
@Controller('leases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaseReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Post(':id/review')
  @Permissions(Permission.LeaseWrite)
  create(@Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.reviews.createAgencyReview(id, dto);
  }
}

// Agency: GET /tenants/:id/reviews
@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantReviewsController {
  constructor(private readonly reviews: ReviewService) {}

  @Get(':id/reviews')
  @Permissions(Permission.TenantRead)
  list(@Param('id') id: string) {
    return this.reviews.getTenantReviews(id);
  }
}

// Tenant: POST /tenant-leases/:id/review (tenantId ONLY from JWT).
@Controller('tenant-leases')
@UseGuards(TenantJwtAuthGuard)
export class TenantLeaseReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Post(':id/review')
  create(
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
    @Req() req: { user?: { tenantId?: string } },
  ) {
    return this.reviews.createTenantReview(id, req.user?.tenantId ?? '', dto);
  }
}

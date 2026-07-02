import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReviewerRole } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

const REVIEW_WINDOW_DAYS = 30;

/**
 * A lease is reviewable only if it is EXPIRED or TERMINATED and we are still
 * within 30 days of its end date. Pure + exported for unit testing.
 */
export function reviewWindowOpen(
  status: string,
  endDate: Date,
  now: Date = new Date(),
): { ok: boolean; reason?: string } {
  if (status !== 'EXPIRED' && status !== 'TERMINATED') {
    return {
      ok: false,
      reason: 'Only expired or terminated leases can be reviewed',
    };
  }
  const deadline = new Date(
    new Date(endDate).getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  if (now > deadline) {
    return { ok: false, reason: 'Review window closed (30 days after lease end)' };
  }
  return { ok: true };
}

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: TenantPrismaService) {}

  private assertOpen(lease: { status: string; endDate: Date }) {
    const r = reviewWindowOpen(lease.status, lease.endDate);
    if (!r.ok) throw new BadRequestException(r.reason);
  }

  // Agency reviews its own lease (findFirst is agency-scoped by middleware).
  async createAgencyReview(leaseId: string, dto: CreateReviewDto) {
    const lease = await this.prisma.lease.findFirst({ where: { id: leaseId } });
    if (!lease) throw new NotFoundException('Lease not found');
    this.assertOpen(lease);
    return this.persist(lease.id, lease.agencyId, 'AGENCY', dto);
  }

  // Tenant reviews their OWN lease (tenantId from JWT; agency-scope also applies).
  async createTenantReview(
    leaseId: string,
    tenantId: string,
    dto: CreateReviewDto,
  ) {
    const lease = await this.prisma.lease.findFirst({
      where: { id: leaseId, tenantId },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    this.assertOpen(lease);
    return this.persist(lease.id, lease.agencyId, 'TENANT', dto);
  }

  private async persist(
    leaseId: string,
    agencyId: string,
    reviewerRole: ReviewerRole,
    dto: CreateReviewDto,
  ) {
    try {
      return await this.prisma.leaseReview.create({
        data: {
          leaseId,
          agencyId,
          reviewerRole,
          rating: dto.rating,
          comment: dto.comment ?? null,
          isPublic: dto.isPublic ?? false,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'This lease has already been reviewed by this role',
        );
      }
      throw e;
    }
  }

  // Agency: all reviews across a tenant's leases (agency-scoped by middleware).
  getTenantReviews(tenantId: string) {
    return this.prisma.leaseReview.findMany({
      where: { lease: { tenantId } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

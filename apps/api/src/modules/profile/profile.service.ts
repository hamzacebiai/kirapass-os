import { Injectable, NotFoundException } from '@nestjs/common';
import { BadgeType } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { UpdatePublicProfileDto } from './dto/update-public-profile.dto';

const BADGE_RANK: BadgeType[] = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];

function highestBadge(badges: { badgeType: BadgeType }[]): BadgeType | null {
  for (const b of BADGE_RANK) {
    if (badges.some((x) => x.badgeType === b)) return b;
  }
  return null;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: TenantPrismaService) {}

  private async getOrCreate(tenantId: string) {
    const existing = await this.prisma.tenantPublicProfile.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;
    const shareableSlug = `trust-${randomBytes(4).toString('hex')}`;
    return this.prisma.tenantPublicProfile.create({
      data: { tenantId, shareableSlug },
    });
  }

  // AGENCY view: tenant must belong to the caller agency (Tenant is scoped).
  async getForAgency(tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.getOrCreate(tenantId);
  }

  // TENANT self-service: tenantId comes ONLY from the JWT (never the URL).
  async updateForTenant(tenantId: string, dto: UpdatePublicProfileDto) {
    const profile = await this.getOrCreate(tenantId);
    return this.prisma.tenantPublicProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.showScore !== undefined && { showScore: dto.showScore }),
        ...(dto.showBadges !== undefined && { showBadges: dto.showBadges }),
        ...(dto.showReviews !== undefined && { showReviews: dto.showReviews }),
        ...(dto.showName !== undefined && { showName: dto.showName }),
      },
    });
  }

  // PUBLIC by slug. Only exposes what the tenant opted in to; 404 if not public.
  async getPublic(slug: string) {
    const profile = await this.prisma.tenantPublicProfile.findUnique({
      where: { shareableSlug: slug },
    });
    if (!profile || !profile.isPublic) {
      throw new NotFoundException('Profile not found');
    }
    const tenantId = profile.tenantId;

    let badge: BadgeType | null = null;
    if (profile.showBadges) {
      const badges = await this.prisma.tenantBadge.findMany({
        where: { tenantId },
      });
      badge = highestBadge(badges);
    }

    let currentScore: number | undefined;
    let perfectMonths: number | undefined;
    let totalMonths: number | undefined;
    if (profile.showScore) {
      const cycles = await this.prisma.tenantScoreCycle.findMany({
        where: { tenantId },
        include: { snapshots: true },
      });
      const snaps = cycles.flatMap((c) => c.snapshots);
      currentScore = snaps.reduce((s, x) => s + x.totalPoints, 0);
      perfectMonths = snaps.filter((s) => s.isPerfect).length;
      totalMonths = snaps.length;
    }

    let reviews: { rating: number; comment: string | null; date: Date }[] = [];
    if (profile.showReviews) {
      const rows = await this.prisma.leaseReview.findMany({
        where: { isPublic: true, lease: { tenantId } },
        orderBy: { createdAt: 'desc' },
      });
      reviews = rows.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt,
      }));
    }

    let name: string | undefined;
    if (profile.showName) {
      const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (t) name = `${t.firstName} ${t.lastName.charAt(0)}.`;
    }

    return {
      slug: profile.shareableSlug,
      badge,
      currentScore,
      perfectMonths,
      totalMonths,
      reviews,
      ...(name ? { name } : {}),
    };
  }
}

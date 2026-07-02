import { Injectable, NotFoundException } from '@nestjs/common';
import { BadgeType, ScoreCategory } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateScoreEventDto } from './dto/create-score-event.dto';

// ── Fixed scoring rules (hard-coded per spec) ──────────────────────
export const SCORE_POINTS: Record<ScoreCategory, number> = {
  RENT_ONTIME: 6, // due day or earlier → 6, one day late → 0
  MESSAGE_REPLY: 2, // reply within 1h in 08–23 window → 2, else 0
  LOGIN_ACTIVITY: 1, // 3+ logins in the month → 1
  NO_VIOLATION: 1, // no complaint that month → 1
};
export const MAX_MONTHLY_SCORE = 10;

/** All-or-nothing: full category points when met, otherwise zero. */
export function pointsFor(category: ScoreCategory, met: boolean): number {
  return met ? SCORE_POINTS[category] : 0;
}

/** Longest run of months whose monthly score is >= threshold. */
export function maxConsecutive(scores: number[], threshold: number): number {
  let best = 0;
  let cur = 0;
  for (const s of scores) {
    if (s >= threshold) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

/**
 * Platinum: 12 months all perfect (10/10), with AT MOST one "joker" month
 * (a single non-perfect month is forgiven). Two or more non-perfect → not
 * eligible (joker can be used only once).
 */
export function isPlatinumEligible(monthlyPerfect: boolean[]): {
  eligible: boolean;
  jokerUsed: boolean;
} {
  if (monthlyPerfect.length < 12) return { eligible: false, jokerUsed: false };
  const window = monthlyPerfect.slice(0, 12);
  const imperfect = window.filter((p) => !p).length;
  if (imperfect === 0) return { eligible: true, jokerUsed: false };
  if (imperfect === 1) return { eligible: true, jokerUsed: true };
  return { eligible: false, jokerUsed: false };
}

/** Badge thresholds (hard-coded per spec). */
export function badgesEarned(
  scores: number[],
  perfect: boolean[],
): BadgeType[] {
  const badges: BadgeType[] = [];
  if (maxConsecutive(scores, 8) >= 3) badges.push('BRONZE');
  if (maxConsecutive(scores, 8) >= 6) badges.push('SILVER');
  if (maxConsecutive(scores, 9) >= 9) badges.push('GOLD');
  if (isPlatinumEligible(perfect).eligible) badges.push('PLATINUM');
  return badges;
}

@Injectable()
export class ScoreService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // TenantScoreCycle is in TENANT_MODELS → findFirst is agency-scoped.
  private async getAgencyCycle(cycleId: string) {
    const cycle = await this.prisma.tenantScoreCycle.findFirst({
      where: { id: cycleId },
    });
    if (!cycle) throw new NotFoundException('Score cycle not found');
    return cycle;
  }

  async addEvent(dto: CreateScoreEventDto) {
    const cycle = await this.getAgencyCycle(dto.cycleId);
    const points = pointsFor(dto.category, dto.met);
    const event = await this.prisma.scoreEvent.create({
      data: {
        cycleId: cycle.id,
        month: dto.month,
        category: dto.category,
        points,
      },
    });
    await this.recomputeSnapshot(cycle.id, dto.month);
    await this.evaluate(cycle.id, cycle.tenantId, cycle.leaseId, cycle.status);
    return event;
  }

  private async recomputeSnapshot(cycleId: string, month: number) {
    const events = await this.prisma.scoreEvent.findMany({
      where: { cycleId, month },
    });
    const total = Math.min(
      events.reduce((s, e) => s + e.points, 0),
      MAX_MONTHLY_SCORE,
    );
    const isPerfect = total >= MAX_MONTHLY_SCORE;
    await this.prisma.monthlyScoreSnapshot.upsert({
      where: { cycleId_month: { cycleId, month } },
      update: { totalPoints: total, isPerfect, computedAt: new Date() },
      create: { cycleId, month, totalPoints: total, isPerfect },
    });
  }

  private async evaluate(
    cycleId: string,
    tenantId: string,
    leaseId: string,
    status: string,
  ) {
    const snapshots = await this.prisma.monthlyScoreSnapshot.findMany({
      where: { cycleId },
      orderBy: { month: 'asc' },
    });
    const scores = snapshots.map((s) => s.totalPoints);
    const perfect = snapshots.map((s) => s.isPerfect);

    // Award any newly-earned badges (idempotent per tenant + type).
    for (const bt of badgesEarned(scores, perfect)) {
      const exists = await this.prisma.tenantBadge.findFirst({
        where: { tenantId, badgeType: bt },
      });
      if (!exists) {
        await this.prisma.tenantBadge.create({
          data: { tenantId, badgeType: bt },
        });
      }
    }

    // Platinum completion → reward claim (ELIGIBLE, awaits approval) + close.
    const plat = isPlatinumEligible(perfect);
    if (plat.eligible && status === 'ACTIVE') {
      const existing = await this.prisma.rewardClaim.findFirst({
        where: { cycleId },
      });
      if (!existing) {
        const lease = await this.prisma.lease.findFirst({
          where: { id: leaseId },
        });
        await this.prisma.rewardClaim.create({
          data: {
            cycleId,
            tenantId,
            leaseId,
            rentAmount: lease?.rentAmount ?? 0,
            status: 'ELIGIBLE',
          },
        });
      }
      await this.prisma.tenantScoreCycle.updateMany({
        where: { id: cycleId },
        data: { status: 'COMPLETED', jokerUsed: plat.jokerUsed },
      });
    }
  }

  // AGENCY view of a tenant's score (agency-scoped by middleware + tenantId).
  async getTenantScore(tenantId: string) {
    const cycles = await this.prisma.tenantScoreCycle.findMany({
      where: { tenantId },
      include: { snapshots: { orderBy: { month: 'asc' } } },
      orderBy: { cycleYear: 'desc' },
    });
    const badges = await this.prisma.tenantBadge.findMany({
      where: { tenantId },
    });
    return { cycles, badges };
  }

  // TENANT view of OWN score. tenantId comes ONLY from the JWT.
  async getMyScore(tenantId: string) {
    const cycles = await this.prisma.tenantScoreCycle.findMany({
      where: { tenantId },
      include: { snapshots: { orderBy: { month: 'asc' } } },
      orderBy: { cycleYear: 'desc' },
    });
    const badges = await this.prisma.tenantBadge.findMany({
      where: { tenantId },
    });
    return { cycles, badges };
  }
}

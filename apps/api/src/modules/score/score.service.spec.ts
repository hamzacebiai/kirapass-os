import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  ScoreService,
  pointsFor,
  isPlatinumEligible,
  SCORE_POINTS,
} from './score.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = {
  tenantScoreCycle: {
    findFirst: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  scoreEvent: {
    create: jest.fn().mockResolvedValue({ id: 'e1' }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  monthlyScoreSnapshot: {
    upsert: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  tenantBadge: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
  },
  rewardClaim: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
  },
  lease: { findFirst: jest.fn().mockResolvedValue({ rentAmount: 1000 }) },
};

describe('ScoreService', () => {
  let service: ScoreService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ScoreService,
        { provide: TenantPrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ScoreService);
    jest.clearAllMocks();
    prisma.tenantScoreCycle.findMany.mockResolvedValue([]);
    prisma.scoreEvent.findMany.mockResolvedValue([]);
    prisma.monthlyScoreSnapshot.findMany.mockResolvedValue([]);
    prisma.tenantBadge.findFirst.mockResolvedValue(null);
    prisma.rewardClaim.findFirst.mockResolvedValue(null);
  });

  it('critical: RENT_ONTIME scores exactly 6 when met (0 when not)', () => {
    expect(SCORE_POINTS.RENT_ONTIME).toBe(6);
    expect(pointsFor('RENT_ONTIME', true)).toBe(6);
    expect(pointsFor('RENT_ONTIME', false)).toBe(0);
  });

  it('critical: joker can be used only once', () => {
    const twelvePerfect = Array<boolean>(12).fill(true);
    expect(isPlatinumEligible(twelvePerfect)).toEqual({
      eligible: true,
      jokerUsed: false,
    });

    const oneJoker = [...Array<boolean>(11).fill(true), false];
    expect(isPlatinumEligible(oneJoker)).toEqual({
      eligible: true,
      jokerUsed: true,
    });

    // two non-perfect months → joker exhausted → not eligible
    const twoMisses = [...Array<boolean>(10).fill(true), false, false];
    expect(isPlatinumEligible(twoMisses)).toEqual({
      eligible: false,
      jokerUsed: false,
    });
  });

  it('happy: event can be added to an owned cycle (points computed)', async () => {
    prisma.tenantScoreCycle.findFirst.mockResolvedValue({
      id: 'c1',
      tenantId: 't1',
      leaseId: 'l1',
      agencyId: 'a1',
      status: 'ACTIVE',
    });
    await service.addEvent({
      cycleId: 'c1',
      month: 3,
      category: 'RENT_ONTIME',
      met: true,
    });
    expect(prisma.scoreEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.scoreEvent.create.mock.calls[0][0].data.points).toBe(6);
  });

  it('fail: adding an event to a non-owned cycle → NotFound, no event created', async () => {
    prisma.tenantScoreCycle.findFirst.mockResolvedValue(null); // agency scope hides it
    await expect(
      service.addEvent({
        cycleId: 'someone-elses',
        month: 3,
        category: 'RENT_ONTIME',
        met: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.scoreEvent.create).not.toHaveBeenCalled();
  });
});

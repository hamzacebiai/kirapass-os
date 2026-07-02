import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewService, reviewWindowOpen } from './review.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

const prisma = {
  lease: { findFirst: jest.fn() },
  leaseReview: { create: jest.fn().mockResolvedValue({ id: 'r1' }), findMany: jest.fn() },
};

const END = new Date('2026-01-01T00:00:00Z');
const WITHIN = new Date('2026-01-20T00:00:00Z'); // 19 days after end
const AFTER = new Date('2026-03-01T00:00:00Z'); // > 30 days after end

describe('reviewWindowOpen', () => {
  it('ACTIVE lease → not reviewable', () => {
    expect(reviewWindowOpen('ACTIVE', END, WITHIN).ok).toBe(false);
  });
  it('EXPIRED within 30 days → reviewable', () => {
    expect(reviewWindowOpen('EXPIRED', END, WITHIN).ok).toBe(true);
  });
  it('TERMINATED within 30 days → reviewable', () => {
    expect(reviewWindowOpen('TERMINATED', END, WITHIN).ok).toBe(true);
  });
  it('EXPIRED after 30 days → window closed', () => {
    expect(reviewWindowOpen('EXPIRED', END, AFTER).ok).toBe(false);
  });
});

describe('ReviewService', () => {
  let service: ReviewService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: TenantPrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ReviewService);
    jest.clearAllMocks();
  });

  it('fail: tenant reviewing a lease that is not theirs → NotFound', async () => {
    prisma.lease.findFirst.mockResolvedValue(null); // scoped away
    await expect(
      service.createTenantReview('lease-x', 'attacker', { rating: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.leaseReview.create).not.toHaveBeenCalled();
  });

  it('fail: reviewing an ACTIVE lease → BadRequest', async () => {
    prisma.lease.findFirst.mockResolvedValue({
      id: 'l1',
      agencyId: 'a1',
      status: 'ACTIVE',
      endDate: new Date(),
    });
    await expect(
      service.createAgencyReview('l1', { rating: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.leaseReview.create).not.toHaveBeenCalled();
  });
});

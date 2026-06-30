const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  tenantRefreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { TenantAuthService } from './tenant-auth.service';

describe('TenantAuthService', () => {
  let service: TenantAuthService;
  let signedPayload: Record<string, unknown> | undefined;

  const jwt = {
    sign: jest.fn((p: Record<string, unknown>) => {
      signedPayload = p;
      return 'signed.jwt.token';
    }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [TenantAuthService, { provide: JwtService, useValue: jwt }],
    }).compile();
    service = moduleRef.get(TenantAuthService);
    signedPayload = undefined;
    jest.clearAllMocks();
  });

  it('happy: acceptInvite hashes password + clears invite token', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 't1',
      inviteExpiresAt: new Date(Date.now() + 3_600_000),
    });
    mockPrisma.tenant.update.mockResolvedValue({});

    await service.acceptInvite('valid-token', 'StrongPass123');

    const arg = mockPrisma.tenant.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 't1' });
    expect(typeof arg.data.passwordHash).toBe('string');
    expect(arg.data.passwordHash).not.toBe('StrongPass123'); // hashed
    expect(arg.data.inviteToken).toBeNull();
    expect(arg.data.passwordSetAt).toBeInstanceOf(Date);
  });

  it('fail: expired invite token is rejected', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 't1',
      inviteExpiresAt: new Date(Date.now() - 1_000),
    });
    await expect(
      service.acceptInvite('expired-token', 'StrongPass123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fail: wrong password login is rejected', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mockPrisma.tenant.findFirst.mockResolvedValue({
      id: 't1',
      agencyId: 'a1',
      email: 't@example.com',
      firstName: 'E2E',
      lastName: 'Test',
      passwordHash,
    });
    await expect(
      service.login('t@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('CRITICAL: tenant JWT payload carries type === "tenant"', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mockPrisma.tenant.findFirst.mockResolvedValue({
      id: 't1',
      agencyId: 'a1',
      email: 't@example.com',
      firstName: 'E2E',
      lastName: 'Test',
      passwordHash,
    });
    mockPrisma.tenantRefreshToken.create.mockResolvedValue({});

    await service.login('t@example.com', 'correct-password');

    expect(signedPayload).toBeDefined();
    expect(signedPayload?.type).toBe('tenant');
    expect(signedPayload?.tenantId).toBe('t1');
    expect(signedPayload?.agencyId).toBe('a1');
  });
});

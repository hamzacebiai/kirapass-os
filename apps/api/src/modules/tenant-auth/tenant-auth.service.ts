import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';

// Standalone client (mirrors AuthService): tenant-auth queries cross-agency by
// email/token and must NOT be tenant-scoped by the request middleware.
const prisma = new PrismaClient();

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TenantAuthService {
  constructor(private readonly jwtService: JwtService) {}

  // Agency-side: mint a one-time invite token (72h). Returned to the agency UI
  // (no e-mail yet); the agency shares it with the tenant out-of-band.
  async createInvite(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { inviteToken, inviteExpiresAt },
    });
    return { inviteToken, inviteExpiresAt };
  }

  // Tenant sets their password using a valid, unexpired invite token.
  async acceptInvite(token: string, password: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { inviteToken: token },
    });
    if (
      !tenant ||
      !tenant.inviteExpiresAt ||
      tenant.inviteExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired invite token');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        passwordHash,
        passwordSetAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });
    return { message: 'Password set successfully' };
  }

  async login(email: string, password: string) {
    const tenant = await prisma.tenant.findFirst({
      where: { email, status: { not: 'ARCHIVED' } },
    });
    if (!tenant || !tenant.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, tenant.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token, refreshToken } = await this.issueTokens(
      tenant.id,
      tenant.agencyId,
    );
    return {
      token,
      refreshToken,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        agencyId: tenant.agencyId,
      },
    };
  }

  // CRITICAL: payload carries `type: 'tenant'` so tenant tokens are
  // distinguishable from agency tokens (TenantJwtStrategy enforces it).
  private generateToken(tenantId: string, agencyId: string) {
    return this.jwtService.sign({
      sub: tenantId,
      tenantId,
      agencyId,
      type: 'tenant',
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(tenantId: string, agencyId: string) {
    const token = this.generateToken(tenantId, agencyId);
    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    await prisma.tenantRefreshToken.create({
      data: { token: this.hashToken(refreshToken), tenantId, expiresAt },
    });
    return { token, refreshToken };
  }

  // Rotate: validate + revoke old, issue new. Reused/revoked/expired rejected.
  async refresh(refreshToken: string) {
    const row = await prisma.tenantRefreshToken.findUnique({
      where: { token: this.hashToken(refreshToken) },
      include: { tenant: true },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const issued = await this.issueTokens(row.tenant.id, row.tenant.agencyId);
    await prisma.tenantRefreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    return issued;
  }

  async logout(refreshToken: string) {
    await prisma.tenantRefreshToken.updateMany({
      where: { token: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out' };
  }
}

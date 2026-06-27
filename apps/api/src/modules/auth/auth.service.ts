import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { RegisterAgencyDto } from './dto/register-agency.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../../common/audit/audit.service';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  async registerAgency(dto: RegisterAgencyDto) {
    const existingAgency = await prisma.agency.findUnique({
      where: { slug: dto.agencySlug },
    });
    if (existingAgency) {
      throw new ConflictException('Agency slug already exists');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: dto.ownerEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const agency = await prisma.agency.create({
      data: {
        name: dto.agencyName,
        slug: dto.agencySlug,
        email: dto.agencyEmail,
        phone: dto.agencyPhone,
        users: {
          create: {
            email: dto.ownerEmail,
            passwordHash,
            firstName: dto.ownerFirstName,
            lastName: dto.ownerLastName,
            role: UserRole.AGENCY_OWNER,
          },
        },
      },
      include: { users: true },
    });

    const owner = agency.users[0];
    const { token, refreshToken } = await this.issueTokens(
      owner.id,
      owner.agencyId,
      owner.role,
    );

    void this.audit.log({
      eventType: 'auth.register.success',
      action: 'register',
      resource: 'agency',
      userId: owner.id,
      agencyId: agency.id,
      metadata: { slug: agency.slug, email: owner.email },
    });

    return {
      message: 'Agency registered successfully',
      token,
      refreshToken,
      user: {
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: owner.role,
      },
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { agency: true },
    });

    if (!user || !user.isActive) {
      void this.audit.log({
        eventType: 'auth.login.failed',
        action: 'login',
        resource: 'auth',
        metadata: { email: dto.email, reason: 'unknown_or_inactive' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      void this.audit.log({
        eventType: 'auth.login.failed',
        action: 'login',
        resource: 'auth',
        userId: user.id,
        agencyId: user.agencyId,
        metadata: { email: dto.email, reason: 'bad_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token, refreshToken } = await this.issueTokens(
      user.id,
      user.agencyId,
      user.role,
    );

    void this.audit.log({
      eventType: 'auth.login.success',
      action: 'login',
      resource: 'auth',
      userId: user.id,
      agencyId: user.agencyId,
      metadata: { email: user.email },
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        agency: {
          id: user.agency.id,
          name: user.agency.name,
          slug: user.agency.slug,
        },
      },
    };
  }

  private generateToken(userId: string, agencyId: string, role: string) {
    return this.jwtService.sign({ sub: userId, agencyId, role });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Issues a short-lived access JWT + an opaque refresh token (stored hashed).
  private async issueTokens(userId: string, agencyId: string, role: string) {
    const token = this.generateToken(userId, agencyId, role);
    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: this.hashToken(refreshToken), userId, expiresAt },
    });
    return { token, refreshToken };
  }

  // Validates + rotates a refresh token. Reused/revoked/expired -> rejected.
  async refresh(refreshToken: string) {
    const row = await prisma.refreshToken.findUnique({
      where: { token: this.hashToken(refreshToken) },
      include: { user: true },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const issued = await this.issueTokens(
      row.user.id,
      row.user.agencyId,
      row.user.role,
    );
    const replacement = await prisma.refreshToken.findUnique({
      where: { token: this.hashToken(issued.refreshToken) },
    });
    await prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date(), replacedById: replacement?.id ?? null },
    });
    void this.audit.log({
      eventType: 'auth.login.success',
      action: 'refresh',
      resource: 'auth',
      userId: row.user.id,
      agencyId: row.user.agencyId,
    });
    return issued;
  }

  // Revokes a refresh token (logout). Access tokens expire naturally (<=15m).
  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out' };
  }
}

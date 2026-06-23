import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RegisterAgencyDto } from './dto/register-agency.dto';
import { LoginDto } from './dto/login.dto';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

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
    const token = this.generateToken(owner.id, owner.agencyId, owner.role);

    return {
      message: 'Agency registered successfully',
      token,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.agencyId, user.role);

    return {
      token,
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
}

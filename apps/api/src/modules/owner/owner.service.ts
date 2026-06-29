import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { getRequestContext } from '../../common/request-context';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnerService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // agencyId derived ONLY from the request context (JWT), never from input.
  private agencyId(): string {
    const ctx = getRequestContext();
    if (!ctx?.agencyId) {
      throw new ForbiddenException('No agency context');
    }
    return ctx.agencyId;
  }

  create(dto: CreateOwnerDto) {
    return this.prisma.owner.create({
      data: {
        agencyId: this.agencyId(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
      },
    });
  }

  // Auto-scoped (findMany) by tenant middleware; SYSTEM_ADMIN sees all.
  // Paginated (default 50, max 100). Excludes ARCHIVED unless includeArchived.
  list(page?: string, pageSize?: string, includeArchived?: string) {
    const take = Math.min(Math.max(parseInt(pageSize ?? '', 10) || 50, 1), 100);
    const skip = (Math.max(parseInt(page ?? '', 10) || 1, 1) - 1) * take;
    const where =
      includeArchived === 'true' ? {} : { status: { not: 'ARCHIVED' as const } };
    return this.prisma.owner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // Single-record op: explicit agencyId ownership guard (top-level entity).
  async getById(id: string) {
    const owner = await this.prisma.owner.findFirst({
      where: { id, agencyId: this.agencyId() },
    });
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    return owner;
  }

  async update(id: string, dto: UpdateOwnerDto) {
    await this.getById(id);
    return this.prisma.owner.update({ where: { id }, data: { ...dto } });
  }

  async archive(id: string) {
    await this.getById(id);
    return this.prisma.owner.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}

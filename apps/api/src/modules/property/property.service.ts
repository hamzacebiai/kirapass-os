import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { getRequestContext } from '../../common/request-context';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // agencyId is derived ONLY from the request context (JWT), never from input.
  private agencyId(): string {
    const ctx = getRequestContext();
    if (!ctx?.agencyId) {
      throw new ForbiddenException('No agency context');
    }
    return ctx.agencyId;
  }

  create(dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        agencyId: this.agencyId(),
        title: dto.title,
        addressLine: dto.addressLine,
        city: dto.city,
        district: dto.district ?? null,
        postalCode: dto.postalCode ?? null,
        notes: dto.notes ?? null,
        type: dto.type ?? 'RESIDENTIAL',
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
    return this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // Single-record op: NOT auto-scoped -> explicit agencyId ownership guard.
  async getById(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, agencyId: this.agencyId() },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  // Explicit ownership guard before mutating a single record.
  async update(id: string, dto: UpdatePropertyDto) {
    await this.getById(id);
    return this.prisma.property.update({ where: { id }, data: { ...dto } });
  }

  async archive(id: string) {
    await this.getById(id);
    return this.prisma.property.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}

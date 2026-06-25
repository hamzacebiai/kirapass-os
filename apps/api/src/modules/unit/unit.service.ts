import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { getRequestContext } from '../../common/request-context';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // agencyId derived ONLY from the request context (JWT), never from input.
  private agencyId(): string {
    const ctx = getRequestContext();
    if (!ctx?.agencyId) {
      throw new ForbiddenException('No agency context');
    }
    return ctx.agencyId;
  }

  // The parent Property must belong to the caller's agency.
  private async assertPropertyOwned(propertyId: string): Promise<void> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, agencyId: this.agencyId() },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
  }

  async create(dto: CreateUnitDto) {
    await this.assertPropertyOwned(dto.propertyId);
    return this.prisma.unit.create({
      data: {
        agencyId: this.agencyId(),
        propertyId: dto.propertyId,
        name: dto.name,
        unitNumber: dto.unitNumber,
        floor: dto.floor ?? null,
        notes: dto.notes ?? null,
        type: dto.type ?? 'APARTMENT',
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
    return this.prisma.unit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // Single-record op: explicit TWO-level ownership — unit.agencyId AND
  // unit.property.agencyId must equal the caller's agency.
  async getById(id: string) {
    const agencyId = this.agencyId();
    const unit = await this.prisma.unit.findFirst({
      where: { id, agencyId, property: { agencyId } },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.getById(id);
    return this.prisma.unit.update({ where: { id }, data: { ...dto } });
  }

  async archive(id: string) {
    await this.getById(id);
    return this.prisma.unit.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}

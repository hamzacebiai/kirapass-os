import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { getRequestContext } from '../../common/request-context';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';

@Injectable()
export class LeaseService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // agencyId derived ONLY from the request context (JWT), never from input.
  private agencyId(): string {
    const ctx = getRequestContext();
    if (!ctx?.agencyId) {
      throw new ForbiddenException('No agency context');
    }
    return ctx.agencyId;
  }

  // Parent Unit must belong to the caller's agency.
  private async assertUnitOwned(unitId: string): Promise<void> {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, agencyId: this.agencyId() },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
  }

  async create(dto: CreateLeaseDto) {
    await this.assertUnitOwned(dto.unitId);
    return this.prisma.lease.create({
      data: {
        agencyId: this.agencyId(),
        unitId: dto.unitId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        rentAmount: dto.rentAmount,
        depositAmount: dto.depositAmount ?? null,
        notes: dto.notes ?? null,
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
    return this.prisma.lease.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // Single-record op: explicit TWO-level ownership — lease.agencyId AND
  // lease.unit.agencyId must equal the caller's agency.
  async getById(id: string) {
    const agencyId = this.agencyId();
    const lease = await this.prisma.lease.findFirst({
      where: { id, agencyId, unit: { agencyId } },
    });
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }
    return lease;
  }

  async update(id: string, dto: UpdateLeaseDto) {
    await this.getById(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.lease.update({ where: { id }, data });
  }

  async archive(id: string) {
    await this.getById(id);
    return this.prisma.lease.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  // Workflow: DRAFT -> ACTIVE -> EXPIRED ; ACTIVE|DRAFT -> TERMINATED.
  async activate(id: string) {
    const lease = await this.getById(id);
    if (lease.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT leases can be activated');
    }
    return this.prisma.lease.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async expire(id: string) {
    const lease = await this.getById(id);
    if (lease.status !== 'ACTIVE') {
      throw new BadRequestException('Only ACTIVE leases can be expired');
    }
    return this.prisma.lease.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }

  async terminate(id: string) {
    const lease = await this.getById(id);
    if (!['ACTIVE', 'DRAFT'].includes(lease.status)) {
      throw new BadRequestException('Cannot terminate this lease');
    }
    return this.prisma.lease.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });
  }
}

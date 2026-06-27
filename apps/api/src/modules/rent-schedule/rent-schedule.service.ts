import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { getRequestContext } from '../../common/request-context';
import { CreateRentScheduleDto } from './dto/create-rent-schedule.dto';
import { UpdateRentScheduleDto } from './dto/update-rent-schedule.dto';

@Injectable()
export class RentScheduleService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // agencyId derived ONLY from the request context (JWT), never from input.
  private agencyId(): string {
    const ctx = getRequestContext();
    if (!ctx?.agencyId) {
      throw new ForbiddenException('No agency context');
    }
    return ctx.agencyId;
  }

  // Parent Lease must belong to the caller's agency.
  private async assertLeaseOwned(leaseId: string): Promise<void> {
    const lease = await this.prisma.lease.findFirst({
      where: { id: leaseId, agencyId: this.agencyId() },
    });
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }
  }

  // Referenced Tenant (when supplied) must belong to the caller's agency.
  private async assertTenantOwned(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, agencyId: this.agencyId() },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }

  async create(dto: CreateRentScheduleDto) {
    await this.assertLeaseOwned(dto.leaseId);
    if (dto.tenantId) {
      await this.assertTenantOwned(dto.tenantId);
    }
    return this.prisma.rentSchedule.create({
      data: {
        agencyId: this.agencyId(),
        leaseId: dto.leaseId,
        tenantId: dto.tenantId ?? null,
        dueDate: new Date(dto.dueDate),
        amount: dto.amount,
        notes: dto.notes ?? null,
      },
    });
  }

  // Auto-scoped (findMany) by tenant middleware; SYSTEM_ADMIN sees all.
  // Paginated (default 50, max 100). Excludes CANCELLED unless includeArchived.
  list(page?: string, pageSize?: string, includeArchived?: string) {
    const take = Math.min(Math.max(parseInt(pageSize ?? '', 10) || 50, 1), 100);
    const skip = (Math.max(parseInt(page ?? '', 10) || 1, 1) - 1) * take;
    const where =
      includeArchived === 'true' ? {} : { status: { not: 'CANCELLED' as const } };
    return this.prisma.rentSchedule.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      skip,
      take,
    });
  }

  // Single-record op: explicit TWO-level ownership — schedule.agencyId AND
  // schedule.lease.agencyId must equal the caller's agency.
  async getById(id: string) {
    const agencyId = this.agencyId();
    const schedule = await this.prisma.rentSchedule.findFirst({
      where: { id, agencyId, lease: { agencyId } },
    });
    if (!schedule) {
      throw new NotFoundException('Rent schedule not found');
    }
    return schedule;
  }

  async update(id: string, dto: UpdateRentScheduleDto) {
    await this.getById(id);
    if (dto.tenantId) {
      await this.assertTenantOwned(dto.tenantId);
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    return this.prisma.rentSchedule.update({ where: { id }, data });
  }

  async cancel(id: string) {
    await this.getById(id);
    return this.prisma.rentSchedule.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}

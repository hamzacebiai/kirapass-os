import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { getRequestContext } from '../../common/request-context';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: TenantPrismaService) {}

  // agencyId derived ONLY from the request context (JWT), never from input.
  private agencyId(): string {
    const ctx = getRequestContext();
    if (!ctx?.agencyId) {
      throw new ForbiddenException('No agency context');
    }
    return ctx.agencyId;
  }

  // Parent RentSchedule must belong to the caller's agency.
  private async assertRentScheduleOwned(rentScheduleId: string): Promise<void> {
    const schedule = await this.prisma.rentSchedule.findFirst({
      where: { id: rentScheduleId, agencyId: this.agencyId() },
    });
    if (!schedule) {
      throw new NotFoundException('Rent schedule not found');
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

  async create(dto: CreatePaymentDto) {
    await this.assertRentScheduleOwned(dto.rentScheduleId);
    if (dto.tenantId) {
      await this.assertTenantOwned(dto.tenantId);
    }
    return this.prisma.payment.create({
      data: {
        agencyId: this.agencyId(),
        rentScheduleId: dto.rentScheduleId,
        tenantId: dto.tenantId ?? null,
        amount: dto.amount,
        paidAt: new Date(dto.paidAt),
        method: dto.method ?? 'CASH',
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  // Auto-scoped (findMany) by tenant middleware; SYSTEM_ADMIN sees all.
  // Paginated (default 50, max 100). Excludes VOIDED unless includeArchived.
  list(page?: string, pageSize?: string, includeArchived?: string) {
    const take = Math.min(Math.max(parseInt(pageSize ?? '', 10) || 50, 1), 100);
    const skip = (Math.max(parseInt(page ?? '', 10) || 1, 1) - 1) * take;
    const where =
      includeArchived === 'true' ? {} : { status: { not: 'VOIDED' as const } };
    return this.prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      skip,
      take,
    });
  }

  // Single-record op: explicit TWO-level ownership — payment.agencyId AND
  // payment.rentSchedule.agencyId must equal the caller's agency.
  async getById(id: string) {
    const agencyId = this.agencyId();
    const payment = await this.prisma.payment.findFirst({
      where: { id, agencyId, rentSchedule: { agencyId } },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto) {
    await this.getById(id);
    if (dto.tenantId) {
      await this.assertTenantOwned(dto.tenantId);
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.paidAt) data.paidAt = new Date(dto.paidAt);
    return this.prisma.payment.update({ where: { id }, data });
  }

  async void(id: string) {
    await this.getById(id);
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'VOIDED' },
    });
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { getRequestContext } from '../../common/request-context';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';

/**
 * AGENCY side. MessageThread is in TENANT_MODELS, so findMany/findFirst/
 * updateMany are auto-scoped to the caller's agencyId by the tenant middleware.
 * agencyId/senderId derived ONLY from the request context (JWT).
 */
@Injectable()
export class MessagingService {
  constructor(private readonly prisma: TenantPrismaService) {}

  private ctx() {
    const c = getRequestContext();
    if (!c?.agencyId) throw new ForbiddenException('No agency context');
    return c;
  }

  async createThread(dto: CreateThreadDto) {
    const { agencyId } = this.ctx();
    // Tenant (and lease) must belong to caller agency (middleware scopes these).
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: dto.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (dto.leaseId) {
      const lease = await this.prisma.lease.findFirst({
        where: { id: dto.leaseId },
      });
      if (!lease) throw new NotFoundException('Lease not found');
    }
    return this.prisma.messageThread.create({
      data: {
        agencyId,
        tenantId: dto.tenantId,
        leaseId: dto.leaseId ?? null,
      },
    });
  }

  listThreads() {
    return this.prisma.messageThread.findMany({
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getThread(threadId: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId },
      include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }

  async sendMessage(threadId: string, dto: CreateMessageDto) {
    const { userId } = this.ctx();
    await this.getThread(threadId); // agency-scoped ownership guard
    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderRole: 'AGENCY',
        senderId: userId ?? 'unknown',
        messageType: dto.messageType ?? 'GENERAL',
        body: dto.body,
      },
    });
    await this.prisma.messageThread.updateMany({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  async markAsRead(threadId: string) {
    await this.getThread(threadId);
    // Agency reads the tenant's messages.
    await this.prisma.message.updateMany({
      where: { threadId, senderRole: 'TENANT', readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'Marked as read' };
  }
}

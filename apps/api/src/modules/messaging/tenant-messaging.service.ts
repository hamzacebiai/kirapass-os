import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

/**
 * TENANT side. The agency-scope middleware is NOT sufficient here (it would let
 * a tenant see every thread in their agency), so EVERY query carries an explicit
 * `tenantId` filter sourced ONLY from the JWT (never from URL/body). Unowned
 * threads return 404 — their existence is never leaked.
 */
@Injectable()
export class TenantMessagingService {
  constructor(private readonly prisma: TenantPrismaService) {}

  listMyThreads(tenantId: string) {
    return this.prisma.messageThread.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMyThread(threadId: string, tenantId: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, tenantId },
      include: { messages: { orderBy: { sentAt: 'asc' } } },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }

  async sendMyMessage(threadId: string, tenantId: string, dto: CreateMessageDto) {
    // Ownership guard — throws 404 if the thread is not this tenant's.
    await this.getMyThread(threadId, tenantId);
    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderRole: 'TENANT',
        senderId: tenantId,
        messageType: dto.messageType ?? 'GENERAL',
        body: dto.body,
      },
    });
    await this.prisma.messageThread.updateMany({
      where: { id: threadId, tenantId },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  async markMyRead(threadId: string, tenantId: string) {
    await this.getMyThread(threadId, tenantId);
    // Tenant reads the agency's messages.
    await this.prisma.message.updateMany({
      where: { threadId, senderRole: 'AGENCY', readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'Marked as read' };
  }
}

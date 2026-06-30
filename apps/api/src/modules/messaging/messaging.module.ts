import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { TenantMessagingController } from './tenant-messaging.controller';
import { MessagingService } from './messaging.service';
import { TenantMessagingService } from './tenant-messaging.service';

@Module({
  controllers: [MessagingController, TenantMessagingController],
  providers: [MessagingService, TenantMessagingService],
})
export class MessagingModule {}

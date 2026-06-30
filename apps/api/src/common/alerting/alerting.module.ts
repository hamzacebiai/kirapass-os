import { Module, Global } from '@nestjs/common';
import { DiscordAlertService } from './discord-alert.service';

@Global()
@Module({
  providers: [DiscordAlertService],
  exports: [DiscordAlertService],
})
export class AlertingModule {}

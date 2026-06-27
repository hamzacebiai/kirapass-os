import { Module } from '@nestjs/common';
import { RentScheduleController } from './rent-schedule.controller';
import { RentScheduleService } from './rent-schedule.service';

@Module({
  controllers: [RentScheduleController],
  providers: [RentScheduleService],
})
export class RentScheduleModule {}

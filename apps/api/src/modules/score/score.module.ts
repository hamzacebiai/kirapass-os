import { Module } from '@nestjs/common';
import { ScoreService } from './score.service';
import { ScoreController, TenantScoreController } from './score.controller';

@Module({
  controllers: [ScoreController, TenantScoreController],
  providers: [ScoreService],
})
export class ScoreModule {}

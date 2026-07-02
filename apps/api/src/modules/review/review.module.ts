import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import {
  LeaseReviewController,
  TenantReviewsController,
  TenantLeaseReviewController,
} from './review.controller';

@Module({
  controllers: [
    LeaseReviewController,
    TenantReviewsController,
    TenantLeaseReviewController,
  ],
  providers: [ReviewService],
})
export class ReviewModule {}

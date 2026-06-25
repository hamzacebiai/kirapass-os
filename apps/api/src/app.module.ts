import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/errors/global-exception.filter';
import { LifecycleService } from './common/production/lifecycle.service';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertyModule } from './modules/property/property.module';
import { UnitModule } from './modules/unit/unit.module';
import { LeaseModule } from './modules/lease/lease.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { RentScheduleModule } from './modules/rent-schedule/rent-schedule.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { CorrelationMiddleware } from './common/observability/correlation.middleware';
import { RequestTimingMiddleware } from './common/observability/request-timing.middleware';
import { TenantContextMiddleware } from './common/tenant-context.middleware';
import { SecurityModule } from './common/security/security.module';
import { MetricsModule } from './common/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    SecurityModule,
    MetricsModule,
    ObservabilityModule,
    AuditModule,
    RateLimitModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PropertyModule,
    UnitModule,
    LeaseModule,
    TenantModule,
    RentScheduleModule,
    PaymentModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    LifecycleService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorrelationMiddleware,
        RequestTimingMiddleware,
        TenantContextMiddleware,
      )
      .forRoutes('*');
  }
}

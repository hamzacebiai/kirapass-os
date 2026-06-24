import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { SecurityHeadersMiddleware } from './security-headers.middleware';
import { SecurityController } from './security.controller';

@Module({ controllers: [SecurityController] })
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}

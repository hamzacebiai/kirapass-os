import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateEnv } from './common/config/env-validation';

async function bootstrap() {
  const startedAt = Date.now();
  const envCheck = validateEnv();
  console.log(`[CONFIG] ${JSON.stringify(envCheck)}`);
  if (!envCheck.ok) {
    console.error(
      `[CONFIG] missing required env: ${envCheck.missing.join(', ')}`,
    );
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[STARTUP] ${JSON.stringify({ msg: 'KiraPass OS API started', port, pid: process.pid, node: process.version, env: process.env.NODE_ENV ?? 'development', bootMs: Date.now() - startedAt })}`,
  );
  console.log(`KiraPass OS API running on http://localhost:${port}/api/v1`);
}
bootstrap();

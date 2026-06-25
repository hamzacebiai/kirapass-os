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
  // Gate 1: production fail-fast. Refuse to start when required env is missing
  // or the JWT secret is weak. Development is unaffected (warnings only).
  if (
    process.env.NODE_ENV === 'production' &&
    (!envCheck.ok || envCheck.hasWeakJwtSecret)
  ) {
    console.error(
      `[FATAL] Refusing to start in production: ${JSON.stringify({
        missing: envCheck.missing,
        weakJwtSecret: envCheck.hasWeakJwtSecret,
      })}`,
    );
    process.exit(1);
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Gate 2: CORS allowlist. Explicit origins via CORS_ORIGINS; production with
  // no allowlist denies cross-origin (no wildcard); development unchanged.
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins });
  } else if (process.env.NODE_ENV === 'production') {
    app.enableCors({ origin: false });
  } else {
    app.enableCors();
  }
  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[STARTUP] ${JSON.stringify({ msg: 'KiraPass OS API started', port, pid: process.pid, node: process.version, env: process.env.NODE_ENV ?? 'development', bootMs: Date.now() - startedAt })}`,
  );
  console.log(`KiraPass OS API running on http://localhost:${port}/api/v1`);
}
bootstrap();

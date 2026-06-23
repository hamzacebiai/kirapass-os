import { createApp } from "../app.js";
import { APP, loadEnv } from "../config/index.js";

/**
 * Server boot layer.
 *
 * Sole responsibility: wire the environment to the application and open the
 * network socket. No Express configuration lives here — that belongs to the
 * app factory. This file is the only place allowed to start a process.
 */
function bootstrap(): void {
  const env = loadEnv();
  const app = createApp();

  app.listen(env.port, env.host, () => {
    console.log(
      `${APP.name} v${APP.version} running on http://${env.host}:${env.port} [${env.nodeEnv}]`,
    );
  });
}

bootstrap();

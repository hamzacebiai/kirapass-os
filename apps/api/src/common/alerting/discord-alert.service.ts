import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DiscordAlertService {
  private readonly logger = new Logger(DiscordAlertService.name);
  private readonly webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  // Basit rate-limit: aynı endpoint+statusCode için 5 dakikada 1 bildirim
  private lastSent: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 5 * 60 * 1000;

  async sendErrorAlert(params: {
    correlationId: string;
    statusCode: number;
    path: string;
    method: string;
    errorCode?: string;
    message: string;
    agencyId?: string;
  }): Promise<void> {
    if (!this.webhookUrl) return; // env yoksa sessizce atla, crash etme

    const key = `${params.method}:${params.path}:${params.statusCode}`;
    const now = Date.now();
    const last = this.lastSent.get(key);
    if (last && now - last < this.COOLDOWN_MS) return;
    this.lastSent.set(key, now);

    const payload = {
      embeds: [
        {
          title: `🔴 ${params.statusCode} Hata — Prod`,
          color: 15158332,
          fields: [
            { name: 'Endpoint', value: `${params.method} ${params.path}`, inline: true },
            { name: 'Hata Kodu', value: params.errorCode ?? 'N/A', inline: true },
            { name: 'Agency', value: params.agencyId ?? 'N/A', inline: true },
            { name: 'Mesaj', value: params.message.slice(0, 500) },
            { name: 'Correlation ID', value: params.correlationId },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.logger.warn(`Discord alert failed: ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Discord alert error: ${err}`);
    }
  }
}

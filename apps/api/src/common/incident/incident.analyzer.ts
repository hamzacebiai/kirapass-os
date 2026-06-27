import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncidentSignal, IncidentReport, IncidentPriority } from './incident.types';
import { randomUUID } from 'crypto';

@Injectable()
export class IncidentAnalyzer {
  private readonly logger = new Logger(IncidentAnalyzer.name);
  private readonly openReports = new Map<string, IncidentReport>();

  constructor(private readonly config: ConfigService) {}

  async analyze(signal: IncidentSignal): Promise<IncidentReport> {
    const id = `INC-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const priority = this.scorePriority(signal);

    const report: IncidentReport = {
      id,
      signal,
      priority,
      status: 'ANALYZING',
      openedAt: new Date(),
    };

    this.openReports.set(id, report);
    this.logger.warn(`[${id}] Incident açıldı — ${priority} — ${signal.layer} — ${signal.message}`);

    try {
      const apiKey = this.config.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
        report.aiAnalysis = 'GEMINI_API_KEY eksik — manuel analiz gerekiyor.';
        report.status = 'OPEN';
        return report;
      }

      const prompt = this.buildAnalysisPrompt(signal, priority);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
          }),
        },
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API ${res.status}: ${err}`);
      }

      const data = await res.json() as {
        candidates: { content: { parts: { text: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ?? 'Yanıt alınamadı';

      report.aiAnalysis = text;
      report.status = 'PATCH_READY';
      this.logger.log(`[${id}] Gemini analizi tamamlandı`);
    } catch (err) {
      report.aiAnalysis = `AI analiz hatası: ${(err as Error).message}`;
      report.status = 'OPEN';
      this.logger.error(`[${id}] Gemini analiz başarısız`, (err as Error).stack);
    }

    this.openReports.set(id, report);
    return report;
  }

  close(id: string): IncidentReport | undefined {
    const report = this.openReports.get(id);
    if (!report) return undefined;
    report.status = 'CLOSED';
    report.closedAt = new Date();
    report.mttrMs = report.closedAt.getTime() - report.openedAt.getTime();
    this.openReports.set(id, report);
    this.logger.log(`[${id}] Kapatıldı — MTTR: ${Math.round(report.mttrMs / 1000)}s`);
    return report;
  }

  getAll(): IncidentReport[] {
    return Array.from(this.openReports.values());
  }

  getById(id: string): IncidentReport | undefined {
    return this.openReports.get(id);
  }

  private scorePriority(signal: IncidentSignal): IncidentPriority {
    if (signal.layer === 'PAYMENT') return 'CRITICAL';
    if (signal.layer === 'AUTH' || signal.layer === 'LEASE') return 'HIGH';
    if (signal.statusCode && signal.statusCode >= 500) return 'HIGH';
    if (signal.statusCode && signal.statusCode >= 400) return 'MEDIUM';
    return 'LOW';
  }

  private buildAnalysisPrompt(signal: IncidentSignal, priority: IncidentPriority): string {
    return `Sen Kirapass AI incident mühendisisin. Platform: NestJS + Prisma + PostgreSQL.

Incident: ${signal.layer} | ${signal.message} | HTTP ${signal.statusCode ?? '?'} | Öncelik: ${priority}

Yanıtı SADECE şu formatta ver:
## KÖK NEDEN
## ETKİ
## ANLIK MÜDAHALE
1.
2.
## PATCH
## ROLLBACK`;
  }
}

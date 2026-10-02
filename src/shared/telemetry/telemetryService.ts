import { db } from '@/features/offline-sync/db/appDatabase';
import { TelemetryEvent, TelemetryLogLevel, TelemetryCategory, PerformanceMetric } from '@/shared/types/telemetry';

export class TelemetryService {
  private inMemoryLogs: TelemetryEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private maxInMemory = 100;

  async log(
    level: TelemetryLogLevel,
    eventName: string,
    category: TelemetryCategory,
    details: Record<string, any> = {}
  ): Promise<TelemetryEvent> {
    const event: TelemetryEvent = {
      id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      level,
      eventName,
      category,
      details,
      timestamp: Date.now(),
      synced: false,
    };

    this.inMemoryLogs.unshift(event);
    if (this.inMemoryLogs.length > this.maxInMemory) {
      this.inMemoryLogs.pop();
    }

    try {
      await db.telemetryLogs.put(event);
    } catch {
      // Graceful fallback if IndexedDB is temporarily unavailable
    }

    if (level === 'error') {
      console.error(`[Telemetry Error] ${eventName}:`, details);
    }

    return event;
  }

  logInfo(eventName: string, category: TelemetryCategory = 'navigation', details: Record<string, any> = {}) {
    return this.log('info', eventName, category, details);
  }

  logWarn(eventName: string, category: TelemetryCategory = 'sync', details: Record<string, any> = {}) {
    return this.log('warn', eventName, category, details);
  }

  logError(
    eventName: string,
    category: TelemetryCategory = 'error',
    errorOrDetails: any = {}
  ) {
    const details = errorOrDetails instanceof Error
      ? {
          message: errorOrDetails.message,
          stack: errorOrDetails.stack,
          name: errorOrDetails.name,
        }
      : errorOrDetails;

    return this.log('error', eventName, category, details);
  }

  startTimer(metricName: string) {
    const startTime = performance.now();
    return {
      stop: (metadata: Record<string, any> = {}) => {
        const durationMs = Math.round(performance.now() - startTime);
        const metric: PerformanceMetric = {
          name: metricName,
          durationMs,
          timestamp: Date.now(),
          metadata,
        };
        this.metrics.push(metric);
        this.logInfo(`perf_${metricName}`, 'performance', { durationMs, ...metadata });
        return durationMs;
      },
    };
  }

  getRecentLogs(): TelemetryEvent[] {
    return [...this.inMemoryLogs];
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearLogs(): void {
    this.inMemoryLogs = [];
    this.metrics = [];
  }
}

export const telemetryService = new TelemetryService();

export type TelemetryLogLevel = 'info' | 'warn' | 'error';

export type TelemetryCategory =
  | 'navigation'
  | 'assessment'
  | 'sync'
  | 'error'
  | 'performance'
  | 'auth';

export interface TelemetryEvent {
  id: string;
  level: TelemetryLogLevel;
  eventName: string;
  category: TelemetryCategory;
  details: Record<string, any>;
  timestamp: number;
  synced: boolean;
}

export interface PerformanceMetric {
  name: string;
  durationMs: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
  userId?: string;
}

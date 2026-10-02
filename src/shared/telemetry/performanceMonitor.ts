import { telemetryService } from './telemetryService';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private constructor() {
    this.initObserver();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            telemetryService.logInfo('page_navigation_timing', 'performance', {
              domComplete: Math.round(navEntry.domComplete),
              domInteractive: Math.round(navEntry.domInteractive),
              loadEventEnd: Math.round(navEntry.loadEventEnd),
              duration: Math.round(navEntry.duration),
            });
          }
        }
      });
      navObserver.observe({ type: 'navigation', buffered: true });
    } catch {
      // PerformanceObserver fallback
    }
  }

  trackAction(actionName: string, execute: () => void | Promise<void>): Promise<number> | number {
    const timer = telemetryService.startTimer(actionName);
    const result = execute();

    if (result instanceof Promise) {
      return result.then(() => timer.stop({ status: 'success' })).catch((err) => {
        timer.stop({ status: 'error', error: err?.message });
        throw err;
      });
    }

    return timer.stop({ status: 'success' });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

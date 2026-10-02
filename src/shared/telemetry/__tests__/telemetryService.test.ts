import { describe, it, expect, beforeEach } from 'vitest';
import { telemetryService } from '../telemetryService';

describe('TelemetryService', () => {
  beforeEach(() => {
    telemetryService.clearLogs();
  });

  it('records structured informational log', async () => {
    const event = await telemetryService.logInfo('course_viewed', 'navigation', {
      courseId: 'math-101',
    });

    expect(event.level).toBe('info');
    expect(event.eventName).toBe('course_viewed');
    expect(event.details.courseId).toBe('math-101');

    const recent = telemetryService.getRecentLogs();
    expect(recent).toHaveLength(1);
  });

  it('captures error logs with stack traces', async () => {
    const error = new Error('Test boundary exception');
    const event = await telemetryService.logError('ui_crash', 'error', error);

    expect(event.level).toBe('error');
    expect(event.details.message).toBe('Test boundary exception');
    expect(event.details.stack).toBeDefined();
  });

  it('measures execution duration using startTimer', async () => {
    const timer = telemetryService.startTimer('quiz_evaluation_latency');
    await new Promise((resolve) => setTimeout(resolve, 15));
    const duration = timer.stop({ questionsCount: 10 });

    expect(duration).toBeGreaterThanOrEqual(10);
    const metrics = telemetryService.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('quiz_evaluation_latency');
  });
});

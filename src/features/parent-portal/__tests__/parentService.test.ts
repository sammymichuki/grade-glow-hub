import { describe, it, expect, beforeEach } from 'vitest';
import {
  ParentService,
  calculateAttendanceRate,
  calculateAverageScore,
  calculateEngagementMinutes,
  calculateHomeworkCompletionRate,
  calculateSubjectPerformance,
  calculateTrend,
  formatEngagementMinutes,
  generateInviteCode,
  isInviteCodeFormat,
  isValidE164,
  normalizeInviteCode,
} from '../services/parentService';
import { daysAgoISO, previousWindow, rollingWindow, TimeWindow } from '../services/portalDates';
import {
  ChildAttendanceRecord,
  ChildSubjectScoreRecord,
  DailyEngagementRecord,
  UpcomingTask,
} from '../types/parentPortal';
import { BRIAN_ID, KEVIN_ID } from '../data/sampleParentData';

const JAN_WINDOW: TimeWindow = { start: '2026-01-05', end: '2026-01-11' };
const JAN_PREV_WINDOW: TimeWindow = { start: '2025-12-29', end: '2026-01-04' };

const attendance = (id: string, date: string, status: ChildAttendanceRecord['status']): ChildAttendanceRecord => ({
  id,
  childId: 'stu-x',
  date,
  status,
});

const task = (id: string, dueDate: string, status: UpcomingTask['status']): UpcomingTask => ({
  id,
  childId: 'stu-x',
  title: `Task ${id}`,
  subject: 'Mathematics',
  type: 'assignment',
  dueDate,
  status,
});

const score = (
  id: string,
  subject: string,
  date: string,
  value: number,
  modules: number
): ChildSubjectScoreRecord => ({ id, childId: 'stu-x', subject, date, score: value, modulesCompleted: modules });

const engagement = (id: string, date: string, minutes: number): DailyEngagementRecord => ({
  id,
  childId: 'stu-x',
  date,
  engagementMinutes: minutes,
  lessonsCompleted: 1,
});

describe('parentService aggregations', () => {
  beforeEach(() => {
    ParentService.resetToDefaults();
  });

  describe('calculateAttendanceRate', () => {
    it('computes attended/scheduled percentage and excludes excused days', () => {
      const records = [
        attendance('a1', '2026-01-05', 'present'),
        attendance('a2', '2026-01-06', 'present'),
        attendance('a3', '2026-01-07', 'absent'),
        attendance('a4', '2026-01-08', 'late'),
        attendance('a5', '2026-01-09', 'excused'),
      ];
      expect(calculateAttendanceRate(records, JAN_WINDOW)).toBe(75);
    });

    it('ignores records outside the window and returns 0 for empty windows', () => {
      const records = [attendance('a1', '2026-01-04', 'absent'), attendance('a2', '2026-01-12', 'absent')];
      expect(calculateAttendanceRate(records, JAN_WINDOW)).toBe(0);
      expect(calculateAttendanceRate([], JAN_WINDOW)).toBe(0);
    });
  });

  describe('calculateHomeworkCompletionRate', () => {
    it('counts submitted tasks over all non-excused tasks due in the window', () => {
      const tasks = [
        task('t1', '2026-01-05', 'submitted'),
        task('t2', '2026-01-06', 'submitted'),
        task('t3', '2026-01-07', 'submitted'),
        task('t4', '2026-01-10', 'overdue'),
        task('t5', '2026-01-11', 'excused'),
      ];
      expect(calculateHomeworkCompletionRate(tasks, JAN_WINDOW)).toBe(75);
    });

    it('returns 0 when nothing is due in the window', () => {
      expect(calculateHomeworkCompletionRate([task('t1', '2026-02-01', 'upcoming')], JAN_WINDOW)).toBe(0);
    });
  });

  describe('score, engagement and trend math', () => {
    it('averages scores inside the window only', () => {
      const scores = [
        score('s1', 'Mathematics', '2026-01-05', 80, 1),
        score('s2', 'Mathematics', '2026-01-09', 90, 1),
        score('s3', 'Mathematics', '2026-01-20', 100, 1),
      ];
      expect(calculateAverageScore(scores, JAN_WINDOW)).toBe(85);
      expect(calculateAverageScore([], JAN_WINDOW)).toBe(0);
    });

    it('sums engagement minutes within the window', () => {
      const records = [engagement('e1', '2026-01-05', 30), engagement('e2', '2026-01-11', 45), engagement('e3', '2026-01-12', 999)];
      expect(calculateEngagementMinutes(records, JAN_WINDOW)).toBe(75);
    });

    it('computes whole-point week-over-week trends with zero-guard', () => {
      expect(calculateTrend(86, 83)).toBe(3);
      expect(calculateTrend(75, 100)).toBe(-25);
      expect(calculateTrend(0, 0)).toBe(0);
      expect(calculateTrend(40, 0)).toBe(40);
    });

    it('builds per-subject performance with current/previous averages and module counts', () => {
      const scores = [
        score('s1', 'Mathematics', '2026-01-05', 90, 2),
        score('s2', 'Mathematics', '2026-01-06', 80, 1),
        score('s3', 'Mathematics', '2026-01-01', 70, 3),
        score('s4', 'English', '2026-01-07', 60, 1),
      ];
      const perf = calculateSubjectPerformance(scores, JAN_WINDOW, JAN_PREV_WINDOW);
      expect(perf).toHaveLength(2);
      const math = perf.find(entry => entry.subject === 'Mathematics');
      expect(math).toMatchObject({ averageScore: 85, previousAverageScore: 70, scoreTrend: 15, modulesCompleted: 3 });
      const english = perf.find(entry => entry.subject === 'English');
      expect(english).toMatchObject({ averageScore: 60, previousAverageScore: 0, modulesCompleted: 1 });
    });

    it('formats engagement minutes for KPI display', () => {
      expect(formatEngagementMinutes(285)).toBe('4h 45m');
      expect(formatEngagementMinutes(45)).toBe('45m');
      expect(formatEngagementMinutes(0)).toBe('0m');
    });

    it('builds rolling windows and their previous periods', () => {
      expect(rollingWindow('2026-01-11')).toEqual({ start: '2026-01-05', end: '2026-01-11' });
      expect(previousWindow(JAN_WINDOW)).toEqual(JAN_PREV_WINDOW);
    });
  });

  describe('verification code helpers', () => {
    it('generates and validates GG- formatted invite codes', () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^GG-[A-Z0-9]{6}$/);
      expect(isInviteCodeFormat(code)).toBe(true);
      expect(isInviteCodeFormat('nope')).toBe(false);
      expect(normalizeInviteCode('  gg-abc234 ')).toBe('GG-ABC234');
      expect(isValidE164('+254712345678')).toBe(true);
      expect(isValidE164('0712345678')).toBe(false);
    });
  });
});

describe('ParentService state operations', () => {
  beforeEach(() => {
    ParentService.resetToDefaults();
  });

  it('seeds the sample profile and two verified children', () => {
    expect(ParentService.getProfile().salutation).toBe('Mrs. Kamau');
    expect(ParentService.getActiveLinks()).toHaveLength(2);
    expect(ParentService.hasVerifiedChild()).toBe(true);
    expect(ParentService.getChildMeta(KEVIN_ID)).toEqual({ childName: 'Kevin Kamau', gradeLevel: 7 });
    expect(ParentService.getChildMeta('stu-unknown')).toBeNull();
  });

  it('rejects malformed and unknown verification codes', () => {
    expect(ParentService.linkChild('not-a-code').error).toBe('invalid_code');
    expect(ParentService.linkChild('GG-ZZZZZZ').error).toBe('invalid_code');
    expect(ParentService.linkChild('').error).toBe('invalid_code');
  });

  it('rejects expired invite codes', () => {
    const result = ParentService.linkChild('GG-F4ITH8');
    expect(result.success).toBe(false);
    expect(result.error).toBe('expired_code');
  });

  it('links a pending child with a valid code and verifies consent', () => {
    const result = ParentService.linkChild('gg-lyd9k4');
    expect(result.success).toBe(true);
    expect(result.link?.childName).toBe('Lydia Kamau');
    expect(result.link?.status).toBe('verified');
    expect(ParentService.getActiveLinks()).toHaveLength(3);

    const consent = ParentService.getConsentStatus('stu-lydia-kamau');
    expect(consent).toMatchObject({ verified: true, method: 'invite_code' });

    const repeat = ParentService.linkChild('GG-LYD9K4');
    expect(repeat.success).toBe(false);
    expect(repeat.error).toBe('already_linked');
  });

  it('unlinks a verified child and revokes consent', () => {
    const link = ParentService.getActiveLinks().find(entry => entry.childId === BRIAN_ID);
    expect(link).toBeDefined();

    const removed = ParentService.unlinkChild(link?.id ?? '');
    expect(removed.success).toBe(true);
    expect(ParentService.getActiveLinks()).toHaveLength(1);
    expect(ParentService.getConsentStatus(BRIAN_ID).verified).toBe(false);
    expect(ParentService.unlinkChild(link?.id ?? '').success).toBe(false);
    expect(ParentService.unlinkChild('missing').success).toBe(false);
  });

  it('reports consent as unverified for unknown children', () => {
    expect(ParentService.getConsentStatus('stu-unknown')).toEqual({ verified: false, method: null, verifiedAt: null });
  });

  it('validates notification preference updates', () => {
    const defaults = ParentService.getNotificationPreferences();
    expect(defaults.frequency).toBe('bi-weekly');
    expect(defaults.channels.whatsapp).toBe(true);

    const saved = ParentService.updateNotificationPreferences({ frequency: 'weekly', locale: 'sw' });
    expect(saved.success).toBe(true);
    expect(ParentService.getNotificationPreferences()).toMatchObject({ frequency: 'weekly', locale: 'sw' });

    const noChannels = ParentService.updateNotificationPreferences({
      channels: { sms: false, whatsapp: false, push: false, email: false },
    });
    expect(noChannels.success).toBe(false);
    expect(noChannels.error).toContain('one notification channel must stay enabled');

    const badPhone = ParentService.updateNotificationPreferences({
      channels: { sms: true, whatsapp: false, push: false, email: false },
      destinationPhone: '0712345678',
    });
    expect(badPhone.success).toBe(false);
    expect(badPhone.error).toContain('E.164');

    const badEmail = ParentService.updateNotificationPreferences({
      channels: { sms: false, whatsapp: false, push: false, email: true },
      destinationEmail: 'not-an-email',
    });
    expect(badEmail.success).toBe(false);
    expect(badEmail.error).toContain('valid email');

    const badFrequency = ParentService.updateNotificationPreferences({ frequency: 'daily' as 'weekly' });
    expect(badFrequency.success).toBe(false);
    expect(badFrequency.error).toContain('weekly or bi-weekly');
    expect(ParentService.getNotificationPreferences().frequency).toBe('weekly');
  });

  it('aggregates Kevin Kamau into a full progress summary with exact KPIs', () => {
    const summary = ParentService.buildProgressSummary(KEVIN_ID);

    expect(summary.childName).toBe('Kevin Kamau');
    expect(summary.gradeLevel).toBe(7);
    expect(summary.attendanceRate).toBe(86);
    expect(summary.previousAttendanceRate).toBe(83);
    expect(summary.attendanceTrend).toBe(3);
    expect(summary.homeworkCompletionRate).toBe(75);
    expect(summary.previousHomeworkCompletionRate).toBe(100);
    expect(summary.homeworkTrend).toBe(-25);
    expect(summary.averageScore).toBe(77);
    expect(summary.previousAverageScore).toBe(76);
    expect(summary.scoreTrend).toBe(1);
    expect(summary.engagementMinutes).toBe(285);
    expect(summary.engagementTrend).toBe(5);
    expect(summary.subjectPerformance).toHaveLength(4);
    expect(summary.strongSubjects).toEqual(['English', 'Mathematics']);
    expect(summary.focusSubjects).toEqual(['Kiswahili']);
    expect(summary.upcomingTasks.map(entry => entry.title)).toEqual([
      'Integrated Science Quiz',
      'Mathematics Mid-Term Exam',
      'English Book Report',
    ]);
  });

  it('falls back to the lowest subject when nothing is below the focus threshold', () => {
    const summary = ParentService.buildProgressSummary(BRIAN_ID);
    expect(summary.attendanceRate).toBe(100);
    expect(summary.averageScore).toBe(80);
    expect(summary.homeworkCompletionRate).toBe(50);
    expect(summary.strongSubjects).toEqual(['Agriculture', 'English']);
    expect(summary.focusSubjects).toEqual(['Mathematics']);
  });

  it('throws for unknown children and lists summaries for active links only', () => {
    expect(() => ParentService.buildProgressSummary('stu-does-not-exist')).toThrow('Unknown child');
    expect(ParentService.listProgressSummaries()).toHaveLength(2);
  });

  it('builds a weekly digest with strengths, weaknesses, notes and next task', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);

    expect(digest.modulesCompleted).toBe(11);
    expect(digest.averageScore).toBe(77);
    expect(digest.scoreTrend).toBe(1);
    expect(digest.attendanceRate).toBe(86);
    expect(digest.topSubject).toEqual({ subject: 'Mathematics', modulesCompleted: 4, averageScore: 88 });
    expect(digest.strengths).toContain('Mathematics — 88% (+6)');
    expect(digest.weaknesses).toContain('Kiswahili — 64% (-5)');
    expect(digest.teacherNotes).toHaveLength(2);
    expect(digest.nextTask?.title).toBe('Integrated Science Quiz');
    expect(digest.parentSalutation).toBe('Mrs. Kamau');
    expect(digest.childFirstName).toBe('Kevin');
  });

  it('renders the English digest copy from the MASTER_PLAN example structure', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);
    const message = ParentService.renderDigestMessage(digest, 'en');

    expect(message).toContain('Hello Mrs. Kamau, Kevin completed 4 math modules this week with an 88% average score.');
    expect(message).toMatch(/Next Integrated Science quiz is this (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\.$/);
  });

  it('renders the Swahili digest copy with translated subjects and salutation', () => {
    const digest = ParentService.buildWeeklyDigest(KEVIN_ID);
    const message = ParentService.renderDigestMessage(digest, 'sw');

    expect(message).toContain('Habari Bibi Kamau, Kevin amekamilisha moduli 4 za hisaba wiki hii kwa wastani wa alama 88%.');
    expect(message).toMatch(/Mtihani ujao wa Integrated Science ni (Jumatatu|Jumanne|Jumatano|Alhamisi|Ijumaa|Jumamosi|Jumapili) hii\./);
  });

  it('re-seeds cleanly after reset so windows always contain fixture data', () => {
    ParentService.buildProgressSummary(KEVIN_ID);
    ParentService.resetToDefaults();
    const summary = ParentService.buildProgressSummary(KEVIN_ID);
    expect(summary.windowStart).toBe(daysAgoISO(6));
    expect(summary.attendanceRate).toBe(86);
  });
});

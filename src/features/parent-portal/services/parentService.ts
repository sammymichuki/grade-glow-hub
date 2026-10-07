import {
  ChildAttendanceRecord,
  ChildProgressSummary,
  ChildSubjectScoreRecord,
  ConsentRecord,
  DailyEngagementRecord,
  DigestFrequency,
  LinkAttemptResult,
  NotificationChannel,
  NotificationPreference,
  ParentPortalState,
  ParentPortalStateSchema,
  ParentProfile,
  PortalLocale,
  StudentChildLink,
  SubjectPerformance,
  TeacherNote,
  UpcomingTask,
  WeeklyDigest,
  PreferenceUpdateResult,
} from '../types/parentPortal';
import {
  TimeWindow,
  daysAheadISO,
  isDateWithin,
  previousWindow,
  rollingWindow,
  shortDate,
  todayISO,
  weekdayName,
} from './portalDates';
import {
  SAMPLE_ATTENDANCE,
  SAMPLE_ENGAGEMENT,
  SAMPLE_LINKS,
  SAMPLE_NOTIFICATION_PREFERENCE,
  SAMPLE_PARENT,
  SAMPLE_SUBJECT_SCORES,
  SAMPLE_TASKS,
  SAMPLE_TEACHER_NOTES,
} from '../data/sampleParentData';

const STORAGE_KEY = 'gradeglow_parent_portal_state_v1';
const REPORTING_WINDOW_DAYS = 7;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INVITE_CODE_PATTERN = /^GG-[A-Z0-9]{6}$/;
const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const STRONG_SCORE_THRESHOLD = 80;
const FOCUS_SCORE_THRESHOLD = 65;

const EN_SHORT_SUBJECT: Record<string, string> = {
  Mathematics: 'math',
  'Integrated Science': 'science',
  English: 'english',
  Kiswahili: 'kiswahili',
  'Social Studies': 'social studies',
  Agriculture: 'agriculture',
};

const SW_SUBJECT: Record<string, string> = {
  Mathematics: 'hisaba',
  'Integrated Science': 'sayansi',
  English: 'kiingereza',
  Kiswahili: 'kiswahili',
  'Social Studies': 'masomo ya jamii',
  Agriculture: 'kilimo',
};

const clampRound = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const withinChild = <T extends { childId: string }>(records: T[], childId: string): T[] =>
  records.filter(record => record.childId === childId);

const withinWindow = <T extends { date?: string; dueDate?: string; createdAt?: string }>(
  records: T[],
  window: TimeWindow,
  field: 'date' | 'dueDate' | 'createdAt'
): T[] => records.filter(record => isDateWithin(record[field] as string, window));

/**
 * Attendance rate = attended days / scheduled days. Excused absences are
 * removed from the denominator because they are pre-authorised by the school;
 * late arrivals still count as attended but the UI surfaces them separately.
 * Returns 0 for empty windows so KPI cards never render NaN.
 */
export function calculateAttendanceRate(records: ChildAttendanceRecord[], window: TimeWindow): number {
  const scheduled = records.filter(record => isDateWithin(record.date, window) && record.status !== 'excused');
  if (scheduled.length === 0) return 0;
  const attended = scheduled.filter(record => record.status === 'present' || record.status === 'late').length;
  return clampRound((attended / scheduled.length) * 100);
}

/**
 * Homework completion = submitted tasks / tasks due in the window.
 * Excused tasks are excluded from the denominator; overdue and pending
 * tasks both count as incomplete.
 */
export function calculateHomeworkCompletionRate(tasks: UpcomingTask[], window: TimeWindow): number {
  const due = tasks.filter(task => isDateWithin(task.dueDate, window) && task.status !== 'excused');
  if (due.length === 0) return 0;
  const submitted = due.filter(task => task.status === 'submitted').length;
  return clampRound((submitted / due.length) * 100);
}

export function calculateAverageScore(scores: ChildSubjectScoreRecord[], window: TimeWindow): number {
  const inWindow = scores.filter(record => isDateWithin(record.date, window));
  if (inWindow.length === 0) return 0;
  return clampRound(mean(inWindow.map(record => record.score)));
}

export function calculateEngagementMinutes(engagement: DailyEngagementRecord[], window: TimeWindow): number {
  return engagement
    .filter(record => isDateWithin(record.date, window))
    .reduce((sum, record) => sum + record.engagementMinutes, 0);
}

/**
 * Week-over-week trend expressed in whole points (percentage points for rates,
 * raw units for minutes). When there is no previous data the trend equals the
 * current value, which the UI renders as a "new" delta rather than 0.
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return Math.round(current);
  return Math.round(current) - Math.round(previous);
}

export function calculateSubjectPerformance(
  scores: ChildSubjectScoreRecord[],
  window: TimeWindow,
  previous: TimeWindow
): SubjectPerformance[] {
  const subjects = Array.from(new Set(scores.map(record => record.subject))).sort();
  return subjects.map(subject => {
    const subjectRecords = scores.filter(record => record.subject === subject);
    const currentAverage = calculateAverageScore(subjectRecords, window);
    const previousAverage = calculateAverageScore(subjectRecords, previous);
    const modulesCompleted = withinWindow(subjectRecords, window, 'date').reduce(
      (sum, record) => sum + record.modulesCompleted,
      0
    );
    return {
      subject,
      averageScore: currentAverage,
      previousAverageScore: previousAverage,
      scoreTrend: calculateTrend(currentAverage, previousAverage),
      modulesCompleted,
    };
  });
}

export function pickStrongSubjects(performance: SubjectPerformance[]): string[] {
  const strong = performance.filter(entry => entry.averageScore >= STRONG_SCORE_THRESHOLD);
  if (strong.length > 0) return strong.map(entry => entry.subject);
  if (performance.length === 0) return [];
  const best = [...performance].sort((a, b) => b.averageScore - a.averageScore)[0];
  return [best.subject];
}

export function pickFocusSubjects(performance: SubjectPerformance[]): string[] {
  const weak = performance.filter(entry => entry.averageScore < FOCUS_SCORE_THRESHOLD);
  if (weak.length > 0) return weak.map(entry => entry.subject);
  if (performance.length === 0) return [];
  const lowest = [...performance].sort((a, b) => a.averageScore - b.averageScore)[0];
  return [lowest.subject];
}

export function formatEngagementMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function generateInviteCode(): string {
  const values = new Uint32Array(6);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i += 1) values[i] = Math.floor(Math.random() * INVITE_ALPHABET.length);
  }
  let code = '';
  for (let i = 0; i < values.length; i += 1) code += INVITE_ALPHABET[values[i] % INVITE_ALPHABET.length];
  return `GG-${code}`;
}

export function isInviteCodeFormat(code: string): boolean {
  return INVITE_CODE_PATTERN.test(code);
}

export function isValidE164(phone: string): boolean {
  return E164_PATTERN.test(phone);
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export class ParentService {
  private static seedState(): ParentPortalState {
    return JSON.parse(
      JSON.stringify({
        profile: SAMPLE_PARENT,
        links: SAMPLE_LINKS,
        preferences: SAMPLE_NOTIFICATION_PREFERENCE,
        attendance: SAMPLE_ATTENDANCE,
        engagement: SAMPLE_ENGAGEMENT,
        subjectScores: SAMPLE_SUBJECT_SCORES,
        tasks: SAMPLE_TASKS,
        teacherNotes: SAMPLE_TEACHER_NOTES,
      })
    ) as ParentPortalState;
  }

  private static saveState(state: ParentPortalState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be full or disabled; in-memory reads keep working.
    }
  }

  private static loadState(): ParentPortalState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = ParentPortalStateSchema.safeParse(JSON.parse(raw));
        // tsc runs with strictNullChecks off, which makes zod's inferred object
        // keys all-optional; the runtime schema is the source of truth here.
        if (parsed.success) return parsed.data as ParentPortalState;
      }
    } catch {
      // Corrupt payload falls through to a clean re-seed.
    }
    const seeded = ParentService.seedState();
    ParentService.saveState(seeded);
    return seeded;
  }

  public static resetToDefaults(): void {
    ParentService.saveState(ParentService.seedState());
  }

  public static getProfile(): ParentProfile {
    return { ...ParentService.loadState().profile };
  }

  public static updateProfile(patch: Partial<Pick<ParentProfile, 'salutation' | 'salutationSw' | 'preferredLocale'>>): ParentProfile {
    const state = ParentService.loadState();
    state.profile = { ...state.profile, ...patch };
    ParentService.saveState(state);
    return { ...state.profile };
  }

  public static getLinks(): StudentChildLink[] {
    return ParentService.loadState().links.map(link => ({ ...link }));
  }

  public static getActiveLinks(): StudentChildLink[] {
    return ParentService.getLinks().filter(link => link.status === 'verified');
  }

  public static hasVerifiedChild(): boolean {
    return ParentService.getActiveLinks().length > 0;
  }

  public static getChildMeta(childId: string): { childName: string; gradeLevel: number } | null {
    const link = ParentService.loadState().links.find(entry => entry.childId === childId);
    return link ? { childName: link.childName, gradeLevel: link.gradeLevel } : null;
  }

  public static linkChild(rawCode: string): LinkAttemptResult {
    const code = normalizeInviteCode(rawCode ?? '');
    if (!isInviteCodeFormat(code)) {
      return { success: false, error: 'invalid_code', message: 'Verification code must look like GG-AB12CD.' };
    }

    const state = ParentService.loadState();
    const link = state.links.find(entry => entry.inviteCode === code);
    if (!link || link.status === 'revoked') {
      return { success: false, error: 'invalid_code', message: 'No pending child link matches that verification code.' };
    }
    if (link.status === 'verified') {
      return { success: false, error: 'already_linked', message: `${link.childName} is already linked to this account.` };
    }
    if (Date.now() > Date.parse(link.codeExpiresAt)) {
      return { success: false, error: 'expired_code', message: `The code for ${link.childName} has expired. Ask the school for a new one.` };
    }
    if (state.links.some(entry => entry.childId === link.childId && entry.status === 'verified')) {
      return { success: false, error: 'already_linked', message: `${link.childName} is already linked to this account.` };
    }

    const now = new Date().toISOString();
    const verifiedLink: StudentChildLink = {
      ...link,
      status: 'verified',
      linkedAt: now,
      consent: { verified: true, method: 'invite_code', verifiedAt: now },
    };
    state.links = state.links.map(entry => (entry.id === link.id ? verifiedLink : entry));
    ParentService.saveState(state);

    return { success: true, link: verifiedLink, message: `${link.childName} is now linked. Consent verified via invite code.` };
  }

  public static unlinkChild(linkId: string): { success: boolean; message: string } {
    const state = ParentService.loadState();
    const link = state.links.find(entry => entry.id === linkId);
    if (!link) return { success: false, message: 'Link not found.' };
    if (link.status !== 'verified') return { success: false, message: 'Only verified links can be removed.' };

    state.links = state.links.map(entry =>
      entry.id === linkId
        ? { ...entry, status: 'revoked' as const, consent: { verified: false, method: null, verifiedAt: null } }
        : entry
    );
    ParentService.saveState(state);
    return { success: true, message: `${link.childName} was unlinked and consent was revoked.` };
  }

  public static getConsentStatus(childId: string): ConsentRecord {
    const link = ParentService.loadState().links.find(entry => entry.childId === childId);
    if (!link) return { verified: false, method: null, verifiedAt: null };
    return { ...link.consent };
  }

  public static getNotificationPreferences(): NotificationPreference {
    return JSON.parse(JSON.stringify(ParentService.loadState().preferences));
  }

  public static updateNotificationPreferences(
    patch: Partial<Pick<NotificationPreference, 'channels' | 'frequency' | 'locale' | 'criticalAlerts' | 'destinationPhone' | 'destinationEmail'>>
  ): PreferenceUpdateResult {
    const state = ParentService.loadState();
    const candidate: NotificationPreference = { ...state.preferences, ...patch };

    const allowedFrequencies: DigestFrequency[] = ['weekly', 'bi-weekly'];
    if (!allowedFrequencies.includes(candidate.frequency)) {
      return { success: false, error: 'Digest frequency must be weekly or bi-weekly.' };
    }

    const anyChannelEnabled = (Object.values(candidate.channels) as boolean[]).some(Boolean);
    if (!anyChannelEnabled) {
      return { success: false, error: 'At least one notification channel must stay enabled.' };
    }

    const usesPhone = candidate.channels.sms || candidate.channels.whatsapp;
    if (usesPhone && !isValidE164(candidate.destinationPhone)) {
      return { success: false, error: 'Enter a valid E.164 phone number such as +254712345678.' };
    }
    if (candidate.channels.email && !isValidEmail(candidate.destinationEmail)) {
      return { success: false, error: 'Enter a valid email address for email digests.' };
    }

    state.preferences = candidate;
    ParentService.saveState(state);
    return { success: true, preferences: JSON.parse(JSON.stringify(candidate)) };
  }

  public static getAttendanceRecords(childId: string): ChildAttendanceRecord[] {
    return withinChild(ParentService.loadState().attendance, childId);
  }

  public static getEngagementRecords(childId: string): DailyEngagementRecord[] {
    return withinChild(ParentService.loadState().engagement, childId);
  }

  public static getSubjectScores(childId: string): ChildSubjectScoreRecord[] {
    return withinChild(ParentService.loadState().subjectScores, childId);
  }

  public static getTasks(childId: string): UpcomingTask[] {
    return withinChild(ParentService.loadState().tasks, childId);
  }

  public static getTeacherNotes(childId: string): TeacherNote[] {
    return withinChild(ParentService.loadState().teacherNotes, childId);
  }

  public static getUpcomingTasks(childId: string, limit = 5): UpcomingTask[] {
    const today = todayISO();
    return ParentService.getTasks(childId)
      .filter(task => task.status === 'upcoming' && task.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, limit);
  }

  public static buildProgressSummary(childId: string, anchor: string = todayISO()): ChildProgressSummary {
    const meta = ParentService.getChildMeta(childId);
    if (!meta) throw new Error(`Unknown child "${childId}"`);

    const window = rollingWindow(anchor, REPORTING_WINDOW_DAYS);
    const previous = previousWindow(window);

    const attendance = ParentService.getAttendanceRecords(childId);
    const tasks = ParentService.getTasks(childId);
    const scores = ParentService.getSubjectScores(childId);
    const engagement = ParentService.getEngagementRecords(childId);

    const attendanceRate = calculateAttendanceRate(attendance, window);
    const previousAttendanceRate = calculateAttendanceRate(attendance, previous);
    const homeworkRate = calculateHomeworkCompletionRate(tasks, window);
    const previousHomeworkRate = calculateHomeworkCompletionRate(tasks, previous);
    const averageScore = calculateAverageScore(scores, window);
    const previousAverageScore = calculateAverageScore(scores, previous);
    const engagementMinutes = calculateEngagementMinutes(engagement, window);
    const previousEngagementMinutes = calculateEngagementMinutes(engagement, previous);
    const subjectPerformance = calculateSubjectPerformance(scores, window, previous);

    return {
      childId,
      childName: meta.childName,
      gradeLevel: meta.gradeLevel,
      windowStart: window.start,
      windowEnd: window.end,
      attendanceRate,
      previousAttendanceRate,
      attendanceTrend: calculateTrend(attendanceRate, previousAttendanceRate),
      homeworkCompletionRate: homeworkRate,
      previousHomeworkCompletionRate: previousHomeworkRate,
      homeworkTrend: calculateTrend(homeworkRate, previousHomeworkRate),
      averageScore,
      previousAverageScore,
      scoreTrend: calculateTrend(averageScore, previousAverageScore),
      engagementMinutes,
      previousEngagementMinutes,
      engagementTrend: calculateTrend(engagementMinutes, previousEngagementMinutes),
      subjectPerformance,
      strongSubjects: pickStrongSubjects(subjectPerformance),
      focusSubjects: pickFocusSubjects(subjectPerformance),
      upcomingTasks: ParentService.getUpcomingTasks(childId),
      computedAt: Date.now(),
    };
  }

  public static listProgressSummaries(anchor: string = todayISO()): ChildProgressSummary[] {
    return ParentService.getActiveLinks().map(link => ParentService.buildProgressSummary(link.childId, anchor));
  }

  public static buildWeeklyDigest(childId: string, anchor: string = todayISO()): WeeklyDigest {
    const summary = ParentService.buildProgressSummary(childId, anchor);
    const profile = ParentService.getProfile();
    const window: TimeWindow = { start: summary.windowStart, end: summary.windowEnd };

    const spotlight =
      [...summary.subjectPerformance].sort((a, b) => b.averageScore - a.averageScore)[0] ?? null;
    const topSubject = {
      subject: spotlight?.subject ?? 'General Studies',
      modulesCompleted: spotlight?.modulesCompleted ?? 0,
      averageScore: spotlight?.averageScore ?? 0,
    };

    const formatLine = (entry: SubjectPerformance): string =>
      `${entry.subject} — ${entry.averageScore}% (${entry.scoreTrend >= 0 ? '+' : ''}${entry.scoreTrend})`;

    const strengths = summary.subjectPerformance
      .filter(entry => summary.strongSubjects.includes(entry.subject))
      .map(formatLine);
    const weaknesses = summary.subjectPerformance
      .filter(entry => summary.focusSubjects.includes(entry.subject))
      .map(formatLine);

    const teacherNotes = withinWindow(ParentService.getTeacherNotes(childId), window, 'createdAt');

    return {
      id: `digest-${childId}-${summary.windowEnd}`,
      parentId: profile.id,
      childId,
      childFirstName: summary.childName.split(' ')[0],
      parentSalutation: profile.salutation,
      parentSalutationSw: profile.salutationSw,
      windowStart: summary.windowStart,
      windowEnd: summary.windowEnd,
      generatedAt: Date.now(),
      modulesCompleted: summary.subjectPerformance.reduce((sum, entry) => sum + entry.modulesCompleted, 0),
      averageScore: summary.averageScore,
      previousAverageScore: summary.previousAverageScore,
      scoreTrend: summary.scoreTrend,
      attendanceRate: summary.attendanceRate,
      homeworkCompletionRate: summary.homeworkCompletionRate,
      topSubject,
      strengths,
      weaknesses,
      teacherNotes,
      nextTask: summary.upcomingTasks[0] ?? null,
    };
  }

  /**
   * Localized digest renderer shared by the Weekly Digest card and the SMS /
   * WhatsApp gateway. English mirrors the MASTER_PLAN copy deck; Swahili uses
   * curriculum subject translations and Swahili weekday names.
   */
  public static renderDigestMessage(digest: WeeklyDigest, locale: PortalLocale): string {
    const dueWhen = (dueDate: string, lang: 'en' | 'sw'): string => {
      const withinSevenDays = dueDate <= daysAheadISO(6, new Date(`${digest.windowEnd}T00:00:00`));
      const weekday = weekdayName(dueDate, lang);
      return withinSevenDays ? (lang === 'sw' ? `${weekday} hii` : `this ${weekday}`) : `${shortDate(dueDate)}`;
    };

    if (locale === 'sw') {
      const subjectSw = SW_SUBJECT[digest.topSubject.subject] ?? digest.topSubject.subject.toLowerCase();
      let message = `Habari ${digest.parentSalutationSw}, ${digest.childFirstName} amekamilisha moduli ${digest.topSubject.modulesCompleted} za ${subjectSw} wiki hii kwa wastani wa alama ${digest.topSubject.averageScore}%.`;
      if (digest.nextTask) {
        const when = dueWhen(digest.nextTask.dueDate, 'sw');
        const clause =
          digest.nextTask.type === 'assignment'
            ? `Kazi ijayo ya ${digest.nextTask.subject} inaisha ${when}.`
            : `Mtihani ujao wa ${digest.nextTask.subject} ni ${when}.`;
        message += ` ${clause}`;
      }
      return message;
    }

    const shortSubject = EN_SHORT_SUBJECT[digest.topSubject.subject] ?? digest.topSubject.subject.toLowerCase();
    let message = `Hello ${digest.parentSalutation}, ${digest.childFirstName} completed ${digest.topSubject.modulesCompleted} ${shortSubject} modules this week with an ${digest.topSubject.averageScore}% average score.`;
    if (digest.nextTask) {
      const when = dueWhen(digest.nextTask.dueDate, 'en');
      message += ` Next ${digest.nextTask.subject} ${digest.nextTask.type} is ${when}.`;
    }
    return message;
  }
}

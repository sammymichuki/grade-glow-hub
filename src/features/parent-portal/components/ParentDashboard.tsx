import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CalendarCheck2,
  ClipboardCheck,
  MessageCircleHeart,
  Monitor,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ParentService, formatEngagementMinutes } from '../services/parentService';
import { shortDate } from '../services/portalDates';
import { ChildProgressSummary, StudentChildLink } from '../types/parentPortal';

interface ParentDashboardProps {
  onMessageTeacher?: () => void;
}

const scoreColor = (score: number): string => {
  if (score >= 80) return '#059669';
  if (score < 65) return '#d97706';
  return '#0d9488';
};

const TrendChip: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
  const tone =
    value > 0 ? 'bg-emerald-100 text-emerald-800' : value < 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {value > 0 ? `+${value}` : value}
      {suffix}
    </span>
  );
};

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onMessageTeacher }) => {
  const links = useMemo(() => ParentService.getActiveLinks(), []);
  const [activeChildId, setActiveChildId] = useState<string>(() => links[0]?.childId ?? '');

  const activeLink: StudentChildLink | undefined =
    links.find(link => link.childId === activeChildId) ?? links[0];

  const summary: ChildProgressSummary | null = useMemo(() => {
    if (!activeLink) return null;
    return ParentService.buildProgressSummary(activeLink.childId);
  }, [activeLink]);

  if (!activeLink || !summary) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">No children linked yet</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Ask your school for a verification code, then link your child from the Notification Preferences tab to unlock
          attendance, grades and weekly digests.
        </p>
      </div>
    );
  }

  const kpis = [
    {
      key: 'attendance',
      label: 'Attendance',
      value: `${summary.attendanceRate}%`,
      trend: summary.attendanceTrend,
      suffix: '',
      hint: `${summary.previousAttendanceRate}% last period`,
      icon: CalendarCheck2,
      accent: 'bg-education-primary/10 text-education-primary',
    },
    {
      key: 'homework',
      label: 'Homework Completion',
      value: `${summary.homeworkCompletionRate}%`,
      trend: summary.homeworkTrend,
      suffix: '',
      hint: `${summary.previousHomeworkCompletionRate}% last period`,
      icon: ClipboardCheck,
      accent: 'bg-teal-100 text-teal-700',
    },
    {
      key: 'score',
      label: 'Average Score',
      value: `${summary.averageScore}%`,
      trend: summary.scoreTrend,
      suffix: '',
      hint: `${summary.previousAverageScore}% last period`,
      icon: Target,
      accent: 'bg-indigo-100 text-indigo-700',
    },
    {
      key: 'screen',
      label: 'Screen Time This Week',
      value: formatEngagementMinutes(summary.engagementMinutes),
      trend: summary.engagementTrend,
      suffix: 'm',
      hint: `${formatEngagementMinutes(summary.previousEngagementMinutes)} last period`,
      icon: Monitor,
      accent: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Child selector */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Select child">
        {links.map(link => {
          const isActive = link.childId === activeLink.childId;
          return (
            <button
              key={link.childId}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveChildId(link.childId)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-education-primary text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{link.childName}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-education-primary/10 text-education-primary'}`}>
                Grade {link.gradeLevel}
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" data-testid="kpi-grid">
        {kpis.map(kpi => (
          <div key={kpi.key} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${kpi.accent}`}>
                <kpi.icon className="h-5 w-5" />
              </span>
              <TrendChip value={kpi.trend} suffix={kpi.suffix} />
            </div>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{kpi.value}</p>
            <p className="text-xs font-semibold text-gray-600">{kpi.label}</p>
            <p className="text-[11px] text-gray-400">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Grades per subject */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900">Grades by Subject</h3>
            <span className="text-[11px] text-gray-500">
              {shortDate(summary.windowStart)} – {shortDate(summary.windowEnd)}
            </span>
          </div>

          <div className="space-y-4" data-testid="subject-breakdown">
            {summary.subjectPerformance.map(entry => (
              <div key={entry.subject} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">{entry.subject}</span>
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    {entry.averageScore}%
                    <TrendChip value={entry.scoreTrend} />
                  </span>
                </div>
                <Progress value={entry.averageScore} className={entry.averageScore < 65 ? 'h-2 [&>div]:bg-amber-500' : 'h-2 [&>div]:bg-education-primary'} />
              </div>
            ))}
          </div>

          <div className="h-[220px] w-full" data-testid="subject-chart" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.subjectPerformance} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                  {summary.subjectPerformance.map(entry => (
                    <Cell key={entry.subject} fill={scoreColor(entry.averageScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths / focus + upcoming tasks */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Strong Subjects
            </h3>
            <div className="flex flex-wrap gap-1.5" data-testid="strong-subjects">
              {summary.strongSubjects.map(subject => (
                <span key={subject} className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {subject}
                </span>
              ))}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="h-4 w-4" /> Needs Focus
            </h3>
            <div className="flex flex-wrap gap-1.5" data-testid="focus-subjects">
              {summary.focusSubjects.map(subject => (
                <span key={subject} className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-amber-800">
                  {subject}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Upcoming Tasks</h3>
            <ul className="space-y-2.5" data-testid="upcoming-tasks">
              {summary.upcomingTasks.length === 0 && (
                <li className="text-xs text-gray-500">Nothing due in the next few days.</li>
              )}
              {summary.upcomingTasks.map(task => (
                <li key={task.id} className="flex items-start gap-2 border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                  <Badge
                    variant={task.type === 'exam' ? 'destructive' : 'secondary'}
                    className="uppercase text-[10px] shrink-0"
                  >
                    {task.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{task.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {task.subject} · due {shortDate(task.dueDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {onMessageTeacher && (
              <Button
                type="button"
                onClick={onMessageTeacher}
                variant="outline"
                className="w-full text-xs font-semibold border-education-primary text-education-primary hover:bg-education-primary/10"
              >
                <MessageCircleHeart className="h-3.5 w-3.5 mr-1.5" /> Message Instructor
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

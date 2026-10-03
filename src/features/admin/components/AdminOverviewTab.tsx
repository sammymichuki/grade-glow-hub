import React from 'react';
import { PlatformMetrics, SystemAuditLog } from '@/shared/types/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  GraduationCap,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  HardDrive,
  BarChart3,
  Flame,
} from 'lucide-react';
import { SAMPLE_ENROLLMENT_TRENDS, SAMPLE_SUBJECT_DISTRIBUTION } from '../data/sampleAdminData';

interface AdminOverviewTabProps {
  metrics: PlatformMetrics;
  recentAuditLogs: SystemAuditLog[];
  onNavigateToTab: (tab: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  metrics,
  recentAuditLogs,
  onNavigateToTab,
}) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="p-5 bg-white shadow-sm border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Users
            </span>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-gray-900">{metrics.totalUsers}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{metrics.activeUsers} active ({Math.round((metrics.activeUsers / (metrics.totalUsers || 1)) * 100)}%)</span>
            </div>
          </div>
        </Card>

        {/* Courses Offered */}
        <Card className="p-5 bg-white shadow-sm border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Curriculum Courses
            </span>
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-gray-900">{metrics.totalCourses}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{metrics.publishedCourses} published • {metrics.totalCourses - metrics.publishedCourses} draft/archived</span>
            </div>
          </div>
        </Card>

        {/* Total Enrollments */}
        <Card className="p-5 bg-white shadow-sm border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Enrollments
            </span>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-gray-900">{metrics.totalEnrollments.toLocaleString()}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700 font-medium">
              <Flame className="w-3.5 h-3.5" />
              <span>Rating: {metrics.averageCourseRating} / 5.0 avg</span>
            </div>
          </div>
        </Card>

        {/* System Health / Uptime */}
        <Card className="p-5 bg-white shadow-sm border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              System Availability
            </span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-gray-900">{metrics.systemUptimePercentage}%</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All microservices operational</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Visualizer (2 cols) */}
        <Card className="lg:col-span-2 shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-education-primary" />
                  Institutional Growth & Quiz Completions
                </CardTitle>
                <CardDescription className="text-xs">
                  Active monthly learners and verified quiz submissions
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">2026 Academic Term</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {SAMPLE_ENROLLMENT_TRENDS.map((item) => {
                  const maxVal = 1300;
                  const barHeight = Math.max(15, Math.round((item.students / maxVal) * 120));
                  const quizHeight = Math.max(10, Math.round((item.quizzesTaken / maxVal) * 120));

                  return (
                    <div key={item.month} className="flex flex-col items-center gap-2">
                      <div className="h-36 w-full flex items-end justify-center gap-1.5 bg-gray-50/80 rounded-t p-1">
                        <div
                          className="w-1/2 bg-education-primary/80 rounded-t transition-all hover:bg-education-primary"
                          style={{ height: `${barHeight}px` }}
                          title={`Learners: ${item.students}`}
                        />
                        <div
                          className="w-1/2 bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
                          style={{ height: `${quizHeight}px` }}
                          title={`Quizzes: ${item.quizzesTaken}`}
                        />
                      </div>
                      <span className="font-semibold text-gray-700 text-[11px]">{item.month}</span>
                      <span className="text-[10px] text-gray-400">{item.students}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 pt-3 border-t text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-education-primary/80 inline-block" />
                  <span>Enrolled Students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                  <span>Assessments Completed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Distribution (1 col) */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900">
              Department Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Student enrollment spread by academic subject
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {SAMPLE_SUBJECT_DISTRIBUTION.map((subj) => (
              <div key={subj.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-700">{subj.name}</span>
                  <span className="font-semibold text-gray-900">
                    {subj.count} ({subj.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-education-primary h-full rounded-full transition-all"
                    style={{ width: `${subj.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t text-center">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onNavigateToTab('courses')}
              >
                Manage All Courses & Subjects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Subsystems Telemetry Cards */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-700" />
              Subsystem Integrity
            </CardTitle>
            <CardDescription className="text-xs">
              Live status of storage, queues, and sync engines
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-gray-800">IndexedDB Client Cache</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                Optimal
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-gray-800">Telemetry Streamer</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-gray-800">Offline Sync Queue</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                0 Pending
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-gray-800">RBAC Role Authority</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                Strict Guard
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-education-primary hover:text-education-primary"
              onClick={() => onNavigateToTab('health')}
            >
              Open Full Diagnostics & Telemetry &rarr;
            </Button>
          </CardContent>
        </Card>

        {/* Recent Audit Activities (2 cols) */}
        <Card className="lg:col-span-2 shadow-sm border">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-education-primary" />
                Recent System Audit Trail
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time security, course updates, and role modifications
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onNavigateToTab('health')}
            >
              View All Logs
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentAuditLogs.slice(0, 4).map((log) => {
                const badgeColor =
                  log.severity === 'critical'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : log.severity === 'warning'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50/70 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">{log.action}</span>
                        <Badge variant="outline" className={`text-[10px] uppercase font-semibold ${badgeColor}`}>
                          {log.severity}
                        </Badge>
                        <span className="text-[11px] text-gray-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-700">{log.details || log.target}</p>
                      <p className="text-[11px] text-gray-400">Actor: <span className="font-medium text-gray-600">{log.actor}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

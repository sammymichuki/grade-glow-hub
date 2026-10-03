import React, { useState } from 'react';
import { AdminService } from '../services/adminService';
import { AdminOverviewTab } from './AdminOverviewTab';
import { UserManagementTab } from './UserManagementTab';
import { CourseOversightTab } from './CourseOversightTab';
import { SystemHealthTab } from './SystemHealthTab';
import { PlatformSettingsTab } from './PlatformSettingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Activity,
  Settings,
  ShieldCheck,
  Download,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Reactive state from AdminService
  const [metrics, setMetrics] = useState(AdminService.getMetrics());
  const [users, setUsers] = useState(AdminService.getUsers());
  const [courses, setCourses] = useState(AdminService.getCourses());
  const [auditLogs, setAuditLogs] = useState(AdminService.getAuditLogs());
  const [settings, setSettings] = useState(AdminService.getSettings());

  const refreshData = () => {
    setMetrics(AdminService.getMetrics());
    setUsers(AdminService.getUsers());
    setCourses(AdminService.getCourses());
    setAuditLogs(AdminService.getAuditLogs());
    setSettings(AdminService.getSettings());
  };

  const handleExportSystemReport = () => {
    const report = {
      institution: settings.institutionName,
      generatedAt: new Date().toISOString(),
      metrics: AdminService.getMetrics(),
      userCount: users.length,
      courseCount: courses.length,
      auditLogCount: auditLogs.length,
      settings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gradeglow-system-report-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Executive System Report downloaded.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Administrative Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-education-primary">
              Enterprise Administration
            </span>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              <ShieldCheck className="w-3 h-3 mr-1" /> RBAC Admin Authority
            </Badge>
            {settings.maintenanceMode && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                Maintenance Mode
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            {settings.institutionName} Control Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Centralized platform governance, role authority, curriculum supervision, and operational diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportSystemReport} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export System Report
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center border-b pb-3 overflow-x-auto">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="overview" className="gap-1.5 text-xs md:text-sm">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs md:text-sm">
              <Users className="w-4 h-4" /> User Accounts ({users.length})
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1.5 text-xs md:text-sm">
              <BookOpen className="w-4 h-4" /> Course Oversight ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-1.5 text-xs md:text-sm">
              <Activity className="w-4 h-4" /> System Health & Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
              <Settings className="w-4 h-4" /> Platform Policies
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <AdminOverviewTab
            metrics={metrics}
            recentAuditLogs={auditLogs}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-0 focus-visible:outline-none">
          <UserManagementTab users={users} onUsersChange={refreshData} />
        </TabsContent>

        <TabsContent value="courses" className="mt-0 focus-visible:outline-none">
          <CourseOversightTab courses={courses} onCoursesChange={refreshData} />
        </TabsContent>

        <TabsContent value="health" className="mt-0 focus-visible:outline-none">
          <SystemHealthTab auditLogs={auditLogs} onAuditLogsChange={refreshData} />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
          <PlatformSettingsTab settings={settings} onSettingsChange={refreshData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

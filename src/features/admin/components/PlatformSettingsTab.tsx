import React, { useState } from 'react';
import { PlatformSettings } from '@/shared/types/admin';
import { AdminService } from '../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Save,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Globe2,
  Lock,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSettingsTabProps {
  settings: PlatformSettings;
  onSettingsChange: () => void;
}

export const PlatformSettingsTab: React.FC<PlatformSettingsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [form, setForm] = useState<PlatformSettings>({ ...settings });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (key: keyof PlatformSettings) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInputChange = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      AdminService.updateSettings(form);
      toast.success('Institutional platform settings saved successfully!');
      onSettingsChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefaults = () => {
    AdminService.resetToDefault();
    const defaults = AdminService.getSettings();
    setForm({ ...defaults });
    toast.info('Settings restored to institutional defaults.');
    onSettingsChange();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(form, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `platform-settings-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Settings exported to JSON.');
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      {/* Maintenance Mode Warning Notice */}
      {form.maintenanceMode && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Maintenance Mode Is Active</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Standard students and parents cannot access new lessons while maintenance mode is engaged.
              Administrative and Instructor roles retain full access.
            </p>
          </div>
        </div>
      )}

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institutional Identity Card */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-education-primary" />
              Institutional Identity & Contact
            </CardTitle>
            <CardDescription className="text-xs">
              Global branding and support channels visible to learners
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Institution / Academy Name</label>
              <Input
                value={form.institutionName}
                onChange={(e) => handleInputChange('institutionName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Support & Help Desk Email</label>
              <Input
                type="email"
                value={form.supportEmail}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Default Platform Language</label>
              <select
                value={form.defaultLanguage}
                onChange={(e) =>
                  handleInputChange('defaultLanguage', e.target.value as PlatformSettings['defaultLanguage'])
                }
                aria-label="Default Language"
                className="w-full border rounded p-2 text-xs bg-white text-gray-800"
              >
                <option value="en">English (US / Global)</option>
                <option value="sw">Kiswahili (East Africa)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Policies Card */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-education-primary" />
              Security & Access Policies
            </CardTitle>
            <CardDescription className="text-xs">
              Registration gateways and session authentication lifetimes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-gray-50 border">
              <div>
                <p className="font-semibold text-gray-800">Maintenance Mode</p>
                <p className="text-[11px] text-gray-500">Lock portal for scheduled curriculum updates</p>
              </div>
              <Switch
                checked={form.maintenanceMode}
                onCheckedChange={() => handleToggle('maintenanceMode')}
                aria-label="Toggle Maintenance Mode"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-gray-50 border">
              <div>
                <p className="font-semibold text-gray-800">Public Self-Registration</p>
                <p className="text-[11px] text-gray-500">Allow students to sign up without admin invite</p>
              </div>
              <Switch
                checked={form.allowSelfRegistration}
                onCheckedChange={() => handleToggle('allowSelfRegistration')}
                aria-label="Toggle Public Registration"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Session Timeout (Minutes)</label>
              <Input
                type="number"
                min={15}
                max={480}
                value={form.sessionTimeoutMinutes}
                onChange={(e) => handleInputChange('sessionTimeoutMinutes', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic & Assessment Integrity Card */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-education-primary" />
              Assessment & Grading Governance
            </CardTitle>
            <CardDescription className="text-xs">
              Examination timing enforcement and peer review guidelines
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-gray-50 border">
              <div>
                <p className="font-semibold text-gray-800">Strict Quiz Timers</p>
                <p className="text-[11px] text-gray-500">Auto-submit quiz attempts when countdown expires</p>
              </div>
              <Switch
                checked={form.enforceQuizTimers}
                onCheckedChange={() => handleToggle('enforceQuizTimers')}
                aria-label="Toggle Strict Timers"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-gray-50 border">
              <div>
                <p className="font-semibold text-gray-800">Cross-Peer Review Grading</p>
                <p className="text-[11px] text-gray-500">Enable double-blind peer scoring in community hub</p>
              </div>
              <Switch
                checked={form.allowPeerReviewCrossGrading}
                onCheckedChange={() => handleToggle('allowPeerReviewCrossGrading')}
                aria-label="Toggle Peer Review"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Maximum Allowed Quiz Attempts</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.maxQuizAttempts}
                onChange={(e) => handleInputChange('maxQuizAttempts', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Offline Engine Parameters */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-education-primary" />
              Offline Sync Tuning
            </CardTitle>
            <CardDescription className="text-xs">
              Client cache reconciliation intervals for low-bandwidth environments
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Background Sync Interval (Minutes)</label>
              <Input
                type="number"
                min={1}
                max={60}
                value={form.offlineSyncIntervalMinutes}
                onChange={(e) => handleInputChange('offlineSyncIntervalMinutes', Number(e.target.value))}
              />
              <p className="text-[11px] text-gray-400">
                Recommended: 5 minutes for mobile/offline classrooms
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded border space-y-2">
              <p className="font-semibold text-gray-800">Configuration Backup</p>
              <p className="text-[11px] text-gray-500">Download current institutional parameters in JSON format.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="gap-1.5 text-xs w-full"
              >
                <Download className="w-3.5 h-3.5" /> Export Configuration JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              Restore Factory Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Settings to Factory Defaults?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all platform policies and timers to original institutional presets.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetDefaults} className="bg-rose-600 hover:bg-rose-700 text-white">
                Reset All Settings
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto gap-1.5 text-xs bg-education-primary hover:bg-education-primary/90 text-white"
          >
            <Save className="w-3.5 h-3.5" /> Save Platform Policies
          </Button>
        </div>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import { BellRing, Link2, MessageCircle, Save, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ParentService } from '../services/parentService';
import { DigestFrequency, NotificationChannel, NotificationPreference, PortalLocale } from '../types/parentPortal';

interface NotificationPreferencesPanelProps {
  onChildLinked?: (childId: string) => void;
}

const CHANNEL_META: Array<{ channel: NotificationChannel; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  { channel: 'whatsapp', label: 'WhatsApp', description: 'Rich weekly progress messages on WhatsApp', icon: MessageCircle },
  { channel: 'sms', label: 'SMS', description: 'Plain-text digests for basic feature phones', icon: Smartphone },
  { channel: 'push', label: 'Push Notifications', description: 'Instant alerts on the GradeGlow web app', icon: BellRing },
  { channel: 'email', label: 'Email', description: 'Long-form weekly reports to your inbox', icon: BellRing },
];

export const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({ onChildLinked }) => {
  const [preferences, setPreferences] = useState<NotificationPreference>(() => ParentService.getNotificationPreferences());
  const [saveState, setSaveState] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [linkCode, setLinkCode] = useState('');
  const [linkState, setLinkState] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const setChannel = (channel: NotificationChannel, enabled: boolean) => {
    setPreferences(current => ({ ...current, channels: { ...current.channels, [channel]: enabled } }));
    setSaveState(null);
  };

  const handleSave = () => {
    const result = ParentService.updateNotificationPreferences(preferences);
    if (result.success && result.preferences) {
      setPreferences(result.preferences);
      setSaveState({ tone: 'success', text: 'Notification preferences saved.' });
    } else {
      setSaveState({ tone: 'error', text: result.error ?? 'Unable to save preferences.' });
    }
  };

  const handleLink = () => {
    const result = ParentService.linkChild(linkCode);
    if (result.success && result.link) {
      setLinkState({ tone: 'success', text: result.message });
      setLinkCode('');
      onChildLinked?.(result.link.childId);
    } else {
      setLinkState({ tone: 'error', text: result.message });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Delivery Channels</h3>
          <p className="text-xs text-gray-500 mt-0.5">Choose where the automated progress digests are dispatched.</p>
        </div>

        <div className="space-y-4">
          {CHANNEL_META.map(meta => (
            <div key={meta.channel} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="h-8 w-8 rounded-lg bg-education-primary/10 text-education-primary flex items-center justify-center shrink-0">
                  <meta.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <Label htmlFor={`channel-${meta.channel}`} className="text-xs font-bold text-gray-800">
                    {meta.label}
                  </Label>
                  <p className="text-[11px] text-gray-500">{meta.description}</p>
                </div>
              </div>
              <Switch
                id={`channel-${meta.channel}`}
                checked={preferences.channels[meta.channel]}
                onCheckedChange={checked => setChannel(meta.channel, checked)}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="digest-frequency" className="text-xs font-bold text-gray-700">
              Digest Frequency
            </Label>
            <Select
              value={preferences.frequency}
              onValueChange={(value: string) => {
                setPreferences(current => ({ ...current, frequency: value as DigestFrequency }));
                setSaveState(null);
              }}
            >
              <SelectTrigger id="digest-frequency" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bi-weekly">Bi-weekly (every 2 weeks)</SelectItem>
                <SelectItem value="weekly">Weekly (every week)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="digest-locale" className="text-xs font-bold text-gray-700">
              Digest Language
            </Label>
            <Select
              value={preferences.locale}
              onValueChange={(value: string) => {
                setPreferences(current => ({ ...current, locale: value as PortalLocale }));
                setSaveState(null);
              }}
            >
              <SelectTrigger id="digest-locale" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Kiswahili</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="destination-phone" className="text-xs font-bold text-gray-700">
              Phone (E.164)
            </Label>
            <Input
              id="destination-phone"
              value={preferences.destinationPhone}
              onChange={event => {
                setPreferences(current => ({ ...current, destinationPhone: event.target.value }));
                setSaveState(null);
              }}
              placeholder="+254712345678"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="destination-email" className="text-xs font-bold text-gray-700">
              Email Address
            </Label>
            <Input
              id="destination-email"
              type="email"
              value={preferences.destinationEmail}
              onChange={event => {
                setPreferences(current => ({ ...current, destinationEmail: event.target.value }));
                setSaveState(null);
              }}
              placeholder="parent@example.com"
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-education-primary/20 bg-education-primary/5 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-gray-800">Critical Alerts</p>
            <p className="text-[11px] text-gray-500">Immediate notices for missed deadlines and sharp score drops.</p>
          </div>
          <Switch
            id="critical-alerts"
            checked={preferences.criticalAlerts}
            onCheckedChange={checked => {
              setPreferences(current => ({ ...current, criticalAlerts: checked }));
              setSaveState(null);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleSave} className="bg-education-primary hover:bg-education-primary/90 text-white text-xs font-semibold">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Preferences
          </Button>
          {saveState && (
            <span
              role="status"
              className={`text-xs font-semibold ${saveState.tone === 'success' ? 'text-emerald-700' : 'text-red-600'}`}
            >
              {saveState.text}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4 h-fit">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Link2 className="h-4 w-4 text-education-primary" /> Link a Child
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Enter the 9-character verification code (format <span className="font-bold">GG-AB12CD</span>) issued by your
            school to connect a student account.
          </p>
        </div>
        <div className="space-y-2">
          <Input
            value={linkCode}
            onChange={event => {
              setLinkCode(event.target.value);
              setLinkState(null);
            }}
            placeholder="GG-AB12CD"
            aria-label="Child verification code"
            className="text-sm uppercase"
          />
          <Button
            type="button"
            onClick={handleLink}
            disabled={linkCode.trim().length === 0}
            className="w-full bg-education-primary hover:bg-education-primary/90 text-white text-xs font-semibold"
          >
            Verify & Link Child
          </Button>
          {linkState && (
            <p role="alert" className={`text-xs font-semibold ${linkState.tone === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
              {linkState.text}
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Linked Children</h4>
          <ul className="space-y-1.5">
            {ParentService.getActiveLinks().map(link => (
              <li key={link.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <span className="text-xs font-semibold text-gray-800 truncate">{link.childName}</span>
                <span className="text-[10px] font-bold text-education-primary shrink-0">Grade {link.gradeLevel}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

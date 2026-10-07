import React, { useMemo, useState } from 'react';
import { DownloadCloud, Gauge, Image, MonitorPlay, RefreshCw, Wifi, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { BandwidthMode } from '@/features/edge-mesh/types/edgeMesh';
import {
  BandwidthPreferences,
  DEFAULT_LESSONS_PER_MONTH,
  estimateKbPerLesson,
  formatKb,
  getNetworkInformation,
  loadPreferences,
  NavigatorWithNetworkInfo,
  projectMonthlyKb,
  savePreferences,
  shouldApplyDataSaver,
} from '../services/bandwidthOptimizer';

export interface BandwidthOptimizerSettingsProps {
  onChange?: (preferences: BandwidthPreferences) => void;
  storage?: Storage | null;
  initialLessonsPerMonth?: number;
  className?: string;
}

interface ContentSwitchRow {
  key: keyof Pick<
    BandwidthPreferences,
    'videoAutoplay' | 'hdImages' | 'autoSync' | 'prefetch'
  >;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CONTENT_SWITCHES: ContentSwitchRow[] = [
  {
    key: 'videoAutoplay',
    label: 'Auto-play lesson video',
    description: 'Streams rich video as soon as a lesson opens',
    icon: MonitorPlay,
  },
  {
    key: 'hdImages',
    label: 'HD illustrations',
    description: 'Full-resolution diagrams instead of compressed tiles',
    icon: Image,
  },
  {
    key: 'autoSync',
    label: 'Auto-sync in background',
    description: 'Pushes quiz deltas whenever a link is available',
    icon: RefreshCw,
  },
  {
    key: 'prefetch',
    label: 'Prefetch next lesson',
    description: 'Downloads the upcoming lesson ahead of time',
    icon: DownloadCloud,
  },
];

const MODE_COPY: Record<
  BandwidthMode,
  { title: string; blurb: string; icon: React.ComponentType<{ className?: string }> }
> = {
  rich: {
    title: 'Rich Media Mode',
    blurb: 'HD video, full diagrams and instant prefetch',
    icon: Zap,
  },
  'data-saver': {
    title: 'Data-Saver Audio & Text',
    blurb: 'Narrated slide decks, vector art and plain text',
    icon: Gauge,
  },
};

export const BandwidthOptimizerSettings: React.FC<BandwidthOptimizerSettingsProps> = ({
  onChange,
  storage,
  initialLessonsPerMonth = DEFAULT_LESSONS_PER_MONTH,
  className = '',
}) => {
  const [preferences, setPreferences] = useState<BandwidthPreferences>(() => loadPreferences(storage));
  const [lessonsPerMonth, setLessonsPerMonth] = useState<number>(initialLessonsPerMonth);

  const networkInfo = useMemo(
    () => getNetworkInformation(navigator as Navigator & NavigatorWithNetworkInfo),
    []
  );
  const meteredActive = shouldApplyDataSaver(preferences, networkInfo);
  const effectivePreferences: BandwidthPreferences = meteredActive
    ? { ...preferences, mode: 'data-saver' }
    : preferences;

  const richKb = estimateKbPerLesson({ ...preferences, mode: 'rich' });
  const saverKb = estimateKbPerLesson({ ...preferences, mode: 'data-saver' });
  const activeKb = estimateKbPerLesson(effectivePreferences);
  const monthlyKb = projectMonthlyKb(effectivePreferences, lessonsPerMonth);
  const richMonthlyKb = projectMonthlyKb({ ...preferences, mode: 'rich' }, lessonsPerMonth);
  const savingsPct =
    richMonthlyKb > 0 ? Math.max(0, Math.round((1 - monthlyKb / richMonthlyKb) * 100)) : 0;

  const update = (patch: Partial<BandwidthPreferences>): void => {
    const next = savePreferences({ ...preferences, ...patch }, storage);
    setPreferences(next);
    onChange?.(next);
  };

  return (
    <section
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-5 ${className}`}
      aria-label="Bandwidth optimizer settings"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-gray-900">Bandwidth Optimizer</h3>
        <p className="text-xs text-gray-500">
          Choose how much data each lesson may consume. Preferences persist on this device and follow you
          across sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['rich', 'data-saver'] as BandwidthMode[]).map((mode) => {
          const copy = MODE_COPY[mode];
          const isSelected = preferences.mode === mode;
          const kb = mode === 'rich' ? richKb : saverKb;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={isSelected}
              onClick={() => update({ mode })}
              className={`text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <copy.icon className={`h-4 w-4 ${isSelected ? 'text-teal-700' : 'text-gray-400'}`} />
                  {copy.title}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  ~{formatKb(kb)}/lesson
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{copy.blurb}</p>
            </button>
          );
        })}
      </div>

      {meteredActive && (
        <div
          className="flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
          role="status"
        >
          <Wifi className="h-4 w-4 shrink-0" />
          Metered connection detected (Save-Data or 2G/3G) — data-saver applied automatically.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {CONTENT_SWITCHES.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-3 py-1">
            <div className="flex items-start gap-2.5 min-w-0">
              <row.icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <label htmlFor={`bw-${row.key}`} className="text-xs font-semibold text-gray-800 block">
                  {row.label}
                </label>
                <p className="text-[11px] text-gray-500 leading-snug">{row.description}</p>
              </div>
            </div>
            <Switch
              id={`bw-${row.key}`}
              checked={preferences[row.key]}
              onCheckedChange={(checked) => update({ [row.key]: checked } as Partial<BandwidthPreferences>)}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <Wifi className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
            <div>
              <label htmlFor="bw-metered" className="text-xs font-semibold text-gray-800 block">
                Apply data-saver automatically on metered connections
              </label>
              <p className="text-[11px] text-gray-500 leading-snug max-w-sm">
                Uses the Network Information API (Save-Data, effectiveType 2G/3G).{' '}
                {networkInfo ? 'Available in this browser.' : 'Unavailable — the rule stays dormant here.'}
              </p>
            </div>
          </div>
          <Switch
            id="bw-metered"
            checked={preferences.applyOnMeteredConnections}
            onCheckedChange={(checked) => update({ applyOnMeteredConnections: checked })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
              Projected monthly usage
            </span>
            <p className="text-2xl font-extrabold text-teal-950 mt-0.5" data-testid="monthly-usage">
              {formatKb(monthlyKb)}
              <span className="text-xs font-semibold text-teal-800 ml-2">
                {savingsPct}% below rich mode
              </span>
            </p>
            <p className="text-[11px] text-teal-800/80 mt-1">
              {formatKb(activeKb)}/lesson in {effectivePreferences.mode} mode
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="bw-lessons" className="text-xs font-semibold text-teal-900">
              Lessons / month
            </label>
            <Input
              id="bw-lessons"
              type="number"
              min={0}
              max={365}
              value={lessonsPerMonth}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                setLessonsPerMonth(Number.isFinite(parsed) ? Math.max(0, Math.min(365, parsed)) : 0);
              }}
              className="h-8 w-20 text-xs bg-white"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-md bg-white border border-teal-200 text-teal-900 font-semibold">
            Rich: {formatKb(richKb)}/lesson
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-teal-200 text-teal-900 font-semibold">
            Data-saver: {formatKb(saverKb)}/lesson
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-teal-200 text-teal-900 font-semibold">
            Baseline: {formatKb(richMonthlyKb)}/mo
          </span>
        </div>
      </div>

      <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
        Preferences persist on this device · data-saver mode targets &lt; 500 KB per lesson (Horizon 6).
      </div>
    </section>
  );
};

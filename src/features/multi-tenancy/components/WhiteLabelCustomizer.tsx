import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, RotateCcw, Save, Upload } from 'lucide-react';
import { DEFAULT_TENANT_THEME, TenantTheme } from '../types/tenant';
import { SAMPLE_SCHOOLS } from '../data/sampleDistrictData';
import { tenantContextService } from '../services/tenantContextService';

export interface WhiteLabelCustomizerProps {
  schoolId?: string;
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const WhiteLabelCustomizer: React.FC<WhiteLabelCustomizerProps> = ({ schoolId }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const defaultSchoolId = schoolId ?? SAMPLE_SCHOOLS[0].id;

  const [selectedSchoolId, setSelectedSchoolId] = useState(defaultSchoolId);
  const school = useMemo(
    () => SAMPLE_SCHOOLS.find((candidate) => candidate.id === selectedSchoolId) ?? SAMPLE_SCHOOLS[0],
    [selectedSchoolId]
  );

  const originalSubdomain = useMemo(() => {
    const entry = tenantContextService.getRegistryEntry(selectedSchoolId);
    return entry?.subdomain ?? school.subdomain;
  }, [selectedSchoolId, school.subdomain]);

  const [themeDraft, setThemeDraft] = useState<TenantTheme>(() =>
    tenantContextService.resolveTheme(defaultSchoolId)
  );
  const [subdomainDraft, setSubdomainDraft] = useState(originalSubdomain);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setThemeDraft(tenantContextService.resolveTheme(selectedSchoolId));
    setLogoError(null);
    const entry = tenantContextService.getRegistryEntry(selectedSchoolId);
    setSubdomainDraft(entry?.subdomain ?? school.subdomain);
  }, [selectedSchoolId, school.subdomain]);

  const cssVars = tenantContextService.themeToCssVars(themeDraft);

  useEffect(() => {
    tenantContextService.applyThemeToDocument(themeDraft);
  }, [themeDraft]);

  const subdomainValidation = tenantContextService.validateSubdomain(subdomainDraft);
  const subdomainAvailable = tenantContextService.isSubdomainAvailable(
    subdomainDraft,
    selectedSchoolId
  );
  const subdomainChanged = subdomainDraft !== originalSubdomain;
  const subdomainStatus: string | null = (() => {
    if (!subdomainValidation.valid) return subdomainValidation.error ?? 'Invalid subdomain.';
    if (subdomainChanged && !subdomainAvailable) {
      return `Subdomain "${subdomainDraft}" is already taken.`;
    }
    if (subdomainChanged) return `Subdomain "${subdomainDraft}" is available.`;
    return null;
  })();

  const membership = tenantContextService.getCurrentMembership(selectedSchoolId);
  const canBrand = tenantContextService.canManageBranding(selectedSchoolId);
  const saveBlocked = membership !== null && !canBrand;

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    if (!file.type.startsWith('image/')) {
      setLogoError('Crest must be an image file (PNG, SVG, or JPEG).');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Crest image must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setThemeDraft((current) => ({ ...current, logoDataUrl: result }));
      }
    };
    reader.onerror = () => setLogoError('Could not read the selected file.');
    reader.readAsDataURL(file);
  };

  const handleSave = (): void => {
    if (!subdomainValidation.valid) {
      toast.error(subdomainValidation.error ?? 'Invalid subdomain.');
      return;
    }
    if (subdomainChanged && !subdomainAvailable) {
      toast.error(`Subdomain "${subdomainDraft}" is already taken.`);
      return;
    }

    try {
      tenantContextService.updateTheme(selectedSchoolId, themeDraft);
      if (subdomainChanged) {
        tenantContextService.updateSubdomain(selectedSchoolId, subdomainDraft);
      }
      tenantContextService.applyThemeToDocument(themeDraft);
      const stamp = new Date().toISOString();
      setSavedAt(stamp);
      toast.success(`White-label theme applied to ${subdomainDraft}.gradeglow.com.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not apply the theme.');
    }
  };

  const handleReset = (): void => {
    const restored = tenantContextService.resetTheme(selectedSchoolId);
    setThemeDraft(restored);
    setSubdomainDraft(originalSubdomain);
    setLogoError(null);
    tenantContextService.applyThemeToDocument(restored);
    toast.success('School branding reset to district defaults.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 px-2 sm:px-0" data-testid="white-label-customizer">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-education-primary">
            White-Label Studio
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">Brand This School Tenant</h2>
          <p className="text-sm text-gray-500">
            Crest, palette, welcome copy, and vanity subdomain — persisted to the tenant registry.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-gray-600" htmlFor="wl-school-select">
            School
          </label>
          <select
            id="wl-school-select"
            aria-label="Select school"
            value={selectedSchoolId}
            onChange={(event) => setSelectedSchoolId(event.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {SAMPLE_SCHOOLS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
          {subdomainDraft}.gradeglow.com
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600">
          {membership
            ? canBrand
              ? `Role ${membership.role}: branding rights granted`
              : `Role ${membership.role}: branding rights required`
            : 'Preview mode: no session role bound'}
        </Badge>
        {savedAt && (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
            Saved {new Date(savedAt).toLocaleTimeString()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-indigo-600" /> Brand Assets
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700" htmlFor="wl-crest-input">
              School crest / logo
            </label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {themeDraft.logoDataUrl ? (
                  <img
                    src={themeDraft.logoDataUrl}
                    alt="Crest preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Upload className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="space-y-1.5">
                <input
                  id="wl-crest-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
                />
                <p className="text-[11px] text-gray-400">PNG, SVG or JPEG up to 2 MB.</p>
              </div>
            </div>
            {logoError && (
              <p className="text-[11px] font-semibold text-rose-600" role="alert">
                {logoError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700" htmlFor="wl-primary-color">
                Primary color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="wl-primary-color"
                  type="color"
                  aria-label="Primary brand color"
                  value={themeDraft.primaryColor}
                  onChange={(event) =>
                    setThemeDraft((current) => ({ ...current, primaryColor: event.target.value }))
                  }
                  className="h-9 w-12 rounded cursor-pointer border border-gray-200"
                />
                <span className="text-xs font-mono text-gray-600">{themeDraft.primaryColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700" htmlFor="wl-accent-color">
                Accent color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="wl-accent-color"
                  type="color"
                  aria-label="Accent brand color"
                  value={themeDraft.accentColor}
                  onChange={(event) =>
                    setThemeDraft((current) => ({ ...current, accentColor: event.target.value }))
                  }
                  className="h-9 w-12 rounded cursor-pointer border border-gray-200"
                />
                <span className="text-xs font-mono text-gray-600">{themeDraft.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700" htmlFor="wl-welcome-message">
              Welcome message
            </label>
            <textarea
              id="wl-welcome-message"
              aria-label="Welcome message"
              maxLength={240}
              rows={3}
              value={themeDraft.welcomeMessage}
              onChange={(event) =>
                setThemeDraft((current) => ({ ...current, welcomeMessage: event.target.value }))
              }
              className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <p className="text-[11px] text-gray-400 text-right">{themeDraft.welcomeMessage.length}/240</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700" htmlFor="wl-subdomain">
              Vanity subdomain
            </label>
            <div className="flex items-center gap-2">
              <input
                id="wl-subdomain"
                type="text"
                aria-label="Vanity subdomain"
                value={subdomainDraft}
                onChange={(event) => setSubdomainDraft(event.target.value.toLowerCase())}
                className="flex-1 min-w-0 text-xs font-mono rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="text-xs text-gray-500 shrink-0">.{tenantContextService.PLATFORM_DOMAIN}</span>
            </div>
            {subdomainStatus && (
              <p
                className={`text-[11px] font-semibold ${
                  subdomainValidation.valid && (!subdomainChanged || subdomainAvailable)
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
                role="status"
              >
                {subdomainStatus}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={saveBlocked}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save &amp; Apply
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-xs font-semibold gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Live Tenant Preview</h3>
          <div
            className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white"
            data-testid="brand-preview"
            style={{ ...(cssVars as React.CSSProperties), borderColor: themeDraft.accentColor }}
          >
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ backgroundColor: themeDraft.primaryColor }}
            >
              {themeDraft.logoDataUrl ? (
                <img src={themeDraft.logoDataUrl} alt="Crest preview" className="h-10 w-10 rounded-lg object-contain bg-white/90" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-sm font-black text-white">
                  {school.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">{school.name}</p>
                <p className="text-[11px] text-white/80 truncate">
                  {subdomainDraft}.{tenantContextService.PLATFORM_DOMAIN}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed" data-testid="welcome-message">
                {themeDraft.welcomeMessage || DEFAULT_TENANT_THEME.welcomeMessage}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: themeDraft.primaryColor,
                    color: tenantContextService.readableTextColor(themeDraft.primaryColor),
                  }}
                >
                  Primary action
                </span>
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: themeDraft.accentColor,
                    color: tenantContextService.readableTextColor(themeDraft.accentColor),
                  }}
                >
                  Accent badge
                </span>
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600">
                  {school.region} region
                </span>
              </div>
              <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: `${themeDraft.primaryColor}14` }}>
                <p className="font-bold" style={{ color: themeDraft.primaryColor }}>
                  Generated CSS custom properties
                </p>
                <ul className="mt-1 font-mono text-[10px] text-gray-600 space-y-0.5" data-testid="css-var-list">
                  <li>--tenant-primary: {cssVars['--tenant-primary']}</li>
                  <li>--tenant-accent: {cssVars['--tenant-accent']}</li>
                  <li>--tenant-on-primary: {cssVars['--tenant-on-primary']}</li>
                  <li>--tenant-on-accent: {cssVars['--tenant-on-accent']}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

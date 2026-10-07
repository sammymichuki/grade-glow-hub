import { z } from 'zod';
import {
  DEFAULT_TENANT_THEME,
  MemberRole,
  ROLE_PERMISSIONS,
  TenantContext,
  TenantMembership,
  TenantPermission,
  TenantRegistryEntry,
  TenantRegistryEntrySchema,
  TenantTheme,
  TenantThemeSchema,
} from '../types/tenant';
import {
  SAMPLE_ACADEMIC_YEARS,
  SAMPLE_SCHOOLS,
  DISTRICT_ORGANIZATION,
} from '../data/sampleDistrictData';

export class TenantIsolationError extends Error {
  readonly requestedTenantId: string;
  readonly contextTenantId: string | null;

  constructor(requestedTenantId: string, contextTenantId: string | null) {
    super(
      `Tenant isolation violation: resource scoped to "${requestedTenantId}" cannot be read from tenant "${
        contextTenantId ?? 'none'
      }".`
    );
    this.name = 'TenantIsolationError';
    this.requestedTenantId = requestedTenantId;
    this.contextTenantId = contextTenantId;
  }
}

const REGISTRY_STORAGE_KEY = 'gradeglow:tenant-registry:v1';

/**
 * Curated public-suffix list (multi-label suffixes only; single-label suffixes
 * fall back to the standard "last two labels" ICANN default rule).
 */
const PUBLIC_SUFFIXES: string[] = [
  's3.amazonaws.com',
  'compute.amazonaws.com',
  'appspot.com',
  'cloudfront.net',
  'github.io',
  'gov.uk',
  'org.uk',
  'ac.uk',
  'co.uk',
  'me.uk',
  'sch.uk',
  'go.ke',
  'sc.ke',
  'ac.ke',
  'or.ke',
  'ne.ke',
  'co.ke',
  'go.ug',
  'ac.ug',
  'or.ug',
  'com.ug',
  'go.tz',
  'ac.tz',
  'or.tz',
  'go.nz',
  'ac.nz',
  'org.nz',
  'net.nz',
  'govt.nz',
  'edu.ng',
  'gov.ng',
  'org.ng',
  'com.ng',
  'ac.za',
  'gov.za',
  'org.za',
  'web.za',
  'edu.gh',
  'com.gh',
  'org.gh',
  'ac.in',
  'gov.in',
  'net.in',
  'org.in',
  'co.in',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'co.jp',
  'ne.jp',
  'or.jp',
  'ac.jp',
  'com.br',
  'com.mx',
  'com.ar',
].sort((a, b) => b.split('.').length - a.split('.').length || b.length - a.length);

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'mail',
  'dashboard',
  'lms',
  'portal',
  'auth',
  'static',
  'cdn',
  'support',
  'billing',
  'docs',
  'status',
  'gradeglow',
]);

export const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const normalizeHostname = (hostname: string): string => {
  let value = hostname.trim().toLowerCase();
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.split('/')[0];
  value = value.replace(/:\d+$/, '');
  value = value.replace(/\.$/, '');
  return value;
};

const isIpAddress = (value: string): boolean => /^\d{1,3}(\.\d{1,3}){3}$/.test(value);

const endsWithLabels = (labels: string[], suffixLabels: string[]): boolean => {
  if (labels.length < suffixLabels.length) return false;
  for (let i = 0; i < suffixLabels.length; i += 1) {
    if (labels[labels.length - suffixLabels.length + i] !== suffixLabels[i]) return false;
  }
  return true;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const relativeLuminance = (channel255: number): number => {
  const c = channel255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export class TenantContextService {
  private static registryCache: TenantRegistryEntry[] | null = null;
  private static currentMemberships = new Map<string, TenantMembership>();
  private static tenantBuckets = new Map<string, unknown>();
  private static blockedAccessCount = 0;

  static readonly PLATFORM_DOMAIN = 'gradeglow.com';

  // ---------------------------------------------------------------- //
  // Registrable domain / hostname resolution
  // ---------------------------------------------------------------- //

  static parseRegistrableDomain(hostname: string): string | null {
    const normalized = normalizeHostname(hostname);
    if (!normalized || !normalized.includes('.') || isIpAddress(normalized)) return null;

    const labels = normalized.split('.').filter(Boolean);
    if (labels.length < 2) return null;

    for (const suffix of PUBLIC_SUFFIXES) {
      const suffixLabels = suffix.split('.');
      if (!endsWithLabels(labels, suffixLabels)) continue;
      if (labels.length === suffixLabels.length) return null;
      return labels.slice(labels.length - suffixLabels.length - 1).join('.');
    }

    return labels.slice(-2).join('.');
  }

  static extractSubdomain(hostname: string): string | null {
    const registrable = this.parseRegistrableDomain(hostname);
    if (!registrable) return null;
    const normalized = normalizeHostname(hostname);
    if (normalized === registrable) return '';
    if (!normalized.endsWith(`.${registrable}`)) return null;
    return normalized.slice(0, normalized.length - registrable.length - 1);
  }

  static resolveTenantFromHostname(hostname: string): TenantContext | null {
    const registrable = this.parseRegistrableDomain(hostname);
    if (!registrable || registrable !== this.PLATFORM_DOMAIN) return null;
    const subdomain = this.extractSubdomain(hostname);
    if (!subdomain || subdomain === 'www') return null;
    const entry = this.getRegistry().find(
      (candidate) => candidate.subdomain.toLowerCase() === subdomain.toLowerCase()
    );
    if (!entry) return null;
    return this.buildContext(entry, normalizeHostname(hostname));
  }

  static buildContext(entry: TenantRegistryEntry, hostname: string): TenantContext {
    const currentYear = SAMPLE_ACADEMIC_YEARS.find(
      (year) => year.schoolId === entry.tenantId && year.isCurrent
    );
    return {
      tenantId: entry.tenantId,
      organizationId: entry.organizationId,
      subdomain: entry.subdomain,
      hostname,
      registrableDomain: this.parseRegistrableDomain(hostname) ?? this.PLATFORM_DOMAIN,
      theme: { ...entry.theme },
      activeAcademicYearId: currentYear ? currentYear.id : null,
      membership: this.getCurrentMembership(entry.tenantId),
      resolvedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------- //
  // Tenant registry (localStorage persisted)
  // ---------------------------------------------------------------- //

  static seedRegistry(): TenantRegistryEntry[] {
    return SAMPLE_SCHOOLS.map((school) => ({
      tenantId: school.id,
      organizationId: school.organizationId,
      subdomain: school.subdomain,
      displayName: school.name,
      theme: { ...school.theme },
    }));
  }

  static getRegistry(): TenantRegistryEntry[] {
    if (this.registryCache) return this.registryCache;

    const seeded = this.seedRegistry();
    if (typeof localStorage === 'undefined') {
      this.registryCache = seeded;
      return this.registryCache;
    }

    try {
      const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (!raw) {
        this.registryCache = seeded;
        this.persistRegistry();
        return this.registryCache;
      }
      const parsed = z.array(TenantRegistryEntrySchema).safeParse(JSON.parse(raw));
      this.registryCache = parsed.success ? parsed.data : seeded;
      if (!parsed.success) this.persistRegistry();
    } catch {
      this.registryCache = seeded;
    }
    return this.registryCache;
  }

  static reloadRegistry(): TenantRegistryEntry[] {
    this.registryCache = null;
    return this.getRegistry();
  }

  static resetRegistry(): TenantRegistryEntry[] {
    this.registryCache = this.seedRegistry();
    this.persistRegistry();
    return this.registryCache;
  }

  private static persistRegistry(): void {
    if (typeof localStorage === 'undefined' || !this.registryCache) return;
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(this.registryCache));
    } catch {
      // Storage may be unavailable (private mode / quota); in-memory cache still works.
    }
  }

  private static commitRegistry(entries: TenantRegistryEntry[]): void {
    this.registryCache = entries;
    this.persistRegistry();
  }

  static getRegistryEntry(tenantId: string): TenantRegistryEntry | null {
    return this.getRegistry().find((entry) => entry.tenantId === tenantId) ?? null;
  }

  static validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
    const value = subdomain.trim().toLowerCase();
    if (value.length === 0) return { valid: false, error: 'Subdomain is required.' };
    if (value !== subdomain) return { valid: false, error: 'Use lowercase letters only.' };
    if (value.length > 63) return { valid: false, error: 'Maximum 63 characters.' };
    if (RESERVED_SUBDOMAINS.has(value)) {
      return { valid: false, error: `"${value}" is reserved by the platform.` };
    }
    if (!SUBDOMAIN_REGEX.test(value)) {
      return {
        valid: false,
        error: 'Use letters, numbers, and hyphens (must start and end with a letter or number).',
      };
    }
    return { valid: true };
  }

  static isSubdomainAvailable(subdomain: string, excludeTenantId?: string): boolean {
    const value = subdomain.trim().toLowerCase();
    if (!this.validateSubdomain(value).valid) return false;
    return !this.getRegistry().some(
      (entry) => entry.subdomain.toLowerCase() === value && entry.tenantId !== excludeTenantId
    );
  }

  static registerSchool(input: {
    tenantId: string;
    organizationId?: string;
    subdomain: string;
    displayName: string;
    theme?: TenantTheme;
  }): TenantRegistryEntry {
    const validation = this.validateSubdomain(input.subdomain);
    if (!validation.valid) throw new Error(validation.error ?? 'Invalid subdomain.');
    if (!this.isSubdomainAvailable(input.subdomain, input.tenantId)) {
      throw new Error(`Subdomain "${input.subdomain}" is already taken.`);
    }
    if (this.getRegistryEntry(input.tenantId)) {
      throw new Error(`Tenant "${input.tenantId}" is already registered.`);
    }

    const entry: TenantRegistryEntry = {
      tenantId: input.tenantId,
      organizationId: input.organizationId ?? DISTRICT_ORGANIZATION.id,
      subdomain: input.subdomain.trim().toLowerCase(),
      displayName: input.displayName.trim(),
      theme: input.theme ? { ...input.theme } : { ...DEFAULT_TENANT_THEME },
    };
    this.commitRegistry([...this.getRegistry(), entry]);
    return entry;
  }

  static updateSubdomain(tenantId: string, subdomain: string): TenantRegistryEntry {
    const validation = this.validateSubdomain(subdomain);
    if (!validation.valid) throw new Error(validation.error ?? 'Invalid subdomain.');
    if (!this.isSubdomainAvailable(subdomain, tenantId)) {
      throw new Error(`Subdomain "${subdomain}" is already taken.`);
    }
    const entries = this.getRegistry().map((entry) =>
      entry.tenantId === tenantId ? { ...entry, subdomain: subdomain.trim().toLowerCase() } : entry
    );
    const updated = entries.find((entry) => entry.tenantId === tenantId);
    if (!updated) throw new Error(`Tenant "${tenantId}" is not registered.`);
    this.commitRegistry(entries);
    return updated;
  }

  // ---------------------------------------------------------------- //
  // Branding theme resolution + CSS custom properties
  // ---------------------------------------------------------------- //

  static resolveTheme(tenantId: string | null): TenantTheme {
    if (!tenantId) return { ...DEFAULT_TENANT_THEME };
    const entry = this.getRegistryEntry(tenantId);
    return entry ? { ...entry.theme } : { ...DEFAULT_TENANT_THEME };
  }

  static updateTheme(tenantId: string, partial: Partial<TenantTheme>): TenantTheme {
    const current = this.resolveTheme(tenantId);
    const merged = TenantThemeSchema.parse({ ...current, ...partial });
    const entries = this.getRegistry().map((entry) =>
      entry.tenantId === tenantId ? { ...entry, theme: merged } : entry
    );
    this.commitRegistry(entries);
    return { ...merged };
  }

  static resetTheme(tenantId: string): TenantTheme {
    const original = this.seedRegistry().find((entry) => entry.tenantId === tenantId);
    const theme = original ? { ...original.theme } : { ...DEFAULT_TENANT_THEME };
    const entries = this.getRegistry().map((entry) =>
      entry.tenantId === tenantId ? { ...entry, theme } : entry
    );
    this.commitRegistry(entries);
    return { ...theme };
  }

  static readableTextColor(hex: string): string {
    const { r, g, b } = hexToRgb(hex);
    const luminance =
      0.2126 * relativeLuminance(r) + 0.7152 * relativeLuminance(g) + 0.0722 * relativeLuminance(b);
    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const contrastWithDark = (luminance + 0.05) / 0.05;
    return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#111827';
  }

  static themeToCssVars(theme: TenantTheme): Record<string, string> {
    return {
      '--tenant-primary': theme.primaryColor,
      '--tenant-accent': theme.accentColor,
      '--tenant-on-primary': this.readableTextColor(theme.primaryColor),
      '--tenant-on-accent': this.readableTextColor(theme.accentColor),
    };
  }

  static applyThemeToDocument(theme: TenantTheme): void {
    if (typeof document === 'undefined') return;
    const vars = this.themeToCssVars(theme);
    for (const [name, value] of Object.entries(vars)) {
      document.documentElement.style.setProperty(name, value);
    }
  }

  // ---------------------------------------------------------------- //
  // Strict tenant isolation guards
  // ---------------------------------------------------------------- //

  static assertTenantAccess(requestedTenantId: string, context: TenantContext | null): void {
    const contextTenantId = context?.tenantId ?? null;
    if (!context || context.tenantId !== requestedTenantId) {
      this.blockedAccessCount += 1;
      throw new TenantIsolationError(requestedTenantId, contextTenantId);
    }
  }

  static scopedQuery<T>(
    requestedTenantId: string,
    context: TenantContext | null,
    loader: () => T[]
  ): T[] {
    if (!context || context.tenantId !== requestedTenantId) {
      this.blockedAccessCount += 1;
      return [];
    }
    return loader();
  }

  static scopedQueryOrThrow<T>(
    requestedTenantId: string,
    context: TenantContext | null,
    loader: () => T[]
  ): T[] {
    this.assertTenantAccess(requestedTenantId, context);
    return loader();
  }

  static getBlockedAccessCount(): number {
    return this.blockedAccessCount;
  }

  static putTenantRows<T>(tenantId: string, bucket: string, rows: T[]): void {
    if (!tenantId || !bucket) throw new Error('Tenant id and bucket are required.');
    this.tenantBuckets.set(this.storageKey(tenantId, bucket, 'rows'), rows);
  }

  static getTenantRows<T>(
    requestedTenantId: string,
    context: TenantContext | null,
    bucket: string
  ): T[] {
    if (!context || context.tenantId !== requestedTenantId) {
      this.blockedAccessCount += 1;
      return [];
    }
    const rows = this.tenantBuckets.get(this.storageKey(requestedTenantId, bucket, 'rows'));
    return Array.isArray(rows) ? [...(rows as T[])] : [];
  }

  static getTenantRowsOrThrow<T>(
    requestedTenantId: string,
    context: TenantContext | null,
    bucket: string
  ): T[] {
    this.assertTenantAccess(requestedTenantId, context);
    const rows = this.tenantBuckets.get(this.storageKey(requestedTenantId, bucket, 'rows'));
    return Array.isArray(rows) ? [...(rows as T[])] : [];
  }

  // ---------------------------------------------------------------- //
  // Per-tenant storage bucket / key prefixing
  // ---------------------------------------------------------------- //

  static storageKey(tenantId: string, bucket: string, key: string): string {
    if (!tenantId.trim()) throw new Error('Tenant id is required for a storage key.');
    if (!bucket.trim()) throw new Error('Bucket name is required for a storage key.');
    return `gradeglow:t/${encodeURIComponent(tenantId)}/${encodeURIComponent(bucket)}/${key}`;
  }

  static bucketSet<T>(
    context: TenantContext | null,
    requestedTenantId: string,
    bucket: string,
    key: string,
    value: T
  ): boolean {
    this.assertTenantAccess(requestedTenantId, context);
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(this.storageKey(requestedTenantId, bucket, key), JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  static bucketGet<T>(
    context: TenantContext | null,
    requestedTenantId: string,
    bucket: string,
    key: string,
    fallback: T
  ): T {
    this.assertTenantAccess(requestedTenantId, context);
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(this.storageKey(requestedTenantId, bucket, key));
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  // ---------------------------------------------------------------- //
  // Membership RBAC within a tenant
  // ---------------------------------------------------------------- //

  static setCurrentMembership(membership: TenantMembership | null): void {
    if (membership === null) {
      this.currentMemberships.clear();
      return;
    }
    this.currentMemberships.set(membership.tenantId, membership);
  }

  static setMembershipRole(
    tenantId: string,
    role: MemberRole,
    memberId = `mem-${role}`
  ): TenantMembership {
    const membership: TenantMembership = { memberId, tenantId, role };
    this.currentMemberships.set(tenantId, membership);
    return membership;
  }

  static getCurrentMembership(tenantId: string): TenantMembership | null {
    return this.currentMemberships.get(tenantId) ?? null;
  }

  static hasRole(tenantId: string, roles: MemberRole[]): boolean {
    const membership = this.getCurrentMembership(tenantId);
    return membership !== null && roles.includes(membership.role);
  }

  static hasPermission(tenantId: string, permission: TenantPermission): boolean {
    const membership = this.getCurrentMembership(tenantId);
    if (!membership) return false;
    return ROLE_PERMISSIONS[membership.role].includes(permission);
  }

  static canManageBranding(tenantId: string): boolean {
    return this.hasPermission(tenantId, 'branding:write');
  }

  static canSyncSis(tenantId: string): boolean {
    return this.hasPermission(tenantId, 'sis:sync');
  }

  // ---------------------------------------------------------------- //
  // Test lifecycle
  // ---------------------------------------------------------------- //

  static resetAll(): void {
    this.registryCache = null;
    this.currentMemberships.clear();
    this.tenantBuckets.clear();
    this.blockedAccessCount = 0;
  }
}

export const tenantContextService = TenantContextService;

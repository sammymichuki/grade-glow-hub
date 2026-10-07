import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantContextService,
  TenantIsolationError,
} from '../services/tenantContextService';
import { SAMPLE_SCHOOLS } from '../data/sampleDistrictData';
import { DEFAULT_TENANT_THEME, TenantContext } from '../types/tenant';

const resolve = (hostname: string): TenantContext => {
  const context = TenantContextService.resolveTenantFromHostname(hostname);
  if (!context) throw new Error(`Expected a tenant context for ${hostname}`);
  return context;
};

beforeEach(() => {
  localStorage.clear();
  TenantContextService.resetAll();
});

describe('registrable domain parsing (public suffix aware)', () => {
  it('strips a single-label subdomain from an ICANN-style suffix', () => {
    expect(TenantContextService.parseRegistrableDomain('highland.gradeglow.com')).toBe('gradeglow.com');
    expect(TenantContextService.parseRegistrableDomain('www.gradeglow.com')).toBe('gradeglow.com');
    expect(TenantContextService.parseRegistrableDomain('gradeglow.com')).toBe('gradeglow.com');
    expect(TenantContextService.parseRegistrableDomain('a.b.c.gradeglow.com')).toBe('gradeglow.com');
  });

  it('honours multi-label public suffixes such as co.uk and ac.ke', () => {
    expect(TenantContextService.parseRegistrableDomain('highland.gradeglow.co.uk')).toBe('gradeglow.co.uk');
    expect(TenantContextService.parseRegistrableDomain('learn.highlands.ac.ke')).toBe('highlands.ac.ke');
    expect(TenantContextService.parseRegistrableDomain('mountkenya.edu.gh')).toBe('mountkenya.edu.gh');
  });

  it('treats a bare public suffix as non-registrable', () => {
    expect(TenantContextService.parseRegistrableDomain('co.uk')).toBeNull();
    expect(TenantContextService.parseRegistrableDomain('ac.ke')).toBeNull();
    expect(TenantContextService.parseRegistrableDomain('gradeglow.co.uk')).toBe('gradeglow.co.uk');
  });

  it('normalizes ports, protocols, paths, and trailing dots', () => {
    expect(TenantContextService.parseRegistrableDomain('https://highland.gradeglow.com:8443/app')).toBe(
      'gradeglow.com'
    );
    expect(TenantContextService.parseRegistrableDomain('HIGHLAND.gradeglow.com.')).toBe('gradeglow.com');
  });

  it('rejects IP addresses and single-label hosts', () => {
    expect(TenantContextService.parseRegistrableDomain('192.168.4.10')).toBeNull();
    expect(TenantContextService.parseRegistrableDomain('localhost')).toBeNull();
    expect(TenantContextService.parseRegistrableDomain('')).toBeNull();
  });
});

describe('subdomain extraction and hostname tenant resolution', () => {
  it('extracts the subdomain label below the registrable domain', () => {
    expect(TenantContextService.extractSubdomain('highland.gradeglow.com')).toBe('highland');
    expect(TenantContextService.extractSubdomain('gradeglow.com')).toBe('');
    expect(TenantContextService.extractSubdomain('a.highland.gradeglow.com')).toBe('a.highland');
  });

  it('resolves registered vanity hosts to their school tenant', () => {
    expect(resolve('highland.gradeglow.com').tenantId).toBe('sch-highland');
    expect(resolve('stmarys.gradeglow.com').tenantId).toBe('sch-stmarys');
    expect(resolve('tahmeed.gradeglow.com').tenantId).toBe('sch-tahmeed');
  });

  it('populates the resolved context with registry and school details', () => {
    const context = resolve('highland.gradeglow.com');

    expect(context.organizationId).toBe('org-ke-highlands');
    expect(context.subdomain).toBe('highland');
    expect(context.registrableDomain).toBe('gradeglow.com');
    expect(context.theme.primaryColor).toBe('#4f46e5');
    expect(context.activeAcademicYearId).toBe('ay-sch-highland-2026');
    expect(context.membership).toBeNull();
  });

  it('returns null for the apex, www, unknown subdomains, and foreign domains', () => {
    expect(TenantContextService.resolveTenantFromHostname('gradeglow.com')).toBeNull();
    expect(TenantContextService.resolveTenantFromHostname('www.gradeglow.com')).toBeNull();
    expect(TenantContextService.resolveTenantFromHostname('notarealschool.gradeglow.com')).toBeNull();
    expect(TenantContextService.resolveTenantFromHostname('highland.example.com')).toBeNull();
  });
});

describe('strict tenant isolation guards', () => {
  let highland: TenantContext;

  beforeEach(() => {
    highland = resolve('highland.gradeglow.com');
  });

  it('allows a scoped query when the tenant matches the context', () => {
    const rows = TenantContextService.scopedQuery('sch-highland', highland, () => ['highland-secret']);

    expect(rows).toEqual(['highland-secret']);
    expect(TenantContextService.getBlockedAccessCount()).toBe(0);
  });

  it('returns an empty result and counts the attempt on a cross-tenant read', () => {
    const rows = TenantContextService.scopedQuery('sch-stmarys', highland, () => ['highland-secret']);

    expect(rows).toEqual([]);
    expect(TenantContextService.getBlockedAccessCount()).toBe(1);
  });

  it('throws TenantIsolationError from the throwing scoped query variant', () => {
    expect(() =>
      TenantContextService.scopedQueryOrThrow('sch-stmarys', highland, () => ['x'])
    ).toThrow(TenantIsolationError);
    expect(TenantContextService.getBlockedAccessCount()).toBe(1);
  });

  it('reports the requested and context tenant ids on the error', () => {
    try {
      TenantContextService.assertTenantAccess('sch-stmarys', highland);
      throw new Error('Expected a tenant isolation error.');
    } catch (error) {
      expect(error).toBeInstanceOf(TenantIsolationError);
      const isolation = error as TenantIsolationError;
      expect(isolation.name).toBe('TenantIsolationError');
      expect(isolation.requestedTenantId).toBe('sch-stmarys');
      expect(isolation.contextTenantId).toBe('sch-highland');
      expect(isolation.message).toMatch(/isolation violation/i);
    }
  });

  it('blocks access when no tenant context could be resolved', () => {
    expect(() => TenantContextService.assertTenantAccess('sch-highland', null)).toThrow(
      TenantIsolationError
    );
    expect(TenantContextService.scopedQuery('sch-highland', null, () => ['x'])).toEqual([]);
  });

  it('keeps tenant row buckets separated per tenant', () => {
    TenantContextService.putTenantRows('sch-highland', 'roster', ['student-a']);
    TenantContextService.putTenantRows('sch-stmarys', 'roster', ['student-b']);

    expect(TenantContextService.getTenantRows('sch-highland', highland, 'roster')).toEqual(['student-a']);
    expect(TenantContextService.getTenantRows('sch-stmarys', highland, 'roster')).toEqual([]);
    expect(() =>
      TenantContextService.getTenantRowsOrThrow('sch-stmarys', highland, 'roster')
    ).toThrow(TenantIsolationError);
  });
});

describe('per-tenant storage bucket prefixing', () => {
  it('prefixes keys with the tenant and bucket', () => {
    expect(TenantContextService.storageKey('sch-highland', 'settings', 'theme')).toBe(
      'gradeglow:t/sch-highland/settings/theme'
    );
    expect(TenantContextService.storageKey('sch-highland', 'branding', 'logo')).toBe(
      'gradeglow:t/sch-highland/branding/logo'
    );
  });

  it('rejects empty tenant ids and bucket names', () => {
    expect(() => TenantContextService.storageKey('', 'settings', 'theme')).toThrow(/required/i);
    expect(() => TenantContextService.storageKey('sch-highland', '', 'theme')).toThrow(/required/i);
  });

  it('round-trips values through bucket set/get with a matching context', () => {
    const highland = resolve('highland.gradeglow.com');
    const persisted = TenantContextService.bucketSet(
      highland,
      'sch-highland',
      'settings',
      'term',
      '2026-T1'
    );

    expect(persisted).toBe(true);
    expect(
      TenantContextService.bucketGet(highland, 'sch-highland', 'settings', 'term', 'fallback')
    ).toBe('2026-T1');
  });

  it('refuses cross-tenant bucket reads and writes', () => {
    const highland = resolve('highland.gradeglow.com');

    expect(() =>
      TenantContextService.bucketSet(highland, 'sch-stmarys', 'settings', 'term', 'x')
    ).toThrow(TenantIsolationError);
    expect(() =>
      TenantContextService.bucketGet(highland, 'sch-stmarys', 'settings', 'term', 'fb')
    ).toThrow(TenantIsolationError);
    expect(
      TenantContextService.bucketGet(highland, 'sch-highland', 'settings', 'missing', 'fallback')
    ).toBe('fallback');
  });
});

describe('branding themes and CSS custom properties', () => {
  it('falls back to the district default theme for unknown tenants', () => {
    expect(TenantContextService.resolveTheme(null)).toEqual(DEFAULT_TENANT_THEME);
    expect(TenantContextService.resolveTheme('sch-missing')).toEqual(DEFAULT_TENANT_THEME);
  });

  it('resolves the seeded sample theme for a registered school', () => {
    expect(TenantContextService.resolveTheme('sch-highland').primaryColor).toBe('#4f46e5');
    expect(TenantContextService.resolveTheme('sch-stmarys').accentColor).toBe('#0ea5e9');
  });

  it('persists theme updates to the registry and reloads them', () => {
    TenantContextService.updateTheme('sch-highland', { primaryColor: '#123456', accentColor: '#abcdef' });

    expect(TenantContextService.resolveTheme('sch-highland').primaryColor).toBe('#123456');
    expect(TenantContextService.reloadRegistry()[0].theme.primaryColor).toBe('#123456');
  });

  it('rejects invalid hex colors through the Zod contract', () => {
    expect(() =>
      TenantContextService.updateTheme('sch-highland', { primaryColor: 'rebeccapurple' })
    ).toThrow();
    expect(TenantContextService.resolveTheme('sch-highland').primaryColor).toBe('#4f46e5');
  });

  it('restores the original sample theme on reset', () => {
    TenantContextService.updateTheme('sch-highland', { primaryColor: '#000000' });

    const restored = TenantContextService.resetTheme('sch-highland');
    expect(restored.primaryColor).toBe('#4f46e5');
    expect(TenantContextService.resolveTheme('sch-highland').primaryColor).toBe('#4f46e5');
  });

  it('generates the documented CSS custom property map', () => {
    const vars = TenantContextService.themeToCssVars({
      primaryColor: '#4f46e5',
      accentColor: '#f59e0b',
      welcomeMessage: 'Karibu!',
    });

    expect(Object.keys(vars)).toEqual([
      '--tenant-primary',
      '--tenant-accent',
      '--tenant-on-primary',
      '--tenant-on-accent',
    ]);
    expect(vars['--tenant-primary']).toBe('#4f46e5');
    expect(vars['--tenant-accent']).toBe('#f59e0b');
    expect(vars['--tenant-on-primary']).toBe('#ffffff');
    expect(vars['--tenant-on-accent']).toBe('#111827');
  });

  it('computes readable contrast text for light and dark brand colors', () => {
    expect(TenantContextService.readableTextColor('#ffffff')).toBe('#111827');
    expect(TenantContextService.readableTextColor('#000000')).toBe('#ffffff');
    expect(TenantContextService.readableTextColor('#1d4ed8')).toBe('#ffffff');
  });

  it('writes theme variables onto the document root', () => {
    TenantContextService.applyThemeToDocument({
      primaryColor: '#123456',
      accentColor: '#654321',
      welcomeMessage: 'Hello',
    });

    expect(document.documentElement.style.getPropertyValue('--tenant-primary')).toBe('#123456');
    expect(document.documentElement.style.getPropertyValue('--tenant-accent')).toBe('#654321');
    document.documentElement.removeAttribute('style');
  });
});

describe('subdomain registry', () => {
  it('validates vanity subdomain format rules', () => {
    expect(TenantContextService.validateSubdomain('highland')).toEqual({ valid: true });
    expect(TenantContextService.validateSubdomain('a1-b2')).toEqual({ valid: true });
    expect(TenantContextService.validateSubdomain('Highland').valid).toBe(false);
    expect(TenantContextService.validateSubdomain('has space').valid).toBe(false);
    expect(TenantContextService.validateSubdomain('-leading').valid).toBe(false);
    expect(TenantContextService.validateSubdomain('trailing-').valid).toBe(false);
    expect(TenantContextService.validateSubdomain('www').valid).toBe(false);
    expect(TenantContextService.validateSubdomain('admin').valid).toBe(false);
    expect(TenantContextService.validateSubdomain('').valid).toBe(false);
  });

  it('checks availability against the persisted registry', () => {
    expect(TenantContextService.isSubdomainAvailable('highland')).toBe(false);
    expect(TenantContextService.isSubdomainAvailable('brandnewschool')).toBe(true);
    expect(TenantContextService.isSubdomainAvailable('highland', 'sch-highland')).toBe(true);
  });

  it('registers a new school tenant and persists the entry', () => {
    const before = TenantContextService.getRegistry().length;

    const entry = TenantContextService.registerSchool({
      tenantId: 'sch-coastal',
      subdomain: 'coastal',
      displayName: 'Coastal International School',
    });

    expect(entry.subdomain).toBe('coastal');
    expect(TenantContextService.getRegistry()).toHaveLength(before + 1);
    expect(TenantContextService.reloadRegistry()).toHaveLength(before + 1);
    expect(TenantContextService.resolveTenantFromHostname('coastal.gradeglow.com')?.tenantId).toBe(
      'sch-coastal'
    );
  });

  it('rejects duplicate registrations and taken subdomains', () => {
    expect(() =>
      TenantContextService.registerSchool({
        tenantId: 'sch-dup',
        subdomain: 'highland',
        displayName: 'Duplicate',
      })
    ).toThrow(/already taken/i);
    expect(() =>
      TenantContextService.registerSchool({
        tenantId: 'sch-highland',
        subdomain: 'freshname',
        displayName: 'Existing Tenant',
      })
    ).toThrow(/already registered/i);
  });

  it('renames a vanity subdomain with availability enforcement', () => {
    const renamed = TenantContextService.updateSubdomain('sch-highland', 'highlandprep');

    expect(renamed.subdomain).toBe('highlandprep');
    expect(TenantContextService.resolveTenantFromHostname('highland.gradeglow.com')).toBeNull();
    expect(TenantContextService.resolveTenantFromHostname('highlandprep.gradeglow.com')?.tenantId).toBe(
      'sch-highland'
    );
    expect(() => TenantContextService.updateSubdomain('sch-highland', 'stmarys')).toThrow(
      /already taken/i
    );
  });
});

describe('membership RBAC within a tenant', () => {
  it('denies every permission when no membership is bound', () => {
    expect(TenantContextService.hasPermission('sch-highland', 'branding:write')).toBe(false);
    expect(TenantContextService.canManageBranding('sch-highland')).toBe(false);
  });

  it('grants branding and SIS sync rights to school admins only', () => {
    TenantContextService.setMembershipRole('sch-highland', 'school_admin');
    expect(TenantContextService.canManageBranding('sch-highland')).toBe(true);
    expect(TenantContextService.canSyncSis('sch-highland')).toBe(true);

    TenantContextService.setMembershipRole('sch-highland', 'teacher');
    expect(TenantContextService.canManageBranding('sch-highland')).toBe(false);
    expect(TenantContextService.hasPermission('sch-highland', 'roster:read')).toBe(true);
    expect(TenantContextService.hasPermission('sch-highland', 'sis:sync')).toBe(false);
  });

  it('scopes role checks to the tenant they were granted in', () => {
    TenantContextService.setMembershipRole('sch-highland', 'school_admin');
    TenantContextService.setMembershipRole('sch-stmarys', 'student');

    expect(TenantContextService.hasPermission('sch-highland', 'branding:write')).toBe(true);
    expect(TenantContextService.hasPermission('sch-stmarys', 'branding:write')).toBe(false);
    expect(TenantContextService.hasPermission('sch-stmarys', 'grades:read')).toBe(true);
    expect(TenantContextService.hasRole('sch-stmarys', ['student'])).toBe(true);
    expect(TenantContextService.hasRole('sch-stmarys', ['teacher', 'ta'])).toBe(false);
  });

  it('surfaces the active membership on a resolved tenant context', () => {
    TenantContextService.setMembershipRole('sch-highland', 'district_admin', 'mem-77');
    const context = resolve('highland.gradeglow.com');

    expect(context.membership).not.toBeNull();
    expect(context.membership?.role).toBe('district_admin');
    expect(context.membership?.memberId).toBe('mem-77');
  });

  it('clears memberships when unbound', () => {
    TenantContextService.setMembershipRole('sch-highland', 'teacher');
    TenantContextService.setCurrentMembership(null);

    expect(TenantContextService.getCurrentMembership('sch-highland')).toBeNull();
    expect(TenantContextService.hasPermission('sch-highland', 'roster:read')).toBe(false);
  });
});

describe('seeded district registry', () => {
  it('seeds one registry entry per sample school', () => {
    const registry = TenantContextService.getRegistry();

    expect(registry).toHaveLength(SAMPLE_SCHOOLS.length);
    expect(registry.map((entry) => entry.subdomain)).toEqual(
      SAMPLE_SCHOOLS.map((school) => school.subdomain)
    );
  });

  it('persists the seeded registry to localStorage on first load', () => {
    TenantContextService.getRegistry();
    const raw = localStorage.getItem('gradeglow:tenant-registry:v1');

    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '[]')).toHaveLength(SAMPLE_SCHOOLS.length);
  });

  it('recovers from corrupted registry storage by reseeding', () => {
    localStorage.setItem('gradeglow:tenant-registry:v1', '{not valid json');
    TenantContextService.reloadRegistry();

    expect(TenantContextService.getRegistry()).toHaveLength(SAMPLE_SCHOOLS.length);
  });
});

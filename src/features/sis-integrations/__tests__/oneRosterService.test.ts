import { describe, it, expect } from 'vitest';
import {
  ONE_ROSTER_MANIFESTS,
  applySyncPlan,
  buildDeltaQuery,
  computeSyncPlan,
  escapeCsvCell,
  filterRows,
  getManifest,
  listResources,
  paginateRows,
  parseCsvTable,
  parseOneRosterCsv,
  serializeOneRosterCsv,
  summarizeSyncPlan,
  validateRows,
} from '../services/oneRosterService';
import {
  OneRosterClassRow,
  OneRosterUserRow,
} from '../types/sis';
import { SAMPLE_ONEROSTER_LOCAL, SAMPLE_ONEROSTER_REMOTE } from '../data/sampleSisData';

const REMOTE_CLASS_PLAN = () =>
  computeSyncPlan('classes', SAMPLE_ONEROSTER_LOCAL.classes, SAMPLE_ONEROSTER_REMOTE.classes);

describe('OneRoster manifests', () => {
  it('declares CSV column sets for all six 1.2 resources', () => {
    expect(listResources()).toEqual([
      'orgs',
      'classes',
      'courses',
      'users',
      'memberships',
      'academicSessions',
    ]);
    expect(ONE_ROSTER_MANIFESTS.classes.columns).toContain('termSourcedIds');
    expect(ONE_ROSTER_MANIFESTS.users.columns).toEqual([
      'sourcedId',
      'status',
      'dateLastModified',
      'username',
      'givenName',
      'familyName',
      'email',
      'role',
      'orgSourcedId',
      'grades',
    ]);
    expect(ONE_ROSTER_MANIFESTS.memberships.requiredColumns).toContain('classSourcedId');
    expect(ONE_ROSTER_MANIFESTS.academicSessions.columns).toContain('startDate');
  });

  it('rejects unknown resources', () => {
    expect(() => getManifest('teachers' as never)).toThrow(/unknown/i);
  });
});

describe('CSV serialization (RFC 4180)', () => {
  it('emits the manifest header row followed by one row per record', () => {
    const csv = serializeOneRosterCsv('classes', SAMPLE_ONEROSTER_LOCAL.classes);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe(ONE_ROSTER_MANIFESTS.classes.columns.join(','));
    expect(lines).toHaveLength(SAMPLE_ONEROSTER_LOCAL.classes.length + 1);
  });

  it('quotes cells containing commas, quotes, newlines, or padding spaces', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvCell(' padded ')).toBe('" padded "');
  });

  it('renders empty cells for absent optional columns', () => {
    const csv = serializeOneRosterCsv('orgs', [
      {
        sourcedId: 'org-9',
        status: 'active',
        dateLastModified: '2026-10-01T00:00:00Z',
        name: 'Solo School',
        type: 'school',
      },
    ]);
    const cells = parseCsvTable(csv).records[0];

    expect(cells).toHaveLength(7);
    expect(cells[5]).toBe('');
    expect(cells[6]).toBe('');
  });
});

describe('CSV parsing (header mapping + RFC 4180 reader)', () => {
  it('round-trips every resource fixture through serialize → parse', () => {
    for (const resource of listResources()) {
      const original = SAMPLE_ONEROSTER_LOCAL[resource];
      const csv = serializeOneRosterCsv(resource, original);
      const parsed = parseOneRosterCsv(resource, csv);

      expect(parsed).toHaveLength(original.length);
      parsed.forEach((row, index) => {
        for (const column of getManifest(resource).columns) {
          expect(row[column]).toBe(String(original[index][column] ?? ''));
        }
      });
    }
  });

  it('maps columns by header name regardless of column order', () => {
    const reordered =
      'familyName,givenName,role,sourcedId,status,dateLastModified\r\nKimani,Amina,student,usr-1,active,2026-10-01T00:00:00Z';
    const [row] = parseOneRosterCsv('users', reordered);

    expect(row.sourcedId).toBe('usr-1');
    expect(row.givenName).toBe('Amina');
    expect(row.familyName).toBe('Kimani');
    expect(row.role).toBe('student');
    expect(row.email).toBe('');
  });

  it('handles quoted cells with embedded commas, quotes, and newlines', () => {
    const csv =
      'sourcedId,status,dateLastModified,title,teachers\r\ncls-1,active,2026-10-01T00:00:00Z,"Grade 7A, ""Honors""","tch-1\r\ntch-2"';
    const [row] = parseOneRosterCsv('classes', csv);

    expect(row.title).toBe('Grade 7A, "Honors"');
    expect(row.teachers).toBe('tch-1\r\ntch-2');
  });

  it('supports LF-only line endings and a UTF-8 BOM', () => {
    const csv =
      '\uFEFFsourcedId,status,dateLastModified,name,type\norg-1,active,2026-10-01T00:00:00Z,Highland,school';
    const [row] = parseOneRosterCsv('orgs', csv);

    expect(row.name).toBe('Highland');
  });

  it('rejects CSV missing a required column', () => {
    expect(() => parseOneRosterCsv('users', 'givenName,familyName\r\nA,K')).toThrow(
      /missing required column/i
    );
  });

  it('rejects rows that violate the Zod entity contract', () => {
    expect(() =>
      parseOneRosterCsv(
        'users',
        'sourcedId,status,dateLastModified,givenName,familyName,role\r\nusr-1,suspended,2026-10-01T00:00:00Z,A,K,student'
      )
    ).toThrow(/invalid/i);
    expect(() =>
      parseOneRosterCsv('classes', 'sourcedId,status,dateLastModified,title\r\n,active,2026-10-01T00:00:00Z,')
    ).toThrow(/invalid/i);
  });
});

describe('delta sync diff by dateLastModified', () => {
  it('detects added, changed, and removed class rows', () => {
    const plan = REMOTE_CLASS_PLAN();

    expect(plan.added.map((row) => row.sourcedId)).toEqual(['cls-007', 'cls-008']);
    expect(plan.changed.map((row) => row.sourcedId)).toEqual(['cls-001', 'cls-003', 'cls-005']);
    expect(plan.removed.map((row) => row.sourcedId)).toEqual(['cls-006']);
    expect(plan.unchangedCount).toBe(2);
  });

  it('detects roster churn in the users resource', () => {
    const plan = computeSyncPlan(
      'users',
      SAMPLE_ONEROSTER_LOCAL.users,
      SAMPLE_ONEROSTER_REMOTE.users
    );

    expect(plan.added).toHaveLength(1);
    expect(plan.changed).toHaveLength(3);
    expect(plan.removed.map((row) => row.sourcedId)).toEqual(['usr-006']);
  });

  it('produces an empty plan when local already mirrors remote', () => {
    const first = REMOTE_CLASS_PLAN();
    const synced = applySyncPlan(SAMPLE_ONEROSTER_LOCAL.classes, first);
    const second = computeSyncPlan('classes', synced, SAMPLE_ONEROSTER_REMOTE.classes);

    expect(second.added).toHaveLength(0);
    expect(second.changed).toHaveLength(0);
    expect(second.removed).toHaveLength(0);
    expect(second.unchangedCount).toBe(SAMPLE_ONEROSTER_REMOTE.classes.length);
    expect(summarizeSyncPlan(second)).toEqual({
      added: 0,
      changed: 0,
      removed: 0,
      unchanged: 7,
    });
  });

  it('applies a plan so local matches the remote snapshot', () => {
    const plan = REMOTE_CLASS_PLAN();
    const merged = applySyncPlan(SAMPLE_ONEROSTER_LOCAL.classes, plan);
    const remoteIds = SAMPLE_ONEROSTER_REMOTE.classes.map((row) => row.sourcedId).sort();

    expect(merged.map((row) => row.sourcedId).sort()).toEqual(remoteIds);
    const changedRow = merged.find((row) => row.sourcedId === 'cls-005');
    expect(changedRow?.title).toBe('Grade 6A English & Literature');
  });

  it('limits the comparison window with a since timestamp', () => {
    const plan = REMOTE_CLASS_PLAN();

    expect(plan.changed.length).toBeGreaterThan(0);

    const futureWindow = computeSyncPlan(
      'classes',
      SAMPLE_ONEROSTER_LOCAL.classes,
      SAMPLE_ONEROSTER_REMOTE.classes,
      { since: '2026-12-01T00:00:00Z' }
    );
    expect(futureWindow.added).toHaveLength(0);
    expect(futureWindow.changed).toHaveLength(0);
    expect(futureWindow.removed.map((row) => row.sourcedId)).toEqual(['cls-006']);

    const octoberWindow = computeSyncPlan(
      'classes',
      SAMPLE_ONEROSTER_LOCAL.classes,
      SAMPLE_ONEROSTER_REMOTE.classes,
      { since: '2026-10-01T00:00:00Z' }
    );
    expect(octoberWindow.added).toHaveLength(2);
    expect(octoberWindow.changed).toHaveLength(3);
  });

  it('stamps the plan with a deterministic generatedAt when supplied', () => {
    const plan = computeSyncPlan('classes', [], [], { now: '2026-10-07T00:00:00.000Z' });

    expect(plan.generatedAt).toBe('2026-10-07T00:00:00.000Z');
    expect(plan.resource).toBe('classes');
  });
});

describe('pagination and filtering helpers', () => {
  const users: OneRosterUserRow[] = SAMPLE_ONEROSTER_LOCAL.users;

  it('slices rows into pages with correct totals', () => {
    const page1 = paginateRows(users, 1, 5);
    const page2 = paginateRows(users, 2, 5);

    expect(page1.items).toHaveLength(5);
    expect(page1.total).toBe(8);
    expect(page1.totalPages).toBe(2);
    expect(page2.items).toHaveLength(3);
    expect(page2.items[0].sourcedId).toBe('usr-006');
  });

  it('clamps out-of-range pages instead of returning undefined slices', () => {
    expect(paginateRows(users, 99, 5).page).toBe(2);
    expect(paginateRows(users, 0, 5).page).toBe(1);
    expect(paginateRows(users, 1, 0).pageSize).toBe(1);
  });

  it('searches across every string field case-insensitively', () => {
    expect(filterRows(users, { search: 'AMINA' })).toHaveLength(1);
    expect(filterRows(users, { search: 'teacher' })).toHaveLength(2);
    expect(filterRows(users, { search: 'no-match' })).toHaveLength(0);
  });

  it('filters by status and role sentinels', () => {
    expect(filterRows(users, { status: 'active' })).toHaveLength(8);
    expect(filterRows(users, { role: 'student' })).toHaveLength(5);
    expect(filterRows(users, { role: 'all', status: 'all' })).toHaveLength(8);
    expect(filterRows(SAMPLE_ONEROSTER_LOCAL.orgs, { type: 'district' })).toHaveLength(1);
  });
});

describe('delta query builder and row validation', () => {
  it('encodes the dateLastModified filter with limit and offset', () => {
    expect(buildDeltaQuery('2026-10-01T00:00:00Z')).toBe(
      `filter=${encodeURIComponent('dateLastModified>2026-10-01T00:00:00Z')}&limit=100&offset=0`
    );
    expect(buildDeltaQuery('2026-10-01T00:00:00Z', { limit: 25, offset: 50 })).toBe(
      `filter=${encodeURIComponent('dateLastModified>2026-10-01T00:00:00Z')}&limit=25&offset=50`
    );
  });

  it('validates typed rows against the resource schema', () => {
    const good = validateRows('classes', SAMPLE_ONEROSTER_LOCAL.classes);
    expect(good.valid).toBe(true);
    expect(good.errors).toHaveLength(0);

    const bad = validateRows('classes', [
      { sourcedId: '', status: 'active', dateLastModified: '2026-10-01T00:00:00Z', title: '' },
    ] as OneRosterClassRow[]);
    expect(bad.valid).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });
});

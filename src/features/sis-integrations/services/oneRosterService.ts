import {
  DeltaQueryOptions,
  ONE_ROSTER_RESOURCES,
  ONE_ROSTER_SCHEMAS,
  OneRosterFilterOptions,
  OneRosterResource,
  PaginatedResult,
  SyncableRow,
  SyncPlan,
} from '../types/sis';

export interface OneRosterManifest {
  resource: OneRosterResource;
  columns: string[];
  requiredColumns: string[];
}

export const ONE_ROSTER_MANIFESTS: Record<OneRosterResource, OneRosterManifest> = {
  orgs: {
    resource: 'orgs',
    columns: ['sourcedId', 'status', 'dateLastModified', 'name', 'type', 'identifier', 'parentSourcedId'],
    requiredColumns: ['sourcedId', 'status', 'dateLastModified', 'name', 'type'],
  },
  classes: {
    resource: 'classes',
    columns: [
      'sourcedId',
      'status',
      'dateLastModified',
      'title',
      'classCode',
      'schoolSourcedId',
      'courseSourcedId',
      'termSourcedIds',
      'grade',
      'subject',
      'classPeriods',
      'teachers',
    ],
    requiredColumns: ['sourcedId', 'status', 'dateLastModified', 'title'],
  },
  courses: {
    resource: 'courses',
    columns: [
      'sourcedId',
      'status',
      'dateLastModified',
      'title',
      'courseCode',
      'subject',
      'orgSourcedId',
      'grade',
    ],
    requiredColumns: ['sourcedId', 'status', 'dateLastModified', 'title'],
  },
  users: {
    resource: 'users',
    columns: [
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
    ],
    requiredColumns: ['sourcedId', 'status', 'dateLastModified', 'givenName', 'familyName', 'role'],
  },
  memberships: {
    resource: 'memberships',
    columns: [
      'sourcedId',
      'status',
      'dateLastModified',
      'userSourcedId',
      'classSourcedId',
      'role',
      'dateStart',
      'dateEnd',
    ],
    requiredColumns: ['sourcedId', 'status', 'dateLastModified', 'userSourcedId', 'classSourcedId', 'role'],
  },
  academicSessions: {
    resource: 'academicSessions',
    columns: [
      'sourcedId',
      'status',
      'dateLastModified',
      'title',
      'type',
      'startDate',
      'endDate',
      'parentSourcedId',
    ],
    requiredColumns: ['sourcedId', 'status', 'dateLastModified', 'title', 'type', 'startDate', 'endDate'],
  },
};

export function getManifest(resource: OneRosterManifest['resource']): OneRosterManifest {
  const manifest = ONE_ROSTER_MANIFESTS[resource];
  if (!manifest) throw new Error(`Unknown OneRoster resource "${resource}".`);
  return manifest;
}

// ---------------------------------------------------------------- //
// RFC 4180 CSV serialization
// ---------------------------------------------------------------- //

export function escapeCsvCell(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value) || value !== value.trim();
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

export function serializeOneRosterCsv(
  resource: OneRosterResource,
  rows: ReadonlyArray<Record<string, string | undefined>>
): string {
  const manifest = getManifest(resource);
  const lines: string[] = [manifest.columns.join(',')];
  for (const row of rows) {
    lines.push(manifest.columns.map((column) => escapeCsvCell(row[column] ?? '')).join(','));
  }
  return lines.join('\r\n');
}

// ---------------------------------------------------------------- //
// RFC 4180 CSV parsing with header mapping
// ---------------------------------------------------------------- //

export interface CsvTable {
  headers: string[];
  records: string[][];
}

export function parseCsvTable(csv: string): CsvTable {
  const input = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let insideQuotes = false;
  let index = 0;

  const endField = (): void => {
    record.push(field);
    field = '';
  };
  const endRecord = (): void => {
    endField();
    records.push(record);
    record = [];
  };

  while (index < input.length) {
    const char = input[index];

    if (insideQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        insideQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"' && field.length === 0) {
      insideQuotes = true;
      index += 1;
      continue;
    }
    if (char === ',') {
      endField();
      index += 1;
      continue;
    }
    if (char === '\r') {
      if (input[index + 1] === '\n') index += 2;
      else index += 1;
      endRecord();
      continue;
    }
    if (char === '\n') {
      index += 1;
      endRecord();
      continue;
    }
    field += char;
    index += 1;
  }

  if (field.length > 0 || record.length > 0) endRecord();

  const headers = (records.shift() ?? []).map((header) => header.trim());
  return { headers, records };
}

export function parseOneRosterCsv(resource: OneRosterResource, csv: string): Record<string, string>[] {
  const manifest = getManifest(resource);
  const { headers, records } = parseCsvTable(csv);
  if (headers.length === 0) throw new Error(`OneRoster ${resource} CSV is missing a header row.`);

  const headerIndex = new Map<string, number>();
  headers.forEach((header, position) => {
    const key = header.toLowerCase();
    if (!headerIndex.has(key)) headerIndex.set(key, position);
  });

  for (const required of manifest.requiredColumns) {
    if (!headerIndex.has(required.toLowerCase())) {
      throw new Error(`OneRoster ${resource} CSV is missing required column "${required}".`);
    }
  }

  const schema = ONE_ROSTER_SCHEMAS[resource];
  const rows: Record<string, string>[] = [];

  records.forEach((record, rowIndex) => {
    if (record.length === 1 && record[0] === '') return;

    const raw: Record<string, string> = {};
    for (const column of manifest.columns) {
      const position = headerIndex.get(column.toLowerCase());
      raw[column] = position === undefined ? '' : (record[position] ?? '');
    }
    headers.forEach((header, position) => {
      const isManifestColumn = manifest.columns.some(
        (column) => column.toLowerCase() === header.toLowerCase()
      );
      if (!isManifestColumn && header.length > 0) raw[header] = record[position] ?? '';
    });

    const result = schema.safeParse(raw);
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
        .join('; ');
      throw new Error(`OneRoster ${resource} row ${rowIndex + 2} is invalid — ${detail}`);
    }
    rows.push(raw);
  });

  return rows;
}

// ---------------------------------------------------------------- //
// Delta sync diff by dateLastModified
// ---------------------------------------------------------------- //

const toTime = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

function rowsDiffer(a: Record<string, string | undefined>, b: Record<string, string | undefined>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? '') !== (b[key] ?? '')) return true;
  }
  return false;
}

export interface SyncPlanOptions {
  since?: string;
  now?: string;
}

export function computeSyncPlan<T extends SyncableRow & Record<string, string | undefined>>(
  resource: OneRosterResource,
  local: T[],
  remote: T[],
  options: SyncPlanOptions = {}
): SyncPlan<T> {
  const localById = new Map(local.map((row) => [row.sourcedId, row]));
  const remoteById = new Map(remote.map((row) => [row.sourcedId, row]));

  const sinceTime = options.since ? toTime(options.since) : null;
  const consideredRemote =
    sinceTime === null
      ? remote
      : remote.filter((row) => {
          const time = toTime(row.dateLastModified);
          return time !== null && time > sinceTime;
        });

  const added: T[] = [];
  const changed: T[] = [];
  let unchangedCount = 0;

  for (const row of consideredRemote) {
    const previous = localById.get(row.sourcedId);
    if (!previous) {
      added.push(row);
      continue;
    }
    if (rowsDiffer(previous, row)) changed.push(row);
    else unchangedCount += 1;
  }

  const removed = local.filter((row) => !remoteById.has(row.sourcedId));

  return {
    resource,
    added,
    changed,
    removed,
    unchangedCount,
    generatedAt: options.now ?? new Date().toISOString(),
  };
}

export function applySyncPlan<T extends SyncableRow>(local: T[], plan: SyncPlan<T>): T[] {
  const merged = new Map(local.map((row) => [row.sourcedId, row]));
  for (const row of plan.removed) merged.delete(row.sourcedId);
  for (const row of plan.added) merged.set(row.sourcedId, row);
  for (const row of plan.changed) merged.set(row.sourcedId, row);
  return [...merged.values()];
}

export interface SyncSummary {
  added: number;
  changed: number;
  removed: number;
  unchanged: number;
}

export function summarizeSyncPlan(plan: SyncPlan<SyncableRow>): SyncSummary {
  return {
    added: plan.added.length,
    changed: plan.changed.length,
    removed: plan.removed.length,
    unchanged: plan.unchangedCount,
  };
}

// ---------------------------------------------------------------- //
// Pagination, filtering, delta query helpers
// ---------------------------------------------------------------- //

export function paginateRows<T>(rows: T[], page = 1, pageSize = 25): PaginatedResult<T> {
  const total = rows.length;
  const safeSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (safePage - 1) * safeSize;
  return {
    items: rows.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total,
    totalPages,
  };
}

export function filterRows<T extends Record<string, string | undefined>>(
  rows: T[],
  options: OneRosterFilterOptions = {}
): T[] {
  let list = [...rows];

  if (options.search && options.search.trim().length > 0) {
    const query = options.search.trim().toLowerCase();
    list = list.filter((row) =>
      Object.values(row).some((value) => typeof value === 'string' && value.toLowerCase().includes(query))
    );
  }
  if (options.status && options.status !== 'all') {
    list = list.filter((row) => row.status === options.status);
  }
  if (options.role && options.role !== 'all') {
    list = list.filter((row) => row.role === options.role);
  }
  if (options.type && options.type !== 'all') {
    list = list.filter((row) => row.type === options.type);
  }

  return list;
}

export function buildDeltaQuery(since: string, options: DeltaQueryOptions = {}): string {
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;
  return `filter=${encodeURIComponent(`dateLastModified>${since}`)}&limit=${limit}&offset=${offset}`;
}

export function validateRows(
  resource: OneRosterResource,
  rows: ReadonlyArray<Record<string, string | undefined>>
): { valid: boolean; errors: string[] } {
  const schema = ONE_ROSTER_SCHEMAS[resource];
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const result = schema.safeParse({ ...row });
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push(`row ${index + 1} — ${issue.path.join('.') || 'row'}: ${issue.message}`);
      });
    }
  });
  return { valid: errors.length === 0, errors };
}

export function listResources(): OneRosterResource[] {
  return [...ONE_ROSTER_RESOURCES];
}

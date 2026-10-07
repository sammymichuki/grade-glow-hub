import {
  JsonPatchOp,
  MutationKind,
  MutationPriorityRank,
  MUTATION_PRIORITY_RANK,
  SyncAck,
  SyncChunk,
  SyncDelta,
  SyncNack,
  SyncSession,
  TransferPlan,
} from '../types/edgeMesh';

const UTF8_ENCODER = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(
      (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key])
    );
  }
  return false;
};

const escapeToken = (token: string): string => token.replace(/~/g, '~0').replace(/\//g, '~1');

const joinPath = (basePath: string, token: string): string => `${basePath}/${escapeToken(token)}`;

const sortedKeys = (obj: Record<string, unknown>): string[] => Object.keys(obj).sort();

const diffInto = (base: unknown, target: unknown, path: string, out: JsonPatchOp[]): void => {
  if (deepEqual(base, target)) return;

  if (isPlainObject(base) && isPlainObject(target)) {
    for (const key of sortedKeys(base)) {
      if (!Object.prototype.hasOwnProperty.call(target, key)) {
        out.push({ op: 'remove', path: joinPath(path, key) });
      }
    }
    for (const key of sortedKeys(target)) {
      if (!Object.prototype.hasOwnProperty.call(base, key)) {
        out.push({ op: 'add', path: joinPath(path, key), value: target[key] });
      } else {
        diffInto(base[key], target[key], joinPath(path, key), out);
      }
    }
    return;
  }

  if (Array.isArray(base) && Array.isArray(target)) {
    const common = Math.min(base.length, target.length);
    for (let i = 0; i < common; i += 1) {
      diffInto(base[i], target[i], `${path}/${i}`, out);
    }
    if (target.length > base.length) {
      for (let i = base.length; i < target.length; i += 1) {
        out.push({ op: 'add', path: `${path}/${i}`, value: target[i] });
      }
    } else {
      // Remove from the tail backwards so surviving element indices never shift under later ops.
      for (let i = base.length - 1; i >= target.length; i -= 1) {
        out.push({ op: 'remove', path: `${path}/${i}` });
      }
    }
    return;
  }

  out.push({ op: 'replace', path, value: target });
};

export const diffJson = (base: unknown, target: unknown): JsonPatchOp[] => {
  const ops: JsonPatchOp[] = [];
  diffInto(base, target, '', ops);
  return ops;
};

export const parsePointer = (path: string): string[] => {
  if (path === '') return [];
  if (!path.startsWith('/')) throw new Error(`Invalid JSON pointer: ${path}`);
  return path
    .slice(1)
    .split('/')
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));
};

const deepClone = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map((item) => deepClone(item)) as unknown as T;
  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(value)) copy[key] = deepClone(value[key]);
    return copy as T;
  }
  return value;
};

const requireParent = (doc: unknown, tokens: string[]): Record<string, unknown> | unknown[] => {
  let cursor: unknown = doc;
  for (const token of tokens) {
    if (Array.isArray(cursor)) {
      const index = Number(token);
      if (!Number.isInteger(index) || index < 0 || index >= cursor.length) {
        throw new Error(`Array index out of range: ${token}`);
      }
      cursor = cursor[index];
    } else if (isPlainObject(cursor)) {
      if (!Object.prototype.hasOwnProperty.call(cursor, token)) {
        throw new Error(`Missing path segment: ${token}`);
      }
      cursor = cursor[token];
    } else {
      throw new Error(`Cannot traverse into scalar at segment: ${token}`);
    }
  }
  if (!Array.isArray(cursor) && !isPlainObject(cursor)) {
    throw new Error('Patch parent must be an object or array');
  }
  return cursor;
};

const applyOne = (doc: unknown, op: JsonPatchOp): unknown => {
  if (op.path === '') {
    if (op.op === 'remove') throw new Error('Cannot remove the root document');
    return deepClone(op.value);
  }

  const tokens = parsePointer(op.path);
  const parentTokens = tokens.slice(0, -1);
  const lastToken = tokens[tokens.length - 1];
  const parent = requireParent(doc, parentTokens);

  if (Array.isArray(parent)) {
    const index = Number(lastToken);
    if (!Number.isInteger(index) || index < 0) throw new Error(`Invalid array index: ${lastToken}`);
    if (op.op === 'add') {
      if (index > parent.length) throw new Error(`Array insert index out of range: ${index}`);
      parent.splice(index, 0, deepClone(op.value));
      return doc;
    }
    if (index >= parent.length) throw new Error(`Array index out of range: ${index}`);
    if (op.op === 'remove') {
      parent.splice(index, 1);
      return doc;
    }
    parent[index] = deepClone(op.value);
    return doc;
  }

  const obj = parent as Record<string, unknown>;
  const exists = Object.prototype.hasOwnProperty.call(obj, lastToken);
  if (op.op === 'remove') {
    if (!exists) throw new Error(`Cannot remove missing key: ${op.path}`);
    delete obj[lastToken];
    return doc;
  }
  if (op.op === 'replace' && !exists) throw new Error(`Cannot replace missing key: ${op.path}`);
  obj[lastToken] = deepClone(op.value);
  return doc;
};

export const applyPatch = <T>(doc: T, ops: JsonPatchOp[]): T => {
  let result: unknown = deepClone(doc);
  for (const op of ops) result = applyOne(result, op);
  return result as T;
};

const valueAt = (doc: unknown, path: string): unknown => {
  if (path === '') return doc;
  const tokens = parsePointer(path);
  const parent = requireParent(doc, tokens.slice(0, -1));
  const last = tokens[tokens.length - 1];
  if (Array.isArray(parent)) {
    const index = Number(last);
    if (!Number.isInteger(index) || index < 0 || index >= parent.length) {
      throw new Error(`Array index out of range: ${last}`);
    }
    return parent[index];
  }
  const obj = parent as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(obj, last)) throw new Error(`Missing key: ${path}`);
  return obj[last];
};

export const invertPatch = <T>(doc: T, ops: JsonPatchOp[]): JsonPatchOp[] => {
  let working: unknown = deepClone(doc);
  const inverse: JsonPatchOp[] = [];
  for (const op of ops) {
    if (op.path === '') {
      if (op.op !== 'remove') inverse.push({ op: 'replace', path: '', value: deepClone(working) });
    } else if (op.op === 'add') {
      inverse.push({ op: 'remove', path: op.path });
    } else if (op.op === 'remove') {
      inverse.push({ op: 'add', path: op.path, value: deepClone(valueAt(working, op.path)) });
    } else {
      inverse.push({ op: 'replace', path: op.path, value: deepClone(valueAt(working, op.path)) });
    }
    working = applyOne(working, op);
  }
  return inverse.reverse();
};

const mergePair = (a: JsonPatchOp, b: JsonPatchOp): JsonPatchOp | null => {
  if (a.path !== b.path) return null;
  if (a.op === 'replace' && b.op === 'replace') return b;
  if (a.op === 'replace' && b.op === 'remove') return b;
  if (a.op === 'add' && b.op === 'replace') return { op: 'add', path: b.path, value: b.value };
  if (a.op === 'remove' && b.op === 'add') return { op: 'replace', path: b.path, value: b.value };
  if (a.op === 'remove' && b.op === 'replace') return null;
  if (a.op === 'add' && b.op === 'add') return null;
  if (a.op === 'remove' && b.op === 'remove') return null;
  if (a.op === 'add' && b.op === 'remove') return null;
  if (a.op === 'replace' && b.op === 'add') return null;
  return null;
};

export const compressOps = (ops: JsonPatchOp[]): JsonPatchOp[] => {
  const out: JsonPatchOp[] = [];
  for (const op of ops) {
    out.push(op);
    while (out.length >= 2) {
      const merged = mergePair(out[out.length - 2], out[out.length - 1]);
      if (!merged) break;
      out.splice(out.length - 2, 2, merged);
    }
  }
  return out;
};

export const opByteSize = (op: JsonPatchOp): number => {
  const json = JSON.stringify(op);
  return UTF8_ENCODER ? UTF8_ENCODER.encode(json).length : json.length;
};

const FIRST_SEGMENT_PRIORITY: Record<string, MutationKind> = {
  quizSubmissions: 'quiz-submission',
  submissions: 'quiz-submission',
  attempts: 'quiz-submission',
  progress: 'progress',
  courseProgress: 'progress',
  telemetry: 'telemetry',
  metrics: 'telemetry',
};

export const firstPointerSegment = (path: string): string => {
  if (!path.startsWith('/')) return '';
  const rest = path.slice(1);
  const slash = rest.indexOf('/');
  return slash === -1 ? rest : rest.slice(0, slash);
};

export const classifyOpPriority = (op: JsonPatchOp): MutationKind =>
  FIRST_SEGMENT_PRIORITY[firstPointerSegment(op.path)] ?? 'progress';

const priorityRankOf = (kind: MutationKind): MutationPriorityRank => MUTATION_PRIORITY_RANK[kind];

/**
 * Stable bucket ordering: ops are grouped by priority rank while preserving the
 * diff-emitted order inside each rank. Ops on distinct top-level subtrees commute,
 * and ops sharing a subtree always share a rank, so reordering cannot corrupt apply.
 */
export const orderOpsByPriority = (ops: JsonPatchOp[]): JsonPatchOp[] => {
  const buckets: JsonPatchOp[][] = [[], [], []];
  for (const op of ops) buckets[priorityRankOf(classifyOpPriority(op))].push(op);
  return [...buckets[0], ...buckets[1], ...buckets[2]];
};

export const DEFAULT_BYTE_BUDGET = 16 * 1024;

export interface PlanOptions {
  byteBudget?: number;
  compress?: boolean;
}

export const planDeltaTransfer = (delta: SyncDelta, options: PlanOptions = {}): TransferPlan => {
  const byteBudget = options.byteBudget ?? DEFAULT_BYTE_BUDGET;
  if (byteBudget <= 0) throw new Error('byteBudget must be positive');

  const rawBytes = delta.ops.reduce((sum, op) => sum + opByteSize(op), 0);
  const compressed = options.compress === false ? delta.ops : compressOps(delta.ops);
  const ordered = orderOpsByPriority(compressed);
  const sizes = ordered.map(opByteSize);

  const chunks: SyncChunk[] = [];
  let start = 0;
  let size = 0;
  let rank: MutationPriorityRank = ordered.length > 0 ? priorityRankOf(classifyOpPriority(ordered[0])) : 0;

  for (let i = 0; i < ordered.length; i += 1) {
    const opRank = priorityRankOf(classifyOpPriority(ordered[i]));
    const changedRank = i > start && opRank !== rank;
    const overBudget = size > 0 && size + sizes[i] > byteBudget;
    if (changedRank || overBudget) {
      chunks.push({
        index: chunks.length,
        deltaId: delta.id,
        ops: ordered.slice(start, i),
        startCursor: start,
        endCursor: i,
        byteSize: size,
        priorityRank: rank,
        oversized: false,
      });
      start = i;
      size = 0;
      rank = opRank;
    }
    size += sizes[i];
  }

  if (ordered.length > 0) {
    chunks.push({
      index: chunks.length,
      deltaId: delta.id,
      ops: ordered.slice(start),
      startCursor: start,
      endCursor: ordered.length,
      byteSize: size,
      priorityRank: rank,
      oversized: size > byteBudget,
    });
  }

  return {
    deltaId: delta.id,
    chunks,
    totalOps: ordered.length,
    totalBytes: chunks.reduce((sum, chunk) => sum + chunk.byteSize, 0),
    rawBytes,
    byteBudget,
  };
};

export interface BackoffOptions {
  baseMs?: number;
  factor?: number;
  maxMs?: number;
}

export const DEFAULT_BACKOFF: Required<BackoffOptions> = {
  baseMs: 1000,
  factor: 2,
  maxMs: 30000,
};

export const backoffDelayMs = (attempt: number, options: BackoffOptions = {}): number => {
  if (attempt < 1) throw new Error('attempt must be >= 1');
  const base = options.baseMs ?? DEFAULT_BACKOFF.baseMs;
  const factor = options.factor ?? DEFAULT_BACKOFF.factor;
  const max = options.maxMs ?? DEFAULT_BACKOFF.maxMs;
  const raw = base * Math.pow(factor, attempt - 1);
  return Math.min(Math.round(raw), max);
};

export const backoffSchedule = (attempts: number, options: BackoffOptions = {}): number[] =>
  Array.from({ length: attempts }, (_, index) => backoffDelayMs(index + 1, options));

export interface SessionSeed {
  now: number;
  id?: string;
}

export const createSession = (delta: SyncDelta, plan: TransferPlan, seed: SessionSeed): SyncSession => ({
  id: seed.id ?? `sess_${delta.id}_${seed.now}`,
  deltaId: delta.id,
  totalOps: plan.totalOps,
  totalBytes: plan.totalBytes,
  cursor: 0,
  ackedBytes: 0,
  status: 'transferring',
  attempt: 0,
  nextRetryAt: null,
  chunkCount: plan.chunks.length,
  startedAt: seed.now,
  updatedAt: seed.now,
});

export const applyAck = (session: SyncSession, ack: SyncAck, now: number): SyncSession => {
  if (ack.sessionId !== session.id) throw new Error('Ack session mismatch');
  if (ack.deltaId !== session.deltaId) throw new Error('Ack delta mismatch');
  const nextCursor = Math.min(Math.max(session.cursor, ack.toCursor), session.totalOps);
  const progressed = nextCursor > session.cursor;
  const nextAcked = Math.min(session.ackedBytes + ack.receivedBytes, session.totalBytes);
  return {
    ...session,
    cursor: nextCursor,
    ackedBytes: nextAcked,
    attempt: progressed ? 0 : session.attempt,
    nextRetryAt: progressed ? null : session.nextRetryAt,
    status: nextCursor >= session.totalOps ? 'complete' : 'transferring',
    updatedAt: now,
  };
};

export const applyNack = (session: SyncSession, nack: SyncNack, now: number): SyncSession => {
  if (nack.sessionId !== session.id) throw new Error('Nack session mismatch');
  if (nack.deltaId !== session.deltaId) throw new Error('Nack delta mismatch');
  if (!nack.retryable) {
    return { ...session, status: 'rejected', nextRetryAt: null, updatedAt: now };
  }
  const attempt = session.attempt + 1;
  return {
    ...session,
    status: 'awaiting-retry',
    attempt,
    nextRetryAt: now + backoffDelayMs(attempt),
    updatedAt: now,
  };
};

export const canAttempt = (session: SyncSession, now: number): boolean => {
  if (session.status === 'complete' || session.status === 'rejected') return false;
  return session.nextRetryAt === null || now >= session.nextRetryAt;
};

export const estimateRemainingMs = (session: SyncSession, bytesPerSecond: number): number => {
  if (bytesPerSecond <= 0) throw new Error('bytesPerSecond must be positive');
  if (session.status === 'complete') return 0;
  const remainingBytes = Math.max(session.totalBytes - session.ackedBytes, 0);
  return Math.ceil((remainingBytes / bytesPerSecond) * 1000);
};

import { describe, it, expect } from 'vitest';
import {
  applyAck,
  applyNack,
  applyPatch,
  backoffDelayMs,
  backoffSchedule,
  canAttempt,
  classifyOpPriority,
  compressOps,
  createSession,
  deepEqual,
  diffJson,
  estimateRemainingMs,
  invertPatch,
  opByteSize,
  orderOpsByPriority,
  parsePointer,
  planDeltaTransfer,
} from '../services/edgeSyncProtocol';
import { JsonPatchOp, SyncDelta } from '../types/edgeMesh';

const makeDelta = (ops: JsonPatchOp[]): SyncDelta => ({
  id: 'delta_1',
  baseVersion: 0,
  targetVersion: 1,
  origin: 'quiz-submission',
  ops,
  createdAt: 100,
});

describe('diffJson / applyPatch round-trip', () => {
  it('emits adds, replaces and tail-first removes for nested changes', () => {
    const base = { name: 'a', scores: [1, 2, 3], meta: { w: 1 } };
    const target = { name: 'b', scores: [1, 3], meta: { w: 1, h: 2 } };
    const ops = diffJson(base, target);
    expect(ops).toContainEqual({ op: 'replace', path: '/name', value: 'b' });
    expect(ops).toContainEqual({ op: 'replace', path: '/scores/1', value: 3 });
    expect(ops).toContainEqual({ op: 'remove', path: '/scores/2' });
    expect(ops).toContainEqual({ op: 'add', path: '/meta/h', value: 2 });
  });

  it('reconstructs the target when the patch is applied to the base', () => {
    const base = { scores: [1, 2, 3], meta: { w: 1 } };
    const target = { name: 'b', scores: [1, 3], meta: { w: 2, h: 2 } };
    const restored = applyPatch(base, diffJson(base, target));
    expect(restored).toEqual(target);
  });

  it('escapes "/" and "~" in object keys so pointers round-trip', () => {
    const base = { a: { x: 1 } };
    const target = { a: { 'x/y~z': 2, x: 1 } };
    const ops = diffJson(base, target);
    expect(ops).toContainEqual({ op: 'add', path: '/a/x~1y~0z', value: 2 });
    expect(parsePointer('/a/x~1y~0z')).toEqual(['a', 'x/y~z']);
  });

  it('throws when replacing or removing a missing path', () => {
    expect(() => applyPatch({}, [{ op: 'replace', path: '/nope', value: 1 }])).toThrow();
    expect(() => applyPatch({}, [{ op: 'remove', path: '/nope' }])).toThrow();
  });

  it('detects deep inequality with deepEqual', () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: [1] }, { a: [1, 2] })).toBe(false);
  });
});

describe('invertPatch', () => {
  it('produces an inverse that returns the document to its base state', () => {
    const base = { a: 1 };
    const ops: JsonPatchOp[] = [
      { op: 'replace', path: '/a', value: 2 },
      { op: 'add', path: '/b', value: 5 },
    ];
    const patched = applyPatch(base, ops);
    expect(patched).toEqual({ a: 2, b: 5 });
    expect(applyPatch(patched, invertPatch(base, ops))).toEqual(base);
  });

  it('turns add into remove and remove into add with the removed value', () => {
    const base = { a: 1, b: 2 };
    const inverse = invertPatch(base, [{ op: 'remove', path: '/b' }]);
    expect(inverse).toEqual([{ op: 'add', path: '/b', value: 2 }]);
  });
});

describe('compressOps', () => {
  it('merges consecutive replace+replace into a single op', () => {
    const merged = compressOps([
      { op: 'replace', path: '/a', value: 1 },
      { op: 'replace', path: '/a', value: 2 },
    ]);
    expect(merged).toEqual([{ op: 'replace', path: '/a', value: 2 }]);
  });

  it('merges trailing remove+add into a single replace', () => {
    const merged = compressOps([
      { op: 'remove', path: '/a' },
      { op: 'add', path: '/a', value: 3 },
    ]);
    expect(merged).toEqual([{ op: 'replace', path: '/a', value: 3 }]);
  });

  it('does not merge add+add on the same path', () => {
    const ops = compressOps([
      { op: 'add', path: '/a', value: 1 },
      { op: 'add', path: '/a', value: 2 },
    ]);
    expect(ops).toHaveLength(2);
  });
});

describe('planDeltaTransfer prioritisation and chunking', () => {
  it('reorders ops so quiz-submission rank (0) ships before progress and telemetry', () => {
    const ops: JsonPatchOp[] = [
      { op: 'add', path: '/telemetry/evt', value: { t: 1 } },
      { op: 'replace', path: '/quizSubmissions/q1/score', value: 9 },
      { op: 'add', path: '/progress/s1_c1', value: { pct: 20 } },
    ];
    const ordered = orderOpsByPriority(ops);
    expect(classifyOpPriority(ordered[0])).toBe('quiz-submission');
    expect(ordered[0].path).toContain('quizSubmissions');
    expect(ordered[ordered.length - 1].path).toContain('telemetry');
  });

  it('keeps a single chunk when everything fits inside the budget', () => {
    const delta = makeDelta([{ op: 'add', path: '/quizSubmissions/q1', value: { s: 1 } }]);
    const plan = planDeltaTransfer(delta, { byteBudget: 1024 });
    expect(plan.chunks).toHaveLength(1);
    expect(plan.totalOps).toBe(1);
    expect(plan.chunks[0].priorityRank).toBe(0);
    expect(plan.chunks[0].oversized).toBe(false);
  });

  it('splits chunks at priority-rank boundaries', () => {
    const ops: JsonPatchOp[] = [
      { op: 'add', path: '/telemetry/evt', value: 1 },
      { op: 'add', path: '/quizSubmissions/q1', value: 1 },
      { op: 'add', path: '/progress/s1_c1', value: 1 },
    ];
    const delta = makeDelta(ops);
    const plan = planDeltaTransfer(delta, { byteBudget: 16 * 1024 });
    expect(plan.chunks.map((chunk) => chunk.priorityRank)).toEqual([0, 1, 2]);
  });

  it('marks oversized single ops instead of splitting them', () => {
    const bigOp: JsonPatchOp = { op: 'add', path: '/quizSubmissions/big', value: 'x'.repeat(400) };
    const plan = planDeltaTransfer(makeDelta([bigOp]), { byteBudget: 48, compress: false });
    expect(plan.chunks).toHaveLength(1);
    expect(plan.chunks[0].oversized).toBe(true);
    expect(plan.chunks[0].byteSize).toBeGreaterThan(plan.byteBudget);
  });

  it('measures wire bytes with opByteSize', () => {
    const bytes = opByteSize({ op: 'add', path: '/a', value: 'hello' });
    expect(bytes).toBe(new TextEncoder().encode('{"op":"add","path":"/a","value":"hello"}').length);
  });

  it('rejects a non-positive byte budget', () => {
    expect(() => planDeltaTransfer(makeDelta([]), { byteBudget: 0 })).toThrow();
  });
});

describe('exponential backoff', () => {
  it('grows exponentially from the base and caps at the maximum', () => {
    expect(backoffDelayMs(1)).toBe(1000);
    expect(backoffDelayMs(3)).toBe(4000);
    expect(backoffDelayMs(10)).toBe(30000);
  });

  it('honours custom base and factor and returns an empty schedule for zero attempts', () => {
    expect(backoffDelayMs(2, { baseMs: 200, factor: 3 })).toBe(600);
    expect(backoffSchedule(0)).toEqual([]);
    expect(backoffSchedule(2)).toEqual([1000, 2000]);
  });

  it('throws for an invalid attempt count', () => {
    expect(() => backoffDelayMs(0)).toThrow();
  });
});

describe('session lifecycle', () => {
  const plan = planDeltaTransfer(
    makeDelta([{ op: 'add', path: '/quizSubmissions/q1', value: 9 }]),
    { byteBudget: 1024 }
  );

  it('creates a transferring session seeded from the plan', () => {
    const session = createSession(makeDelta([{ op: 'add', path: '/a', value: 1 }]), plan, { now: 500, id: 'sess_x' });
    expect(session.id).toBe('sess_x');
    expect(session.status).toBe('transferring');
    expect(session.totalOps).toBe(plan.totalOps);
    expect(session.chunkCount).toBe(plan.chunks.length);
    expect(session.cursor).toBe(0);
  });

  it('marks the session complete when every byte is acked and resets the budget', () => {
    const session = createSession(makeDelta([{ op: 'add', path: '/a', value: 1 }]), plan, {
      now: 500,
      id: 'sess_y',
    });
    const acked = applyAck(
      session,
      { sessionId: 'sess_y', deltaId: session.deltaId, fromCursor: 0, toCursor: session.totalOps, receivedBytes: session.totalBytes, serverVersion: 1 },
      600
    );
    expect(acked.cursor).toBe(session.totalOps);
    expect(acked.ackedBytes).toBe(session.totalBytes);
    expect(acked.status).toBe('complete');
    expect(acked.attempt).toBe(0);
  });

  it('rejects acks from a mismatched session', () => {
    const session = createSession(makeDelta([{ op: 'add', path: '/a', value: 1 }]), plan, { now: 1, id: 's1' });
    expect(() =>
      applyAck(session, { sessionId: 'other', deltaId: session.deltaId, fromCursor: 0, toCursor: 0, receivedBytes: 0, serverVersion: 1 }, 2)
    ).toThrow();
  });

  it('schedules a backoff for retryable nacks and rejects permanent ones', () => {
    const session = createSession(makeDelta([{ op: 'add', path: '/a', value: 1 }]), plan, { now: 1000, id: 's2' });
    const retry = applyNack(
      session,
      { sessionId: 's2', deltaId: session.deltaId, failedCursor: 0, reason: 'timeout', retryable: true },
      1000
    );
    expect(retry.status).toBe('awaiting-retry');
    expect(retry.attempt).toBe(1);
    expect(retry.nextRetryAt).toBe(2000);

    const dead = applyNack(
      session,
      { sessionId: 's2', deltaId: session.deltaId, failedCursor: 0, reason: 'validation', retryable: false },
      1000
    );
    expect(dead.status).toBe('rejected');
    expect(dead.nextRetryAt).toBeNull();
  });

  it('gates retry attempts on the backoff window', () => {
    const session = {
      ...createSession(makeDelta([{ op: 'add', path: '/a', value: 1 }]), plan, { now: 1000, id: 's3' }),
      status: 'awaiting-retry' as const,
      nextRetryAt: 2000,
    };
    expect(canAttempt(session, 1500)).toBe(false);
    expect(canAttempt(session, 2500)).toBe(true);
    expect(canAttempt({ ...session, status: 'complete' }, 9999)).toBe(false);
  });

  it('estimates remaining wire time from unacked bytes', () => {
    const partial = {
      ...createSession(makeDelta([{ op: 'add', path: '/a', value: 1 }]), plan, { now: 0, id: 's4' }),
      ackedBytes: 10,
    };
    expect(estimateRemainingMs(partial, 50)).toBe(Math.ceil(((partial.totalBytes - 10) / 50) * 1000));
    expect(() => estimateRemainingMs(partial, 0)).toThrow();
  });
});
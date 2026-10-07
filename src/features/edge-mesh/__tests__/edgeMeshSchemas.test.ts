import { describe, it, expect } from 'vitest';
import {
  validateSyncDelta,
  validateJsonPatchOp,
  validateQueuedMutation,
  validateSyncChunk,
  validateSyncAck,
  validateSyncNack,
  validateEdgeNodeRecord,
  validateSessionRecord,
  validateEdgeMeshState,
  validateConnectionProfile,
} from '../types/edgeMesh';

const validDelta = {
  id: 'delta_1',
  baseVersion: 0,
  targetVersion: 1,
  origin: 'quiz-submission',
  ops: [{ op: 'add', path: '/quizSubmissions/q1', value: { score: 8 } }],
  createdAt: 1000,
};

describe('Zod edge-mesh schemas', () => {
  it('accepts a well-formed sync delta', () => {
    expect(validateSyncDelta(validDelta).id).toBe('delta_1');
  });

  it('rejects an unknown mutation origin', () => {
    expect(() =>
      validateSyncDelta({ ...validDelta, origin: 'answers' })
    ).toThrow();
  });

  it('rejects malformed JSON pointers', () => {
    expect(() =>
      validateJsonPatchOp({ op: 'add', path: '/a/b/c', value: 1 })
    ).not.toThrow();
    expect(() =>
      validateJsonPatchOp({ op: 'add', path: '/a/~1b', value: 1 })
    ).not.toThrow();
    expect(() =>
      validateJsonPatchOp({ op: 'add', path: 'noleadingslash', value: 1 })
    ).toThrow();
    expect(() =>
      validateJsonPatchOp({ op: 'add', path: '/a~2x', value: 1 })
    ).toThrow();
  });

  it('accepts escaped tokens ~0 and ~1 in a pointer', () => {
    const op = validateJsonPatchOp({ op: 'add', path: '/a/x~1y~0z', value: 2 });
    expect(op.path).toBe('/a/x~1y~0z');
    expect((op as { value: number }).value).toBe(2);
  });

  it('rejects queued mutations with a negative byte size', () => {
    const mutation = {
      id: 'm1',
      kind: 'progress',
      payload: { pct: 10 },
      createdAt: 1,
      retryCount: 0,
      byteSize: -4,
    };
    expect(() => validateQueuedMutation(mutation)).toThrow();
  });

  it('accepts a valid queued mutation and rejects unknown kinds', () => {
    const mutation = {
      id: 'm2',
      kind: 'quiz-submission',
      payload: { score: 8 },
      createdAt: 1,
      retryCount: 2,
      byteSize: 120,
    };
    expect(validateQueuedMutation(mutation).retryCount).toBe(2);
    expect(() => validateQueuedMutation({ ...mutation, kind: 'badge' })).toThrow();
  });

  it('rejects a sync chunk whose rank leaves the 0–2 domain', () => {
    const chunk = {
      index: 0,
      deltaId: 'd1',
      ops: [],
      startCursor: 0,
      endCursor: 0,
      byteSize: 0,
      priorityRank: 3,
      oversized: false,
    };
    expect(() => validateSyncChunk(chunk)).toThrow();
  });

  it('accepts a sync chunk with a high byte size (oversized flag)', () => {
    const chunk = {
      index: 0,
      deltaId: 'd1',
      ops: [{ op: 'add', path: '/a', value: 'x'.repeat(400) }],
      startCursor: 0,
      endCursor: 1,
      byteSize: 431,
      priorityRank: 0,
      oversized: true,
    };
    expect(validateSyncChunk(chunk).oversized).toBe(true);
  });

  it('rejects an ack with negative received bytes', () => {
    expect(() =>
      validateSyncAck({ sessionId: 's', deltaId: 'd', fromCursor: 0, toCursor: 1, receivedBytes: -1, serverVersion: 1 })
    ).toThrow();
  });

  it('rejects a nack with an unsupported reason', () => {
    expect(() =>
      validateSyncNack({ sessionId: 's', deltaId: 'd', failedCursor: 0, reason: 'bandwidth', retryable: true })
    ).toThrow();
  });

  it('accepts a retryable nack', () => {
    const nack = validateSyncNack({ sessionId: 's', deltaId: 'd', failedCursor: 0, reason: 'timeout', retryable: true });
    expect(nack.retryable).toBe(true);
  });

  it('rejects an edge node record with a zero total storage', () => {
    expect(() =>
      validateEdgeNodeRecord({
        id: 'edge-x',
        label: 'X',
        lanAddress: '10.0.0.1',
        status: 'online',
        firmwareVersion: '1.0.0',
        startedAt: 1,
        uptimeSeconds: 0,
        connectedClients: 0,
        storageUsedBytes: 0,
        storageTotalBytes: 0,
        lastOpportunisticSyncAt: null,
        lastSeenAt: 1,
      } as unknown as Parameters<typeof validateEdgeNodeRecord>[0])
    ).toThrow();
  });

  it('accepts a complete session record', () => {
    const record = {
      session: {
        id: 's1',
        deltaId: 'd1',
        totalOps: 1,
        totalBytes: 100,
        cursor: 1,
        ackedBytes: 100,
        status: 'complete',
        attempt: 0,
        nextRetryAt: null,
        chunkCount: 1,
        startedAt: 1,
        updatedAt: 2,
      },
      planSummary: { chunkCount: 1, totalBytes: 100, totalOps: 1 },
      throughputKbps: 5,
      wireDurationMs: 1600,
    };
    expect(validateSessionRecord(record).session.status).toBe('complete');
  });

  it('validates a full mesh state including empty collections', () => {
    const state = {
      nodes: [],
      pendingMutations: [],
      sessions: [],
      throughputSamples: [],
      syncedDocument: {},
      documentVersion: 0,
      lastOpportunisticSyncAt: null,
    };
    expect(validateEdgeMeshState(state).documentVersion).toBe(0);
  });

  it('rejects a connection profile with an empty endpoint', () => {
    expect(() =>
      validateConnectionProfile({
        id: 'lan-1',
        label: 'Mesh',
        endpoint: '',
        transport: 'lan',
        bandwidthMode: 'rich',
        effectiveKbps: 56,
        rttMs: 4,
        wanReachable: false,
        lastHandshakeAt: null,
      })
    ).toThrow();
  });
});
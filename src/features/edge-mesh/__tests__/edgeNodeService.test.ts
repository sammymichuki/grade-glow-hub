import { describe, it, expect } from 'vitest';
import {
  EDGE_MESH_STORAGE_KEY,
  EdgeNodeService,
  applyMutationsToDocument,
} from '../services/edgeNodeService';
import { MemoryStorage } from './memoryStorage';

const now = () => 1_760_000_000_000;

const emptyStateJson = JSON.stringify({
  nodes: [],
  pendingMutations: [],
  sessions: [],
  throughputSamples: [],
  syncedDocument: {},
  documentVersion: 0,
  lastOpportunisticSyncAt: null,
});

describe('EdgeNodeService hydration and persistence', () => {
  it('boots with the sample school mesh boxes and queued mutations', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    expect(service.getNodes().length).toBe(3);
    expect(service.snapshot().pendingCount).toBe(6);
  });

  it('persists queued mutations and rehydrates them for a new instance', () => {
    const storage = new MemoryStorage();
    const first = new EdgeNodeService({ storage, now });
    first.queueMutation('quiz-submission', { studentId: 's1', score: 4 });
    expect(first.getPendingMutations()).toHaveLength(7);

    const second = new EdgeNodeService({ storage, now });
    expect(second.getPendingMutations()).toHaveLength(7);
  });

  it('falls back to defaults and overwrites corrupt persisted state', () => {
    const storage = new MemoryStorage();
    storage.setItem(EDGE_MESH_STORAGE_KEY, '{corrupt json');
    const service = new EdgeNodeService({ storage, now });
    expect(service.snapshot().pendingCount).toBe(6);
    expect(storage.getItem(EDGE_MESH_STORAGE_KEY)).toContain('"pendingMutations"');
  });

  it('hydrates an empty-but-valid state without inventing sample data', () => {
    const storage = new MemoryStorage();
    storage.setItem(EDGE_MESH_STORAGE_KEY, emptyStateJson);
    const service = new EdgeNodeService({ storage, now });
    expect(service.getNodes()).toHaveLength(0);
    expect(service.snapshot().node).toBeNull();
  });
});

describe('EdgeNodeService mutation queue and sync runs', () => {
  it('queues a mutation with priority, size and monotonic id', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    const mutation = service.queueMutation('telemetry', { eventName: 'lesson_open' });
    expect(mutation.kind).toBe('telemetry');
    expect(mutation.payload).toEqual({ eventName: 'lesson_open' });
    expect(mutation.byteSize).toBeGreaterThan(0);
    expect(mutation.createdAt).toBe(now());
  });

  it('builds a delta whose transfer plan ships quiz ops ahead of telemetry', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    service.queueMutation('telemetry', { eventName: 'x' });
    service.queueMutation('quiz-submission', { quizId: 'q', score: 5 });
    const built = service.buildDelta();
    expect(built).not.toBeNull();
    const firstPath = built!.plan.chunks[0].ops[0].path;
    expect(firstPath).toContain('quizSubmissions');
    expect(built!.delta.origin).toBe('quiz-submission');
  });

  it('returns null when there is nothing to upload', () => {
    const storage = new MemoryStorage();
    storage.setItem(EDGE_MESH_STORAGE_KEY, emptyStateJson);
    const service = new EdgeNodeService({ storage, now });
    expect(service.buildDelta()).toBeNull();
    expect(service.runSyncSession()).toBeNull();
  });

  it('runs a full sync, clearing the queue and recording a session', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    const result = service.runSyncSession();
    expect(result).not.toBeNull();
    expect(result!.appliedMutations).toBe(6);
    expect(result!.acknowledgedChunks).toBe(result!.plan.chunks.length);
    expect(result!.session.status).toBe('complete');
    expect(service.snapshot().pendingCount).toBe(0);
    expect(service.snapshot().documentVersion).toBe(1);
    expect(service.snapshot().lastOpportunisticSyncAt).toBe(now());
    expect(service.getThroughputSamples()).toHaveLength(1);
    expect(result!.wireDurationMs).toBeGreaterThanOrEqual(100);
  });

  it('applies each mutation into its domain container', () => {
    const doc = applyMutationsToDocument({}, [
      {
        id: 'm1',
        kind: 'quiz-submission',
        payload: { score: 8 },
        createdAt: 1,
        retryCount: 0,
        byteSize: 10,
      },
      {
        id: 'm2',
        kind: 'progress',
        payload: { studentId: 'stu1', courseId: 'crs1', pct: 30 },
        createdAt: 2,
        retryCount: 0,
        byteSize: 10,
      },
    ]);
    expect(doc.quizSubmissions).toHaveProperty('m1');
    expect(doc.quizSubmissions.m1).toEqual({ score: 8 });
    expect(doc.progress).toHaveProperty('stu1_crs1');
  });
});

describe('EdgeNodeService node records', () => {
  it('discovers deterministic node identities from a LAN address', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    const first = service.discoverNode('192.168.4.1');
    const second = service.discoverNode('192.168.4.1');
    expect(second.id).toBe(first.id);
    expect(first.id).toMatch(/^edge-[0-9a-f]+$/);
    expect(first.status).toBe('online');
    expect(second.uptimeSeconds).toBeGreaterThanOrEqual(first.uptimeSeconds);
  });

  it('updates a node status and last-seen timestamp', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    const updated = service.setNodeStatus('edge-kibera-north', 'syncing');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('syncing');
    expect(updated!.lastSeenAt).toBe(now());
    expect(service.setNodeStatus('missing-node', 'online')).toBeNull();
  });

  it('validates node records and rejects malformed upserts', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    expect(() =>
      service.upsertNode({
        id: 'edge-bad',
        label: 'Bad Box',
        lanAddress: '10.0.0.2',
        status: 'online',
        firmwareVersion: '1.0.0',
        startedAt: now(),
        uptimeSeconds: 10,
        connectedClients: -1,
        storageUsedBytes: 0,
        storageTotalBytes: 1024,
        lastOpportunisticSyncAt: null,
        lastSeenAt: now(),
      } as unknown as Parameters<typeof service.upsertNode>[0])
    ).toThrow();
  });

  it('copies records so external callers cannot mutate service state', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    const nodes = service.getNodes();
    nodes[0].lanAddress = 'hijacked';
    expect(service.getNode('edge-kibera-north')!.lanAddress).toBe('192.168.4.1');
  });

  it('resets all state back to defaults', () => {
    const service = new EdgeNodeService({ storage: new MemoryStorage(), now });
    service.queueMutation('progress', { studentId: 's', courseId: 'c' });
    service.reset();
    expect(service.snapshot().pendingCount).toBe(6);
    expect(service.getSessions()).toHaveLength(0);
  });
});
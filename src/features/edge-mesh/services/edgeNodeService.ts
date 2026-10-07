import {
  EdgeMeshState,
  EdgeMeshStateSchema,
  EdgeNodeRecord,
  MutationKind,
  MUTATION_PRIORITY_RANK,
  QueuedMutation,
  SessionRecord,
  SyncDelta,
  SyncSession,
  TransferPlan,
  validateEdgeNodeRecord,
  validateQueuedMutation,
} from '../types/edgeMesh';
import { applyAck, createSession, diffJson, planDeltaTransfer } from './edgeSyncProtocol';
import { SAMPLE_EDGE_NODES, SAMPLE_PENDING_MUTATIONS } from '../data/sampleEdgeData';

export const EDGE_MESH_STORAGE_KEY = 'gg_edge_mesh_state_v1';

/** Simulated opportunistic uplink: 56 kbps class-2G shaped pipe used for wire-time math. */
export const SYNC_LINK_BYTES_PER_SECOND = 7000;

const NODE_BOOT_EPOCH = Date.UTC(2025, 0, 1);
const GB = 1024 * 1024 * 1024;

export interface EdgeNodeServiceOptions {
  storage?: Storage | null;
  now?: () => number;
}

export interface RunSyncResult {
  session: SyncSession;
  delta: SyncDelta;
  plan: TransferPlan;
  appliedMutations: number;
  acknowledgedChunks: number;
  wireDurationMs: number;
  throughputKbps: number;
}

export interface EdgeMeshSnapshot {
  node: EdgeNodeRecord | null;
  pendingCount: number;
  lastSession: SessionRecord | null;
  throughputSamples: number[];
  lastOpportunisticSyncAt: number | null;
  documentVersion: number;
}

const hashString = (input: string): number => {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const serializeBytes = (value: unknown): number => {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return 0;
  }
};

export const applyMutationsToDocument = (
  base: Record<string, unknown>,
  mutations: QueuedMutation[]
): Record<string, unknown> => {
  const doc: Record<string, unknown> = {};
  for (const key of Object.keys(base)) doc[key] = base[key];

  const ordered = [...mutations].sort((a, b) => {
    const rankDelta = MUTATION_PRIORITY_RANK[a.kind] - MUTATION_PRIORITY_RANK[b.kind];
    if (rankDelta !== 0) return rankDelta;
    return a.createdAt - b.createdAt;
  });

  for (const mutation of ordered) {
    const payload = mutation.payload;
    if (mutation.kind === 'progress') {
      const container = isPlainObject(doc.progress) ? { ...doc.progress } : {};
      const student = typeof payload.studentId === 'string' ? payload.studentId : 'unknown';
      const course = typeof payload.courseId === 'string' ? payload.courseId : 'unknown';
      container[`${student}_${course}`] = payload;
      doc.progress = container;
      continue;
    }
    const domainKey = mutation.kind === 'quiz-submission' ? 'quizSubmissions' : 'telemetry';
    const container = isPlainObject(doc[domainKey]) ? { ...(doc[domainKey] as Record<string, unknown>) } : {};
    container[mutation.id] = payload;
    doc[domainKey] = container;
  }

  return doc;
};

const defaultState = (): EdgeMeshState => ({
  nodes: SAMPLE_EDGE_NODES.map((node) => ({ ...node })),
  pendingMutations: SAMPLE_PENDING_MUTATIONS.map((mutation) => ({ ...mutation })),
  sessions: [],
  throughputSamples: [],
  syncedDocument: {},
  documentVersion: 0,
  lastOpportunisticSyncAt: null,
});

export class EdgeNodeService {
  private readonly storage: Storage | null;
  private readonly nowFn: () => number;
  private memoryState: EdgeMeshState;
  private mutationSeq = 0;

  constructor(options: EdgeNodeServiceOptions = {}) {
    if ('storage' in options) {
      this.storage = options.storage ?? null;
    } else {
      this.storage = typeof localStorage !== 'undefined' ? localStorage : null;
    }
    this.nowFn = options.now ?? (() => Date.now());
    this.memoryState = defaultState();
    this.hydrate();
  }

  private hydrate(): void {
    if (!this.storage) return;
    const raw = this.storage.getItem(EDGE_MESH_STORAGE_KEY);
    if (!raw) return;
    try {
      this.memoryState = EdgeMeshStateSchema.parse(JSON.parse(raw));
    } catch {
      this.memoryState = defaultState();
      this.persist();
    }
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(EDGE_MESH_STORAGE_KEY, JSON.stringify(this.memoryState));
    } catch {
      // Quota or serialization failures degrade to in-memory state only.
    }
  }

  private commit(mutate: (state: EdgeMeshState) => EdgeMeshState): EdgeMeshState {
    this.memoryState = mutate(this.memoryState);
    this.persist();
    return this.memoryState;
  }

  public now(): number {
    return this.nowFn();
  }

  public loadState(): EdgeMeshState {
    return this.memoryState;
  }

  public reset(): void {
    this.memoryState = defaultState();
    this.mutationSeq = 0;
    this.persist();
  }

  public getNodes(): EdgeNodeRecord[] {
    return this.memoryState.nodes.map((node) => ({ ...node }));
  }

  public getNode(id: string): EdgeNodeRecord | null {
    const found = this.memoryState.nodes.find((node) => node.id === id);
    return found ? { ...found } : null;
  }

  public upsertNode(node: EdgeNodeRecord): EdgeNodeRecord {
    const validated = validateEdgeNodeRecord(node);
    this.commit((state) => {
      const index = state.nodes.findIndex((existing) => existing.id === validated.id);
      const nodes = [...state.nodes];
      if (index >= 0) nodes[index] = validated;
      else nodes.push(validated);
      return { ...state, nodes };
    });
    return { ...validated };
  }

  public setNodeStatus(id: string, status: EdgeNodeRecord['status']): EdgeNodeRecord | null {
    const index = this.memoryState.nodes.findIndex((node) => node.id === id);
    if (index < 0) return null;
    const updated: EdgeNodeRecord = {
      ...this.memoryState.nodes[index],
      status,
      lastSeenAt: this.nowFn(),
    };
    this.commit((state) => ({
      ...state,
      nodes: state.nodes.map((node, nodeIndex) => (nodeIndex === index ? updated : node)),
    }));
    return { ...updated };
  }

  /** Deterministic LAN probe: node identity, boot time and storage load derive purely from the address. */
  public discoverNode(lanAddress: string): EdgeNodeRecord {
    const hash = hashString(lanAddress);
    const now = this.nowFn();
    const startedAt = NODE_BOOT_EPOCH + (hash % (7 * 24 * 60 * 60 * 1000));
    const storageTotalBytes = hash % 2 === 0 ? 32 * GB : 64 * GB;
    const candidate: EdgeNodeRecord = {
      id: `edge-${hash.toString(16)}`,
      label: `School Mesh Box @ ${lanAddress}`,
      lanAddress,
      status: 'online',
      firmwareVersion: '1.4.2',
      startedAt,
      uptimeSeconds: Math.max(0, Math.floor((now - startedAt) / 1000)),
      connectedClients: hash % 40,
      storageUsedBytes: Math.round(storageTotalBytes * (0.2 + (hash % 500) / 1000)),
      storageTotalBytes,
      lastOpportunisticSyncAt: null,
      lastSeenAt: now,
    };
    return this.upsertNode(candidate);
  }

  public getPendingMutations(): QueuedMutation[] {
    return this.memoryState.pendingMutations.map((mutation) => ({ ...mutation }));
  }

  public queueMutation(kind: MutationKind, payload: Record<string, unknown>): QueuedMutation {
    const now = this.nowFn();
    this.mutationSeq += 1;
    const mutation = validateQueuedMutation({
      id: `mut_${kind}_${now}_${this.mutationSeq}`,
      kind,
      payload,
      createdAt: now,
      retryCount: 0,
      byteSize: serializeBytes(payload),
    });
    this.commit((state) => ({
      ...state,
      pendingMutations: [...state.pendingMutations, mutation],
    }));
    return { ...mutation };
  }

  public getSessions(): SessionRecord[] {
    return this.memoryState.sessions.map((record) => ({
      ...record,
      session: { ...record.session },
      planSummary: { ...record.planSummary },
    }));
  }

  public getThroughputSamples(): number[] {
    return [...this.memoryState.throughputSamples];
  }

  public snapshot(): EdgeMeshSnapshot {
    const sessions = this.memoryState.sessions;
    return {
      node: this.memoryState.nodes[0] ? { ...this.memoryState.nodes[0] } : null,
      pendingCount: this.memoryState.pendingMutations.length,
      lastSession: sessions.length > 0 ? sessions[sessions.length - 1] : null,
      throughputSamples: [...this.memoryState.throughputSamples],
      lastOpportunisticSyncAt: this.memoryState.lastOpportunisticSyncAt,
      documentVersion: this.memoryState.documentVersion,
    };
  }

  public buildDelta(): { delta: SyncDelta; plan: TransferPlan } | null {
    const state = this.memoryState;
    if (state.pendingMutations.length === 0) return null;
    const now = this.nowFn();
    const target = applyMutationsToDocument(state.syncedDocument, state.pendingMutations);
    const ops = diffJson(state.syncedDocument, target);
    const origin = state.pendingMutations.reduce<MutationKind>(
      (best, mutation) =>
        MUTATION_PRIORITY_RANK[mutation.kind] < MUTATION_PRIORITY_RANK[best]
          ? mutation.kind
          : best,
      state.pendingMutations[0].kind
    );
    const delta: SyncDelta = {
      id: `delta_${state.documentVersion + 1}_${now}`,
      baseVersion: state.documentVersion,
      targetVersion: state.documentVersion + 1,
      origin,
      ops,
      createdAt: now,
    };
    return { delta, plan: planDeltaTransfer(delta, { byteBudget: 4096 }) };
  }

  public runSyncSession(): RunSyncResult | null {
    const built = this.buildDelta();
    if (!built) return null;

    const state = this.memoryState;
    const { delta, plan } = built;
    const startedAt = this.nowFn();
    let session = createSession(delta, plan, { now: startedAt, id: `sess_${delta.id}` });

    let acknowledgedChunks = 0;
    for (const chunk of plan.chunks) {
      session = applyAck(
        session,
        {
          sessionId: session.id,
          deltaId: delta.id,
          fromCursor: chunk.startCursor,
          toCursor: chunk.endCursor,
          receivedBytes: chunk.byteSize,
          serverVersion: delta.targetVersion,
        },
        this.nowFn()
      );
      acknowledgedChunks += 1;
    }

    const wireDurationMs = Math.max(
      100,
      Math.ceil((plan.totalBytes / SYNC_LINK_BYTES_PER_SECOND) * 1000)
    );
    const throughputKbps = Math.max(1, Math.round((plan.totalBytes * 8) / (wireDurationMs / 1000)));
    const target = applyMutationsToDocument(state.syncedDocument, state.pendingMutations);
    const now = this.nowFn();

    const record: SessionRecord = {
      session,
      planSummary: {
        chunkCount: plan.chunks.length,
        totalBytes: plan.totalBytes,
        totalOps: plan.totalOps,
      },
      throughputKbps,
      wireDurationMs,
    };

    this.commit((current) => ({
      ...current,
      nodes: current.nodes.map((node, index) =>
        index === 0 ? { ...node, lastOpportunisticSyncAt: now, lastSeenAt: now } : node
      ),
      pendingMutations: [],
      sessions: [...current.sessions, record].slice(-10),
      throughputSamples: [...current.throughputSamples, throughputKbps].slice(-12),
      syncedDocument: target,
      documentVersion: current.documentVersion + 1,
      lastOpportunisticSyncAt: now,
    }));

    return {
      session,
      delta,
      plan,
      appliedMutations: state.pendingMutations.length,
      acknowledgedChunks,
      wireDurationMs,
      throughputKbps,
    };
  }
}

export const edgeNodeService = new EdgeNodeService();

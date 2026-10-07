import { z } from 'zod';

export type BandwidthMode = 'rich' | 'data-saver';

export type EdgeNodeStatus = 'online' | 'edge-only' | 'offline' | 'syncing';

export type MutationKind = 'quiz-submission' | 'progress' | 'telemetry';

export type MutationPriorityRank = 0 | 1 | 2;

export const MUTATION_PRIORITY_RANK: Record<MutationKind, MutationPriorityRank> = {
  'quiz-submission': 0,
  progress: 1,
  telemetry: 2,
};

export interface JsonPatchAdd {
  op: 'add';
  path: string;
  value: unknown;
}

export interface JsonPatchRemove {
  op: 'remove';
  path: string;
}

export interface JsonPatchReplace {
  op: 'replace';
  path: string;
  value: unknown;
}

export type JsonPatchOp = JsonPatchAdd | JsonPatchRemove | JsonPatchReplace;

export interface SyncDelta {
  id: string;
  baseVersion: number;
  targetVersion: number;
  origin: MutationKind;
  ops: JsonPatchOp[];
  createdAt: number;
}

export interface SyncChunk {
  index: number;
  deltaId: string;
  ops: JsonPatchOp[];
  startCursor: number;
  endCursor: number;
  byteSize: number;
  priorityRank: MutationPriorityRank;
  oversized: boolean;
}

export interface TransferPlan {
  deltaId: string;
  chunks: SyncChunk[];
  totalOps: number;
  totalBytes: number;
  rawBytes: number;
  byteBudget: number;
}

export interface SyncAck {
  sessionId: string;
  deltaId: string;
  fromCursor: number;
  toCursor: number;
  receivedBytes: number;
  serverVersion: number;
}

export interface SyncNack {
  sessionId: string;
  deltaId: string;
  failedCursor: number;
  reason: 'validation' | 'conflict' | 'timeout';
  retryable: boolean;
  message?: string;
}

export type SyncSessionStatus = 'transferring' | 'awaiting-retry' | 'rejected' | 'complete';

export interface SyncSession {
  id: string;
  deltaId: string;
  totalOps: number;
  totalBytes: number;
  cursor: number;
  ackedBytes: number;
  status: SyncSessionStatus;
  attempt: number;
  nextRetryAt: number | null;
  chunkCount: number;
  startedAt: number;
  updatedAt: number;
}

export interface ConnectionProfile {
  id: string;
  label: string;
  endpoint: string;
  transport: 'lan' | 'wan';
  bandwidthMode: BandwidthMode;
  effectiveKbps: number;
  rttMs: number;
  wanReachable: boolean;
  lastHandshakeAt: number | null;
}

export interface QueuedMutation {
  id: string;
  kind: MutationKind;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  byteSize: number;
}

export interface EdgeNodeRecord {
  id: string;
  label: string;
  lanAddress: string;
  status: EdgeNodeStatus;
  firmwareVersion: string;
  startedAt: number;
  uptimeSeconds: number;
  connectedClients: number;
  storageUsedBytes: number;
  storageTotalBytes: number;
  lastOpportunisticSyncAt: number | null;
  lastSeenAt: number;
}

export interface SessionRecord {
  session: SyncSession;
  planSummary: {
    chunkCount: number;
    totalBytes: number;
    totalOps: number;
  };
  throughputKbps: number;
  wireDurationMs: number;
}

export interface EdgeMeshState {
  nodes: EdgeNodeRecord[];
  pendingMutations: QueuedMutation[];
  sessions: SessionRecord[];
  throughputSamples: number[];
  syncedDocument: Record<string, unknown>;
  documentVersion: number;
  lastOpportunisticSyncAt: number | null;
}

export const JSON_POINTER_PATH_REGEX = /^(\/(?:[^~/]|~[01])*)*$/;

export const JsonPatchOpSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('add'),
    path: z.string().regex(JSON_POINTER_PATH_REGEX, 'Invalid JSON pointer path'),
    value: z.unknown(),
  }),
  z.object({
    op: z.literal('remove'),
    path: z.string().regex(JSON_POINTER_PATH_REGEX, 'Invalid JSON pointer path'),
  }),
  z.object({
    op: z.literal('replace'),
    path: z.string().regex(JSON_POINTER_PATH_REGEX, 'Invalid JSON pointer path'),
    value: z.unknown(),
  }),
]);

export const MutationKindSchema = z.enum(['quiz-submission', 'progress', 'telemetry']);

export const SyncDeltaSchema = z.object({
  id: z.string().min(1),
  baseVersion: z.number().int().nonnegative(),
  targetVersion: z.number().int().positive(),
  origin: MutationKindSchema,
  ops: z.array(JsonPatchOpSchema),
  createdAt: z.number().positive(),
});

export const SyncChunkSchema = z.object({
  index: z.number().int().nonnegative(),
  deltaId: z.string().min(1),
  ops: z.array(JsonPatchOpSchema),
  startCursor: z.number().int().nonnegative(),
  endCursor: z.number().int().nonnegative(),
  byteSize: z.number().int().nonnegative(),
  priorityRank: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  oversized: z.boolean(),
});

export const SyncAckSchema = z.object({
  sessionId: z.string().min(1),
  deltaId: z.string().min(1),
  fromCursor: z.number().int().nonnegative(),
  toCursor: z.number().int().nonnegative(),
  receivedBytes: z.number().int().nonnegative(),
  serverVersion: z.number().int().nonnegative(),
});

export const SyncNackSchema = z.object({
  sessionId: z.string().min(1),
  deltaId: z.string().min(1),
  failedCursor: z.number().int().nonnegative(),
  reason: z.enum(['validation', 'conflict', 'timeout']),
  retryable: z.boolean(),
  message: z.string().optional(),
});

export const QueuedMutationSchema = z.object({
  id: z.string().min(1),
  kind: MutationKindSchema,
  payload: z.record(z.unknown()),
  createdAt: z.number().positive(),
  retryCount: z.number().int().nonnegative(),
  byteSize: z.number().int().nonnegative(),
});

export const SessionRecordSchema = z.object({
  session: z.object({
    id: z.string().min(1),
    deltaId: z.string().min(1),
    totalOps: z.number().int().nonnegative(),
    totalBytes: z.number().int().nonnegative(),
    cursor: z.number().int().nonnegative(),
    ackedBytes: z.number().int().nonnegative(),
    status: z.enum(['transferring', 'awaiting-retry', 'rejected', 'complete']),
    attempt: z.number().int().nonnegative(),
    nextRetryAt: z.number().int().nonnegative().nullable(),
    chunkCount: z.number().int().nonnegative(),
    startedAt: z.number().nonnegative(),
    updatedAt: z.number().nonnegative(),
  }),
  planSummary: z.object({
    chunkCount: z.number().int().nonnegative(),
    totalBytes: z.number().int().nonnegative(),
    totalOps: z.number().int().nonnegative(),
  }),
  throughputKbps: z.number().nonnegative(),
  wireDurationMs: z.number().positive(),
});

export const ConnectionProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  endpoint: z.string().min(1),
  transport: z.enum(['lan', 'wan']),
  bandwidthMode: z.enum(['rich', 'data-saver']),
  effectiveKbps: z.number().positive(),
  rttMs: z.number().nonnegative(),
  wanReachable: z.boolean(),
  lastHandshakeAt: z.number().positive().nullable(),
});

export const EdgeNodeRecordSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  lanAddress: z.string().min(1),
  status: z.enum(['online', 'edge-only', 'offline', 'syncing']),
  firmwareVersion: z.string().min(1),
  startedAt: z.number(),
  uptimeSeconds: z.number().nonnegative(),
  connectedClients: z.number().int().nonnegative(),
  storageUsedBytes: z.number().nonnegative(),
  storageTotalBytes: z.number().positive(),
  lastOpportunisticSyncAt: z.number().positive().nullable(),
  lastSeenAt: z.number().positive(),
});

export type ValidatedJsonPatchOp = z.infer<typeof JsonPatchOpSchema>;
export type ValidatedSyncDelta = z.infer<typeof SyncDeltaSchema>;
export type ValidatedSyncChunk = z.infer<typeof SyncChunkSchema>;
export type ValidatedSyncAck = z.infer<typeof SyncAckSchema>;
export type ValidatedSyncNack = z.infer<typeof SyncNackSchema>;
export type ValidatedQueuedMutation = z.infer<typeof QueuedMutationSchema>;
export type ValidatedConnectionProfile = z.infer<typeof ConnectionProfileSchema>;
export type ValidatedEdgeNodeRecord = z.infer<typeof EdgeNodeRecordSchema>;

export const validateJsonPatchOp = (data: unknown): ValidatedJsonPatchOp => JsonPatchOpSchema.parse(data);
export const validateSyncDelta = (data: unknown): ValidatedSyncDelta => SyncDeltaSchema.parse(data);
export const validateSyncChunk = (data: unknown): ValidatedSyncChunk => SyncChunkSchema.parse(data);
export const validateSyncAck = (data: unknown): ValidatedSyncAck => SyncAckSchema.parse(data);
export const validateSyncNack = (data: unknown): ValidatedSyncNack => SyncNackSchema.parse(data);
export const validateQueuedMutation = (data: unknown): ValidatedQueuedMutation => QueuedMutationSchema.parse(data);
export const validateConnectionProfile = (data: unknown): ValidatedConnectionProfile =>
  ConnectionProfileSchema.parse(data);
export const validateSessionRecord = (data: unknown): z.infer<typeof SessionRecordSchema> =>
  SessionRecordSchema.parse(data);

export const EdgeMeshStateSchema = z.object({
  nodes: z.array(EdgeNodeRecordSchema),
  pendingMutations: z.array(QueuedMutationSchema),
  sessions: z.array(SessionRecordSchema),
  throughputSamples: z.array(z.number().nonnegative()),
  syncedDocument: z.record(z.unknown()),
  documentVersion: z.number().int().nonnegative(),
  lastOpportunisticSyncAt: z.number().positive().nullable(),
});

export type ValidatedEdgeMeshState = z.infer<typeof EdgeMeshStateSchema>;
export const validateEdgeMeshState = (data: unknown): ValidatedEdgeMeshState => EdgeMeshStateSchema.parse(data);
export const validateEdgeNodeRecord = (data: unknown): ValidatedEdgeNodeRecord => EdgeNodeRecordSchema.parse(data);

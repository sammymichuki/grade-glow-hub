import { EdgeNodeRecord, QueuedMutation } from '../types/edgeMesh';

const GB = 1024 * 1024 * 1024;

export const SAMPLE_EDGE_NODES: EdgeNodeRecord[] = [
  {
    id: 'edge-kibera-north',
    label: 'Kibera North Primary — Mesh Box',
    lanAddress: '192.168.4.1',
    status: 'online',
    firmwareVersion: '1.4.2',
    startedAt: 1756608000000,
    uptimeSeconds: 412800,
    connectedClients: 27,
    storageUsedBytes: Math.round(9.4 * GB),
    storageTotalBytes: 32 * GB,
    lastOpportunisticSyncAt: 1759440000000,
    lastSeenAt: 1759447200000,
  },
  {
    id: 'edge-mtwara-south',
    label: 'Mtwarra South Academy — Mesh Box',
    lanAddress: '192.168.7.1',
    status: 'edge-only',
    firmwareVersion: '1.4.1',
    startedAt: 1756694400000,
    uptimeSeconds: 326400,
    connectedClients: 14,
    storageUsedBytes: Math.round(5.1 * GB),
    storageTotalBytes: 32 * GB,
    lastOpportunisticSyncAt: 1759267200000,
    lastSeenAt: 1759443600000,
  },
  {
    id: 'edge-cebu-east',
    label: 'Cebu East District — Mesh Box',
    lanAddress: '10.0.0.1',
    status: 'offline',
    firmwareVersion: '1.3.9',
    startedAt: 1756521600000,
    uptimeSeconds: 198000,
    connectedClients: 0,
    storageUsedBytes: Math.round(21.7 * GB),
    storageTotalBytes: 64 * GB,
    lastOpportunisticSyncAt: 1759094400000,
    lastSeenAt: 1759357200000,
  },
];

export const SAMPLE_PENDING_MUTATIONS: QueuedMutation[] = [
  {
    id: 'mut_quiz_001',
    kind: 'quiz-submission',
    payload: {
      quizId: 'quiz-fractions-grade-7',
      studentId: 'stu-2041',
      answers: { q1: 'B', q2: 'D', q3: 'A', q4: 'C' },
      score: 8,
      maxScore: 10,
      submittedAt: 1759447000000,
    },
    createdAt: 1759447001000,
    retryCount: 0,
    byteSize: 214,
  },
  {
    id: 'mut_quiz_002',
    kind: 'quiz-submission',
    payload: {
      quizId: 'quiz-photosynthesis-grade-6',
      studentId: 'stu-1987',
      answers: { q1: 'C', q2: 'A' },
      score: 4,
      maxScore: 5,
      submittedAt: 1759447050000,
    },
    createdAt: 1759447051000,
    retryCount: 1,
    byteSize: 176,
  },
  {
    id: 'mut_progress_001',
    kind: 'progress',
    payload: {
      studentId: 'stu-2041',
      courseId: 'math-grade-7',
      completedLessonIds: ['lesson-lcm', 'lesson-hcf'],
      currentLessonId: 'lesson-fractions',
      progressPercentage: 42,
      updatedAt: 1759447100000,
    },
    createdAt: 1759447101000,
    retryCount: 0,
    byteSize: 148,
  },
  {
    id: 'mut_progress_002',
    kind: 'progress',
    payload: {
      studentId: 'stu-1987',
      courseId: 'science-grade-6',
      completedLessonIds: ['lesson-cell-structure'],
      currentLessonId: 'lesson-photosynthesis',
      progressPercentage: 18,
      updatedAt: 1759447120000,
    },
    createdAt: 1759447121000,
    retryCount: 0,
    byteSize: 139,
  },
  {
    id: 'mut_telemetry_001',
    kind: 'telemetry',
    payload: {
      eventName: 'lesson_view',
      category: 'navigation',
      studentId: 'stu-3110',
      lessonId: 'lesson-integers',
      dwellMs: 54200,
      timestamp: 1759447140000,
    },
    createdAt: 1759447141000,
    retryCount: 2,
    byteSize: 132,
  },
  {
    id: 'mut_telemetry_002',
    kind: 'telemetry',
    payload: {
      eventName: 'video_buffer_stall',
      category: 'performance',
      studentId: 'stu-3110',
      stallMs: 3100,
      effectiveType: 'slow-2g',
      timestamp: 1759447160000,
    },
    createdAt: 1759447161000,
    retryCount: 0,
    byteSize: 141,
  },
];

export const EDGE_DEPLOYMENT_ENDPOINTS: Array<{
  method: 'GET' | 'POST';
  path: string;
  description: string;
  auth: boolean;
}> = [
  { method: 'GET', path: '/api/health', description: 'Liveness, uptime, storage & change cursor', auth: false },
  { method: 'GET', path: '/api/sync/changes?since=<cursor>', description: 'Pull change feed after a cursor', auth: true },
  { method: 'POST', path: '/api/sync/changes', description: 'Push JSON Patch deltas for local apply', auth: true },
  { method: 'GET', path: '/api/catalog', description: 'Offline lesson & quiz catalog manifest', auth: true },
];

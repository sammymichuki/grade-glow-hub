import { z } from 'zod';
import { NotificationChannel, PortalLocale } from '@/features/parent-portal/types/parentPortal';

export type GatewayProvider = 'twilio' | 'africas_talking' | 'whatsapp_cloud';

export type DeliveryStatus = 'queued' | 'delivered' | 'failed' | 'rejected';

export type ModerationCategory = 'clean' | 'profanity' | 'pii_leak' | 'threat';

export interface GatewayRequest {
  provider: GatewayProvider;
  method: 'POST';
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface AfricasTalkingCredentials {
  apiKey: string;
  username: string;
  senderId?: string;
}

export interface WhatsAppCloudCredentials {
  phoneNumberId: string;
  accessToken: string;
}

export interface GatewayCredentialsMap {
  twilio?: TwilioCredentials;
  africas_talking?: AfricasTalkingCredentials;
  whatsapp_cloud?: WhatsAppCloudCredentials;
}

export interface GatewaySendResult {
  ok: boolean;
  status: number;
  error?: string;
}

export type GatewaySender = (request: GatewayRequest) => Promise<GatewaySendResult>;

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
}

export interface RetryOutcome {
  success: boolean;
  attempts: number;
  result: GatewaySendResult;
  delays: number[];
}

export interface DeliveryLogEntry {
  id: string;
  digestId: string;
  channel: NotificationChannel;
  provider: GatewayProvider | 'none';
  recipient: string;
  message: string;
  locale: PortalLocale;
  status: DeliveryStatus;
  attempts: number;
  lastStatusCode: number | null;
  failureReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DispatchDigestOptions {
  channels: NotificationChannel[];
  locale: PortalLocale;
  phone: string;
  email?: string;
  deviceToken?: string;
  smsProvider?: 'twilio' | 'africas_talking';
  credentials?: GatewayCredentialsMap;
  sender?: GatewaySender;
  sleep?: (ms: number) => Promise<void>;
  retryPolicy?: RetryPolicy;
  persist?: boolean;
}

export interface DispatchReport {
  digestId: string;
  message: string;
  locale: PortalLocale;
  entries: DeliveryLogEntry[];
  deliveredCount: number;
  failedCount: number;
  rejectedCount: number;
}

export type ChatParticipantRole = 'parent' | 'instructor';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderRole: ChatParticipantRole;
  senderName: string;
  content: string;
  timestamp: number;
  safetyFlagged: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface AppointmentRequest {
  id: string;
  threadId: string;
  date: string;
  time: string;
  topic: string;
  status: AppointmentStatus;
  createdAt: number;
}

export interface ParentTeacherThread {
  id: string;
  parentId: string;
  childId: string;
  childName: string;
  instructorName: string;
  subject: string;
  messages: ChatMessage[];
  appointments: AppointmentRequest[];
  updatedAt: number;
}

export interface SendMessageResult {
  sent: boolean;
  message?: ChatMessage;
  category?: ModerationCategory;
  advisory?: string;
}

export type AppointmentErrorCode = 'invalid_date' | 'date_past' | 'invalid_time' | 'topic_required';

export interface AppointmentResult {
  success: boolean;
  appointment?: AppointmentRequest;
  error?: AppointmentErrorCode;
  message: string;
}

export interface ModerationResult {
  isAllowed: boolean;
  category: ModerationCategory;
  sanitized: string;
  advisory?: string;
}

export const GatewayProviderSchema = z.enum(['twilio', 'africas_talking', 'whatsapp_cloud']);

export const DeliveryLogEntrySchema = z.object({
  id: z.string().min(1),
  digestId: z.string().min(1),
  channel: z.enum(['sms', 'whatsapp', 'push', 'email']),
  provider: z.union([GatewayProviderSchema, z.literal('none')]),
  recipient: z.string().min(1),
  message: z.string().min(1),
  locale: z.enum(['en', 'sw']),
  status: z.enum(['queued', 'delivered', 'failed', 'rejected']),
  attempts: z.number().int().nonnegative(),
  lastStatusCode: z.number().nullable(),
  failureReason: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const DeliveryLogSchema = z.array(DeliveryLogEntrySchema);

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  senderRole: z.enum(['parent', 'instructor']),
  senderName: z.string().min(1),
  content: z.string().min(1),
  timestamp: z.number(),
  safetyFlagged: z.boolean(),
});

export const AppointmentRequestSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  topic: z.string().min(1),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  createdAt: z.number(),
});

export const ParentTeacherThreadSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().min(1),
  childId: z.string().min(1),
  childName: z.string().min(1),
  instructorName: z.string().min(1),
  subject: z.string().min(1),
  messages: z.array(ChatMessageSchema),
  appointments: z.array(AppointmentRequestSchema),
  updatedAt: z.number(),
});

export const ThreadStoreSchema = z.object({
  threads: z.array(ParentTeacherThreadSchema),
});

export interface ThreadStore {
  threads: ParentTeacherThread[];
}

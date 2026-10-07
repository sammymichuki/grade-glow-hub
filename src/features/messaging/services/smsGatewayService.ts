import { ParentService, isValidE164, isValidEmail } from '@/features/parent-portal/services/parentService';
import { WeeklyDigest } from '@/features/parent-portal/types/parentPortal';
import {
  AfricasTalkingCredentials,
  DeliveryLogEntry,
  DeliveryLogSchema,
  DispatchDigestOptions,
  DispatchReport,
  GatewayCredentialsMap,
  GatewayProvider,
  GatewayRequest,
  GatewaySender,
  GatewaySendResult,
  RetryPolicy,
  TwilioCredentials,
  WhatsAppCloudCredentials,
} from '../types/messaging';

const DELIVERY_LOG_KEY = 'gradeglow_delivery_log_v1';
const DELIVERY_LOG_LIMIT = 100;

export const DEFAULT_RETRY_POLICY: RetryPolicy = { maxAttempts: 3, baseDelayMs: 400 };

export const TWILIO_API_VERSION = '2010-04-01';
export const WHATSAPP_GRAPH_API_VERSION = 'v19.0';
export const AFRICAS_TALKING_MESSAGING_URL = 'https://api.africastalking.com/version1/messaging';

export function buildTwilioRequest(input: {
  to: string;
  body: string;
  credentials: TwilioCredentials;
}): GatewayRequest {
  const { accountSid, authToken, fromNumber } = input.credentials;
  const form = new URLSearchParams();
  form.set('To', input.to);
  form.set('From', fromNumber);
  form.set('Body', input.body);

  return {
    provider: 'twilio',
    method: 'POST',
    url: `https://api.twilio.com/${TWILIO_API_VERSION}/Accounts/${accountSid}/Messages.json`,
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  };
}

export function buildAfricasTalkingRequest(input: {
  to: string;
  message: string;
  credentials: AfricasTalkingCredentials;
}): GatewayRequest {
  const form = new URLSearchParams();
  form.set('username', input.credentials.username);
  form.set('to', input.to);
  form.set('message', input.message);
  if (input.credentials.senderId) form.set('from', input.credentials.senderId);

  return {
    provider: 'africas_talking',
    method: 'POST',
    url: AFRICAS_TALKING_MESSAGING_URL,
    headers: {
      apiKey: input.credentials.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: form.toString(),
  };
}

export function buildWhatsAppCloudRequest(input: {
  to: string;
  message: string;
  credentials: WhatsAppCloudCredentials;
}): GatewayRequest {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: input.to.replace(/^\+/, ''),
    type: 'text',
    text: { preview_url: false, body: input.message },
  };

  return {
    provider: 'whatsapp_cloud',
    method: 'POST',
    url: `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${input.credentials.phoneNumberId}/messages`,
    headers: {
      Authorization: `Bearer ${input.credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };
}

export function backoffDelayMs(attempt: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  return policy.baseDelayMs * 2 ** (attempt - 1);
}

export async function sendWithRetry(
  sender: GatewaySender,
  request: GatewayRequest,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  sleep: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms))
): Promise<{ success: boolean; attempts: number; result: GatewaySendResult; delays: number[] }> {
  const delays: number[] = [];
  let lastResult: GatewaySendResult = { ok: false, status: 0, error: 'Not attempted' };

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    lastResult = await sender(request);
    if (lastResult.ok) {
      return { success: true, attempts: attempt, result: lastResult, delays };
    }
    if (attempt < policy.maxAttempts) {
      const delay = backoffDelayMs(attempt, policy);
      delays.push(delay);
      await sleep(delay);
    }
  }

  return { success: false, attempts: policy.maxAttempts, result: lastResult, delays };
}

export const fetchGatewaySender: GatewaySender = async (request: GatewayRequest) => {
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : 'Network request failed' };
  }
};

const buildRequestForChannel = (
  channel: 'sms' | 'whatsapp',
  options: DispatchDigestOptions,
  message: string
): { request?: GatewayRequest; rejection?: string; provider: GatewayProvider | 'none' } => {
  if (!isValidE164(options.phone)) {
    return { rejection: 'invalid_recipient', provider: 'none' };
  }

  if (channel === 'sms') {
    const provider: GatewayProvider = options.smsProvider ?? 'twilio';
    const credentials = options.credentials;
    if (provider === 'twilio') {
      const twilio = credentials?.twilio;
      if (!twilio) return { rejection: 'missing_credentials', provider: 'none' };
      return { request: buildTwilioRequest({ to: options.phone, body: message, credentials: twilio }), provider };
    }
    const atl = credentials?.africas_talking;
    if (!atl) return { rejection: 'missing_credentials', provider: 'none' };
    return { request: buildAfricasTalkingRequest({ to: options.phone, message, credentials: atl }), provider };
  }

  const cloud = options.credentials?.whatsapp_cloud;
  if (!cloud) return { rejection: 'missing_credentials', provider: 'none' };
  return { request: buildWhatsAppCloudRequest({ to: options.phone, message, credentials: cloud }), provider: 'whatsapp_cloud' };
};

export class SmsGatewayService {
  public static getDeliveryLog(): DeliveryLogEntry[] {
    try {
      const raw = localStorage.getItem(DELIVERY_LOG_KEY);
      if (!raw) return [];
      const parsed = DeliveryLogSchema.safeParse(JSON.parse(raw));
      return parsed.success ? (parsed.data as DeliveryLogEntry[]) : [];
    } catch {
      return [];
    }
  }

  public static clearDeliveryLog(): void {
    try {
      localStorage.removeItem(DELIVERY_LOG_KEY);
    } catch {
      // Storage unavailable; nothing to clear.
    }
  }

  private static persistEntries(entries: DeliveryLogEntry[]): void {
    try {
      const merged = [...SmsGatewayService.getDeliveryLog(), ...entries].slice(-DELIVERY_LOG_LIMIT);
      localStorage.setItem(DELIVERY_LOG_KEY, JSON.stringify(merged));
    } catch {
      // Quota exceeded or private mode: log stays in-memory for this call only.
    }
  }

  /**
   * Renders the localized digest copy, validates every requested channel
   * (E.164 for sms/whatsapp, email format for email, device token for push),
   * builds the gateway payload for channels that have an adapter + credentials,
   * then sends with exponential backoff and appends everything to the
   * persisted delivery log.
   */
  public static async dispatchDigest(digest: WeeklyDigest, options: DispatchDigestOptions): Promise<DispatchReport> {
    const message = ParentService.renderDigestMessage(digest, options.locale);
    const now = Date.now();
    const sender = options.sender ?? fetchGatewaySender;
    const policy = options.retryPolicy ?? DEFAULT_RETRY_POLICY;
    const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
    const entries: DeliveryLogEntry[] = [];
    const pending: Array<{ index: number; request: GatewayRequest }> = [];

    const enqueue = (channel: DispatchReport['entries'][number]['channel'], recipient: string, provider: GatewayProvider | 'none', rejection?: string) => {
      const entry: DeliveryLogEntry = {
        id: `dlv-${now}-${entries.length}-${channel}`,
        digestId: digest.id,
        channel,
        provider,
        recipient,
        message,
        locale: options.locale,
        status: rejection ? 'rejected' : 'queued',
        attempts: 0,
        lastStatusCode: null,
        failureReason: rejection,
        createdAt: now,
        updatedAt: now,
      };
      entries.push(entry);
      return entry;
    };

    const channels = Array.from(new Set(options.channels));

    for (const channel of channels) {
      if (channel === 'sms' || channel === 'whatsapp') {
        const built = buildRequestForChannel(channel, options, message);
        const entry = enqueue(channel, options.phone, built.provider, built.rejection);
        if (built.request) pending.push({ index: entries.length - 1, request: built.request });
      } else if (channel === 'email') {
        const valid = Boolean(options.email) && isValidEmail(options.email ?? '');
        enqueue('email', options.email ?? '', 'none', valid ? 'no_adapter' : 'invalid_recipient');
      } else if (channel === 'push') {
        const valid = Boolean(options.deviceToken);
        enqueue('push', options.deviceToken ?? '', 'none', valid ? 'no_adapter' : 'invalid_recipient');
      }
    }

    for (const job of pending) {
      const entry = entries[job.index];
      const outcome = await sendWithRetry(sender, job.request, policy, sleep);
      entry.attempts = outcome.attempts;
      entry.lastStatusCode = outcome.result.status;
      entry.status = outcome.success ? 'delivered' : 'failed';
      entry.failureReason = outcome.success ? undefined : outcome.result.error ?? `HTTP ${outcome.result.status}`;
      entry.updatedAt = Date.now();
    }

    if (options.persist !== false) {
      SmsGatewayService.persistEntries(entries);
    }

    return {
      digestId: digest.id,
      message,
      locale: options.locale,
      entries,
      deliveredCount: entries.filter(entry => entry.status === 'delivered').length,
      failedCount: entries.filter(entry => entry.status === 'failed').length,
      rejectedCount: entries.filter(entry => entry.status === 'rejected').length,
    };
  }
}

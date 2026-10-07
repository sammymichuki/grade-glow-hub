import { describe, it, expect, beforeEach } from 'vitest';
import {
  AFRICAS_TALKING_MESSAGING_URL,
  DEFAULT_RETRY_POLICY,
  SmsGatewayService,
  WHATSAPP_GRAPH_API_VERSION,
  backoffDelayMs,
  buildAfricasTalkingRequest,
  buildTwilioRequest,
  buildWhatsAppCloudRequest,
  sendWithRetry,
} from '../services/smsGatewayService';
import { GatewayRequest, GatewaySendResult, GatewaySender } from '../types/messaging';
import { ParentService } from '@/features/parent-portal/services/parentService';
import { KEVIN_ID } from '@/features/parent-portal/data/sampleParentData';

const twilioCreds = { accountSid: 'AC123', authToken: 's3cret', fromNumber: '+254700000000' };

const sampleRequest: GatewayRequest = {
  provider: 'twilio',
  method: 'POST',
  url: 'https://example.test',
  headers: {},
  body: 'body',
};

const senderReturning = (results: GatewaySendResult[]): GatewaySender => {
  const queue = [...results];
  return async () => (queue.length > 1 ? (queue.shift() as GatewaySendResult) : queue[0]);
};

describe('gateway request builders', () => {
  it('builds a Twilio form-encoded request with Basic auth', () => {
    const request = buildTwilioRequest({ to: '+254712345678', body: 'Jambo', credentials: twilioCreds });

    expect(request.provider).toBe('twilio');
    expect(request.url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json');
    expect(request.headers.Authorization).toBe(`Basic ${btoa('AC123:s3cret')}`);
    const params = new URLSearchParams(request.body);
    expect(params.get('To')).toBe('+254712345678');
    expect(params.get('From')).toBe('+254700000000');
    expect(params.get('Body')).toBe('Jambo');
  });

  it("builds an Africa's Talking request with the apiKey header", () => {
    const request = buildAfricasTalkingRequest({
      to: '+254712345678',
      message: 'Habari',
      credentials: { apiKey: 'at-key', username: 'gradeglow', senderId: 'GLOW' },
    });

    expect(request.url).toBe(AFRICAS_TALKING_MESSAGING_URL);
    expect(request.headers.apiKey).toBe('at-key');
    const params = new URLSearchParams(request.body);
    expect(params.get('username')).toBe('gradeglow');
    expect(params.get('to')).toBe('+254712345678');
    expect(params.get('message')).toBe('Habari');
    expect(params.get('from')).toBe('GLOW');
  });

  it('builds a WhatsApp Cloud API request with Bearer auth and stripped plus', () => {
    const request = buildWhatsAppCloudRequest({
      to: '+254712345678',
      message: 'Hello parent',
      credentials: { phoneNumberId: '987', accessToken: 'wa-token' },
    });

    expect(request.url).toBe(`https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/987/messages`);
    expect(request.headers.Authorization).toBe('Bearer wa-token');
    const payload = JSON.parse(request.body);
    expect(payload.to).toBe('254712345678');
    expect(payload.messaging_product).toBe('whatsapp');
    expect(payload.text.body).toBe('Hello parent');
  });
});

describe('sendWithRetry', () => {
  it('uses exponential backoff delays of 400ms then 800ms', () => {
    expect(DEFAULT_RETRY_POLICY).toEqual({ maxAttempts: 3, baseDelayMs: 400 });
    expect(backoffDelayMs(1)).toBe(400);
    expect(backoffDelayMs(2)).toBe(800);
    expect(backoffDelayMs(3)).toBe(1600);
    expect(backoffDelayMs(1, { maxAttempts: 2, baseDelayMs: 100 })).toBe(100);
  });

  it('returns after the first successful attempt without sleeping', async () => {
    const sleep = viSleep();
    const outcome = await sendWithRetry(senderReturning([{ ok: true, status: 201 }]), sampleRequest, undefined, sleep.fn);

    expect(outcome.success).toBe(true);
    expect(outcome.attempts).toBe(1);
    expect(outcome.delays).toEqual([]);
    expect(sleep.calls).toEqual([]);
  });

  it('retries transient failures with recorded backoff delays', async () => {
    const sleep = viSleep();
    const sender = senderReturning([
      { ok: false, status: 500, error: 'HTTP 500' },
      { ok: false, status: 429, error: 'rate limited' },
      { ok: true, status: 201 },
    ]);

    const outcome = await sendWithRetry(sender, sampleRequest, undefined, sleep.fn);

    expect(outcome.success).toBe(true);
    expect(outcome.attempts).toBe(3);
    expect(outcome.delays).toEqual([400, 800]);
    expect(sleep.calls).toEqual([400, 800]);
  });

  it('gives up after maxAttempts and keeps the last failure result', async () => {
    const sleep = viSleep();
    const sender = senderReturning([{ ok: false, status: 503, error: 'service unavailable' }]);

    const outcome = await sendWithRetry(sender, sampleRequest, { maxAttempts: 2, baseDelayMs: 100 }, sleep.fn);

    expect(outcome.success).toBe(false);
    expect(outcome.attempts).toBe(2);
    expect(outcome.delays).toEqual([100]);
    expect(outcome.result).toMatchObject({ status: 503, error: 'service unavailable' });
  });
});

describe('SmsGatewayService.dispatchDigest', () => {
  beforeEach(() => {
    ParentService.resetToDefaults();
    SmsGatewayService.clearDeliveryLog();
  });

  const digest = () => ParentService.buildWeeklyDigest(KEVIN_ID);

  it('delivers over sms and whatsapp while honestly rejecting email and push', async () => {
    const report = await SmsGatewayService.dispatchDigest(digest(), {
      channels: ['sms', 'whatsapp', 'email', 'push'],
      locale: 'en',
      phone: '+254712345678',
      email: 'esther.kamau@example.co.ke',
      deviceToken: 'device-123',
      credentials: {
        twilio: twilioCreds,
        whatsapp_cloud: { phoneNumberId: '987', accessToken: 'wa-token' },
      },
      sender: senderReturning([{ ok: true, status: 201 }]),
      sleep: async () => undefined,
      persist: false,
    });

    expect(report.deliveredCount).toBe(2);
    expect(report.rejectedCount).toBe(2);
    expect(report.failedCount).toBe(0);
    expect(report.message).toContain('Hello Mrs. Kamau, Kevin completed 4 math modules');

    const sms = report.entries.find(entry => entry.channel === 'sms');
    expect(sms).toMatchObject({ provider: 'twilio', status: 'delivered', attempts: 1, lastStatusCode: 201 });

    const whatsapp = report.entries.find(entry => entry.channel === 'whatsapp');
    expect(whatsapp).toMatchObject({ provider: 'whatsapp_cloud', status: 'delivered', attempts: 1 });

    const email = report.entries.find(entry => entry.channel === 'email');
    expect(email).toMatchObject({ status: 'rejected', failureReason: 'no_adapter', provider: 'none' });

    const push = report.entries.find(entry => entry.channel === 'push');
    expect(push).toMatchObject({ status: 'rejected', failureReason: 'no_adapter' });
  });

  it('rejects an invalid recipient before touching the gateway', async () => {
    const report = await SmsGatewayService.dispatchDigest(digest(), {
      channels: ['sms'],
      locale: 'en',
      phone: '0712345678',
      credentials: { twilio: twilioCreds },
      sender: senderReturning([{ ok: true, status: 201 }]),
      sleep: async () => undefined,
      persist: false,
    });

    expect(report.entries[0]).toMatchObject({ status: 'rejected', failureReason: 'invalid_recipient', provider: 'none' });
    expect(report.deliveredCount).toBe(0);
  });

  it('rejects when credentials for the chosen provider are missing', async () => {
    const report = await SmsGatewayService.dispatchDigest(digest(), {
      channels: ['whatsapp'],
      locale: 'sw',
      phone: '+254712345678',
      sender: senderReturning([{ ok: true, status: 201 }]),
      sleep: async () => undefined,
      persist: false,
    });

    expect(report.entries[0]).toMatchObject({
      channel: 'whatsapp',
      status: 'rejected',
      failureReason: 'missing_credentials',
    });
    expect(report.message).toContain('Habari Bibi Kamau');
  });

  it('marks every exhausted attempt as failed with the HTTP status reason', async () => {
    const report = await SmsGatewayService.dispatchDigest(digest(), {
      channels: ['sms'],
      locale: 'en',
      phone: '+254712345678',
      credentials: { twilio: twilioCreds },
      sender: senderReturning([{ ok: false, status: 500 }]),
      sleep: async () => undefined,
      persist: false,
    });

    const sms = report.entries[0];
    expect(sms.status).toBe('failed');
    expect(sms.attempts).toBe(3);
    expect(sms.failureReason).toBe('HTTP 500');
    expect(report.failedCount).toBe(1);
  });

  it('persists delivered entries to the delivery log and clears it again', async () => {
    await SmsGatewayService.dispatchDigest(digest(), {
      channels: ['sms'],
      locale: 'en',
      phone: '+254712345678',
      credentials: { twilio: twilioCreds },
      sender: senderReturning([{ ok: true, status: 200 }]),
      sleep: async () => undefined,
    });

    const log = SmsGatewayService.getDeliveryLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ channel: 'sms', status: 'delivered', recipient: '+254712345678' });

    SmsGatewayService.clearDeliveryLog();
    expect(SmsGatewayService.getDeliveryLog()).toEqual([]);
  });
});

function viSleep() {
  const calls: number[] = [];
  return {
    calls,
    fn: async (ms: number) => {
      calls.push(ms);
    },
  };
}

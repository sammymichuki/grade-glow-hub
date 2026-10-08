import {
  CurrencyCode,
  CurrencySpec,
  PaymentIntent,
  PaymentIntentSchema,
  PaymentProvider,
  PaymentStatus,
  ProviderCapability,
  RegionCode,
  BillingPeriod,
} from '../types/billing';
import {
  StripePaymentIntentRequestSchema,
  PayPalCreateOrderRequestSchema,
  MpesaStkPushRequestSchema,
  MpesaStkQueryRequestSchema,
  FlutterwaveChargeRequestSchema,
} from '../types/billing';
import { SAMPLE_PAYMENT_TRANSACTIONS } from '../data/sampleBillingData';

export const CURRENCIES: Record<CurrencyCode, CurrencySpec> = {
  KES: { code: 'KES', symbol: 'KSh', minorUnitDigits: 2, locale: 'en-KE', label: 'Kenyan Shilling' },
  USD: { code: 'USD', symbol: '$', minorUnitDigits: 2, locale: 'en-US', label: 'US Dollar' },
  GBP: { code: 'GBP', symbol: '£', minorUnitDigits: 2, locale: 'en-GB', label: 'British Pound' },
  EUR: { code: 'EUR', symbol: '€', minorUnitDigits: 2, locale: 'de-DE', label: 'Euro' },
  NGN: { code: 'NGN', symbol: '₦', minorUnitDigits: 2, locale: 'en-NG', label: 'Nigerian Naira' },
  GHS: { code: 'GHS', symbol: 'GH₵', minorUnitDigits: 2, locale: 'en-GH', label: 'Ghanaian Cedi' },
  ZAR: { code: 'ZAR', symbol: 'R', minorUnitDigits: 2, locale: 'en-ZA', label: 'South African Rand' },
  INR: { code: 'INR', symbol: '₹', minorUnitDigits: 2, locale: 'en-IN', label: 'Indian Rupee' },
};

export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  'KES',
  'USD',
  'GBP',
  'EUR',
  'NGN',
  'GHS',
  'ZAR',
  'INR',
];

/**
 * Static mid-market fixture table expressed as integer minor-scaled units per 1 USD
 * (rate × 1000). All conversions run through BigInt so minor-unit money math never
 * touches floating point.
 */
export const EXCHANGE_RATES_PER_USD: Record<CurrencyCode, number> = {
  USD: 1_000,
  KES: 129_500,
  GBP: 780,
  EUR: 920,
  NGN: 1_550_000,
  GHS: 15_400,
  ZAR: 18_300,
  INR: 84_200,
};

export const EXCHANGE_RATE_TABLE_AS_OF = '2026-10-01';

function roundHalfAwayFromZero(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error('Denominator must be positive.');
  const sign = numerator < 0n ? -1n : 1n;
  const n = numerator < 0n ? -numerator : numerator;
  const doubled = n * 2n;
  const quotient = (doubled + denominator) / (2n * denominator);
  return sign * quotient;
}

/**
 * Converts an integer minor-unit amount between currencies using the fixture
 * FX table. Both rates are scaled by the same 1000 factor so the scale cancels;
 * only the exponent difference (10^digits) matters.
 */
export function convertMinorUnits(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (!Number.isInteger(amountMinor)) {
    throw new Error(`Amount must be an integer number of minor units, received ${amountMinor}.`);
  }
  if (from === to) return amountMinor;

  const fromSpec = CURRENCIES[from];
  const toSpec = CURRENCIES[to];
  const numerator =
    BigInt(amountMinor) *
    BigInt(EXCHANGE_RATES_PER_USD[to]) *
    BigInt(10 ** toSpec.minorUnitDigits);
  const denominator =
    BigInt(EXCHANGE_RATES_PER_USD[from]) * BigInt(10 ** fromSpec.minorUnitDigits);
  return Number(roundHalfAwayFromZero(numerator, denominator));
}

/**
 * Locale-aware money formatter that never re-enters the value through floats:
 * the integer and fraction components are formatted separately.
 */
export function formatMoney(amountMinor: number, currency: CurrencyCode, locale?: string): string {
  const spec = CURRENCIES[currency];
  const digits = spec.minorUnitDigits;
  const negative = amountMinor < 0;
  const absolute = Math.abs(Math.trunc(amountMinor));
  const scale = 10 ** digits;
  const whole = Math.floor(absolute / scale);
  const fraction = absolute % scale;
  const wholeText = new Intl.NumberFormat(locale ?? spec.locale).format(whole);
  const fractionText = digits > 0 ? `.${String(fraction).padStart(digits, '0')}` : '';
  return `${negative ? '-' : ''}${spec.symbol}${wholeText}${fractionText}`;
}

/** Fixed two-decimal decimal string required by PayPal and Flutterwave payloads. */
export function formatDecimalAmount(amountMinor: number): string {
  if (!Number.isInteger(amountMinor)) {
    throw new Error(`Amount must be integer minor units, received ${amountMinor}.`);
  }
  const negative = amountMinor < 0;
  const absolute = Math.abs(amountMinor);
  const whole = Math.floor(absolute / 100);
  const fraction = absolute % 100;
  return `${negative ? '-' : ''}${whole}.${String(fraction).padStart(2, '0')}`;
}

export const PROVIDER_CAPABILITIES: Record<PaymentProvider, ProviderCapability> = {
  stripe: {
    provider: 'stripe',
    label: 'Stripe Cards',
    currencies: ['USD', 'GBP', 'EUR', 'INR'],
    regions: ['north_america', 'europe', 'south_asia'],
    supportsIdempotency: true,
    supportsWebhooks: true,
    minAmountMinor: { USD: 50, GBP: 30, EUR: 30, INR: 50 },
  },
  paypal: {
    provider: 'paypal',
    label: 'PayPal Wallet',
    currencies: ['USD', 'GBP', 'EUR'],
    regions: ['north_america', 'europe'],
    supportsIdempotency: true,
    supportsWebhooks: true,
    minAmountMinor: { USD: 100, GBP: 30, EUR: 30 },
  },
  mpesa: {
    provider: 'mpesa',
    label: 'Safaricom M-Pesa',
    currencies: ['KES'],
    regions: ['east_africa'],
    supportsIdempotency: false,
    supportsWebhooks: true,
    minAmountMinor: { KES: 100 },
  },
  flutterwave: {
    provider: 'flutterwave',
    label: 'Flutterwave Rails',
    currencies: ['KES', 'NGN', 'GHS', 'ZAR', 'USD', 'GBP', 'EUR'],
    regions: ['east_africa', 'west_africa', 'southern_africa', 'north_america', 'europe'],
    supportsIdempotency: true,
    supportsWebhooks: true,
    minAmountMinor: { KES: 100, NGN: 10_000, GHS: 100, ZAR: 100, USD: 100, GBP: 30, EUR: 30 },
  },
};

export function getProvidersForCurrency(currency: CurrencyCode): PaymentProvider[] {
  return (Object.keys(PROVIDER_CAPABILITIES) as PaymentProvider[]).filter((provider) =>
    PROVIDER_CAPABILITIES[provider].currencies.includes(currency)
  );
}

export function isCurrencySupportedByProvider(provider: PaymentProvider, currency: CurrencyCode): boolean {
  return PROVIDER_CAPABILITIES[provider].currencies.includes(currency);
}

export function assertCurrencySupported(provider: PaymentProvider, currency: CurrencyCode): void {
  if (!isCurrencySupportedByProvider(provider, currency)) {
    const supported = PROVIDER_CAPABILITIES[provider].currencies.join(', ');
    throw new Error(`${provider} does not accept ${currency}. Supported currencies: ${supported}.`);
  }
}

export function assertMinimumAmount(provider: PaymentProvider, amountMinor: number, currency: CurrencyCode): void {
  const minimum = PROVIDER_CAPABILITIES[provider].minAmountMinor[currency];
  if (minimum !== undefined && amountMinor < minimum) {
    throw new Error(
      `${provider} minimum for ${currency} is ${formatMoney(minimum, currency)}.`
    );
  }
}

const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = Object.freeze({
  created: Object.freeze(['processing', 'failed', 'expired'] as const),
  processing: Object.freeze(['succeeded', 'failed', 'expired'] as const),
  succeeded: Object.freeze([] as const),
  failed: Object.freeze([] as const),
  expired: Object.freeze([] as const),
});

export const TERMINAL_PAYMENT_STATUSES: readonly PaymentStatus[] = ['succeeded', 'failed', 'expired'];

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export function assertPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransitionPaymentStatus(from, to)) {
    throw new Error(`Invalid payment status transition: ${from} -> ${to}.`);
  }
}

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUSES.includes(status);
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64Encode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? utf8Bytes(input) : input;
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    output += BASE64_ALPHABET[b0 >> 2];
    output += BASE64_ALPHABET[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    output += b1 === undefined ? '=' : BASE64_ALPHABET[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    output += b2 === undefined ? '=' : BASE64_ALPHABET[b2 & 0x3f];
  }
  return output;
}

function utf8Bytes(value: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length) {
      const low = value.charCodeAt(++i);
      const point = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
      out.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f)
      );
    } else {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return Uint8Array.from(out);
}

const MASK_64 = (1n << 64n) - 1n;

function rotateRight64(value: bigint, bits: bigint): bigint {
  return ((value >> bits) | (value << (64n - bits))) & MASK_64;
}

function integerRoot(value: bigint, degree: bigint): bigint {
  if (value <= 1n) return value;
  const bitLength = BigInt(value.toString(2).length);
  let guess = 1n << ((bitLength + degree - 1n) / degree);
  for (;;) {
    const next = ((degree - 1n) * guess + value / guess ** (degree - 1n)) / degree;
    if (next >= guess) return guess;
    guess = next;
  }
}

function firstPrimes(count: number): number[] {
  const primes: number[] = [];
  let candidate = 2;
  while (primes.length < count) {
    let isPrime = true;
    for (const prime of primes) {
      if (prime * prime > candidate) break;
      if (candidate % prime === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(candidate);
    candidate += 1;
  }
  return primes;
}

let sha512RoundConstants: bigint[] | null = null;
let sha512InitialHash: bigint[] | null = null;

/**
 * SHA-512 round constants K are the first 64 bits of the fractional parts of the
 * cube roots of the first 80 primes; H0..H7 come from the square roots of the
 * first 8 primes. Both are derived with exact BigInt integer roots so no magic
 * constants need to be transcribed by hand.
 */
function getSha512Constants(): { k: bigint[]; h: bigint[] } {
  if (!sha512RoundConstants || !sha512InitialHash) {
    const primes = firstPrimes(80);
    sha512RoundConstants = primes.map(
      (prime) => integerRoot(BigInt(prime) << 192n, 3n) & MASK_64
    );
    sha512InitialHash = primes
      .slice(0, 8)
      .map((prime) => integerRoot(BigInt(prime) << 128n, 2n) & MASK_64);
  }
  return { k: sha512RoundConstants, h: sha512InitialHash };
}

export function sha512Bytes(message: Uint8Array): Uint8Array {
  const { k, h } = getSha512Constants();
  const bitLength = BigInt(message.length) * 8n;
  const remainder = (message.length + 1) % 128;
  const paddingZeros = remainder <= 112 ? 112 - remainder : 240 - remainder;
  const totalLength = message.length + 1 + paddingZeros + 16;
  const data = new Uint8Array(totalLength);
  data.set(message);
  data[message.length] = 0x80;
  let lengthCursor = bitLength;
  for (let i = 0; i < 8; i++) {
    data[totalLength - 1 - i] = Number(lengthCursor & 0xffn);
    lengthCursor >>= 8n;
  }

  const state = [...h];
  const w: bigint[] = new Array(80);

  for (let offset = 0; offset < totalLength; offset += 128) {
    for (let i = 0; i < 16; i++) {
      let word = 0n;
      for (let byte = 0; byte < 8; byte++) {
        word = (word << 8n) | BigInt(data[offset + i * 8 + byte]);
      }
      w[i] = word;
    }
    for (let i = 16; i < 80; i++) {
      const s0 = rotateRight64(w[i - 15], 1n) ^ rotateRight64(w[i - 15], 8n) ^ (w[i - 15] >> 7n);
      const s1 = rotateRight64(w[i - 2], 19n) ^ rotateRight64(w[i - 2], 61n) ^ (w[i - 2] >> 6n);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & MASK_64;
    }

    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    let e = state[4];
    let f = state[5];
    let g = state[6];
    let hh = state[7];

    for (let i = 0; i < 80; i++) {
      const sum1 = rotateRight64(e, 14n) ^ rotateRight64(e, 18n) ^ rotateRight64(e, 41n);
      const choose = (e & f) ^ (~e & MASK_64 & g);
      const t1 = (hh + sum1 + choose + k[i] + w[i]) & MASK_64;
      const sum0 = rotateRight64(a, 28n) ^ rotateRight64(a, 34n) ^ rotateRight64(a, 39n);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (sum0 + majority) & MASK_64;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) & MASK_64;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) & MASK_64;
    }

    state[0] = (state[0] + a) & MASK_64;
    state[1] = (state[1] + b) & MASK_64;
    state[2] = (state[2] + c) & MASK_64;
    state[3] = (state[3] + d) & MASK_64;
    state[4] = (state[4] + e) & MASK_64;
    state[5] = (state[5] + f) & MASK_64;
    state[6] = (state[6] + g) & MASK_64;
    state[7] = (state[7] + hh) & MASK_64;
  }

  const digest = new Uint8Array(64);
  for (let i = 0; i < 8; i++) {
    let word = state[i];
    for (let byte = 7; byte >= 0; byte--) {
      digest[i * 8 + byte] = Number(word & 0xffn);
      word >>= 8n;
    }
  }
  return digest;
}

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

export function sha512Hex(message: string): string {
  return toHex(sha512Bytes(utf8Bytes(message)));
}

export function hmacSha512Hex(secret: string, message: string): string {
  let key = utf8Bytes(secret);
  if (key.length > 128) key = sha512Bytes(key);
  const paddedKey = new Uint8Array(128);
  paddedKey.set(key);

  const inner = new Uint8Array(128 + message.length);
  const outerPad = new Uint8Array(128);
  for (let i = 0; i < 128; i++) {
    inner[i] = paddedKey[i] ^ 0x36;
    outerPad[i] = paddedKey[i] ^ 0x5c;
  }
  inner.set(utf8Bytes(message), 128);
  const innerDigest = sha512Bytes(inner);

  const outer = new Uint8Array(128 + 64);
  outer.set(outerPad);
  outer.set(innerDigest, 128);
  return toHex(sha512Bytes(outer));
}

export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyFlutterwaveSignature(
  payload: string,
  signatureHeader: string,
  secretHash: string
): boolean {
  if (!signatureHeader) return false;
  return constantTimeEquals(hmacSha512Hex(secretHash, payload), signatureHeader.trim().toLowerCase());
}

function randomHex(charCount: number): string {
  const alphabet = '0123456789abcdef';
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const buffer = new Uint8Array(charCount);
    cryptoApi.getRandomValues(buffer);
    let out = '';
    for (let i = 0; i < charCount; i++) out += alphabet[buffer[i] & 0x0f];
    return out;
  }
  let out = '';
  for (let i = 0; i < charCount; i++) out += alphabet[Math.floor(Math.random() * 16)];
  return out;
}

export function generateIdempotencyKey(scope: string): string {
  const safeScope = scope.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 24) || 'op';
  return `idem_${safeScope}_${randomHex(24)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

/**
 * Maps an operation + payload fingerprint onto a stable idempotency key so that
 * retried requests reuse the exact same key (and therefore cannot double-charge).
 */
export class IdempotencyRegistry {
  private keys = new Map<string, string>();

  keyFor(scope: string, payload: unknown): string {
    const fingerprint = `${scope}::${stableStringify(payload)}`;
    const existing = this.keys.get(fingerprint);
    if (existing) return existing;
    const key = generateIdempotencyKey(scope);
    this.keys.set(fingerprint, key);
    return key;
  }

  has(scope: string, payload: unknown): boolean {
    return this.keys.has(`${scope}::${stableStringify(payload)}`);
  }

  size(): number {
    return this.keys.size;
  }

  clear(): void {
    this.keys.clear();
  }
}

export const MPESA_CALLBACK_URL = 'https://api.gradeglowhub.co.ke/v1/billing/mpesa/callback';

export interface MpesaConfig {
  shortcode: string;
  passkey: string;
  consumerKey: string;
  consumerSecret: string;
  callbackUrl: string;
}
export const SANDBOX_MPESA_CONFIG: MpesaConfig = {
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  passkey: process.env.MPESA_PASSKEY || '',
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  callbackUrl: MPESA_CALLBACK_URL,
};



/** Daraja timestamps are expressed in East Africa Time (UTC+3), independent of host TZ. */
export function buildMpesaTimestamp(date: Date): string {
  const eat = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const parts = [
    eat.getUTCFullYear(),
    String(eat.getUTCMonth() + 1).padStart(2, '0'),
    String(eat.getUTCDate()).padStart(2, '0'),
    String(eat.getUTCHours()).padStart(2, '0'),
    String(eat.getUTCMinutes()).padStart(2, '0'),
    String(eat.getUTCSeconds()).padStart(2, '0'),
  ];
  return parts.join('');
}

export function buildMpesaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return base64Encode(`${shortcode}${passkey}${timestamp}`);
}

export interface HttpRequest {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: unknown;
}

export function buildMpesaOauthRequest(config: MpesaConfig = SANDBOX_MPESA_CONFIG): HttpRequest {
  return {
    url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    method: 'POST',
    headers: {
      Authorization: `Basic ${base64Encode(`${config.consumerKey}:${config.consumerSecret}`)}`,
      Accept: 'application/json',
    },
  };
}

export type PhoneNormalizationResult =
  | { ok: true; e164: string; nationalSignificant: string }
  | { ok: false; reason: string };

export function normalizeMpesaPhone(raw: string): PhoneNormalizationResult {
  const cleaned = raw.replace(/[\s()\-.]/g, '');
  if (cleaned.length === 0) return { ok: false, reason: 'Phone number is required.' };
  if (!/^\+?\d+$/.test(cleaned)) {
    return { ok: false, reason: 'Phone number may only contain digits, spaces, dashes and +.' };
  }

  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (digits.startsWith('00')) {
    return { ok: false, reason: 'Use +254 instead of the 00 international prefix.' };
  }

  let national: string;
  if (digits.startsWith('254')) {
    national = digits.slice(3);
  } else if (digits.startsWith('0')) {
    national = digits.slice(1);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return { ok: false, reason: 'Kenyan numbers must be in 07… / 01… or +254… format.' };
  }

  if (national.length !== 9) {
    return { ok: false, reason: 'Kenyan numbers must have 9 digits after the country code.' };
  }
  if (!/^[71]/.test(national)) {
    return { ok: false, reason: 'Safaricom numbers start with 7 or 1 after the country code.' };
  }

  return { ok: true, e164: `254${national}`, nationalSignificant: national };
}

export interface StkPushParams {
  amountMinor: number;
  phone: string;
  description: string;
  accountReference?: string;
  config?: MpesaConfig;
  now?: Date;
}

export function buildStkPushRequest(params: StkPushParams): HttpRequest & { checkoutRequestHint: string } {
  const config = params.config ?? SANDBOX_MPESA_CONFIG;
  const phone = normalizeMpesaPhone(params.phone);
  if (phone.ok === false) throw new Error(phone.reason);

  const now = params.now ?? new Date();
  const timestamp = buildMpesaTimestamp(now);
  const body = {
    BusinessShortCode: config.shortcode,
    Password: buildMpesaPassword(config.shortcode, config.passkey, timestamp),
    Timestamp: timestamp,
    Amount: Math.round(params.amountMinor / 100),
    PartyA: phone.e164,
    PartyB: config.shortcode,
    PhoneNumber: phone.e164,
    CallBackURL: config.callbackUrl,
    AccountReference: (params.accountReference ?? 'GradeGlow').slice(0, 12),
    TransactionDesc: params.description.slice(0, 13),
  };

  const parsed = MpesaStkPushRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid STK Push payload: ${parsed.error.issues[0]?.message ?? 'unknown issue'}`);
  }

  return {
    url: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <oauth-access-token>',
    },
    body: parsed.data,
    checkoutRequestHint: `ws_CO_${Math.floor(now.getTime() / 1000)}`,
  };
}

export function buildStkQueryRequest(params: {
  checkoutRequestId: string;
  config?: MpesaConfig;
  now?: Date;
}): HttpRequest {
  const config = params.config ?? SANDBOX_MPESA_CONFIG;
  const now = params.now ?? new Date();
  const timestamp = buildMpesaTimestamp(now);
  const body = {
    BusinessShortCode: config.shortcode,
    Password: buildMpesaPassword(config.shortcode, config.passkey, timestamp),
    Timestamp: timestamp,
    CheckoutRequestID: params.checkoutRequestId,
  };
  const parsed = MpesaStkQueryRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid STK Query payload: ${parsed.error.issues[0]?.message ?? 'unknown issue'}`);
  }
  return {
    url: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <oauth-access-token>',
    },
    body: parsed.data,
  };
}

export interface StripePaymentParams {
  amountMinor: number;
  currency: CurrencyCode;
  description: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
  apiToken?: string;
}

export function buildStripePaymentIntentRequest(params: StripePaymentParams): HttpRequest {
  assertCurrencySupported('stripe', params.currency);
  assertMinimumAmount('stripe', params.amountMinor, params.currency);
  const body = {
    amount: params.amountMinor,
    currency: params.currency.toLowerCase(),
    description: params.description,
    automatic_payment_methods: { enabled: true } as const,
    metadata: params.metadata ?? {},
    headers: {
      'Idempotency-Key': params.idempotencyKey,
      'Content-Type': 'application/json' as const,
      Authorization: `Bearer ${params.apiToken ?? 'sk_test_grade_glow_hub'}`,
    },
  };
  const parsed = StripePaymentIntentRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid Stripe PaymentIntent payload: ${parsed.error.issues[0]?.message ?? 'unknown issue'}`
    );
  }
  const { headers, ...rest } = parsed.data;
  return {
    url: 'https://api.stripe.com/v1/payment_intents',
    method: 'POST',
    headers: { ...headers },
    body: rest,
  };
}

export function buildStripeConfirmHeaders(idempotencyKey: string, apiToken?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    Authorization: `Bearer ${apiToken ?? 'sk_test_grade_glow_hub'}`,
  };
}

export interface PayPalOrderParams {
  amountMinor: number;
  currency: CurrencyCode;
  description: string;
  idempotencyKey: string;
  brandName?: string;
  locale?: string;
  accessToken?: string;
}

export function buildPayPalCreateOrderRequest(params: PayPalOrderParams): HttpRequest {
  assertCurrencySupported('paypal', params.currency);
  assertMinimumAmount('paypal', params.amountMinor, params.currency);
  const body = {
    intent: 'CAPTURE' as const,
    purchase_units: [
      {
        description: params.description,
        amount: {
          currency_code: params.currency,
          value: formatDecimalAmount(params.amountMinor),
        },
      },
    ],
    application_context: {
      brand_name: params.brandName ?? 'Grade Glow Hub',
      locale: params.locale ?? 'en-US',
      user_action: 'PAY_NOW' as const,
    },
  };
  const parsed = PayPalCreateOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid PayPal order payload: ${parsed.error.issues[0]?.message ?? 'unknown issue'}`
    );
  }
  return {
    url: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken ?? 'PAYPAL_SANDBOX_TOKEN'}`,
      'PayPal-Request-Id': params.idempotencyKey,
    },
    body: parsed.data,
  };
}

export function buildPayPalCaptureOrderRequest(orderId: string, idempotencyKey: string): HttpRequest {
  if (!orderId.trim()) throw new Error('PayPal order id is required to capture.');
  return {
    url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer PAYPAL_SANDBOX_TOKEN',
      'PayPal-Request-Id': `${idempotencyKey}_capture`,
    },
  };
}

export interface FlutterwaveChargeParams {
  amountMinor: number;
  currency: CurrencyCode;
  email: string;
  description: string;
  idempotencyKey: string;
  secretKey?: string;
}

export function buildFlutterwaveChargeRequest(params: FlutterwaveChargeParams): HttpRequest {
  assertCurrencySupported('flutterwave', params.currency);
  assertMinimumAmount('flutterwave', params.amountMinor, params.currency);
  const body = {
    tx_ref: params.idempotencyKey,
    amount: formatDecimalAmount(params.amountMinor),
    currency: params.currency,
    customer: { email: params.email },
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    meta: { description: params.description },
  };
  const parsed = FlutterwaveChargeRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid Flutterwave charge payload: ${parsed.error.issues[0]?.message ?? 'unknown issue'}`
    );
  }
  return {
    url: 'https://api.flutterwave.com/v3/charges',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.secretKey ?? 'FLWSECK_TEST-SANDBOX'}`,
      'x-idempotency-key': params.idempotencyKey,
    },
    body: parsed.data,
  };
}

export interface PollOptions {
  baseDelayMs?: number;
  factor?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}

export const DEFAULT_POLL_OPTIONS: Required<Omit<PollOptions, 'sleep'>> = {
  baseDelayMs: 500,
  factor: 2,
  maxDelayMs: 10_000,
  maxAttempts: 6,
};

export function nextPollDelayMs(attempt: number, options?: PollOptions): number {
  if (attempt < 1) throw new Error('Poll attempts are 1-indexed.');
  const base = options?.baseDelayMs ?? DEFAULT_POLL_OPTIONS.baseDelayMs;
  const factor = options?.factor ?? DEFAULT_POLL_OPTIONS.factor;
  const max = options?.maxDelayMs ?? DEFAULT_POLL_OPTIONS.maxDelayMs;
  const raw = base * Math.pow(factor, attempt - 1);
  return Math.min(max, Math.round(raw));
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PollResult {
  status: PaymentStatus;
  attempts: number;
  timedOut: boolean;
  delays: number[];
}

/**
 * Polls a payment status endpoint with exponential backoff until the intent
 * settles in a terminal state or the attempt budget is exhausted.
 */
export async function pollPaymentIntentStatus(
  fetchStatus: () => PaymentStatus | Promise<PaymentStatus>,
  options?: PollOptions
): Promise<PollResult> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_POLL_OPTIONS.maxAttempts;
  const sleep = options?.sleep ?? defaultSleep;
  const delays: number[] = [];
  let status: PaymentStatus = 'created';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    status = await fetchStatus();
    if (isTerminalPaymentStatus(status)) {
      return { status, attempts: attempt, timedOut: false, delays };
    }
    if (attempt === maxAttempts) break;
    const delay = nextPollDelayMs(attempt, options);
    delays.push(delay);
    await sleep(delay);
  }
  return { status, attempts: maxAttempts, timedOut: !isTerminalPaymentStatus(status), delays };
}

export interface SeatTierBand {
  id: string;
  label: string;
  minSeats: number;
  maxSeats: number | null;
  volumeDiscountBp: number;
}

export const ENTERPRISE_SEAT_TIERS: SeatTierBand[] = [
  { id: 'pilot', label: 'Pilot (1–49 seats)', minSeats: 1, maxSeats: 49, volumeDiscountBp: 0 },
  { id: 'school', label: 'School (50–249 seats)', minSeats: 50, maxSeats: 249, volumeDiscountBp: 1_000 },
  { id: 'district', label: 'District (250–999 seats)', minSeats: 250, maxSeats: 999, volumeDiscountBp: 2_000 },
  { id: 'ministry', label: 'Ministry (1000+ seats)', minSeats: 1_000, maxSeats: null, volumeDiscountBp: 3_000 },
];

export const NORTH_AMERICA_LIST_PRICE_USD_MINOR = 2_500;

export interface RegionalSeatRate {
  region: RegionCode;
  label: string;
  perSeatUsdMinor: number;
}

/** PPP-adjusted annual per-seat prices, clamped to the $5–$25 mandate. */
export const REGIONAL_SEAT_RATES: RegionalSeatRate[] = [
  { region: 'east_africa', label: 'East Africa', perSeatUsdMinor: 500 },
  { region: 'west_africa', label: 'West Africa', perSeatUsdMinor: 700 },
  { region: 'south_asia', label: 'South Asia', perSeatUsdMinor: 900 },
  { region: 'southern_africa', label: 'Southern Africa', perSeatUsdMinor: 1_000 },
  { region: 'europe', label: 'Europe & UK', perSeatUsdMinor: 2_000 },
  { region: 'north_america', label: 'North America', perSeatUsdMinor: 2_500 },
];

export const MIN_ENTERPRISE_SEAT_PRICE_USD_MINOR = 500;
export const MAX_ENTERPRISE_SEAT_PRICE_USD_MINOR = 2_500;

export interface EnterpriseSeatQuote {
  region: RegionCode;
  regionLabel: string;
  seats: number;
  tierId: string;
  tierLabel: string;
  perSeatUsdMinor: number;
  subtotalUsdMinor: number;
  volumeDiscountBp: number;
  volumeDiscountUsdMinor: number;
  totalAnnualUsdMinor: number;
  pppDiscountBp: number;
  currency: CurrencyCode;
  totalAnnualMinor: number;
}

export function getSeatTierForSeats(seats: number): SeatTierBand {
  if (!Number.isInteger(seats) || seats < 1) {
    throw new Error('Seat count must be a positive integer.');
  }
  const tier = ENTERPRISE_SEAT_TIERS.find(
    (band) => seats >= band.minSeats && (band.maxSeats === null || seats <= band.maxSeats)
  );
  if (!tier) throw new Error(`No enterprise seat tier matches ${seats} seats.`);
  return tier;
}

export function quoteEnterpriseSeats(input: {
  region: RegionCode;
  seats: number;
  currency: CurrencyCode;
}): EnterpriseSeatQuote {
  const rate = REGIONAL_SEAT_RATES.find((entry) => entry.region === input.region);
  if (!rate) throw new Error(`Unknown region: ${input.region}`);

  const perSeat = Math.min(
    MAX_ENTERPRISE_SEAT_PRICE_USD_MINOR,
    Math.max(MIN_ENTERPRISE_SEAT_PRICE_USD_MINOR, rate.perSeatUsdMinor)
  );
  const tier = getSeatTierForSeats(input.seats);
  const subtotal = perSeat * input.seats;
  const volumeDiscount = Math.floor((subtotal * tier.volumeDiscountBp) / 10_000);
  const total = subtotal - volumeDiscount;
  const pppDiscountBp = Math.round(
    ((NORTH_AMERICA_LIST_PRICE_USD_MINOR - perSeat) / NORTH_AMERICA_LIST_PRICE_USD_MINOR) * 10_000
  );

  return {
    region: input.region,
    regionLabel: rate.label,
    seats: input.seats,
    tierId: tier.id,
    tierLabel: tier.label,
    perSeatUsdMinor: perSeat,
    subtotalUsdMinor: subtotal,
    volumeDiscountBp: tier.volumeDiscountBp,
    volumeDiscountUsdMinor: volumeDiscount,
    totalAnnualUsdMinor: total,
    pppDiscountBp,
    currency: input.currency,
    totalAnnualMinor: convertMinorUnits(total, 'USD', input.currency),
  };
}

export interface FamilyPlanConfig {
  id: string;
  name: string;
  period: BillingPeriod;
  maxChildren: number;
  monthlyUsdMinor: number;
  annualUsdMinor: number;
  isMostPopular: boolean;
  features: string[];
}

export const FAMILY_PLAN_CATALOG: FamilyPlanConfig[] = [
  {
    id: 'family_starter',
    name: 'Family Starter',
    period: 'monthly',
    maxChildren: 4,
    monthlyUsdMinor: 999,
    annualUsdMinor: 9_990,
    isMostPopular: false,
    features: [
      'Unlimited GlowBot Socratic tutoring',
      '4 child profiles',
      'Core STEM virtual labs',
      'Printable certificates',
    ],
  },
  {
    id: 'family_plus',
    name: 'Family Plus',
    period: 'monthly',
    maxChildren: 6,
    monthlyUsdMinor: 1_499,
    annualUsdMinor: 14_990,
    isMostPopular: true,
    features: [
      'Everything in Family Starter',
      '6 child profiles',
      'Advanced exam mock suites',
      'Priority homework review queue',
      'Offline lesson pack downloads',
    ],
  },
];

export interface FamilyPlanQuote {
  planId: string;
  name: string;
  period: BillingPeriod;
  maxChildren: number;
  isMostPopular: boolean;
  currency: CurrencyCode;
  priceMinor: number;
  monthlyEquivalentMinor: number;
  annualSavingsUsdMinor: number;
  annualSavingsBp: number;
  features: string[];
}

export function quoteFamilyPlan(planId: string, period: BillingPeriod, currency: CurrencyCode): FamilyPlanQuote {
  const plan = FAMILY_PLAN_CATALOG.find((entry) => entry.id === planId);
  if (!plan) throw new Error(`Unknown family plan: ${planId}`);

  const usdMinor = period === 'annual' ? plan.annualUsdMinor : plan.monthlyUsdMinor;
  const annualSavings = plan.monthlyUsdMinor * 12 - plan.annualUsdMinor;
  return {
    planId: plan.id,
    name: plan.name,
    period,
    maxChildren: plan.maxChildren,
    isMostPopular: plan.isMostPopular,
    currency,
    priceMinor: convertMinorUnits(usdMinor, 'USD', currency),
    monthlyEquivalentMinor:
      period === 'annual' ? Math.floor(convertMinorUnits(usdMinor, 'USD', currency) / 12) : convertMinorUnits(usdMinor, 'USD', currency),
    annualSavingsUsdMinor: annualSavings,
    annualSavingsBp: Math.round((annualSavings / (plan.monthlyUsdMinor * 12)) * 10_000),
    features: plan.features,
  };
}

function newProviderReference(provider: PaymentProvider, now: Date): string {
  switch (provider) {
    case 'stripe':
      return `pi_${randomHex(24)}`;
    case 'paypal':
      return `ORDER-${now.getTime().toString(36).toUpperCase()}-${randomHex(8).toUpperCase()}`;
    case 'mpesa':
      return `ws_CO_${Math.floor(now.getTime() / 1000)}_${randomHex(8)}`;
    case 'flutterwave':
      return `GGH-TX-${now.getTime().toString(36).toUpperCase()}-${randomHex(8).toUpperCase()}`;
    default: {
      const exhaustive: never = provider;
      throw new Error(`Unsupported provider: ${String(exhaustive)}`);
    }
  }
}

export interface CreateIntentInput {
  provider: PaymentProvider;
  amountMinor: number;
  currency: CurrencyCode;
  description: string;
  metadata?: Record<string, string>;
}

export interface StkPushSession {
  checkoutRequestId: string;
  phoneE164: string;
  amountMinor: number;
  currency: CurrencyCode;
  request: HttpRequest;
  intentId: string;
  issuedAt: string;
}

export interface StkQueryResult {
  checkoutRequestId: string;
  status: 'pending' | 'succeeded' | 'failed';
  resultCode: number | null;
  resultDesc: string | null;
  receiptCode: string | null;
  queriesSoFar: number;
}

const TRANSACTIONS_STORAGE_KEY = 'grade_glow_billing_payment_intents';

export class PaymentGatewayService {
  private static intents: PaymentIntent[] | null = null;
  private static registry = new IdempotencyRegistry();
  private static stkAttempts = new Map<string, number>();
  private static stkConfirmAfterQueries: number | null = 2;
  private static mpesaConfig: MpesaConfig = { ...SANDBOX_MPESA_CONFIG };

  static resetToDefaults(): void {
    this.intents = SAMPLE_PAYMENT_TRANSACTIONS.map((intent) => ({ ...intent }));
    this.registry.clear();
    this.stkAttempts.clear();
    this.stkConfirmAfterQueries = 2;
    this.mpesaConfig = { ...SANDBOX_MPESA_CONFIG };
    this.persist();
  }

  static configureStkSimulation(options: { confirmAfterQueries: number | null }): void {
    this.stkConfirmAfterQueries = options.confirmAfterQueries;
  }

  static getMpesaConfig(): MpesaConfig {
    return { ...this.mpesaConfig };
  }

  private static load(): PaymentIntent[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const valid: PaymentIntent[] = [];
            for (const item of parsed) {
              const result = PaymentIntentSchema.safeParse(item);
              if (result.success) valid.push(result.data);
            }
            if (valid.length > 0 || parsed.length === 0) return valid;
          }
        }
      }
    } catch {
      // Corrupted or unavailable storage falls back to fixtures.
    }
    return SAMPLE_PAYMENT_TRANSACTIONS.map((intent) => ({ ...intent }));
  }

  private static persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(this.intents ?? []));
      }
    } catch {
      // Storage quota or privacy mode — in-memory state still works.
    }
  }

  private static ensureLoaded(): PaymentIntent[] {
    if (this.intents === null) this.intents = this.load();
    return this.intents;
  }

  static getTransactions(): PaymentIntent[] {
    return [...this.ensureLoaded()];
  }

  static getIntent(id: string): PaymentIntent | undefined {
    return this.ensureLoaded().find((intent) => intent.id === id);
  }

  static getIntentByIdempotencyKey(key: string): PaymentIntent | undefined {
    return this.ensureLoaded().find((intent) => intent.idempotencyKey === key);
  }

  static createIntent(input: CreateIntentInput): PaymentIntent {
    assertCurrencySupported(input.provider, input.currency);
    assertMinimumAmount(input.provider, input.amountMinor, input.currency);
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error('Payment amount must be a positive integer in minor units.');
    }
    if (!input.description.trim()) throw new Error('Payment description is required.');

    const keyPayload = {
      provider: input.provider,
      amountMinor: input.amountMinor,
      currency: input.currency,
      description: input.description.trim(),
    };
    const idempotencyKey = this.registry.keyFor('payment_intent', keyPayload);
    const replayed = this.getIntentByIdempotencyKey(idempotencyKey);
    if (replayed) return { ...replayed };

    const now = new Date().toISOString();
    const intent: PaymentIntent = {
      id: `pi_local_${randomHex(16)}`,
      provider: input.provider,
      status: 'created',
      amountMinor: input.amountMinor,
      currency: input.currency,
      idempotencyKey,
      description: input.description.trim(),
      providerReference: newProviderReference(input.provider, new Date()),
      createdAt: now,
      updatedAt: now,
      failureReason: null,
      metadata: input.metadata ?? {},
    };

    const parsed = PaymentIntentSchema.safeParse(intent);
    if (!parsed.success) {
      throw new Error(`Refusing to persist malformed payment intent: ${parsed.error.issues[0]?.message}`);
    }

    this.ensureLoaded().unshift(parsed.data);
    this.persist();
    return { ...parsed.data };
  }

  static transitionIntent(id: string, next: PaymentStatus, failureReason?: string): PaymentIntent {
    const intents = this.ensureLoaded();
    const index = intents.findIndex((intent) => intent.id === id);
    if (index === -1) throw new Error(`Payment intent ${id} not found.`);
    const current = intents[index];
    assertPaymentTransition(current.status, next);
    const updated: PaymentIntent = {
      ...current,
      status: next,
      updatedAt: new Date().toISOString(),
      failureReason: next === 'failed' ? failureReason ?? 'Provider declined the payment.' : null,
    };
    intents[index] = updated;
    this.persist();
    return { ...updated };
  }

  static markProcessing(id: string): PaymentIntent {
    return this.transitionIntent(id, 'processing');
  }

  static confirmIntent(id: string): PaymentIntent {
    return this.transitionIntent(id, 'succeeded');
  }

  static failIntent(id: string, reason: string): PaymentIntent {
    return this.transitionIntent(id, 'failed', reason);
  }

  static expireIntent(id: string): PaymentIntent {
    return this.transitionIntent(id, 'expired');
  }

  /**
   * Offline sandbox settlement: the first call moves a freshly created intent to
   * processing, the second resolves it (unless metadata asks for failure/expiry).
   */
  static advanceProviderSimulation(id: string): PaymentIntent {
    const intent = this.getIntent(id);
    if (!intent) throw new Error(`Payment intent ${id} not found.`);
    if (isTerminalPaymentStatus(intent.status)) return { ...intent };
    if (intent.status === 'created') return this.markProcessing(id);

    const outcome = intent.metadata.outcome;
    if (outcome === 'failed') return this.failIntent(id, 'Card declined by issuer (sandbox).');
    if (outcome === 'expired') return this.expireIntent(id);
    return this.confirmIntent(id);
  }

  static async pollIntentUntilSettled(id: string, options?: PollOptions): Promise<PollResult> {
    return pollPaymentIntentStatus(() => {
      const intent = this.getIntent(id);
      if (!intent) throw new Error(`Payment intent ${id} not found.`);
      if (isTerminalPaymentStatus(intent.status)) return intent.status;
      return this.advanceProviderSimulation(id).status;
    }, options);
  }

  static initiateStkPush(params: {
    phone: string;
    amountMinor: number;
    description: string;
    accountReference?: string;
    now?: Date;
  }): StkPushSession {
    const request = buildStkPushRequest({ ...params, config: this.mpesaConfig });
    const now = params.now ?? new Date();
    const checkoutRequestId = `${request.checkoutRequestHint}_${randomHex(8)}`;

    const intent = this.createIntent({
      provider: 'mpesa',
      amountMinor: params.amountMinor,
      currency: 'KES',
      description: params.description,
      metadata: { checkoutRequestId, phone: params.phone },
    });
    this.markProcessing(intent.id);

    const phone = normalizeMpesaPhone(params.phone);
    if (phone.ok === false) throw new Error(phone.reason);

    this.stkAttempts.set(checkoutRequestId, 0);

    return {
      checkoutRequestId,
      phoneE164: phone.e164,
      amountMinor: params.amountMinor,
      currency: 'KES',
      request,
      intentId: intent.id,
      issuedAt: now.toISOString(),
    };
  }

  static queryStkStatus(checkoutRequestId: string): StkQueryResult {
    const previous = this.stkAttempts.get(checkoutRequestId) ?? 0;
    const attempts = previous + 1;
    this.stkAttempts.set(checkoutRequestId, attempts);

    const shouldConfirm =
      this.stkConfirmAfterQueries !== null && attempts >= this.stkConfirmAfterQueries;

    if (shouldConfirm) {
      const intent = this.ensureLoaded().find(
        (item) => item.metadata.checkoutRequestId === checkoutRequestId
      );
      if (intent && intent.status !== 'succeeded') {
        if (intent.status === 'created') this.markProcessing(intent.id);
        if (intent.status === 'processing') this.confirmIntent(intent.id);
      }
      return {
        checkoutRequestId,
        status: 'succeeded',
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        receiptCode: deriveReceiptCode(checkoutRequestId),
        queriesSoFar: attempts,
      };
    }

    return {
      checkoutRequestId,
      status: 'pending',
      resultCode: 1037,
      resultDesc: 'DS timeout user cannot be reached',
      receiptCode: null,
      queriesSoFar: attempts,
    };
  }
}

export function deriveReceiptCode(checkoutRequestId: string): string {
  const body = checkoutRequestId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return `S${body.slice(-7)}`.padEnd(8, '0');
}

PaymentGatewayService.resetToDefaults();

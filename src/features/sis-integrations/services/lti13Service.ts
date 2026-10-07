import {
  AgsLineItemClaim,
  AgsLineItemClaimSchema,
  AgsScore,
  AgsScoreSchema,
  DeepLinkContentItem,
  DeepLinkContentItemSchema,
  DeepLinkingResponseParams,
  JwtHeader,
  JwtPayload,
  JwtVerificationResult,
  JwtVerifyOptions,
  OidcLoginParams,
  OidcLoginStart,
  OidcStateValidation,
  LTI_CLAIM_PREFIX,
  LTI_DL_CLAIM_PREFIX,
  AGS_SCOPE_LINEITEM,
  AGS_SCOPE_SCORE,
  AGS_SCOPE_RESULT,
} from '../types/sis';

// ---------------------------------------------------------------- //
// Pure TypeScript primitives: UTF-8, SHA-256, HMAC-SHA256, base64url
// ---------------------------------------------------------------- //

export function utf8Encode(input: string): Uint8Array {
  const bytes: number[] = [];
  for (let index = 0; index < input.length; index += 1) {
    let code = input.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && index + 1 < input.length) {
      const next = input.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000;
        index += 1;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

export function utf8Decode(bytes: Uint8Array): string {
  let out = '';
  let index = 0;
  while (index < bytes.length) {
    const byte1 = bytes[index];
    let code: number;
    if (byte1 < 0x80) {
      code = byte1;
      index += 1;
    } else if ((byte1 & 0xe0) === 0xc0) {
      code = ((byte1 & 0x1f) << 6) | (bytes[index + 1] & 0x3f);
      index += 2;
    } else if ((byte1 & 0xf0) === 0xe0) {
      code = ((byte1 & 0x0f) << 12) | ((bytes[index + 1] & 0x3f) << 6) | (bytes[index + 2] & 0x3f);
      index += 3;
    } else {
      code =
        ((byte1 & 0x07) << 18) |
        ((bytes[index + 1] & 0x3f) << 12) |
        ((bytes[index + 2] & 0x3f) << 6) |
        (bytes[index + 3] & 0x3f);
      index += 4;
    }
    if (code < 0x10000) {
      out += String.fromCharCode(code);
    } else {
      const offset = code - 0x10000;
      out += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    }
  }
  return out;
}

const SHA256_K: number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (value: number, bits: number): number => ((value >>> bits) | (value << (32 - bits))) >>> 0;

export function sha256Bytes(message: Uint8Array): Uint8Array {
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const byteLength = message.length;
  const bitLength = byteLength * 8;
  const paddedLength = (((byteLength + 8) >> 6) << 6) + 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[byteLength] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 4294967296), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (let i = 0; i < 64; i += 1) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  hash.forEach((value, index) => outView.setUint32(index * 4, value, false));
  return out;
}

export function hmacSha256Bytes(key: Uint8Array, message: Uint8Array): Uint8Array {
  let normalizedKey = key;
  if (normalizedKey.length > 64) normalizedKey = sha256Bytes(normalizedKey);

  const innerPad = new Uint8Array(64);
  const outerPad = new Uint8Array(64);
  for (let i = 0; i < 64; i += 1) {
    const keyByte = i < normalizedKey.length ? normalizedKey[i] : 0;
    innerPad[i] = keyByte ^ 0x36;
    outerPad[i] = keyByte ^ 0x5c;
  }

  const innerMessage = new Uint8Array(64 + message.length);
  innerMessage.set(innerPad);
  innerMessage.set(message, 64);
  const innerHash = sha256Bytes(innerMessage);

  const outerMessage = new Uint8Array(64 + 32);
  outerMessage.set(outerPad);
  outerMessage.set(innerHash, 64);
  return sha256Bytes(outerMessage);
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function base64UrlEncode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (b0 << 16) | (b1 << 8) | b2;
    out += BASE64URL_ALPHABET[(triple >> 18) & 63];
    out += BASE64URL_ALPHABET[(triple >> 12) & 63];
    if (i + 1 < bytes.length) out += BASE64URL_ALPHABET[(triple >> 6) & 63];
    if (i + 2 < bytes.length) out += BASE64URL_ALPHABET[triple & 63];
  }
  return out;
}

const BASE64_STANDARD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const out: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const c0 = BASE64_STANDARD_ALPHABET.indexOf(padded[i]);
    const c1 = BASE64_STANDARD_ALPHABET.indexOf(padded[i + 1]);
    const c2Raw = padded[i + 2];
    const c3Raw = padded[i + 3];
    const c2 = c2Raw === '=' ? 0 : BASE64_STANDARD_ALPHABET.indexOf(c2Raw);
    const c3 = c3Raw === '=' ? 0 : BASE64_STANDARD_ALPHABET.indexOf(c3Raw);
    if (c0 < 0 || c1 < 0 || (c2Raw !== '=' && c2 < 0) || (c3Raw !== '=' && c3 < 0)) {
      throw new Error('Invalid base64url input.');
    }
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    out.push((triple >> 16) & 0xff);
    if (c2Raw !== '=') out.push((triple >> 8) & 0xff);
    if (c3Raw !== '=') out.push(triple & 0xff);
  }
  return new Uint8Array(out);
}

export function sha256Hex(input: string): string {
  return [...sha256Bytes(utf8Encode(input))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hmacSha256Hex(key: string, message: string): string {
  return [...hmacSha256Bytes(utf8Encode(key), utf8Encode(message))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function decodeJsonSegment<T>(segment: string): T {
  return JSON.parse(utf8Decode(base64UrlDecode(segment))) as T;
}

// ---------------------------------------------------------------- //
// JWT structure, HS256 signing and verification
// ---------------------------------------------------------------- //

export interface ParsedJwt {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
  signingInput: string;
}

export interface SignJwtOptions {
  header?: Partial<JwtHeader>;
  expiresInSeconds?: number;
  issuedAt?: number;
}

export function signJwt(payload: JwtPayload, secret: string, options: SignJwtOptions = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = {
    ...options.header,
    alg: 'HS256',
    typ: options.header?.typ ?? 'JWT',
  };
  const body: JwtPayload = { iat: options.issuedAt ?? now, ...payload };
  if (options.expiresInSeconds !== undefined) {
    body.exp = (options.issuedAt ?? now) + options.expiresInSeconds;
  }
  const signingInput = `${base64UrlEncode(utf8Encode(JSON.stringify(header)))}.${base64UrlEncode(
    utf8Encode(JSON.stringify(body))
  )}`;
  const signature = base64UrlEncode(hmacSha256Bytes(utf8Encode(secret), utf8Encode(signingInput)));
  return `${signingInput}.${signature}`;
}

export function parseJwtStructure(token: string): ParsedJwt {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT: expected three dot-separated sections.');
  let header: JwtHeader;
  let payload: JwtPayload;
  try {
    header = decodeJsonSegment<JwtHeader>(parts[0]);
  } catch {
    throw new Error('Malformed JWT header section.');
  }
  try {
    payload = decodeJsonSegment<JwtPayload>(parts[1]);
  } catch {
    throw new Error('Malformed JWT payload section.');
  }
  return {
    header,
    payload,
    signature: parts[2],
    signingInput: `${parts[0]}.${parts[1]}`,
  };
}

export function verifyJwt(
  token: string,
  secret: string,
  options: JwtVerifyOptions = {}
): JwtVerificationResult {
  const errors: string[] = [];
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, payload: null, errors: ['Malformed JWT: expected three sections.'] };
  }

  let header: JwtHeader;
  try {
    header = decodeJsonSegment<JwtHeader>(parts[0]);
  } catch {
    return { valid: false, payload: null, errors: ['Malformed JWT header section.'] };
  }
  if (header.alg !== 'HS256') {
    errors.push(`Unsupported algorithm "${header.alg}"; only HS256 is accepted.`);
  }

  let payload: JwtPayload;
  try {
    payload = decodeJsonSegment<JwtPayload>(parts[1]);
  } catch {
    return { valid: false, payload: null, errors: ['Malformed JWT payload section.'] };
  }

  const expected = hmacSha256Bytes(utf8Encode(secret), utf8Encode(`${parts[0]}.${parts[1]}`));
  let actual: Uint8Array;
  try {
    actual = base64UrlDecode(parts[2]);
  } catch {
    errors.push('Malformed JWT signature section.');
    return { valid: false, payload, errors };
  }
  if (!constantTimeEqual(expected, actual)) {
    errors.push('Signature verification failed: token signature does not match.');
  }

  const now = Math.floor((options.now ?? Date.now()) / 1000);
  const skew = options.clockSkewSeconds ?? 60;

  if (typeof payload.exp === 'number' && now > payload.exp + skew) {
    errors.push('Token expired: exp claim is in the past.');
  }
  if (typeof payload.iat === 'number' && payload.iat > now + skew) {
    errors.push('Token issued in the future: iat claim is ahead of the clock.');
  }
  if (typeof payload.nbf === 'number' && now + skew < payload.nbf) {
    errors.push('Token not yet valid: nbf claim is in the future.');
  }
  if (options.issuer !== undefined && payload.iss !== options.issuer) {
    errors.push(`Issuer mismatch: expected "${options.issuer}".`);
  }
  if (options.audience !== undefined) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(options.audience)) {
      errors.push(`Audience mismatch: expected "${options.audience}".`);
    }
  }

  return { valid: errors.length === 0, payload, errors };
}

// ---------------------------------------------------------------- //
// OIDC third-party-initiated login
// ---------------------------------------------------------------- //

const DEFAULT_STATE_TTL_SECONDS = 600;
const CLOCK_GRACE_SECONDS = 5;

function randomToken(prefix: string): string {
  const segment = (): string => Math.random().toString(36).slice(2, 12);
  return `${prefix}_${Date.now().toString(36)}${segment()}${segment()}`;
}

export function createOidcLoginRequest(
  params: OidcLoginParams,
  options: { now?: number; ttlSeconds?: number } = {}
): OidcLoginStart {
  const issuedAt = Math.floor((options.now ?? Date.now()) / 1000);
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_STATE_TTL_SECONDS;
  const nonce = randomToken('nonce');
  const state = [nonce, String(issuedAt), String(ttlSeconds), randomToken('st')].join('.');

  const query = new URLSearchParams({
    scope: 'openid lti',
    response_type: 'id_token',
    response_mode: 'form_post',
    prompt: 'none',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    login_hint: params.loginHint ?? '',
    state,
    nonce,
    target_link_uri: params.targetLinkUri,
  });
  if (params.deploymentId) query.set('deployment_id', params.deploymentId);
  if (params.ltiMessageHint) query.set('lti_message_hint', params.ltiMessageHint);

  const separator = params.authorizationEndpoint.includes('?') ? '&' : '?';
  return {
    state,
    nonce,
    authRequestUrl: `${params.authorizationEndpoint}${separator}${query.toString()}`,
    issuedAt,
    ttlSeconds,
  };
}

export function validateOidcState(
  state: string,
  expected: { nonce: string; now?: number; ttlSeconds?: number }
): OidcStateValidation {
  const errors: string[] = [];
  const parts = state.split('.');

  if (parts.length !== 4) {
    errors.push('Malformed OIDC state: expected four dot-separated segments.');
    return { valid: false, errors };
  }

  const [nonce, issuedAtRaw, ttlRaw] = parts;
  const issuedAt = Number(issuedAtRaw);
  const ttl = Number(ttlRaw);

  if (!Number.isFinite(issuedAt) || !Number.isFinite(ttl) || ttl <= 0) {
    errors.push('Malformed OIDC state timestamps.');
  } else {
    const now = Math.floor((expected.now ?? Date.now()) / 1000);
    const effectiveTtl = expected.ttlSeconds ?? ttl;
    if (now - issuedAt > effectiveTtl + CLOCK_GRACE_SECONDS) {
      errors.push('OIDC state expired: replay window elapsed.');
    }
    if (issuedAt - now > CLOCK_GRACE_SECONDS) {
      errors.push('OIDC state issued in the future.');
    }
  }

  if (nonce !== expected.nonce) {
    errors.push('OIDC state nonce mismatch.');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------- //
// Deep Linking response + resource-link content items
// ---------------------------------------------------------------- //

export function createResourceLinkContentItem(options: {
  title?: string;
  url?: string;
  text?: string;
  lineItem?: AgsLineItemClaim;
  iframe?: { width?: number; height?: number };
}): DeepLinkContentItem {
  const candidate: DeepLinkContentItem = { type: 'ltiResourceLink', ...options };
  return DeepLinkContentItemSchema.parse(candidate);
}

export function createLinkContentItem(url: string, title?: string): DeepLinkContentItem {
  return DeepLinkContentItemSchema.parse({ type: 'link', url, title });
}

export function buildDeepLinkingResponseJwt(
  params: DeepLinkingResponseParams,
  secret: string
): string {
  const contentItems = params.contentItems.map((item) => DeepLinkContentItemSchema.parse(item));
  const now = Math.floor((params.issuedAt ?? Date.now()) / 1000);

  const payload: JwtPayload = {
    iss: params.clientId,
    aud: params.platformIssuer,
    nonce: params.nonce,
    iat: now,
    exp: now + (params.expiresInSeconds ?? 300),
    [`${LTI_CLAIM_PREFIX}message_type`]: 'LtiDeepLinkingResponse',
    [`${LTI_CLAIM_PREFIX}version`]: '1.3.0',
    [`${LTI_CLAIM_PREFIX}deployment_id`]: params.deploymentId,
    [`${LTI_DL_CLAIM_PREFIX}deep_link_return_url`]: params.returnUrl,
    [`${LTI_DL_CLAIM_PREFIX}content_items`]: contentItems,
  };
  if (params.data !== undefined) {
    payload[`${LTI_DL_CLAIM_PREFIX}data`] = params.data;
  }

  return signJwt(payload, secret, { header: { typ: 'JWT' } });
}

// ---------------------------------------------------------------- //
// AGS grade passback payload builders
// ---------------------------------------------------------------- //

export const AGS_SCOPES = [AGS_SCOPE_LINEITEM, AGS_SCOPE_RESULT, AGS_SCOPE_SCORE] as const;

export function buildGradePassbackLineItem(params: AgsLineItemClaim): AgsLineItemClaim {
  const parsed = AgsLineItemClaimSchema.parse(params);
  if (parsed.startDateTime && parsed.endDateTime) {
    if (Date.parse(parsed.startDateTime) >= Date.parse(parsed.endDateTime)) {
      throw new Error('Line item startDateTime must be before endDateTime.');
    }
  }
  return parsed;
}

export function buildScoreSubmission(
  input: Omit<AgsScore, 'timestamp'> & { timestamp?: string }
): AgsScore {
  const payload: AgsScore = {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
  const parsed = AgsScoreSchema.parse(payload);
  if (parsed.scoreGiven > parsed.scoreMaximum) {
    throw new Error('scoreGiven cannot exceed scoreMaximum.');
  }
  return parsed;
}

export function buildResourceLinkLaunchClaims(options: {
  clientId: string;
  platformIssuer: string;
  deploymentId: string;
  userId: string;
  nonce: string;
  resourceLinkId: string;
  contextId?: string;
  roles: string[];
  lineItem?: AgsLineItemClaim;
  issuedAt?: number;
  expiresInSeconds?: number;
}): JwtPayload {
  const now = Math.floor((options.issuedAt ?? Date.now()) / 1000);
  const payload: JwtPayload = {
    iss: options.clientId,
    aud: options.platformIssuer,
    sub: options.userId,
    nonce: options.nonce,
    iat: now,
    exp: now + (options.expiresInSeconds ?? 300),
    [`${LTI_CLAIM_PREFIX}message_type`]: 'LtiResourceLinkRequest',
    [`${LTI_CLAIM_PREFIX}version`]: '1.3.0',
    [`${LTI_CLAIM_PREFIX}deployment_id`]: options.deploymentId,
    [`${LTI_CLAIM_PREFIX}roles`]: options.roles,
    [`${LTI_CLAIM_PREFIX}resource_link`]: { id: options.resourceLinkId },
  };
  if (options.contextId) {
    payload[`${LTI_CLAIM_PREFIX}context`] = { id: options.contextId };
  }
  if (options.lineItem) {
    payload[`${LTI_DL_CLAIM_PREFIX}lineitem`] = options.lineItem;
  }
  return payload;
}

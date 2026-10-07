import { describe, it, expect } from 'vitest';
import {
  base64UrlDecode,
  base64UrlEncode,
  buildDeepLinkingResponseJwt,
  buildGradePassbackLineItem,
  buildResourceLinkLaunchClaims,
  buildScoreSubmission,
  createOidcLoginRequest,
  createResourceLinkContentItem,
  hmacSha256Hex,
  parseJwtStructure,
  sha256Hex,
  signJwt,
  utf8Decode,
  utf8Encode,
  validateOidcState,
  verifyJwt,
} from '../services/lti13Service';

const SECRET = 'REMOVED_TEST_SECRET';

describe('UTF-8 and base64url primitives', () => {
  it('round-trips UTF-8 strings including emoji and combining characters', () => {
    const text = 'Karibu 🎓 Kenya — école';
    expect(utf8Decode(utf8Encode(text))).toBe(text);
  });

  it('round-trips base64url without padding or illegal characters', () => {
    const encoded = base64UrlEncode(utf8Encode('any+value/needs?padding='));

    expect(encoded).not.toMatch(/[+/=\s]/);
    expect(utf8Decode(base64UrlDecode(encoded))).toBe('any+value/needs?padding=');
  });

  it('produces the published SHA-256 digests for empty and abc input', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('derives an HMAC-SHA256 that depends on key and message', () => {
    expect(hmacSha256Hex(SECRET, 'header.payload')).toHaveLength(64);
    expect(hmacSha256Hex(SECRET, 'header.payload')).toBe(
      hmacSha256Hex(SECRET, 'header.payload')
    );
    expect(hmacSha256Hex(SECRET, 'header.payload')).not.toBe(
      hmacSha256Hex('other-secret', 'header.payload')
    );
    expect(hmacSha256Hex(SECRET, 'header.payload')).not.toBe(
      hmacSha256Hex(SECRET, 'header.payload!')
    );
  });
});

describe('JWT signing and verification (HS256 from scratch)', () => {
  const payload = { sub: 'user-1', iss: 'https://platform.example.com', exp: 2000000000 };

  it('signs a compact JWS with three base64url segments', () => {
    const jwt = signJwt(payload, SECRET);

    expect(jwt.split('.')).toHaveLength(3);
    expect(jwt).not.toMatch(/[+/=\s]/);
    expect(parseJwtStructure(jwt).header.alg).toBe('HS256');
  });

  it('verifies a signature produced with the same key', () => {
    const jwt = signJwt(payload, SECRET);
    const result = verifyJwt(jwt, SECRET, { issuer: 'https://platform.example.com' });

    expect(result.valid).toBe(true);
    expect(result.payload?.sub).toBe('user-1');
    expect(result.errors).toEqual([]);
  });

  it('rejects tampered payloads and wrong keys', () => {
    const jwt = signJwt(payload, SECRET);
    const [header, body, signature] = jwt.split('.');
    const tamperedBody = base64UrlEncode(
      utf8Encode(utf8Decode(base64UrlDecode(body)).replace('user-1', 'user-2'))
    );

    const tampered = verifyJwt(`${header}.${tamperedBody}.${signature}`, SECRET);
    expect(tampered.valid).toBe(false);
    expect(tampered.errors.join(' ')).toMatch(/signature/i);

    expect(verifyJwt(jwt, 'other-key').valid).toBe(false);
    expect(verifyJwt(`${header}.${body}.`, SECRET).valid).toBe(false);
    expect(verifyJwt('not-a-jwt', SECRET).valid).toBe(false);
  });

  it('rejects the alg:none algorithm', () => {
    const unsigned = `${base64UrlEncode(utf8Encode(JSON.stringify({ alg: 'none', typ: 'JWT' })))}.${base64UrlEncode(
      utf8Encode(JSON.stringify(payload))
    )}.`;
    const result = verifyJwt(unsigned, SECRET);

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/unsupported algorithm/i);
  });

  it('enforces expiry and not-before windows with configurable clock skew', () => {
    const expired = signJwt({ ...payload, exp: 1000000000 }, SECRET);
    expect(verifyJwt(expired, SECRET).errors.join(' ')).toMatch(/expired/i);

    const future = signJwt({ sub: 'u', nbf: 2000000000, iat: 2000000000 }, SECRET);
    expect(verifyJwt(future, SECRET).valid).toBe(false);

    const now = Math.floor(Date.now() / 1000);
    const nearlyExpired = signJwt({ sub: 'u', exp: now - 30 }, SECRET);
    expect(verifyJwt(nearlyExpired, SECRET, { clockSkewSeconds: 60 }).valid).toBe(true);
    expect(verifyJwt(nearlyExpired, SECRET, { clockSkewSeconds: 0 }).valid).toBe(false);
  });

  it('validates issuer and audience when expected values are supplied', () => {
    const jwt = signJwt({ sub: 'u', aud: ['client-a'] }, SECRET);

    expect(verifyJwt(jwt, SECRET, { issuer: 'https://other.example' }).valid).toBe(false);
    expect(verifyJwt(jwt, SECRET, { audience: 'client-a' }).valid).toBe(true);
    expect(verifyJwt(jwt, SECRET, { audience: 'client-b' }).valid).toBe(false);
    expect(
      verifyJwt(jwt, SECRET, { audience: 'client-a', issuer: 'https://wrong.example' }).valid
    ).toBe(false);
  });

  it('parses token structure without verifying the signature', () => {
    const structure = parseJwtStructure(signJwt(payload, SECRET));

    expect(structure.payload.sub).toBe('user-1');
    expect(structure.signature).toHaveLength(43);
    expect(structure.signingInput.split('.')).toHaveLength(2);
    expect(() => parseJwtStructure('a.b')).toThrow(/malformed/i);
    expect(() => parseJwtStructure('a.b.c.d')).toThrow(/malformed/i);
  });
});

describe('OIDC third-party initiated login', () => {
  const params = {
    authorizationEndpoint: 'https://idp.example.edu/auth',
    clientId: 'client-123',
    deploymentId: 'dep-7',
    redirectUri: 'https://gradeglow.com/lti/callback',
    targetLinkUri: 'https://gradeglow.com/lti/launch',
    loginHint: 'amina@school.example',
    ltiMessageHint: 'hint-abc',
  };

  it('builds an auth request URL with every required OAuth parameter', () => {
    const start = createOidcLoginRequest(params);
    const url = new URL(start.authRequestUrl);

    expect(url.origin + url.pathname).toBe('https://idp.example.edu/auth');
    expect(url.searchParams.get('client_id')).toBe('client-123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://gradeglow.com/lti/callback');
    expect(url.searchParams.get('target_link_uri')).toBe('https://gradeglow.com/lti/launch');
    expect(url.searchParams.get('login_hint')).toBe('amina@school.example');
    expect(url.searchParams.get('lti_message_hint')).toBe('hint-abc');
    expect(url.searchParams.get('deployment_id')).toBe('dep-7');
    expect(url.searchParams.get('scope')).toBe('openid lti');
    expect(url.searchParams.get('response_type')).toBe('id_token');
    expect(url.searchParams.get('response_mode')).toBe('form_post');
    expect(url.searchParams.get('prompt')).toBe('none');
    expect(url.searchParams.get('state')).toBe(start.state);
    expect(url.searchParams.get('nonce')).toBe(start.nonce);
  });

  it('issues a four-segment state carrying the nonce and expiry timestamps', () => {
    const now = Date.now();
    const start = createOidcLoginRequest(params, { now, ttlSeconds: 600 });

    expect(start.state.split('.')).toHaveLength(4);
    expect(start.state.startsWith(`${start.nonce}.`)).toBe(true);
    expect(start.issuedAt).toBe(Math.floor(now / 1000));
    expect(start.ttlSeconds).toBe(600);
  });

  it('accepts a state that still matches its nonce inside the TTL', () => {
    const now = Date.now();
    const start = createOidcLoginRequest(params, { now });
    const result = validateOidcState(start.state, { nonce: start.nonce, now });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a state whose nonce was swapped out', () => {
    const now = Date.now();
    const start = createOidcLoginRequest(params, { now });
    const parts = start.state.split('.');
    parts[0] = 'attacker-nonce';

    const result = validateOidcState(parts.join('.'), { nonce: start.nonce, now });

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/nonce mismatch/i);
  });

  it('rejects malformed and expired states', () => {
    expect(validateOidcState('tampered', { nonce: 'n' }).valid).toBe(false);

    const stale = createOidcLoginRequest(params, {
      now: Date.now() - 700_000,
      ttlSeconds: 600,
    });
    const result = validateOidcState(stale.state, { nonce: stale.nonce });

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/expired/i);
  });
});

describe('deep linking content items', () => {
  it('creates a resource link content item with an LTI link', () => {
    const item = createResourceLinkContentItem({
      url: 'https://gradeglow.com/lti/link/assignment-9',
      title: 'Algebra Quiz 9',
      text: 'Chapter 9 practice quiz',
      iframe: { width: 800, height: 600 },
    });

    expect(item.type).toBe('ltiResourceLink');
    expect(item.url).toBe('https://gradeglow.com/lti/link/assignment-9');
    expect(item.title).toBe('Algebra Quiz 9');
    expect(item.text).toBe('Chapter 9 practice quiz');
    expect(item.iframe).toEqual({ width: 800, height: 600 });
  });

  it('attaches an AGS line item to a content item when provided', () => {
    const item = createResourceLinkContentItem({
      url: 'https://gradeglow.com/lti/link/quiz-2',
      title: 'Quiz 2',
      lineItem: { label: 'Quiz 2', scoreMaximum: 10, resourceId: 'cls-001-quiz2' },
    });

    expect(item.lineItem?.scoreMaximum).toBe(10);
    expect(item.lineItem?.resourceId).toBe('cls-001-quiz2');
  });

  it('rejects a content item with an invalid URL', () => {
    expect(() =>
      createResourceLinkContentItem({ url: 'not-a-url', title: 'Bad' })
    ).toThrow();
  });

  it('builds a deep linking response JWT that round-trips its content items', () => {
    const jwt = buildDeepLinkingResponseJwt(
      {
        clientId: 'client-123',
        platformIssuer: 'https://canvas.example.edu',
        deploymentId: 'dep-7',
        returnUrl: 'https://canvas.example.edu/deep_link',
        nonce: 'dl-nonce',
        data: 'deep-link-data-token',
        contentItems: [
          createResourceLinkContentItem({
            url: 'https://gradeglow.com/lti/link/x',
            title: 'X',
          }),
        ],
      },
      SECRET
    );
    const result = verifyJwt(jwt, SECRET, {
      issuer: 'client-123',
      audience: 'https://canvas.example.edu',
    });

    expect(result.valid).toBe(true);
    expect(result.payload?.['https://purl.imsglobal.org/spec/lti/claim/message_type']).toBe(
      'LtiDeepLinkingResponse'
    );
    expect(result.payload?.['https://purl.imsglobal.org/spec/lti/claim/deployment_id']).toBe('dep-7');
    expect(
      result.payload?.['https://purl.imsglobal.org/spec/lti-dl/claim/deep_link_return_url']
    ).toBe('https://canvas.example.edu/deep_link');
    expect(
      result.payload?.['https://purl.imsglobal.org/spec/lti-dl/claim/data']
    ).toBe('deep-link-data-token');
    const items = result.payload?.['https://purl.imsglobal.org/spec/lti-dl/claim/content_items'];
    expect(Array.isArray(items)).toBe(true);
    expect((items as unknown[])[0]).toMatchObject({ type: 'ltiResourceLink', title: 'X' });
  });
});

describe('resource link launch claims', () => {
  it('populates every mandatory LTI 1.3 claim', () => {
    const claims = buildResourceLinkLaunchClaims({
      clientId: 'https://gradeglow.com',
      platformIssuer: 'client-123',
      deploymentId: 'dep-7',
      userId: 'usr-001',
      nonce: 'nonce-1',
      resourceLinkId: 'rl-55',
      contextId: 'cls-001',
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
    });

    expect(claims['https://purl.imsglobal.org/spec/lti/claim/message_type']).toBe(
      'LtiResourceLinkRequest'
    );
    expect(claims['https://purl.imsglobal.org/spec/lti/claim/version']).toBe('1.3.0');
    expect(claims['https://purl.imsglobal.org/spec/lti/claim/deployment_id']).toBe('dep-7');
    expect(claims['https://purl.imsglobal.org/spec/lti/claim/roles']).toEqual([
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    ]);
    expect(claims['https://purl.imsglobal.org/spec/lti/claim/resource_link']).toMatchObject({
      id: 'rl-55',
    });
    expect(claims['https://purl.imsglobal.org/spec/lti/claim/context']).toMatchObject({
      id: 'cls-001',
    });
    expect(claims.sub).toBe('usr-001');
    expect(claims.iss).toBe('https://gradeglow.com');
    expect(claims.aud).toBe('client-123');
    expect(claims.nonce).toBe('nonce-1');
    expect(typeof claims.iat).toBe('number');
    expect(typeof claims.exp).toBe('number');
  });

  it('omits the context claim when no context id is supplied', () => {
    const claims = buildResourceLinkLaunchClaims({
      clientId: 'client',
      platformIssuer: 'platform',
      deploymentId: 'dep-1',
      userId: 'usr-9',
      nonce: 'n',
      resourceLinkId: 'rl-1',
      roles: [],
    });

    expect(claims['https://purl.imsglobal.org/spec/lti/claim/context']).toBeUndefined();
  });

  it('signs launch claims into a token the verifier accepts', () => {
    const claims = buildResourceLinkLaunchClaims({
      clientId: 'client-123',
      platformIssuer: 'https://canvas.example.edu',
      deploymentId: 'dep-7',
      userId: 'usr-001',
      nonce: 'nonce-1',
      resourceLinkId: 'rl-55',
      roles: [],
    });
    const jwt = signJwt(claims, SECRET);
    const result = verifyJwt(jwt, SECRET, {
      issuer: 'client-123',
      audience: 'https://canvas.example.edu',
    });

    expect(result.valid).toBe(true);
    expect(result.payload?.sub).toBe('usr-001');
  });
});

describe('assignment and grade service (AGS) payloads', () => {
  it('builds a score submission for the AGS score endpoint', () => {
    const submission = buildScoreSubmission({
      userId: 'usr-001',
      scoreGiven: 8.5,
      scoreMaximum: 10,
      activityProgress: 'Completed',
      gradingProgress: 'Ready',
      timestamp: '2026-10-07T12:00:00.000Z',
      comment: 'Great work',
    });

    expect(submission.userId).toBe('usr-001');
    expect(submission.scoreGiven).toBe(8.5);
    expect(submission.scoreMaximum).toBe(10);
    expect(submission.activityProgress).toBe('Completed');
    expect(submission.gradingProgress).toBe('Ready');
    expect(submission.timestamp).toBe('2026-10-07T12:00:00.000Z');
    expect(submission.comment).toBe('Great work');
    expect(submission.scoreGiven / submission.scoreMaximum).toBeCloseTo(0.85);
  });

  it('defaults the timestamp when it is not supplied', () => {
    const submission = buildScoreSubmission({
      userId: 'usr-002',
      scoreGiven: 3,
      scoreMaximum: 5,
      activityProgress: 'Submitted',
      gradingProgress: 'Pending',
    });

    expect(Date.parse(submission.timestamp)).not.toBeNaN();
  });

  it('rejects out-of-bounds scores and invalid progress enums', () => {
    expect(() =>
      buildScoreSubmission({
        userId: 'u',
        scoreGiven: 11,
        scoreMaximum: 10,
        activityProgress: 'Completed',
        gradingProgress: 'Ready',
      })
    ).toThrow(/scoreGiven cannot exceed scoreMaximum/i);

    expect(() =>
      buildScoreSubmission({
        userId: 'u',
        scoreGiven: -1,
        scoreMaximum: 10,
        activityProgress: 'Completed',
        gradingProgress: 'Ready',
      })
    ).toThrow();

    expect(() =>
      buildScoreSubmission({
        userId: 'u',
        scoreGiven: 5,
        scoreMaximum: 10,
        activityProgress: 'Bogus' as never,
        gradingProgress: 'Ready',
      })
    ).toThrow();
  });

  it('builds an AGS line item definition with score bounds and resource id', () => {
    const lineItem = buildGradePassbackLineItem({
      resourceId: 'cls-001-quiz9',
      label: 'Algebra Quiz 9',
      scoreMaximum: 20,
      tag: 'formative',
      startDateTime: '2026-10-01T00:00:00.000Z',
      endDateTime: '2026-10-31T23:59:00.000Z',
    });

    expect(lineItem.resourceId).toBe('cls-001-quiz9');
    expect(lineItem.label).toBe('Algebra Quiz 9');
    expect(lineItem.scoreMaximum).toBe(20);
    expect(lineItem.tag).toBe('formative');
    expect(lineItem.startDateTime).toBe('2026-10-01T00:00:00.000Z');
    expect(lineItem.endDateTime).toBe('2026-10-31T23:59:00.000Z');
  });

  it('rejects invalid line items', () => {
    expect(() =>
      buildGradePassbackLineItem({ label: '', scoreMaximum: 10 })
    ).toThrow();
    expect(() =>
      buildGradePassbackLineItem({ label: 'Q', scoreMaximum: 0 })
    ).toThrow();
    expect(() =>
      buildGradePassbackLineItem({
        label: 'Q',
        scoreMaximum: 10,
        startDateTime: '2026-10-31T00:00:00.000Z',
        endDateTime: '2026-10-01T00:00:00.000Z',
      })
    ).toThrow(/before endDateTime/i);
  });
});

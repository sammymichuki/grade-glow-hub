import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  CACHE_NAMES,
  CacheLike,
  CacheStorageLike,
  apiOfflineResponse,
  cacheFirst,
  networkFirst,
  registerServiceWorker,
  resolveRoute,
  routeRequest,
  staleWhileRevalidate,
  unregisterServiceWorker,
} from '../services/serviceWorkerRegistration';

const reqUrl = 'https://school.example.com/assets/lesson1.pdf';
const req = (url: string = reqUrl): Request => new Request(url);

const keyOf = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

class FakeCache implements CacheLike {
  private readonly store = new Map<string, Response>();

  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    return this.store.get(keyOf(request));
  }

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    this.store.set(keyOf(request), response.clone());
  }
}

class FakeCacheStorage implements CacheStorageLike {
  private readonly entries = new Map<string, FakeCache>();

  async open(name: string): Promise<CacheLike> {
    if (!this.entries.has(name)) this.entries.set(name, new FakeCache());
    return this.entries.get(name)!;
  }

  async has(name: string): Promise<boolean> {
    return this.entries.has(name);
  }

  async delete(name: string): Promise<boolean> {
    return this.entries.delete(name);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.entries.keys());
  }
}

const makeEnv = (fetchImpl: (request: Request) => Promise<Response>, caches = new FakeCacheStorage()) => ({
  fetch: fetchImpl,
  caches,
});

const text = async (response: Response): Promise<string> => response.clone().text();

describe('staleWhileRevalidate', () => {
  it('serves the cached response without hitting the network', async () => {
    const caches = new FakeCacheStorage();
    await (await caches.open('c')).put(req(), new Response('cached body', { status: 200 }));

    const fetchImpl = async (): Promise<Response> => {
      throw new Error('network must not be consulted');
    };
    const response = await staleWhileRevalidate(req(), 'c', makeEnv(fetchImpl, caches));
    expect(await text(response)).toBe('cached body');
  });

  it('fetches and stores a cacheable miss', async () => {
    const caches = new FakeCacheStorage();
    const response = await staleWhileRevalidate(
      req(),
      'c',
      makeEnv(async () => new Response('fresh body', { status: 200 }), caches)
    );
    expect(await text(response)).toBe('fresh body');
    const hit = await (await caches.open('c')).match(req());
    expect(hit).toBeDefined();
    expect(await (hit as Response).clone().text()).toBe('fresh body');
  });

  it('refuses to cache error responses', async () => {
    const caches = new FakeCacheStorage();
    const response = await staleWhileRevalidate(
      req(),
      'c',
      makeEnv(async () => new Response('boom', { status: 500 }), caches)
    );
    expect(response.status).toBe(500);
    expect(await (await caches.open('c')).match(req())).toBeUndefined();
  });
});

describe('networkFirst', () => {
  it('prefers the network response and caches it for later', async () => {
    const caches = new FakeCacheStorage();
    const env = makeEnv(async () => new Response('live', { status: 200 }), caches);
    const response = await networkFirst(req(), { timeoutMs: 400, fallbackCache: 'fb' }, env);
    expect(await text(response)).toBe('live');
    expect(await (await caches.open('fb')).match(req())).toBeDefined();
  });

  it('falls back to the cache when the network request fails', async () => {
    const env = makeEnv(async () => {
      throw new Error('offline');
    });
    await (await env.caches.open('fb')).put(req(), new Response('stale', { status: 200 }));
    const response = await networkFirst(req(), { timeoutMs: 400, fallbackCache: 'fb' }, env);
    expect(await text(response)).toBe('stale');
  });

  it('surfaces the error when offline and nothing is cached', async () => {
    const env = makeEnv(async () => {
      throw new Error('offline');
    });
    await expect(networkFirst(req(), { timeoutMs: 400, fallbackCache: 'fb' }, env)).rejects.toThrow(/offline/);
  });

  it('times out and serves the stale copy on a silent pipe', async () => {
    const env = makeEnv(() => new Promise<Response>(() => {}));
    await (await env.caches.open('fb')).put(req(), new Response('slow-channel copy', { status: 200 }));
    const response = await networkFirst(req(), { timeoutMs: 30, fallbackCache: 'fb' }, env);
    expect(await text(response)).toBe('slow-channel copy');
  });

  it('rejects non-positive timeouts', async () => {
    await expect(
      networkFirst(req(), { timeoutMs: 0, fallbackCache: 'fb' }, makeEnv(async () => new Response()))
    ).rejects.toThrow(/positive/);
  });
});

describe('cacheFirst', () => {
  it('returns the cached copy without fetching', async () => {
    const env = makeEnv(async () => {
      throw new Error('fetch must not run');
    });
    await (await env.caches.open('static')).put(req(), new Response('cached asset', { status: 200 }));
    const response = await cacheFirst(req(), 'static', env);
    expect(await text(response)).toBe('cached asset');
  });

  it('fetches and stores on a miss', async () => {
    const env = makeEnv(async () => new Response('downloaded', { status: 200 }));
    const response = await cacheFirst(req(), 'static', env);
    expect(await text(response)).toBe('downloaded');
    expect(await (await env.caches.open('static')).match(req())).toBeDefined();
  });
});

describe('request routing', () => {
  it('routes api traffic to network-first with offline queueing', () => {
    const decision = routeRequest('/api/sync/changes?since=3');
    expect(decision).toEqual({
      strategy: 'network-first',
      cacheName: CACHE_NAMES.api,
      offlineQueue: true,
      ruleId: 'api',
    });
  });

  it('routes quiz submissions to the quiz cache', () => {
    const rule = resolveRoute('/submissions/attempt-9');
    expect(rule?.id).toBe('quiz-submissions');
    expect(routeRequest('/submissions/attempt-9').cacheName).toBe(CACHE_NAMES.quiz);
  });

  it('routes font assets to cache-first', () => {
    const decision = routeRequest('/fonts/roboto.woff2');
    expect(decision.strategy).toBe('cache-first');
    expect(decision.offlineQueue).toBe(false);
  });

  it('routes lesson media to stale-while-revalidate', () => {
    const decision = routeRequest('/lessons/fractions/lesson.pdf');
    expect(decision.strategy).toBe('stale-while-revalidate');
    expect(decision.cacheName).toBe(CACHE_NAMES.lessons);
  });

  it('routes navigations to a network-first pages fallback', () => {
    const decision = routeRequest('/dashboard', true);
    expect(decision.strategy).toBe('network-first');
    expect(decision.cacheName).toBe(CACHE_NAMES.pages);
    expect(decision.ruleId).toBe('navigation');
  });

  it('routes unknown non-navigation requests to the default static cache', () => {
    const decision = routeRequest('/mystery-path', false);
    expect(decision.strategy).toBe('cache-first');
    expect(decision.ruleId).toBe('default-static');
  });
});

describe('apiOfflineResponse', () => {
  it('returns a 503 JSON body with the offline-queue marker', async () => {
    const response = apiOfflineResponse('/api/sync/changes');
    expect(response.status).toBe(503);
    expect(response.headers.get('X-Offline-Queue')).toBe('true');
    expect(response.headers.get('Content-Type')).toContain('application/json');
    const body = (await response.json()) as { queued: boolean; path: string };
    expect(body.queued).toBe(true);
    expect(body.path).toBe('/api/sync/changes');
  });
});

const fakeRegistration = {
  waiting: null,
  installing: null,
  active: null,
  scope: '/',
  unregister: (): Promise<boolean> => Promise.resolve(true),
  addEventListener: (): void => undefined,
};

afterEach(() => {
  delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
});

describe('registerServiceWorker', () => {
  it('returns null when the browser has no service worker API', async () => {
    expect(await registerServiceWorker()).toBeNull();
  });

  it('registers the script and notifies update observers on a new activation', async () => {
    const postMessage = vi.fn();
    const stateChanges: Array<() => void> = [];
    const updateFound: Array<(event?: unknown) => void> = [];
    const installing = {
      state: 'installing',
      postMessage,
      addEventListener: (_type: string, cb: () => void): void => {
        stateChanges.push(cb);
      },
    };
    const registration: typeof fakeRegistration & {
      waiting: { postMessage: (msg: unknown) => void } | null;
      installing: typeof installing;
      addEventListener: (type: string, cb: (event?: unknown) => void) => void;
    } = {
      ...fakeRegistration,
      installing,
      waiting: null,
      addEventListener: (type, cb) => {
        updateFound[type] = cb;
      },
    };
    const container = {
      register: vi.fn().mockResolvedValue(registration),
      getRegistrations: vi.fn().mockResolvedValue([registration]),
      controller: {},
      addEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container });

    const handle = await registerServiceWorker({ scriptUrl: '/sw.js' });
    expect(handle).not.toBeNull();
    expect(container.register).toHaveBeenCalledWith('/sw.js', undefined);

    const listener = vi.fn();
    const unsubscribe = handle!.onUpdateAvailable(listener);

    updateFound.updatefound?.({});
    installing.state = 'installed';
    stateChanges[0]?.();

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as { applyUpdate: () => void };
    expect(typeof event.applyUpdate).toBe('function');

    unsubscribe();
    updateFound.updatefound?.({});
    stateChanges[1]?.();
    expect(listener).toHaveBeenCalledTimes(1);

    registration.waiting = { postMessage };
    handle!.applyUpdate();
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('unregisters all registered workers', async () => {
    const registration = { ...fakeRegistration };
    const container = {
      register: vi.fn(),
      getRegistrations: vi.fn().mockResolvedValue([registration]),
      controller: null,
      addEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container });
    expect(await unregisterServiceWorker()).toBe(true);
  });

  it('returns false when no worker registration exists', async () => {
    const container = {
      register: vi.fn(),
      getRegistrations: vi.fn().mockResolvedValue([]),
      controller: null,
      addEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container });
    expect(await unregisterServiceWorker()).toBe(false);
  });
});
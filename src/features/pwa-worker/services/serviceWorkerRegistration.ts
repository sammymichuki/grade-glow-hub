export interface CacheLike {
  match(request: RequestInfo | URL, options?: { ignoreSearch?: boolean }): Promise<Response | undefined>;
  put(request: RequestInfo | URL, response: Response): Promise<void>;
}

export interface CacheStorageLike {
  open(cacheName: string): Promise<CacheLike>;
  has(cacheName: string): Promise<boolean>;
  delete(cacheName: string): Promise<boolean>;
  keys(): Promise<string[]>;
}

export interface StrategyEnv {
  fetch: (request: Request) => Promise<Response>;
  caches: CacheStorageLike;
}

export type StrategyName = 'stale-while-revalidate' | 'network-first' | 'cache-first';

export const SW_CACHE_VERSION = 'v1';

export const CACHE_NAMES = {
  precache: `gg-precache-${SW_CACHE_VERSION}`,
  pages: `gg-pages-${SW_CACHE_VERSION}`,
  lessons: `gg-lessons-${SW_CACHE_VERSION}`,
  quiz: `gg-quiz-${SW_CACHE_VERSION}`,
  static: `gg-static-${SW_CACHE_VERSION}`,
  api: `gg-api-${SW_CACHE_VERSION}`,
} as const;

export const PRECACHE_URLS = ['/', '/index.html'];

const liveEnv = (): StrategyEnv => {
  const cacheStorage = (globalThis as { caches?: CacheStorageLike }).caches;
  if (!cacheStorage) {
    throw new Error('CacheStorage is unavailable in this environment');
  }
  return {
    fetch: (request: Request) => globalThis.fetch(request),
    caches: cacheStorage,
  };
};

const isCacheable = (response: Response): boolean =>
  response.ok && response.status !== 206 && response.type !== 'opaque';

const cachePutQuietly = (cache: CacheLike, request: RequestInfo | URL, response: Response): void => {
  if (!isCacheable(response)) return;
  void cache.put(request, response.clone()).catch(() => undefined);
};

export const staleWhileRevalidate = async (
  request: Request,
  cacheName: string,
  env: StrategyEnv = liveEnv()
): Promise<Response> => {
  const cache = await env.caches.open(cacheName);
  const cached = await cache.match(request);

  const respondAndCache = async (): Promise<Response> => {
    const response = await env.fetch(request);
    cachePutQuietly(cache, request, response);
    return response;
  };

  if (cached) {
    void respondAndCache().catch(() => undefined);
    return cached;
  }
  return respondAndCache();
};

export interface NetworkFirstOptions {
  timeoutMs: number;
  fallbackCache: string;
}

export const networkFirst = async (
  request: Request,
  options: NetworkFirstOptions,
  env: StrategyEnv = liveEnv()
): Promise<Response> => {
  if (options.timeoutMs <= 0) throw new Error('timeoutMs must be positive');
  const fallback = await env.caches.open(options.fallbackCache);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const fetchPromise = env.fetch(request);
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Network-first timeout after ${options.timeoutMs}ms`));
    }, options.timeoutMs);
  });

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    cachePutQuietly(fallback, request, response);
    return response;
  } catch (error) {
    fetchPromise.catch(() => undefined);
    const cached = await fallback.match(request);
    if (cached) return cached;
    throw error;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};

export const cacheFirst = async (
  request: Request,
  cacheName: string,
  env: StrategyEnv = liveEnv()
): Promise<Response> => {
  const cache = await env.caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await env.fetch(request);
  cachePutQuietly(cache, request, response);
  return response;
};

export interface RouteRule {
  id: string;
  pattern: RegExp;
  strategy: StrategyName;
  cacheName: string;
  offlineQueue: boolean;
}

export const DEFAULT_ROUTE_RULES: RouteRule[] = [
  {
    id: 'api',
    pattern: /^\/api\//,
    strategy: 'network-first',
    cacheName: CACHE_NAMES.api,
    offlineQueue: true,
  },
  {
    id: 'quiz-submissions',
    pattern: /\/(quizzes?|submissions?|assessments?)(\/|$)/i,
    strategy: 'network-first',
    cacheName: CACHE_NAMES.quiz,
    offlineQueue: true,
  },
  {
    id: 'fonts-icons',
    pattern: /(\.(?:woff2?|ttf|otf|eot|ico)$|^\/(?:fonts|icons)\/)/i,
    strategy: 'cache-first',
    cacheName: CACHE_NAMES.static,
    offlineQueue: false,
  },
  {
    id: 'lessons-assets',
    pattern: /(\.(?:pdf|mp4|webm|ogg)$|^\/(?:lessons|courses|assets)\/)/i,
    strategy: 'stale-while-revalidate',
    cacheName: CACHE_NAMES.lessons,
    offlineQueue: false,
  },
];

export interface RouteDecision {
  strategy: StrategyName;
  cacheName: string;
  offlineQueue: boolean;
  ruleId: string;
}

export const resolveRoute = (
  pathname: string,
  rules: RouteRule[] = DEFAULT_ROUTE_RULES
): RouteRule | null => rules.find((rule) => rule.pattern.test(pathname)) ?? null;

export const routeRequest = (
  pathname: string,
  isNavigation = false,
  rules: RouteRule[] = DEFAULT_ROUTE_RULES
): RouteDecision => {
  const rule = resolveRoute(pathname, rules);
  if (rule) {
    return {
      strategy: rule.strategy,
      cacheName: rule.cacheName,
      offlineQueue: rule.offlineQueue,
      ruleId: rule.id,
    };
  }
  if (isNavigation) {
    return { strategy: 'network-first', cacheName: CACHE_NAMES.pages, offlineQueue: false, ruleId: 'navigation' };
  }
  return { strategy: 'cache-first', cacheName: CACHE_NAMES.static, offlineQueue: false, ruleId: 'default-static' };
};

export const apiOfflineResponse = (pathname: string): Response =>
  new Response(JSON.stringify({ error: 'offline', queued: true, path: pathname }), {
    status: 503,
    headers: { 'Content-Type': 'application/json', 'X-Offline-Queue': 'true' },
  });

export interface ServiceWorkerUpdateEvent {
  registration: ServiceWorkerRegistration;
  waiting: ServiceWorker | null;
  applyUpdate: () => void;
}

export interface RegisterOptions {
  scriptUrl?: string;
  scope?: string;
  reloadOnControllerChange?: boolean;
}

export interface RegistrationHandle {
  registration: ServiceWorkerRegistration;
  applyUpdate: () => void;
  unregister: () => Promise<boolean>;
  onUpdateAvailable: (listener: (event: ServiceWorkerUpdateEvent) => void) => () => void;
}

const defaultScriptUrl = (): string => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}sw.js`;
};

export const registerServiceWorker = async (
  options: RegisterOptions = {}
): Promise<RegistrationHandle | null> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  const scriptUrl = options.scriptUrl ?? defaultScriptUrl();
  const registration = await navigator.serviceWorker.register(
    scriptUrl,
    options.scope ? { scope: options.scope } : undefined
  );

  const listeners = new Set<(event: ServiceWorkerUpdateEvent) => void>();
  const applyUpdate = (): void => {
    const waiting = registration.waiting;
    if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
  };
  const notify = (): void => {
    const event: ServiceWorkerUpdateEvent = { registration, waiting: registration.waiting, applyUpdate };
    listeners.forEach((listener) => listener(event));
  };

  if (registration.waiting && navigator.serviceWorker.controller) notify();

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) notify();
    });
  });

  if (options.reloadOnControllerChange && typeof navigator.serviceWorker.addEventListener === 'function') {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  return {
    registration,
    applyUpdate,
    unregister: () => registration.unregister(),
    onUpdateAvailable: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  const registrations = await navigator.serviceWorker.getRegistrations();
  const results = await Promise.all(registrations.map((entry) => entry.unregister()));
  return results.some(Boolean);
};

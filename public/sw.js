'use strict';

/**
 * GradeGlow Hub service worker — offline-first shell for low-bandwidth networks.
 * Strategy core mirrors src/features/pwa-worker/services/serviceWorkerRegistration.ts.
 */

const SW_VERSION = 'v1';
const CACHE_NAMES = {
  precache: 'gg-precache-' + SW_VERSION,
  pages: 'gg-pages-' + SW_VERSION,
  lessons: 'gg-lessons-' + SW_VERSION,
  quiz: 'gg-quiz-' + SW_VERSION,
  static: 'gg-static-' + SW_VERSION,
  api: 'gg-api-' + SW_VERSION,
};
const KEEP_CACHES = Object.keys(CACHE_NAMES).map(function (key) {
  return CACHE_NAMES[key];
});

const DEFAULT_ROUTE_RULES = [
  { id: 'api', pattern: /^\/api\//, strategy: 'network-first', cacheName: CACHE_NAMES.api, offlineQueue: true },
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

function scopePath() {
  try {
    return new URL(self.registration.scope).pathname;
  } catch (error) {
    return '/';
  }
}

function precacheUrls() {
  const scope = scopePath();
  const urls = ['/', '/index.html', scope, scope + 'index.html'];
  const unique = [];
  for (const url of urls) {
    if (unique.indexOf(url) === -1) unique.push(url);
  }
  return unique;
}

function isCacheable(response) {
  return Boolean(response) && response.ok && response.status !== 206 && response.type !== 'opaque';
}

function cachePutQuietly(cache, request, response) {
  if (!isCacheable(response)) return;
  try {
    void cache.put(request, response.clone()).catch(function () {
      /* quota failures must never break a response */
    });
  } catch (error) {
    /* ignore synchronous cache errors */
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const respondAndCache = async function () {
    const response = await fetch(request);
    cachePutQuietly(cache, request, response);
    return response;
  };
  if (cached) {
    void respondAndCache().catch(function () {
      /* background revalidation is best-effort */
    });
    return cached;
  }
  return respondAndCache();
}

async function networkFirst(request, options) {
  const fallback = await caches.open(options.fallbackCache);
  let timeoutId;
  const fetchPromise = fetch(request);
  const timeoutPromise = new Promise(function (resolve, reject) {
    timeoutId = setTimeout(function () {
      reject(new Error('Network-first timeout after ' + options.timeoutMs + 'ms'));
    }, options.timeoutMs);
  });
  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    cachePutQuietly(fallback, request, response);
    return response;
  } catch (error) {
    fetchPromise.catch(function () {
      /* already surfaced through the race */
    });
    const cached = await fallback.match(request);
    if (cached) return cached;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  cachePutQuietly(cache, request, response);
  return response;
}

function routeRequest(pathname, isNavigation) {
  for (const rule of DEFAULT_ROUTE_RULES) {
    if (rule.pattern.test(pathname)) {
      return {
        strategy: rule.strategy,
        cacheName: rule.cacheName,
        offlineQueue: rule.offlineQueue,
        ruleId: rule.id,
      };
    }
  }
  if (isNavigation) {
    return { strategy: 'network-first', cacheName: CACHE_NAMES.pages, offlineQueue: false, ruleId: 'navigation' };
  }
  return { strategy: 'cache-first', cacheName: CACHE_NAMES.static, offlineQueue: false, ruleId: 'default-static' };
}

function apiOfflineResponse(pathname) {
  return new Response(JSON.stringify({ error: 'offline', queued: true, path: pathname }), {
    status: 503,
    headers: { 'Content-Type': 'application/json', 'X-Offline-Queue': 'true' },
  });
}

async function navigationShell() {
  const shell = (await caches.match('/index.html')) || (await caches.match(scopePath() + 'index.html'));
  if (shell) return shell;
  return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}

async function handleFetch(request, url) {
  const isNavigation = request.mode === 'navigate';
  const decision = routeRequest(url.pathname, isNavigation);
  try {
    if (decision.strategy === 'cache-first') {
      return await cacheFirst(request, decision.cacheName);
    }
    if (decision.strategy === 'stale-while-revalidate') {
      return await staleWhileRevalidate(request, decision.cacheName);
    }
    try {
      return await networkFirst(request, { timeoutMs: 4000, fallbackCache: decision.cacheName });
    } catch (error) {
      if (decision.offlineQueue) return apiOfflineResponse(url.pathname);
      throw error;
    }
  } catch (error) {
    const fallback = await caches.match(request, { ignoreSearch: false });
    if (fallback) return fallback;
    if (isNavigation) return navigationShell();
    return apiOfflineResponse(url.pathname);
  }
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAMES.precache)
      .then(function (cache) {
        return Promise.all(
          precacheUrls().map(function (url) {
            return fetch(new Request(url, { cache: 'reload' }))
              .then(function (response) {
                if (!response.ok) throw new Error('Precache failed: ' + url);
                return cache.put(url, response);
              })
              .catch(function (error) {
                console.warn('[sw] precache skipped for', url, error && error.message);
              });
          })
        );
      })
      .catch(function () {
        /* install must not hard-fail on storage pressure */
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return KEEP_CACHES.indexOf(key) === -1;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
      .catch(function () {
        /* activation continues even if cleanup fails */
      })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (!request || request.method !== 'GET') return;
  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(handleFetch(request, url));
});

self.addEventListener('message', function (event) {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'PURGE_CACHES') {
    const purge = caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            return caches.delete(key);
          })
        );
      })
      .then(function () {
        return caches.open(CACHE_NAMES.precache);
      })
      .then(function (cache) {
        return cache.addAll(precacheUrls()).catch(function () {
          /* re-precach on next install if offline */
        });
      })
      .then(function () {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ type: 'PURGED', version: SW_VERSION });
        }
      });
    if (event.waitUntil) event.waitUntil(purge);
  }
});

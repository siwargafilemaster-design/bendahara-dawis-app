// ══════════════════════════════════════════════
//  SERVICE WORKER — Bendahara Dawis (manual, v4)
//  Network-first halaman + cache-first aset (dengan .catch anti-freeze)
// ══════════════════════════════════════════════

const CACHE = 'dawis-v4';

const SHELL = [
  '/',
  '/iuran',
  '/kas',
  '/rekap',
  '/rekap/anggota',
  '/kategori',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-gamersi.png',
];

// ── INSTALL ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((url) => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nama) => Promise.all(
        nama.filter((n) => n !== CACHE).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ──
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1) DATA & API — jangan sentuh, selalu ke jaringan asli.
  if (
    e.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('fonnte')
  ) {
    return;
  }

  // 2) ASET STATIS BER-HASH — cache-first + .catch (anti-freeze)
  const asetStatis =
    url.pathname.startsWith('/_next/') ||
    /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/i.test(url.pathname);

  if (asetStatis) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request)
          .then((res) => {
            const salinan = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, salinan));
            return res;
          })
          .catch(() =>
            new Response('', { status: 504, statusText: 'Offline' })
          );
      })
    );
    return;
  }

  // 3) HALAMAN / NAVIGASI — network-first
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const salinan = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, salinan));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached || caches.match('/'))
      )
  );
});
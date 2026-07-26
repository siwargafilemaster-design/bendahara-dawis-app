// ── VERSI CACHE ──
const CACHE = 'dawis-v3';   // naikkan ke v3 → activate bersihkan v2

// ── APP SHELL ──
const SHELL = [
  '/',
  '/iuran',
  '/rekap',
  '/rekap/anggota',
  '/kas',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-gamersi.png',
];

// ── INSTALL ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(SHELL.map((url) => c.add(url)))
    ).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((nama) =>
      Promise.all(nama.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ──
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1) JANGAN sentuh data & API — selalu ke jaringan asli.
  if (
    e.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('fonnte')
  ) {
    return;
  }

  // 2) ASET STATIS BER-HASH (/_next/, gambar, ikon) → CACHE-FIRST.
  //    Nama ber-hash = immutable; aman dari cache selamanya, tak akan basi.
  //    Ini yang MENYELESAIKAN cold-start blank: JS Next selalu ada di cache,
  //    diambil duluan dari cache, tak bergantung jaringan.
  const asetStatis =
    url.pathname.startsWith('/_next/') ||
    /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/i.test(url.pathname);

  if (asetStatis) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;               // ada di cache → pakai
        return fetch(e.request).then((res) => {  // belum → ambil & simpan
          const salinan = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, salinan));
          return res;
        });
      })
    );
    return;
  }

  // 3) HALAMAN / NAVIGASI → NETWORK-FIRST.
  //    Selalu coba versi terbaru (app sering di-deploy); offline → cache;
  //    kalau navigasi & tak ada di cache → fallback ke '/' (app shell).
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const salinan = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, salinan));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) =>
          cached || caches.match('/')
        )
      )
  );
});
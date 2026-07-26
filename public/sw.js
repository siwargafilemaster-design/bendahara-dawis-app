// ── VERSI CACHE ──
// Ganti angka ini tiap deploy yang mengubah app shell.
// Nama cache berubah → 'activate' menghapus yang lama → pengguna dapat versi baru.
const CACHE = 'dawis-v2';

// ── APP SHELL ──
// Yang di-cache saat install. Cukup kerangka; Next.js punya banyak file
// hash yang tak bisa didaftar manual — itu di-cache saat 'fetch' (lihat bawah).
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

// ── MOMEN 1: INSTALL ──
// Dipanggil sekali saat SW pertama didaftarkan / versinya berubah.
// Isi cache dengan shell. skipWaiting() → versi baru langsung aktif,
// tak menunggu semua tab lama ditutup.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(SHELL.map((url) => c.add(url)))
    ).then(() => self.skipWaiting())
  );
});

// ── MOMEN 2: ACTIVATE ──
// Dipanggil saat SW baru mengambil alih. Hapus cache versi lama
// (nama ≠ CACHE sekarang), biar storage tak menumpuk tiap update.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((nama) =>
      Promise.all(nama.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// ── MOMEN 3: FETCH ──
// Dipanggil tiap app minta sesuatu. Di sinilah keputusan cache-vs-jaringan.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1) JANGAN sentuh data & API. Selalu ke jaringan asli.
  //    Supabase, Fonnte route, dan semua non-GET (POST/PATCH) lewat begitu saja.
  if (
    e.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('fonnte')
  ) {
    return; // biarkan browser tangani normal — TIDAK di-cache
  }

  // 2) Untuk app shell & aset: coba jaringan dulu, jatuh ke cache kalau gagal.
  //    "Network-first" → selalu dapat versi terbaru kalau online,
  //    tetap jalan kalau offline. Pas untuk app yang sering di-deploy.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // simpan salinan segar ke cache (untuk offline berikutnya)
        const salinan = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, salinan));
        return res;
      })
      .catch(() =>
        // offline → sajikan dari cache; kalau navigasi & tak ada, fallback ke '/'
        caches.match(e.request).then((cached) => cached || caches.match('/'))
      )
  );
});
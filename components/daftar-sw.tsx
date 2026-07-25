'use client';
import { useEffect } from 'react';

export default function DaftarSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return; // browser lama — abaikan

    // daftarkan setelah load, biar tak menghambat render pertama
    const daftar = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW gagal daftar:', err);
      });
    };

    if (document.readyState === 'complete') daftar();
    else window.addEventListener('load', daftar);
    return () => window.removeEventListener('load', daftar);
  }, []);

  return null; // tak menggambar apa-apa
}
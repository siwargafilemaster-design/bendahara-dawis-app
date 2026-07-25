'use client';
import { useEffect, useState } from 'react';

type Status = 'cek' | 'aktif' | 'putus' | 'offline';

export default function FonnteBadge() {
  const [status, setStatus] = useState<Status>('cek');

  async function cek() {
    if (!navigator.onLine) { setStatus('offline'); return; }
    try {
      const r = await fetch('/api/fonnte-status');
      const d = await r.json();
      setStatus(d.aktif ? 'aktif' : 'putus');
    } catch {
      setStatus('offline');
    }
  }

  useEffect(() => {
    cek();
    const on = () => cek();
    const off = () => setStatus('offline');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const iv = setInterval(cek, 30_000);        // cek ulang berkala
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      clearInterval(iv);
    };
  }, []);

  // aktif → badge hijau tipis (tenang, tidak mencolok)
  // putus → merah (perlu tindakan)
  // offline → abu (bukan salah Fonnte, cuma tak bisa cek)
  // cek → jangan tampilkan apa-apa (hindari kedip saat load)
  if (status === 'cek') return null;

  const gaya = {
    aktif:   { bg: '#E3F1E8', br: '#BFE3CC', tx: '#1F5138', dot: 'var(--paid)',  teks: 'WhatsApp tersambung' },
    putus:   { bg: '#FAE7E3', br: '#F0C4BC', tx: 'var(--brick)', dot: 'var(--brick)', teks: 'WhatsApp terputus — resi tak terkirim. Cek Perangkat Tertaut.' },
    offline: { bg: '#F1F1EE', br: '#DDE0DA', tx: 'var(--muted)', dot: 'var(--muted)', teks: 'Status WhatsApp tak bisa dicek (offline)' },
  }[status];

  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold"
      style={{ background: gaya.bg, border: `1px solid ${gaya.br}`, color: gaya.tx }}>
      <span className="w-2 h-2 rounded-full flex-none" style={{ background: gaya.dot }} />
      {gaya.teks}
    </div>
  );
}
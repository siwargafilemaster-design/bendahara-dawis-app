'use client';
import { useEffect, useState } from 'react';
import { jumlahAntrian, prosesOutbox } from '@/lib/outbox';

export default function SyncBadge() {
  const [n, setN] = useState(0);
  const [online, setOnline] = useState(true);

  async function refresh() { setN(await jumlahAntrian()); }

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    const iv = setInterval(refresh, 3000);        // pantau antrian
    const on = () => { setOnline(true); prosesOutbox().then(refresh); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { clearInterval(iv); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (n === 0 && online) return null;

  return (
    <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2 text-[11px] font-bold"
      style={{ background: n > 0 ? '#FBF6E7' : '#E3F1E8',
        border: `1px solid ${n > 0 ? '#EBDCAF' : '#BFE3CC'}`,
        color: n > 0 ? '#6B5615' : '#1F5138' }}>
      <span className="w-2 h-2 rounded-full flex-none"
        style={{ background: online ? 'var(--paid)' : 'var(--gold)' }} />
      {!online && n > 0 && `${n} belum terkirim · menunggu sinyal`}
      {!online && n === 0 && 'Mode offline'}
      {online && n > 0 && `Mengirim ${n}…`}
    </div>
  );
}
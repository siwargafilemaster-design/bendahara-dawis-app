'use client';
import { useEffect, useState } from 'react';
import { petiTertahan, batalkanPeti, kirimSemuaTertahan } from '@/lib/resi';
import { jumlahAntrian } from '@/lib/outbox';

export default function PetiResi() {
  const [tertahan, setTertahan] = useState<string[]>([]);
  const [detik, setDetik] = useState(60);

  async function refresh() {
    // GERBANG LOKAL: cek outbox lokal (Dexie/IndexedDB — gratis, TAK sentuh Supabase).
    // 99% waktu outbox kosong → berhenti di sini tanpa query database.
    // Query Supabase HANYA saat benar-benar ada aktivitas resi.
    const antri = await jumlahAntrian();
    if (antri === 0) {
      if (tertahan.length !== 0) setTertahan([]);
      return;
    }
    setTertahan(await petiTertahan());
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 10000);   // 2 detik → 10 detik
    return () => clearInterval(iv);
  }, []);

  // hitung mundur visual (reset tiap jumlah tertahan berubah)
  useEffect(() => {
    if (tertahan.length === 0) { setDetik(60); return; }
    setDetik(60);
    const iv = setInterval(() => setDetik(d => Math.max(0, d - 1)), 1000);
    return () => clearInterval(iv);
  }, [tertahan.length]);

  if (tertahan.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl p-3"
      style={{ background: '#FBF6E7', border: '1px solid #EBDCAF' }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-extrabold" style={{ color: '#6B5615' }}>
            {tertahan.length} resi akan dikirim
          </div>
          <div className="text-[10.5px]" style={{ color: '#8A7320' }}>
            dalam {detik} detik · ketuk batal kalau ada yang salah
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={async () => { await batalkanPeti(); refresh(); }}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
            style={{ background: '#fff', border: '1px solid #EBDCAF', color: 'var(--brick)' }}>
            Batal
          </button>
          <button onClick={async () => { await kirimSemuaTertahan(); refresh(); }}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
            style={{ background: 'var(--brand)' }}>
            Kirim sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { namaBulan } from '@/lib/periode';
import { urutRumah } from '@/lib/urut';

type Warga = {
  id: string; no_rumah: string; nama_kk: string; no_wa: string;
  tgl_gabung: string; tgl_keluar: string | null;
  periode_awal: string; periode_akhir: string | null;
};

export default function AnggotaList() {
  const [data, setData] = useState<Warga[]>([]);
  const [muat, setMuat] = useState(true);
  const [err, setErr] = useState('');

  const ambil = useCallback(async () => {
    const { data, error } = await supabase.from('warga').select('*');
    if (error) setErr(error.message);
    else setData([...(data ?? [])].sort(urutRumah));   // ← selalu terurut
    setMuat(false);
  }, []);

  useEffect(() => { ambil(); }, [ambil]);

  // muat ulang saat halaman kembali terlihat (balik dari detail)
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) ambil(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', ambil);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', ambil);
    };
  }, [ambil]);

  const aktif = data.filter(w => !w.tgl_keluar);
  const keluar = data.filter(w => w.tgl_keluar);

  const Baris = ({ w, redup }: { w: Warga; redup?: boolean }) => (
    <Link href={`/anggota/${w.id}`}
      className="flex items-center gap-3 p-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--line)', opacity: redup ? 0.55 : 1 }}>
      <span className="w-8 h-8 rounded-lg grid place-items-center text-[10px] font-bold flex-none"
        style={{ background: 'var(--paper)', color: 'var(--muted)' }}>{w.no_rumah}</span>
      <span className="flex-1 min-w-0">
        <b className="block text-[12.5px] font-bold truncate">{w.nama_kk}</b>
        <span className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
          {redup
            ? `${namaBulan(w.periode_awal)} – ${w.periode_akhir ? namaBulan(w.periode_akhir) : '?'}`
            : `sejak ${namaBulan(w.periode_awal)}`}
        </span>
      </span>
      <span style={{ color: 'var(--line)' }}>›</span>
    </Link>
  );

  if (muat) return <div className="p-4" style={{ color: 'var(--muted)' }}>Memuat…</div>;
  if (err) return <div className="p-4 text-[13px]" style={{ color: 'var(--brick)' }}>Gagal memuat: {err}</div>;

  return (
    <div className="p-4 pb-24">
      <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
        style={{ color: 'var(--muted)' }}>
        {aktif.length} aktif{keluar.length ? ` · ${keluar.length} sudah keluar` : ''}
      </div>

      {aktif.length === 0 ? (
        <div className="rounded-2xl bg-white border p-8 text-center"
          style={{ borderColor: 'var(--line)' }}>
          <p className="text-[13px] font-bold mb-1">Belum ada anggota</p>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            Ketuk tombol + untuk mulai menambah.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
          {aktif.map(w => <Baris key={w.id} w={w} />)}
        </div>
      )}

      {keluar.length > 0 && (
        <>
          <div className="text-[10px] font-extrabold tracking-widest uppercase mt-5 mb-2"
            style={{ color: 'var(--muted)' }}>Sudah keluar</div>
          <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
            {keluar.map(w => <Baris key={w.id} w={w} redup />)}
          </div>
        </>
      )}

      <Link href="/anggota/baru"
        className="fixed right-4 bottom-6 w-14 h-14 rounded-2xl grid place-items-center text-white text-2xl font-light z-20"
        style={{ background: 'var(--brand)', boxShadow: '0 8px 22px rgba(31,81,56,.4)' }}>
        +
      </Link>
    </div>
  );
}
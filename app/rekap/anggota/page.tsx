'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { urutRumah } from '@/lib/urut';

type W = { id: string; no_rumah: string; nama_kk: string; tgl_keluar: string | null };

export default function RekapAnggota() {
  const [data, setData] = useState<W[]>([]);
  const [muat, setMuat] = useState(true);

  const ambil = useCallback(async () => {
    const { data } = await supabase.from('warga').select('id,no_rumah,nama_kk,tgl_keluar');
    setData([...(data ?? [])].sort(urutRumah));
    setMuat(false);
  }, []);
  useEffect(() => { ambil(); }, [ambil]);

  const aktif = data.filter(w => !w.tgl_keluar);
  const keluar = data.filter(w => w.tgl_keluar);

  const Baris = ({ w, redup }: { w: W; redup?: boolean }) => (
    <Link href={`/rekap/anggota/${w.id}`}
      className="flex items-center gap-3 p-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--line)', opacity: redup ? 0.55 : 1 }}>
      <span className="w-8 h-8 rounded-lg grid place-items-center text-[10px] font-bold flex-none"
        style={{ background: 'var(--paper)', color: 'var(--muted)' }}>{w.no_rumah}</span>
      <span className="flex-1 text-[12.5px] font-bold truncate">{w.nama_kk}</span>
      <span style={{ color: 'var(--line)' }}>›</span>
    </Link>
  );

  if (muat) return <div className="p-4" style={{ color: 'var(--muted)' }}>Memuat…</div>;

  return (
    <div className="p-4 pb-24">
      <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
        style={{ color: 'var(--muted)' }}>Kartu Iuran per KK · pilih anggota</div>
      <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
        {aktif.map(w => <Baris key={w.id} w={w} />)}
      </div>
      {keluar.length > 0 && (
        <>
          <div className="text-[10px] font-extrabold tracking-widest uppercase mt-5 mb-2"
            style={{ color: 'var(--muted)' }}>Sudah keluar</div>
          <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
            {keluar.map(w => <Baris key={w.id} w={w} redup />)}
          </div>
        </>
      )}
    </div>
  );
}
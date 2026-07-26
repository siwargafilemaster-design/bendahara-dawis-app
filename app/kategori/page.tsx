'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Kat = { id: string; nama: string; urutan: number; aktif: boolean };

export default function Kategori() {
  const [data, setData] = useState<Kat[]>([]);
  const [baru, setBaru] = useState('');
  const [pesan, setPesan] = useState('');

  const muat = useCallback(async () => {
    const { data } = await supabase.from('kategori').select('*').order('urutan');
    setData((data ?? []) as Kat[]);
  }, []);
  useEffect(() => { muat(); }, [muat]);

  async function tambah() {
    const nama = baru.trim();
    if (!nama) return;
    const urutan = (data.at(-1)?.urutan ?? 0) + 1;
    const { error } = await supabase.from('kategori').insert({ nama, urutan, aktif: true });
    if (error) return setPesan(error.code === '23505' ? 'Kategori itu sudah ada' : 'Gagal: ' + error.message);
    setBaru(''); setPesan(''); muat();
  }

  async function toggle(k: Kat) {
    await supabase.from('kategori').update({ aktif: !k.aktif }).eq('id', k.id);
    muat();
  }

  const F = 'flex-1 p-3 rounded-xl border bg-white text-[14px] font-bold';

  return (
    <div className="p-4 pb-24">
      <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
        style={{ color: 'var(--muted)' }}>Kategori pengeluaran</div>

      {/* tambah */}
      <div className="flex gap-2 mb-4">
        <input className={F} style={{ borderColor: 'var(--line)' }}
          placeholder="Kategori baru…" value={baru}
          onChange={e => setBaru(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tambah()} />
        <button onClick={tambah}
          className="px-4 rounded-xl text-white font-bold text-[13px]"
          style={{ background: 'var(--brand)' }}>Tambah</button>
      </div>
      {pesan && <p className="text-[12px] mb-3" style={{ color: 'var(--brick)' }}>{pesan}</p>}

      {/* daftar */}
      <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
        {data.map((k, i) => (
          <div key={k.id} className="flex items-center gap-3 p-3.5"
            style={{ borderBottom: i < data.length - 1 ? '1px solid var(--line)' : 'none', opacity: k.aktif ? 1 : 0.5 }}>
            <span className="flex-1 text-[13px] font-bold">
              {k.nama}
              {!k.aktif && <span className="ml-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--paper)', color: 'var(--muted)' }}>NONAKTIF</span>}
            </span>
            <button onClick={() => toggle(k)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--line)', color: k.aktif ? 'var(--brick)' : 'var(--brand)' }}>
              {k.aktif ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-[10.5px] text-center mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
        Kategori yang dinonaktifkan tidak muncul saat catat pengeluaran baru,
        tapi transaksi lama tetap utuh. Bisa diaktifkan lagi kapan saja.
      </p>
    </div>
  );
}
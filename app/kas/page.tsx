'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { rupiah } from '@/lib/uang';
import SheetKas from '@/components/sheet-kas';

type Baris = {
  id: string; tanggal: string; nominal: number; kantong: string;
  catatan: string | null; foto_url: string | null;
  kategori: { nama: string } | null;
};

export default function Kas() {
  const [rows, setRows] = useState<Baris[]>([]);
  const [sheet, setSheet] = useState(false);

  async function muat() {
    const { data } = await supabase.from('transaksi')
      .select('id,tanggal,nominal,kantong,catatan,foto_url, kategori:kategori_id(nama)')
      .eq('jenis', 'keluar').eq('dibatalkan', false)
      .order('tanggal', { ascending: false });
    setRows((data ?? []) as any);
  }
  useEffect(() => { muat(); }, []);

  const total = rows.reduce((s, r) => s + r.nominal, 0);

  return (
    <div className="p-4 pb-24">
      <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
        style={{ color: 'var(--muted)' }}>Pengeluaran</div>

      <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
        {rows.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-3 border-b last:border-b-0"
            style={{ borderColor: 'var(--line)' }}>
            <span className="w-8 h-8 rounded-lg grid place-items-center flex-none text-[13px] font-bold"
              style={{ background: '#FAE7E3', color: 'var(--brick)' }}>↑</span>
            <div className="flex-1 min-w-0">
              <b className="block text-[12.5px] truncate">{r.kategori?.nama ?? 'Lain'}</b>
              <span className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
                {r.tanggal} · {r.kantong === 'dana' ? 'DANA' : 'Tunai'}
                {r.foto_url ? ' · 📎' : ''}{r.catatan ? ` · ${r.catatan}` : ''}
              </span>
            </div>
            <span className="text-[12.5px] font-bold num" style={{ color: 'var(--brick)' }}>
              −{r.nominal.toLocaleString('id-ID')}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            Belum ada pengeluaran.
          </p>
        )}
        {rows.length > 0 && (
          <div className="flex justify-between p-3 text-[12.5px]" style={{ background: '#F4F8F5' }}>
            <span className="font-semibold" style={{ color: 'var(--muted)' }}>Total keluar</span>
            <b className="num" style={{ color: 'var(--brand)' }}>{rupiah(total)}</b>
          </div>
        )}
      </div>

      <button onClick={() => setSheet(true)}
        className="fixed right-4 bottom-24 w-14 h-14 rounded-2xl grid place-items-center text-white text-2xl z-20"
        style={{ background: 'var(--brand)', boxShadow: '0 8px 22px rgba(31,81,56,.4)' }}>+</button>

      {sheet && <SheetKas onTutup={() => setSheet(false)} onSelesai={() => { setSheet(false); muat(); }} />}
    </div>
  );
}
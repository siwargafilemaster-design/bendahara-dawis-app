'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { rupiah } from '@/lib/uang';
import SheetKas from '@/components/sheet-kas';

type Baris = {
  id: string; tanggal: string; nominal: number; kantong: string;
  catatan: string | null; foto_url: string | null;
  kategori: { nama: string } | null;
};

type Tab = 'keluar' | 'masuk';

export default function Kas() {
  const [tab, setTab] = useState<Tab>('keluar');
  const [rows, setRows] = useState<Baris[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [sheet, setSheet] = useState(false);

  const muat = useCallback(async () => {
    if (!navigator.onLine) { setOffline(true); return; }
    try {
      let q = supabase.from('transaksi')
        .select('id,tanggal,nominal,kantong,catatan,foto_url, kategori:kategori_id(nama)')
        .eq('jenis', tab).eq('dibatalkan', false);
      // pemasukan lain = masuk TANPA warga (iuran selalu punya warga)
      if (tab === 'masuk') q = q.is('warga_id', null);
      const { data } = await q.order('tanggal', { ascending: false });
      setRows((data ?? []) as any);
      setOffline(false);
    } catch { setOffline(true); }
  }, [tab]);

  useEffect(() => {
    muat();
    const on = () => muat();
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [muat]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) muat();
    });
    return () => sub.subscription.unsubscribe();
  }, [muat]);

  function gantiTab(t: Tab) {
    if (t === tab) return;
    setRows(null);          // tampil "Memuat…" sebentar, bukan data tab lain
    setTab(t);
  }

  const masuk = tab === 'masuk';
  const total = (rows ?? []).reduce((s, r) => s + r.nominal, 0);

  return (
    <div className="p-4 pb-24">
      {/* tab */}
      <div className="flex bg-white border rounded-xl p-1 mb-3" style={{ borderColor: 'var(--line)' }}>
        {([['keluar', 'Pengeluaran'], ['masuk', 'Pemasukan Lain']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => gantiTab(t)}
            className="flex-1 py-2 rounded-lg text-[12px] font-extrabold"
            style={{ background: tab === t ? 'var(--brand)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--muted)' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
        {rows && rows.length > 0 && rows.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-3 border-b last:border-b-0"
            style={{ borderColor: 'var(--line)' }}>
            <span className="w-8 h-8 rounded-lg grid place-items-center flex-none text-[13px] font-bold"
              style={{ background: masuk ? '#E3F1E8' : '#FAE7E3',
                color: masuk ? 'var(--paid)' : 'var(--brick)' }}>{masuk ? '↓' : '↑'}</span>
            <div className="flex-1 min-w-0">
              <b className="block text-[12.5px] truncate">{r.kategori?.nama ?? 'Lain'}</b>
              <span className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
                {r.tanggal} · {r.kantong === 'dana' ? 'DANA' : 'Tunai'}
                {r.foto_url ? ' · 📎' : ''}{r.catatan ? ` · ${r.catatan}` : ''}
              </span>
            </div>
            <span className="text-[12.5px] font-bold num"
              style={{ color: masuk ? 'var(--paid)' : 'var(--brick)' }}>
              {masuk ? '+' : '−'}{r.nominal.toLocaleString('id-ID')}
            </span>
          </div>
        ))}

        {offline && (!rows || rows.length === 0) && (
          <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            Kamu sedang offline.<br />Sambungkan internet untuk melihat {masuk ? 'pemasukan' : 'pengeluaran'}.
          </p>
        )}
        {!offline && rows && rows.length === 0 && (
          <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            {masuk ? 'Belum ada pemasukan lain.' : 'Belum ada pengeluaran.'}
          </p>
        )}
        {!offline && rows === null && (
          <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>Memuat…</p>
        )}

        {rows && rows.length > 0 && (
          <div className="flex justify-between p-3 text-[12.5px]" style={{ background: '#F4F8F5' }}>
            <span className="font-semibold" style={{ color: 'var(--muted)' }}>
              {masuk ? 'Total pemasukan lain' : 'Total keluar'}
            </span>
            <b className="num" style={{ color: 'var(--brand)' }}>{rupiah(total)}</b>
          </div>
        )}
      </div>

      {/* tombol + mengikuti tab aktif */}
      <button onClick={() => setSheet(true)}
        className="fixed right-4 bottom-24 w-14 h-14 rounded-2xl grid place-items-center text-white text-2xl z-20"
        style={{ background: 'var(--brand)', boxShadow: '0 8px 22px rgba(31,81,56,.4)' }}>+</button>

      {sheet && <SheetKas jenis={tab}
        onTutup={() => setSheet(false)}
        onSelesai={() => { setSheet(false); muat(); }} />}
    </div>
  );
}
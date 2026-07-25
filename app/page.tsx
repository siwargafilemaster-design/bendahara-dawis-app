'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ambilPengaturan } from '@/lib/pengaturan';
import { hitungSaldo, saldoCache, Saldo } from '@/lib/saldo';
import { rupiah } from '@/lib/uang';
import { prosesOutbox } from '@/lib/outbox';
import SheetPindah from '@/components/sheet-pindah';
import SyncBadge from '@/components/sync-badge';
import PetiResi from '@/components/peti-resi';
import { kirimSemuaTertahan } from '@/lib/resi';
import FonnteBadge from '@/components/fonnte-badge';

type Trx = {
  id: string; jenis: string; nominal: number; kantong: string;
  periode: string | null; catatan: string | null; tanggal: string;
  warga: { no_rumah: string; nama_kk: string } | null;
};

export default function Beranda() {
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [trx, setTrx] = useState<Trx[] | null>(null);   // null = belum termuat
  const [offline, setOffline] = useState(false);
  const [pindah, setPindah] = useState(false);
  
  async function muat() {
    if (!navigator.onLine) { setOffline(true); return; }
    try {
      const p = await ambilPengaturan();
      setSaldo(await hitungSaldo(p));
      const { data } = await supabase.from('transaksi')
        .select('id,jenis,nominal,kantong,periode,catatan,tanggal, warga:warga_id(no_rumah,nama_kk)')
        .eq('dibatalkan', false)
        .order('created_at', { ascending: false }).limit(5);
      setTrx((data ?? []) as any);
      setOffline(false);
    } catch { setOffline(true); }
  }

useEffect(() => {
  saldoCache().then(s => { if (s) setSaldo(prev => prev ?? s); });
  prosesOutbox().then(muat);
  kirimSemuaTertahan(true);                    
  const on = () => { muat(); kirimSemuaTertahan(true); };
  window.addEventListener('online', on);
  return () => window.removeEventListener('online', on);
}, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) muat();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const warna = (j: string) => j === 'masuk' ? 'var(--paid)' : j === 'keluar' ? 'var(--brick)' : 'var(--muted)';
  const tanda = (j: string) => j === 'masuk' ? '+' : j === 'keluar' ? '−' : '';
  const bgIc = (j: string) => j === 'masuk' ? '#E3F1E8' : j === 'keluar' ? '#FAE7E3' : '#F5EEDA';
  const ikon = (j: string) => j === 'masuk' ? '↓' : j === 'keluar' ? '↑' : '⇄';

  return (
    <div className="p-4 pb-24">
      <div className="rounded-2xl p-4 text-white"
        style={{ background: 'linear-gradient(165deg,var(--brand),var(--brand-dk))' }}>
        <div className="text-[10px] font-extrabold tracking-widest uppercase"
          style={{ color: '#9BC3AC' }}>Saldo Kas</div>
        <div className="text-3xl font-extrabold mt-0.5 num">
          {saldo ? rupiah(saldo.total) : '—'}
        </div>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,.09)' }}>
            <div className="text-[9.5px] font-bold uppercase" style={{ color: '#9BC3AC' }}>Tunai</div>
            <div className="text-[14px] font-bold num">{saldo ? rupiah(saldo.tunai) : '—'}</div>
          </div>
          <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,.09)' }}>
            <div className="text-[9.5px] font-bold uppercase" style={{ color: '#9BC3AC' }}>DANA</div>
            <div className="text-[14px] font-bold num">{saldo ? rupiah(saldo.dana) : '—'}</div>
          </div>
        </div>
        <button onClick={() => setPindah(true)}
          className="w-full mt-2.5 py-2.5 rounded-xl text-[12.5px] font-bold"
          style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)' }}>
          ⇄ Pindah antar kantong
        </button>
      </div>

      <SyncBadge />
      <PetiResi />
      <FonnteBadge />

      <div className="text-[10px] font-extrabold tracking-widest uppercase mt-4 mb-2"
        style={{ color: 'var(--muted)' }}>Transaksi terakhir</div>
      <div className="rounded-2xl bg-white border" style={{ borderColor: 'var(--line)' }}>
        {trx && trx.length > 0 && trx.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 border-b last:border-b-0"
            style={{ borderColor: 'var(--line)' }}>
            <span className="w-8 h-8 rounded-lg grid place-items-center flex-none text-[13px] font-bold"
              style={{ background: bgIc(t.jenis), color: warna(t.jenis) }}>{ikon(t.jenis)}</span>
            <div className="flex-1 min-w-0">
              <b className="block text-[12.5px] truncate">
                {t.warga ? `${t.warga.no_rumah} · ${t.warga.nama_kk}`
                  : (t.catatan ?? (t.jenis === 'pindah' ? 'Pindah kantong' : 'Pengeluaran'))}
              </b>
              <span className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
                {t.periode ? `Iuran ${t.periode} · ` : ''}{t.kantong === 'dana' ? 'DANA' : 'Tunai'}
              </span>
            </div>
            <span className="text-[12.5px] font-bold num" style={{ color: warna(t.jenis) }}>
              {tanda(t.jenis)}{t.nominal.toLocaleString('id-ID')}
            </span>
          </div>
        ))}

        {/* tiga keadaan */}
        {offline && (!trx || trx.length === 0) && (
          <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            Kamu sedang offline.<br />Sambungkan internet untuk melihat transaksi terakhir.
          </p>
        )}
        {!offline && trx && trx.length === 0 && (
          <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
            Belum ada transaksi.
          </p>
        )}
        {!offline && trx === null && (
          <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>Memuat…</p>
        )}
      </div>

      {pindah && <SheetPindah onTutup={() => setPindah(false)} onSelesai={() => { setPindah(false); muat(); }} />}
    </div>
  );
}

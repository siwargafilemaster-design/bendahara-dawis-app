'use client';
import { useState } from 'react';
import { geser, namaBulan, Periode } from '@/lib/periode';
import { rupiah } from '@/lib/uang';
import { Kantong } from '@/lib/transaksi';

type Props = {
  nama: string;
  noRumah: string;
  periodeAwal: Periode;
  iuran: number;
  onTutup: () => void;
  onSimpan: (kantong: Kantong, jumlahBulan: number) => void;
};

export default function SheetIuran({ nama, noRumah, periodeAwal, iuran, onTutup, onSimpan }: Props) {
  const [kantong, setKantong] = useState<Kantong>('tunai');
  const [bulan, setBulan] = useState(1);

  const daftar = Array.from({ length: bulan }, (_, i) => geser(periodeAwal, i));
  const total = bulan * iuran;

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(10,20,15,.5)' }} onClick={onTutup} />
      <div className="fixed left-0 right-0 bottom-0 z-40 rounded-t-3xl p-4 safe-b"
        style={{ background: 'var(--paper)' }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--line)' }} />
        <h3 className="text-base font-extrabold">{noRumah} · {nama}</h3>
        <p className="text-[11.5px] mb-4" style={{ color: 'var(--muted)' }}>
          Iuran {namaBulan(periodeAwal)}
        </p>

        <label className="block text-[10px] font-extrabold tracking-widest uppercase mb-1.5"
          style={{ color: 'var(--muted)' }}>Kantong</label>
        <div className="flex gap-2 mb-4">
          {(['tunai', 'dana'] as Kantong[]).map(k => (
            <button key={k} onClick={() => setKantong(k)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border"
              style={{
                background: kantong === k ? 'var(--brand)' : 'var(--surface)',
                color: kantong === k ? '#fff' : 'var(--ink)',
                borderColor: kantong === k ? 'var(--brand)' : 'var(--line)',
              }}>
              {k === 'dana' ? 'DANA' : 'Tunai'}
            </button>
          ))}
        </div>

        <label className="block text-[10px] font-extrabold tracking-widest uppercase mb-1.5"
          style={{ color: 'var(--muted)' }}>Bayar untuk</label>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setBulan(b => Math.max(1, b - 1))}
            className="w-12 h-12 rounded-xl border text-2xl font-bold flex-none disabled:opacity-30"
            style={{ borderColor: 'var(--line)' }} disabled={bulan <= 1}>−</button>
          <div className="flex-1 text-center">
            <div className="text-2xl font-extrabold num">{bulan}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--muted)' }}>bulan</div>
          </div>
          <button onClick={() => setBulan(b => b + 1)}
            className="w-12 h-12 rounded-xl border text-2xl font-bold flex-none"
            style={{ borderColor: 'var(--line)' }}>+</button>
        </div>

        {bulan > 1 && (
          <p className="text-[11px] mb-3" style={{ color: 'var(--muted)' }}>
            {namaBulan(daftar[0])} – {namaBulan(daftar[bulan - 1])}
          </p>
        )}

        <button onClick={() => onSimpan(kantong, bulan)}
          className="w-full py-3 rounded-xl text-white font-bold"
          style={{ background: 'var(--brand)' }}>
          Simpan · {rupiah(total)}
        </button>
      </div>
    </>
  );
}
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

const PILIHAN = [1, 3, 6, 12];

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
        <div className="flex gap-2 mb-3">
          {PILIHAN.map(n => (
            <button key={n} onClick={() => setBulan(n)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border"
              style={{
                background: bulan === n ? 'var(--brand)' : 'var(--surface)',
                color: bulan === n ? '#fff' : 'var(--ink)',
                borderColor: bulan === n ? 'var(--brand)' : 'var(--line)',
              }}>
              {n} bln
            </button>
          ))}
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
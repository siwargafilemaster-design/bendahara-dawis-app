'use client';
import { useEffect, useState, useCallback } from 'react';
import { periodeSekarang, namaBulan, geser } from '@/lib/periode';
import { hitungRekap, Rekap } from '@/lib/rekap';
import { statusTutupBuku, tutupBuku, bukaBuku } from '@/lib/tutup-buku';
import { rupiah } from '@/lib/uang';
import { unduhPDF } from '@/lib/pdf';
import Link from 'next/link';

export default function RekapPage() {
  // default: bulan LALU (pertemuan bulan ini melaporkan bulan lalu)
  const [periode, setPeriode] = useState(geser(periodeSekarang(), -1));
  const [rekap, setRekap] = useState<Rekap | null>(null);
  const [terkunci, setTerkunci] = useState(false);
  const [offline, setOffline] = useState(false);
  const [buatPdf, setBuatPdf] = useState(false);

  const muat = useCallback(async () => {
    if (!navigator.onLine) { setOffline(true); setRekap(null); return; }
    try {
      setRekap(await hitungRekap(periode));
      setTerkunci(await statusTutupBuku(periode));
      setOffline(false);
    } catch { setOffline(true); }
  }, [periode]);

  useEffect(() => { muat(); }, [muat]);

  async function toggleKunci() {
    if (terkunci) {
      if (!confirm(`Buka kembali buku ${namaBulan(periode, true)}? Transaksi bulan ini bisa diubah lagi.`)) return;
      await bukaBuku(periode); setTerkunci(false);
    } else {
      if (!confirm(`Tutup buku ${namaBulan(periode, true)}? Bisa dibuka lagi nanti kalau perlu koreksi.`)) return;
      await tutupBuku(periode); setTerkunci(true);
    }
  }

  async function pdf() {
    if (!rekap) return;
    setBuatPdf(true);
    try { await unduhPDF(rekap); } finally { setBuatPdf(false); }
  }

  return (
    <div className="p-4 pb-24">
      {/* pemilih bulan */}
      <div className="flex items-center justify-between bg-white border rounded-xl p-2 mb-3"
        style={{ borderColor: 'var(--line)' }}>
        <button onClick={() => setPeriode(geser(periode, -1))}
          className="w-8 h-8 rounded-lg border" style={{ borderColor: 'var(--line)' }}>‹</button>
        <div className="text-center">
          <b className="text-sm">{namaBulan(periode, true)}</b>
          {terkunci && <span className="ml-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
            style={{ background: '#E3F1E8', color: 'var(--brand)' }}>TERKUNCI</span>}
        </div>
        <button onClick={() => setPeriode(geser(periode, 1))}
          disabled={periode >= periodeSekarang()}
          className="w-8 h-8 rounded-lg border disabled:opacity-30"
          style={{ borderColor: 'var(--line)' }}>›</button>
      </div>

      {offline && (
        <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>
          Kamu sedang offline.<br />Sambungkan internet untuk melihat rekap.
        </p>
      )}

      {!offline && !rekap && (
        <p className="p-6 text-center text-[12px]" style={{ color: 'var(--muted)' }}>Memuat…</p>
      )}

      {rekap && (
        <>
          {/* ringkasan */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-xl bg-white border p-3" style={{ borderColor: 'var(--line)' }}>
              <div className="text-[9px] font-extrabold uppercase" style={{ color: 'var(--muted)' }}>Masuk</div>
              <div className="text-[13px] font-extrabold num" style={{ color: 'var(--paid)' }}>{rupiah(rekap.totalMasuk)}</div>
            </div>
            <div className="rounded-xl bg-white border p-3" style={{ borderColor: 'var(--line)' }}>
              <div className="text-[9px] font-extrabold uppercase" style={{ color: 'var(--muted)' }}>Keluar</div>
              <div className="text-[13px] font-extrabold num" style={{ color: 'var(--brick)' }}>{rupiah(rekap.totalKeluar)}</div>
            </div>
            <div className="rounded-xl bg-white border p-3" style={{ borderColor: 'var(--line)' }}>
              <div className="text-[9px] font-extrabold uppercase" style={{ color: 'var(--muted)' }}>Saldo</div>
              <div className="text-[13px] font-extrabold num" style={{ color: 'var(--brand)' }}>{rupiah(rekap.saldoAkhir)}</div>
            </div>
          </div>

          {/* iuran masuk */}
          <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
            style={{ color: 'var(--muted)' }}>Iuran masuk · {rekap.jumlahBayar} KK</div>
          <div className="rounded-2xl bg-white border mb-3" style={{ borderColor: 'var(--line)' }}>
            {rekap.masuk.length === 0 ? (
              <p className="p-4 text-center text-[11px]" style={{ color: 'var(--muted)' }}>Belum ada iuran bulan ini.</p>
            ) : rekap.masuk.map((m, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 border-b last:border-b-0 text-[12px]"
                style={{ borderColor: 'var(--line)' }}>
                <span><b>{m.noRumah}</b> · {m.namaKK}</span>
                <span className="num" style={{ color: 'var(--paid)' }}>+{m.nominal.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          {/* pengeluaran */}
          <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
            style={{ color: 'var(--muted)' }}>Pengeluaran</div>
          <div className="rounded-2xl bg-white border mb-4" style={{ borderColor: 'var(--line)' }}>
            {rekap.keluar.length === 0 ? (
              <p className="p-4 text-center text-[11px]" style={{ color: 'var(--muted)' }}>Tak ada pengeluaran bulan ini.</p>
            ) : rekap.keluar.map((k, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 border-b last:border-b-0 text-[12px]"
                style={{ borderColor: 'var(--line)' }}>
                <span className="min-w-0"><b>{k.kategori}</b>{k.catatan ? <span style={{ color: 'var(--muted)' }}> · {k.catatan}</span> : ''}</span>
                <span className="num flex-none" style={{ color: 'var(--brick)' }}>−{k.nominal.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          {/* aksi */}
          <button onClick={pdf} disabled={buatPdf}
            className="w-full py-3 rounded-xl text-white font-bold mb-2 disabled:opacity-50"
            style={{ background: 'var(--brand)' }}>
            {buatPdf ? 'Membuat PDF…' : '📄 Unduh laporan PDF'}
          </button>
          <button onClick={toggleKunci}
            className="w-full py-3 rounded-xl border font-bold text-[13px]"
            style={{ borderColor: 'var(--line)', color: terkunci ? 'var(--brick)' : 'var(--brand)' }}>
            {terkunci ? 'Buka kembali buku bulan ini' : 'Tutup buku bulan ini'}
          </button>

          <Link href="/rekap/anggota"
            className="w-full py-3 rounded-xl border font-bold text-[13px] mt-2 flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--line)', color: 'var(--brand)' }}>
            📇 Kartu Iuran per KK
          </Link>
        </>
      )}
    </div>
  );
}
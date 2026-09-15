'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { susunLaporanTahunan, BarisTahunan } from '@/lib/kartu';
import { ambilPengaturan } from '@/lib/pengaturan';
import { rupiah } from '@/lib/uang';

const NAMA_BL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function LaporanTahunan() {
  const router = useRouter();
  const tahun = new Date().getFullYear();
  const [baris, setBaris] = useState<BarisTahunan[]>([]);
  const [namaDawis, setNamaDawis] = useState('Dasa Wisma');
  const [alamat, setAlamat] = useState('');
  const [muat, setMuat] = useState(true);
  const [unduh, setUnduh] = useState(false);

  useEffect(() => {
    (async () => {
      const peng = await ambilPengaturan();
      setNamaDawis(peng['nama_dawis'] ?? 'Dasa Wisma');
      setAlamat(peng['alamat'] ?? '');
      setBaris(await susunLaporanTahunan(tahun));
      setMuat(false);
    })();
  }, [tahun]);

  async function unduhPdf() {
    setUnduh(true);
    try {
      const { unduhLaporanTahunan } = await import('@/lib/pdf');
      await unduhLaporanTahunan(tahun);
    } finally {
      setUnduh(false);
    }
  }

  const gaya = (s: string) => {
    if (s === 'lunas') return { background: 'var(--paid)', color: '#fff' };
    if (s === 'nunggak') return { background: '#FBECEA', color: 'var(--brick)' };
    if (s === 'luar') return { background: '#F4F5F3', color: '#C2C9C4' };
    return { background: '#fff', color: 'var(--line)' };
  };
  const simbol = (s: string) =>
    s === 'lunas' ? '✓' : s === 'nunggak' ? 'X' : s === 'luar' ? '–' : '';

  return (
    <div className="p-4 pb-24">
      {/* header halaman: kembali + unduh (lokal, tak sentuh nav.tsx) */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push('/rekap')}
          className="text-[12px] font-bold" style={{ color: 'var(--muted)' }}>
          ‹ Kembali
        </button>
        <button onClick={unduhPdf} disabled={unduh || muat}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white font-bold text-[12px] disabled:opacity-50"
          style={{ background: 'var(--brand)' }}>
          <span>⬇</span> {unduh ? 'Menyiapkan…' : 'Unduh PDF'}
        </button>
      </div>

      {/* kop */}
      <div className="rounded-2xl bg-white border p-4 mb-4 text-center"
        style={{ borderColor: 'var(--line)' }}>
        <div className="text-[12px] font-extrabold">LAPORAN TAHUNAN IURAN</div>
        <div className="text-[11px] font-bold mt-1">{namaDawis}</div>
        {alamat && <div className="text-[9.5px] mt-0.5" style={{ color: 'var(--muted)' }}>{alamat}</div>}
        <div className="text-[11px] font-extrabold mt-2" style={{ color: 'var(--brand)' }}>Tahun {tahun}</div>
        <div className="text-[8.5px] mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
          ✓ Lunas &nbsp; X Nunggak &nbsp; (kosong) Belum jatuh tempo &nbsp; – Di luar masa
        </div>
      </div>

      {muat ? (
        <p className="text-center text-[12px] p-6" style={{ color: 'var(--muted)' }}>Memuat…</p>
      ) : (
        <>
          <p className="text-[10px] text-center mb-2" style={{ color: 'var(--muted)' }}>
            Geser ke samping untuk lihat semua bulan →
          </p>
          <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--line)' }}>
            <table className="text-[9.5px]" style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th className="px-1.5 py-2 text-white font-extrabold text-[8.5px]" style={{ background: 'var(--brand)' }}>No</th>
                  <th className="px-2 py-2 text-white font-extrabold text-[8.5px] text-left" style={{ background: 'var(--brand)' }}>Nama KK</th>
                  {NAMA_BL.map(b => (
                    <th key={b} className="px-1 py-2 text-white font-extrabold text-[8.5px]" style={{ background: 'var(--brand)' }}>{b}</th>
                  ))}
                  <th className="px-2 py-2 text-white font-extrabold text-[8.5px]" style={{ background: 'var(--brand)' }}>Total<br/>Nunggak</th>
                </tr>
              </thead>
              <tbody>
                {baris.map(b => (
                  <tr key={b.id} style={{ opacity: b.sudahKeluar ? 0.7 : 1 }}>
                    <td className="px-1.5 py-1.5 text-center font-extrabold border-t"
                      style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>{b.noRumah}</td>
                    <td className="px-2 py-1.5 font-bold border-t" style={{ borderColor: 'var(--line)' }}>{b.namaKK}</td>
                    {b.sel.map(s => (
                      <td key={s.bulan} className="px-1 py-1.5 text-center font-extrabold border-t"
                        style={{ borderColor: 'var(--line)', ...gaya(s.status) }}>{simbol(s.status)}</td>
                    ))}
                    <td className="px-2 py-1.5 text-right font-extrabold border-t"
                      style={{ borderColor: 'var(--line)', color: b.totalNunggak > 0 ? 'var(--brick)' : 'var(--muted)' }}>
                      {b.totalNunggak > 0 ? rupiah(b.totalNunggak) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-center mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
            Baris pudar = anggota yang sudah keluar tahun ini — tetap tampil untuk riwayat lengkap.
          </p>
        </>
      )}
    </div>
  );
}
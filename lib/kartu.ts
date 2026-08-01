import { supabase } from './supabase';
import { Periode, buatPeriode, periodeSekarang, namaBulan } from './periode';

export type StatusBulan = 'lunas' | 'nunggak' | 'belum' | 'luar';

export type SelBulan = {
  periode: Periode;
  bulan: number;              // 1-12
  status: StatusBulan;
  // detail kalau lunas:
  tanggalBayar?: string;      // 'YYYY-MM-DD'
  kantong?: 'tunai' | 'dana';
  nominal?: number;
  transaksiId?: string;
  batchId?: string | null;
};

export type KartuWarga = {
  id: string; noRumah: string; namaKK: string; noWa: string;
  periodeAwal: Periode; periodeAkhir: Periode | null;
};

/** Susun 12 sel untuk satu tahun. Status tiap bulan:
 *  - luar   : di luar masa keanggotaan (< awal atau > akhir)
 *  - lunas  : ada transaksi masuk periode itu
 *  - nunggak: bulan lalu belum bayar, ATAU bulan ini & sudah lewat tgl pertemuan
 *  - belum  : bulan depan, ATAU bulan ini tapi belum sampai tgl pertemuan
 *  tglPertemuan dari pengaturan 'tgl_kumpulan' — bulan berjalan baru jadi
 *  nunggak setelah tanggal itu lewat (bukan sejak tanggal 1). */
export async function susunKartu(
  warga: KartuWarga,
  tahun: number,
  tglPertemuan = 15,
): Promise<SelBulan[]> {
  // ambil semua iuran warga ini (lunas by periode)
  const { data } = await supabase.from('transaksi')
    .select('id, periode, tanggal, kantong, nominal, batch_id')
    .eq('jenis', 'masuk').eq('warga_id', warga.id).eq('dibatalkan', false);

  const byPeriode = new Map<string, any>();
  (data ?? []).forEach(r => byPeriode.set(r.periode as string, r));

  const skrg = periodeSekarang();
  const tglHariIni = new Date().getDate();   // tanggal hari ini (1-31)

  const sel: SelBulan[] = [];
  for (let bl = 1; bl <= 12; bl++) {
    const periode = buatPeriode(tahun, bl);
    let status: StatusBulan;

    const luarBawah = periode < warga.periodeAwal;
    const luarAtas = warga.periodeAkhir !== null && periode > warga.periodeAkhir;

    if (luarBawah || luarAtas) {
      status = 'luar';
    } else if (byPeriode.has(periode)) {
      status = 'lunas';
    } else if (periode > skrg) {
      status = 'belum';                                   // bulan depan
    } else if (periode === skrg && tglHariIni < tglPertemuan) {
      status = 'belum';                                   // bulan ini, belum sampai tgl pertemuan
    } else {
      status = 'nunggak';                                 // bulan lalu, ATAU bulan ini & sudah lewat tgl pertemuan
    }

    const t = byPeriode.get(periode);
    sel.push({
      periode, bulan: bl, status,
      ...(t ? {
        tanggalBayar: t.tanggal, kantong: t.kantong,
        nominal: t.nominal, transaksiId: t.id, batchId: t.batch_id,
      } : {}),
    });
  }
  return sel;
}

/** Daftar bulan nunggak (untuk reminder & ringkasan). */
export function bulanNunggak(sel: SelBulan[]): Periode[] {
  return sel.filter(s => s.status === 'nunggak').map(s => s.periode);
}
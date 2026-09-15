import { supabase } from './supabase';
import { Periode, buatPeriode, periodeSekarang, namaBulan } from './periode';
import { ambilPengaturan, angka } from './pengaturan';
import { urutRumah } from './urut';

export type StatusBulan = 'lunas' | 'nunggak' | 'belum' | 'luar';

export type SelBulan = {
  periode: Periode;
  bulan: number;
  status: StatusBulan;
  tanggalBayar?: string;
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
 *  - luar   : di luar masa keanggotaan
 *  - lunas  : ada transaksi masuk periode itu
 *  - nunggak: bulan lalu belum bayar, ATAU bulan ini & sudah lewat tgl pertemuan
 *  - belum  : bulan depan, ATAU bulan ini tapi belum sampai tgl pertemuan */
export async function susunKartu(
  warga: KartuWarga,
  tahun: number,
  tglPertemuan = 15,
): Promise<SelBulan[]> {
  const { data } = await supabase.from('transaksi')
    .select('id, periode, tanggal, kantong, nominal, batch_id')
    .eq('jenis', 'masuk').eq('warga_id', warga.id).eq('dibatalkan', false);

  const byPeriode = new Map<string, any>();
  (data ?? []).forEach(r => byPeriode.set(r.periode as string, r));

  const skrg = periodeSekarang();
  const tglHariIni = new Date().getDate();

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
      status = 'belum';
    } else if (periode === skrg && tglHariIni < tglPertemuan) {
      status = 'belum';
    } else {
      status = 'nunggak';
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

// ═══════════════════════════════════════════════
// LAPORAN TAHUNAN SEMUA ANGGOTA — data bersama
// Dipakai preview layar DAN unduh PDF — satu sumber,
// angka pasti sama di dua tempat.
// ═══════════════════════════════════════════════

export type BarisTahunan = {
  id: string; noRumah: string; namaKK: string;
  sel: SelBulan[]; totalNunggak: number; sudahKeluar: boolean;
};

export async function susunLaporanTahunan(tahun: number): Promise<BarisTahunan[]> {
  const peng = await ambilPengaturan();
  const iuran = angka(peng, 'iuran_flat', 10000);
  const tglPertemuan = parseInt((peng['tgl_kumpulan'] ?? '').replace(/\D/g, ''), 10) || 15;

  const { data } = await supabase.from('warga')
    .select('id,no_rumah,nama_kk,periode_awal,periode_akhir');
  const semua = ((data ?? []) as any[]).sort(urutRumah);

  // aktif + yang keluar TAHUN INI (riwayat lengkap tahun berjalan)
  const awalTahun = `${tahun}-01`;
  const akhirTahun = `${tahun}-12`;
  const relevan = semua.filter(w =>
    w.periode_awal <= akhirTahun &&
    (w.periode_akhir === null || w.periode_akhir >= awalTahun)
  );

  // hitung status 12 bulan utk SEMUA warga sekaligus, paralel
  const selSemua = await Promise.all(
    relevan.map(w => susunKartu(
      { id: w.id, noRumah: w.no_rumah, namaKK: w.nama_kk, noWa: '',
        periodeAwal: w.periode_awal, periodeAkhir: w.periode_akhir },
      tahun, tglPertemuan
    ))
  );

  return relevan.map((w, i) => {
    const sel = selSemua[i];
    const nunggak = bulanNunggak(sel);
    return {
      id: w.id, noRumah: w.no_rumah, namaKK: w.nama_kk,
      sel, totalNunggak: nunggak.length * iuran,
      sudahKeluar: w.periode_akhir !== null,
    };
  });
}
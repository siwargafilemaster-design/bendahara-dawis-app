import { supabase } from './supabase';
import { angka, ambilPengaturan } from './pengaturan';
import { Periode } from './periode';

export type BarisKeluar = { kategori: string; nominal: number; catatan: string | null; tanggal: string };
export type BarisMasuk = { noRumah: string; namaKK: string; nominal: number; periode: string; tanggal: string };

export type Rekap = {
  periode: Periode;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;      // saldo kumulatif s/d akhir bulan ini (basis kas)
  masuk: BarisMasuk[];
  keluar: BarisKeluar[];
  jumlahBayar: number;     // brp baris iuran masuk bulan ini
};

/** Rekap satu bulan — BASIS KAS: yang dilaporkan = uang yang MASUK/KELUAR
 *  di bulan itu (per tanggal transaksi), bukan per bulan iuran.
 *  Uang di tangan bendahara selalu cocok dengan laporan. */
export async function hitungRekap(periode: Periode): Promise<Rekap> {
  const peng = await ambilPengaturan();
  const saldoAwal = angka(peng, 'saldo_awal', 0);

  const [th, bl] = periode.split('-');
  const awalBln = `${th}-${bl}-01`;
  const akhirBln = `${th}-${bl}-31`;

  // iuran masuk berdasarkan TANGGAL BAYAR (basis kas), bukan periode iuran
  const { data: masukData } = await supabase.from('transaksi')
    .select('nominal, periode, tanggal, warga:warga_id(no_rumah,nama_kk)')
    .eq('jenis', 'masuk').eq('dibatalkan', false)
    .gte('tanggal', awalBln).lte('tanggal', akhirBln);

  const masuk: BarisMasuk[] = (masukData ?? []).map((r: any) => ({
    noRumah: r.warga?.no_rumah ?? '—', namaKK: r.warga?.nama_kk ?? '—',
    nominal: r.nominal, periode: r.periode, tanggal: r.tanggal,
  }));

  // pengeluaran per tanggal
  const { data: keluarData } = await supabase.from('transaksi')
    .select('nominal, catatan, tanggal, kategori:kategori_id(nama)')
    .eq('jenis', 'keluar').eq('dibatalkan', false)
    .gte('tanggal', awalBln).lte('tanggal', akhirBln);

  const keluar: BarisKeluar[] = (keluarData ?? []).map((r: any) => ({
    kategori: r.kategori?.nama ?? 'Lain', nominal: r.nominal,
    catatan: r.catatan, tanggal: r.tanggal,
  }));

  const totalMasuk = masuk.reduce((s, r) => s + r.nominal, 0);
  const totalKeluar = keluar.reduce((s, r) => s + r.nominal, 0);

  // saldo akhir = saldo awal + semua masuk & keluar s/d akhir bulan ini
  // (basis kas: murni per tanggal, konsisten masuk & keluar)
  const { data: semua } = await supabase.from('transaksi')
    .select('jenis, nominal, tanggal')
    .eq('dibatalkan', false)
    .lte('tanggal', akhirBln);

  let saldo = saldoAwal;
  for (const t of semua ?? []) {
    if (t.jenis === 'masuk') saldo += t.nominal;
    else if (t.jenis === 'keluar') saldo -= t.nominal;
    // pindah tak ubah total
  }

  return {
    periode, totalMasuk, totalKeluar, saldoAkhir: saldo,
    masuk, keluar, jumlahBayar: masuk.length,
  };
}
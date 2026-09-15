import { supabase } from './supabase';
import { Periode, geser } from './periode';
import { antreInsert, antreBatal, prosesOutbox } from './outbox';

export type Jenis = 'masuk' | 'keluar' | 'pindah';
export type Kantong = 'tunai' | 'dana';

export type Transaksi = {
  id: string;
  tanggal: string;
  jenis: Jenis;
  kantong: Kantong;
  kantong_tujuan: Kantong | null;
  kategori_id: string | null;
  warga_id: string | null;
  periode: Periode | null;
  nominal: number;
  catatan: string | null;
  foto_url: string | null;
  batch_id: string | null;
  dibatalkan?: boolean;
  resi_status?: string;
};

export function baueIuran(warga_id: string, periode: Periode, nominal: number,
  kantong: Kantong, batch_id: string | null = null): Transaksi {
  return {
    id: crypto.randomUUID(),
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: 'masuk', kantong,
    kantong_tujuan: null, kategori_id: null, warga_id, periode,
    nominal, catatan: null, foto_url: null, batch_id,
  };
}

export async function simpanTransaksi(rows: Transaksi[]) {
  for (const r of rows) await antreInsert(r);
  await prosesOutbox();
}

export async function batalkan(id: string) {
  await antreBatal(id);
  await prosesOutbox();
}

export async function statusBayar(periode: Periode): Promise<Set<string>> {
  const { data, error } = await supabase.from('transaksi')
    .select('warga_id')
    .eq('jenis', 'masuk').eq('periode', periode).eq('dibatalkan', false);
  if (error) throw error;
  return new Set((data ?? []).map(r => r.warga_id as string));
}

export async function semuaIuran(): Promise<{ warga_id: string; periode: Periode }[]> {
  const { data, error } = await supabase.from('transaksi')
    .select('warga_id, periode')
    .eq('jenis', 'masuk').eq('dibatalkan', false);
  if (error) throw error;
  return (data ?? []) as any;
}

/** Daftar periode yang BELUM dibayar warga ini, urut dari paling lama.
 *  Mulai dari periode_awal warga; lewati yang sudah dibayar; kumpulkan
 *  sampai `jumlah` periode. Kalau tunggakan habis, lanjut ke bulan depan
 *  (mendukung bayar di muka). PRIORITAS: tutup tunggakan lama dulu —
 *  bukan "bulan aktif di grid + ke depan" seperti versi lama. */
export async function periodeBelumDibayar(
  wargaId: string,
  periodeAwal: Periode,
  jumlah: number,
): Promise<Periode[]> {
  const semua = await semuaIuran();
  const sudah = new Set(
    semua.filter(r => r.warga_id === wargaId).map(r => r.periode)
  );

  const hasil: Periode[] = [];
  let p = periodeAwal;
  for (let i = 0; i < 240 && hasil.length < jumlah; i++) {
    if (!sudah.has(p)) hasil.push(p);
    p = geser(p, 1);
  }
  return hasil;
}
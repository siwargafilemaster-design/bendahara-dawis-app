import { supabase } from './supabase';
import { Periode } from './periode';

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
  resi_status: 'tertahan' | 'terkirim' | 'diralat' | 'gagal' | 'skip';
  dibatalkan: boolean;
  created_at?: string;
};

const uuid = () => crypto.randomUUID();
const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

/** Iuran satu bulan. id dari client (idempotency, §3). */
export function baueIuran(warga_id: string, periode: Periode, nominal: number,
  kantong: Kantong, batch_id: string | null = null): Transaksi {
  return {
    id: uuid(), tanggal: hariIni(), jenis: 'masuk', kantong,
    kantong_tujuan: null, kategori_id: null, warga_id, periode,
    nominal, catatan: null, foto_url: null, batch_id,
    resi_status: 'skip', dibatalkan: false,
  };
}

/** INSERT satu/banyak baris. Dipakai optimistic — dipanggil SETELAH UI update. */
export async function simpanTransaksi(rows: Transaksi[]) {
  const { error } = await supabase.from('transaksi').insert(
    rows.map(({ created_at, ...r }) => r)
  );
  if (error) throw error;
}

/** Batalkan (jangan DELETE, §10). */
export async function batalkan(id: string) {
  const { error } = await supabase.from('transaksi')
    .update({ dibatalkan: true }).eq('id', id);
  if (error) throw error;
}

/** Status bayar iuran untuk satu periode → Set<warga_id> yang sudah bayar. */
export async function statusBayar(periode: Periode): Promise<Set<string>> {
  const { data, error } = await supabase.from('transaksi')
    .select('warga_id')
    .eq('jenis', 'masuk').eq('periode', periode).eq('dibatalkan', false);
  if (error) throw error;
  return new Set((data ?? []).map(r => r.warga_id as string));
}

/** Semua iuran (untuk hitungTunggakan). */
export async function semuaIuran(): Promise<{ warga_id: string; periode: Periode }[]> {
  const { data, error } = await supabase.from('transaksi')
    .select('warga_id, periode')
    .eq('jenis', 'masuk').eq('dibatalkan', false);
  if (error) throw error;
  return (data ?? []) as any;
}
import { supabase } from './supabase';
import { Periode } from './periode';
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
  resi_status: 'tertahan' | 'terkirim' | 'diralat' | 'gagal' | 'skip';
  dibatalkan: boolean;
  created_at?: string;
};

const uuid = () => crypto.randomUUID();
const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function baueIuran(warga_id: string, periode: Periode, nominal: number,
  kantong: Kantong, batch_id: string | null = null): Transaksi {
  return {
    id: uuid(), tanggal: hariIni(), jenis: 'masuk', kantong,
    kantong_tujuan: null, kategori_id: null, warga_id, periode,
    nominal, catatan: null, foto_url: null, batch_id,
    resi_status: 'skip', dibatalkan: false,
  };
}

/** Tulis via OUTBOX (tahan mati), lalu picu pengiriman. */
export async function simpanTransaksi(rows: Transaksi[]) {
  for (const r of rows) await antreInsert(r);
  prosesOutbox();               // tidak di-await: jangan tahan UI
}

/** Batalkan via OUTBOX. */
export async function batalkan(id: string) {
  await antreBatal(id);
  prosesOutbox();
}

/** BACA — tetap dari Supabase (dilengkapi overlay di page). */
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
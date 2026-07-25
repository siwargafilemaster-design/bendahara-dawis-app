import { supabase } from './supabase';
import { pesanResi, nomorResi } from './pesan';
import { ambilPengaturan } from './pengaturan';
import { Periode } from './periode';

const JENDELA_MS = 60_000;
const THROTTLE_MS = 4_000;

type ItemPeti = {
  transaksiIds: string[];   // 1 atau N (bayar di muka)
  wargaId: string;
  batchId: string | null;
};

let timer: ReturnType<typeof setTimeout> | null = null;
let pendengar: (() => void) | null = null;

/** Daftar warga_id yang resinya masih tertahan (untuk indikator). */
export async function petiTertahan(): Promise<string[]> {
  const { data } = await supabase.from('transaksi')
    .select('warga_id')
    .eq('jenis', 'masuk').eq('resi_status', 'tertahan').eq('dibatalkan', false);
  return [...new Set((data ?? []).map(r => r.warga_id as string))];
}

/** Panggil saat ada iuran baru commit. Reset timer 60 detik. */
export function jadwalkanKirim(onTick?: () => void) {
  pendengar = onTick ?? pendengar;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { kirimSemuaTertahan(); }, JENDELA_MS);
}

/** Batalkan SEMUA resi tertahan (dipicu tombol Batal). Timer mati. */
export async function batalkanPeti() {
  if (timer) { clearTimeout(timer); timer = null; }
  // resi dibatalkan → status skip (transaksinya sendiri TIDAK dibatalkan;
  // yang batal cuma pengiriman resinya)
  await supabase.from('transaksi')
    .update({ resi_status: 'skip' })
    .eq('jenis', 'masuk').eq('resi_status', 'tertahan').eq('dibatalkan', false);
  pendengar?.();
}

/** Kirim semua yang tertahan. Dipanggil saat timer habis / saat app dibuka. */
export async function kirimSemuaTertahan() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!navigator.onLine) return; // nanti saja saat online

  const peng = await ambilPengaturan();
  const namaDawis = peng['nama_dawis'] ?? 'Dasa Wisma';

  // ambil semua transaksi tertahan + data warga, kelompokkan per warga+batch
  const { data } = await supabase.from('transaksi')
    .select('id, warga_id, periode, nominal, kantong, tanggal, batch_id, warga:warga_id(no_rumah,nama_kk,no_wa)')
    .eq('jenis', 'masuk').eq('resi_status', 'tertahan').eq('dibatalkan', false);

  if (!data || data.length === 0) return;

  // kelompokkan: batch_id (kalau ada) atau id tunggal
  const grup = new Map<string, any[]>();
  for (const t of data) {
    const kunci = t.batch_id ?? t.id;
    if (!grup.has(kunci)) grup.set(kunci, []);
    grup.get(kunci)!.push(t);
  }

  // kirim per grup, throttle antar pesan
  for (const [kunci, rows] of grup) {
    const w = rows[0].warga;
    if (!w?.no_wa) {
      // tak ada WA → tandai skip, jangan gagal
      await supabase.from('transaksi').update({ resi_status: 'skip' })
        .in('id', rows.map(r => r.id));
      continue;
    }

    const total = rows.reduce((s, r) => s + r.nominal, 0);
    const teks = pesanResi({
      namaDawis, noRumah: w.no_rumah, namaKK: w.nama_kk,
      periode: rows.map(r => r.periode as Periode),
      total, kantong: rows[0].kantong, tanggal: rows[0].tanggal,
      noResi: nomorResi(kunci, rows[0].tanggal),
    });

    try {
      const res = await fetch('/api/kirim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaksiIds: rows.map(r => r.id),
          nomor: w.no_wa, teks,
        }),
      });
      const hasil = await res.json();
      if (!hasil.ok) {
        await supabase.from('transaksi').update({ resi_status: 'gagal' })
          .in('id', rows.map(r => r.id));
      }
      // sukses: route handler sudah set 'terkirim'
    } catch {
      await supabase.from('transaksi').update({ resi_status: 'gagal' })
        .in('id', rows.map(r => r.id));
    }

    await new Promise(r => setTimeout(r, THROTTLE_MS)); // throttle
  }

  pendengar?.();
}

/** Kirim ulang yang gagal (dari indikator). */
export async function kirimUlangGagal() {
  await supabase.from('transaksi')
    .update({ resi_status: 'tertahan' })
    .eq('jenis', 'masuk').eq('resi_status', 'gagal').eq('dibatalkan', false);
  await kirimSemuaTertahan();
}
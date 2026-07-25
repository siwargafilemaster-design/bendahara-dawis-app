import { supabase } from './supabase';
import { pesanResi, nomorResi } from './pesan';
import { ambilPengaturan } from './pengaturan';
import { Periode } from './periode';

const JENDELA_MS = 60_000;
const THROTTLE_MS = 4_000;

let timer: ReturnType<typeof setTimeout> | null = null;
let pendengar: (() => void) | null = null;
let sedangKirim = false;

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
  await supabase.from('transaksi')
    .update({ resi_status: 'skip' })
    .eq('jenis', 'masuk').eq('resi_status', 'tertahan').eq('dibatalkan', false);
  pendengar?.();
}

/** Kirim yang tertahan.
 *  hanyaJatuhTempo=true → cuma yang created_at sudah > 60 dtk lalu
 *    (jaring pengaman saat app dibuka — JANGAN kirim yang baru dijadwalkan).
 *  hanyaJatuhTempo=false → semua (timer habis / tombol "Kirim sekarang"). */
export async function kirimSemuaTertahan(hanyaJatuhTempo = false) {
  if (sedangKirim) return;
  if (!hanyaJatuhTempo && timer) { clearTimeout(timer); timer = null; }
  if (!navigator.onLine) return;

  sedangKirim = true;
  try {
  const peng = await ambilPengaturan();
  const namaDawis = peng['nama_dawis'] ?? 'Dasa Wisma';

  let q = supabase.from('transaksi')
    .select('id, warga_id, periode, nominal, kantong, tanggal, batch_id, created_at, warga:warga_id(no_rumah,nama_kk,no_wa)')
    .eq('jenis', 'masuk').eq('resi_status', 'tertahan').eq('dibatalkan', false);

  // jaring pengaman: hanya yang sudah lewat jendela 60 detik
  if (hanyaJatuhTempo) {
    const ambang = new Date(Date.now() - JENDELA_MS).toISOString();
    q = q.lt('created_at', ambang);
  }

  const { data } = await q;
  if (!data || data.length === 0) return;

  // kelompokkan: batch_id (kalau ada) atau id tunggal
  const grup = new Map<string, any[]>();
  for (const t of data) {
    const kunci = t.batch_id ?? t.id;
    if (!grup.has(kunci)) grup.set(kunci, []);
    grup.get(kunci)!.push(t);
  }

  for (const [kunci, rows] of grup) {
    const w = rows[0].warga;
    if (!w?.no_wa) {
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
    } catch {
      await supabase.from('transaksi').update({ resi_status: 'gagal' })
        .in('id', rows.map(r => r.id));
    }

    await new Promise(r => setTimeout(r, THROTTLE_MS));
  }

  pendengar?.();
} finally {
  sedangKirim = false;
 }
}

/** Kirim ulang yang gagal (dari indikator). */
export async function kirimUlangGagal() {
  await supabase.from('transaksi')
    .update({ resi_status: 'tertahan' })
    .eq('jenis', 'masuk').eq('resi_status', 'gagal').eq('dibatalkan', false);
  await kirimSemuaTertahan();
}
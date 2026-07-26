import { supabase } from './supabase';

export type Pengaturan = Record<string, string | null>;

const KUNCI_CACHE = 'snapshot_pengaturan';

/** Ambil pengaturan. Online → dari Supabase + simpan snapshot.
 *  Offline/gagal → dari snapshot lokal (biar navbar tetap terisi). */
export async function ambilPengaturan(): Promise<Pengaturan> {
  try {
    const { data, error } = await supabase.from('pengaturan').select('kunci,nilai');
    if (error) throw error;
    const hasil = Object.fromEntries(data.map(r => [r.kunci, r.nilai]));
    // simpan snapshot untuk offline
    try { localStorage.setItem(KUNCI_CACHE, JSON.stringify(hasil)); } catch {}
    return hasil;
  } catch (e) {
    // offline / gagal → pakai snapshot terakhir
    try {
      const cache = localStorage.getItem(KUNCI_CACHE);
      if (cache) return JSON.parse(cache);
    } catch {}
    throw e; // tak ada snapshot sama sekali → biarkan pemanggil tahu
  }
}

export async function simpanPengaturan(kunci: string, nilai: string) {
  const { error } = await supabase.from('pengaturan')
    .update({ nilai }).eq('kunci', kunci);
  if (error) throw error;
  // perbarui snapshot lokal juga biar konsisten
  try {
    const cache = localStorage.getItem(KUNCI_CACHE);
    const obj = cache ? JSON.parse(cache) : {};
    obj[kunci] = nilai;
    localStorage.setItem(KUNCI_CACHE, JSON.stringify(obj));
  } catch {}
}

export const angka = (p: Pengaturan, k: string, d = 0) =>
  p[k] ? parseInt(p[k]!, 10) : d;
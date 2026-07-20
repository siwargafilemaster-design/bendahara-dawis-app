import { supabase } from './supabase';

export type Pengaturan = Record<string, string | null>;

export async function ambilPengaturan(): Promise<Pengaturan> {
  const { data, error } = await supabase.from('pengaturan').select('kunci,nilai');
  if (error) throw error;
  return Object.fromEntries(data.map(r => [r.kunci, r.nilai]));
}

export async function simpanPengaturan(kunci: string, nilai: string) {
  const { error } = await supabase.from('pengaturan')
    .update({ nilai }).eq('kunci', kunci);
  if (error) throw error;
}

export const angka = (p: Pengaturan, k: string, d = 0) =>
  p[k] ? parseInt(p[k]!, 10) : d;
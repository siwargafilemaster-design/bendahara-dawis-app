import { supabase } from './supabase';
import { angka, Pengaturan } from './pengaturan';

export type Saldo = { total: number; tunai: number; dana: number;
  masuk: number; keluar: number };

export async function hitungSaldo(p: Pengaturan): Promise<Saldo> {
  const { data, error } = await supabase.from('transaksi')
    .select('jenis, kantong, kantong_tujuan, nominal')
    .eq('dibatalkan', false);
  if (error) throw error;

  const saldoAwal = angka(p, 'saldo_awal', 0);
  let tunai = 0, dana = 0, masuk = 0, keluar = 0;

  for (const t of data ?? []) {
    const n = t.nominal as number;
    if (t.jenis === 'masuk') {
      masuk += n;
      t.kantong === 'tunai' ? (tunai += n) : (dana += n);
    } else if (t.jenis === 'keluar') {
      keluar += n;
      t.kantong === 'tunai' ? (tunai -= n) : (dana -= n);
    } else { // pindah — TIDAK masuk masuk/keluar (§5)
      if (t.kantong === 'tunai') { tunai -= n; dana += n; }
      else { dana -= n; tunai += n; }
    }
  }

  // saldo_awal diperlakukan sebagai saldo tunai awal
  tunai += saldoAwal;
  return { total: saldoAwal + masuk - keluar, tunai, dana, masuk, keluar };
}
import { db, OutboxItem } from './db';
import { supabase } from './supabase';
import { Transaksi } from './transaksi';

/** Taruh insert ke antrian. id transaksi jadi key (idempoten). */
export async function antreInsert(row: Transaksi) {
  await db.outbox.put({
    key: row.id, tipe: 'insert', payload: row,
    percobaan: 0, dibuat: Date.now(),
  });
}

/** Taruh pembatalan ke antrian. */
export async function antreBatal(id: string) {
  await db.outbox.put({
    key: `batal:${id}`, tipe: 'batal', payload: { id },
    percobaan: 0, dibuat: Date.now(),
  });
}

/** Berapa yang belum terkirim (untuk badge). */
export async function jumlahAntrian(): Promise<number> {
  return db.outbox.count();
}

let sedangProses = false;

/**
 * Kirim seluruh antrian ke Supabase, urut dibuat.
 * Yang berhasil dihapus dari outbox. Yang gagal ditinggal untuk retry.
 * Dipanggil: saat app dibuka, saat 'online', setelah tiap tulis.
 */
export async function prosesOutbox(): Promise<void> {
  if (sedangProses) return;           // cegah tumpang tindih
  if (!navigator.onLine) return;      // offline: jangan buang tenaga
  sedangProses = true;

  try {
    const items = await db.outbox.orderBy('dibuat').toArray();
    for (const item of items) {
      try {
        await kirimSatu(item);
        await db.outbox.delete(item.key);
      } catch {
        // gagal → naikkan hitungan, tinggalkan di antrian
        await db.outbox.update(item.key, { percobaan: item.percobaan + 1 });
        // berhenti di kegagalan pertama: kalau jaringan mati,
        // sisanya pasti gagal juga. Coba lagi nanti.
        break;
      }
    }
  } finally {
    sedangProses = false;
  }
}

async function kirimSatu(item: OutboxItem) {
  if (item.tipe === 'insert') {
    const row = item.payload as Transaksi;
    const { created_at, ...bersih } = row as any;
    // upsert: kalau id sudah ada di server (retry), jangan error — timpa.
    const { error } = await supabase.from('transaksi')
      .upsert(bersih, { onConflict: 'id' });
    if (error) throw error;
  } else {
    const { id } = item.payload as { id: string };
    const { error } = await supabase.from('transaksi')
      .update({ dibatalkan: true }).eq('id', id);
    if (error) throw error;
  }
}
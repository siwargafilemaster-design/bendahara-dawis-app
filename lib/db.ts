import Dexie, { Table } from 'dexie';
import { Transaksi } from './transaksi';

// Satu item outbox = satu operasi yang belum tentu sampai server.
export type OutboxItem = {
  key: string;            // = transaksi.id untuk insert; `batal:<id>` untuk pembatalan
  tipe: 'insert' | 'batal';
  payload: Transaksi | { id: string };
  percobaan: number;
  dibuat: number;         // Date.now()
};

// Snapshot ringan supaya grid tampil tanpa sinyal.
export type SnapItem = {
  kunci: string;          // 'warga' | `bayar:<periode>`
  data: any;
  disimpan: number;
};

class DawisDB extends Dexie {
  outbox!: Table<OutboxItem, string>;
  snapshot!: Table<SnapItem, string>;

  constructor() {
    super('bendahara-dawis');
    this.version(1).stores({
      outbox: 'key, tipe, dibuat',
      snapshot: 'kunci',
    });
  }
}

export const db = new DawisDB();
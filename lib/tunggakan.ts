import { Periode, rentang, periodeSekarang } from './periode';

export type Warga = {
  id: string; no_rumah: string; nama_kk: string; no_wa: string;
  periode_awal: Periode; periode_akhir: Periode | null;
};

export type Bayar = { warga_id: string; periode: Periode };

export type Tunggakan = {
  bulan: Periode[];
  jumlahBulan: number;
  total: number;
};

/**
 * SATU-SATUNYA tempat tunggakan dihitung.
 * Dipakai: Kartu Iuran (§13), Tutup Buku Anggota (§12), reminder (§16).
 * Blueprint §12 — kalau dihitung di dua tempat, suatu hari akan beda,
*/

export function hitungTunggakan(
  warga: Warga,
  sudahBayar: Bayar[],
  iuranFlat: number,
  sampai: Periode = periodeSekarang()
): Tunggakan {
  const batas = warga.periode_akhir && warga.periode_akhir < sampai
    ? warga.periode_akhir
    : sampai;

  if (batas < warga.periode_awal) return { bulan: [], jumlahBulan: 0, total: 0 };

  const dibayar = new Set(
    sudahBayar.filter(b => b.warga_id === warga.id).map(b => b.periode)
  );
  const bulan = rentang(warga.periode_awal, batas).filter(p => !dibayar.has(p));

  return { bulan, jumlahBulan: bulan.length, total: bulan.length * iuranFlat };
}
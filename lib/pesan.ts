import { namaBulan, Periode } from './periode';
import { rupiah } from './uang';

type DataResi = {
  namaDawis: string;
  noRumah: string;
  namaKK: string;
  periode: Periode[];      // bisa banyak (bayar di muka)
  total: number;
  kantong: 'tunai' | 'dana';
  tanggal: string;
  noResi: string;
};

/** Daftar periode → "Agu–Des 2026" atau "Agu 2026" */
function ringkasPeriode(ps: Periode[]): string {
  if (ps.length === 0) return '';
  const urut = [...ps].sort();
  if (urut.length === 1) return namaBulan(urut[0]);
  return `${namaBulan(urut[0])} – ${namaBulan(urut[urut.length - 1])}`;
}

export function pesanResi(d: DataResi): string {
  return `*RESI PENERIMAAN*
${d.namaDawis}

No    : ${d.noResi}
Rumah : ${d.noRumah}
Nama  : ${d.namaKK}
Untuk : Iuran ${ringkasPeriode(d.periode)}
Jumlah: ${rupiah(d.total)}
Cara  : ${d.kantong === 'dana' ? 'DANA' : 'Tunai'}
Tgl   : ${d.tanggal}

Terima kasih 🙏
_Pesan otomatis, tidak perlu dibalas_`;
}

/** No resi ringkas dari batch/id + tanggal. Cukup unik untuk manusia. */
export function nomorResi(idOrBatch: string, tanggal: string): string {
  const tgl = tanggal.replace(/-/g, '').slice(2); // 260724
  const suffix = idOrBatch.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `${tgl}-${suffix}`;
}
import { namaBulan, Periode } from './periode';
import { rupiah } from './uang';

type DataResi = {
  namaDawis: string;
  alamat: string;
  noRumah: string;
  namaKK: string;
  periode: Periode[];
  total: number;
  kantong: 'tunai' | 'dana';
  tanggal: string;        // 'YYYY-MM-DD'
  namaBendahara: string;
  noResi: string;
};

function tglTampil(iso: string): string {
  const [th, bl, tg] = iso.split('-');
  return `${tg}/${bl}/${th}`;
}

function ketPeriode(ps: Periode[]): string {
  if (ps.length === 0) return '';
  const urut = [...ps].sort();
  if (urut.length === 1) return namaBulan(urut[0], true);
  return `${namaBulan(urut[0], true)} – ${namaBulan(urut[urut.length - 1], true)} (${urut.length} bulan)`;
}

export function nomorResi(idOrBatch: string, tanggal: string): string {
  const tgl = tanggal.replace(/-/g, '').slice(2);
  const suffix = idOrBatch.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `${tgl}-${suffix}`;
}

export function pesanResi(d: DataResi): string {
  return `*BUKTI PEMBAYARAN IURAN DAWIS*
${d.namaDawis}
_${d.alamat}_

Halo Bu *${d.namaKK}* (${d.noRumah}) 🌸

Iuran kas sudah kami terima ya,

📌 No Resi : ${d.noResi}
📅 Tanggal : ${tglTampil(d.tanggal)}
💵 Jumlah  : *${rupiah(d.total)}*
💳 Cara    : ${d.kantong === 'dana' ? 'DANA' : 'Tunai'}
📝 Untuk   : Iuran ${ketPeriode(d.periode)}

Matur nuwun 🙏
Salam hangat,
*${d.namaBendahara || 'Bendahara Dawis'}*
____________________________
_Pesan otomatis. Tidak perlu dibalas._`;
}
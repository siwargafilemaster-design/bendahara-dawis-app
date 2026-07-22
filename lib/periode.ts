export type Periode = string; // 'YYYY-MM'

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const BULAN_PANJANG = ['Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'];

/** '2026-07-16' → {th:2026, bl:7, tgl:16} — TANPA timezone, tanpa new Date(string) */
function pecahTanggal(iso: string) {
  const [th, bl, tgl] = iso.split('-').map(Number);
  return { th, bl, tgl };
}

const pad = (n: number) => String(n).padStart(2, '0');
export const buatPeriode = (th: number, bl: number): Periode => `${th}-${pad(bl)}`;

/** new Date(angka,angka,angka) AMAN — pakai zona lokal HP, bukan UTC.
 *  Hanya new Date('string') yang jahat. */
export const toPeriode = (d: Date): Periode => buatPeriode(d.getFullYear(), d.getMonth() + 1);

export const periodeSekarang = () => toPeriode(new Date());

export function geser(p: Periode, n: number): Periode {
  const [th, bl] = p.split('-').map(Number);
  const d = new Date(th, bl - 1 + n, 1); // angka → aman
  return toPeriode(d);
}

export const namaBulan = (p: Periode, panjang = false) => {
  const [th, bl] = p.split('-').map(Number);
  return `${(panjang ? BULAN_PANJANG : BULAN)[bl - 1]} ${th}`;
};

/**
 * SISI MASUK — aturan Dawis terbaru: kelonggaran bulan pertama untuk semua.
 * Gabung bulan apa pun, tanggal berapa pun → mulai ditagih BULAN BERIKUTNYA.
 * Tidak ada ambang. Tidak ada cabang.
 */
export function periodeAwalDari(tglGabung: string): Periode {
  const { th, bl } = pecahTanggal(tglGabung);
  return geser(buatPeriode(th, bl), 1);
}

/**
 * Tanggal pertemuan = Minggu ke-2 di bulan itu.
 * Kembalikan ANGKA tanggal (bukan Date) supaya perbandingan angka-lawan-angka.
 * new Date(th, bl-1, 1) pakai zona lokal → aman.
 */
export function tanggalPertemuan(p: Periode): number {
  const [th, bl] = p.split('-').map(Number);
  const hariPertama = new Date(th, bl - 1, 1).getDay(); // 0=Minggu
  const offsetKeMingguPertama = (7 - hariPertama) % 7;
  return 1 + offsetKeMingguPertama + 7; // tanggal Minggu ke-2
}

/**
 * SISI KELUAR — aturan Dawis: deadline iuran = hari pertemuan.
 * Keluar SEBELUM pertemuan → tidak bayar bulan berjalan.
 * Keluar PADA/SESUDAH pertemuan → bayar bulan berjalan (deadline lewat).
 * Bandingkan angka tgl vs angka pertemuan — nol Date, nol timezone.
 */
export function periodeAkhirDari(tglKeluar: string): Periode {
  const { th, bl, tgl } = pecahTanggal(tglKeluar);
  const p = buatPeriode(th, bl);
  return tgl < tanggalPertemuan(p) ? geser(p, -1) : p;
}

export function rentang(awal: Periode, akhir: Periode): Periode[] {
  const out: Periode[] = [];
  let p = awal, guard = 0;
  while (p <= akhir && guard++ < 600) { out.push(p); p = geser(p, 1); }
  return out;
}
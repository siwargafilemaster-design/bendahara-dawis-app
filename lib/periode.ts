export type Periode = string; // 'YYYY-MM'

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const BULAN_PANJANG = ['Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'];

export const toPeriode = (d: Date): Periode =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const periodeSekarang = () => toPeriode(new Date());

export const namaBulan = (p: Periode, panjang = false) => {
  const [th, bl] = p.split('-').map(Number);
  return `${(panjang ? BULAN_PANJANG : BULAN)[bl - 1]} ${th}`;
};

export function geser(p: Periode, n: number): Periode {
  const [th, bl] = p.split('-').map(Number);
  const d = new Date(th, bl - 1 + n, 1);
  return toPeriode(d);
}

/** Blueprint §6 — masuk ≤ ambang → bayar bulan itu; > ambang → bulan depan */
export function periodeAwalDari(tglGabung: string, ambang: number): Periode {
  const d = new Date(tglGabung);
  const p = toPeriode(d);
  return d.getDate() <= ambang ? p : geser(p, 1);
}

/** Blueprint §6 — keluar > ambang → bayar bulan itu; ≤ ambang → tidak */
export function periodeAkhirDari(tglKeluar: string, ambang: number): Periode {
  const d = new Date(tglKeluar);
  const p = toPeriode(d);
  return d.getDate() > ambang ? p : geser(p, -1);
}

export function rentang(awal: Periode, akhir: Periode): Periode[] {
  const out: Periode[] = [];
  let p = awal;
  let guard = 0;
  while (p <= akhir && guard++ < 600) { out.push(p); p = geser(p, 1); }
  return out;
}
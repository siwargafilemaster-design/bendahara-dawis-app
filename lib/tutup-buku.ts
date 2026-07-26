import { ambilPengaturan, simpanPengaturan } from './pengaturan';
import { Periode } from './periode';

async function daftarTerkunci(): Promise<Set<Periode>> {
  const p = await ambilPengaturan();
  const raw = p['bulan_terkunci'];
  if (!raw) return new Set();
  return new Set(raw.split(',').map(s => s.trim()).filter(Boolean));
}

export async function statusTutupBuku(periode: Periode): Promise<boolean> {
  return (await daftarTerkunci()).has(periode);
}

export async function tutupBuku(periode: Periode) {
  const set = await daftarTerkunci();
  set.add(periode);
  await simpanPengaturan('bulan_terkunci', [...set].sort().join(','));
}

export async function bukaBuku(periode: Periode) {
  const set = await daftarTerkunci();
  set.delete(periode);
  await simpanPengaturan('bulan_terkunci', [...set].sort().join(','));
}
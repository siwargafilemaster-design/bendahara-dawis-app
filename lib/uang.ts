export const rupiah = (n: number) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID');

/** '20000' | 'Rp 20.000' → 20000 */
export const parseRupiah = (s: string) =>
  parseInt(s.replace(/\D/g, ''), 10) || 0;

/** Untuk input: ketik 20000 → tampil 20.000 */
export const formatKetik = (s: string) => {
  const n = parseRupiah(s);
  return n ? n.toLocaleString('id-ID') : '';
};

/** 0857xxx / +62857xxx / 62857xxx → 62857xxx */
export function normalWA(input: string) {
  let s = input.replace(/\D/g, '');
  if (s.startsWith('0')) s = '62' + s.slice(1);
  if (s.startsWith('8')) s = '62' + s;
  return s;
}
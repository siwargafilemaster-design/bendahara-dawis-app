// lib/urut.ts

/** Bandingkan no_rumah secara natural: A2 < A10, E1 < E2 < E10 < E11.
 *  localeCompare dengan numeric:true membaca angka sebagai angka. */
export function urutRumah<T extends { no_rumah: string }>(a: T, b: T): number {
  return a.no_rumah.localeCompare(b.no_rumah, 'id', { numeric: true, sensitivity: 'base' });
}
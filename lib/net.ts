/** Bungkus promise dengan batas waktu. Kuota habis = HP merasa online,
 *  request menggantung. Timeout mengubah gantung → gagal cepat. (§3) */
export function denganTimeout<T>(p: PromiseLike<T>, ms = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    Promise.resolve(p).then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); },
    );
  });
}
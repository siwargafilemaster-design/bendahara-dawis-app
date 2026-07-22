'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ambilPengaturan, angka } from '@/lib/pengaturan';
import { periodeSekarang, namaBulan, geser } from '@/lib/periode';
import { baueIuran, simpanTransaksi, batalkan, statusBayar } from '@/lib/transaksi';

type Warga = { id: string; no_rumah: string; nama_kk: string;
  periode_awal: string; periode_akhir: string | null };

export default function Iuran() {
  const [periode, setPeriode] = useState(periodeSekarang());
  const [warga, setWarga] = useState<Warga[]>([]);
  const [bayar, setBayar] = useState<Map<string, string>>(new Map()); // warga_id → transaksi.id
  const [iuran, setIuran] = useState(10000);
  const [toast, setToast] = useState('');

  // muat warga sekali
  useEffect(() => {
    ambilPengaturan().then(p => setIuran(angka(p, 'iuran_flat', 10000)));
    supabase.from('warga').select('id,no_rumah,nama_kk,periode_awal,periode_akhir')
      .order('no_rumah')
      .then(({ data }) => setWarga(data ?? []));
  }, []);

  // muat status bayar tiap ganti periode
  const muatBayar = useCallback(async () => {
    const { data } = await supabase.from('transaksi')
      .select('id, warga_id')
      .eq('jenis','masuk').eq('periode',periode).eq('dibatalkan',false);
    const m = new Map<string,string>();
    (data ?? []).forEach(r => m.set(r.warga_id as string, r.id as string));
    setBayar(m);
  }, [periode]);
  useEffect(() => { muatBayar(); }, [muatBayar]);

  // warga yang aktif di periode ini (§10)
  const tampil = warga.filter(w =>
    w.periode_awal <= periode &&
    (w.periode_akhir === null || w.periode_akhir >= periode));

  function pesan(m: string) { setToast(m); setTimeout(() => setToast(''), 2200); }

  // ⭐ TAP = COMMIT. UI berubah DULU, insert menyusul.
  async function toggle(w: Warga) {
    const sudah = bayar.get(w.id);

    if (sudah) {
      // batalkan — optimistic
      const next = new Map(bayar); next.delete(w.id); setBayar(next);
      pesan(`${w.no_rumah} · ${w.nama_kk} — dibatalkan`);
      try { await batalkan(sudah); }
      catch { setBayar(new Map(bayar)); pesan('Gagal batal — ketuk lagi'); }
      return;
    }

    // bayar — optimistic: hijau SEKARANG
    const row = baueIuran(w.id, periode, iuran, 'tunai');
    const next = new Map(bayar); next.set(w.id, row.id); setBayar(next);
    pesan(`${w.no_rumah} · ${w.nama_kk} — tersimpan`);
    try { await simpanTransaksi([row]); }
    catch (e: any) {
      const back = new Map(bayar); back.delete(w.id); setBayar(back);
      pesan(e?.code === '23505' ? 'Sudah tercatat' : 'Gagal — ketuk untuk ulangi');
    }
  }

  const sudahN = tampil.filter(w => bayar.has(w.id)).length;

  return (
    <div className="p-4 pb-24">
      {/* pemilih bulan */}
      <div className="flex items-center justify-between bg-white border rounded-xl p-2 mb-3"
        style={{ borderColor:'var(--line)' }}>
        <button onClick={() => setPeriode(geser(periode,-1))}
          className="w-8 h-8 rounded-lg border" style={{ borderColor:'var(--line)' }}>‹</button>
        <b className="text-sm">{namaBulan(periode, true)}</b>
        <button onClick={() => setPeriode(geser(periode,1))}
          disabled={periode >= periodeSekarang()}
          className="w-8 h-8 rounded-lg border disabled:opacity-30"
          style={{ borderColor:'var(--line)' }}>›</button>
      </div>

      <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background:'var(--line)' }}>
        <div className="h-full rounded-full transition-all"
          style={{ background:'var(--paid)', width: tampil.length ? `${sudahN/tampil.length*100}%` : '0' }} />
      </div>
      <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
        style={{ color:'var(--muted)' }}>{sudahN} dari {tampil.length} KK sudah bayar</div>

      <div className="grid grid-cols-2 gap-2">
        {tampil.map(w => {
          const p = bayar.has(w.id);
          return (
            <button key={w.id} onClick={() => toggle(w)}
              className="flex items-center gap-2 rounded-xl p-2.5 text-left transition-transform active:scale-95"
              style={{
                background: p ? 'var(--paid)' : 'var(--surface)',
                border: p ? '1.5px solid var(--paid)' : '1.5px dashed var(--line)',
                color: p ? '#fff' : 'var(--ink)',
              }}>
              <span className="text-[10px] font-extrabold rounded px-1.5 py-0.5 flex-none"
                style={{ background: p ? 'rgba(255,255,255,.2)' : 'var(--paper)',
                  color: p ? '#DFF2E7' : 'var(--muted)' }}>{w.no_rumah}</span>
              <span className="text-[11.5px] font-semibold flex-1 truncate">{w.nama_kk}</span>
              <span className="text-[12px] font-extrabold flex-none w-3.5 text-center">{p ? '✓' : ''}</span>
            </button>
          );
        })}
      </div>

      {tampil.length === 0 && (
        <p className="text-center text-[12px] mt-8" style={{ color:'var(--muted)' }}>
          Belum ada anggota aktif di bulan ini.
        </p>
      )}

      {toast && (
        <div className="fixed left-4 right-4 bottom-20 z-40 text-white rounded-xl px-3 py-2.5 text-[12px] font-semibold"
          style={{ background:'var(--ink)' }}>{toast}</div>
      )}
    </div>
  );
}
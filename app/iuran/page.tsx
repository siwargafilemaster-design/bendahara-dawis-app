'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ambilPengaturan, angka } from '@/lib/pengaturan';
import { periodeSekarang, namaBulan, geser } from '@/lib/periode';
import { baueIuran, simpanTransaksi, batalkan, Kantong } from '@/lib/transaksi';
import { db } from '@/lib/db';
import { prosesOutbox } from '@/lib/outbox';
import { denganTimeout } from '@/lib/net';
import SheetIuran from '@/components/sheet-iuran';

type Warga = {
  id: string; no_rumah: string; nama_kk: string;
  periode_awal: string; periode_akhir: string | null;
};

export default function Iuran() {
  const [periode, setPeriode] = useState(periodeSekarang());
  const [warga, setWarga] = useState<Warga[]>([]);
  const [bayar, setBayar] = useState<Map<string, string>>(new Map());
  const [iuran, setIuran] = useState(10000);
  const [toast, setToast] = useState('');
  const [sheet, setSheet] = useState<Warga | null>(null);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLong = useRef(false);

  // ── muat daftar warga (server → snapshot fallback)
  useEffect(() => {
    ambilPengaturan().then(p => setIuran(angka(p, 'iuran_flat', 10000))).catch(() => {});
    (async () => {
      try {
        const res: any = await denganTimeout(
          supabase.from('warga')
            .select('id,no_rumah,nama_kk,periode_awal,periode_akhir')
            .order('no_rumah')
        );
        const data = res.data;
        if (data) {
          setWarga(data);
          await db.snapshot.put({ kunci: 'warga', data, disimpan: Date.now() });
        }
      } catch {
        const snap = await db.snapshot.get('warga');
        if (snap) setWarga(snap.data);
      }
    })();
  }, []);

  // ── muat status bayar: server → snapshot → overlay outbox
  const muatBayar = useCallback(async () => {
    let m = new Map<string, string>();

    try {
      const res: any = await denganTimeout(
        supabase.from('transaksi')
          .select('id, warga_id')
          .eq('jenis', 'masuk').eq('periode', periode).eq('dibatalkan', false)
      );
      (res.data ?? []).forEach((r: any) => m.set(r.warga_id, r.id));
      await db.snapshot.put({ kunci: `bayar:${periode}`, data: [...m], disimpan: Date.now() });
    } catch {
      const snap = await db.snapshot.get(`bayar:${periode}`);
      if (snap) m = new Map(snap.data);
    }

    // overlay outbox — baris yang belum sampai server
    const antri = await db.outbox.toArray();
    for (const it of antri) {
      if (it.tipe === 'insert') {
        const r: any = it.payload;
        if (r.jenis === 'masuk' && r.periode === periode) m.set(r.warga_id, r.id);
      } else {
        // batal: cari warga yang id transaksinya = target, hapus dari map
        const target = (it.payload as any).id;
        for (const [wid, tid] of m) if (tid === target) m.delete(wid);
      }
    }

    setBayar(m);
  }, [periode]);

  useEffect(() => { muatBayar(); }, [muatBayar]);

  // proses antrian saat online kembali
  useEffect(() => {
    const on = () => prosesOutbox().then(muatBayar);
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [muatBayar]);

  const tampil = warga.filter(w =>
    w.periode_awal <= periode &&
    (w.periode_akhir === null || w.periode_akhir >= periode));

  function pesan(m: string) { setToast(m); setTimeout(() => setToast(''), 2200); }

  async function toggle(w: Warga) {
    const sudah = bayar.get(w.id);
    if (sudah) {
      const next = new Map(bayar); next.delete(w.id); setBayar(next);
      pesan(`${w.no_rumah} · ${w.nama_kk} — dibatalkan`);
      await batalkan(sudah);
    } else {
      const row = baueIuran(w.id, periode, iuran, 'tunai');
      const next = new Map(bayar); next.set(w.id, row.id); setBayar(next);
      pesan(`${w.no_rumah} · ${w.nama_kk} — tersimpan`);
      await simpanTransaksi([row]);
    }
  }

  async function simpanBatch(w: Warga, kantong: Kantong, jumlahBulan: number) {
    setSheet(null);
    const batch = jumlahBulan > 1 ? crypto.randomUUID() : null;
    const rows = Array.from({ length: jumlahBulan }, (_, i) =>
      baueIuran(w.id, geser(periode, i), iuran, kantong, batch));
    const next = new Map(bayar);
    rows.forEach(r => { if (r.periode === periode) next.set(w.id, r.id); });
    setBayar(next);
    pesan(`${w.no_rumah} · ${w.nama_kk} — ${jumlahBulan} bulan`);
    await simpanTransaksi(rows);
  }

  const lpProps = (w: Warga) => ({
    onPointerDown: () => {
      isLong.current = false;
      pressTimer.current = setTimeout(() => { isLong.current = true; setSheet(w); }, 450);
    },
    onPointerUp: () => { if (pressTimer.current) clearTimeout(pressTimer.current); },
    onPointerLeave: () => { if (pressTimer.current) clearTimeout(pressTimer.current); },
  });

  const sudahN = tampil.filter(w => bayar.has(w.id)).length;

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between bg-white border rounded-xl p-2 mb-3"
        style={{ borderColor: 'var(--line)' }}>
        <button onClick={() => setPeriode(geser(periode, -1))}
          className="w-8 h-8 rounded-lg border" style={{ borderColor: 'var(--line)' }}>‹</button>
        <b className="text-sm">{namaBulan(periode, true)}</b>
        <button onClick={() => setPeriode(geser(periode, 1))}
          disabled={periode >= periodeSekarang()}
          className="w-8 h-8 rounded-lg border disabled:opacity-30"
          style={{ borderColor: 'var(--line)' }}>›</button>
      </div>

      <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--line)' }}>
        <div className="h-full rounded-full transition-all"
          style={{ background: 'var(--paid)', width: tampil.length ? `${sudahN / tampil.length * 100}%` : '0' }} />
      </div>
      <div className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
        style={{ color: 'var(--muted)' }}>{sudahN} dari {tampil.length} KK sudah bayar</div>

      <div className="grid grid-cols-2 gap-2">
        {tampil.map(w => {
          const p = bayar.has(w.id);
          return (
            <button key={w.id}
              {...lpProps(w)}
              onClick={() => { if (!isLong.current) toggle(w); }}
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
        <p className="text-center text-[12px] mt-8" style={{ color: 'var(--muted)' }}>
          Belum ada anggota aktif di bulan ini.
        </p>
      )}

      {toast && (
        <div className="fixed left-4 right-4 bottom-20 z-40 text-white rounded-xl px-3 py-2.5 text-[12px] font-semibold"
          style={{ background: 'var(--ink)' }}>{toast}</div>
      )}

      {sheet && (
        <SheetIuran
          nama={sheet.nama_kk} noRumah={sheet.no_rumah}
          periodeAwal={periode} iuran={iuran}
          onTutup={() => setSheet(null)}
          onSimpan={(k, n) => simpanBatch(sheet, k, n)}
        />
      )}
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatKetik, parseRupiah, rupiah } from '@/lib/uang';
import { Kantong } from '@/lib/transaksi';

export default function SheetPindah({ onTutup, onSelesai }:
  { onTutup: () => void; onSelesai: () => void }) {

  const [dari, setDari] = useState<Kantong>('tunai');
  const [jumlah, setJumlah] = useState('');
  const [admin, setAdmin] = useState('');
  const [idAdmin, setIdAdmin] = useState('');
  const [simpan, setSimpan] = useState(false);
  const [err, setErr] = useState('');

  const ke: Kantong = dari === 'tunai' ? 'dana' : 'tunai';

  useEffect(() => {
    supabase.from('kategori').select('id').eq('nama', 'Biaya admin').single()
      .then(({ data }) => data && setIdAdmin(data.id));
  }, []);

  async function kirim() {
    const j = parseRupiah(jumlah);
    const a = parseRupiah(admin);
    if (!j) return setErr('Jumlah wajib diisi');
    setSimpan(true); setErr('');

    const d = new Date();
    const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const batch = crypto.randomUUID();

    const rows: any[] = [{
      id: crypto.randomUUID(), tanggal: tgl, jenis: 'pindah',
      kantong: dari, kantong_tujuan: ke, kategori_id: null,
      warga_id: null, periode: null, nominal: j,
      catatan: null, batch_id: batch, resi_status: 'skip', dibatalkan: false,
    }];

    if (a > 0 && idAdmin) {
      rows.push({
        id: crypto.randomUUID(), tanggal: tgl, jenis: 'keluar',
        kantong: dari, kantong_tujuan: null, kategori_id: idAdmin,
        warga_id: null, periode: null, nominal: a,
        catatan: 'Biaya admin pindah', batch_id: batch,
        resi_status: 'skip', dibatalkan: false,
      });
    }

    const { error } = await supabase.from('transaksi').insert(rows);
    setSimpan(false);
    if (error) return setErr('Gagal: ' + error.message);
    onSelesai();
  }

  const F = 'w-full p-3 rounded-xl border bg-white text-[15px] font-bold';
  const S = { borderColor: 'var(--line)' };
  const lbl = (k: Kantong) => k === 'dana' ? 'DANA' : 'Tunai';

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(10,20,15,.5)' }} onClick={onTutup} />
      <div className="fixed left-0 right-0 bottom-0 z-40 rounded-t-3xl p-4 safe-b"
        style={{ background: 'var(--paper)' }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--line)' }} />
        <h3 className="text-base font-extrabold mb-3">Pindah antar kantong</h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 py-2.5 rounded-xl border text-center font-bold" style={S}>{lbl(dari)}</div>
          <button onClick={() => setDari(ke)}
            className="w-10 h-10 rounded-xl border flex-none" style={S}>⇄</button>
          <div className="flex-1 py-2.5 rounded-xl border text-center font-bold" style={S}>{lbl(ke)}</div>
        </div>

        <input className={F + ' mb-2.5'} style={S} inputMode="numeric"
          placeholder="Jumlah" value={formatKetik(jumlah)}
          onChange={e => setJumlah(e.target.value)} />

        <input className={F} style={S} inputMode="numeric"
          placeholder="Biaya admin (0 kalau tidak ada)" value={formatKetik(admin)}
          onChange={e => setAdmin(e.target.value)} />

        {parseRupiah(admin) > 0 && parseRupiah(jumlah) > 0 && (
          <p className="text-[10.5px] mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
            {lbl(dari)} −{rupiah(parseRupiah(jumlah) + parseRupiah(admin))} ·
            {' '}{lbl(ke)} +{rupiah(parseRupiah(jumlah))} ·
            {' '}admin {rupiah(parseRupiah(admin))} jadi pengeluaran
          </p>
        )}

        {err && <p className="text-[12px] mt-2" style={{ color: 'var(--brick)' }}>{err}</p>}

        <button onClick={kirim} disabled={simpan}
          className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 mt-3"
          style={{ background: 'var(--brand)' }}>
          {simpan ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatKetik, parseRupiah } from '@/lib/uang';
import { Kantong } from '@/lib/transaksi';

type Kategori = { id: string; nama: string };

export default function SheetKas({ onTutup, onSelesai }:
  { onTutup: () => void; onSelesai: () => void }) {

  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [katId, setKatId] = useState('');
  const [nominal, setNominal] = useState('');
  const [kantong, setKantong] = useState<Kantong>('tunai');
  const [catatan, setCatatan] = useState('');
  const [simpan, setSimpan] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.from('kategori').select('id,nama').eq('aktif', true).order('urutan')
      .then(({ data }) => { setKategori(data ?? []); if (data?.[0]) setKatId(data[0].id); });
  }, []);

  async function kirim() {
    const n = parseRupiah(nominal);
    if (!n) return setErr('Nominal wajib diisi');
    if (!katId) return setErr('Pilih kategori');
    setSimpan(true); setErr('');

    const d = new Date();
    const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const { error } = await supabase.from('transaksi').insert({
      id: crypto.randomUUID(), tanggal: tgl, jenis: 'keluar',
      kantong, kantong_tujuan: null, kategori_id: katId,
      warga_id: null, periode: null, nominal: n,
      catatan: catatan.trim() || null, resi_status: 'skip', dibatalkan: false,
    });

    setSimpan(false);
    if (error) return setErr('Gagal: ' + error.message);
    onSelesai();
  }

  const F = 'w-full p-3 rounded-xl border bg-white text-[15px] font-bold';
  const S = { borderColor: 'var(--line)' };

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(10,20,15,.5)' }} onClick={onTutup} />
      <div className="fixed left-0 right-0 bottom-0 z-40 rounded-t-3xl p-4 safe-b"
        style={{ background: 'var(--paper)' }}>
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--line)' }} />
        <h3 className="text-base font-extrabold mb-3">Catat pengeluaran</h3>

        <input className={F + ' mb-2.5'} style={S} inputMode="numeric"
          placeholder="Nominal" value={formatKetik(nominal)}
          onChange={e => setNominal(e.target.value)} />

        <div className="flex gap-2 mb-2.5">
          {(['tunai', 'dana'] as Kantong[]).map(k => (
            <button key={k} onClick={() => setKantong(k)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border"
              style={{ background: kantong === k ? 'var(--brand)' : 'var(--surface)',
                color: kantong === k ? '#fff' : 'var(--ink)',
                borderColor: kantong === k ? 'var(--brand)' : 'var(--line)' }}>
              {k === 'dana' ? 'DANA' : 'Tunai'}
            </button>
          ))}
        </div>

        <select className={F + ' mb-2.5'} style={S} value={katId}
          onChange={e => setKatId(e.target.value)}>
          {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>

        <input className={F + ' mb-3'} style={S} placeholder="Catatan (opsional)"
          value={catatan} onChange={e => setCatatan(e.target.value)} />

        {err && <p className="text-[12px] mb-2" style={{ color: 'var(--brick)' }}>{err}</p>}

        <button onClick={kirim} disabled={simpan}
          className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
          style={{ background: 'var(--brand)' }}>
          {simpan ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </>
  );
}
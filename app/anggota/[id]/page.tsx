'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { namaBulan, periodeAkhirDari } from '@/lib/periode';
import { normalWA } from '@/lib/uang';

type Warga = {
  id: string; no_rumah: string; nama_kk: string; no_wa: string;
  tgl_gabung: string; tgl_keluar: string | null;
  periode_awal: string; periode_akhir: string | null; catatan: string | null;
};

export default function DetailAnggota() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [w, setW] = useState<Warga | null>(null);
  const [edit, setEdit] = useState(false);
  const [nama, setNama] = useState('');
  const [wa, setWa] = useState('');
  const [catatan, setCatatan] = useState('');
  const [tglKeluar, setTglKeluar] = useState('');
  const [pesan, setPesan] = useState('');
  const [simpan, setSimpan] = useState(false);

  async function muat() {
    const { data } = await supabase.from('warga').select('*').eq('id', id).single();
    if (data) {
      setW(data);
      setNama(data.nama_kk); setWa(data.no_wa);
      setCatatan(data.catatan ?? ''); setTglKeluar(data.tgl_keluar ?? '');
    }
  }
  useEffect(() => { muat(); }, [id]);

  async function simpanEdit() {
    if (!nama.trim() || !wa.trim()) return setPesan('Nama & WA wajib diisi');
    setSimpan(true); setPesan('');
    const { error } = await supabase.from('warga').update({
      nama_kk: nama.trim(), no_wa: normalWA(wa), catatan: catatan.trim() || null,
    }).eq('id', id);
    setSimpan(false);
    if (error) return setPesan('Gagal: ' + error.message);
    setEdit(false); muat();
  }

  // tutup buku anggota: tandai keluar + hitung periode_akhir
  async function tandaiKeluar() {
    if (!tglKeluar) return setPesan('Isi tanggal keluar dulu');
    setSimpan(true); setPesan('');
    const pAkhir = periodeAkhirDari(tglKeluar);
    const { error } = await supabase.from('warga').update({
      tgl_keluar: tglKeluar, periode_akhir: pAkhir,
    }).eq('id', id);
    setSimpan(false);
    if (error) return setPesan('Gagal: ' + error.message);

    // ── hitung tunggakan → susun pesan → tawarkan kirim WA ──
    const { semuaIuran } = await import('@/lib/transaksi');
    const { hitungTunggakan } = await import('@/lib/tunggakan');
    const { pesanPindah } = await import('@/lib/pesan');
    const { ambilPengaturan, angka } = await import('@/lib/pengaturan');
    const { namaBulan } = await import('@/lib/periode');

    const peng = await ambilPengaturan();
    const bayar = await semuaIuran();
    const t = hitungTunggakan(
      { id: w!.id, no_rumah: w!.no_rumah, nama_kk: w!.nama_kk, no_wa: w!.no_wa,
        periode_awal: w!.periode_awal, periode_akhir: pAkhir },
      bayar, angka(peng, 'iuran_flat', 10000)
    );

    const teks = pesanPindah({
      namaDawis: peng['nama_dawis'] ?? 'Dasa Wisma',
      namaKK: w!.nama_kk, noRumah: w!.no_rumah,
      namaBendahara: peng['nama_bendahara'] ?? '',
      tunggakanBulan: t.bulan.map(b => namaBulan(b)),
      totalTunggakan: t.total,
    });

    const waLink = `https://wa.me/${w!.no_wa}?text=${encodeURIComponent(teks)}`;
    if (confirm('Kirim pesan pamit/tagihan ke WhatsApp anggota ini?')) {
      window.open(waLink, '_blank');
    }

    muat();
  }

  async function batalKeluar() {
    setSimpan(true);
    const { error } = await supabase.from('warga').update({
      tgl_keluar: null, periode_akhir: null,
    }).eq('id', id);
    setSimpan(false);
    if (error) return setPesan('Gagal: ' + error.message);
    setTglKeluar(''); muat();
  }

  if (!w) return <div className="p-4" style={{ color: 'var(--muted)' }}>Memuat…</div>;

  const F = 'w-full p-3 rounded-xl border bg-white text-[15px] font-bold';
  const S = { borderColor: 'var(--line)' };
  const Lb = ({ t }: { t: string }) => (
    <label className="block text-[10px] font-extrabold tracking-widest uppercase mb-1.5"
      style={{ color: 'var(--muted)' }}>{t}</label>
  );

  return (
    <div className="p-4 pb-24">
      {/* kartu identitas */}
      <div className="rounded-2xl bg-white border p-4 mb-4" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl grid place-items-center text-[13px] font-extrabold flex-none"
            style={{ background: 'var(--paper)', color: 'var(--muted)' }}>{w.no_rumah}</span>
          <div className="flex-1 min-w-0">
            <b className="block text-[15px]">{w.nama_kk}</b>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {w.no_wa} · sejak {namaBulan(w.periode_awal)}
            </span>
          </div>
        </div>
        {w.tgl_keluar && (
          <div className="mt-3 rounded-lg px-3 py-2 text-[11px] font-bold"
            style={{ background: '#FAE7E3', color: 'var(--brick)' }}>
            Sudah keluar sejak {w.tgl_keluar} · ditagih s/d {w.periode_akhir ? namaBulan(w.periode_akhir) : '—'}
          </div>
        )}
      </div>

      {/* mode edit */}
      {edit ? (
        <div className="rounded-2xl bg-white border p-4 mb-4" style={{ borderColor: 'var(--line)' }}>
          <Lb t="Nama KK" />
          <input className={F + ' mb-2.5'} style={S} value={nama} onChange={e => setNama(e.target.value)} />
          <Lb t="Nomor WhatsApp" />
          <input className={F + ' mb-2.5'} style={S} inputMode="tel" value={wa} onChange={e => setWa(e.target.value)} />
          <Lb t="Catatan" />
          <input className={F + ' mb-3'} style={S} value={catatan} onChange={e => setCatatan(e.target.value)} />
          {pesan && <p className="text-[12px] mb-2" style={{ color: 'var(--brick)' }}>{pesan}</p>}
          <div className="flex gap-2">
            <button onClick={() => setEdit(false)}
              className="flex-1 py-2.5 rounded-xl border font-bold text-[13px]"
              style={{ borderColor: 'var(--line)' }}>Batal</button>
            <button onClick={simpanEdit} disabled={simpan}
              className="flex-1 py-2.5 rounded-xl text-white font-bold text-[13px] disabled:opacity-50"
              style={{ background: 'var(--brand)' }}>{simpan ? '…' : 'Simpan'}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEdit(true)}
          className="w-full py-3 rounded-xl border font-bold text-[13px] mb-4"
          style={{ borderColor: 'var(--line)', color: 'var(--brand)' }}>
          Ubah data anggota
        </button>
      )}

      {/* tutup buku anggota */}
      {!edit && (
        <div className="rounded-2xl bg-white border p-4" style={{ borderColor: 'var(--line)' }}>
          <div className="text-[12px] font-extrabold mb-1">Tutup buku anggota</div>
          <p className="text-[10.5px] mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
            Tandai kalau anggota pindah/keluar. Aturan: keluar sebelum kumpulan (Minggu ke-2) →
            tak ditagih bulan itu; pada/sesudahnya → tetap ditagih.
          </p>
          {w.tgl_keluar ? (
            <button onClick={batalKeluar} disabled={simpan}
              className="w-full py-2.5 rounded-xl border font-bold text-[13px] disabled:opacity-50"
              style={{ borderColor: 'var(--line)', color: 'var(--brand)' }}>
              Batalkan status keluar
            </button>
          ) : (
            <>
              <Lb t="Tanggal keluar" />
              <input className={F + ' mb-2.5'} style={S} type="date"
                value={tglKeluar} onChange={e => setTglKeluar(e.target.value)} />
              {pesan && <p className="text-[12px] mb-2" style={{ color: 'var(--brick)' }}>{pesan}</p>}
              <button onClick={tandaiKeluar} disabled={simpan}
                className="w-full py-2.5 rounded-xl font-bold text-[13px] text-white disabled:opacity-50"
                style={{ background: 'var(--brick)' }}>
                {simpan ? '…' : 'Tandai keluar'}
              </button>
            </>
          )}
        </div>
      )}

      <button onClick={() => router.push('/anggota')}
        className="w-full py-3 mt-4 text-[12px] font-bold" style={{ color: 'var(--muted)' }}>
        ‹ Kembali ke daftar
      </button>
    </div>
  );
}
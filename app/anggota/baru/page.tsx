'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ambilPengaturan, angka } from '@/lib/pengaturan';
import { periodeAwalDari, namaBulan } from '@/lib/periode';
import { normalWA } from '@/lib/uang';

const lanjutRumah = (s: string) => {
  const m = s.match(/^([A-Za-z]+)(\d+)$/);
  return m ? m[1].toUpperCase() + (parseInt(m[2], 10) + 1) : s;
};

export default function AnggotaBaru() {
  const [noRumah, setNoRumah] = useState('A1');
  const [nama, setNama]       = useState('');
  const [wa, setWa]           = useState('');
  const [tglGabung, setTgl]   = useState('');
  const [catatan, setCatatan] = useState('');
  const [ambang, setAmbang]   = useState(15);
  const [periodeAwal, setPA]  = useState('');
  const [manual, setManual]   = useState(false);
  const [pesan, setPesan]     = useState('');
  const [jml, setJml]         = useState(0);
  const namaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ambilPengaturan().then(p => {
      setAmbang(angka(p, 'ambang_prorata', 15));
      setTgl(t => t || (p['tgl_mulai'] ?? ''));
    });
  }, []);

  // periode_awal ikut tanggal — sampai istri mengubahnya manual
  useEffect(() => {
    if (tglGabung && !manual) setPA(periodeAwalDari(tglGabung));
  }, [tglGabung, manual]);

  async function simpan() {
    if (!nama.trim() || !wa.trim() || !tglGabung) {
      return setPesan('Nama, WA, dan tanggal wajib diisi');
    }
    const { error } = await supabase.from('warga').insert({
      no_rumah: noRumah.trim().toUpperCase(),
      nama_kk: nama.trim(),
      no_wa: normalWA(wa),
      tgl_gabung: tglGabung,
      periode_awal: periodeAwal,
      catatan: catatan.trim() || null,
    });

    if (error) {
      return setPesan(
        error.code === '23505'
          ? `${noRumah} sudah ada penghuni aktif`
          : 'Gagal simpan: ' + error.message
      );
    }

    // ⚠️ INTI: form TETAP terbuka, siap baris berikutnya
    setJml(n => n + 1);
    setPesan(`✓ ${noRumah} · ${nama} tersimpan`);
    setNoRumah(lanjutRumah(noRumah));   // A1 → A2, bisa ditimpa
    setNama('');
    setWa('');
    setCatatan('');
    setManual(false);
    namaRef.current?.focus();           // langsung siap ngetik
    // tglGabung SENGAJA tidak direset — 25 anggota awal tanggalnya sama
  }

  const F = 'w-full p-3 rounded-xl border bg-white text-[15px] font-bold';
  const S = { borderColor: 'var(--line)' };
  const Lb = ({ t }: { t: string }) => (
    <label className="block text-[10px] font-extrabold tracking-widest uppercase mb-1.5"
      style={{ color: 'var(--muted)' }}>{t}</label>
  );

  return (
    <div className="p-4 pb-24">
      <div className="flex gap-2 mb-2.5">
        <div className="flex-1">
          <Lb t="No. Rumah" />
          <input className={F} style={S} value={noRumah}
            onChange={e => setNoRumah(e.target.value)} />
        </div>
        <div className="flex-1">
          <Lb t="Tgl gabung" />
          <input className={F} style={S} type="date" value={tglGabung}
            onChange={e => setTgl(e.target.value)} />
        </div>
      </div>

      <div className="mb-2.5">
        <Lb t="Nama KK" />
        <input ref={namaRef} className={F} style={S} placeholder="Bu ..."
          value={nama} onChange={e => setNama(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && simpan()} />
      </div>

      <div className="mb-2.5">
        <Lb t="Nomor WhatsApp" />
        <input className={F} style={S} inputMode="tel" placeholder="0857..."
          value={wa} onChange={e => setWa(e.target.value)} />
      </div>

      <div className="mb-2.5">
        <Lb t="Mulai ditagih" />
        <input
          className={F + ' border-dashed'}
          style={{ ...S, color: 'var(--brand)', background: '#F4F8F5' }}
          value={periodeAwal ? namaBulan(periodeAwal, true) : ''}
          onChange={e => { setManual(true); setPA(e.target.value); }}
          readOnly={!manual}
          onClick={() => setManual(true)}
        />
        <p className="text-[10.5px] mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Otomatis dari tanggal gabung (ambang tgl {ambang}). Ketuk untuk ubah manual.
        </p>
      </div>

      <div className="mb-3">
        <Lb t="Catatan" />
        <input className={F} style={S} placeholder="mis. ngontrak"
          value={catatan} onChange={e => setCatatan(e.target.value)} />
      </div>

      {pesan && (
        <p className="text-xs font-bold mb-2 text-center"
           style={{ color: pesan.startsWith('✓') ? 'var(--paid)' : 'var(--brick)' }}>
          {pesan}
        </p>
      )}

      <button onClick={simpan}
        className="w-full p-3 rounded-xl text-white font-bold"
        style={{ background: 'var(--brand)' }}>
        Simpan &amp; lanjut berikutnya
      </button>

      <p className="text-[10.5px] text-center mt-2.5" style={{ color: 'var(--muted)' }}>
        {jml} tersimpan sesi ini · form tetap terbuka
      </p>
    </div>
  );
}
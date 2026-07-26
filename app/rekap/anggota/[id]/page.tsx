'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { susunKartu, bulanNunggak, SelBulan, KartuWarga } from '@/lib/kartu';
import { namaBulan } from '@/lib/periode';
import { ambilPengaturan, angka } from '@/lib/pengaturan';
import { rupiah } from '@/lib/uang';

const NAMA_BL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function KartuIuran() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [warga, setWarga] = useState<KartuWarga | null>(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [sel, setSel] = useState<SelBulan[]>([]);
  const [iuran, setIuran] = useState(10000);
  const [namaDawis, setNamaDawis] = useState('Dasa Wisma');
  const [namaBendahara, setNamaBendahara] = useState('');
  const [detail, setDetail] = useState<SelBulan | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('warga')
        .select('id,no_rumah,nama_kk,no_wa,periode_awal,periode_akhir').eq('id', id).single();
      if (data) setWarga({
        id: data.id, noRumah: data.no_rumah, namaKK: data.nama_kk, noWa: data.no_wa,
        periodeAwal: data.periode_awal, periodeAkhir: data.periode_akhir,
      });
      const p = await ambilPengaturan();
      setIuran(angka(p, 'iuran_flat', 10000));
      setNamaDawis(p['nama_dawis'] ?? 'Dasa Wisma');
      setNamaBendahara(p['nama_bendahara'] ?? '');
    })();
  }, [id]);

  useEffect(() => {
    if (warga) susunKartu(warga, tahun).then(setSel);
  }, [warga, tahun]);

  const nunggak = bulanNunggak(sel);
  const totalNunggak = nunggak.length * iuran;

  function ingatkan() {
    if (!warga || nunggak.length === 0) return;
    const daftar = nunggak.map(p => namaBulan(p)).join(', ');
    const teks = `*INFO IURAN KAS DAWIS*
${namaDawis}

Halo Bu *${warga.namaKK}* (${warga.noRumah}) 🌸

Mohon maaf mengingatkan, iuran kas berikut belum terbayar:

📋 Bulan : ${daftar}
💵 Total : *${rupiah(totalNunggak)}*

Bisa dibayarkan saat kumpulan atau transfer ya Bu. Matur nuwun 🙏

Salam hangat,
*${namaBendahara || 'Bendahara Dawis'}*`;
    window.open(`https://wa.me/${warga.noWa}?text=${encodeURIComponent(teks)}`, '_blank');
  }

  const gaya = (s: string) => {
    if (s === 'lunas') return { background: 'var(--paid)', borderColor: 'var(--paid)', color: '#fff' };
    if (s === 'nunggak') return { background: '#FBECEA', borderColor: '#E8C4BD', color: 'var(--brick)' };
    if (s === 'belum') return { background: 'var(--surface)', borderStyle: 'dashed', borderColor: 'var(--line)', color: 'var(--muted)' };
    return { background: '#F4F5F3', borderColor: 'transparent', color: '#C2C9C4' }; // luar
  };
  const teksStatus = (s: string) =>
    s === 'lunas' ? '✓ lunas' : s === 'nunggak' ? 'nunggak' : s === 'belum' ? 'blm' : '—';

  if (!warga) return <div className="p-4" style={{ color: 'var(--muted)' }}>Memuat…</div>;

  return (
    <div className="p-4 pb-24">
      {/* identitas */}
      <div className="flex items-center gap-3 rounded-2xl bg-white border p-3.5 mb-4"
        style={{ borderColor: 'var(--line)' }}>
        <span className="w-11 h-11 rounded-xl grid place-items-center text-[13px] font-extrabold flex-none"
          style={{ background: 'var(--paper)', color: 'var(--muted)' }}>{warga.noRumah}</span>
        <div className="flex-1 min-w-0">
          <b className="text-[15px]">{warga.namaKK}</b>
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
            sejak {namaBulan(warga.periodeAwal)}
            {warga.periodeAkhir ? ` · s/d ${namaBulan(warga.periodeAkhir)}` : ''}
          </div>
        </div>
      </div>

      {/* pemilih tahun */}
      <div className="flex items-center justify-between bg-white border rounded-xl p-2 mb-3"
        style={{ borderColor: 'var(--line)' }}>
        <button onClick={() => setTahun(t => t - 1)}
          className="w-8 h-8 rounded-lg border" style={{ borderColor: 'var(--line)' }}>‹</button>
        <b className="text-sm num">{tahun}</b>
        <button onClick={() => setTahun(t => t + 1)}
          disabled={tahun >= new Date().getFullYear()}
          className="w-8 h-8 rounded-lg border disabled:opacity-30" style={{ borderColor: 'var(--line)' }}>›</button>
      </div>

      {/* grid 12 bulan */}
      <div className="grid grid-cols-3 gap-2">
        {sel.map(s => (
          <button key={s.bulan}
            onClick={() => s.status === 'lunas' || s.status === 'nunggak' ? setDetail(s) : null}
            className="rounded-xl py-2.5 border text-center"
            style={{ ...gaya(s.status), borderWidth: '1.5px' }}>
            <div className="text-[11px] font-extrabold">{NAMA_BL[s.bulan - 1]}</div>
            <div className="text-[8.5px] font-bold mt-0.5">{teksStatus(s.status)}</div>
          </button>
        ))}
      </div>

      {/* legenda */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px]" style={{ color: 'var(--muted)' }}>
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: 'var(--paid)' }} />Lunas</span>
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: '#FBECEA', border: '1px solid #E8C4BD' }} />Nunggak</span>
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: '#fff', border: '1px dashed var(--line)' }} />Belum jatuh tempo</span>
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-middle" style={{ background: '#F4F5F3' }} />Di luar masa</span>
      </div>
      <p className="text-[10px] mt-2.5 text-center" style={{ color: 'var(--muted)' }}>
        Ketuk kotak bulan untuk lihat detail
      </p>

      {/* ringkasan tunggakan + reminder */}
      {nunggak.length > 0 ? (
        <>
          <div className="rounded-xl p-3 mt-4" style={{ background: '#FBECEA', border: '1px solid #E8C4BD' }}>
            <div className="text-[12px] font-extrabold" style={{ color: 'var(--brick)' }}>
              Tunggakan: {nunggak.map(p => namaBulan(p)).join(', ')}
            </div>
            <div className="text-[10.5px] mt-0.5" style={{ color: '#96564C' }}>
              Total {rupiah(totalNunggak)} · {nunggak.length} bulan belum terbayar
            </div>
          </div>
          <button onClick={ingatkan}
            className="w-full py-3 rounded-xl text-white font-bold mt-3"
            style={{ background: 'var(--brand)' }}>
            💬 Ingatkan via WhatsApp
          </button>
        </>
      ) : (
        <div className="rounded-xl p-3 mt-4" style={{ background: '#E3F1E8', border: '1px solid #BFE3CC' }}>
          <div className="text-[12px] font-extrabold" style={{ color: 'var(--brand)' }}>
            ✓ Tidak ada tunggakan di {tahun}
          </div>
        </div>
      )}

      <button onClick={() => router.push('/rekap/anggota')}
        className="w-full py-3 mt-4 text-[12px] font-bold" style={{ color: 'var(--muted)' }}>
        ‹ Kembali ke daftar
      </button>

      {/* sheet detail bulan */}
      {detail && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(10,20,15,.5)' }} onClick={() => setDetail(null)} />
          <div className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl p-4 safe-b max-w-[430px] mx-auto"
            style={{ background: 'var(--paper)' }}>
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--line)' }} />
            <h3 className="text-base font-extrabold mb-3">Iuran {namaBulan(detail.periode, true)}</h3>
            {detail.status === 'lunas' ? (
              <>
                <Drow k="Status" v="✓ Lunas" warna="var(--paid)" />
                <Drow k="Pembayaran" v={`Dibayar pada ${tglPanjang(detail.tanggalBayar!)}`} />
                <Drow k="Cara" v={detail.kantong === 'dana' ? 'DANA' : 'Tunai'} />
                <Drow k="Jumlah" v={rupiah(detail.nominal ?? 0)} />
                {detail.batchId && <Drow k="Catatan" v="bagian dari bayar beberapa bulan" warna="var(--muted)" />}
              </>
            ) : (
              <>
                <Drow k="Status" v="Belum dibayar" warna="var(--brick)" />
                <Drow k="Jumlah" v={rupiah(iuran)} />
                <p className="text-[10.5px] text-center mt-3" style={{ color: 'var(--muted)' }}>
                  Gunakan tombol Ingatkan di bawah kartu untuk semua tunggakan.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Drow({ k, v, warna }: { k: string; v: string; warna?: string }) {
  return (
    <div className="flex justify-between py-2 text-[13px]" style={{ borderBottom: '1px solid var(--line)' }}>
      <span style={{ color: 'var(--muted)' }}>{k}</span>
      <span className="font-bold" style={{ color: warna ?? 'var(--ink)' }}>{v}</span>
    </div>
  );
}

/** 'YYYY-MM-DD' → '5 Juli 2026' tanpa new Date */
function tglPanjang(iso: string): string {
  const B = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const [th, bl, tg] = iso.split('-').map(Number);
  return `${tg} ${B[bl - 1]} ${th}`;
}
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ambilPengaturan } from '@/lib/pengaturan';

export default function Beranda() {
  const [nama, setNama] = useState('');
  const [jml, setJml] = useState<number | null>(null);

  useEffect(() => {
    ambilPengaturan().then(p => setNama(p['nama_bendahara'] ?? '')).catch(() => {});
    supabase.from('warga').select('id', { count: 'exact', head: true })
      .is('tgl_keluar', null)
      .then(({ count }) => setJml(count ?? 0));
  }, []);

  return (
    <div className="p-4 pb-24">
      {/* Kartu sambutan — bukan kartu saldo. Saldo hadir di Fase 2. */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: 'linear-gradient(165deg,var(--brand),var(--brand-dk))' }}>
        <div className="text-[10px] font-extrabold tracking-widest uppercase"
          style={{ color: '#9BC3AC' }}>Selamat datang</div>
        <div className="text-2xl font-extrabold mt-1 leading-tight">
          {nama || 'Bendahara'}
        </div>
        <div className="text-[12px] mt-3" style={{ color: '#B9D3C4' }}>
          {jml === null ? 'Memuat…'
            : jml === 0 ? 'Belum ada anggota terdaftar.'
            : `${jml} anggota sudah terdaftar.`}
        </div>
      </div>

      {/* Pengarah tunggal ke pekerjaan Fase 1 */}
      <Link href="/anggota"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-white border p-4"
        style={{ borderColor: 'var(--line)' }}>
        <span className="w-11 h-11 rounded-xl grid place-items-center text-lg flex-none"
          style={{ background: '#E3F1E8' }}>👥</span>
        <span className="flex-1 min-w-0">
          <b className="block text-[14px] font-extrabold">
            {jml ? 'Kelola anggota' : 'Mulai: tambah anggota'}
          </b>
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {jml ? 'Lihat, tambah, atau ubah data KK' : 'Masukkan daftar KK Dawis'}
          </span>
        </span>
        <span style={{ color: 'var(--line)' }}>›</span>
      </Link>

      {/* Isyarat jujur bahwa fitur kas belum aktif */}
      <div className="mt-3 rounded-2xl border border-dashed p-4"
        style={{ borderColor: 'var(--line)' }}>
        <div className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
          Pencatatan iuran & kas
        </div>
        <div className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Menyusul setelah data anggota siap. Untuk sekarang, lengkapi dulu
          daftar anggota dan data di Pengaturan.
        </div>
      </div>
    </div>
  );
}

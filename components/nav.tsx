'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ambilPengaturan } from '@/lib/pengaturan';
import { supabase } from '@/lib/supabase';

const JUDUL: Record<string, string> = {
  '/iuran': 'Iuran',
  '/kas': 'Kas',
  '/rekap': 'Rekap',
  '/anggota': 'Anggota',
  '/anggota/baru': 'Tambah Anggota',
  '/pengaturan': 'Pengaturan',
};

// sub-layar → tampil tombol back, sembunyikan identitas
const SUB = ['/anggota', '/pengaturan'];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [p, setP] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let hidup = true;
    const muat = () => ambilPengaturan().then(v => hidup && setP(v)).catch(() => {});

    muat(); // percobaan pertama

    // muat ulang begitu sesi auth benar-benar siap
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) muat();
    });

    return () => { hidup = false; sub.subscription.unsubscribe(); };
  }, []);

  if (path === '/login') return null;

  const beranda = path === '/';
  const sub = SUB.some(s => path.startsWith(s));
  const judul = beranda ? (p['nama_dawis'] ?? 'Bendahara') : (JUDUL[path] ?? '');

  return (
    <header
      className="sticky top-0 z-20 flex items-start gap-3 px-4 text-white"
      style={{
        background: 'var(--brand)',
        paddingTop: beranda ? 14 : 12,
        paddingBottom: beranda ? 16 : 12,
        alignItems: beranda ? 'flex-start' : 'center',
      }}
    >
      {sub ? (
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-lg flex-none text-lg"
          style={{ background: 'rgba(255,255,255,.14)' }}>‹</button>
      ) : (
        <img src="/logo-gamersi.png" alt="Logo Gamersi" className="w-14 h-14 flex-none" />
      )}

      <div className="flex-1 min-w-0">
        <div className="font-extrabold leading-tight tracking-tight"
          style={{ fontSize: beranda ? 17 : 15 }}>{judul}</div>
        {beranda && (
          <div className="text-[10.5px] mt-0.5 leading-snug font-medium"
            style={{ color: '#B9D3C4' }}>{p['alamat'] ?? ''}</div>
        )}
      </div>

      {beranda && (
        <Link href="/pengaturan"
          className="text-right flex-none rounded-lg px-1.5 py-1"
          style={{ paddingTop: 2 }}>
          <div className="text-[11.5px] font-bold leading-tight whitespace-nowrap">
            {p['nama_bendahara'] ?? '—'} <span style={{ color: '#9BC3AC' }}>›</span>
          </div>
          <div className="inline-block mt-1 text-[8.5px] font-extrabold tracking-widest uppercase rounded-full px-1.5 py-0.5"
            style={{ background: 'var(--gold)', color: '#3A2A05' }}>Bendahara</div>
        </Link>
      )}
    </header>
  );
}
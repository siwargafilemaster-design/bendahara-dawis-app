'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',      label: 'Beranda' },
  { href: '/iuran', label: 'Iuran'   },
  { href: '/kas',   label: 'Kas'     },
  { href: '/rekap', label: 'Rekap'   },
];

export default function TabBar() {
  const path = usePathname();
  // Sub-layar: tab bar disembunyikan (blueprint §11)
  if (['/anggota', '/pengaturan', '/login'].some(p => path.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 flex bg-white border-t safe-b z-20"
         style={{ borderColor: 'var(--line)' }}>
      {TABS.map(t => (
        <Link key={t.href} href={t.href}
          className="flex-1 py-2 text-center text-[10px] font-bold"
          style={{ color: path === t.href ? 'var(--brand)' : 'var(--muted)' }}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
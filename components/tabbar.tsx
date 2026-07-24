'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardCheck, Wallet, BarChart3 } from 'lucide-react';

const TABS = [
  { href: '/',      label: 'Beranda', Icon: Home },
  { href: '/iuran', label: 'Iuran',   Icon: ClipboardCheck },
  { href: '/kas',   label: 'Kas',     Icon: Wallet },
  { href: '/rekap', label: 'Rekap',   Icon: BarChart3 },
];

export default function TabBar() {
  const path = usePathname();
  if (['/anggota', '/pengaturan', '/login'].some(p => path.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 flex bg-white border-t safe-b z-20"
      style={{ borderColor: 'var(--line)' }}>
      {TABS.map(({ href, label, Icon }) => {
        const aktif = path === href;
        return (
          <Link key={href} href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-1.5"
            style={{ color: aktif ? 'var(--brand)' : 'var(--muted)' }}>
            <Icon size={21} strokeWidth={aktif ? 2.4 : 1.9} />
            <span className="text-[9.5px]" style={{ fontWeight: aktif ? 800 : 700 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
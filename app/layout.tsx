import Gate from '@/components/gate';
import Nav from '@/components/nav';
import TabBar from '@/components/tabbar';
import DaftarSW from '@/components/daftar-sw';
import './globals.css';

export const metadata = {
  title: 'Bendahara Dawis',
  manifest: '/manifest.json',                 // ← link ke manifest
  appleWebApp: {                              // ← iOS: buka full-screen
    capable: true,
    statusBarStyle: 'default' as const,
    title: 'Bendahara',
  },
  icons: {
    apple: '/icon-192.png',                   // ← ikon homescreen iOS
  },
};

export const viewport = {
  themeColor: '#1F5138',
  viewportFit: 'cover' as const,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <DaftarSW />
        <Gate>
          <Nav />
          <main className="min-h-screen pb-16">{children}</main>
          <TabBar />
        </Gate>
      </body>
    </html>
  );
}
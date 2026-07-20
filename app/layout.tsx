// app/layout.tsx (bagian body)
import Gate from '@/components/gate';
import Nav from '@/components/nav';
import TabBar from '@/components/tabbar';
import './globals.css';

export const metadata = { title: 'Bendahara Dawis' };
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
        <Gate>
          <Nav />
          <main className="min-h-screen pb-16">{children}</main>
          <TabBar />
        </Gate>
      </body>
    </html>
  );
}
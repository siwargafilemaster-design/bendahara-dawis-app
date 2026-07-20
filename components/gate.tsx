'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Gate({ children }: { children: React.ReactNode }) {
  const [siap, setSiap] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && path !== '/login') router.replace('/login');
      else setSiap(true);
    });
  }, [path, router]);

  if (!siap && path !== '/login') return null; // skeleton nanti, bukan splash
  return <>{children}</>;
}
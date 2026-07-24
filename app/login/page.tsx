'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [lihat, setLihat] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function masuk() {
    setLoading(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) return setErr('Email atau password salah');
    router.replace('/');
  }

  return (
    <div className="p-6 pt-20 max-w-sm mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Bendahara</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Masuk sekali saja. Setelah ini langsung terbuka.
      </p>

      <input className="w-full mb-2 p-3 rounded-xl border bg-white"
        style={{ borderColor: 'var(--line)' }}
        placeholder="Email" inputMode="email" autoCapitalize="none"
        value={email} onChange={e => setEmail(e.target.value)} />

      <div className="relative mb-3">
        <input className="w-full p-3 pr-12 rounded-xl border bg-white"
          style={{ borderColor: 'var(--line)' }}
          placeholder="Password" type={lihat ? 'text' : 'password'}
          value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && masuk()} />
        <button type="button" onClick={() => setLihat(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
          style={{ color: 'var(--muted)' }}
          aria-label={lihat ? 'Sembunyikan password' : 'Lihat password'}>
          {lihat ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {err && <p className="text-sm mb-3" style={{ color: 'var(--brick)' }}>{err}</p>}

      <button onClick={masuk} disabled={loading}
        className="w-full p-3 rounded-xl text-white font-bold disabled:opacity-50"
        style={{ background: 'var(--brand)' }}>
        {loading ? 'Sebentar…' : 'Masuk'}
      </button>
    </div>
  );
}
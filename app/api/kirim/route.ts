import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// klien server — bypass RLS, HANYA di server
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,           // TANPA NEXT_PUBLIC_
  { auth: { persistSession: false } }
);

const FONNTE = 'https://api.fonnte.com/send';

async function kirimWA(nomor: string, teks: string) {
  const res = await fetch(FONNTE, {
    method: 'POST',
    headers: {
      'Authorization': process.env.FONNTE_TOKEN!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ target: nomor, message: teks }),
  });
  const data = await res.json();
  // Fonnte balas { status: true/false, ... }
  if (!data.status) throw new Error(data.reason || 'Fonnte gagal');
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { transaksiIds, nomor, teks } = await req.json();

    if (!nomor || !teks || !Array.isArray(transaksiIds)) {
      return NextResponse.json({ ok: false, error: 'Data kurang' }, { status: 400 });
    }

    // 1) kirim WA
    await kirimWA(nomor, teks);

    // 2) tandai transaksi sebagai terkirim (server, bypass RLS)
    const { error } = await admin.from('transaksi')
      .update({ resi_status: 'terkirim', resi_dikirim_pada: new Date().toISOString() })
      .in('id', transaksiIds);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
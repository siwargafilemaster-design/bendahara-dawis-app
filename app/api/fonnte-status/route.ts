// app/api/fonnte-status/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.fonnte.com/device', {
      method: 'POST',
      headers: { 'Authorization': process.env.FONNTE_TOKEN! },
    });
    const data = await res.json();
    // device connected → data.device_status atau sejenis
    const aktif = data?.device_status === 'connect' || data?.status === true;
    return NextResponse.json({ aktif });
  } catch {
    return NextResponse.json({ aktif: false });
  }
}
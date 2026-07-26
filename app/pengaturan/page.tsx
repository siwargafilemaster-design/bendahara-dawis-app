"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ambilPengaturan, simpanPengaturan } from "@/lib/pengaturan";

type P = Record<string, string | null>;

const KELOMPOK: {
  judul: string;
  items: {
    k: string;
    label: string;
    hint?: string;
    kunciTetap?: boolean;
    kunciSaldo?: boolean;
  }[];
}[] = [
  {
    judul: "Identitas",
    items: [
      { k: "nama_dawis", label: "Nama Dawis" },
      {
        k: "alamat",
        label: "Alamat",
        hint: "Dipakai di header laporan WA & PDF",
      },
      { k: "nama_bendahara", label: "Nama bendahara" },
      {
        k: "rekening",
        label: "Rekening / DANA",
        hint: "Dipakai di pesan tagihan",
      },
    ],
  },
  {
    judul: "Aturan",
    items: [
      { k: "iuran_flat", label: "Iuran per bulan (Rp)" },
      {
        k: "jendela_resi_detik",
        label: "Jendela resi (detik)",
        hint: "Waktu membatalkan sebelum resi terbang",
      },
      { k: "tgl_kumpulan", label: "Jadwal kumpulan" },
    ],
  },
  {
    judul: "Awal & Sistem",
    items: [
      {
        k: "saldo_awal",
        label: "Saldo awal (Rp)",
        hint: "Terkunci sejak transaksi pertama",
        kunciSaldo: true,
      },
      { k: "tgl_mulai", label: "Mulai berlaku" },
      { k: "bulan_terkunci", label: "Bulan terkunci", kunciTetap: true },
    ],
  },
];

export default function Pengaturan() {
  const [p, setP] = useState<P>({});
  const [edit, setEdit] = useState<string | null>(null);
  const [draf, setDraf] = useState("");
  const [muat, setMuat] = useState(true);
  const [adaTransaksi, setAdaTransaksi] = useState(false);

  useEffect(() => {
    ambilPengaturan().then((v) => {
      setP(v);
      setMuat(false);
    });
    supabase
      .from("transaksi")
      .select("id", { count: "exact", head: true })
      .eq("dibatalkan", false)
      .then(({ count }) => setAdaTransaksi((count ?? 0) > 0));
  }, []);

  async function simpan(k: string) {
    await simpanPengaturan(k, draf);
    setP({ ...p, [k]: draf });
    setEdit(null);
  }

  if (muat)
    return (
      <div className="p-4" style={{ color: "var(--muted)" }}>
        Memuat…
      </div>
    );

  return (
    <div className="p-4 pb-24">
      <div
        className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
        style={{ color: "var(--muted)" }}
      >
        Data
      </div>
      <div
        className="rounded-2xl bg-white border mb-4"
        style={{ borderColor: "var(--line)" }}
      >
        <Link
          href="/anggota"
          className="flex items-center gap-3 p-3.5 border-b"
          style={{ borderColor: "var(--line)" }}
        >
          <span
            className="w-8 h-8 rounded-lg grid place-items-center text-sm"
            style={{ background: "#E3F1E8" }}
          >
            👥
          </span>
          <span className="flex-1 font-bold text-[13px]">Anggota</span>
          <span style={{ color: "var(--line)" }}>›</span>
        </Link>
        <Link
          href="/kategori"
          className="flex items-center gap-3 p-3.5 border-b"
          style={{ borderColor: "var(--line)" }}
        >
          <span
            className="w-8 h-8 rounded-lg grid place-items-center text-sm"
            style={{ background: "#F5EEDA" }}
          >
            🏷
          </span>
          <span className="flex-1 font-bold text-[13px]">
            Kategori pengeluaran
          </span>
          <span style={{ color: "var(--line)" }}>›</span>
        </Link>
      </div>

      {KELOMPOK.map((g) => (
        <div key={g.judul}>
          <div
            className="text-[10px] font-extrabold tracking-widest uppercase mb-2"
            style={{ color: "var(--muted)" }}
          >
            {g.judul}
          </div>
          <div
            className="rounded-2xl bg-white border mb-4"
            style={{ borderColor: "var(--line)" }}
          >
            {g.items.map((it, i) => {
              const terkunci = it.kunciTetap || (it.kunciSaldo && adaTransaksi);
              return (
                <div
                  key={it.k}
                  className="flex items-center justify-between gap-3 p-3.5"
                  style={{
                    borderBottom:
                      i < g.items.length - 1 ? "1px solid var(--line)" : "none",
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold">{it.label}</div>
                    {it.hint && (
                      <div
                        className="text-[10px] mt-0.5"
                        style={{ color: "var(--muted)" }}
                      >
                        {it.hint}
                      </div>
                    )}
                  </div>
                  {edit === it.k ? (
                    <div className="flex gap-1.5 flex-none">
                      <input
                        autoFocus
                        value={draf}
                        onChange={(e) => setDraf(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && simpan(it.k)}
                        className="w-28 p-1.5 rounded-lg border text-[12px] text-right"
                        style={{ borderColor: "var(--brand)" }}
                      />
                      <button
                        onClick={() => simpan(it.k)}
                        className="px-2 rounded-lg text-white text-[11px] font-bold"
                        style={{ background: "var(--brand)" }}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={terkunci}
                      onClick={() => {
                        setEdit(it.k);
                        setDraf(p[it.k] ?? "");
                      }}
                      className="text-[12px] font-bold text-right flex-none max-w-[52%] truncate disabled:opacity-60"
                      style={{
                        color: terkunci ? "var(--muted)" : "var(--brand)",
                      }}
                    >
                      {p[it.k] || "—"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          location.href = "/login";
        }}
        className="w-full p-3 rounded-xl border text-[13px] font-bold"
        style={{ borderColor: "var(--line)", color: "var(--brick)" }}
      >
        Keluar
      </button>

      <p
        className="text-[10.5px] text-center mt-3 leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        Semua angka & nama di sini bebas diubah.
        <br />
        Yang tidak ada di sini adalah rumus — dan itu memang bukan setelan.
      </p>
    </div>
  );
}

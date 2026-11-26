import { Rekap } from './rekap';
import { namaBulan } from './periode';
import { rupiah } from './uang';
import { ambilPengaturan } from './pengaturan';

// ═══════════════════════════════════════════════
// LAPORAN BULANAN — per bulan (masuk/keluar/saldo)
// ═══════════════════════════════════════════════
export async function unduhPDF(rekap: Rekap) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const peng = await ambilPengaturan();
  const namaDawis = peng['nama_dawis'] ?? 'Dasa Wisma';
  const alamat = peng['alamat'] ?? '';

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('LAPORAN KAS DASA WISMA', W / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text(namaDawis, W / 2, 25, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  if (alamat) doc.text(alamat, W / 2, 30, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(`Bulan: ${namaBulan(rekap.periode, true)}`, W / 2, 37, { align: 'center' });

  doc.setDrawColor(180); doc.line(15, 41, W - 15, 41);

  // saldo awal bulan ini = saldo akhir bulan lalu, dihitung mundur
  // dari saldoAkhir (kumulatif) — tanpa query tambahan
  const saldoAwal = rekap.saldoAkhir - rekap.totalMasuk + rekap.totalKeluar;

  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  let y = 49;
  doc.text(`Saldo Awal Bulan : ${rupiah(saldoAwal)}`, 15, y); y += 6;
  doc.text(`Total Pemasukan  : ${rupiah(rekap.totalMasuk)}`, 15, y); y += 6;
  // rincian hanya kalau ada pemasukan lain — bulan biasa tampil seperti dulu
  if (rekap.lain.length > 0) {
    doc.setFontSize(9);
    doc.text(`   - Iuran          : ${rupiah(rekap.totalIuran)}`, 15, y); y += 5;
    doc.text(`   - Pemasukan lain : ${rupiah(rekap.totalLain)}`, 15, y); y += 6;
    doc.setFontSize(10);
  }
  doc.text(`Total Pengeluaran: ${rupiah(rekap.totalKeluar)}`, 15, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Akhir      : ${rupiah(rekap.saldoAkhir)}`, 15, y); y += 4;

  const yJudulMasuk = y + 6;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('Rincian Iuran Masuk', 15, yJudulMasuk);

  autoTable(doc, {
    startY: yJudulMasuk + 2,
    head: [['No. Rumah', 'Nama KK', 'Tgl Bayar', 'Iuran']],
    body: rekap.masuk.length
      ? rekap.masuk.map(m => [m.noRumah, m.namaKK, m.tanggal, rupiah(m.nominal)])
      : [['—', 'Belum ada iuran', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: [31, 81, 56], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });

  // pemasukan lain — tabel sendiri, hanya kalau bulan ini ada isinya
  if (rekap.lain.length > 0) {
    const yLain = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Rincian Pemasukan Lain', 15, yLain - 2);
    autoTable(doc, {
      startY: yLain,
      head: [['Tanggal', 'Kategori', 'Keterangan', 'Jumlah']],
      body: rekap.lain.map(l => [l.tanggal, l.kategori, l.catatan ?? '-', rupiah(l.nominal)]),
      foot: [['', '', 'Subtotal', rupiah(rekap.totalLain)]],
      theme: 'grid',
      headStyles: { fillColor: [31, 81, 56], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [244, 248, 245], textColor: [18, 36, 27], fontSize: 8.5 },
      margin: { left: 15, right: 15 },
    });
  }

  const yKeluar = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('Rincian Pengeluaran', 15, yKeluar - 2);
  autoTable(doc, {
    startY: yKeluar,
    head: [['Tanggal', 'Kategori', 'Keterangan', 'Jumlah']],
    body: rekap.keluar.length
      ? rekap.keluar.map(k => [k.tanggal, k.kategori, k.catatan ?? '-', rupiah(k.nominal)])
      : [['—', 'Tak ada pengeluaran', '', '—']],
    theme: 'grid',
    headStyles: { fillColor: [31, 81, 56], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });

  const yEnd = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.text(`Dicetak dari aplikasi kas Dawis · ${new Date().toLocaleDateString('id-ID')}`, W / 2, yEnd, { align: 'center' });

  const namaFile = `Laporan_${namaDawis.replace(/\s+/g, '_')}_${rekap.periode}.pdf`;
  doc.save(namaFile);
}

// ═══════════════════════════════════════════════
// LAPORAN TAHUNAN — pakai susunLaporanTahunan (lib/kartu.ts)
// sebagai satu sumber data yang sama dgn preview layar.
// ═══════════════════════════════════════════════

const NAMA_BL_PENDEK = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// Font bawaan jsPDF (helvetica) hanya kenal huruf Latin dasar — '✓' tidak
// ada di dalamnya, jadi tercetak jadi ' . Centang diambil dari font bawaan
// ZapfDingbats: huruf '4' di font itu = ✔.
const CENTANG = '4';

function simbolStatus(s: string): string {
  if (s === 'lunas') return CENTANG;
  if (s === 'nunggak') return 'X';
  if (s === 'belum') return '';
  return '–';
}

function warnaStatus(s: string): [number, number, number] | null {
  if (s === 'lunas') return [227, 241, 232];
  if (s === 'nunggak') return [251, 236, 234];
  if (s === 'luar') return [244, 245, 243];
  return null;
}

export async function unduhLaporanTahunan(tahun: number) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const { susunLaporanTahunan } = await import('./kartu');

  const peng = await ambilPengaturan();
  const namaDawis = peng['nama_dawis'] ?? 'Dasa Wisma';
  const alamat = peng['alamat'] ?? '';

  const baris = await susunLaporanTahunan(tahun);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('LAPORAN TAHUNAN IURAN — SEMUA ANGGOTA', W / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text(namaDawis, W / 2, 21, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  if (alamat) doc.text(alamat, W / 2, 26, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(`Tahun ${tahun}`, W / 2, 32, { align: 'center' });

  // keterangan: centang (ZapfDingbats) + teks (helvetica), dirangkai di tengah
  doc.setFontSize(7.5);
  const ket = '  Lunas      X Nunggak      (kosong) Belum jatuh tempo      – Di luar masa keanggotaan';
  doc.setFont('zapfdingbats', 'normal');
  const lebarCentang = doc.getTextWidth(CENTANG);
  doc.setFont('helvetica', 'normal');
  const xKet = W / 2 - (lebarCentang + doc.getTextWidth(ket)) / 2;
  doc.setFont('zapfdingbats', 'normal');
  doc.text(CENTANG, xKet, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(ket, xKet + lebarCentang, 37);

  doc.setDrawColor(180); doc.line(10, 40, W - 10, 40);

  const head = ['No', 'Nama KK', ...NAMA_BL_PENDEK, 'Total Nunggak'];
  const body = baris.map(b => [
    b.noRumah, b.namaKK,
    ...b.sel.map(s => simbolStatus(s.status)),
    b.totalNunggak > 0 ? rupiah(b.totalNunggak) : '—',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [head],
    body,
    theme: 'grid',
    headStyles: { fillColor: [31, 81, 56], fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 38, halign: 'left' },
      14: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: 10, right: 10 },
    didParseCell: (d: any) => {
      if (d.section === 'body' && d.column.index >= 2 && d.column.index <= 13) {
        const status = baris[d.row.index]?.sel[d.column.index - 2]?.status;
        const warna = warnaStatus(status);
        if (warna) d.cell.styles.fillColor = warna;
        if (status === 'lunas') d.cell.styles.font = 'zapfdingbats';
      }
    },
  });

  const yEnd = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.text(`Dicetak dari aplikasi kas Dawis · ${new Date().toLocaleDateString('id-ID')}`, W / 2, yEnd, { align: 'center' });

  const namaFile = `Laporan_Tahunan_${namaDawis.replace(/\s+/g, '_')}_${tahun}.pdf`;
  doc.save(namaFile);
}
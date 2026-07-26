import { Rekap } from './rekap';
import { namaBulan } from './periode';
import { rupiah } from './uang';
import { ambilPengaturan } from './pengaturan';

export async function unduhPDF(rekap: Rekap) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const peng = await ambilPengaturan();
  const namaDawis = peng['nama_dawis'] ?? 'Dasa Wisma';
  const alamat = peng['alamat'] ?? '';

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // ── KOP ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('LAPORAN KAS DASA WISMA', W / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text(namaDawis, W / 2, 25, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  if (alamat) doc.text(alamat, W / 2, 30, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(`Bulan: ${namaBulan(rekap.periode, true)}`, W / 2, 37, { align: 'center' });

  doc.setDrawColor(180); doc.line(15, 41, W - 15, 41);

  // ── RINGKASAN ──
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  let y = 49;
  doc.text(`Total Pemasukan  : ${rupiah(rekap.totalMasuk)}`, 15, y); y += 6;
  doc.text(`Total Pengeluaran: ${rupiah(rekap.totalKeluar)}`, 15, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Akhir      : ${rupiah(rekap.saldoAkhir)}`, 15, y); y += 4;

  // ── TABEL IURAN MASUK ──
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

  // ── TABEL PENGELUARAN ──
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

  // ── FOOTER ──
  const yEnd = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.text(`Dicetak dari aplikasi kas Dawis · ${new Date().toLocaleDateString('id-ID')}`, W / 2, yEnd, { align: 'center' });

  // ── SIMPAN / SHARE ──
  const namaFile = `Laporan_${namaDawis.replace(/\s+/g, '_')}_${rekap.periode}.pdf`;
  doc.save(namaFile);
}